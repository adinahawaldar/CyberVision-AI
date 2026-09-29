"use client";

import { useState, useEffect } from "react";

export interface AttachedFile {
  name: string;
  type: "cctv_footage" | "document" | "log" | "image";
  size?: string;
}

export interface CaseItem {
  id: string;
  name: string; // Case Name first
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "INVESTIGATING" | "EVIDENCE_COLLECTED" | "AI_PARSED" | "CLOSED";
  cctvFeed?: string;
  attachedFiles?: AttachedFile[];
  evidenceCount: number;
  lead: string;
  location?: string;
  lastUpdated: string;
  sha256?: string;
}

export const DEFAULT_CASES: CaseItem[] = [
  {
    id: "CAS-2026-004",
    name: "Perimeter Breach & Surveillance Cam Tamper",
    severity: "CRITICAL",
    status: "INVESTIGATING",
    cctvFeed: "North Gate",
    evidenceCount: 18,
    lead: "Agent Hawke",
    lastUpdated: "Just now",
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    id: "CAS-2026-003",
    name: "Unauthorized Late-Night Data Center Ingress",
    severity: "HIGH",
    status: "EVIDENCE_COLLECTED",
    cctvFeed: "Server Room",
    evidenceCount: 32,
    lead: "Analyst Vance",
    lastUpdated: "2h ago",
    sha256: "7d793037a0760186574b0282f2f435e70f1602e615fa93e52f3fdd70ec57d0ec"
  },
  {
    id: "CAS-2026-002",
    name: "Weapons Anomaly Discrimination - Rifle vs Umbrella",
    severity: "MEDIUM",
    status: "AI_PARSED",
    cctvFeed: "Front Plaza",
    evidenceCount: 24,
    lead: "AI Engine",
    lastUpdated: "5h ago",
    sha256: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb"
  },
  {
    id: "CAS-2026-001",
    name: "Suspicious Loitering Outside Loading Bay",
    severity: "LOW",
    status: "CLOSED",
    cctvFeed: "Loading Dock",
    evidenceCount: 11,
    lead: "Admin Hawaldar",
    lastUpdated: "1d ago",
    sha256: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a"
  }
];

const STORAGE_KEY = "cybervision_cases_db";

export function getStoredCases(): CaseItem[] {
  if (typeof window === "undefined") return DEFAULT_CASES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CASES));
      return DEFAULT_CASES;
    }
    return JSON.parse(raw);
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
    lead: newCase.lead || "Admin Hawaldar",
    location: newCase.location || "Surveillance Grid",
    lastUpdated: "Just now",
    sha256: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
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

