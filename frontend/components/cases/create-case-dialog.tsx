"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderOpen, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveCase } from "@/lib/services/caseService";

interface CreateCaseDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const CAMERAS_LIST = [
  { id: "Entrance", label: "Entrance (Main Entrance)" },
  { id: "Backyard", label: "Backyard (North Perimeter)" },
  { id: "Lobby", label: "Lobby (Interior Corridor)" },
  { id: "Parking", label: "Parking (East Plaza)" },
  { id: "Warehouse", label: "Warehouse (Loading Bay)" },
  { id: "Office", label: "Office (South Wing)" },
  { id: "none", label: "None (External / Other Evidence)" }
];

export default function CreateCaseDialog({
  trigger,
  open: externalOpen,
  onOpenChange: setExternalOpen
}: CreateCaseDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const isOpen = isControlled ? externalOpen : internalOpen;
  const setIsOpen = isControlled ? setExternalOpen! : setInternalOpen;

  const router = useRouter();
  const { toast } = useToast();

  const [caseName, setCaseName] = useState("");
  const [casePriority, setCasePriority] = useState<"CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("HIGH");
  const [cctvOption, setCctvOption] = useState<string>("Entrance");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseName.trim()) return;

    const created = saveCase({
      name: caseName.trim(),
      severity: casePriority,
      cctvFeed: cctvOption !== "none" ? cctvOption : undefined,
    });

    toast({
      title: "Case Created",
      description: `Opening case dashboard for "${created.name}".`
    });

    // Reset and close modal
    setCaseName("");
    setIsOpen(false);

    // Direct user to this particular case's dashboard!
    router.push(`/dashboard/cases/${created.id}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <FolderOpen className="w-4 h-4 text-foreground" />
            Create Investigation Case
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Enter the basic case details to initialize its dedicated investigation workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* 1. CASE NAME */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Case Name</label>
            <Input
              placeholder="e.g. Perimeter Gate Breach / Vault Ingress"
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              required
              className="text-xs h-9 bg-muted/30 border-border"
              autoFocus
            />
          </div>

          {/* 2. PRIORITY */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Priority Level</label>
            <select
              value={casePriority}
              onChange={(e) => setCasePriority(e.target.value as any)}
              className="w-full text-xs h-9 rounded-md border border-border bg-background px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* 3. CURRENT CCTV FEED */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-muted-foreground" />
              Source CCTV Camera
            </label>
            <select
              value={cctvOption}
              onChange={(e) => setCctvOption(e.target.value)}
              className="w-full text-xs h-9 rounded-md border border-border bg-background px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {CAMERAS_LIST.map((cam) => (
                <option key={cam.id} value={cam.id}>
                  {cam.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">
              You can upload additional CCTV footage, videos, logs, and evidence documents directly in the case dashboard.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Create Case & Open Dashboard
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
