import { NextRequest, NextResponse } from "next/server";
import { buildReportHtml, PRESET_REPORTS, ReportStringData } from "@/lib/services/reportPdfService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get("id") || "REP-2026-001";

    const baseData: ReportStringData = PRESET_REPORTS[reportId] || {
      reportId: reportId,
      incidentId: searchParams.get("caseId") || "CAS-2026-001",
      whatWasDetected: searchParams.get("title") || "Digital Security Incident Investigation",
      severity: searchParams.get("severity") || "CRITICAL",
    };

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

    const html = buildReportHtml(finalReportData);

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("[API] Error rendering report HTML:", err);
    return NextResponse.json(
      { error: "Failed to render report HTML", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const reportId = body.id || body.reportId || "REP-2026-001";
    const baseData: ReportStringData = PRESET_REPORTS[reportId] || {};

    const mergedData: ReportStringData = {
      ...baseData,
      ...body,
      reportId,
    };

    PRESET_REPORTS[reportId] = mergedData;
    const html = buildReportHtml(mergedData);

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("[API] Error rendering report HTML:", err);
    return NextResponse.json(
      { error: "Failed to render report HTML", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
