from copy import deepcopy
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.database import ROOT, make_engine
from app.main import create_app
from app.models import Attempt, Case, Note, TrainingSession
from app.seed import FIXTURES


def test_upgrade_translates_generated_feedback_and_preserves_analyst_work(tmp_path):
    url = "sqlite:///" + (tmp_path / "language.db").as_posix()
    engine = make_engine(url)
    config = Config()
    config.set_main_option("script_location", str(ROOT / "migrations"))
    with engine.begin() as connection:
        config.attributes["connection"] = connection
        command.upgrade(config, "003")
    result = dict(score=75, completedAt="2026-11-01T00:00:00Z", answers={},
        conclusion="Ghi kết luận điều tra", evidenceIds=["LOG-8101"],
        investigation={"note": "Chọn bằng chứng cốt lõi", "timeline": [{"title": "Đã kiểm tra", "detail": "Giữ nguyên tiếng Việt"}]},
        objectives=[
            dict(id="evidence", title="Chọn bằng chứng cốt lõi", earned=25, possible=25,
                 feedback="Liên kết lần SSH thất bại với đăng nhập root thành công từ cùng nguồn. Log tham chiếu: LOG-8101, LOG-8103"),
            dict(id="documentation", title="Ghi chú và timeline điều tra", earned=10, possible=10,
                 feedback="5 điểm cho ghi chú đã lưu, 5 điểm cho ít nhất một timeline analyst trong Incident Investigation."),
            dict(id="conclusion", title="Ghi kết luận điều tra", earned=5, possible=5,
                 feedback="5 điểm khi kết luận có ít nhất 20 ký tự. Chỉ đánh giá mức độ hoàn thành, không tự đánh giá ngữ nghĩa."),
        ])
    completed = dict(id="old-session", caseId="ssh-brute-force", status="completed", revision=3,
        startedAt="2026-11-01T00:00:00Z", savedAt="2026-11-01T00:00:00Z",
        answers={}, evidenceIds=["LOG-8101"], conclusion=result["conclusion"], result=deepcopy(result))
    draft = {**completed, "id": "draft", "status": "in_progress", "result": None}
    with Session(engine) as session:
        session.add(Case(id="ssh-brute-force", data=FIXTURES["trainingCases"][0]))
        session.flush()
        session.add_all([
            Note(case_id="ssh-brute-force", text="Ghi chú của tôi"),
            Attempt(id="old-attempt", case_id="ssh-brute-force", data=result),
            TrainingSession(id="old-session", case_id="ssh-brute-force", data=completed),
            TrainingSession(id="draft", case_id="ssh-brute-force", data=draft),
        ])
        session.commit()
    engine.dispose()
    expected = deepcopy(result)
    expected["objectives"][0].update(title="Select core evidence", feedback="Correlate failed SSH attempts with a successful root login from the same source. Reference logs: LOG-8101, LOG-8103")
    expected["objectives"][1].update(title="Investigation notes and timeline", feedback="5 points for saved notes and 5 points for at least one analyst timeline event in Incident Investigation.")
    expected["objectives"][2].update(title="Write an investigation conclusion", feedback="5 points for a conclusion of at least 20 characters. This checks completion only, not semantic accuracy.")
    # Check both upgrade and a second startup; no recalculation or duplicate history.
    for _ in range(2):
        with TestClient(create_app(url)) as client:
            assert client.get("/api/cases/ssh-brute-force/attempts").json() == [expected]
            assert client.get("/api/training/sessions/old-session").json() == {**completed, "result": expected}
            assert client.get("/api/training/sessions/draft").json() == draft
            assert client.get("/api/progress").json()["notes"]["ssh-brute-force"] == "Ghi chú của tôi"
            report = client.get("/api/reports/export").json()
            assert report["attempts"] == [{"caseId": "ssh-brute-force", **expected}]
