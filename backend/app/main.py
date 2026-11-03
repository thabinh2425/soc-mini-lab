from contextlib import asynccontextmanager
import os
from pathlib import Path
from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
from .reporting import snapshot, render_report
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import select, delete
from sqlalchemy.orm import Session
from .database import make_engine, migrate
from .models import Case, Alert, Log, Note, Timeline, Attempt, Trend, Evidence, DetectionRun, TrainingSession
from .training import router_for, latest_sessions, public_case
from .seed import seed
from .detection import RULES, run_detection
from .ingestion import IngestInput, NormalizedLog, ingest
from .detection_fixtures import demo_logs


class Payload(BaseModel):
    model_config = ConfigDict(extra="forbid")


class StatusInput(Payload):
    status: Literal["new", "investigating", "resolved"]


class NoteInput(Payload):
    text: str = Field(max_length=20000)


class TimelineInput(Payload):
    title: str = Field(min_length=1, max_length=200)
    detail: str = Field(min_length=1, max_length=5000)

    @field_validator("title", "detail")
    @classmethod
    def nonblank(cls, value):
        if not value.strip():
            raise ValueError("Text must not be blank")
        return value.strip()


class AttemptInput(Payload):
    answers: dict[str, str]


def required(session, model, key):
    record = session.get(model, key)
    if record is None:
        raise HTTPException(404, "Record not found")
    return record


def progress(session):
    results = {}
    for attempt in sorted(session.scalars(select(Attempt)), key=lambda a: a.data["completedAt"]):
        results[attempt.case_id] = attempt.data
    notes = {case.id: "" for case in session.scalars(select(Case))}
    notes.update({note.case_id: note.text for note in session.scalars(select(Note))})
    return {
        "alertStatuses": {a.id: a.status for a in session.scalars(select(Alert))},
        "notes": notes,
        "analystTimeline": [t.data for t in session.scalars(select(Timeline).where(Timeline.source == "analyst"))],
        "missionResults": results,
        "trainingSessions": latest_sessions(session),
    }


def create_app(database_url=None):
    engine = make_engine(database_url)
    @asynccontextmanager
    async def lifespan(app):
        migrate(engine)
        with Session(engine) as session:
            seed(session)
        yield
        engine.dispose()

    app = FastAPI(title="SOC Mini Lab API", version="1.0.0", lifespan=lifespan)
    app.include_router(router_for(engine))

    @app.get("/api/detection/rules")
    def rules():
        return RULES

    @app.get("/api/detection/runs")
    def runs():
        with Session(engine) as session:
            return sorted([r.data for r in session.scalars(select(DetectionRun))], key=lambda r: r["completedAt"], reverse=True)

    @app.post("/api/logs/ingest")
    def ingest_logs(body: IngestInput):
        with Session(engine) as session:
            return ingest(session, body.logs)

    @app.post("/api/detection/demo/{dataset}")
    def load_demo(dataset: Literal["attack", "benign"]):
        with Session(engine) as session:
            return ingest(session, [NormalizedLog.model_validate(row) for row in demo_logs(dataset)])

    @app.post("/api/detection/run")
    def detect():
        with Session(engine) as session:
            return run_detection(session)

    @app.get("/api/alerts/{alert_id}/evidence")
    def evidence(alert_id: str):
        with Session(engine) as session:
            alert = required(session, Alert, alert_id)
            rows = session.scalars(select(Log).join(Evidence, Evidence.log_id == Log.id).where(Evidence.alert_id == alert_id))
            return {"alert": {**alert.data, "status": alert.status},
                    "logs": sorted([r.data for r in rows], key=lambda e: e["timestamp"])}

    @app.get("/api/health")
    def health():
        with Session(engine) as session:
            session.execute(select(1))
        return {"status": "ok", "synthetic": True}

    @app.get("/api/bootstrap")
    def bootstrap():
        with Session(engine) as session:
            return {
                "alerts": [{**a.data, "status": a.status} for a in session.scalars(select(Alert))],
                "logs": [r.data for r in session.scalars(select(Log))],
                "trainingCases": [public_case(r.data) for r in session.scalars(select(Case))],
                "baseTimeline": [r.data for r in session.scalars(select(Timeline).where(Timeline.source == "system"))],
                "weeklyAlertVolume": [r.data for r in session.scalars(select(Trend))],
                "progress": progress(session),
            }

    @app.get("/api/alerts")
    def alerts():
        return bootstrap()["alerts"]

    @app.get("/api/logs")
    def logs():
        return bootstrap()["logs"]

    @app.get("/api/cases")
    def cases():
        return bootstrap()["trainingCases"]

    @app.get("/api/progress")
    def get_progress():
        with Session(engine) as session:
            return progress(session)

    @app.patch("/api/alerts/{alert_id}")
    def update_alert(alert_id: str, body: StatusInput):
        with Session(engine) as session:
            required(session, Alert, alert_id).status = body.status
            session.commit()
            return progress(session)

    @app.put("/api/cases/{case_id}/notes")
    def save_note(case_id: str, body: NoteInput):
        with Session(engine) as session:
            required(session, Case, case_id)
            session.merge(Note(case_id=case_id, text=body.text))
            session.commit()
            return progress(session)

    @app.get("/api/cases/{case_id}/timeline")
    def timeline(case_id: str):
        with Session(engine) as session:
            required(session, Case, case_id)
            return sorted([t.data for t in session.scalars(select(Timeline).where(Timeline.case_id == case_id))], key=lambda t: t["timestamp"])

    @app.post("/api/cases/{case_id}/timeline", status_code=201)
    def add_event(case_id: str, body: TimelineInput):
        with Session(engine) as session:
            required(session, Case, case_id)
            data = dict(id=str(uuid4()), caseId=case_id, source="analyst",
                        timestamp=datetime.now(timezone.utc).isoformat(), **body.model_dump())
            session.add(Timeline(id=data["id"], case_id=case_id, source="analyst", data=data))
            session.commit()
            return progress(session)

    @app.post("/api/cases/{case_id}/attempts", status_code=201)
    def submit(case_id: str, body: AttemptInput):
        with Session(engine) as session:
            questions = required(session, Case, case_id).data["questions"]
            if set(body.answers) != {q["id"] for q in questions} or any(body.answers[q["id"]] not in q["options"] for q in questions):
                raise HTTPException(422, "Answer every question with a valid option")
            score = round(100 * sum(body.answers[q["id"]] == q["correctOption"] for q in questions) / len(questions))
            data = dict(answers=body.answers, score=score, completedAt=datetime.now(timezone.utc).isoformat())
            session.add(Attempt(id=str(uuid4()), case_id=case_id, data=data))
            session.commit()
            return progress(session)

    @app.get("/api/cases/{case_id}/attempts")
    def attempts(case_id: str):
        with Session(engine) as session:
            required(session, Case, case_id)
            return [r.data for r in session.scalars(select(Attempt).where(Attempt.case_id == case_id))]

    @app.get("/api/reports")
    def reports():
        with Session(engine) as session:
            state = progress(session)
            scores = [r["score"] for r in state["missionResults"].values()]
            return dict(resolvedAlerts=sum(v == "resolved" for v in state["alertStatuses"].values()),
                        completedMissions=len(scores), averageScore=round(sum(scores)/len(scores)) if scores else 0,
                        analystEvents=len(state["analystTimeline"]), casesWithNotes=sum(bool(n) for n in state["notes"].values()))

    @app.get("/api/reports/export")
    def export_report(format: Literal["json", "csv"] = "json"):
        with Session(engine) as session:
            data = snapshot(session)
        content, media_type = render_report(data, format)
        return Response(content, media_type=media_type, headers={
            "Content-Disposition": f'attachment; filename="soc-mini-lab-report.{format}"',
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
        })

    @app.delete("/api/progress")
    def reset():
        with Session(engine) as session:
            for model in (TrainingSession, Note, Attempt):
                session.execute(delete(model))
            session.execute(delete(Timeline).where(Timeline.source == "analyst"))
            for alert in session.scalars(select(Alert)):
                alert.status = alert.data["status"]
            session.commit()
            return progress(session)

    if os.getenv("SOC_SERVE_FRONTEND") == "1":
        dist = Path(__file__).resolve().parents[2] / "dist"
        if not (dist / "index.html").is_file():
            raise RuntimeError("Missing dist/index.html. Run npm.cmd run build first.")
        app.mount("/", StaticFiles(directory=dist, html=True), name="frontend")
    return app


app = create_app()
