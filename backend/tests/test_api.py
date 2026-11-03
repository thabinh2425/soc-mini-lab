from fastapi.testclient import TestClient
from app.main import create_app
from app.seed import FIXTURES


def test_complete_flow_survives_restart(tmp_path):
    url = "sqlite:///" + (tmp_path / "lab.db").as_posix()
    with TestClient(create_app(url)) as client:
        data = client.get("/api/bootstrap").json()
        assert len(data["alerts"]) == 5
        assert len(data["logs"]) == 8
        assert len(data["trainingCases"]) == 3
        assert client.patch("/api/alerts/ALT-2401", json={"status": "resolved"}).status_code == 200
        assert client.put("/api/cases/ssh-brute-force/notes", json={"text": "Điều tra đã xác nhận"}).status_code == 200
        assert client.post("/api/cases/ssh-brute-force/timeline", json={"title": "Contained", "detail": "Isolated host"}).status_code == 201
        for mission in FIXTURES["trainingCases"]:
            answers = {q["id"]: q["correctOption"] for q in mission["questions"]}
            result = client.post("/api/cases/" + mission["id"] + "/attempts", json={"answers": answers})
            assert result.status_code == 201
            assert result.json()["missionResults"][mission["id"]]["score"] == 100
    # New app, engine, sessions, migration and seed against the same disk file.
    with TestClient(create_app(url)) as client:
        state = client.get("/api/progress").json()
        assert state["alertStatuses"]["ALT-2401"] == "resolved"
        assert state["notes"]["ssh-brute-force"] == "Điều tra đã xác nhận"
        assert len(state["analystTimeline"]) == 1
        assert len(state["missionResults"]) == 3
        assert len(client.get("/api/cases/ssh-brute-force/timeline").json()) == 3
        assert len(client.get("/api/cases/ssh-brute-force/attempts").json()) == 1
        assert client.get("/api/reports").json()["averageScore"] == 100
        assert len(client.get("/api/alerts").json()) == 5
        reset = client.delete("/api/progress").json()
        assert reset["alertStatuses"]["ALT-2401"] == "new"
        assert reset["missionResults"] == {}
        assert reset["analystTimeline"] == []
        assert len(client.get("/api/logs").json()) == 8
    with TestClient(create_app(url)) as client:
        assert client.get("/api/progress").json()["missionResults"] == {}


def test_invalid_requests_do_not_mutate(tmp_path):
    with TestClient(create_app("sqlite:///" + (tmp_path / "lab.db").as_posix())) as client:
        before = client.get("/api/progress").json()
        assert client.patch("/api/alerts/ALT-2401", json={"status": "invalid"}).status_code == 422
        assert client.patch("/api/alerts/missing", json={"status": "resolved"}).status_code == 404
        assert client.put("/api/cases/missing/notes", json={"text": "x"}).status_code == 404
        assert client.post("/api/cases/port-scan/timeline", json={"title": " ", "detail": "x"}).status_code == 422
        assert client.post("/api/cases/port-scan/attempts", json={"answers": {}}).status_code == 422
        assert client.post("/api/cases/port-scan/attempts", json={"answers": {}, "score": 100}).status_code == 422
        assert client.get("/api/progress").json() == before


def test_partial_grade_and_attempt_history(tmp_path):
    with TestClient(create_app("sqlite:///" + (tmp_path / "lab.db").as_posix())) as client:
        mission = FIXTURES["trainingCases"][0]
        answers = {q["id"]: q["correctOption"] for q in mission["questions"]}
        q = mission["questions"][0]
        answers[q["id"]] = next(o for o in q["options"] if o != q["correctOption"])
        path = "/api/cases/" + mission["id"] + "/attempts"
        assert client.post(path, json={"answers": answers}).json()["missionResults"][mission["id"]]["score"] == 67
        client.post(path, json={"answers": answers})
        assert len(client.get(path).json()) == 2
