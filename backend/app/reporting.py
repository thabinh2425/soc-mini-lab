"""Read-only report snapshots and Excel-friendly CSV exports."""
import csv
import io
import json
from datetime import datetime, timezone
from sqlalchemy import select, text
from .models import Alert, Case, Note, Timeline, Attempt, TrainingSession, Evidence, Log


def snapshot(session):
    # SQLite read transaction gives all report sections a consistent snapshot.
    session.execute(text("BEGIN"))
    attempt_rows = list(session.scalars(select(Attempt)))
    attempts = [{"caseId": r.case_id, **r.data} for r in attempt_rows]
    latest = {}
    for row in sorted(attempts, key=lambda row: row["completedAt"]):
        latest[row["caseId"]] = row
    notes = {n.case_id: n.text for n in session.scalars(select(Note))}
    cases = [{"id": c.id, "title": c.data.get("title", c.id), "note": notes.get(c.id, ""),
              "latestResult": latest.get(c.id)} for c in session.scalars(select(Case))]
    alerts = [{**a.data, "status": a.status} for a in session.scalars(select(Alert))]
    scores = [r["score"] for r in latest.values()]
    evidence = [{"alertId": r.alert_id, "logId": r.log_id} for r in session.scalars(select(Evidence))]
    log_ids = {r["logId"] for r in evidence} | {id for r in attempts for id in r.get("evidenceIds", [])}
    return dict(schemaVersion=1, label="SYNTHETIC DEMO DATA",
        generatedAt=datetime.now(timezone.utc).isoformat(),
        summary=dict(alerts=len(alerts), resolvedAlerts=sum(a["status"] == "resolved" for a in alerts),
                     completedMissions=len(scores), averageScore=round(sum(scores) / len(scores)) if scores else 0),
        cases=cases, alerts=alerts, attempts=attempts,
        trainingSessions=[r.data for r in session.scalars(select(TrainingSession))],
        timeline=[r.data for r in session.scalars(select(Timeline))], evidence=evidence,
        evidenceLogs=[r.data for r in session.scalars(select(Log)) if r.id in log_ids])


def safe_cell(value):
    value = str(value) if value is not None else ""
    # CSV text may contain analyst input; prevent spreadsheet formula evaluation.
    if value.lstrip().startswith(("=", "+", "-", "@")) or value.startswith(("\t", "\r", "\n")):
        return "'" + value
    return value


def render_report(data, format):
    if format == "json":
        return json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8"), "application/json"
    stream = io.StringIO(newline="")
    writer = csv.writer(stream)
    writer.writerow(["label", "generated_at", "case_id", "case_title", "latest_score", "completed_at", "note", "conclusion", "evidence_ids"])
    for case in data["cases"]:
        result = case["latestResult"] or {}
        writer.writerow([safe_cell(v) for v in [
            data["label"], data["generatedAt"], case["id"], case["title"], result.get("score"),
            result.get("completedAt"), case["note"], result.get("conclusion"),
            "; ".join(result.get("evidenceIds", []))]])
    return stream.getvalue().encode("utf-8-sig"), "text/csv"
