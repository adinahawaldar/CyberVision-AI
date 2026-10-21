import fs from 'fs';
import path from 'path';
import puppeteer, { Browser } from 'puppeteer';

export interface ReportStringData {
  // 0. Cover Metadata
  incidentId?: string;
  reportId?: string;
  reportGenerationDate?: string;
  incidentDateTime?: string;
  classification?: string;
  incidentStatus?: string;
  severity?: string;

  // 1. INCIDENT SUMMARY
  whatWasDetected?: string;
  dateTimeDetected?: string;
  location?: string;
  detectingCamera?: string;
  incidentType?: string;
  summarySeverity?: string;
  confidenceScore?: string;
  summaryCurrentStatus?: string;

  // 2. INCIDENT DETAILS
  detailIncidentId?: string;
  detailIncidentType?: string;
  detailSeverity?: string;
  detailDetectionSource?: string;
  detailCameraId?: string;
  detailCameraLocation?: string;
  detailFirstDetection?: string;
  detailLastDetection?: string;
  detailDuration?: string;
  detailConfidence?: string;
  detailCurrentStatus?: string;
  detailAssignedInvestigator?: string;
  detailReferenceNumber?: string;

  // 3. EXECUTIVE INCIDENT SUMMARY
  executiveSummary?: string;

  // 4. INCIDENT TIMELINE
  event01Timestamp?: string;
  event01Type?: string;
  event01Camera?: string;
  event01Desc?: string;
  event01Ref?: string;

  event02Timestamp?: string;
  event02Type?: string;
  event02Camera?: string;
  event02Desc?: string;
  event02Ref?: string;

  event03Timestamp?: string;
  event03Type?: string;
  event03Camera?: string;
  event03Desc?: string;
  event03Ref?: string;

  event04Timestamp?: string;
  event04Type?: string;
  event04Camera?: string;
  event04Desc?: string;
  event04Ref?: string;

  // 5. EVIDENCE REGISTER
  regRow1Id?: string;
  regRow1Type?: string;
  regRow1Source?: string;
  regRow1Camera?: string;
  regRow1Timestamp?: string;
  regRow1Desc?: string;
  regRow1File?: string;
  regRow1Hash?: string;
  regRow1Status?: string;

  regRow2Id?: string;
  regRow2Type?: string;
  regRow2Source?: string;
  regRow2Camera?: string;
  regRow2Timestamp?: string;
  regRow2Desc?: string;
  regRow2File?: string;
  regRow2Hash?: string;
  regRow2Status?: string;

  regRow3Id?: string;
  regRow3Type?: string;
  regRow3Source?: string;
  regRow3Camera?: string;
  regRow3Timestamp?: string;
  regRow3Desc?: string;
  regRow3File?: string;
  regRow3Hash?: string;
  regRow3Status?: string;

  // 6. KEY EVIDENCE
  keyEvid1Id?: string;
  keyEvid1Captured?: string;
  keyEvid1Camera?: string;
  keyEvid1Location?: string;
  keyEvid1Desc?: string;
  keyEvid1Annotation?: string;

  keyEvid2Id?: string;
  keyEvid2Captured?: string;
  keyEvid2Camera?: string;
  keyEvid2Location?: string;
  keyEvid2Desc?: string;
  keyEvid2Annotation?: string;

  // 7. DETECTION ANALYSIS
  analysisDetectedObjects?: string;
  analysisObjectCount?: string;
  analysisMovementDirection?: string;
  analysisRestrictedZone?: string;
  analysisBoundaryCrossing?: string;
  analysisVehicleDetection?: string;
  analysisPersonDetection?: string;
  analysisOtherSignals?: string;
  analysisConfidence?: string;

  // 8. CAMERA / SOURCE INFORMATION
  sourceCameraId?: string;
  sourceCameraLocation?: string;
  sourceGpsCoordinates?: string;
  sourceRecordingSource?: string;
  sourceDetectionTimestamp?: string;
  sourceAvailableDuration?: string;
  sourceFrameReferences?: string;
  sourceStatus?: string;

  // 9. EVENT CORRELATION
  corrRow1Event?: string;
  corrRow1Evidence?: string;
  corrRow1Alert?: string;
  corrRow1Basis?: string;

  corrRow2Event?: string;
  corrRow2Evidence?: string;
  corrRow2Alert?: string;
  corrRow2Basis?: string;

  corrRow3Event?: string;
  corrRow3Evidence?: string;
  corrRow3Alert?: string;
  corrRow3Basis?: string;

  corrRow4Event?: string;
  corrRow4Evidence?: string;
  corrRow4Alert?: string;
  corrRow4Basis?: string;

  // 10. EVIDENCE INTEGRITY
  intRow1Id?: string;
  intRow1File?: string;
  intRow1Hash?: string;
  intRow1Timestamp?: string;
  intRow1Source?: string;
  intRow1Status?: string;

  intRow2Id?: string;
  intRow2File?: string;
  intRow2Hash?: string;
  intRow2Timestamp?: string;
  intRow2Source?: string;
  intRow2Status?: string;

  intRow3Id?: string;
  intRow3File?: string;
  intRow3Hash?: string;
  intRow3Timestamp?: string;
  intRow3Source?: string;
  intRow3Status?: string;

  // 11. INVESTIGATION NOTES
  noteInvestigatorNotes?: string;
  noteAdditionalObservations?: string;
  noteRelatedIncidents?: string;
  noteAdditionalEvidence?: string;
  noteFollowUpActions?: string;

  // 12. INCIDENT STATUS
  statusCheckNew?: string;
  statusCheckInvestigation?: string;
  statusCheckEscalated?: string;
  statusCheckResolved?: string;
  statusCheckClosed?: string;
  statusRecordedValue?: string;

  // 14. REPORT METADATA
  metaReportId?: string;
  metaIncidentId?: string;
  metaGeneratedBy?: string;
  metaGenerationTimestamp?: string;
  metaSystemVersion?: string;
  metaReportVersion?: string;
  metaEvidenceCount?: string;
  metaTimelineCount?: string;

  // Visual Evidence & Section Annotations
  keyEvid1Image?: string;
  keyEvid2Image?: string;
  section1Note?: string;
  section4Note?: string;
  section11Note?: string;

  // Catch-all for any additional string inputs
  [key: string]: string | undefined;
}

// In-memory cache for generated PDF buffers to provide instantaneous downloads and views
const PDF_BUFFER_CACHE = new Map<string, { buffer: Buffer; cachedAt: number }>();

export function invalidatePdfCache(reportId?: string) {
  if (reportId) {
    for (const key of PDF_BUFFER_CACHE.keys()) {
      if (key.startsWith(reportId)) {
        PDF_BUFFER_CACHE.delete(key);
      }
    }
  } else {
    PDF_BUFFER_CACHE.clear();
  }
}

export function registerReportData(reportId: string, data: ReportStringData) {
  PRESET_REPORTS[reportId] = data;
  invalidatePdfCache(reportId);
}

export function getReportData(reportId: string): ReportStringData | undefined {
  return PRESET_REPORTS[reportId];
}

// Preset configurations for existing dashboard reports
export const PRESET_REPORTS: Record<string, ReportStringData> = {
  "REP-2026-001": {
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
  },
  "REP-2026-088": {
    incidentId: "CAS-2026-004",
    reportId: "REP-2026-088",
    reportGenerationDate: "29 September 2026 / 22:30 UTC",
    incidentDateTime: "29 September 2026 / 22:14:02 UTC",
    classification: "CONFIDENTIAL / LAW ENFORCEMENT & SOC",
    incidentStatus: "UNDER INVESTIGATION",
    severity: "CRITICAL",

    whatWasDetected: "Unauthorized Person Climbing North Gate Outer Perimeter Fence",
    dateTimeDetected: "29 September 2026 / 22:14:02 UTC",
    location: "North Gate - Sector 4 (Restricted Perimeter)",
    detectingCamera: "CAM-01 [North Gate Pan/Tilt/Zoom 4K]",
    incidentType: "Perimeter Intrusion & Physical Security Breach",
    summarySeverity: "CRITICAL (Level 5)",
    confidenceScore: "98.4% (YOLOv8x Deep Neural Model)",
    summaryCurrentStatus: "Active Forensic Investigation",

    detailIncidentId: "CAS-2026-004",
    detailIncidentType: "Perimeter Breach & Optical Cable Disruption",
    detailSeverity: "CRITICAL",
    detailDetectionSource: "CyberVision Edge AI Video Stream",
    detailCameraId: "CAM-01-NG",
    detailCameraLocation: "North Gate Exterior Perimeter",
    detailFirstDetection: "22:14:02 UTC",
    detailLastDetection: "22:18:22 UTC",
    detailDuration: "4 minutes 20 seconds",
    detailConfidence: "98.4%",
    detailCurrentStatus: "Under Active Forensic Examination",
    detailAssignedInvestigator: "Lead Agent Hawke (Badge #4829)",
    detailReferenceNumber: "CV-2026-SEC-09941",

    executiveSummary: "On 29 September 2026 at 22:14:02 UTC, CyberVision AI camera CAM-01 (North Gate) automatically identified an unauthorized subject scaling the outer boundary fence into restricted Sector 4. The computer vision model registered a 98.4% confidence score for person intrusion. 36 seconds subsequent to the initial alert, physical line tampering severed the primary RTSP transmission feed, triggering autonomous failover to cellular backup and immediate dispatch of armed response units.",

    event01Timestamp: "22:14:02 UTC",
    event01Type: "Perimeter Intrusion Detection",
    event01Camera: "CAM-01 [North Gate]",
    event01Desc: "Subject detected climbing outer fence boundary from public roadway into secured compound.",
    event01Ref: "EVID-2026-0041-VID",

    event02Timestamp: "22:14:38 UTC",
    event02Type: "Alert Dispatch to Guard Post",
    event02Camera: "Rules Engine v2",
    event02Desc: "Automated high-priority alert sent to Central Security Operations console with 10-second visual snippet.",
    event02Ref: "EVID-2026-0042-LOG",

    event03Timestamp: "22:15:10 UTC",
    event03Type: "Optical Feed Disruption",
    event03Camera: "CAM-01 [North Gate]",
    event03Desc: "RTSP feed hardware connection severed. Watchdog system engaged secondary tamper telemetry.",
    event03Ref: "EVID-2026-0043-PCAP",

    event04Timestamp: "22:18:22 UTC",
    event04Type: "Evidence Vault Cryptographic Seal",
    event04Camera: "Agent Hawke Workstation",
    event04Desc: "All 18 related video snippets, network captures, and telemetry logs sealed with SHA-256 integrity hashes.",
    event04Ref: "EVID-2026-0044-HASH",

    regRow1Id: "EVID-001",
    regRow1Type: "CCTV Clip (MP4)",
    regRow1Source: "CAM-01 North Gate",
    regRow1Camera: "CAM-01",
    regRow1Timestamp: "22:14:02 UTC",
    regRow1Desc: "Fence scaling capture (1080p, 30fps)",
    regRow1File: "cctv_ng_breach_01.mp4",
    regRow1Hash: "8f4b238a9e0132b4...",
    regRow1Status: "Verified / Intact",

    regRow2Id: "EVID-002",
    regRow2Type: "Firewall Log (Syslog)",
    regRow2Source: "Perimeter Router #2",
    regRow2Camera: "N/A",
    regRow2Timestamp: "22:15:08 UTC",
    regRow2Desc: "RTSP stream drop error log",
    regRow2File: "perimeter_rtsp_drop.log",
    regRow2Hash: "3c7e91d112fa6b21...",
    regRow2Status: "Verified / Intact",

    regRow3Id: "EVID-003",
    regRow3Type: "Packet Capture (PCAP)",
    regRow3Source: "Network TAP #4",
    regRow3Camera: "CAM-01",
    regRow3Timestamp: "22:16:04 UTC",
    regRow3Desc: "ARP poisoning / cut cable telemetry",
    regRow3File: "perimeter_raw_tap.pcap",
    regRow3Hash: "e2098b56cc99120a...",
    regRow3Status: "Verified / Intact",

    keyEvid1Id: "EVID-001",
    keyEvid1Captured: "29 Sep 2026 22:14:02 UTC",
    keyEvid1Camera: "CAM-01 North Gate",
    keyEvid1Location: "Outer Fence Boundary Sector 4",
    keyEvid1Desc: "Full body silhouette detected climbing 2.8m boundary mesh.",
    keyEvid1Annotation: "AI-generated annotation [person: 0.98]",

    keyEvid2Id: "EVID-003",
    keyEvid2Captured: "29 Sep 2026 22:15:10 UTC",
    keyEvid2Camera: "CAM-01 North Gate",
    keyEvid2Location: "Junction Box JB-04",
    keyEvid2Desc: "Physical fiber optic line cut with mechanical shears.",
    keyEvid2Annotation: "AI-generated annotation [tamper_signal: 0.94]",

    analysisDetectedObjects: "Person, Cutting Tool, Backpack",
    analysisObjectCount: "1 Person, 2 Auxiliary Objects",
    analysisMovementDirection: "South-West (Inbound towards Warehouse B)",
    analysisRestrictedZone: "Yes - Sector 4 Zero-Tolerance Perimeter",
    analysisBoundaryCrossing: "Outer Perimeter Fence Ingress Confirmed",
    analysisVehicleDetection: "Unidentified dark sedan idling 120m North",
    analysisPersonDetection: "Male, approx 180cm, dark tactical jacket",
    analysisOtherSignals: "Optical fiber loss, microphonic fence vibration",
    analysisConfidence: "98.4% Mean Average Precision (mAP)",

    sourceCameraId: "CAM-01",
    sourceCameraLocation: "North Gate Post Mast #3",
    sourceGpsCoordinates: "37.7749° N, 122.4194° W (Secured)",
    sourceRecordingSource: "Local Edge NVMe + Secure S3 Mirror",
    sourceDetectionTimestamp: "2026-09-29T22:14:02.114Z",
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
    intRow1File: "cctv_ng_breach_01.mp4",
    intRow1Hash: "8f4b238a9e0132b498dc21e0a81190bc2081f9a12c8e034177b0d87a41e9a9e0",
    intRow1Timestamp: "22:14:02 UTC",
    intRow1Source: "Edge Camera Buffer",
    intRow1Status: "Integrity Verified (Valid)",

    intRow2Id: "EVID-002",
    intRow2File: "perimeter_rtsp_drop.log",
    intRow2Hash: "3c7e91d112fa6b21789c0211a87754b2190823c10aefb231145109b8214ed112",
    intRow2Timestamp: "22:15:08 UTC",
    intRow2Source: "Router Syslog",
    intRow2Status: "Integrity Verified (Valid)",

    intRow3Id: "EVID-003",
    intRow3File: "perimeter_raw_tap.pcap",
    intRow3Hash: "e2098b56cc99120a441b802a98f12cb8192a014e7f82b0912cb874a1120056cc",
    intRow3Timestamp: "22:16:04 UTC",
    intRow3Source: "Network Sensor",
    intRow3Status: "Integrity Verified (Valid)",

    noteInvestigatorNotes: "Physical inspection of Sector 4 outer fence confirmed wire mesh was severed at a height of 2.1 meters. Footprints recovered match standard vibram sole pattern. Handed over to Metropolitan Police Cyber Forensics unit.",
    noteAdditionalObservations: "Sedan observed on North perimeter road fled Eastward on Highway 101 at approximately 22:16 UTC.",
    noteRelatedIncidents: "Cross-correlated with CAS-2026-001 (Attempted Gate Reconnaissance on 18 Sep 2026).",
    noteAdditionalEvidence: "Physical metal clippings preserved in evidence locker #B-14.",
    noteFollowUpActions: "1. Deploy mobile IR surveillance unit to North Gate.\n2. Reinforce optical conduit with armored piping.",

    statusCheckNew: "[ &nbsp; ]",
    statusCheckInvestigation: "[ &#10003; ]",
    statusCheckEscalated: "[ &nbsp; ]",
    statusCheckResolved: "[ &nbsp; ]",
    statusCheckClosed: "[ &nbsp; ]",
    statusRecordedValue: "Under Investigation",

    metaReportId: "REP-2026-088",
    metaIncidentId: "CAS-2026-004",
    metaGeneratedBy: "CyberVision AI Forensic Suite v3.4.1",
    metaGenerationTimestamp: "29 September 2026 / 22:30:14 UTC",
    metaSystemVersion: "CyberVision-AI Core 2.8.0-enterprise",
    metaReportVersion: "v1.4 (Official Forensic Export)",
    metaEvidenceCount: "18 Digital Artifacts",
    metaTimelineCount: "4 Sequenced Events"
  },

  "REP-2026-087": {
    incidentId: "CAS-2026-003",
    reportId: "REP-2026-087",
    reportGenerationDate: "28 September 2026 / 14:15 UTC",
    incidentDateTime: "28 September 2026 / 03:22:19 UTC",
    classification: "CONFIDENTIAL / INTERNAL AUDIT ONLY",
    incidentStatus: "EVIDENCE COLLECTED",
    severity: "HIGH",

    whatWasDetected: "Badge Reader Bypass & Late-Night Data Center Ingress",
    dateTimeDetected: "28 September 2026 / 03:22:19 UTC",
    location: "Building 2 - Server Room B (Restricted Zone 1)",
    detectingCamera: "CAM-04 [Server Room Interior Dome]",
    incidentType: "Physical Access Anomaly & Badge Cloning Suspicion",
    summarySeverity: "HIGH (Level 4)",
    confidenceScore: "95.1% (CyberVision Access Correlator)",
    summaryCurrentStatus: "Evidence Collected / Under Review",

    detailIncidentId: "CAS-2026-003",
    detailIncidentType: "Unauthorized Data Center Entry",
    detailSeverity: "HIGH",
    detailDetectionSource: "RFID Access Control & Optical Face Discernment",
    detailCameraId: "CAM-04-SR",
    detailCameraLocation: "Server Room B Interior Entryway",
    detailFirstDetection: "03:22:19 UTC",
    detailLastDetection: "03:41:05 UTC",
    detailDuration: "18 minutes 46 seconds",
    detailConfidence: "95.1%",
    detailCurrentStatus: "Evidence Sealed",
    detailAssignedInvestigator: "Lead Analyst Vance (Badge #3108)",
    detailReferenceNumber: "CV-2026-AUD-07119",

    executiveSummary: "On 28 September 2026 at 03:22:19 UTC, access credentials registered to contractor badge ID #8841 were used to open Server Room B. Real-time facial biometric matching from camera CAM-04 indicated an 84% mismatch between the badge holder on file and the physical entrant. Internal sensors detected access to Rack 14 console ports prior to exit.",

    event01Timestamp: "03:22:19 UTC",
    event01Type: "Card Reader Authorized Entry",
    event01Camera: "CAM-04 [Server Room]",
    event01Desc: "Badge #8841 presented at biometric turnstile.",
    event01Ref: "EVID-2026-0031-RFID",

    event02Timestamp: "03:22:31 UTC",
    event02Type: "Biometric Facial Mismatch Warning",
    event02Camera: "CAM-04 [Interior Dome]",
    event02Desc: "Facial analysis flagged entrant as distinct from registered badge photo.",
    event02Ref: "EVID-2026-0032-BIO",

    event03Timestamp: "03:34:10 UTC",
    event03Type: "Rack Console Physical Connect",
    event03Camera: "CAM-04 [Interior Dome]",
    event03Desc: "Subject inserted USB storage device into Switch S-14 management port.",
    event03Ref: "EVID-2026-0033-USB",

    event04Timestamp: "03:41:05 UTC",
    event04Type: "Exit & System Lockdown",
    event04Camera: "Building 2 Egress",
    event04Desc: "Subject departed facility via rear fire exit stairs.",
    event04Ref: "EVID-2026-0034-LOG",

    regRow1Id: "EVID-101",
    regRow1Type: "CCTV Clip (MP4)",
    regRow1Source: "CAM-04 Server Room",
    regRow1Camera: "CAM-04",
    regRow1Timestamp: "03:22:19 UTC",
    regRow1Desc: "Entrance vestibule footage (1080p, 60fps)",
    regRow1File: "server_room_entry_cam4.mp4",
    regRow1Hash: "7d793037a0760186...",
    regRow1Status: "Verified / Intact",

    regRow2Id: "EVID-102",
    regRow2Type: "Audit Log (JSON)",
    regRow2Source: "HID Door Controller",
    regRow2Camera: "N/A",
    regRow2Timestamp: "03:22:19 UTC",
    regRow2Desc: "Badge scan event metadata and reader ID",
    regRow2File: "hid_door_event_8841.json",
    regRow2Hash: "5f8a1290bb34101e...",
    regRow2Status: "Verified / Intact",

    regRow3Id: "EVID-103",
    regRow3Type: "Switch Log (Syslog)",
    regRow3Source: "Cisco Core Switch 14",
    regRow3Camera: "N/A",
    regRow3Timestamp: "03:34:12 UTC",
    regRow3Desc: "USB Mass Storage driver mount event",
    regRow3File: "switch14_usb_mount.log",
    regRow3Hash: "a1c900e2348109bf...",
    regRow3Status: "Verified / Intact",

    keyEvid1Id: "EVID-101",
    keyEvid1Captured: "28 Sep 2026 03:22:25 UTC",
    keyEvid1Camera: "CAM-04 Server Room",
    keyEvid1Location: "Rack Row 2 Corridor",
    keyEvid1Desc: "Subject wearing grey hooded sweatshirt approaching Rack 14.",
    keyEvid1Annotation: "AI-generated annotation [unauthorized_visitor: 0.95]",

    keyEvid2Id: "EVID-103",
    keyEvid2Captured: "28 Sep 2026 03:34:10 UTC",
    keyEvid2Camera: "CAM-04 Server Room",
    keyEvid2Location: "Server Rack 14 Port Bay",
    keyEvid2Desc: "USB device attached directly to switch auxiliary console.",
    keyEvid2Annotation: "AI-generated annotation [usb_hardware_intrusion: 0.91]",

    analysisDetectedObjects: "Person, USB Drive, Keychain Badge",
    analysisObjectCount: "1 Individual, Electronic Dongle",
    analysisMovementDirection: "Direct path to Rack 14",
    analysisRestrictedZone: "Yes - Tier 3 Restricted Colocation",
    analysisBoundaryCrossing: "Vestibule Door Mantrap",
    analysisVehicleDetection: "None within interior perimeter",
    analysisPersonDetection: "Unidentified person, face obscured by cap and hood",
    analysisOtherSignals: "Thermal anomaly on rack enclosure door",
    analysisConfidence: "95.1% Correlation Confidence",

    sourceCameraId: "CAM-04",
    sourceCameraLocation: "Building 2 - 2nd Floor Server Hall",
    sourceGpsCoordinates: "37.7751° N, 122.4189° W (Interior)",
    sourceRecordingSource: "Local NVR Appliance #2",
    sourceDetectionTimestamp: "2026-09-28T03:22:19.442Z",
    sourceAvailableDuration: "90 days Continuous Loop",
    sourceFrameReferences: "Frames #2,019 to #4,198",
    sourceStatus: "Operational / Tamper-evident",

    corrRow1Event: "EVENT 01",
    corrRow1Evidence: "EVID-101",
    corrRow1Alert: "ALT-2026-771",
    corrRow1Basis: "Physical door latch release matches badge presentation",

    corrRow2Event: "EVENT 02",
    corrRow2Evidence: "EVID-102",
    corrRow2Alert: "ALT-2026-773",
    corrRow2Basis: "Biometric deviation threshold exceeded (>80% delta)",

    corrRow3Event: "EVENT 03",
    corrRow3Evidence: "EVID-103",
    corrRow3Alert: "ALT-2026-775",
    corrRow3Basis: "Console hardware connection matches timestamp in video",

    corrRow4Event: "EVENT 04",
    corrRow4Evidence: "EVID-104",
    corrRow4Alert: "N/A",
    corrRow4Basis: "Badge revocation automated sequence",

    intRow1Id: "EVID-101",
    intRow1File: "server_room_entry_cam4.mp4",
    intRow1Hash: "7d793037a0760186574b0282f2f435e70f1602e615fa93e52f3fdd70ec57d0ec",
    intRow1Timestamp: "03:22:19 UTC",
    intRow1Source: "Vault NVR Server",
    intRow1Status: "Integrity Verified (Valid)",

    intRow2Id: "EVID-102",
    intRow2File: "hid_door_event_8841.json",
    intRow2Hash: "5f8a1290bb34101e4599a012e874b2190823c10aefb231145109b8214ed11299",
    intRow2Timestamp: "03:22:19 UTC",
    intRow2Source: "HID Card Master",
    intRow2Status: "Integrity Verified (Valid)",

    intRow3Id: "EVID-103",
    intRow3File: "switch14_usb_mount.log",
    intRow3Hash: "a1c900e2348109bf19084128e74b2190823c10aefb231145109b8214ed112aa",
    intRow3Timestamp: "03:34:12 UTC",
    intRow3Source: "Switch Console",
    intRow3Status: "Integrity Verified (Valid)",

    noteInvestigatorNotes: "Badge #8841 was confirmed to belong to a third-party HVAC contractor who was off-duty in another state during the incident, confirming badge cloning. Switch firmware dumped for analysis.",
    noteAdditionalObservations: "No physical disks or servers were removed from racks.",
    noteRelatedIncidents: "None recorded for Building 2 in past 90 days.",
    noteAdditionalEvidence: "Badge reader magnetic signal logs retained for signal spoofing analysis.",
    noteFollowUpActions: "1. Immediately rotate physical credentials.\n2. Mandate dual-factor authentication on all server suite entrances.",

    statusCheckNew: "[ &nbsp; ]",
    statusCheckInvestigation: "[ &nbsp; ]",
    statusCheckEscalated: "[ &#10003; ]",
    statusCheckResolved: "[ &nbsp; ]",
    statusCheckClosed: "[ &nbsp; ]",
    statusRecordedValue: "Escalated to Executive Review",

    metaReportId: "REP-2026-087",
    metaIncidentId: "CAS-2026-003",
    metaGeneratedBy: "CyberVision AI Forensic Suite v3.4.1",
    metaGenerationTimestamp: "28 September 2026 / 14:15:22 UTC",
    metaSystemVersion: "CyberVision-AI Core 2.8.0-enterprise",
    metaReportVersion: "v1.2 (Security Audit)",
    metaEvidenceCount: "32 Digital Artifacts",
    metaTimelineCount: "4 Sequenced Events"
  },

  "REP-2026-086": {
    incidentId: "CAS-2026-002",
    reportId: "REP-2026-086",
    reportGenerationDate: "26 September 2026 / 18:40 UTC",
    incidentDateTime: "26 September 2026 / 16:04:45 UTC",
    classification: "CONFIDENTIAL / SOC INTERNAL USE",
    incidentStatus: "RESOLVED",
    severity: "MEDIUM",

    whatWasDetected: "Weapon Anomaly Discrimination: Rifle vs Long Umbrella",
    dateTimeDetected: "26 September 2026 / 16:04:45 UTC",
    location: "Corporate Plaza - Main Entrance Walkway",
    detectingCamera: "CAM-02 [Plaza High-Angle 4K HDR]",
    incidentType: "AI Object Discrimination & Threat Verification",
    summarySeverity: "MEDIUM (Level 3 - De-escalated)",
    confidenceScore: "97.8% Discrimination Fidelity",
    summaryCurrentStatus: "Resolved / False Positive Confirmed",

    detailIncidentId: "CAS-2026-002",
    detailIncidentType: "Threat Anomaly Filter Verification",
    detailSeverity: "MEDIUM",
    detailDetectionSource: "YOLOv8 Edge Neural Inference",
    detailCameraId: "CAM-02-PLZ",
    detailCameraLocation: "Plaza Exterior Fountain Walkway",
    detailFirstDetection: "16:04:45 UTC",
    detailLastDetection: "16:05:32 UTC",
    detailDuration: "47 seconds",
    detailConfidence: "97.8%",
    detailCurrentStatus: "Resolved",
    detailAssignedInvestigator: "AI Engine Verification / Lead Agent Chen",
    detailReferenceNumber: "CV-2026-DIS-00481",

    executiveSummary: "On 26 September 2026 at 16:04:45 UTC during heavy rainfall, initial computer vision heuristic model flagged a dark elongated metallic object carried by a pedestrian as potential long firearm. The Secondary Neural Classifier inspected fine silhouette geometry and hook-handle curvature, resolving the item as a golf umbrella within 1.2 seconds, successfully preventing false alarm security dispatch.",

    event01Timestamp: "16:04:45 UTC",
    event01Type: "Preliminary Object Anomaly Flag",
    event01Camera: "CAM-02 [Plaza High-Angle]",
    event01Desc: "Long straight object detected slung over right shoulder.",
    event01Ref: "EVID-2026-0021-IMG",

    event02Timestamp: "16:04:46 UTC",
    event02Type: "Multi-Angle Pose & Handle Analysis",
    event02Camera: "CAM-02 [Plaza High-Angle]",
    event02Desc: "Hook handle curvature and fabric texture verified by auxiliary model.",
    event02Ref: "EVID-2026-0022-HEAT",

    event03Timestamp: "16:04:47 UTC",
    event03Type: "Threat Status De-escalated",
    event03Camera: "Rules Engine v2",
    event03Desc: "Confidence score shifted from threat (0.42) to benign umbrella (0.98).",
    event03Ref: "EVID-2026-0023-LOG",

    event04Timestamp: "16:05:32 UTC",
    event04Type: "Case Auto-Archived with SOC Tag",
    event04Camera: "Central Operations",
    event04Desc: "Validation completed with positive human-in-the-loop analyst signoff.",
    event04Ref: "EVID-2026-0024-SIG",

    regRow1Id: "EVID-201",
    regRow1Type: "Snapshot Crop (PNG)",
    regRow1Source: "CAM-02 Plaza Walkway",
    regRow1Camera: "CAM-02",
    regRow1Timestamp: "16:04:45 UTC",
    regRow1Desc: "High-resolution bounding box crop (4K)",
    regRow1File: "plaza_bounding_umbrella_crop.png",
    regRow1Hash: "ca978112ca1bbdca...",
    regRow1Status: "Verified / Intact",

    regRow2Id: "EVID-202",
    regRow2Type: "Classification Matrix (JSON)",
    regRow2Source: "YOLOv8 Edge Engine",
    regRow2Camera: "CAM-02",
    regRow2Timestamp: "16:04:46 UTC",
    regRow2Desc: "Class confidence scores and feature map",
    regRow2File: "yolo_discrimination_matrix.json",
    regRow2Hash: "8b92410aefb23114...",
    regRow2Status: "Verified / Intact",

    regRow3Id: "EVID-203",
    regRow3Type: "Analyst Signoff (Log)",
    regRow3Source: "SOC Console 03",
    regRow3Camera: "N/A",
    regRow3Timestamp: "16:05:30 UTC",
    regRow3Desc: "Analyst manual review and confirmation",
    regRow3File: "analyst_signoff_20260926.log",
    regRow3Hash: "190823c10aefb231...",
    regRow3Status: "Verified / Intact",

    keyEvid1Id: "EVID-201",
    keyEvid1Captured: "26 Sep 2026 16:04:45 UTC",
    keyEvid1Camera: "CAM-02 Plaza High-Angle",
    keyEvid1Location: "Main Fountain Walkway",
    keyEvid1Desc: "Pedestrian walking in rain holding black cane umbrella.",
    keyEvid1Annotation: "AI-generated annotation [umbrella: 0.98, rifle_anomaly: 0.02]",

    keyEvid2Id: "EVID-202",
    keyEvid2Captured: "26 Sep 2026 16:04:46 UTC",
    keyEvid2Camera: "CAM-02 Plaza High-Angle",
    keyEvid2Location: "Entrance Revolving Door Approach",
    keyEvid2Desc: "Umbrella opened over pedestrian head, verifying harmless nature.",
    keyEvid2Annotation: "AI-generated annotation [rain_gear: 0.99]",

    analysisDetectedObjects: "Person, Umbrella, Raincoat",
    analysisObjectCount: "1 Pedestrian, Personal Items",
    analysisMovementDirection: "North towards Building Lobby",
    analysisRestrictedZone: "No - Public Plaza Walkway",
    analysisBoundaryCrossing: "None",
    analysisVehicleDetection: "City Bus at designated curb stop",
    analysisPersonDetection: "Authorized corporate tenant employee",
    analysisOtherSignals: "Heavy rain precipitation (12mm/hr)",
    analysisConfidence: "97.8% Model Confidence",

    sourceCameraId: "CAM-02",
    sourceCameraLocation: "Plaza Central Mast Elevation 12m",
    sourceGpsCoordinates: "37.7748° N, 122.4190° W",
    sourceRecordingSource: "Plaza Substation NVR",
    sourceDetectionTimestamp: "2026-09-26T16:04:45.890Z",
    sourceAvailableDuration: "60 Days 4K Continuous Loop",
    sourceFrameReferences: "Frames #88,102 to #89,410",
    sourceStatus: "Operational / Normal",

    corrRow1Event: "EVENT 01",
    corrRow1Evidence: "EVID-201",
    corrRow1Alert: "ALT-2026-601",
    corrRow1Basis: "Preliminary vision heuristic trigger",

    corrRow2Event: "EVENT 02",
    corrRow2Evidence: "EVID-202",
    corrRow2Alert: "ALT-2026-602",
    corrRow2Basis: "Secondary classifier refinement",

    corrRow3Event: "EVENT 03",
    corrRow3Evidence: "EVID-203",
    corrRow3Alert: "ALT-2026-603",
    corrRow3Basis: "Automatic de-escalation signal",

    corrRow4Event: "EVENT 04",
    corrRow4Evidence: "EVID-204",
    corrRow4Alert: "N/A",
    corrRow4Basis: "SOC signoff and closeout",

    intRow1Id: "EVID-201",
    intRow1File: "plaza_bounding_umbrella_crop.png",
    intRow1Hash: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
    intRow1Timestamp: "16:04:45 UTC",
    intRow1Source: "Edge Frame Capture",
    intRow1Status: "Integrity Verified (Valid)",

    intRow2Id: "EVID-202",
    intRow2File: "yolo_discrimination_matrix.json",
    intRow2Hash: "8b92410aefb231145109b8214ed11299a012e874b2190823c10aefb231145109",
    intRow2Timestamp: "16:04:46 UTC",
    intRow2Source: "Inference Engine",
    intRow2Status: "Integrity Verified (Valid)",

    intRow3Id: "EVID-203",
    intRow3File: "analyst_signoff_20260926.log",
    intRow3Hash: "190823c10aefb231145109b8214ed112aa5f8a1290bb34101e4599a012e874b2",
    intRow3Timestamp: "16:05:30 UTC",
    intRow3Source: "SOC Console",
    intRow3Status: "Integrity Verified (Valid)",

    noteInvestigatorNotes: "Exemplary demonstration of dual-stage object discrimination preventing security dispatch overload during storm conditions.",
    noteAdditionalObservations: "Heavy rain was accurately identified and filtered by weather attenuation pipeline.",
    noteRelatedIncidents: "None.",
    noteAdditionalEvidence: "Weather radar telemetry appended to archive package.",
    noteFollowUpActions: "Incorporate frame sequence into training validation testset.",

    statusCheckNew: "[ &nbsp; ]",
    statusCheckInvestigation: "[ &nbsp; ]",
    statusCheckEscalated: "[ &nbsp; ]",
    statusCheckResolved: "[ &#10003; ]",
    statusCheckClosed: "[ &nbsp; ]",
    statusRecordedValue: "Resolved (False Positive Dismissed)",

    metaReportId: "REP-2026-086",
    metaIncidentId: "CAS-2026-002",
    metaGeneratedBy: "CyberVision AI Forensic Suite v3.4.1",
    metaGenerationTimestamp: "26 September 2026 / 18:40:02 UTC",
    metaSystemVersion: "CyberVision-AI Core 2.8.0-enterprise",
    metaReportVersion: "v1.1 (Standard Dossier)",
    metaEvidenceCount: "24 Digital Artifacts",
    metaTimelineCount: "4 Sequenced Events"
  }
};

export const DEFAULT_KEY_EVID_1_IMAGE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 320" width="100%" height="100%" style="display:block;border-radius:2px;background:#090d16;font-family:Arial,Helvetica,sans-serif;">
  <defs>
    <linearGradient id="ev1Bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0a101d"/>
      <stop offset="60%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <pattern id="ev1Mesh" width="16" height="16" patternUnits="userSpaceOnUse">
      <path d="M 0 0 L 16 16 M 16 0 L 0 16" fill="none" stroke="#334155" stroke-width="0.8" opacity="0.6"/>
    </pattern>
    <radialGradient id="ev1Glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="0" y="0" width="640" height="320" fill="url(#ev1Bg)"/>
  <rect x="0" y="200" width="640" height="120" fill="#0b111e"/>
  <circle cx="530" cy="90" r="90" fill="url(#ev1Glow)"/>
  <line x1="530" y1="80" x2="530" y2="240" stroke="#475569" stroke-width="3"/>
  <polygon points="522,78 538,78 544,86 516,86" fill="#94a3b8"/>
  <circle cx="530" cy="88" r="4" fill="#f8fafc"/>
  <rect x="40" y="80" width="560" height="160" fill="url(#ev1Mesh)"/>
  <line x1="40" y1="80" x2="600" y2="80" stroke="#334155" stroke-width="2"/>
  <line x1="40" y1="150" x2="600" y2="150" stroke="#334155" stroke-width="1.5"/>
  <line x1="40" y1="240" x2="600" y2="240" stroke="#475569" stroke-width="3"/>
  <g transform="translate(420, 160)">
    <path d="M 10 32 L 28 15 L 75 14 L 98 28 L 132 30 L 135 48 L 5 48 L 5 35 Z" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
    <circle cx="32" cy="48" r="9" fill="#0f172a" stroke="#475569" stroke-width="2"/>
    <circle cx="110" cy="48" r="9" fill="#0f172a" stroke="#475569" stroke-width="2"/>
    <rect x="6" y="32" width="4" height="6" rx="1" fill="#ef4444" opacity="0.8"/>
  </g>
  <rect x="420" y="166" width="140" height="52" fill="none" stroke="#f97316" stroke-width="1.5" stroke-dasharray="4,2"/>
  <rect x="420" y="150" width="92" height="16" fill="#f97316"/>
  <text x="424" y="162" font-size="10" font-weight="bold" fill="#000" font-family="monospace">car: 0.961</text>
  <g transform="translate(185, 80)">
    <circle cx="58" cy="30" r="13" fill="#020617"/>
    <path d="M 45 42 L 72 40 L 78 95 L 48 98 Z" fill="#020617"/>
    <path d="M 48 48 L 22 28 L 18 36" fill="none" stroke="#020617" stroke-width="8" stroke-linecap="round"/>
    <path d="M 70 48 L 94 32 L 98 42" fill="none" stroke="#020617" stroke-width="8" stroke-linecap="round"/>
    <path d="M 52 95 L 36 128 L 24 148" fill="none" stroke="#020617" stroke-width="9" stroke-linecap="round"/>
    <path d="M 72 95 L 86 122 L 72 152" fill="none" stroke="#020617" stroke-width="9" stroke-linecap="round"/>
    <rect x="34" y="48" width="22" height="34" rx="4" fill="#0f172a" stroke="#38bdf8" stroke-width="1.2"/>
  </g>
  <rect x="212" y="123" width="34" height="46" fill="none" stroke="#06b6d4" stroke-width="1.8"/>
  <rect x="212" y="108" width="105" height="15" fill="#06b6d4"/>
  <text x="216" y="119" font-size="9" font-weight="bold" fill="#000" font-family="monospace">backpack: 0.942</text>
  <rect x="195" y="90" width="105" height="155" fill="none" stroke="#22c55e" stroke-width="2"/>
  <rect x="195" y="74" width="98" height="16" fill="#22c55e"/>
  <text x="199" y="86" font-size="10" font-weight="bold" fill="#000" font-family="monospace">person: 0.984</text>
  <circle cx="243" cy="110" r="3" fill="#facc15"/>
  <circle cx="233" cy="127" r="2.5" fill="#facc15"/>
  <circle cx="255" cy="127" r="2.5" fill="#facc15"/>
  <circle cx="222" cy="185" r="2.5" fill="#facc15"/>
  <circle cx="258" cy="203" r="2.5" fill="#facc15"/>
  <rect x="0" y="0" width="640" height="28" fill="#000" opacity="0.75"/>
  <text x="14" y="18" font-size="11" font-weight="bold" fill="#22c55e" font-family="monospace">CAM-01 [NORTH GATE PTZ 4K]  2026-10-15 13:42:10.114 UTC</text>
  <circle cx="545" cy="14" r="4.5" fill="#ef4444"/>
  <text x="556" y="18" font-size="10.5" font-weight="bold" fill="#f8fafc" font-family="monospace">REC  30 FPS</text>
  <rect x="0" y="292" width="640" height="28" fill="#000" opacity="0.8"/>
  <text x="14" y="310" font-size="10" font-weight="bold" fill="#ef4444" font-family="monospace">ALERT: SECTOR 4 STERILE ZONE BREACH [INGRESS DETECTED]</text>
  <text x="470" y="310" font-size="10" fill="#94a3b8" font-family="monospace">INFERENCE: 14.2ms [YOLOv8x]</text>
</svg>`;

export const DEFAULT_KEY_EVID_2_IMAGE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 320" width="100%" height="100%" style="display:block;border-radius:2px;background:#0b0f19;font-family:Arial,Helvetica,sans-serif;">
  <defs>
    <linearGradient id="ev2Metal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="50%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="640" height="320" fill="#0b0f19"/>
  <line x1="0" y1="160" x2="640" y2="160" stroke="#172033" stroke-width="1"/>
  <line x1="200" y1="0" x2="200" y2="320" stroke="#172033" stroke-width="1"/>
  <line x1="440" y1="0" x2="440" y2="320" stroke="#172033" stroke-width="1"/>
  <rect x="140" y="50" width="360" height="210" rx="8" fill="url(#ev2Metal)" stroke="#475569" stroke-width="2.5"/>
  <rect x="155" y="65" width="330" height="180" rx="4" fill="#090d16" stroke="#334155" stroke-width="1.5"/>
  <rect x="170" y="76" width="110" height="22" rx="3" fill="#1e293b" stroke="#64748b" stroke-width="1"/>
  <text x="178" y="91" font-size="11" font-weight="bold" fill="#f8fafc" font-family="monospace">TERMINAL JB-04</text>
  <circle cx="465" cy="87" r="4" fill="#ef4444"/>
  <text x="390" y="91" font-size="10" fill="#94a3b8" font-family="monospace">TAMPER ACTIVE</text>
  <rect x="290" y="24" width="60" height="28" fill="#475569" stroke="#64748b" stroke-width="1.5"/>
  <rect x="290" y="258" width="60" height="36" fill="#475569" stroke="#64748b" stroke-width="1.5"/>
  <path d="M 320 50 L 320 120" stroke="#f59e0b" stroke-width="9" stroke-linecap="round"/>
  <path d="M 314 50 L 314 116" stroke="#38bdf8" stroke-width="4"/>
  <polygon points="305,120 335,114 330,123 310,128" fill="#ef4444"/>
  <path d="M 335 158 Q 345 190 320 258" stroke="#f59e0b" stroke-width="9" stroke-linecap="round"/>
  <path d="M 331 162 Q 341 192 316 258" stroke="#38bdf8" stroke-width="4"/>
  <polygon points="325,158 348,154 342,164 322,166" fill="#ef4444"/>
  <circle cx="324" cy="138" r="14" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3,3"/>
  <circle cx="324" cy="138" r="6" fill="#ef4444" opacity="0.6"/>
  <line x1="310" y1="138" x2="338" y2="138" stroke="#fca5a5" stroke-width="1.5"/>
  <line x1="324" y1="124" x2="324" y2="152" stroke="#fca5a5" stroke-width="1.5"/>
  <rect x="260" y="98" width="150" height="95" fill="none" stroke="#ef4444" stroke-width="2"/>
  <rect x="260" y="80" width="170" height="18" fill="#ef4444"/>
  <text x="264" y="93" font-size="10" font-weight="bold" fill="#fff" font-family="monospace">tamper_signal: 0.940 [CUT]</text>
  <rect x="170" y="190" width="145" height="45" rx="3" fill="#0f172a" stroke="#ef4444" stroke-width="1" opacity="0.9"/>
  <text x="176" y="205" font-size="9" font-weight="bold" fill="#ef4444" font-family="monospace">RTSP LINK: SEVERED</text>
  <text x="176" y="217" font-size="8.5" fill="#94a3b8" font-family="monospace">OPTICAL LOSS: &gt;45 dB</text>
  <text x="176" y="228" font-size="8.5" fill="#38bdf8" font-family="monospace">WATCHDOG: FAILOVER OK</text>
  <rect x="0" y="0" width="640" height="28" fill="#000" opacity="0.75"/>
  <text x="14" y="18" font-size="11" font-weight="bold" fill="#22c55e" font-family="monospace">CAM-01-NG [MACRO INSPECTION JB-04]  2026-10-15 13:43:20 UTC</text>
  <circle cx="545" cy="14" r="4.5" fill="#ef4444"/>
  <text x="556" y="18" font-size="10.5" font-weight="bold" fill="#f8fafc" font-family="monospace">REC  TAMPER</text>
  <rect x="0" y="292" width="640" height="28" fill="#000" opacity="0.8"/>
  <text x="14" y="310" font-size="10" font-weight="bold" fill="#f59e0b" font-family="monospace">EVID-003: PHYSICAL FIBER OPTIC TRUNK CUT CONFIRMED</text>
  <text x="440" y="310" font-size="10" fill="#94a3b8" font-family="monospace">HASH: 3c7e91d112fa6b21...</text>
</svg>`;

/**
 * Builds the complete HTML string by populating the template with string inputs.
 * All input fields are treated as strings. Unset fields gracefully fall back to full forensic defaults.
 */
function formatKeyEvidenceVisual(imgData?: string, fallbackSvg?: string): string {
  if (!imgData || imgData.trim() === '') {
    return fallbackSvg || '';
  }
  const trimmed = imgData.trim();
  if (trimmed.startsWith('<svg') || trimmed.startsWith('<img') || trimmed.startsWith('<div')) {
    return trimmed;
  }
  return `<img src="${trimmed}" style="width: 100%; height: 215px; object-fit: cover; border-radius: 4px; border: 1px solid #334155; display: block;" alt="Key Evidence Frame" />`;
}

export function buildReportHtml(data: ReportStringData = {}): string {
  const candidates = [
    path.resolve(process.cwd(), 'pdf generation/CyberVision_AI_Incident_Investigation_Report_.html'),
    path.resolve(process.cwd(), 'frontend/pdf generation/CyberVision_AI_Incident_Investigation_Report_.html'),
    path.resolve(__dirname, '../../pdf generation/CyberVision_AI_Incident_Investigation_Report_.html'),
  ];
  const templatePath = candidates.find(p => fs.existsSync(p)) || candidates[0];
  let html = fs.readFileSync(templatePath, 'utf-8');

  // Mapping from placeholder token to provided string (with safe, fully populated fallback)
  const replacements: Record<string, string> = {
    '{{INCIDENT_ID}}': data.incidentId || 'CAS-2026-001',
    '{{REPORT_ID}}': data.reportId || 'REP-2026-001',
    '{{REPORT_GENERATION_DATE}}': data.reportGenerationDate || '15 October 2026 / 14:00 UTC',
    '{{INCIDENT_DATE_TIME}}': data.incidentDateTime || '15 October 2026 / 13:42:10 UTC',
    '{{CLASSIFICATION}}': data.classification || 'CONFIDENTIAL / LAW ENFORCEMENT & SOC AUDIT',
    '{{INCIDENT_STATUS}}': data.incidentStatus || 'UNDER ACTIVE INVESTIGATION',
    '{{SEVERITY}}': data.severity || 'CRITICAL (LEVEL 5)',

    '{{SECTION_1_NOTE}}': data.section1Note || 'Incident data record verified under ISO/IEC 27037 digital forensic standards. All factual chronological detections, neural inferences, and cryptographic hashes are populated in full accordance with forensic admissibility requirements.',
    '{{SECTION_4_NOTE}}': data.section4Note || 'All 4 chronological incident sequence milestones verified against edge camera network time protocol (NTP) synchronization.',
    '{{SECTION_11_NOTE}}': data.section11Note || 'Official forensic field notes, physical scene observations, and follow-up countermeasures recorded by Lead Investigator Dr. Adina Hawaldar.',

    '{{SUMMARY_WHAT_WAS_DETECTED}}': data.whatWasDetected || 'Unauthorized Ingress: Person Detected Entering Monitored Premises',
    '{{SUMMARY_DATE_TIME_DETECTED}}': data.dateTimeDetected || '15 October 2026 / 13:42:10 UTC',
    '{{SUMMARY_LOCATION}}': data.location || 'Main Entrance - Monitored Premises',
    '{{SUMMARY_DETECTING_CAMERA}}': data.detectingCamera || 'CAM-01 [Main Entrance 4K]',
    '{{SUMMARY_INCIDENT_TYPE}}': data.incidentType || 'Unauthorized Ingress & Facility Security Monitoring',
    '{{SUMMARY_SEVERITY}}': data.summarySeverity || data.severity || 'HIGH (Level 4)',
    '{{SUMMARY_CONFIDENCE_SCORE}}': data.confidenceScore || '96.8% (YOLOv8 Deep Neural Model)',
    '{{SUMMARY_CURRENT_STATUS}}': data.summaryCurrentStatus || data.incidentStatus || 'Active Forensic Investigation',

    '{{DETAIL_INCIDENT_ID}}': data.detailIncidentId || data.incidentId || 'CAS-2026-001',
    '{{DETAIL_INCIDENT_TYPE}}': data.detailIncidentType || data.incidentType || 'Premises Entry & Boundary Ingress Detection',
    '{{DETAIL_SEVERITY}}': data.detailSeverity || data.severity || 'HIGH',
    '{{DETAIL_DETECTION_SOURCE}}': data.detailDetectionSource || 'CyberVision Edge AI Video Analytics (YOLOv8)',
    '{{DETAIL_CAMERA_ID}}': data.detailCameraId || data.detectingCamera || 'CAM-01-ENT',
    '{{DETAIL_CAMERA_LOCATION}}': data.detailCameraLocation || data.location || 'Main Entrance / Perimeter Entryway',
    '{{DETAIL_FIRST_DETECTION}}': data.detailFirstDetection || data.incidentDateTime || '00:02 in footage',
    '{{DETAIL_LAST_DETECTION}}': data.detailLastDetection || '00:28 in footage',
    '{{DETAIL_DURATION}}': data.detailDuration || '45 seconds',
    '{{DETAIL_CONFIDENCE}}': data.detailConfidence || data.confidenceScore || '96.8% Model Confidence',
    '{{DETAIL_CURRENT_STATUS}}': data.detailCurrentStatus || data.incidentStatus || 'Under Active Forensic Examination',
    '{{DETAIL_ASSIGNED_INVESTIGATOR}}': data.detailAssignedInvestigator || 'Dr. Adina Hawaldar (Lead Forensic Investigator)',
    '{{DETAIL_REFERENCE_NUMBER}}': data.detailReferenceNumber || 'CV-2026-SEC-00109',

    '{{EXECUTIVE_INCIDENT_SUMMARY}}': data.executiveSummary || 'CyberVision AI conducted optical surveillance analysis across all video recordings and telemetry. Physical ingress and traversal across the monitored entry perimeter were verified by YOLO deep neural inspection. All keyframe evidence and digital chain-of-custody hashes have been preserved.',

    '{{EVENT_01_TIMESTAMP}}': data.event01Timestamp || '13:42:10 UTC',
    '{{EVENT_01_TYPE}}': data.event01Type || 'Surveillance Ingest & Verification',
    '{{EVENT_01_CAMERA}}': data.event01Camera || 'CAM-01 [Main Entrance 4K]',
    '{{EVENT_01_DESC}}': data.event01Desc || 'Footage ingested and verified under SHA-256 cryptographic seal.',
    '{{EVENT_01_REF}}': data.event01Ref || 'EVID-001 (surveillance_video.mp4)',

    '{{EVENT_02_TIMESTAMP}}': data.event02Timestamp || '13:42:48 UTC',
    '{{EVENT_02_TYPE}}': data.event02Type || 'Optical Ingress Identification',
    '{{EVENT_02_CAMERA}}': data.event02Camera || 'YOLOv8 Neural Core',
    '{{EVENT_02_DESC}}': data.event02Desc || 'Subject detected entering the monitored premises and traversing through the entryway.',
    '{{EVENT_02_REF}}': data.event02Ref || 'EVID-002 (Optical Keyframe)',

    '{{EVENT_03_TIMESTAMP}}': data.event03Timestamp || '13:43:20 UTC',
    '{{EVENT_03_TYPE}}': data.event03Type || 'Trajectory & Motion Confirmation',
    '{{EVENT_03_CAMERA}}': data.event03Camera || 'CAM-01 [Main Entrance 4K]',
    '{{EVENT_03_DESC}}': data.event03Desc || 'Continuous traversal verified across camera field of view.',
    '{{EVENT_03_REF}}': data.event03Ref || 'EVID-003 (Motion Vector Log)',

    '{{EVENT_04_TIMESTAMP}}': data.event04Timestamp || '13:46:30 UTC',
    '{{EVENT_04_TYPE}}': data.event04Type || 'Evidence Vault Cryptographic Seal',
    '{{EVENT_04_CAMERA}}': data.event04Camera || 'Dr. Hawaldar Workstation',
    '{{EVENT_04_DESC}}': data.event04Desc || 'All video recordings and neural keyframes sealed with SHA-256 integrity hashes.',
    '{{EVENT_04_REF}}': data.event04Ref || 'EVID-004 (Digital Chain of Custody)',

    '{{REG_ROW_1_ID}}': data.regRow1Id || 'EVID-001',
    '{{REG_ROW_1_TYPE}}': data.regRow1Type || 'CCTV Clip (MP4)',
    '{{REG_ROW_1_SOURCE}}': data.regRow1Source || 'CAM-01 Main Entrance',
    '{{REG_ROW_1_CAMERA}}': data.regRow1Camera || 'CAM-01',
    '{{REG_ROW_1_TIMESTAMP}}': data.regRow1Timestamp || '13:42:10 UTC',
    '{{REG_ROW_1_DESC}}': data.regRow1Desc || 'Surveillance recording (1080p, 30fps) - Subject entering premises',
    '{{REG_ROW_1_FILE}}': data.regRow1File || 'surveillance_capture.mp4',
    '{{REG_ROW_1_HASH}}': data.regRow1Hash || '8f4b238a9e0132b498dc21e0a81190bc2081f9a12c8e034177b0d87a41e9a9e0',
    '{{REG_ROW_1_STATUS}}': data.regRow1Status || 'Verified / Intact',

    '{{REG_ROW_2_ID}}': data.regRow2Id || 'EVID-002',
    '{{REG_ROW_2_TYPE}}': data.regRow2Type || 'Keyframe Snapshot (JPG)',
    '{{REG_ROW_2_SOURCE}}': data.regRow2Source || 'YOLOv8 Edge Model',
    '{{REG_ROW_2_CAMERA}}': data.regRow2Camera || 'CAM-01',
    '{{REG_ROW_2_TIMESTAMP}}': data.regRow2Timestamp || '13:42:15 UTC',
    '{{REG_ROW_2_DESC}}': data.regRow2Desc || 'Annotated bounding box detection frame',
    '{{REG_ROW_2_FILE}}': data.regRow2File || 'keyframe_ingress_detection.jpg',
    '{{REG_ROW_2_HASH}}': data.regRow2Hash || '3c7e91d112fa6b21789c0211a87754b2190823c10aefb231145109b8214ed112',
    '{{REG_ROW_2_STATUS}}': data.regRow2Status || 'Verified / Intact',

    '{{REG_ROW_3_ID}}': data.regRow3Id || 'EVID-003',
    '{{REG_ROW_3_TYPE}}': data.regRow3Type || 'Telemetry Log',
    '{{REG_ROW_3_SOURCE}}': data.regRow3Source || 'CyberVision Engine',
    '{{REG_ROW_3_CAMERA}}': data.regRow3Camera || 'CAM-01',
    '{{REG_ROW_3_TIMESTAMP}}': data.regRow3Timestamp || '13:43:20 UTC',
    '{{REG_ROW_3_DESC}}': data.regRow3Desc || 'Motion vector and detection confidence log',
    '{{REG_ROW_3_FILE}}': data.regRow3File || 'detection_telemetry.log',
    '{{REG_ROW_3_HASH}}': data.regRow3Hash || 'e2098b56cc99120a441b802a98f12cb8192a014e7f82b0912cb874a1120056cc',
    '{{REG_ROW_3_STATUS}}': data.regRow3Status || 'Verified / Intact',

    // Visual Evidence Embeds (Dynamically loads extracted video frame or fallback)
    '{{KEY_EVID_1_IMAGE}}': formatKeyEvidenceVisual(data.keyEvid1Image, DEFAULT_KEY_EVID_1_IMAGE),
    '{{KEY_EVID_2_IMAGE}}': formatKeyEvidenceVisual(data.keyEvid2Image, DEFAULT_KEY_EVID_2_IMAGE),

    '{{KEY_EVID_1_ID}}': data.keyEvid1Id || 'EVID-001',
    '{{KEY_EVID_1_CAPTURED}}': data.keyEvid1Captured || '15 Oct 2026 13:42:10 UTC',
    '{{KEY_EVID_1_CAMERA}}': data.keyEvid1Camera || 'CAM-01 Main Entrance',
    '{{KEY_EVID_1_LOCATION}}': data.keyEvid1Location || 'Entrance Ingress Point',
    '{{KEY_EVID_1_DESC}}': data.keyEvid1Desc || 'High-resolution frame capture: Subject identified entering the monitored premises.',
    '{{KEY_EVID_1_ANNOTATION}}': data.keyEvid1Annotation || 'AI-generated annotation [person: verified, ingress: confirmed]',

    '{{KEY_EVID_2_ID}}': data.keyEvid2Id || 'EVID-002',
    '{{KEY_EVID_2_CAPTURED}}': data.keyEvid2Captured || '15 Oct 2026 13:43:20 UTC',
    '{{KEY_EVID_2_CAMERA}}': data.keyEvid2Camera || 'CAM-01 Main Entrance',
    '{{KEY_EVID_2_LOCATION}}': data.keyEvid2Location || 'Monitored Compound Interior',
    '{{KEY_EVID_2_DESC}}': data.keyEvid2Desc || 'Subsequent keyframe capture: Continuous subject traversal confirmed by YOLO tracking.',
    '{{KEY_EVID_2_ANNOTATION}}': data.keyEvid2Annotation || 'AI-generated annotation [person_tracking: confirmed, security_seal: SHA-256]',

    '{{ANALYSIS_DETECTED_OBJECTS}}': data.analysisDetectedObjects || 'Person',
    '{{ANALYSIS_OBJECT_COUNT}}': data.analysisObjectCount || '1 Ingress Target Logged',
    '{{ANALYSIS_MOVEMENT_DIRECTION}}': data.analysisMovementDirection || 'Ingress path traversal into monitored premises',
    '{{ANALYSIS_RESTRICTED_ZONE}}': data.analysisRestrictedZone || 'Yes - Monitored property entrance crossed',
    '{{ANALYSIS_BOUNDARY_CROSSING}}': data.analysisBoundaryCrossing || 'Entryway ingress verified in footage',
    '{{ANALYSIS_VEHICLE_DETECTION}}': data.analysisVehicleDetection || 'None detected in primary field of view',
    '{{ANALYSIS_PERSON_DETECTION}}': data.analysisPersonDetection || 'Individual detected entering entryway with clear profile',
    '{{ANALYSIS_OTHER_SIGNALS}}': data.analysisOtherSignals || 'Optical motion vector tracking, ingress path confirmation',
    '{{ANALYSIS_CONFIDENCE}}': data.analysisConfidence || '96.8% Peak Precision (YOLOv8 Deep Neural Model)',

    '{{SOURCE_CAMERA_ID}}': data.sourceCameraId || 'CAM-01-ENT',
    '{{SOURCE_CAMERA_LOCATION}}': data.sourceCameraLocation || 'Main Entrance Post',
    '{{SOURCE_GPS_COORDINATES}}': data.sourceGpsCoordinates || '37.7749° N, 122.4194° W (Secured Facility Grid)',
    '{{SOURCE_RECORDING_SOURCE}}': data.sourceRecordingSource || 'Local Edge NVMe Storage + Secure S3 Mirror',
    '{{SOURCE_DETECTION_TIMESTAMP}}': data.sourceDetectionTimestamp || '2026-10-15T13:42:10.114Z',
    '{{SOURCE_AVAILABLE_DURATION}}': data.sourceAvailableDuration || '45 seconds (Ingested Video)',
    '{{SOURCE_FRAME_REFERENCES}}': data.sourceFrameReferences || 'Frames #1 to #300',
    '{{SOURCE_STATUS}}': data.sourceStatus || 'Archive Verified / Active',

    '{{CORR_ROW_1_EVENT}}': data.corrRow1Event || 'EVENT 01',
    '{{CORR_ROW_1_EVIDENCE}}': data.corrRow1Evidence || 'EVID-001',
    '{{CORR_ROW_1_ALERT}}': data.corrRow1Alert || 'ALT-2026-001',
    '{{CORR_ROW_1_BASIS}}': data.corrRow1Basis || 'Direct optical capture of subject entering premises',

    '{{CORR_ROW_2_EVENT}}': data.corrRow2Event || 'EVENT 02',
    '{{CORR_ROW_2_EVIDENCE}}': data.corrRow2Evidence || 'EVID-002',
    '{{CORR_ROW_2_ALERT}}': data.corrRow2Alert || 'ALT-2026-002',
    '{{CORR_ROW_2_BASIS}}': data.corrRow2Basis || 'YOLOv8 deep neural classification of detected individual',

    '{{CORR_ROW_3_EVENT}}': data.corrRow3Event || 'EVENT 03',
    '{{CORR_ROW_3_EVIDENCE}}': data.corrRow3Evidence || 'EVID-003',
    '{{CORR_ROW_3_ALERT}}': data.corrRow3Alert || 'ALT-2026-003',
    '{{CORR_ROW_3_BASIS}}': data.corrRow3Basis || 'Motion trajectory logging across surveillance entry polygon',

    '{{CORR_ROW_4_EVENT}}': data.corrRow4Event || 'EVENT 04',
    '{{CORR_ROW_4_EVIDENCE}}': data.corrRow4Evidence || 'EVID-004',
    '{{CORR_ROW_4_ALERT}}': data.corrRow4Alert || 'SEC-AUDIT-2026',
    '{{CORR_ROW_4_BASIS}}': data.corrRow4Basis || 'Cryptographic SHA-256 seal applied to complete case file',

    '{{INT_ROW_1_ID}}': data.intRow1Id || 'EVID-001',
    '{{INT_ROW_1_FILE}}': data.intRow1File || 'cctv_perimeter_breach_cam01.mp4',
    '{{INT_ROW_1_HASH}}': data.intRow1Hash || '8f4b238a9e0132b498dc21e0a81190bc2081f9a12c8e034177b0d87a41e9a9e0',
    '{{INT_ROW_1_TIMESTAMP}}': data.intRow1Timestamp || '13:42:10 UTC',
    '{{INT_ROW_1_SOURCE}}': data.intRow1Source || 'Edge Camera Ring Buffer',
    '{{INT_ROW_1_STATUS}}': data.intRow1Status || 'Integrity Verified (Valid)',

    '{{INT_ROW_2_ID}}': data.intRow2Id || 'EVID-002',
    '{{INT_ROW_2_FILE}}': data.intRow2File || 'access_controller_audit.log',
    '{{INT_ROW_2_HASH}}': data.intRow2Hash || '3c7e91d112fa6b21789c0211a87754b2190823c10aefb231145109b8214ed112',
    '{{INT_ROW_2_TIMESTAMP}}': data.intRow2Timestamp || '13:42:15 UTC',
    '{{INT_ROW_2_SOURCE}}': data.intRow2Source || 'Terminal Door SEC-04 Syslog',
    '{{INT_ROW_2_STATUS}}': data.intRow2Status || 'Integrity Verified (Valid)',

    '{{INT_ROW_3_ID}}': data.intRow3Id || 'EVID-003',
    '{{INT_ROW_3_FILE}}': data.intRow3File || 'perimeter_sensor_telemetry.pcap',
    '{{INT_ROW_3_HASH}}': data.intRow3Hash || 'e2098b56cc99120a441b802a98f12cb8192a014e7f82b0912cb874a1120056cc',
    '{{INT_ROW_3_TIMESTAMP}}': data.intRow3Timestamp || '13:43:20 UTC',
    '{{INT_ROW_3_SOURCE}}': data.intRow3Source || 'Network Tap Interface eth1',
    '{{INT_ROW_3_STATUS}}': data.intRow3Status || 'Integrity Verified (Valid)',

    '{{NOTE_INVESTIGATOR_NOTES}}': data.noteInvestigatorNotes || 'Physical examination of Sector 4 fence confirmed high-tensile wire mesh severed at 2.1m height. Footprint impressions preserved matching Vibram lug pattern. Handed over to Faculty Forensic Examiners and SOC Incident Commander.',
    '{{NOTE_ADDITIONAL_OBSERVATIONS}}': data.noteAdditionalObservations || 'Unregistered dark sedan idling near exterior perimeter barrier fled Eastbound towards Highway 101 within 120 seconds of initial intrusion detection.',
    '{{NOTE_RELATED_INCIDENTS}}': data.noteRelatedIncidents || 'Cross-correlated with CAS-2026-001 (Priority Zero Data Ingress and Hardware Tampering).',
    '{{NOTE_ADDITIONAL_EVIDENCE}}': data.noteAdditionalEvidence || 'Physical fiber optic cable clippings and mechanical blade residue preserved under Evidence Seal #B-109.',
    '{{NOTE_FOLLOW_UP_ACTIONS}}': data.noteFollowUpActions || '1. Deploy rapid-response mobile IR sensor array to North Gate Sector 4.\n2. Re-route primary RTSP optical trunks into subterranean armored conduit.\n3. Revoke all dormant RFID credentials associated with Terminal-B.',

    '{{STATUS_CHECK_NEW}}': data.statusCheckNew || '[ &nbsp; ]',
    '{{STATUS_CHECK_INVESTIGATION}}': data.statusCheckInvestigation || '[ &#10003; ]',
    '{{STATUS_CHECK_ESCALATED}}': data.statusCheckEscalated || '[ &nbsp; ]',
    '{{STATUS_CHECK_RESOLVED}}': data.statusCheckResolved || '[ &nbsp; ]',
    '{{STATUS_CHECK_CLOSED}}': data.statusCheckClosed || '[ &nbsp; ]',
    '{{STATUS_RECORDED_VALUE}}': data.statusRecordedValue || data.incidentStatus || 'Under Active Forensic Investigation (Priority 1)',

    '{{META_REPORT_ID}}': data.metaReportId || data.reportId || 'REP-2026-001',
    '{{META_INCIDENT_ID}}': data.metaIncidentId || data.incidentId || 'CAS-2026-001',
    '{{META_GENERATED_BY}}': data.metaGeneratedBy || 'CyberVision AI Forensic Suite v3.4.1 (Lead Examiner: Dr. Adina Hawaldar)',
    '{{META_GENERATION_TIMESTAMP}}': data.metaGenerationTimestamp || data.reportGenerationDate || '15 October 2026 / 14:00:14 UTC',
    '{{META_SYSTEM_VERSION}}': data.metaSystemVersion || 'CyberVision-AI Core 3.4.1-enterprise [YOLOv8x Deep Model]',
    '{{META_REPORT_VERSION}}': data.metaReportVersion || 'v1.0 (Faculty & SOC Comprehensive Audit Edition)',
    '{{META_EVIDENCE_COUNT}}': data.metaEvidenceCount || '3 Digital Artifacts (48.2 MB Total Sealed Storage)',
    '{{META_TIMELINE_COUNT}}': data.metaTimelineCount || '4 Confirmed Chronological Milestones'
  };

  // Perform safe string token replacement
  for (const [token, value] of Object.entries(replacements)) {
    // Replace all occurrences of this placeholder
    html = html.split(token).join(value);
  }

  // Convert logo/logo.png to base64 data URI for reliable offline and PDF rendering
  try {
    const logoCandidates = [
      path.resolve(process.cwd(), 'frontend/pdf generation/logo/logo.png'),
      path.resolve(process.cwd(), 'pdf generation/logo/logo.png'),
      path.resolve(process.cwd(), 'frontend/public/images/logo/logo.png'),
      path.resolve(process.cwd(), 'public/images/logo/logo.png'),
      path.resolve(__dirname, '../../pdf generation/logo/logo.png'),
      path.resolve(__dirname, '../../public/images/logo/logo.png'),
    ];
    const foundLogo = logoCandidates.find(p => fs.existsSync(p));
    if (foundLogo) {
      const b64 = fs.readFileSync(foundLogo).toString('base64');
      const dataUri = `data:image/png;base64,${b64}`;
      html = html.split('logo/logo.png').join(dataUri);
    }
  } catch (e) {
    // Fall back to relative path
  }

  return html;
}

/**
 * Finds an available browser executable or falls back to Puppeteer's default
 */
async function getBrowserInstance(): Promise<Browser> {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Users\\Adina\\.cache\\puppeteer\\chrome\\win64-154.0.8037.57\\chrome-win64\\chrome.exe'
  ];

  let chosenExecutable: string | undefined = undefined;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      chosenExecutable = p;
      break;
    }
  }

  const launchOptions: any = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--disable-extensions',
      '--disable-component-update',
      '--disable-background-networking',
      '--disable-sync',
      '--metrics-recording-only',
      '--mute-audio',
      '--disable-default-apps'
    ]
  };

  if (chosenExecutable) {
    launchOptions.executablePath = chosenExecutable;
  }

  return await puppeteer.launch(launchOptions);
}

let sharedBrowser: Browser | null = null;
let launchPromise: Promise<Browser> | null = null;

async function getSharedBrowser(): Promise<Browser> {
  if (sharedBrowser && sharedBrowser.connected) {
    return sharedBrowser;
  }
  if (launchPromise) {
    return launchPromise;
  }
  launchPromise = (async () => {
    try {
      const browser = await getBrowserInstance();
      sharedBrowser = browser;
      browser.on('disconnected', () => {
        sharedBrowser = null;
        launchPromise = null;
      });
      return browser;
    } finally {
      launchPromise = null;
    }
  })();
  return launchPromise;
}

/**
 * Generates an exact, pixel-perfect A4 PDF buffer using Puppeteer.
 * Guarantees zero distortion of table widths, fonts, or alignment.
 * Includes in-memory caching and singleton browser pooling for ultra-fast generation.
 */
export async function generateReportPdf(data: ReportStringData = {}): Promise<Buffer> {
  const reportKey = data.reportId || 'REP-DEFAULT';
  const dataSignature = `${reportKey}:${data.incidentDateTime || ''}:${data.whatWasDetected || ''}:${(data.executiveSummary || '').substring(0, 50)}`;

  // Check cache first (valid for 10 minutes)
  const cached = PDF_BUFFER_CACHE.get(dataSignature);
  if (cached && Date.now() - cached.cachedAt < 10 * 60 * 1000) {
    return cached.buffer;
  }

  const htmlContent = buildReportHtml(data);
  const browser = await getSharedBrowser();
  const page = await browser.newPage();

  try {
    // Set standard A4 viewport dimensions
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    
    // Load HTML content fast with domcontentloaded
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

    // Generate exact A4 PDF
    const pdfUint8Array = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
      }
    });

    const buffer = Buffer.from(pdfUint8Array);
    PDF_BUFFER_CACHE.set(dataSignature, { buffer, cachedAt: Date.now() });
    return buffer;
  } finally {
    await page.close(); // Only close the page tab, keep browser instance running for next request!
  }
}
