# CyberVision AI - Digital Security Incident Investigation Report PDF Generation

This module provides pixel-perfect PDF report generation from the official [CyberVision_AI_Incident_Investigation_Report_.html](file:///d:/CyberVision-AI/pdf%20generation/CyberVision_AI_Incident_Investigation_Report_.html) template using **Puppeteer**.

---

## Key Features

1. **Exact Formatting & Alignment Preservation**:
   - Uses Puppeteer's headless Chromium renderer with `@page { size: A4; margin: 0; }` and `-webkit-print-color-adjust: exact`.
   - Preserves 100% of the table widths, border weights, cell paddings, typography (`Arial`, `12pt`, `9.5pt`, `8pt`), and multi-page alignment.
   - Zero layout shifts or element distortion compared to standard browser print dialogs.

2. **Input Fields Kept as Strings**:
   - All dynamic report values are parameterized as clean string tokens (e.g. `{{INCIDENT_ID}}`, `{{REPORT_ID}}`, `{{SEVERITY}}`, `{{SUMMARY_WHAT_WAS_DETECTED}}`, etc.).
   - Pass any custom strings via JSON or JavaScript object.
   - Any unspecified fields automatically fallback to safe defaults (e.g. `"Not Available"`) without breaking table structure.

3. **Integrated with Dashboard**:
   - In `/dashboard/forensics?tab=reports`, clicking the **PDF** download button triggers real-time PDF generation and downloads the report file (`.pdf`) immediately.
   - Clicking **View** opens the PDF in a new browser tab.

---

## Programmatic Usage

### In Next.js API / Backend ([reportPdfService.ts](file:///d:/CyberVision-AI/lib/services/reportPdfService.ts)):
```typescript
import { generateReportPdf, buildReportHtml } from "@/lib/services/reportPdfService";

// Generate PDF buffer from string fields:
const pdfBuffer = await generateReportPdf({
  reportId: "REP-2026-088",
  incidentId: "CAS-2026-004",
  whatWasDetected: "Perimeter Intrusion Detected",
  severity: "CRITICAL",
  executiveSummary: "Subject detected scaling outer fence boundary into Sector 4.",
  // Any additional string fields...
});
```

### Via API Endpoint:
- **Download by Report ID**:
  ```http
  GET /api/reports/download-pdf?id=REP-2026-088
  ```
- **Custom Strings via POST**:
  ```http
  POST /api/reports/download-pdf
  Content-Type: application/json

  {
    "reportId": "REP-2026-999",
    "incidentId": "CAS-2026-009",
    "whatWasDetected": "Custom Camera Anomaly",
    "severity": "HIGH",
    "location": "Main Entrance"
  }
  ```

### CLI Command Line:
```bash
node "pdf generation/generateReportPdf.js" [reportId] [outputPath]

# Example:
node "pdf generation/generateReportPdf.js" REP-2026-088 "pdf generation/REP-2026-088.pdf"
```

---

## Core String Placeholders

| Section | Token | Description |
|---|---|---|
| **Cover Header** | `{{INCIDENT_ID}}` | Case/Incident ID (e.g. CAS-2026-004) |
| **Cover Header** | `{{REPORT_ID}}` | Report Reference (e.g. REP-2026-088) |
| **Cover Header** | `{{REPORT_GENERATION_DATE}}` | Generation date / timestamp |
| **Cover Header** | `{{SEVERITY}}` | Critical / High / Medium / Low |
| **1. Summary** | `{{SUMMARY_WHAT_WAS_DETECTED}}` | Incident summary detection description |
| **1. Summary** | `{{SUMMARY_LOCATION}}` | Location of detection |
| **1. Summary** | `{{SUMMARY_CONFIDENCE_SCORE}}` | Model confidence (e.g. 98.4%) |
| **2. Details** | `{{DETAIL_ASSIGNED_INVESTIGATOR}}`| Investigator name & badge number |
| **3. Exec Summary**| `{{EXECUTIVE_INCIDENT_SUMMARY}}` | Multi-paragraph factual incident summary |
| **4. Timeline** | `{{EVENT_01_DESC}}` - `{{EVENT_04_DESC}}`| Chronological timeline event descriptions |
| **7. Analysis** | `{{ANALYSIS_DETECTED_OBJECTS}}` | Detected object classes |
| **11. Notes** | `{{NOTE_INVESTIGATOR_NOTES}}` | Investigator findings & notes |
