"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#0b0c0e] text-slate-300 pt-16 pb-0 overflow-hidden relative border-t border-white/10">

      {/* TOP SECTION: BRAND & NAVIGATION COLUMNS */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-12">

          {/* LEFT BRAND SUMMARY */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              CYBERVISION
            </h3>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              CyberVision is an enterprise-grade AI security platform specializing in real-time CCTV surveillance, object tracking, and threat detection.
            </p>
          </div>

          {/* RIGHT COLUMNS GRID */}
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-8 text-xs">

            {/* COLUMN 1 */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white">Quick link</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#hero" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Services</a></li>
                <li><a href="#working" className="hover:text-white transition-colors">Operations</a></li>
                <li><a href="#detection-pipeline" className="hover:text-white transition-colors">Pipeline</a></li>
              </ul>
            </div>

            {/* COLUMN 2 */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white">Platform</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Console</Link></li>
                <li><Link href="/dashboard/cameras" className="hover:text-white transition-colors">Live Matrix</Link></li>
                <li><Link href="/dashboard/notifications" className="hover:text-white transition-colors">Alert Feed</Link></li>
                <li><Link href="/dashboard/ai-assistant" className="hover:text-white transition-colors">AI Assistant</Link></li>
              </ul>
            </div>

            {/* COLUMN 3 */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white">Resources</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Docs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Specs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><Link href="/dashboard/health" className="hover:text-white transition-colors">System Health</Link></li>
              </ul>
            </div>

            {/* COLUMN 4 */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white">Social</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a></li>
                <li><a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">LinkedIn</a></li>
                <li><a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Instagram</a></li>
              </ul>
            </div>

          </div>

        </div>


      </div>

      {/* GIANT RED GRADIENT WATERMARK TEXT AT BOTTOM */}
      <div className="w-full overflow-hidden select-none pointer-events-none pt-4 pb-0 flex justify-center items-end leading-none">
        <h1 className="text-[13vw] sm:text-[15vw] font-black uppercase tracking-tighter leading-[0.75] text-center bg-gradient-to-b from-[#ff3538] via-[#e62e31] to-[#ff3538]/20 bg-clip-text text-transparent [mask-image:linear-gradient(to_right,transparent_0%,black_15%,black_85%,transparent_100%)] transform translate-y-4">
          CYBERVISION
        </h1>
      </div>

    </footer>
  );
}
