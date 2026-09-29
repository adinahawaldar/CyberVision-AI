#!/usr/bin/env python3
import argparse
import hashlib
import json
import math
import re
import sys
from datetime import datetime, timezone

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


SEVERITY = {
    "info": 0,
    "warning": 1,
    "danger": 2,
    "critical": 3,
}

EVENT_TYPES = [
    "authentication",
    "network",
    "process_execution",
    "privilege_escalation",
    "data_transfer",
    "registry",
    "file_access",
    "malware",
    "system",
]

TEXT_FLAGS = {
    "failed_auth": r"failed password|authentication failure|logon failure|invalid user|4625",
    "successful_auth": r"accepted password|successful logon|session opened|4624",
    "script_execution": r"powershell|cmd\.exe|/bin/bash|/bin/sh|invoke-webrequest|wscript|cscript",
    "download_tool": r"wget|curl|bitsadmin|certutil|download",
    "privilege": r"sudo|root|administrator|privilege|run as admin",
    "transfer": r"exfiltrat|upload|scp|sftp|ftp|archive|zip|tar\s+-czf",
    "registry": r"registry|hkey|runonce|winlogon",
    "malware": r"malware|trojan|ransomware|payload|beacon",
}


def parse_time(value):
    if not value:
        return None
    text = str(value).strip()
    try:
        if text.endswith("Z"):
            text = text[:-1] + "+00:00"
        parsed = datetime.fromisoformat(text)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except ValueError:
        return None


def stable_bucket(value, buckets=17):
    if not value:
        return 0
    digest = hashlib.sha256(str(value).encode("utf-8", errors="ignore")).digest()
    return int.from_bytes(digest[:2], "big") % buckets


def text_blob(event):
    return f"{event.get('detail', '')} {event.get('raw', '')} {event.get('process', '')}".lower()


def feature_vector(event, first_time):
    timestamp = parse_time(event.get("timestamp"))
    if timestamp:
        hour = timestamp.hour + timestamp.minute / 60
        hour_sin = math.sin(2 * math.pi * hour / 24)
        hour_cos = math.cos(2 * math.pi * hour / 24)
        day_sin = math.sin(2 * math.pi * timestamp.weekday() / 7)
        day_cos = math.cos(2 * math.pi * timestamp.weekday() / 7)
        offset_minutes = ((timestamp - first_time).total_seconds() / 60) if first_time else 0
    else:
        hour_sin = hour_cos = day_sin = day_cos = 0
        offset_minutes = 0

    event_type = str(event.get("eventType") or "system").lower()
    event_type_features = [1 if event_type == name else 0 for name in EVENT_TYPES]

    text = text_blob(event)
    text_features = [1 if re.search(pattern, text, re.I) else 0 for pattern in TEXT_FLAGS.values()]

    return [
        hour_sin,
        hour_cos,
        day_sin,
        day_cos,
        math.log1p(max(0, offset_minutes)),
        float(event.get("riskScore") or 0) / 100,
        float(SEVERITY.get(str(event.get("severity") or "info").lower(), 0)) / 3,
        float(event.get("threatIntel", {}).get("score") or 0) / 100,
        1 if event.get("user") else 0,
        1 if event.get("sourceIp") else 0,
        1 if event.get("destinationIp") else 0,
        1 if event.get("mitreAttack", {}).get("techniqueId") else 0,
        stable_bucket(event.get("source")) / 16,
        stable_bucket(event.get("host")) / 16,
        *event_type_features,
        *text_features,
    ]


def reason_for(event):
    reasons = []
    text = text_blob(event)
    if event.get("riskScore", 0) >= 60:
        reasons.append(f"High rule risk score {event.get('riskScore')}")
    if event.get("threatIntel", {}).get("score", 0) >= 50:
        reasons.append(f"Threat-intel score {event.get('threatIntel', {}).get('score')}")
    if re.search(TEXT_FLAGS["script_execution"], text, re.I):
        reasons.append("Script or shell execution signal")
    if re.search(TEXT_FLAGS["download_tool"], text, re.I):
        reasons.append("Downloader or network transfer tool")
    if re.search(TEXT_FLAGS["privilege"], text, re.I):
        reasons.append("Privilege-sensitive activity")
    if re.search(TEXT_FLAGS["failed_auth"], text, re.I):
        reasons.append("Authentication failure pattern")
    if event.get("mitreAttack", {}).get("techniqueId"):
        reasons.append(f"Mapped to MITRE {event.get('mitreAttack', {}).get('techniqueId')}")
    return reasons[:4] or ["Unusual feature combination compared with surrounding events"]


def normalize_scores(raw_scores):
    raw = np.asarray(raw_scores, dtype=float)
    if raw.size == 0:
        return []
    span = float(raw.max() - raw.min())
    if span == 0:
        return [50 for _ in raw]
    return [round(float((value - raw.min()) / span) * 100, 2) for value in raw]


def detect(events, contamination):
    parsed_times = [parse_time(event.get("timestamp")) for event in events]
    valid_times = [value for value in parsed_times if value is not None]
    first_time = min(valid_times) if valid_times else None

    if len(events) < 4:
        enriched = []
        for index, event in enumerate(events):
            enriched.append({
                "index": index,
                "isAnomaly": False,
                "score": 0,
                "confidence": 0,
                "reasons": ["Insufficient events for Isolation Forest baseline"],
            })
        return enriched, {
            "model": "IsolationForest",
            "status": "insufficient-data",
            "totalEvents": len(events),
            "anomaliesDetected": 0,
            "contamination": contamination,
        }

    matrix = np.asarray([feature_vector(event, first_time) for event in events], dtype=float)
    matrix = StandardScaler().fit_transform(matrix)

    model = IsolationForest(
        n_estimators=150,
        contamination=contamination,
        random_state=42,
    )
    predictions = model.fit_predict(matrix)
    raw_scores = -model.decision_function(matrix)
    normalized_scores = normalize_scores(raw_scores)

    enriched = []
    for index, event in enumerate(events):
        score = normalized_scores[index]
        is_anomaly = bool(predictions[index] == -1 or score >= 75)
        confidence = round(score if is_anomaly else max(0, 100 - score), 2)
        enriched.append({
            "index": index,
            "isAnomaly": is_anomaly,
            "score": score,
            "confidence": confidence,
            "reasons": reason_for(event) if is_anomaly else [],
        })

    return enriched, {
        "model": "IsolationForest",
        "status": "completed",
        "totalEvents": len(events),
        "anomaliesDetected": sum(1 for item in enriched if item["isAnomaly"]),
        "contamination": contamination,
    }


def main():
    parser = argparse.ArgumentParser(description="Detect forensic event anomalies with Isolation Forest.")
    parser.add_argument("events_json")
    parser.add_argument("--contamination", type=float, default=0.15)
    args = parser.parse_args()

    try:
        with open(args.events_json, "r", encoding="utf-8-sig") as handle:
            payload = json.load(handle)
        events = payload.get("events", payload if isinstance(payload, list) else [])
        contamination = min(0.35, max(0.02, args.contamination))
        anomalies, summary = detect(events, contamination)
        print(json.dumps({
            "summary": summary,
            "results": anomalies,
        }, ensure_ascii=True))
    except Exception as exc:
        print(json.dumps({"error": str(exc), "model": "IsolationForest"}), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
