from concurrent.futures import ThreadPoolExecutor
from fastapi.testclient import TestClient
from app.main import create_app
from app.seed import FIXTURES
from app.training import RUBRICS


def answers(case_id):
    case = next(c for c in FIXTURES["trainingCases"] if c["id"] == case_id)
    return {q["id"]: q["correctOption"] for q in case["questions"]}


def test_all_cases_resume_grade_and_history(tmp_path):
    url = "sqlite:///" + (tmp_path / "training.db").as_posix()
    ids = {}
    with TestClient(create_app(url)) as client:
        for case_id in RUBRICS:
            s = client.post(f"/api/training/cases/{case_id}/sessions").json()
            ids[case_id] = s["id"]
            partial = dict(list(answers(case_id).items())[:1])
            r = client.put("/api/training/sessions/" + s["id"], json=dict(revision=0, answers=partial, evidenceIds=[], conclusion="Đang điều tra"))
            assert r.status_code == 200
            assert r.json()["revision"] == 1
    with TestClient(create_app(url)) as client:
        for case_id, id in ids.items():
            s = client.post(f"/api/training/cases/{case_id}/sessions").json()
            assert s["id"] == id and len(s["answers"]) == 1
            client.put(f"/api/cases/{case_id}/notes", json={"text": "Ghi chú điều tra"})
            client.post(f"/api/cases/{case_id}/timeline", json={"title": "Phân tích", "detail": "Bằng chứng đã xác nhận"})
            draft = dict(revision=1, answers=answers(case_id), evidenceIds=RUBRICS[case_id]["evidence"], conclusion="Đã phân tích bằng chứng và đề xuất hành động phù hợp.")
            saved = client.put("/api/training/sessions/" + id, json=draft)
            assert saved.status_code == 200
            result = client.post(f"/api/training/sessions/{id}/submit", json={"revision": 2}).json()
            assert result["result"]["score"] == 100
            assert len(result["result"]["objectives"]) == 6
            assert result["result"]["investigation"]["note"] == "Ghi chú điều tra"
            assert client.post(f"/api/training/sessions/{id}/submit", json={"revision": 2}).json() == result
            assert len(client.get(f"/api/cases/{case_id}/attempts").json()) == 1
            client.put(f"/api/cases/{case_id}/notes", json={"text": "Thay đổi sau khi nộp"})
            assert client.get("/api/training/sessions/" + id).json()["result"]["investigation"]["note"] == "Ghi chú điều tra"
            fresh = client.post(f"/api/training/cases/{case_id}/sessions").json()
            assert fresh["id"] != id and fresh["answers"] == {}
        assert len(client.get("/api/training/sessions").json()) == 6
        assert client.get("/api/reports").json()["averageScore"] == 100
    with TestClient(create_app(url)) as client:
        assert len(client.get("/api/training/sessions").json()) == 6
        assert len(client.get("/api/progress").json()["missionResults"]) == 3
        client.delete("/api/progress")
        assert client.get("/api/training/sessions").json() == []
        assert client.get("/api/progress").json()["trainingSessions"] == {}


def test_validation_conflicts_and_no_client_score(tmp_path):
    with TestClient(create_app("sqlite:///" + (tmp_path / "training.db").as_posix())) as client:
        s = client.post("/api/training/cases/ssh-brute-force/sessions").json()
        path = "/api/training/sessions/" + s["id"]
        assert client.post(path + "/submit", json={"revision": 0}).status_code == 422
        assert client.put(path, json={"revision": 0, "answers": {"unknown": "bad"}}).status_code == 422
        assert client.put(path, json={"revision": 0, "evidenceIds": ["LOG-8201"]}).status_code == 422
        assert client.put(path, json={"revision": 0, "evidenceIds": ["LOG-8101", "LOG-8101"]}).status_code == 422
        assert client.put(path, json={"revision": 0, "score": 100}).status_code == 422
        assert client.put(path, json={"revision": 0, "answers": answers("ssh-brute-force")}).status_code == 200
        assert client.put(path, json={"revision": 0}).status_code == 409
        assert client.post(path + "/submit", json={"revision": 0}).status_code == 409
        result = client.post(path + "/submit", json={"revision": 1}).json()
        assert result["result"]["score"] == 60
        assert client.put(path, json={"revision": 1}).status_code == 409
        assert client.get("/api/training/sessions/missing").status_code == 404
        public = client.get("/api/cases").json()
        assert all("correctOption" not in q and "rationale" not in q for c in public for q in c["questions"])


def test_concurrent_start_and_submit_are_idempotent(tmp_path):
    with TestClient(create_app("sqlite:///" + (tmp_path / "training.db").as_posix())) as client:
        with ThreadPoolExecutor(max_workers=2) as pool:
            starts = list(pool.map(lambda _: client.post("/api/training/cases/port-scan/sessions").json(), range(2)))
        assert starts[0]["id"] == starts[1]["id"]
        path = "/api/training/sessions/" + starts[0]["id"]
        client.put(path, json={"revision": 0, "answers": answers("port-scan")})
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: client.post(path + "/submit", json={"revision": 1}).json(), range(2)))
        assert results[0] == results[1]
        assert len(client.get("/api/cases/port-scan/attempts").json()) == 1


def test_evidence_penalty_and_migration_preserve_legacy_result(tmp_path):
    from alembic import command
    from alembic.config import Config
    from sqlalchemy import text
    from sqlalchemy.orm import Session
    from app.database import make_engine, ROOT
    from app.models import Case, Attempt
    url = "sqlite:///" + (tmp_path / "legacy.db").as_posix()
    engine = make_engine(url)
    config = Config()
    config.set_main_option("script_location", str(ROOT / "migrations"))
    with engine.begin() as connection:
        config.attributes["connection"] = connection
        command.upgrade(config, "002")
    with Session(engine) as session:
        session.add(Case(id="ssh-brute-force", data=FIXTURES["trainingCases"][0]))
        session.flush()
        session.add(Attempt(id="legacy", case_id="ssh-brute-force", data={
            "score": 67, "answers": {}, "completedAt": "2026-10-30T00:00:00Z"}))
        session.commit()
    engine.dispose()
    with TestClient(create_app(url)) as client:
        progress = client.get("/api/progress").json()
        assert progress["missionResults"]["ssh-brute-force"]["score"] == 67
        assert progress["trainingSessions"] == {}
        s = client.post("/api/training/cases/ssh-brute-force/sessions").json()
        path = "/api/training/sessions/" + s["id"]
        client.put(path, json={"revision": 0, "answers": answers("ssh-brute-force"),
                              "evidenceIds": ["LOG-8101", "LOG-8102", "LOG-8103"]})
        result = client.post(path + "/submit", json={"revision": 1}).json()["result"]
        assert next(o for o in result["objectives"] if o["id"] == "evidence")["earned"] == 17
        assert result["score"] == 77
        assert len(client.get("/api/cases/ssh-brute-force/attempts").json()) == 2
