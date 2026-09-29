"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen,
  FileText,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Upload,
  CheckCircle,
  Activity,
  Database,
  Cpu,
  Eye,
  Bot,
  MessageSquare,
  Plus,
  Sparkles,
  ExternalLink,
  Search,
  Filter,
  Clock,
  Fingerprint,
  Hash,
  FileCheck,
  Server,
  Layers,
  ChevronRight,
  Download,
  Terminal,
  Network
} from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Sample forensic case metrics
const initialStats = [
  { label: "Active Investigations", value: "14", icon: FolderOpen, color: "#38bdf8", trend: "+3 this week" },
  { label: "Hashed Evidence Vault", value: "128", icon: Database, color: "#a855f7", trend: "100% SHA-256 Verified" },
  { label: "Timeline Events Synced", value: "1,420", icon: Clock, color: "#34d399", trend: "CCTV + Log synchronized" },
  { label: "High-Risk Threat IOCs", value: "9", icon: ShieldAlert, color: "#f43f5e", trend: "2 Critical Infiltrations" },
];

// Activity Trend Chart Data
const activityData = [
  { time: "00:00", events: 45, alerts: 4 },
  { time: "04:00", events: 22, alerts: 1 },
  { time: "08:00", events: 88, alerts: 9 },
  { time: "12:00", events: 140, alerts: 14 },
  { time: "16:00", events: 195, alerts: 21 },
  { time: "20:00", events: 110, alerts: 11 },
  { time: "23:59", events: 65, alerts: 6 },
];

// Evidence Type Breakdown Data
const evidenceTypesData = [
  { name: "CCTV Frames", value: 45, color: "#38bdf8" },
  { name: "Server Logs", value: 30, color: "#a855f7" },
  { name: "PCAP Captures", value: 15, color: "#34d399" },
  { name: "Auth / EVTX", value: 10, color: "#f59e0b" },
];

// Sample Cases
const initialCases = [
  {
    id: "CAS-2026-004",
    title: "Perimeter Breach & Surveillance Cam 02 Tamper",
    severity: "CRITICAL",
    status: "INVESTIGATING",
    evidenceCount: 18,
    lead: "Agent Hawke",
    lastUpdated: "12m ago",
    syncedFeed: "North Gate Cam 02",
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    id: "CAS-2026-003",
    title: "Unauthorized Late-Night Data Center Ingress",
    severity: "HIGH",
    status: "EVIDENCE_COLLECTED",
    evidenceCount: 32,
    lead: "Analyst Vance",
    lastUpdated: "2h ago",
    syncedFeed: "Server Room Interior B",
    sha256: "7d793037a0760186574b0282f2f435e70f1602e615fa93e52f3fdd70ec57d0ec"
  },
  {
    id: "CAS-2026-002",
    title: "Weapons Anomaly Discrimination - Rifle vs Umbrella",
    severity: "MEDIUM",
    status: "AI_PARSED",
    evidenceCount: 24,
    lead: "CyberVision AI Engine",
    lastUpdated: "5h ago",
    syncedFeed: "Front Plaza Patrol",
    sha256: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb"
  },
  {
    id: "CAS-2026-001",
    title: "Suspicious Loitering Outside Vault Loading Bay",
    severity: "INFO",
    status: "CLOSED",
    evidenceCount: 11,
    lead: "Admin Hawaldar",
    lastUpdated: "1d ago",
    syncedFeed: "Loading Dock 01",
    sha256: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a"
  }
];

// Sample IOCs
const sampleIocs = [
  { indicator: "194.26.29.112", type: "IP", reputation: "98% Malicious (AbuseIPDB)", originCase: "CAS-2026-004", status: "BLOCKED" },
  { indicator: "45.154.255.88", type: "IP", reputation: "85% Scanner / Brute Force", originCase: "CAS-2026-003", status: "FLAGGED" },
  { indicator: "c4ca4238a0b923820dcc509a6f75849b", type: "MD5", reputation: "Trojan.Dropper (VirusTotal 48/72)", originCase: "CAS-2026-004", status: "QUARANTINED" },
  { indicator: "9a2f7c118e69e4f5a8b27d2c3491d0e1", type: "SHA-256", reputation: "Known Exfiltration Tool", originCase: "CAS-2026-003", status: "ISOLATED" }
];

// MITRE ATT&CK Matrix Sample
const mitreTactics = [
  { tactic: "Initial Access", technique: "T1190 - Exploit Public-Facing App", severity: "HIGH" },
  { tactic: "Persistence", technique: "T1078 - Valid Accounts", severity: "MEDIUM" },
  { tactic: "Privilege Escalation", technique: "T1068 - Exploitation for Priv Escalation", severity: "CRITICAL" },
  { tactic: "Defense Evasion", technique: "T1070 - Indicator Removal on Host", severity: "HIGH" },
  { tactic: "Exfiltration", technique: "T1048 - Exfiltration Over Alternative Protocol", severity: "CRITICAL" }
];

export default function ForensicsDashboardPage() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [cases, setCases] = useState(initialCases);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [verifiedHash, setVerifiedHash] = useState<Record<string, boolean>>({});

  const handleVerifyHash = (caseId: string) => {
    setIsVerifying(caseId);
    setTimeout(() => {
      setVerifiedHash(prev => ({ ...prev, [caseId]: true }));
      setIsVerifying(null);
    }, 700);
  };

  const filteredCases = cases.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lead.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-[#0a0c10] min-h-screen text-slate-100">
      
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                Digital Forensics & Chain-of-Custody
              </h1>
              <p className="text-sm text-slate-400">
                Synchronized CCTV video intelligence, cryptographic evidence verification, and incident reconstruction.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="border-white/10 bg-[#161a22] hover:bg-white/10 text-slate-200"
            onClick={() => window.open("http://localhost:5173", "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-2 text-cyan-400" />
            Open Standalone Studio (Port 5173)
          </Button>

          <Button className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20">
            <Plus className="w-4 h-4 mr-2" />
            New Investigation
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {initialStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="bg-[#12161f]/80 border-white/10 backdrop-blur-md hover:border-cyan-500/30 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {stat.label}
                  </CardTitle>
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center"
                    style={{ background: `${stat.color}15`, color: stat.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    {stat.trend}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Navigation Tabs */}
      <Tabs defaultValue="overview" value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="bg-[#12161f] border border-white/10 p-1 rounded-xl">
          <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
            <Activity className="w-4 h-4 mr-2" /> Overview & Trends
          </TabsTrigger>
          <TabsTrigger value="cases" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
            <FolderOpen className="w-4 h-4 mr-2" /> Active Cases ({cases.length})
          </TabsTrigger>
          <TabsTrigger value="evidence" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
            <Fingerprint className="w-4 h-4 mr-2" /> SHA-256 Vault
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
            <Clock className="w-4 h-4 mr-2" /> CCTV + Log Timeline
          </TabsTrigger>
          <TabsTrigger value="threats" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
            <Network className="w-4 h-4 mr-2" /> MITRE & Threat IOCs
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Area Chart: Investigation & Alert Volume */}
            <Card className="lg:col-span-2 bg-[#12161f]/80 border-white/10">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  Forensic Incident Ingestion (24h Window)
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Cross-correlated events captured between CCTV AI triggers and network security logs.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#161b22",
                        borderColor: "#ffffff15",
                        borderRadius: "8px",
                        color: "#fff"
                      }}
                    />
                    <Area type="monotone" dataKey="events" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorEvents)" name="Synced Events" />
                    <Area type="monotone" dataKey="alerts" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorAlerts)" name="Critical Threats" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pie Chart: Evidence Distribution */}
            <Card className="bg-[#12161f]/80 border-white/10">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-400" />
                  Evidence Source Breakdown
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Forensic artifact distribution currently under chain-of-custody.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[220px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={evidenceTypesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {evidenceTypesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#161b22",
                        borderColor: "#ffffff15",
                        borderRadius: "8px",
                        color: "#fff"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
              <div className="grid grid-cols-2 gap-2 px-4 pb-4 text-xs">
                {evidenceTypesData.map(item => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-slate-300">{item.name}</span>
                    <span className="text-slate-500 ml-auto font-mono">{item.value}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Quick Action Matrix Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-[#12161f] to-purple-950/30 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Autonomous Multi-Modal Case Correlator Active
              </h3>
              <p className="text-xs md:text-sm text-slate-400 max-w-2xl">
                Every video detection tagged by YOLOv8 is cryptographically sealed and correlated against
                network traffic and authentication logs to prevent video fabrication or post-incident evidence tampering.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Button
                variant="outline"
                className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
                onClick={() => setSelectedTab("evidence")}
              >
                <Upload className="w-4 h-4 mr-2" /> Upload Artifact
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-500 text-white"
                onClick={() => setSelectedTab("cases")}
              >
                <FolderOpen className="w-4 h-4 mr-2" /> View Cases
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: ACTIVE CASES */}
        <TabsContent value="cases" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#12161f] p-3 rounded-xl border border-white/10">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by Case ID, title, or lead..."
                className="w-full bg-[#181d28] border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-white/10 text-slate-400 text-xs">
                Showing {filteredCases.length} of {cases.length} cases
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            {filteredCases.map(c => (
              <Card key={c.id} className="bg-[#12161f]/90 border-white/10 hover:border-cyan-500/30 transition-all">
                <CardContent className="p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                        {c.id}
                      </span>
                      <h4 className="text-base font-semibold text-white">{c.title}</h4>
                      <Badge
                        className={
                          c.severity === "CRITICAL"
                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                            : c.severity === "HIGH"
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        }
                      >
                        {c.severity}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      <span>Source: <strong className="text-slate-300">{c.syncedFeed}</strong></span>
                      <span>Lead: <strong className="text-slate-300">{c.lead}</strong></span>
                      <span>Artifacts: <strong className="text-slate-300">{c.evidenceCount} files</strong></span>
                      <span>Updated: <strong className="text-slate-300">{c.lastUpdated}</strong></span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 bg-[#0c0e14] px-2.5 py-1 rounded border border-white/5 overflow-hidden">
                      <Hash className="w-3 h-3 text-cyan-500 shrink-0" />
                      <span className="truncate">SHA-256: {c.sha256}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10 hover:bg-white/10 text-xs text-slate-300"
                      onClick={() => handleVerifyHash(c.id)}
                      disabled={isVerifying === c.id}
                    >
                      {isVerifying === c.id ? (
                        <Activity className="w-3.5 h-3.5 mr-1.5 animate-spin text-cyan-400" />
                      ) : verifiedHash[c.id] ? (
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                      ) : (
                        <Fingerprint className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                      )}
                      {verifiedHash[c.id] ? "Verified" : "Verify Hash"}
                    </Button>

                    <Button size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-xs text-white">
                      Investigate <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: SHA-256 EVIDENCE VAULT */}
        <TabsContent value="evidence" className="space-y-6">
          <div className="p-8 border-2 border-dashed border-cyan-500/30 rounded-2xl bg-[#12161f]/40 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Upload className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Drag and Drop Forensic Evidence</h3>
              <p className="text-xs text-slate-400 max-w-md">
                Upload CCTV raw footage (.mp4, .mkv), network captures (.pcap), Windows event logs (.evtx),
                or server logs (.log, .json). Automatic cryptographic SHA-256 seal generated on arrival.
              </p>
            </div>
            <Button className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs">
              Select Local Files
            </Button>
          </div>

          <Card className="bg-[#12161f]/80 border-white/10">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                Cryptographically Sealed Evidence Ledger
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 text-slate-400">
                    <tr>
                      <th className="pb-3 font-semibold">Artifact Name</th>
                      <th className="pb-3 font-semibold">Case Origin</th>
                      <th className="pb-3 font-semibold">File Type</th>
                      <th className="pb-3 font-semibold">Calculated SHA-256 Hash</th>
                      <th className="pb-3 font-semibold">Integrity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    <tr>
                      <td className="py-3 font-mono">cctv_frame_tamper_02.mp4</td>
                      <td>CAS-2026-004</td>
                      <td>Video / H.264</td>
                      <td className="font-mono text-slate-500 text-[11px]">8f4b23...a9e0</td>
                      <td><Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">VALID</Badge></td>
                    </tr>
                    <tr>
                      <td className="py-3 font-mono">auth_failure_stream.log</td>
                      <td>CAS-2026-003</td>
                      <td>System Log</td>
                      <td className="font-mono text-slate-500 text-[11px]">3c7e91...d112</td>
                      <td><Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">VALID</Badge></td>
                    </tr>
                    <tr>
                      <td className="py-3 font-mono">perimeter_raw_packet.pcap</td>
                      <td>CAS-2026-004</td>
                      <td>PCAP Network</td>
                      <td className="font-mono text-slate-500 text-[11px]">e2098b...56cc</td>
                      <td><Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">VALID</Badge></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: TIMELINE RECONSTRUCTION */}
        <TabsContent value="timeline" className="space-y-4">
          <Card className="bg-[#12161f]/80 border-white/10">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                Synchronized CCTV & Log Event Timeline
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Visualizing sequence of physical camera events and digital anomalies for CAS-2026-004.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { time: "22:14:02", title: "YOLOv8 Detection: Person in Restricted Perimeter", feed: "North Gate Cam 02", level: "HIGH", note: "Subject detected climbing outer fence boundary" },
                { time: "22:14:38", title: "Security Rule Triggered: Perimeter Zone Intrusion", feed: "Automated Rules Engine", level: "CRITICAL", note: "Sent alert notification #NOTIF-883 to guard console" },
                { time: "22:15:10", title: "Camera Feed Signal Disrupted / HUD Fallback Engaged", feed: "North Gate Cam 02", level: "CRITICAL", note: "Hardware RTSP connection severed; synthetic radar HUD automatically activated" },
                { time: "22:16:04", title: "Failed SSH Authentication Burst from 194.26.29.112", feed: "Firewall Node 01", level: "HIGH", note: "14 consecutive invalid password attempts within 30 seconds" },
                { time: "22:18:22", title: "Incident Case Created & Forensic Snapshot Frozen", feed: "Agent Hawke", level: "INFO", note: "Evidence preserved with SHA-256 hash sealing" }
              ].map((ev, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="font-mono text-xs text-cyan-400 pt-0.5 w-20 shrink-0 font-bold">
                    {ev.time}
                  </div>
                  <div className="w-3 h-3 rounded-full bg-cyan-400 border-4 border-[#0a0c10] shadow-[0_0_8px_rgba(56,189,248,0.8)] mt-1 shrink-0" />
                  <div className="flex-1 p-3 rounded-xl bg-[#161a22] border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs md:text-sm font-semibold text-white">{ev.title}</h5>
                      <Badge className={ev.level === "CRITICAL" ? "bg-red-500/20 text-red-400 border-red-500/30 text-[10px]" : ev.level === "HIGH" ? "bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]" : "bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px]"}>
                        {ev.level}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400">{ev.note}</p>
                    <span className="text-[11px] font-mono text-slate-500 block">Source: {ev.feed}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: MITRE ATT&CK & THREAT IOCS */}
        <TabsContent value="threats" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* MITRE Matrix */}
            <Card className="bg-[#12161f]/80 border-white/10">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-400" />
                  MITRE ATT&CK Technique Mapping
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Adversary tactics mapped to detected surveillance and network anomalies.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {mitreTactics.map((m, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[#181d28] border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono text-slate-400 block">{m.tactic}</span>
                      <strong className="text-xs md:text-sm text-slate-200">{m.technique}</strong>
                    </div>
                    <Badge className={m.severity === "CRITICAL" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}>
                      {m.severity}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* IOCs Aggregator */}
            <Card className="bg-[#12161f]/80 border-white/10">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <Network className="w-5 h-5 text-red-400" />
                  Live Threat Indicators (IOCs)
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Suspicious IP reputations & malware hashes queried from AbuseIPDB & VirusTotal.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {sampleIocs.map((ioc, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[#181d28] border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-cyan-300">{ioc.indicator}</span>
                      <Badge variant="outline" className="text-[10px] border-white/10 text-slate-400">{ioc.type}</Badge>
                    </div>
                    <p className="text-xs text-red-400">{ioc.reputation}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Linked Case: {ioc.originCase}</span>
                      <span className="font-mono text-emerald-400">{ioc.status}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>
        </TabsContent>

      </Tabs>

    </div>
  );
}
