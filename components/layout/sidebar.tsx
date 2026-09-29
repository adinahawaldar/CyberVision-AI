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
import CreateCaseDialog from '@/components/cases/create-case-dialog';

export default function Sidebar() {
  const pathname = usePathname();
  const [isCasesOpen, setIsCasesOpen] = useState(true);

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
            <CreateCaseDialog
              trigger={
                <Button
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 font-semibold text-xs h-9 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-none"
                >
                  <Plus className="w-4 h-4" />
                  Create Case
                </Button>
              }
            />
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
    </>
  );
}