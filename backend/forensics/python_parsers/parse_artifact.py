#!/usr/bin/env python3
import argparse
import ipaddress
import json
import re
import struct
import subprocess
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path


PCAP_MAGICS = {
    b"\xd4\xc3\xb2\xa1": ("<", 1_000_000),
    b"\xa1\xb2\xc3\xd4": (">", 1_000_000),
    b"\x4d\x3c\xb2\xa1": ("<", 1_000_000_000),
    b"\xa1\xb2\x3c\x4d": (">", 1_000_000_000),
}

PCAPNG_MAGIC = b"\x0a\x0d\x0d\x0a"

PROTO_NAMES = {
    1: "ICMP",
    6: "TCP",
    17: "UDP",
    47: "GRE",
    50: "ESP",
    51: "AH",
    58: "ICMPv6",
}


def iso_ts(seconds, fraction, divisor):
    try:
      value = seconds + (fraction / divisor)
      return datetime.fromtimestamp(value, timezone.utc).isoformat().replace("+00:00", "Z")
    except (OverflowError, OSError, ValueError):
      return ""


def ip4(raw):
    return ".".join(str(part) for part in raw)


def ip6(raw):
    return str(ipaddress.ip_address(raw))


def tcp_flags(byte_value):
    flags = []
    for bit, name in [
        (0x01, "FIN"),
        (0x02, "SYN"),
        (0x04, "RST"),
        (0x08, "PSH"),
        (0x10, "ACK"),
        (0x20, "URG"),
        (0x40, "ECE"),
        (0x80, "CWR"),
    ]:
        if byte_value & bit:
            flags.append(name)
    return ",".join(flags)


def parse_l4(protocol, payload):
    if protocol == 6 and len(payload) >= 14:
        src_port, dst_port = struct.unpack("!HH", payload[:4])
        return {
            "sourcePort": src_port,
            "destinationPort": dst_port,
            "tcpFlags": tcp_flags(payload[13]),
        }
    if protocol == 17 and len(payload) >= 8:
        src_port, dst_port, length = struct.unpack("!HHH", payload[:6])
        return {
            "sourcePort": src_port,
            "destinationPort": dst_port,
            "udpLength": length,
        }
    return {}


def parse_ipv4(data):
    if len(data) < 20:
        return None
    version = data[0] >> 4
    ihl = (data[0] & 0x0F) * 4
    if version != 4 or ihl < 20 or len(data) < ihl:
        return None

    total_length = struct.unpack("!H", data[2:4])[0]
    protocol = data[9]
    source_ip = ip4(data[12:16])
    destination_ip = ip4(data[16:20])
    payload = data[ihl:total_length] if total_length >= ihl else data[ihl:]

    parsed = {
        "networkLayer": "IPv4",
        "protocol": PROTO_NAMES.get(protocol, str(protocol)),
        "protocolNumber": protocol,
        "sourceIp": source_ip,
        "destinationIp": destination_ip,
        "ipTotalLength": total_length,
        "ttl": data[8],
    }
    parsed.update(parse_l4(protocol, payload))
    return parsed


def parse_ipv6(data):
    if len(data) < 40:
        return None
    version = data[0] >> 4
    if version != 6:
        return None

    payload_length = struct.unpack("!H", data[4:6])[0]
    next_header = data[6]
    source_ip = ip6(data[8:24])
    destination_ip = ip6(data[24:40])
    payload = data[40:40 + payload_length] if payload_length else data[40:]

    parsed = {
        "networkLayer": "IPv6",
        "protocol": PROTO_NAMES.get(next_header, str(next_header)),
        "protocolNumber": next_header,
        "sourceIp": source_ip,
        "destinationIp": destination_ip,
        "ipTotalLength": payload_length + 40,
        "hopLimit": data[7],
    }
    parsed.update(parse_l4(next_header, payload))
    return parsed


def parse_link_frame(link_type, data):
    if link_type in (101, 228):
        if data and data[0] >> 4 == 4:
            parsed = parse_ipv4(data)
        elif data and data[0] >> 4 == 6:
            parsed = parse_ipv6(data)
        else:
            parsed = {"protocol": "RAW_IP", "detail": "Unparsed raw IP frame"}
        return parsed or {"protocol": "RAW_IP", "detail": "Unparsed raw IP frame"}

    if link_type == 1:
        if len(data) < 14:
            return {"protocol": "ETHERNET", "detail": "Short Ethernet frame"}
        eth_type = struct.unpack("!H", data[12:14])[0]
        offset = 14
        if eth_type in (0x8100, 0x88A8) and len(data) >= 18:
            eth_type = struct.unpack("!H", data[16:18])[0]
            offset = 18
        if eth_type == 0x0800:
            parsed = parse_ipv4(data[offset:])
        elif eth_type == 0x86DD:
            parsed = parse_ipv6(data[offset:])
        elif eth_type == 0x0806:
            parsed = {"protocol": "ARP", "networkLayer": "ARP"}
        else:
            parsed = {"protocol": f"EtherType 0x{eth_type:04x}", "networkLayer": "Ethernet"}
        return parsed or {"protocol": "ETHERNET", "detail": "Unparsed Ethernet frame"}

    if link_type == 113:
        if len(data) < 16:
            return {"protocol": "LINUX_SLL", "detail": "Short Linux cooked frame"}
        protocol = struct.unpack("!H", data[14:16])[0]
        if protocol == 0x0800:
            parsed = parse_ipv4(data[16:])
        elif protocol == 0x86DD:
            parsed = parse_ipv6(data[16:])
        else:
            parsed = {"protocol": f"Linux cooked 0x{protocol:04x}", "networkLayer": "Linux cooked"}
        return parsed or {"protocol": "LINUX_SLL", "detail": "Unparsed Linux cooked frame"}

    return {"protocol": f"LINKTYPE_{link_type}", "detail": "Unsupported link type; packet metadata only"}


def packet_detail(record):
    proto = record.get("protocol", "UNKNOWN")
    src = record.get("sourceIp", "")
    dst = record.get("destinationIp", "")
    sport = record.get("sourcePort")
    dport = record.get("destinationPort")
    left = f"{src}:{sport}" if sport is not None else src
    right = f"{dst}:{dport}" if dport is not None else dst
    if src and dst:
        return f"{proto} {left} -> {right} ({record.get('capturedLength', 0)} captured bytes)"
    return f"{proto} packet ({record.get('capturedLength', 0)} captured bytes)"


def parse_pcap(file_path, limit):
    with open(file_path, "rb") as handle:
        magic = handle.read(4)
        if magic == PCAPNG_MAGIC:
            raise ValueError("PCAPNG is not supported by this parser yet; provide classic .pcap files.")
        if magic not in PCAP_MAGICS:
            raise ValueError("File does not have a classic PCAP magic header.")

        endian, divisor = PCAP_MAGICS[magic]
        header_rest = handle.read(20)
        if len(header_rest) != 20:
            raise ValueError("PCAP global header is incomplete.")

        version_major, version_minor, _thiszone, _sigfigs, snaplen, link_type = struct.unpack(
            endian + "HHIIII",
            header_rest,
        )

        records = []
        packet_number = 0
        while len(records) < limit:
            packet_header = handle.read(16)
            if not packet_header:
                break
            if len(packet_header) != 16:
                records.append({
                    "packetNumber": packet_number + 1,
                    "detail": "Truncated packet header encountered",
                    "protocol": "TRUNCATED",
                })
                break

            packet_number += 1
            ts_sec, ts_frac, captured_length, original_length = struct.unpack(endian + "IIII", packet_header)
            packet_data = handle.read(captured_length)
            frame = parse_link_frame(link_type, packet_data)

            record = {
                "timestamp": iso_ts(ts_sec, ts_frac, divisor),
                "packetNumber": packet_number,
                "capturedLength": captured_length,
                "originalLength": original_length,
                "linkType": link_type,
                **frame,
            }
            record["detail"] = frame.get("detail") or packet_detail(record)
            record["raw"] = json.dumps(record, sort_keys=True)
            records.append(record)

    return {
        "artifactType": "pcap",
        "parser": "python-pcap-parser",
        "records": records,
        "lineCount": len(records),
        "summary": (
            f"Parsed {len(records)} packet(s) from PCAP "
            f"(link type {link_type}, version {version_major}.{version_minor}, snaplen {snaplen})"
        ),
        "metadata": {
            "pcapVersion": f"{version_major}.{version_minor}",
            "snaplen": snaplen,
            "linkType": link_type,
            "packetLimit": limit,
        },
    }


def strip_namespace(tag):
    return tag.split("}", 1)[-1] if "}" in tag else tag


def child_text(parent, name):
    for child in list(parent):
        if strip_namespace(child.tag) == name:
            return (child.text or "").strip()
    return ""


def find_child(parent, name):
    for child in list(parent):
        if strip_namespace(child.tag) == name:
            return child
    return None


def collect_event_data(event_root):
    values = {}
    for section_name in ("EventData", "UserData"):
        section = find_child(event_root, section_name)
        if section is None:
            continue
        for idx, node in enumerate(section.iter()):
            if node is section:
                continue
            tag = strip_namespace(node.tag)
            text = (node.text or "").strip()
            if not text:
                continue
            key = node.attrib.get("Name") or node.attrib.get("name") or tag
            if key == "Data":
                key = f"Data{idx}"
            if key in values:
                key = f"{key}_{idx}"
            values[key] = text
    return values


def evtx_xml_to_record(xml_text, index, parser_name):
    root = ET.fromstring(xml_text)
    system = find_child(root, "System")
    if system is None:
        return {
            "eventRecordNumber": index,
            "detail": "EVTX record without System node",
            "rawXml": xml_text[:5000],
            "parser": parser_name,
        }

    provider = find_child(system, "Provider")
    time_created = find_child(system, "TimeCreated")
    event_id = child_text(system, "EventID")
    level = child_text(system, "Level")
    computer = child_text(system, "Computer")
    channel = child_text(system, "Channel")
    record_id = child_text(system, "EventRecordID") or str(index)
    event_data = collect_event_data(root)

    user = (
        event_data.get("TargetUserName")
        or event_data.get("SubjectUserName")
        or event_data.get("AccountName")
        or event_data.get("UserName")
        or event_data.get("Data0")
        or ""
    )
    source_ip = (
        event_data.get("IpAddress")
        or event_data.get("SourceAddress")
        or event_data.get("ClientAddress")
        or ""
    )

    important_data = ", ".join(
        f"{key}={value}" for key, value in list(event_data.items())[:8]
    )
    provider_name = provider.attrib.get("Name", "") if provider is not None else ""
    detail = f"Windows Event {event_id or 'unknown'} from {provider_name or 'unknown provider'}"
    if important_data:
        detail = f"{detail}; {important_data}"

    return {
        "timestamp": time_created.attrib.get("SystemTime", "") if time_created is not None else "",
        "eventRecordNumber": record_id,
        "eventId": event_id,
        "provider": provider_name,
        "channel": channel,
        "level": level,
        "host": computer,
        "user": user,
        "sourceIp": source_ip if source_ip != "-" else "",
        "eventData": event_data,
        "detail": detail,
        "rawXml": xml_text[:5000],
        "parser": parser_name,
    }


def parse_evtx_with_python_evtx(file_path, limit):
    from Evtx.Evtx import Evtx

    records = []
    with Evtx(str(file_path)) as log:
        for index, record in enumerate(log.records(), start=1):
            if len(records) >= limit:
                break
            records.append(evtx_xml_to_record(record.xml(), index, "python-evtx-parser"))
    return records, "python-evtx-parser"


def parse_evtx_with_wevtutil(file_path, limit):
    command = [
        "wevtutil",
        "qe",
        str(file_path),
        "/lf:true",
        "/f:xml",
        f"/c:{limit}",
    ]
    completed = subprocess.run(
        command,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=120,
        check=False,
    )
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr.strip() or completed.stdout.strip() or "wevtutil failed")

    xml_output = re.sub(r"<\?xml[^>]*\?>", "", completed.stdout).strip()
    if not xml_output:
        return [], "windows-wevtutil-evtx-parser"

    wrapped = f"<Events>{xml_output}</Events>"
    root = ET.fromstring(wrapped)
    records = []
    for index, event in enumerate(list(root), start=1):
        if len(records) >= limit:
            break
        records.append(evtx_xml_to_record(ET.tostring(event, encoding="unicode"), index, "windows-wevtutil-evtx-parser"))
    return records, "windows-wevtutil-evtx-parser"


def parse_evtx(file_path, limit):
    warnings = []
    try:
        records, parser = parse_evtx_with_python_evtx(file_path, limit)
    except Exception as exc:
        warnings.append(f"python-evtx unavailable or failed ({exc}); using Windows wevtutil fallback.")
        records, parser = parse_evtx_with_wevtutil(file_path, limit)

    return {
        "artifactType": "evtx",
        "parser": parser,
        "records": records,
        "lineCount": len(records),
        "summary": f"Parsed {len(records)} Windows EVTX event(s)",
        "warnings": warnings,
        "metadata": {
            "recordLimit": limit,
        },
    }


def parse_artifact(file_path, original_name, limit):
    suffix = Path(original_name or file_path).suffix.lower()
    if suffix == ".pcap":
        return parse_pcap(file_path, limit)
    if suffix == ".evtx":
        return parse_evtx(file_path, limit)
    raise ValueError(f"Unsupported Python parser file type: {suffix}")


def main():
    parser = argparse.ArgumentParser(description="Parse forensic artifacts into JSON.")
    parser.add_argument("file_path")
    parser.add_argument("--original-name", default="")
    parser.add_argument("--limit", type=int, default=5000)
    args = parser.parse_args()

    try:
        result = parse_artifact(Path(args.file_path), args.original_name, max(1, args.limit))
        print(json.dumps(result, ensure_ascii=True))
    except Exception as exc:
        print(json.dumps({"error": str(exc), "parser": "python-artifact-parser"}), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
