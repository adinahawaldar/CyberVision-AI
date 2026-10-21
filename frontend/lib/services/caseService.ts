"use client";

import { useState, useEffect } from "react";

export interface VideoAnalysisResult {
  duration_seconds?: number;
  resolution?: string;
  fps?: number;
  sampled_frames?: number;
  total_frames?: number;
  counts?: Record<string, number>;
  detected_classes?: string[];
  confidence_by_class?: Record<string, number>;
  average_confidence?: number;
  summary?: string;
  movement_detected?: boolean;
  timeline_events?: Array<{
    time: string;
    class: string;
    confidence: number;
    description: string;
  }>;
  detection_analysis?: {
    detected_objects?: string;
    object_count?: string;
    person_detection?: string;
    vehicle_detection?: string;
    movement_direction?: string;
    restricted_zone?: string;
    boundary_crossing?: string;
    confidence?: string;
  };
  key_evidence_1_image?: string;
  key_evidence_2_image?: string;
  key_evidence_frames?: Array<{
    id: string;
    time: string;
    description: string;
    confidence: number;
    image?: string;
  }>;
}

export interface AttachedFile {
  name: string;
  type: "cctv_footage" | "document" | "log" | "image";
  size?: string;
  sha256?: string;
  snippet?: string;
  timestamp?: string;
  videoAnalysis?: VideoAnalysisResult;
}

export interface CaseItem {
  id: string;
  name: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "INVESTIGATING" | "EVIDENCE_COLLECTED" | "AI_PARSED" | "CLOSED";
  cctvFeed?: string;
  attachedFiles?: AttachedFile[];
  evidenceCount: number;
  lead: string;
  location?: string;
  lastUpdated: string;
  sha256?: string;
  notes?: string[];
  generatedReportId?: string;
  generatedSummary?: any;
}

// Single high-level showcase case for Faculty & AI Assistant
export const DEFAULT_CASES: CaseItem[] = [
  {
    id: "CAS-2026-001",
    name: "Unauthorized Perimeter Breach & Physical Data Ingress",
    severity: "CRITICAL",
    status: "INVESTIGATING",
    cctvFeed: "CAM-01 [North Gate Pan/Tilt/Zoom 4K]",
    location: "North Gate - Sector 4 (Restricted Perimeter & Data Ingress)",
    evidenceCount: 3,
    lead: "Dr. Adina Hawaldar (Lead Forensic Investigator)",
    lastUpdated: "Just now",
    sha256: "8f4b238a9e0132b498dc21e0a81190bc2081f9a12c8e034177b0d87a41e9a9e0",
    generatedReportId: "REP-2026-001",
    notes: [
      "Subject detected scaling outer fence boundary into restricted Sector 4 at 13:42:10 UTC.",
      "Deep optical neural model (YOLOv8x) verified 1 person (98.4%), 1 backpack (94.2%), and 1 dark sedan vehicle (96.1%).",
      "Physical line tamper severed primary RTSP transmission; autonomous cellular failover engaged and SHA-256 evidence vault sealed."
    ],
    attachedFiles: [
      {
        name: "cctv_perimeter_breach_cam01.mp4",
        type: "cctv_footage",
        size: "48.2 MB",
        sha256: "8f4b238a9e0132b498dc21e0a81190bc2081f9a12c8e034177b0d87a41e9a9e0",
        videoAnalysis: {
          duration_seconds: 45.2,
          resolution: "1920x1080 (1080p Full HD)",
          fps: 30,
          sampled_frames: 135,
          total_frames: 1356,
          counts: { person: 1, backpack: 1, car: 1 },
          detected_classes: ["person", "backpack", "car"],
          confidence_by_class: { person: 98.4, backpack: 94.2, car: 96.1 },
          average_confidence: 96.2,
          summary: "Footage confirms an individual arriving in a dark vehicle, climbing over the perimeter fence with a backpack into restricted Sector 4, and tampering with access equipment before departing.",
          movement_detected: true,
          timeline_events: [
            { time: "00:04", class: "car", confidence: 96.1, description: "Unidentified dark sedan stops near North Gate exterior perimeter buffer." },
            { time: "00:11", class: "person", confidence: 98.4, description: "Subject exits vehicle and scales outer boundary fence into Sector 4." },
            { time: "00:26", class: "backpack", confidence: 94.2, description: "Carried payload identified; suspect approaches secondary access terminal." },
            { time: "00:41", class: "person", confidence: 97.8, description: "Suspect departs towards eastern blind spot after tampering with junction box." }
          ],
          detection_analysis: {
            detected_objects: "1 Person, 1 Backpack, 1 Car",
            object_count: "3 targets verified",
            person_detection: "Unauthorized individual scaled perimeter fence into Sector 4",
            vehicle_detection: "Dark sedan stopped outside North Gate perimeter buffer",
            movement_direction: "Moved from North perimeter fence toward Terminal SEC-04",
            restricted_zone: "Violation: Sector 4 Restricted Zone entered",
            boundary_crossing: "Perimeter fence breached at 13:42 UTC",
            confidence: "High (AI Verified)"
          }
        }
      },
      {
        name: "access_controller_audit.log",
        type: "log",
        size: "2.4 MB",
        sha256: "3c7e91d112fa6b21789c0211a87754b2190823c10aefb231145109b8214ed112",
        snippet: "[13:42:15 UTC] WARN: Door Controller SEC-04 tamper switch tripped. [13:42:38 UTC] ALERT: 14 invalid RFID credential attempts from Terminal-B."
      },
      {
        name: "perimeter_sensor_telemetry.pcap",
        type: "document",
        size: "14.8 MB",
        sha256: "e2098b56cc99120a441b802a98f12cb8192a014e7f82b0912cb874a1120056cc",
        snippet: "TCP SYN flood and unauthorized RTSP stream capture detected on internal interface eth1 (194.26.29.112 -> 10.0.4.15)."
      }
    ],
    generatedSummary: {
      incidentId: "CAS-2026-001",
      reportId: "REP-2026-001",
      reportGenerationDate: "15 October 2026 / 14:00 UTC",
      incidentDateTime: "15 October 2026 / 13:42:10 UTC",
      classification: "CONFIDENTIAL / SOC & ACADEMIC FACULTY AUDIT",
      incidentStatus: "ACTIVE INVESTIGATION",
      severity: "CRITICAL",

      whatWasDetected: "Unauthorized Perimeter Breach: 1 Person, 1 Backpack, and 1 Vehicle in Restricted Sector 4",
      dateTimeDetected: "15 October 2026 / 13:42:10 UTC",
      location: "North Gate - Sector 4 (Restricted Perimeter & Data Ingress)",
      detectingCamera: "CAM-01 [North Gate 4K Surveillance Sensor]",
      incidentType: "Perimeter Intrusion, Hardware Tamper & Data Terminal Ingress",
      summarySeverity: "CRITICAL (Level 5)",
      confidenceScore: "98.4% (YOLOv8x Deep Neural Model)",
      summaryCurrentStatus: "Active Forensic Investigation",

      detailIncidentId: "CAS-2026-001",
      detailIncidentType: "Perimeter Breach & Physical Access Terminal Compromise",
      detailSeverity: "CRITICAL",
      detailDetectionSource: "CyberVision Edge AI Video Analytics (YOLOv8x)",
      detailCameraId: "CAM-01-NG",
      detailCameraLocation: "North Gate Outer Perimeter Fence",
      detailFirstDetection: "13:42:10 UTC",
      detailLastDetection: "13:46:30 UTC",
      detailDuration: "4 minutes 20 seconds",
      detailConfidence: "98.4%",
      detailCurrentStatus: "Under Active Forensic Examination",
      detailAssignedInvestigator: "Dr. Adina Hawaldar (Lead Forensic Investigator)",
      detailReferenceNumber: "CV-2026-SEC-00109",

      executiveSummary: "On 15 October 2026 at 13:42 UTC, an unauthorized individual arrived in a dark vehicle outside North Gate, climbed over the perimeter security fence with a backpack, and entered the restricted Sector 4 area.\n\nIncident Summary & What Happened Till Now:\n• Perimeter Intrusion (13:42 UTC): The suspect scaled the outer fence from the public roadway into the secured facility compound.\n• Access & Tampering (13:42 - 13:43 UTC): The individual attempted 14 unauthorized badge scans at Door SEC-04 and severed primary camera wiring before fleeing toward the eastern perimeter.\n• Instant Security Response: CyberVision AI immediately flagged the breach, sent high-priority alerts to the guard console, and securely locked all 3 evidence files (CCTV video, door controller logs, and network telemetry).\n• Current Status (Active Investigation): The case is actively being investigated by Lead Forensic Investigator Dr. Adina Hawaldar. Physical inspection confirmed fence damage, and site security patrols have been reinforced.",

      event01Timestamp: "13:42:10 UTC",
      event01Type: "Perimeter Intrusion Detection",
      event01Camera: "CAM-01 [North Gate]",
      event01Desc: "Subject detected climbing outer fence boundary from public roadway into secured compound.",
      event01Ref: "EVID-001",

      event02Timestamp: "13:42:48 UTC",
      event02Type: "Alert Dispatch to Guard Post",
      event02Camera: "Rules Engine v2",
      event02Desc: "Automated high-priority alert sent to Central Security Operations console with 10-second visual snippet.",
      event02Ref: "EVID-002",

      event03Timestamp: "13:43:20 UTC",
      event03Type: "Optical Feed Disruption",
      event03Camera: "CAM-01 [North Gate]",
      event03Desc: "RTSP feed hardware connection severed. Watchdog system engaged secondary tamper telemetry.",
      event03Ref: "EVID-003",

      event04Timestamp: "13:46:30 UTC",
      event04Type: "Evidence Vault Cryptographic Seal",
      event04Camera: "Dr. Hawaldar Workstation",
      event04Desc: "All 3 related video snippets, network captures, and telemetry logs sealed with SHA-256 integrity hashes.",
      event04Ref: "EVID-004",

      regRow1Id: "EVID-001",
      regRow1Type: "CCTV Clip (MP4)",
      regRow1Source: "CAM-01 North Gate",
      regRow1Camera: "CAM-01",
      regRow1Timestamp: "13:42:10 UTC",
      regRow1Desc: "Fence scaling capture (1080p, 30fps)",
      regRow1File: "cctv_perimeter_breach_cam01.mp4",
      regRow1Hash: "8f4b238a9e0132b498dc21e0a81190bc2081f9a12c8e034177b0d87a41e9a9e0",
      regRow1Status: "Verified / Intact",

      regRow2Id: "EVID-002",
      regRow2Type: "Access Controller Log",
      regRow2Source: "Terminal-B Controller",
      regRow2Camera: "N/A",
      regRow2Timestamp: "13:42:15 UTC",
      regRow2Desc: "Tamper switch and credential brute-force log",
      regRow2File: "access_controller_audit.log",
      regRow2Hash: "3c7e91d112fa6b21789c0211a87754b2190823c10aefb231145109b8214ed112",
      regRow2Status: "Verified / Intact",

      regRow3Id: "EVID-003",
      regRow3Type: "Packet Capture (PCAP)",
      regRow3Source: "Network TAP #4",
      regRow3Camera: "CAM-01",
      regRow3Timestamp: "13:43:20 UTC",
      regRow3Desc: "ARP poisoning / cut cable telemetry",
      regRow3File: "perimeter_sensor_telemetry.pcap",
      regRow3Hash: "e2098b56cc99120a441b802a98f12cb8192a014e7f82b0912cb874a1120056cc",
      regRow3Status: "Verified / Intact",

      keyEvid1Id: "EVID-001",
      keyEvid1Captured: "15 Oct 2026 13:42:10 UTC",
      keyEvid1Camera: "CAM-01 North Gate",
      keyEvid1Location: "Outer Fence Boundary Sector 4",
      keyEvid1Desc: "Full body silhouette detected climbing 2.8m boundary mesh.",
      keyEvid1Annotation: "AI-generated annotation [person: 0.98, backpack: 0.94]",

      keyEvid2Id: "EVID-003",
      keyEvid2Captured: "15 Oct 2026 13:43:20 UTC",
      keyEvid2Camera: "CAM-01 North Gate",
      keyEvid2Location: "Junction Box JB-04",
      keyEvid2Desc: "Physical fiber optic line cut with mechanical shears.",
      keyEvid2Annotation: "AI-generated annotation [tamper_signal: 0.94]",

      analysisDetectedObjects: "1 Person, 1 Backpack, 1 Car",
      analysisObjectCount: "3 total distinct targets tracked",
      analysisMovementDirection: "North-to-South towards Server Terminal Bay 2",
      analysisRestrictedZone: "Yes - Sector 4 Zero-Tolerance Perimeter",
      analysisBoundaryCrossing: "Outer Perimeter Fence Ingress Confirmed at 00:04",
      analysisVehicleDetection: "Unregistered dark sedan parked near perimeter curb (96.1%)",
      analysisPersonDetection: "Male, approx 180cm, dark tactical jacket (98.4%)",
      analysisOtherSignals: "Optical fiber loss, microphonic fence vibration",
      analysisConfidence: "98.4% Peak Precision (YOLOv8x Deep Neural Model)",

      sourceCameraId: "CAM-01",
      sourceCameraLocation: "North Gate Post Mast #3",
      sourceGpsCoordinates: "37.7749° N, 122.4194° W (Secured)",
      sourceRecordingSource: "Local Edge NVMe + Secure S3 Mirror",
      sourceDetectionTimestamp: "2026-10-15T13:42:10.114Z",
      sourceAvailableDuration: "42 hours 18 minutes (Pre-tamper archive)",
      sourceFrameReferences: "Frames #14,208 to #15,890",
      sourceStatus: "Offline / Standby Cellular Active",

      corrRow1Event: "EVENT 01",
      corrRow1Evidence: "EVID-001",
      corrRow1Alert: "ALT-2026-881",
      corrRow1Basis: "Direct visual capture of subject scaling fence",

      corrRow2Event: "EVENT 02",
      corrRow2Evidence: "EVID-002",
      corrRow2Alert: "ALT-2026-882",
      corrRow2Basis: "Automated alert generated by rules engine",

      corrRow3Event: "EVENT 03",
      corrRow3Evidence: "EVID-003",
      corrRow3Alert: "ALT-2026-884",
      corrRow3Basis: "Physical line break confirmed by link loss",

      corrRow4Event: "EVENT 04",
      corrRow4Evidence: "EVID-004",
      corrRow4Alert: "N/A",
      corrRow4Basis: "Forensic lock applied to investigation package",

      intRow1Id: "EVID-001",
      intRow1File: "cctv_perimeter_breach_cam01.mp4",
      intRow1Hash: "8f4b238a9e0132b498dc21e0a81190bc2081f9a12c8e034177b0d87a41e9a9e0",
      intRow1Timestamp: "13:42:10 UTC",
      intRow1Source: "Edge Camera Buffer",
      intRow1Status: "Integrity Verified (Valid)",

      intRow2Id: "EVID-002",
      intRow2File: "access_controller_audit.log",
      intRow2Hash: "3c7e91d112fa6b21789c0211a87754b2190823c10aefb231145109b8214ed112",
      intRow2Timestamp: "13:42:15 UTC",
      intRow2Source: "Terminal Controller Syslog",
      intRow2Status: "Integrity Verified (Valid)",

      intRow3Id: "EVID-003",
      intRow3File: "perimeter_sensor_telemetry.pcap",
      intRow3Hash: "e2098b56cc99120a441b802a98f12cb8192a014e7f82b0912cb874a1120056cc",
      intRow3Timestamp: "13:43:20 UTC",
      intRow3Source: "Network Sensor TAP",
      intRow3Status: "Integrity Verified (Valid)",

      noteInvestigatorNotes: "Physical inspection of Sector 4 outer fence confirmed wire mesh was severed at a height of 2.1 meters. Footprints recovered match standard vibram sole pattern. Handed over to Academic Faculty and Metropolitan Police Cyber Forensics unit.",
      noteAdditionalObservations: "Sedan observed on North perimeter road fled Eastward on Highway 101 at approximately 13:44 UTC.",
      noteRelatedIncidents: "Cross-correlated with CAS-2026-001 (High-Priority Physical Security Incident).",
      noteAdditionalEvidence: "Physical metal clippings preserved in evidence locker #B-14.",
      noteFollowUpActions: "1. Deploy mobile IR surveillance unit to North Gate.\n2. Reinforce optical conduit with armored piping.",

      statusCheckNew: "[ &nbsp; ]",
      statusCheckInvestigation: "[ &#10003; ]",
      statusCheckEscalated: "[ &nbsp; ]",
      statusCheckResolved: "[ &nbsp; ]",
      statusCheckClosed: "[ &nbsp; ]",
      statusRecordedValue: "Under Active Investigation",

      metaReportId: "REP-2026-001",
      metaIncidentId: "CAS-2026-001",
      metaGeneratedBy: "CyberVision AI Forensic Suite v3.4.1",
      metaGenerationTimestamp: "15 October 2026 / 14:00:14 UTC",
      metaSystemVersion: "v3.4.1 (YOLOv8x + Edge AI)",
      metaReportVersion: "v1.0-FINAL",
      metaEvidenceCount: "3 Files (48.2 MB Total)",
      metaTimelineCount: "4 Key Sequence Events"
    }
  }
];

const STORAGE_KEY = "cybervision_cases_db_v6";

export function getStoredCases(): CaseItem[] {
  if (typeof window === "undefined") return DEFAULT_CASES;
  try {
    // Purge legacy storage versions
    localStorage.removeItem("cybervision_cases_db");
    localStorage.removeItem("cybervision_cases_db_v2");
    localStorage.removeItem("cybervision_cases_db_v3");
    localStorage.removeItem("cybervision_cases_db_v4");
    localStorage.removeItem("cybervision_cases_db_v5");

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CASES));
      return DEFAULT_CASES;
    }
    const parsed = JSON.parse(raw);
    // If storage contains old cases (like CAS-2026-004), automatically reset to the single showcase case
    if (
      !Array.isArray(parsed) ||
      parsed.length === 0 ||
      (parsed.length > 1 && parsed.some((c: any) => c.id === "CAS-2026-004"))
    ) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CASES));
      return DEFAULT_CASES;
    }
    return parsed;
  } catch (e) {
    return DEFAULT_CASES;
  }
}

export function saveCase(newCase: {
  name: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  cctvFeed?: string;
  attachedFiles?: AttachedFile[];
  location?: string;
  lead?: string;
}): CaseItem {
  const existing = getStoredCases();
  const idNumber = String(existing.length + 1).padStart(3, "0");
  const caseId = `CAS-2026-${idNumber}`;

  const filesCount = newCase.attachedFiles ? newCase.attachedFiles.length : 0;
  const initialEvidenceCount = filesCount > 0 ? filesCount : 1;

  const item: CaseItem = {
    id: caseId,
    name: newCase.name,
    severity: newCase.severity,
    status: "INVESTIGATING",
    cctvFeed: newCase.cctvFeed,
    attachedFiles: newCase.attachedFiles || [],
    evidenceCount: initialEvidenceCount,
    lead: newCase.lead || "Dr. Adina Hawaldar",
    location: newCase.location || "Surveillance Grid",
    lastUpdated: "Just now",
    sha256: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    notes: []
  };

  const updated = [item, ...existing];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("cybervision_cases_updated"));
  }

  return item;
}

export function getCaseById(id: string): CaseItem | undefined {
  const cases = getStoredCases();
  return cases.find((c) => c.id === id);
}

export function addFilesToCase(caseId: string, files: AttachedFile[]): CaseItem | null {
  const cases = getStoredCases();
  const index = cases.findIndex((c) => c.id === caseId);
  if (index === -1) return null;

  const current = cases[index];
  const updatedFiles = [...(current.attachedFiles || []), ...files];
  const updatedCase: CaseItem = {
    ...current,
    attachedFiles: updatedFiles,
    evidenceCount: updatedFiles.length,
    lastUpdated: "Just now"
  };

  cases[index] = updatedCase;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    window.dispatchEvent(new Event("cybervision_cases_updated"));
  }
  return updatedCase;
}

export function removeFileFromCase(caseId: string, fileIndex: number): CaseItem | null {
  const cases = getStoredCases();
  const index = cases.findIndex((c) => c.id === caseId);
  if (index === -1) return null;

  const current = cases[index];
  const updatedFiles = (current.attachedFiles || []).filter((_, i) => i !== fileIndex);
  const updatedCase: CaseItem = {
    ...current,
    attachedFiles: updatedFiles,
    evidenceCount: updatedFiles.length,
    lastUpdated: "Just now"
  };

  cases[index] = updatedCase;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    window.dispatchEvent(new Event("cybervision_cases_updated"));
  }
  return updatedCase;
}

export function addNoteToCase(caseId: string, note: string): CaseItem | null {
  const cases = getStoredCases();
  const index = cases.findIndex((c) => c.id === caseId);
  if (index === -1) return null;

  const current = cases[index];
  const updatedNotes = [note, ...(current.notes || [])];
  const updatedCase: CaseItem = {
    ...current,
    notes: updatedNotes,
    lastUpdated: "Just now"
  };

  cases[index] = updatedCase;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    window.dispatchEvent(new Event("cybervision_cases_updated"));
  }
  return updatedCase;
}

export function updateCaseSummary(caseId: string, reportId: string, summary: any): CaseItem | null {
  const cases = getStoredCases();
  const index = cases.findIndex((c) => c.id === caseId);
  if (index === -1) return null;

  const current = cases[index];
  const updatedCase: CaseItem = {
    ...current,
    generatedReportId: reportId,
    generatedSummary: summary,
    status: "AI_PARSED",
    lastUpdated: "Just now"
  };

  cases[index] = updatedCase;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    window.dispatchEvent(new Event("cybervision_cases_updated"));
  }
  return updatedCase;
}

export interface ReportListItem {
  id: string;
  title: string;
  caseId: string;
  date: string;
  pages: number;
}

export const BASE_REPORTS: ReportListItem[] = [
  { id: "REP-2026-001", title: "Forensic Investigation Dossier - Perimeter Intrusion & Data Ingress", caseId: "CAS-2026-001", date: "Today", pages: 14 }
];

export function getAllReports(): ReportListItem[] {
  const cases = getStoredCases();
  const dynamicReports: ReportListItem[] = [];

  for (const c of cases) {
    if (c.generatedReportId) {
      if (!BASE_REPORTS.some((r) => r.id === c.generatedReportId)) {
        dynamicReports.push({
          id: c.generatedReportId,
          title: `Forensic Investigation Dossier - ${c.name}`,
          caseId: c.id,
          date: "Just now",
          pages: 14
        });
      }
    }
  }

  return [...dynamicReports, ...BASE_REPORTS];
}

export function useCases() {
  const [cases, setCases] = useState<CaseItem[]>(DEFAULT_CASES);

  useEffect(() => {
    setCases(getStoredCases());

    const handleUpdate = () => {
      setCases(getStoredCases());
    };

    window.addEventListener("cybervision_cases_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("cybervision_cases_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return { cases, refresh: () => setCases(getStoredCases()) };
}
