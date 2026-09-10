"use client";

import Link from "next/link";
import { Shield, Cpu, Activity, Lock, ArrowUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-slate-950 border-t border-border/50 text-slate-400 py-12 text-sm relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-900">
          
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center p-0.5 shadow-md shadow-cyan-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                  <Shield className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <span className="font-bold text-lg text-foreground">
                CyberVision<span className="text-cyan-400">-AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Smart City & Government AI Security Surveillance Dashboard powered by YOLOv8 and DeepSORT real-time tracking.
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-medium">
                System Status: All Nodes Operational
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase text-foreground font-semibold tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
              </li>
              <li>
                <a href="#capabilities" className="hover:text-cyan-400 transition-colors">AI Detection Demo</a>
              </li>
              <li>
                <a href="#live-specs" className="hover:text-cyan-400 transition-colors">Performance Specs</a>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-cyan-400 transition-colors text-cyan-400">Live Console</Link>
              </li>
            </ul>
          </div>

          {/* Core Modules */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase text-foreground font-semibold tracking-wider">
              Dashboard Modules
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/dashboard/cameras" className="hover:text-cyan-400 transition-colors">Camera Grid Matrix</Link>
              </li>
              <li>
                <Link href="/dashboard/notifications" className="hover:text-cyan-400 transition-colors">Real-Time Threat Feed</Link>
              </li>
              <li>
                <Link href="/dashboard/ai-assistant" className="hover:text-cyan-400 transition-colors">AI Surveillance Chatbot</Link>
              </li>
              <li>
                <Link href="/dashboard/health" className="hover:text-cyan-400 transition-colors">Node Health Telemetry</Link>
              </li>
            </ul>
          </div>

          {/* System Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase text-foreground font-semibold tracking-wider">
              Compliance & Specs
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px]">
                <div className="text-slate-400">MODEL VERSION</div>
                <div className="text-cyan-400 font-bold">YOLOv8x-Surveillance v2.4</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px]">
                <div className="text-slate-400">STREAM PROTOCOL</div>
                <div className="text-cyan-400 font-bold">HLS / WebSockets JSON</div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 space-y-4 sm:space-y-0">
          <div>
            © {new Date().getFullYear()} CyberVision-AI (A-AI). Advanced AI Surveillance System.
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
}
