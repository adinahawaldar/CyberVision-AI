"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Upload,
  Eye,
  Download,
  Camera,
  FileVideo,
  Loader2
} from "lucide-react";
import CreateCaseDialog from "@/components/cases/create-case-dialog";
import { useCases } from "@/lib/services/caseService";

// 7-day incident activity data
const activityTrendData = [
  { day: "Mon", incidents: 4, alerts: 1 },
  { day: "Tue", incidents: 7, alerts: 2 },
  { day: "Wed", incidents: 3, alerts: 0 },
  { day: "Thu", incidents: 8, alerts: 3 },
  { day: "Fri", incidents: 12, alerts: 4 },
  { day: "Sat", incidents: 6, alerts: 1 },
  { day: "Sun", incidents: 5, alerts: 1 },
];

// Evidence source breakdown data
const evidenceSourceData = [
  { source: "CCTV Footage", percentage: 53 },
  { source: "System Logs", percentage: 25 },
  { source: "Network Captures", percentage: 14 },
  { source: "Documents & Reports", percentage: 8 },
];

export default function ForensicsDashboardPage() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";
  const [isMounted, setIsMounted] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { cases } = useCases();

  const handleDownloadPdf = async (repId: string) => {
    try {
      setDownloadingId(repId);
      const res = await fetch(`/api/reports/download-pdf?id=${encodeURIComponent(repId)}`);
      if (!res.ok) {
        throw new Error(`Failed to generate PDF (${res.status})`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${repId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("PDF download error:", err);
      alert("Failed to download PDF: " + (err?.message || "Unknown error"));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleViewPdf = (repId: string) => {
    window.open(`/api/reports/download-pdf?id=${encodeURIComponent(repId)}`, "_blank");
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Compute dynamic metrics from active cases
  const totalCases = cases.length;
  const activeIncidents = cases.filter(c => c.severity === "CRITICAL" || c.severity === "HIGH").length;
  const totalEvidence = cases.reduce((acc, c) => acc + (c.attachedFiles?.length || c.evidenceCount || 1), 0);

  const dynamicSeverityData = [
    { name: "Critical", value: cases.filter(c => c.severity === "CRITICAL").length, color: "#ef4444" },
    { name: "High", value: cases.filter(c => c.severity === "HIGH").length, color: "#f97316" },
    { name: "Medium", value: cases.filter(c => c.severity === "MEDIUM").length, color: "#3b82f6" },
    { name: "Low", value: cases.filter(c => c.severity === "LOW").length, color: "#10b981" },
  ];

  // SUB-SECTION 1: EVIDENCE VAULT (when clicked from sidebar)
  if (currentTab === "evidence") {
    return (
      <div className="flex-1 space-y-5 max-w-7xl mx-auto pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Evidence Vault
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Cryptographically sealed CCTV footage and digital evidence artifacts
            </p>
          </div>
          <CreateCaseDialog
            trigger={
              <Button size="sm" className="h-8 px-3 text-xs bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
                <Plus className="w-3.5 h-3.5 mr-1" /> New Case
              </Button>
            }
          />
        </div>

        <div className="p-6 border border-dashed border-border rounded-lg bg-muted/20 flex flex-col items-center justify-center text-center space-y-2">
          <Upload className="w-5 h-5 text-muted-foreground" />
          <div className="space-y-0.5">
            <h3 className="text-xs font-semibold text-foreground">Upload Evidence Artifacts</h3>
            <p className="text-[11px] text-muted-foreground max-w-sm">
              CCTV video clips, log files, or packet captures. SHA-256 hash generated automatically.
            </p>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs border-border mt-1">
            Select Files
          </Button>
        </div>

        <Card className="border border-border bg-card">
          <CardHeader className="p-3.5 border-b border-border">
            <CardTitle className="text-xs font-semibold text-foreground">
              Sealed Evidence Ledger
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground">
                  <tr>
                    <th className="px-3.5 py-2 font-medium">File Name</th>
                    <th className="px-3.5 py-2 font-medium">Case</th>
                    <th className="px-3.5 py-2 font-medium">Type</th>
                    <th className="px-3.5 py-2 font-medium">SHA-256 Hash</th>
                    <th className="px-3.5 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-muted/20">
                    <td className="px-3.5 py-2.5 font-mono text-foreground">cctv_frame_tamper_02.mp4</td>
                    <td className="px-3.5 py-2.5 text-muted-foreground">CAS-2026-004</td>
                    <td className="px-3.5 py-2.5 text-muted-foreground">Video / H.264</td>
                    <td className="px-3.5 py-2.5 font-mono text-[11px] text-muted-foreground">8f4b23...a9e0</td>
                    <td className="px-3.5 py-2.5">
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Verified</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/20">
                    <td className="px-3.5 py-2.5 font-mono text-foreground">auth_failure_stream.log</td>
                    <td className="px-3.5 py-2.5 text-muted-foreground">CAS-2026-003</td>
                    <td className="px-3.5 py-2.5 text-muted-foreground">System Log</td>
                    <td className="px-3.5 py-2.5 font-mono text-[11px] text-muted-foreground">3c7e91...d112</td>
                    <td className="px-3.5 py-2.5">
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Verified</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/20">
                    <td className="px-3.5 py-2.5 font-mono text-foreground">perimeter_raw_packet.pcap</td>
                    <td className="px-3.5 py-2.5 text-muted-foreground">CAS-2026-004</td>
                    <td className="px-3.5 py-2.5 text-muted-foreground">Network PCAP</td>
                    <td className="px-3.5 py-2.5 font-mono text-[11px] text-muted-foreground">e2098b...56cc</td>
                    <td className="px-3.5 py-2.5">
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Verified</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // SUB-SECTION 2: TIMELINE (when clicked from sidebar)
  if (currentTab === "timeline") {
    return (
      <div className="flex-1 space-y-5 max-w-7xl mx-auto pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Incident Timeline
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Chronological sequence of physical camera events and security logs
            </p>
          </div>
          <CreateCaseDialog
            trigger={
              <Button size="sm" className="h-8 px-3 text-xs bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
                <Plus className="w-3.5 h-3.5 mr-1" /> New Case
              </Button>
            }
          />
        </div>

        <Card className="border border-border bg-card">
          <CardHeader className="p-3.5 border-b border-border">
            <CardTitle className="text-xs font-semibold text-foreground">
              CAS-2026-004 &bull; Event Sequence
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {[
              { time: "22:14:02", title: "Person Detected in Restricted Perimeter", feed: "North Gate", note: "Subject detected climbing outer fence boundary" },
              { time: "22:14:38", title: "Perimeter Intrusion Alert Triggered", feed: "Rules Engine", note: "Alert notification dispatched to guard station" },
              { time: "22:15:10", title: "Camera Feed Signal Disrupted", feed: "North Gate", note: "Hardware RTSP connection severed; standby engaged" },
              { time: "22:16:04", title: "Failed Authentication Attempts (IP 194.26.29.112)", feed: "Firewall", note: "14 consecutive invalid password attempts" },
              { time: "22:18:22", title: "Case Created & Evidence Preserved", feed: "Agent Hawke", note: "Incident sealed with SHA-256 evidence integrity" }
            ].map((ev, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="font-mono text-xs text-muted-foreground pt-0.5 w-16 shrink-0">
                  {ev.time}
                </span>
                <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 mt-1.5 shrink-0" />
                <div className="flex-1 p-2.5 rounded-md bg-muted/40 border border-border/60 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-semibold text-foreground">{ev.title}</h5>
                    <span className="text-[10px] text-muted-foreground font-mono">{ev.feed}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{ev.note}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // SUB-SECTION 3: REPORTS (when clicked from sidebar)
  if (currentTab === "reports") {
    return (
      <div className="flex-1 space-y-5 max-w-7xl mx-auto pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Investigation Reports
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Structured forensic dossiers and case summary documents
            </p>
          </div>
          <CreateCaseDialog
            trigger={
              <Button size="sm" className="h-8 px-3 text-xs bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
                <Plus className="w-3.5 h-3.5 mr-1" /> New Case
              </Button>
            }
          />
        </div>

        <Card className="border border-border bg-card">
          <CardContent className="p-3.5 space-y-2.5">
            {[
              { id: "REP-2026-088", title: "Forensics Audit - Perimeter Gate Breach", caseId: "CAS-2026-004", date: "29 Sep 2026", pages: 12 },
              { id: "REP-2026-087", title: "Server Room Unauthorized Access Investigation", caseId: "CAS-2026-003", date: "28 Sep 2026", pages: 8 },
              { id: "REP-2026-086", title: "Weapons Anomaly Discrimination Dossier", caseId: "CAS-2026-002", date: "26 Sep 2026", pages: 16 }
            ].map((rep) => (
              <div key={rep.id} className="p-3 rounded-md bg-muted/40 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-foreground">{rep.id}</span>
                    <span className="text-xs text-muted-foreground">&bull;</span>
                    <span className="text-xs text-muted-foreground">{rep.caseId}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-foreground">{rep.title}</h4>
                  <p className="text-[11px] text-muted-foreground">{rep.date} &bull; {rep.pages} pages</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2.5 border-border text-foreground hover:bg-muted"
                    onClick={() => handleViewPdf(rep.id)}
                  >
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2.5 border-border text-foreground hover:bg-muted"
                    disabled={downloadingId === rep.id}
                    onClick={() => handleDownloadPdf(rep.id)}
                  >
                    {downloadingId === rep.id ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3 mr-1" /> PDF
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // DEFAULT / CASE MANAGEMENT VIEW: CLEAN GRAPHICAL OVERVIEW
  return (
    <div className="flex-1 space-y-5 max-w-7xl mx-auto pb-10">
      
      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Case Overview
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Investigation analytics, incident activity, and recent cases
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs border-border"
          >
            Last 7 Days
          </Button>

          <CreateCaseDialog
            trigger={
              <Button
                size="sm"
                className="h-8 px-3 text-xs bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                New Case
              </Button>
            }
          />
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 border border-border bg-card">
          <span className="text-xs text-muted-foreground">Total Cases</span>
          <div className="text-xl font-bold text-foreground mt-0.5">{totalCases}</div>
          <span className="text-[11px] text-muted-foreground">Registered investigations</span>
        </Card>
        <Card className="p-3.5 border border-border bg-card">
          <span className="text-xs text-muted-foreground">Active Incidents</span>
          <div className="text-xl font-bold text-foreground mt-0.5">{activeIncidents}</div>
          <span className="text-[11px] text-muted-foreground">Critical & high priority</span>
        </Card>
        <Card className="p-3.5 border border-border bg-card">
          <span className="text-xs text-muted-foreground">Evidence Files</span>
          <div className="text-xl font-bold text-foreground mt-0.5">{totalEvidence}</div>
          <span className="text-[11px] text-muted-foreground">Footages & documents</span>
        </Card>
        <Card className="p-3.5 border border-border bg-card">
          <span className="text-xs text-muted-foreground">Resolution Rate</span>
          <div className="text-xl font-bold text-foreground mt-0.5">92%</div>
          <span className="text-[11px] text-muted-foreground">Average 1.8 days</span>
        </Card>
      </div>

      {/* GRAPHICAL CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Incident Activity Trend (2 columns) */}
        <Card className="lg:col-span-2 border border-border bg-card">
          <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-foreground">
              Incident Activity (7-Day Trend)
            </CardTitle>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-600 dark:bg-slate-300" />
                Incidents
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Alerts
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 h-[240px]">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityTrendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incidentsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#64748b" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#64748b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#88888820" />
                  <XAxis dataKey="day" stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "6px",
                      fontSize: "12px"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="incidents"
                    stroke="#475569"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#incidentsGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="alerts"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={0}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Priority Breakdown (1 column) */}
        <Card className="border border-border bg-card">
          <CardHeader className="p-4 border-b border-border">
            <CardTitle className="text-xs font-semibold text-foreground">
              Cases by Priority
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            {isMounted && (
              <div className="w-full h-[150px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dynamicSeverityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {dynamicSeverityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        borderRadius: "6px",
                        fontSize: "12px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full mt-2 pt-2 border-t border-border text-xs">
              {dynamicSeverityData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className="font-semibold text-foreground text-[11px]">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* EVIDENCE DISTRIBUTION & RECENT INCIDENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Evidence Sources Breakdown */}
        <Card className="border border-border bg-card">
          <CardHeader className="p-4 border-b border-border">
            <CardTitle className="text-xs font-semibold text-foreground">
              Evidence Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {evidenceSourceData.map((item) => (
              <div key={item.source} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.source}</span>
                  <span className="font-semibold text-foreground">{item.percentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-800 dark:bg-slate-200 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Cases Overview (2 columns) - CASE NAME SHOWN FIRST */}
        <Card className="lg:col-span-2 border border-border bg-card">
          <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-foreground">
              Recent Cases
            </CardTitle>
            <span className="text-[11px] text-muted-foreground">Showing {cases.length} investigations</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {cases.slice(0, 6).map((c) => (
                <div key={c.id} className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-muted/20 transition-colors">
                  <div className="space-y-1 min-w-0 flex-1">
                    {/* CASE NAME FIRST */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/cases/${c.id}`}
                        className="text-xs font-bold text-foreground hover:underline truncate"
                      >
                        {c.name}
                      </Link>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 h-4 shrink-0 font-medium ${
                          c.severity === "CRITICAL"
                            ? "text-red-600 border-red-200 bg-red-50 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
                            : c.severity === "HIGH"
                            ? "text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50"
                            : "text-slate-600 border-slate-200 bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
                        }`}
                      >
                        {c.severity}
                      </Badge>
                    </div>

                    {/* CASE METADATA (CCTV OR ATTACHED EVIDENCE) */}
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                      <span className="font-mono text-[10px] text-muted-foreground">{c.id}</span>
                      <span>&bull;</span>

                      {/* CCTV Camera Link */}
                      {c.cctvFeed && (
                        <>
                          <span className="inline-flex items-center gap-1 text-foreground font-medium">
                            <Camera className="w-3 h-3 text-muted-foreground" />
                            CCTV: {c.cctvFeed}
                          </span>
                          <span>&bull;</span>
                        </>
                      )}

                      {/* Uploaded Evidence Count */}
                      {c.attachedFiles && c.attachedFiles.length > 0 && (
                        <>
                          <span className="inline-flex items-center gap-1 text-foreground font-medium">
                            <FileVideo className="w-3 h-3 text-muted-foreground" />
                            {c.attachedFiles.length} file{c.attachedFiles.length > 1 ? "s" : ""}
                          </span>
                          <span>&bull;</span>
                        </>
                      )}

                      <span>Updated {c.lastUpdated}</span>
                    </div>
                  </div>

                  <Link href={`/dashboard/cases/${c.id}`} className="shrink-0">
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 border-border">
                      Open Case
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
