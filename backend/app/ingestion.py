from datetime import datetime, timezone
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, IPvAnyAddress, field_validator, model_validator
from fastapi import HTTPException
from sqlalchemy import text
from .models import Log

CASES = {"auth": "ssh-brute-force", "windows": "suspicious-powershell", "firewall": "port-scan"}


class NormalizedLog(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    id: str = Field(min_length=1, max_length=100, pattern=r"^[A-Za-z0-9_-]+$")
    timestamp: datetime
    source: Literal["auth", "windows", "firewall"]
    host: str = Field(min_length=1, max_length=200)
    ip: IPvAnyAddress
    action: Literal["failure", "success", "process", "configuration", "blocked", "allowed"]
    message: str = Field(min_length=1, max_length=5000)
    username: str | None = Field(default=None, max_length=200)
    processName: str | None = Field(default=None, max_length=300)
    commandLine: str | None = Field(default=None, max_length=5000)
    destinationIp: IPvAnyAddress | None = None
    destinationPort: int | None = Field(default=None, ge=1, le=65535)
    protocol: Literal["TCP", "UDP"] | None = None
    tcpFlags: Literal["SYN", "ACK", "SYN-ACK"] | None = None

    @field_validator("timestamp")
    @classmethod
    def timezone_required(cls, value):
        if value.tzinfo is None:
            raise ValueError("Timestamp must include timezone")
        return value.astimezone(timezone.utc)

    @model_validator(mode="after")
    def required_fields(self):
        if self.source == "auth" and (not self.username or self.action not in ("failure", "success")):
            raise ValueError("Auth requires username and failure/success action")
        if self.source == "windows" and (not self.processName or not self.commandLine or self.action not in ("process", "configuration")):
            raise ValueError("Windows requires processName, commandLine and process/configuration action")
        if self.source == "firewall" and (not self.destinationIp or not self.destinationPort or not self.protocol or self.action not in ("blocked", "allowed")):
            raise ValueError("Firewall requires destination IP, port, protocol and blocked/allowed action")
        return self


class IngestInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    logs: list[NormalizedLog] = Field(min_length=1, max_length=2000)


def ingest(session, rows):
    session.execute(text("BEGIN IMMEDIATE"))
    added = 0
    for row in rows:
        data = row.model_dump(mode="json", exclude_none=True)
        data.update(caseId=CASES[row.source], normalizedVersion=1)
        existing = session.get(Log, row.id)
        if existing:
            if existing.data != data:
                raise HTTPException(409, "Log ID already exists with different content: " + row.id)
        else:
            session.add(Log(id=row.id, case_id=data["caseId"], data=data))
            session.flush()
            added += 1
    session.commit()
    return {"received": len(rows), "inserted": added, "existing": len(rows) - added}
