from sqlalchemy import JSON, ForeignKey, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Case(Base):
    __tablename__ = "cases"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    data: Mapped[dict] = mapped_column(JSON)


class Alert(Base):
    __tablename__ = "alerts"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"))
    status: Mapped[str] = mapped_column(String)
    data: Mapped[dict] = mapped_column(JSON)


class Log(Base):
    __tablename__ = "logs"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"))
    data: Mapped[dict] = mapped_column(JSON)


class Note(Base):
    __tablename__ = "notes"
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), primary_key=True)
    text: Mapped[str] = mapped_column(Text)


class Timeline(Base):
    __tablename__ = "timeline"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"))
    source: Mapped[str] = mapped_column(String)
    data: Mapped[dict] = mapped_column(JSON)


class Attempt(Base):
    __tablename__ = "attempts"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"))
    data: Mapped[dict] = mapped_column(JSON)


class Trend(Base):
    __tablename__ = "trends"
    day: Mapped[str] = mapped_column(String, primary_key=True)
    data: Mapped[dict] = mapped_column(JSON)


class Evidence(Base):
    __tablename__ = "alert_evidence"
    alert_id: Mapped[str] = mapped_column(ForeignKey("alerts.id"), primary_key=True)
    log_id: Mapped[str] = mapped_column(ForeignKey("logs.id"), primary_key=True)


class DetectionRun(Base):
    __tablename__ = "detection_runs"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    data: Mapped[dict] = mapped_column(JSON)


class TrainingSession(Base):
    __tablename__ = "training_sessions"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), index=True)
    data: Mapped[dict] = mapped_column(JSON)
