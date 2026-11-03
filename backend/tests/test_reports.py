import csv
import io
import json
from fastapi.testclient import TestClient
from app.main import create_app


def test_exports_unicode_latest_progress_and_csv_formula_safety(tmp_path):
    with TestClient(create_app("sqlite:///" + (tmp_path / "reports.db").as_posix())) as client:
        note = '=HYPERLINK("example","Tiếng Việt")\nDòng thứ hai'
        client.put("/api/cases/ssh-brute-force/notes", json={"text": note})
        client.patch("/api/alerts/ALT-2401", json={"status": "resolved"})
        before = client.get("/api/progress").json()
        response = client.get("/api/reports/export")
        assert response.status_code == 200
        assert 'attachment;' in response.headers["content-disposition"]
        assert response.headers["cache-control"] == "no-store"
        data = response.json()
        assert data["label"] == "SYNTHETIC DEMO DATA"
        assert data["summary"]["resolvedAlerts"] == 1
        assert data["cases"][0]["note"] == note
        assert data["trainingSessions"] == []
        csv_response = client.get("/api/reports/export?format=csv")
        assert csv_response.content.startswith(b"\xef\xbb\xbf")
        rows = list(csv.DictReader(io.StringIO(csv_response.content.decode("utf-8-sig"))))
        assert len(rows) == 3
        assert rows[0]["note"] == "'" + note
        assert client.get("/api/reports/export?format=html").status_code == 422
        assert client.get("/api/progress").json() == before


def test_export_includes_training_snapshot_and_detection_evidence(tmp_path):
    with TestClient(create_app("sqlite:///" + (tmp_path / "reports.db").as_posix())) as client:
        client.post("/api/detection/demo/attack")
        client.post("/api/detection/run")
        started = client.post("/api/training/cases/ssh-brute-force/sessions").json()
        session_path = "/api/training/sessions/" + started["id"]
        client.put(session_path, json={"revision": 0, "answers": {
            "ssh-q1": "203.0.113.42", "ssh-q2": "A privileged login succeeded",
            "ssh-q3": "Block the source and rotate credentials"}, "evidenceIds": ["LOG-8101", "LOG-8103"]})
        client.post(session_path + "/submit", json={"revision": 1})
        report = client.get("/api/reports/export").json()
        assert report["summary"]["completedMissions"] == 1
        assert report["trainingSessions"][0]["status"] == "completed"
        assert report["attempts"][0]["caseId"] == "ssh-brute-force"
        assert len(report["evidence"]) == 13
        assert {"LOG-8101", "LOG-8103"} <= {row["id"] for row in report["evidenceLogs"]}
        assert report["attempts"][0]["investigation"]["note"] == ""


def test_csv_cells():
    from app.reporting import safe_cell
    for value in ("=1+1", "  +2", "-3", "@SUM(A1)", "\tdata", "\rdata", "\ndata"):
        assert safe_cell(value).startswith("'")
    assert safe_cell('Tiếng Việt, "ghi chú"') == 'Tiếng Việt, "ghi chú"'
