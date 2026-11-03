"""Pure rule evaluation plus transactional persistence. No commands are executed."""
import hashlib
import json
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4
from sqlalchemy import select, text
from .models import Alert, Log, Timeline, Evidence, DetectionRun

RULES = json.loads(Path(__file__).with_name("rules.json").read_text(encoding="utf-8"))


def instant(event):
    return datetime.fromisoformat(event["timestamp"].replace("Z", "+00:00")).timestamp()


def windows(events, seconds, qualifies):
    """Merge overlapping qualifying sliding windows into one evidence episode."""
    events = sorted(events, key=lambda e: (instant(e), e["id"]))
    episodes = []
    left = 0
    for right in range(len(events)):
        while instant(events[right]) - instant(events[left]) > seconds:
            left += 1
        if qualifies(events[left:right + 1]):
            if episodes and left <= episodes[-1][1]:
                episodes[-1][1] = right
            else:
                episodes.append([left, right])
    return [events[start:end + 1] for start, end in episodes]


def evaluate(events):
    findings = []
    ssh, ps, scan = RULES
    def add(rule, group, evidence, reason):
        identity = json.dumps([rule["id"], rule["version"], group, evidence[0]["id"]])
        alert_id = "DET-" + hashlib.sha256(identity.encode()).hexdigest()[:16]
        findings.append(dict(id=alert_id, rule=rule, evidence=evidence, reason=reason))

    groups = defaultdict(list)
    for e in events:
        if e["source"] == "auth" and e["action"] == "failure":
            groups[(e["ip"], e["host"])].append(e)
    for key, group in groups.items():
        for evidence in windows(group, ssh["windowSeconds"], lambda rows: len(rows) >= ssh["threshold"]):
            add(ssh, key, evidence, "At least 5 failed SSH logins within 300 seconds from one source to one host.")

    for e in sorted(events, key=lambda e: (instant(e), e["id"])):
        if e["source"] != "windows":
            continue
        command = e.get("commandLine", "")
        process = e.get("processName", "").replace("\\", "/").split("/")[-1].lower()
        if process not in ("powershell.exe", "pwsh.exe", "powershell", "pwsh"):
            continue
        indicators = []
        if re.search(r"(?i)(?:^|\s)-(?:enc|encodedcommand)\b", command):
            indicators.append("encoded command")
        if re.search(r"(?i)(?:^|\s)-(?:w|windowstyle)\s+hidden\b", command):
            indicators.append("hidden window")
        if re.search(r"(?i)\b(?:set|add)-mppreference\b", command) and re.search(r"(?i)-exclusion(?:path|process|extension)\b", command):
            indicators.append("Defender exclusion change")
        if indicators:
            add(ps, e["host"], [e], "Indicators: " + ", ".join(indicators))

    groups = defaultdict(list)
    for e in events:
        if e["source"] == "firewall" and e.get("protocol") == "TCP" and e.get("tcpFlags") == "SYN":
            groups[e["ip"]].append(e)
    def is_scan(rows):
        ports = defaultdict(set)
        for row in rows:
            ports[row["destinationIp"]].add(row["destinationPort"])
        return len(ports) >= scan["threshold"] or any(len(p) >= scan["threshold"] for p in ports.values())
    for key, group in groups.items():
        for evidence in windows(group, scan["windowSeconds"], is_scan):
            add(scan, key, evidence, "At least 5 destination hosts or 5 ports on one host within 60 seconds.")
    return findings


def run_detection(session):
    # Serialize concurrent writers before reading to ensure idempotence.
    session.execute(text("BEGIN IMMEDIATE"))
    all_logs = list(session.scalars(select(Log)))
    events = [row.data for row in all_logs if row.data.get("normalizedVersion") == 1]
    findings = evaluate(events)
    created = 0
    for finding in findings:
        rule, evidence = finding["rule"], finding["evidence"]
        first, last = evidence[0], evidence[-1]
        alert = session.get(Alert, finding["id"])
        if alert is None:
            data = dict(id=finding["id"], title=rule["title"], severity=rule["severity"],
                        source=first["ip"], destination=first["host"], timestamp=last["timestamp"],
                        status="new", caseId=rule["caseId"], technique=rule["technique"],
                        summary=finding["reason"], origin="detection", ruleId=rule["id"],
                        ruleVersion=rule["version"], ruleDescription=rule["description"])
            alert = Alert(id=data["id"], case_id=rule["caseId"], status="new", data=data)
            session.add(alert)
            session.flush()
            session.add(Timeline(id="TL-" + alert.id, case_id=rule["caseId"], source="system",
                data=dict(id="TL-" + alert.id, caseId=rule["caseId"], timestamp=last["timestamp"],
                          title=rule["title"], detail=finding["reason"] + " [" + alert.id + "]", source="system")))
            created += 1
        for event in evidence:
            if session.get(Evidence, (alert.id, event["id"])) is None:
                session.add(Evidence(alert_id=alert.id, log_id=event["id"]))
    result = dict(id=str(uuid4()), completedAt=datetime.now(timezone.utc).isoformat(),
                  scanned=len(events), skipped=len(all_logs) - len(events),
                  matched=len(findings), created=created, existing=len(findings) - created,
                  alertIds=[f["id"] for f in findings])
    session.add(DetectionRun(id=result["id"], data=result))
    session.commit()
    return result
