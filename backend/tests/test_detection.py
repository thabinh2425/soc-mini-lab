from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from app.main import create_app
from app.detection import evaluate
from app.detection_fixtures import demo_logs
from app.ingestion import NormalizedLog
from app.database import make_engine
from sqlalchemy import text


def test_rules_positive_negative_and_boundaries():
    assert len(evaluate(demo_logs("attack"))) == 3
    assert evaluate(demo_logs("benign")) == []
    ssh = demo_logs("attack")[:5]
    assert len(evaluate(ssh)) == 1
    assert evaluate(ssh[:4]) == []
    ssh[-1]["timestamp"] = "2026-10-30T03:05:00+00:00"
    assert len(evaluate(ssh)) == 1
    ssh[-1]["timestamp"] = "2026-10-30T03:05:01+00:00"
    assert evaluate(ssh) == []
    ssh[-1]["timestamp"] = "2026-10-30T10:05:00+07:00"
    assert len(evaluate(ssh)) == 1
    ssh[-1]["host"] = "other-host"
    assert evaluate(ssh) == []
    ps = demo_logs("attack")[6]
    for command in ("pwsh -enc AAA", "powershell -WindowStyle Hidden", "Set-MpPreference -ExclusionPath C:/Temp"):
        ps["commandLine"] = command
        assert len(evaluate([ps])) == 1
    ps["processName"] = "notepad.exe"
    assert evaluate([ps]) == []
    scan = demo_logs("attack")[7:12]
    assert len(evaluate(scan)) == 1
    assert evaluate(scan[:4]) == []
    for i, event in enumerate(scan):
        event["destinationIp"] = "10.0.0.1"
        event["destinationPort"] = 100 + i
    assert len(evaluate(scan)) == 1
    for event in scan:
        event["destinationPort"] = 443
    assert evaluate(scan) == []


def test_separate_episodes_and_deterministic_order():
    first = demo_logs("attack")[:6]
    second = deepcopy(first)
    for row in second:
        row["id"] += "-later"
        row["timestamp"] = (datetime.fromisoformat(row["timestamp"]) + timedelta(hours=1)).isoformat()
    expected = evaluate(first + second)
    assert len(expected) == 2
    assert [f["id"] for f in evaluate(list(reversed(first + second)))] == [f["id"] for f in expected]


def test_api_ingest_detection_restart_and_concurrency(tmp_path):
    url = "sqlite:///" + (tmp_path / "lab.db").as_posix()
    with TestClient(create_app(url)) as client:
        assert client.post("/api/detection/demo/benign").json()["inserted"] == 9
        assert client.post("/api/detection/run").json()["created"] == 0
        assert client.post("/api/detection/demo/attack").json()["inserted"] == 13
        assert client.post("/api/detection/demo/attack").json()["inserted"] == 0
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: client.post("/api/detection/run").json(), range(2)))
        assert sorted(r["created"] for r in results) == [0, 3]
        result = client.post("/api/detection/run").json()
        assert result["created"] == 0 and result["existing"] == 3
        assert result["scanned"] == 22 and result["skipped"] == 8
        for alert_id in result["alertIds"]:
            evidence = client.get("/api/alerts/" + alert_id + "/evidence").json()
            assert evidence["logs"]
            assert evidence["alert"]["ruleVersion"] == 1
            assert all(e["normalizedVersion"] == 1 for e in evidence["logs"])
        alert_id = result["alertIds"][0]
        client.patch("/api/alerts/" + alert_id, json={"status": "resolved"})
    with TestClient(create_app(url)) as client:
        assert client.post("/api/detection/run").json()["created"] == 0
        assert client.get("/api/progress").json()["alertStatuses"][alert_id] == "resolved"
        assert len(client.get("/api/alerts").json()) == 8
        assert len(client.get("/api/detection/runs").json()) == 5
        assert client.get("/api/alerts/missing/evidence").status_code == 404


def test_ingestion_validates_and_rolls_back_conflicts(tmp_path):
    with TestClient(create_app("sqlite:///" + (tmp_path / "lab.db").as_posix())) as client:
        row = demo_logs("attack")[0]
        assert client.post("/api/logs/ingest", json={"logs": [row]}).status_code == 200
        altered = dict(row, message="different")
        new_row = dict(row, id="FRESH")
        assert client.post("/api/logs/ingest", json={"logs": [new_row, altered]}).status_code == 409
        assert not any(e["id"] == "FRESH" for e in client.get("/api/logs").json())
        for invalid in (dict(row, timestamp="2026-10-30T03:00:00"), dict(row, ip="bad-ip"), dict(row, username=None)):
            assert client.post("/api/logs/ingest", json={"logs": [invalid]}).status_code == 422
        firewall = demo_logs("attack")[-1]
        assert client.post("/api/logs/ingest", json={"logs": [dict(firewall, destinationPort=65536)]}).status_code == 422
        assert client.post("/api/logs/ingest", json={"logs": []}).status_code == 422


def test_migration_preserves_milestone2_database(tmp_path):
    # Build revision 001 explicitly, insert saved progress, then upgrade through app startup.
    from alembic.config import Config
    from alembic import command
    from app.database import ROOT
    url = "sqlite:///" + (tmp_path / "old.db").as_posix()
    engine = make_engine(url)
    cfg = Config()
    cfg.set_main_option("script_location", str(ROOT / "migrations"))
    with engine.begin() as conn:
        cfg.attributes["connection"] = conn
        command.upgrade(cfg, "001")
        conn.execute(text("INSERT INTO cases(id,data) VALUES ('ssh-brute-force', '{}')"))
        conn.execute(text("INSERT INTO notes(case_id,text) VALUES ('ssh-brute-force','saved before migration')"))
    engine.dispose()
    with TestClient(create_app(url)) as client:
        assert client.get("/api/progress").json()["notes"]["ssh-brute-force"] == "saved before migration"
        assert client.get("/api/detection/runs").json() == []
