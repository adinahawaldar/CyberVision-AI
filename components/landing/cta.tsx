"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";

export default function CTA() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/login");
  };

  return (
    <section className="py-20 md:py-28 bg-background relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-950/20 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-900/90 p-8 sm:p-12 lg:p-16 shadow-2xl shadow-cyan-950/50 backdrop-blur-2xl text-center space-y-8 relative overflow-hidden">
          
          {/* Subtle Top Grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/30 text-emerald-400 text-xs font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Local Dev Console Available</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
              Ready to Upgrade Your <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">Surveillance Intelligence</span>?
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground">
              Get started with the dashboard right now. Monitor real-time CCTV streams, test YOLO object tracking, and experience instant alert dispatches.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Button
              onClick={handleDashboardClick}
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-xl shadow-cyan-500/25 border-0 px-8 py-6 text-base font-semibold cursor-pointer"
            >
              <ShieldAlert className="w-5 h-5 mr-2" />
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="relative z-10 pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Demo Admin Access Built-In
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Mock Camera HLS Streams Active
            </span>
          </div>

        </div>

      </div>
    </section>
  );
}
