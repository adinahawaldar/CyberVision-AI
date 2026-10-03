import { NextRequest, NextResponse } from "next/server";
import { generateReportPdf, PRESET_REPORTS, ReportStringData } from "@/lib/services/reportPdfService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get("id") || "REP-2026-088";

    // Start with preset if available, or initialize default
    const baseData: ReportStringData = PRESET_REPORTS[reportId] || {
      reportId: reportId,
      incidentId: searchParams.get("caseId") || "CAS-2026-004",
      whatWasDetected: searchParams.get("title") || "Digital Security Incident Investigation",
      severity: searchParams.get("severity") || "HIGH",
    };

    // Override with any query parameters provided as strings
    const queryOverrides: Partial<ReportStringData> = {};
    searchParams.forEach((value, key) => {
      if (key !== "id") {
        queryOverrides[key] = value;
      }
    });

    const finalReportData: ReportStringData = {
      ...baseData,
      ...queryOverrides,
    };

    // Generate accurate A4 PDF using Puppeteer
    const pdfBuffer = await generateReportPdf(finalReportData);

    // Return downloadable PDF response
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${reportId}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (err: any) {
    console.error("[API] Error generating report PDF:", err);
    return NextResponse.json(
      { error: "Failed to generate report PDF", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const reportId = body.id || body.reportId || "REP-2026-088";

    const baseData: ReportStringData = PRESET_REPORTS[reportId] || {};

    // Combine preset with user-supplied custom string inputs
    const mergedData: ReportStringData = {
      ...baseData,
      ...body,
      reportId,
    };

    const pdfBuffer = await generateReportPdf(mergedData);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${reportId}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (err: any) {
    console.error("[API] Error generating report PDF:", err);
    return NextResponse.json(
      { error: "Failed to generate report PDF", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
