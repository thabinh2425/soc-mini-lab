import json
from pathlib import Path
from sqlalchemy.orm import Session
from .models import Case, Alert, Log, Timeline, Trend
from .database import make_engine, migrate

FIXTURES = json.loads(Path(__file__).with_name("fixtures.json").read_text(encoding="utf-8"))


def seed(session):
    for item in FIXTURES["trainingCases"]:
        if session.get(Case, item["id"]) is None:
            session.add(Case(id=item["id"], data=item))
    session.flush()
    for key, model in (("alerts", Alert), ("logs", Log), ("baseTimeline", Timeline)):
        for item in FIXTURES[key]:
            if session.get(model, item["id"]) is None:
                values = dict(id=item["id"], case_id=item["caseId"], data=item)
                if model is Alert:
                    values["status"] = item["status"]
                if model is Timeline:
                    values["source"] = item["source"]
                session.add(model(**values))
    for item in FIXTURES["weeklyAlertVolume"]:
        if session.get(Trend, item["day"]) is None:
            session.add(Trend(day=item["day"], data=item))
    session.commit()


if __name__ == "__main__":
    engine = make_engine()
    migrate(engine)
    with Session(engine) as session:
        seed(session)
    engine.dispose()
    print("Synthetic data seeded; existing progress preserved.")
