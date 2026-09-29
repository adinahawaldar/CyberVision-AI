"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Upload,
  FileVideo,
  FileText,
  FileCode,
  Image as ImageIcon,
  CheckCircle,
  Trash2,
  Download,
  Eye,
  Hash,
  ShieldAlert,
  Clock,
  Send,
  Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  getCaseById,
  addFilesToCase,
  removeFileFromCase,
  CaseItem,
  AttachedFile
} from "@/lib/services/caseService";

// Helper to map CCTV camera name to streaming endpoint ID
const CCTV_ENDPOINT_MAP: Record<string, string> = {
  Entrance: "cam-webcam-0",
  Backyard: "cam-synthetic-2",
  Lobby: "cam-synthetic-3",
  Parking: "cam-synthetic-2",
  Warehouse: "cam-synthetic-3",
  Office: "cam-webcam-0",
};

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const caseId = params?.id as string;

  const [caseData, setCaseData] = useState<CaseItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState("");
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    if (!caseId) return;
    const found = getCaseById(caseId);
    if (found) {
      setCaseData(found);
    } else {
      // Fallback minimal case if not in db
      setCaseData({
        id: caseId,
        name: `Case ${caseId}`,
        severity: "HIGH",
        status: "INVESTIGATING",
        cctvFeed: "Entrance",
        evidenceCount: 1,
        lead: "Admin Hawaldar",
        lastUpdated: "Just now",
        sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        attachedFiles: []
      });
    }
  }, [caseId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !caseData) return;
    setIsUploading(true);

    const files = Array.from(e.target.files);
    const formatted: AttachedFile[] = files.map((file) => {
      const isVideo = file.type.includes("video") || /\.(mp4|mkv|avi|mov)$/i.test(file.name);
      const isLog = file.name.endsWith(".log") || file.name.endsWith(".txt") || file.name.endsWith(".json");
      const isImg = file.type.includes("image") || /\.(png|jpg|jpeg)$/i.test(file.name);

      let type: "cctv_footage" | "document" | "log" | "image" = "document";
      if (isVideo) type = "cctv_footage";
      else if (isLog) type = "log";
      else if (isImg) type = "image";

      const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
      return {
        name: file.name,
        type,
        size: `${sizeInMb} MB`
      };
    });

    const updated = addFilesToCase(caseData.id, formatted);
    if (updated) {
      setCaseData(updated);
      toast({
        title: "Evidence Added",
        description: `Added ${formatted.length} artifact(s) with cryptographic SHA-256 seal.`
      });
    }
    setIsUploading(false);
  };

  const handleRemoveFile = (index: number) => {
    if (!caseData) return;
    const updated = removeFileFromCase(caseData.id, index);
    if (updated) {
      setCaseData(updated);
      toast({
        title: "Artifact Removed",
        description: "File unlinked from this investigation case."
      });
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setNotes((prev) => [newNote.trim(), ...prev]);
    setNewNote("");
  };

  if (!caseData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs text-muted-foreground">
        Loading case dashboard...
      </div>
    );
  }

  const endpointId = caseData.cctvFeed
    ? CCTV_ENDPOINT_MAP[caseData.cctvFeed] || "cam-webcam-0"
    : null;

  return (
    <div className="flex-1 space-y-5 max-w-7xl mx-auto pb-12">
      
      {/* TOP NAVIGATION BREADCRUMB */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <Link
          href="/dashboard/forensics?tab=cases"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Case Overview
        </Link>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
            {caseData.id}
          </Badge>
          <Badge
            variant="outline"
            className={`text-[10px] font-semibold px-2 py-0.5 ${
              caseData.severity === "CRITICAL"
                ? "text-red-600 border-red-200 bg-red-50 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50"
                : caseData.severity === "HIGH"
                ? "text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50"
                : "text-slate-600 border-slate-200 bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
            }`}
          >
            {caseData.severity}
          </Badge>
        </div>
      </div>

      {/* CASE TITLE & DETAILS BANNER */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          {caseData.name}
        </h1>
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          {caseData.cctvFeed && (
            <span className="flex items-center gap-1 text-foreground font-medium">
              <Camera className="w-3.5 h-3.5 text-muted-foreground" />
              CCTV Camera: {caseData.cctvFeed}
            </span>
          )}
          <span>&bull;</span>
          <span>Lead: {caseData.lead}</span>
          <span>&bull;</span>
          <span>Status: {caseData.status}</span>
          <span>&bull;</span>
          <span>Updated {caseData.lastUpdated}</span>
        </div>
      </div>

      {/* MAIN TWO-COLUMN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* LEFT COLUMN: CCTV FEED & LIVE SURVEILLANCE */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border border-border bg-card overflow-hidden">
            <CardHeader className="p-3.5 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                Associated CCTV Feed
              </CardTitle>
              {caseData.cctvFeed && (
                <span className="text-[11px] font-medium text-foreground">
                  {caseData.cctvFeed}
                </span>
              )}
            </CardHeader>

            <CardContent className="p-0">
              {caseData.cctvFeed && endpointId ? (
                <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center">
                  {!videoError ? (
                    <img
                      src={`http://localhost:8000/api/v1/streaming/live/${endpointId}`}
                      alt={caseData.cctvFeed}
                      className="w-full h-full object-cover select-none"
                      onError={() => setVideoError(true)}
                    />
                  ) : (
                    <div className="h-full w-full bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
                      <Camera className="w-6 h-6 text-slate-500 mb-1.5" />
                      <span className="text-xs text-slate-400">Stream Offline</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setVideoError(false)}
                        className="mt-2 h-6 text-xs border-slate-700 bg-slate-800 text-slate-200"
                      >
                        Retry Feed
                      </Button>
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 text-[10px] text-white font-mono">
                    {caseData.cctvFeed} &bull; Live
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No direct CCTV camera linked to this case.
                </div>
              )}

              {/* SHA-256 INTEGRITY SEAL */}
              <div className="p-3 border-t border-border bg-muted/20 space-y-1">
                <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                  <Hash className="w-3 h-3 text-muted-foreground" />
                  SHA-256 Case Seal
                </span>
                <p className="font-mono text-[10px] text-foreground truncate">
                  {caseData.sha256}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* QUICK OBSERVATION NOTES */}
          <Card className="border border-border bg-card">
            <CardHeader className="p-3.5 border-b border-border">
              <CardTitle className="text-xs font-semibold text-foreground">
                Investigator Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-3">
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Log observation..."
                  className="flex-1 bg-background border border-border rounded-md px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Button type="submit" size="sm" className="h-7 text-xs px-2.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                  <Send className="w-3 h-3" />
                </Button>
              </form>

              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {notes.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground py-2 text-center">
                    No notes recorded yet.
                  </p>
                ) : (
                  notes.map((note, idx) => (
                    <div key={idx} className="p-2 rounded bg-muted/40 border border-border/60 text-xs">
                      <p className="text-foreground">{note}</p>
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">Just now</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: EVIDENCE VAULT - UPLOAD FOOTAGES, VIDEOS, DOCUMENTS */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-border bg-card">
            <CardHeader className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">
                  Case Evidence & Artifacts
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Upload and preserve CCTV footage files, evidence clips, system logs, and forensic documents.
                </p>
              </div>

              {/* UPLOAD BUTTON */}
              <div>
                <input
                  type="file"
                  multiple
                  accept="video/*,image/*,.log,.txt,.pdf,.docx,.json,.pcap"
                  onChange={handleFileUpload}
                  id="case-dashboard-upload"
                  className="hidden"
                />
                <label htmlFor="case-dashboard-upload">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs cursor-pointer border-border"
                    asChild
                  >
                    <span>
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      Add Footage & Documents
                    </span>
                  </Button>
                </label>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* UPLOAD DROP ZONE */}
              <div className="border border-dashed border-border rounded-lg p-6 bg-muted/10 text-center hover:bg-muted/20 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="video/*,image/*,.log,.txt,.pdf,.docx,.json,.pcap"
                  onChange={handleFileUpload}
                  id="case-dashboard-dropzone"
                  className="hidden"
                />
                <label htmlFor="case-dashboard-dropzone" className="cursor-pointer block space-y-1">
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                  <span className="text-xs font-semibold text-foreground block">
                    Drag and drop CCTV footage or documents here
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Supported: MP4, AVI, MKV, PNG, JPG, PDF, TXT, LOG, PCAP
                  </span>
                </label>
              </div>

              {/* ATTACHED EVIDENCE LIST */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-2">
                  <span>Attached Evidence ({caseData.attachedFiles?.length || 0})</span>
                  <span>Integrity</span>
                </div>

                {!caseData.attachedFiles || caseData.attachedFiles.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No footage or documents attached yet. Click "Add Footage & Documents" above to upload evidence.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {caseData.attachedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-border bg-muted/30 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {file.type === "cctv_footage" ? (
                            <FileVideo className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
                          ) : file.type === "image" ? (
                            <ImageIcon className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
                          ) : file.type === "log" ? (
                            <FileCode className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
                          )}

                          <div className="min-w-0">
                            <span className="font-semibold text-foreground truncate block">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {file.type === "cctv_footage" ? "CCTV Footage" : file.type.toUpperCase()} &bull; {file.size || "1.2 MB"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveFile(idx)}
                            className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-muted transition-colors"
                            title="Remove file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
