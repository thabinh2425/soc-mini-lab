"""Deterministic synthetic fixtures; never executes commands or sends traffic."""
from datetime import datetime, timedelta, timezone


def demo_logs(dataset):
    base = datetime(2026, 10, 30, 3, tzinfo=timezone.utc)
    rows = []
    def event(id, seconds, source, host, ip, action, **extra):
        return dict(id=id, timestamp=(base + timedelta(seconds=seconds)).isoformat(),
                    source=source, host=host, ip=ip, action=action,
                    message="SYNTHETIC DEMO DATA: " + id, **extra)
    if dataset == "attack":
        for i in range(6):
            rows.append(event("M3-SSH-" + str(i), i * 20, "auth", "web-prod-01", "203.0.113.42", "failure", username="root"))
        rows.append(event("M3-PS-1", 180, "windows", "win-fin-07", "10.20.4.18", "process",
                          processName="powershell.exe", commandLine="powershell.exe -NoP -W Hidden -EncodedCommand SQBFAFgA"))
        for i in range(6):
            rows.append(event("M3-SCAN-" + str(i), 240 + i * 5, "firewall", "fw-dmz-01", "198.51.100.77", "blocked",
                              destinationIp="10.10.2." + str(10 + i), destinationPort=22, protocol="TCP", tcpFlags="SYN"))
    else:
        for i in range(4):
            rows.append(event("M3-NORMAL-SSH-" + str(i), i * 120, "auth", "web-test", "192.0.2.10", "failure", username="analyst"))
            rows.append(event("M3-NORMAL-NET-" + str(i), i * 120, "firewall", "fw-test", "192.0.2.20", "allowed",
                              destinationIp="10.10.3." + str(i + 1), destinationPort=443, protocol="TCP", tcpFlags="SYN"))
        rows.append(event("M3-NORMAL-PS", 180, "windows", "win-test", "192.0.2.30", "process",
                          processName="powershell.exe", commandLine="powershell.exe -NoProfile Get-Date"))
    return rows
