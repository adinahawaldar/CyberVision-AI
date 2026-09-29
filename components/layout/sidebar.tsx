"use client";

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants, Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Camera,
  FolderOpen,
  Database,
  Clock,
  Bot,
  FileText,
  ShieldAlert,
  Settings,
  Plus,
  ChevronDown,
  UploadCloud,
  FileCheck2,
  FolderKanban
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const [isCasesOpen, setIsCasesOpen] = useState(true);
  const [isCreateCaseOpen, setIsCreateCaseOpen] = useState(false);
  const [caseTitle, setCaseTitle] = useState('');
  const [casePriority, setCasePriority] = useState('HIGH');
  const [caseLocation, setCaseLocation] = useState('Main Plaza / North Gate');
  const [caseCamera, setCaseCamera] = useState('CAMERA 01 - Main Entrance');

  const handleCreateCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseTitle.trim()) return;

    toast({
      title: "Case Created Successfully",
      description: `Case "${caseTitle}" registered with priority ${casePriority}.`,
    });

    setIsCreateCaseOpen(false);
    setCaseTitle('');
    router.push('/dashboard/forensics?tab=cases');
  };

  const caseSubItems = [
    {
      title: 'Case Management',
      href: '/dashboard/forensics?tab=cases',
      icon: <FolderKanban className="w-3.5 h-3.5" />,
    },
    {
      title: 'Evidence Vault',
      href: '/dashboard/forensics?tab=evidence',
      icon: <Database className="w-3.5 h-3.5" />,
    },
    {
      title: 'Evidence Upload',
      href: '/dashboard/forensics?tab=evidence&action=upload',
      icon: <UploadCloud className="w-3.5 h-3.5" />,
    },
    {
      title: 'Timeline',
      href: '/dashboard/forensics?tab=timeline',
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    {
      title: 'AI Chat',
      href: '/dashboard/ai-assistant',
      icon: <Bot className="w-3.5 h-3.5" />,
    },
    {
      title: 'Reports',
      href: '/dashboard/forensics?tab=reports',
      icon: <FileText className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <>
      <aside className="hidden md:flex fixed top-16 h-[calc(100vh-4rem)] w-64 flex-col border-r bg-background/95 backdrop-blur z-30 select-none">
        <div className="flex flex-col h-full p-3.5 overflow-y-auto">
          
          {/* TOP PRIMARY ACTION: + CREATE CASE */}
          <div className="mb-4">
            <Button
              onClick={() => setIsCreateCaseOpen(true)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 font-semibold text-xs h-9 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-none"
            >
              <Plus className="w-4 h-4" />
              Create Case
            </Button>
          </div>

          {/* MAIN NAVIGATION */}
          <div className="space-y-1">
            {/* 1. Dashboard */}
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                "justify-start w-full text-xs font-medium rounded-lg h-9 px-3 transition-colors",
                pathname === '/dashboard'
                  ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <LayoutDashboard className={cn("w-4 h-4 mr-2.5", pathname === '/dashboard' ? "text-slate-900 dark:text-white" : "text-muted-foreground")} />
              <span>Dashboard</span>
            </Link>

            {/* 2. Cameras */}
            <Link
              href="/dashboard/cameras"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                "justify-start w-full text-xs font-medium rounded-lg h-9 px-3 transition-colors",
                pathname === '/dashboard/cameras'
                  ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Camera className={cn("w-4 h-4 mr-2.5", pathname === '/dashboard/cameras' ? "text-slate-900 dark:text-white" : "text-muted-foreground")} />
              <span>Cameras</span>
            </Link>

            {/* 3. Cases - Collapsible Dropdown */}
            <Collapsible open={isCasesOpen} onOpenChange={setIsCasesOpen} className="w-full">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    "w-full justify-between text-xs font-medium rounded-lg h-9 px-3 transition-colors",
                    pathname.startsWith('/dashboard/forensics') || pathname === '/dashboard/ai-assistant'
                      ? "text-foreground bg-muted/60 font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <div className="flex items-center">
                    <FolderOpen className={cn("w-4 h-4 mr-2.5", pathname.startsWith('/dashboard/forensics') ? "text-slate-900 dark:text-white" : "text-muted-foreground")} />
                    <span>Cases</span>
                  </div>
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200 text-muted-foreground", isCasesOpen ? "rotate-180" : "rotate-0")} />
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-1 pl-4 pt-1 pb-1">
                {caseSubItems.map((subItem) => {
                  const isSubActive =
                    subItem.href === '/dashboard/ai-assistant'
                      ? pathname === '/dashboard/ai-assistant'
                      : pathname === '/dashboard/forensics' &&
                        typeof window !== 'undefined' &&
                        window.location.search.includes(subItem.href.split('?')[1] || '');

                  return (
                    <Link
                      key={subItem.title}
                      href={subItem.href}
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'sm' }),
                        "justify-start w-full text-[11px] font-medium rounded-md h-8 px-2.5 transition-colors border-l border-border",
                        isSubActive
                          ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <span className="mr-2 text-muted-foreground">{subItem.icon}</span>
                      <span>{subItem.title}</span>
                    </Link>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* SECTION: INTELLIGENCE */}
          <div className="my-4 pt-3 border-t border-border/60">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 font-mono">
              Intelligence
            </div>
            <div className="space-y-1">
              <Link
                href="/dashboard/forensics?tab=threats"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  "justify-start w-full text-xs font-medium rounded-lg h-9 px-3 transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <ShieldAlert className="w-4 h-4 mr-2.5 text-muted-foreground" />
                <span>Threat Intel</span>
              </Link>
            </div>
          </div>

          {/* SECTION: SETTINGS */}
          <div className="mt-auto pt-3 border-t border-border/60">
            <div className="space-y-1">
              <Link
                href="/dashboard/settings"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  "justify-start w-full text-xs font-medium rounded-lg h-9 px-3 transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  pathname === '/dashboard/settings' && "bg-muted text-foreground font-semibold"
                )}
              >
                <Settings className="w-4 h-4 mr-2.5 text-muted-foreground" />
                <span>Settings</span>
              </Link>
            </div>
          </div>

        </div>
      </aside>

      {/* CREATE CASE MODAL DIALOG */}
      <Dialog open={isCreateCaseOpen} onOpenChange={setIsCreateCaseOpen}>
        <DialogContent className="sm:max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <FolderOpen className="w-5 h-5 text-foreground" />
              Open New Forensic Investigation
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Register a security incident with incident details, priority, and source CCTV coverage.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCaseSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Case Title / Incident</label>
              <Input
                placeholder="e.g. Unauthorized Perimeter Ingress"
                value={caseTitle}
                onChange={(e) => setCaseTitle(e.target.value)}
                required
                className="text-xs h-9 bg-muted/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Priority Level</label>
                <select
                  value={casePriority}
                  onChange={(e) => setCasePriority(e.target.value)}
                  className="w-full text-xs h-9 rounded-md border border-input bg-background px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Primary CCTV Feed</label>
                <select
                  value={caseCamera}
                  onChange={(e) => setCaseCamera(e.target.value)}
                  className="w-full text-xs h-9 rounded-md border border-input bg-background px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="Entrance">Entrance (Webcam)</option>
                  <option value="Backyard">Backyard</option>
                  <option value="Lobby">Lobby</option>
                  <option value="Parking">Parking</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Office">Office</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Location</label>
              <Input
                placeholder="e.g. Building A - Sector 3"
                value={caseLocation}
                onChange={(e) => setCaseLocation(e.target.value)}
                className="text-xs h-9 bg-muted/40"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateCaseOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Create Investigation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}