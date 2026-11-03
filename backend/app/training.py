from datetime import datetime, timezone
from uuid import uuid4
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select, text
from sqlalchemy.orm import Session
from .models import Case, Log, Note, Timeline, Alert, Attempt, TrainingSession

RUBRICS = {
    "ssh-brute-force": {"evidence": ["LOG-8101", "LOG-8103"], "explanation": "Correlate failed SSH attempts with a successful root login from the same source."},
    "suspicious-powershell": {"evidence": ["LOG-8201", "LOG-8202"], "explanation": "Correlate the encoded PowerShell command with the Defender exclusion change."},
    "port-scan": {"evidence": ["LOG-8301", "LOG-8302", "LOG-8303"], "explanation": "Compare destination IPs and ports from the same source to identify horizontal scanning and allowed services."},
}


class Draft(BaseModel):
    model_config = ConfigDict(extra="forbid")
    revision: int = Field(ge=0)
    answers: dict[str, str] = Field(default_factory=dict, max_length=20)
    evidenceIds: list[str] = Field(default_factory=list, max_length=100)
    conclusion: str = Field(default="", max_length=5000)


class Submit(BaseModel):
    model_config = ConfigDict(extra="forbid")
    revision: int = Field(ge=0)


def now():
    return datetime.now(timezone.utc).isoformat()


def get_record(session, model, id):
    record = session.get(model, id)
    if record is None:
        raise HTTPException(404, "Record not found")
    return record


def latest_sessions(session):
    latest = {}
    for row in sorted(session.scalars(select(TrainingSession)), key=lambda row: row.data["startedAt"]):
        latest[row.case_id] = row.data
    return latest


def public_case(data):
    return {**data, "questions": [{k: v for k, v in q.items() if k not in ("correctOption", "rationale")} for q in data["questions"]]}


def validate_draft(session, record, body):
    questions = {q["id"]: q for q in get_record(session, Case, record.case_id).data["questions"]}
    if any(key not in questions or value not in questions[key]["options"] for key, value in body.answers.items()):
        raise HTTPException(422, "Invalid answers for this case")
    if len(set(body.evidenceIds)) != len(body.evidenceIds):
        raise HTTPException(422, "Duplicate evidence selections are not allowed")
    for id in body.evidenceIds:
        log = session.get(Log, id)
        if log is None or log.case_id != record.case_id:
            raise HTTPException(422, "Evidence must belong to the current case")


def grade(session, record):
    data = record.data
    case = get_record(session, Case, record.case_id)
    objectives = []
    for q in case.data["questions"]:
        correct = data["answers"][q["id"]] == q["correctOption"]
        objectives.append(dict(id=q["id"], title=q["prompt"], earned=20 if correct else 0, possible=20,
                               feedback=q["rationale"], correctOption=q["correctOption"]))
    expected, selected = set(RUBRICS[record.case_id]["evidence"]), set(data["evidenceIds"])
    evidence_points = round(25 * len(expected & selected) / len(expected | selected))
    objectives.append(dict(id="evidence", title="Select core evidence", earned=evidence_points, possible=25,
        feedback=RUBRICS[record.case_id]["explanation"] + " Reference logs: " + ", ".join(sorted(expected))))
    note = session.get(Note, record.case_id)
    timeline = [t.data for t in session.scalars(select(Timeline).where(Timeline.case_id == record.case_id, Timeline.source == "analyst"))]
    documented = (5 if note and note.text.strip() else 0) + (5 if timeline else 0)
    objectives.append(dict(id="documentation", title="Investigation notes and timeline", earned=documented, possible=10,
        feedback="5 points for saved notes and 5 points for at least one analyst timeline event in Incident Investigation."))
    conclusion_points = 5 if len(data["conclusion"].strip()) >= 20 else 0
    objectives.append(dict(id="conclusion", title="Write an investigation conclusion", earned=conclusion_points, possible=5,
        feedback="5 points for a conclusion of at least 20 characters. This checks completion only, not semantic accuracy."))
    return dict(answers=data["answers"], score=sum(o["earned"] for o in objectives), completedAt=now(),
                sessionId=record.id, rubricVersion=1, objectives=objectives, evidenceIds=data["evidenceIds"],
                conclusion=data["conclusion"],
                investigation=dict(note=note.text if note else "", timeline=timeline,
                    alertStatuses={a.id: a.status for a in session.scalars(select(Alert).where(Alert.case_id == record.case_id))}))


def router_for(engine):
    router = APIRouter(prefix="/api/training", tags=["training"])

    @router.get("/sessions")
    def history():
        with Session(engine) as session:
            return sorted([r.data for r in session.scalars(select(TrainingSession))], key=lambda r: r["startedAt"], reverse=True)

    @router.post("/cases/{case_id}/sessions")
    def start(case_id: str):
        with Session(engine) as session:
            session.execute(text("BEGIN IMMEDIATE"))
            get_record(session, Case, case_id)
            if case_id not in RUBRICS:
                raise HTTPException(422, "No scoring rubric is available for this case")
            latest = latest_sessions(session).get(case_id)
            if latest and latest["status"] == "in_progress":
                return latest
            id = str(uuid4())
            data = dict(id=id, caseId=case_id, status="in_progress", revision=0,
                        startedAt=now(), savedAt=now(), answers={}, evidenceIds=[], conclusion="", result=None)
            session.add(TrainingSession(id=id, case_id=case_id, data=data))
            session.commit()
            return data

    @router.get("/sessions/{id}")
    def read(id: str):
        with Session(engine) as session:
            return get_record(session, TrainingSession, id).data

    @router.put("/sessions/{id}")
    def save(id: str, body: Draft):
        with Session(engine) as session:
            session.execute(text("BEGIN IMMEDIATE"))
            record = get_record(session, TrainingSession, id)
            if record.data["status"] != "in_progress" or body.revision != record.data["revision"]:
                raise HTTPException(409, "The session has changed or has been submitted. Reload it before editing.")
            validate_draft(session, record, body)
            record.data = {**record.data, **body.model_dump(exclude={"revision"}),
                           "revision": record.data["revision"] + 1, "savedAt": now()}
            session.commit()
            return record.data

    @router.post("/sessions/{id}/submit")
    def submit(id: str, body: Submit):
        with Session(engine) as session:
            session.execute(text("BEGIN IMMEDIATE"))
            record = get_record(session, TrainingSession, id)
            if record.data["status"] == "completed":
                return record.data
            if body.revision != record.data["revision"]:
                raise HTTPException(409, "The session has changed. Reload it before submitting.")
            questions = get_record(session, Case, record.case_id).data["questions"]
            if set(record.data["answers"]) != {q["id"] for q in questions}:
                raise HTTPException(422, "Answer every question before submitting.")
            result = grade(session, record)
            record.data = {**record.data, "status": "completed", "result": result, "savedAt": result["completedAt"]}
            session.add(Attempt(id=record.id, case_id=record.case_id, data=result))
            session.commit()
            return record.data

    return router
