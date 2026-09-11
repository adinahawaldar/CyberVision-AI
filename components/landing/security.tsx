"use client";

import { motion } from "framer-motion";
import { Shield, AlertTriangle, Eye, Lock, Layers, Camera, ArrowRight, Activity, CheckCircle2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Security() {
  return (
    <section className="py-12 sm:py-16 bg-[#111317] text-white relative overflow-hidden">

      {/* Background Ambient Red Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#ff3538]/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">

        {/* SECTION HEADER WITH SCROLL ANIMATION */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-3 max-w-3xl mx-auto"
        >


          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight">
            BUILT FOR THE MOMENTS SECURITY TEAMS CAN'T AFFORD TO MISS.
          </h2>

          <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-xl mx-auto">
            From unauthorized access to suspicious activity, every camera becomes an active layer of security.
          </p>
        </motion.div>

        {/* BENTO GRID LAYOUT */}
        <div className="space-y-5">

          {/* TOP ROW: 3 CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* CARD 01: UNAUTHORIZED ACCESS */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.7, delay: 0.1, type: "spring", stiffness: 90 }}
              className="rounded-2xl border border-white/10 bg-[#161820]/90 p-5 sm:p-6 backdrop-blur-xl shadow-xl hover:border-white/20 hover:scale-[1.02] transition-all flex flex-col justify-between group space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-[#ff3538] font-bold">01 — PERIMETER PROTECTION</span>
                  <Shield className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#ff3538] transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Unauthorized Access
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Detect activity in restricted or protected areas before escalation.
                </p>
              </div>

              {/* VISUAL: CCTV FRAME + RESTRICTED ZONE + INTRUSION ALERT */}
              <div className="bg-[#0c0d10] border border-white/10 rounded-xl p-3 relative overflow-hidden font-mono text-[9px] space-y-2">

                <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff3538] animate-pulse" />
                    <span className="text-white font-bold">CAM-02 • NORTH GATE</span>
                  </div>
                  <span className="text-[#ff3538] font-bold">RESTRICTED ZONE</span>
                </div>

                {/* Simulated CCTV Frame with Laser Beam */}
                <div className="relative h-24 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-center overflow-hidden">
                  <motion.div
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-0.5 bg-[#ff3538] shadow-[0_0_10px_#ff3538] z-20"
                  />

                  {/* Red Restricted Overlay Zone */}
                  <div className="absolute inset-1.5 border border-dashed border-[#ff3538]/60 bg-[#ff3538]/10 rounded flex flex-col justify-between p-1.5">

                    {/* Bounding Box for Intruder */}
                    <div className="self-center bg-[#ff3538]/20 border border-[#ff3538] p-1 rounded text-center space-y-0.5 shadow-md shadow-[#ff3538]/20">
                      <div className="bg-[#ff3538] text-white text-[7.5px] font-bold px-1 rounded">
                        PERSON (ID #802) 96%
                      </div>
                      <div className="text-[8px] text-[#ff3538] font-bold animate-pulse flex items-center justify-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5 text-[#ff3538]" /> INTRUSION DETECTED
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </motion.div>

            {/* CARD 02: SUSPICIOUS ACTIVITY */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.7, delay: 0.2, type: "spring", stiffness: 90 }}
              className="rounded-2xl border border-white/10 bg-[#161820]/90 p-5 sm:p-6 backdrop-blur-xl shadow-xl hover:border-white/20 hover:scale-[1.02] transition-all flex flex-col justify-between group space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-[#ff3538] font-bold">02 — BEHAVIORAL ANALYSIS</span>
                  <Activity className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Suspicious Activity
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Identify unusual movements and security events that require attention.
                </p>
              </div>

              {/* VISUAL: MOVEMENT VECTOR TRAIL & LOITERING ALERT */}
              <div className="bg-[#0c0d10] border border-white/10 rounded-xl p-3 relative overflow-hidden font-mono text-[9px] space-y-2">

                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                  <span className="text-slate-300 font-bold flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5 text-[#ff3538]" /> VECTOR #41
                  </span>
                  <Badge className="bg-[#ff3538]/20 text-[#ff3538] text-[7.5px] px-1.5 py-0.2 rounded border border-[#ff3538]/40 font-mono">
                    LOITERING DETECTED
                  </Badge>
                </div>

                <div className="relative h-24 rounded bg-slate-900/80 border border-slate-800 p-2 flex flex-col justify-between">
                  <div className="flex justify-between text-slate-400 text-[8px]">
                    <span>PATH: <span className="text-white">PERIMETER</span></span>
                    <span>DURATION: <span className="text-[#ff3538] font-bold">4m 12s</span></span>
                  </div>

                  {/* Visual Movement Trail Line */}
                  <div className="relative w-full h-6 flex items-center justify-between px-3">
                    <motion.div
                      animate={{ scaleX: [0, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-x-3 top-1/2 h-0.5 bg-gradient-to-r from-slate-700 via-white/50 to-[#ff3538] origin-left"
                    />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400 z-10" />
                    <div className="w-3 h-3 rounded-full bg-white z-10 animate-ping" />
                    <div className="w-3.5 h-3.5 rounded-full bg-[#ff3538] z-10 flex items-center justify-center text-white text-[6.5px] font-bold">!</div>
                  </div>

                  <div className="text-[8px] text-slate-300 bg-[#ff3538]/10 border border-[#ff3538]/30 p-0.5 rounded text-center">
                    STATUS: <span className="text-[#ff3538] font-bold uppercase">SUSPICIOUS MOVEMENT</span>
                  </div>
                </div>

              </div>

            </motion.div>

            {/* CARD 03: CONTINUOUS MONITORING */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.7, delay: 0.3, type: "spring", stiffness: 90 }}
              className="rounded-2xl border border-white/10 bg-[#161820]/90 p-5 sm:p-6 backdrop-blur-xl shadow-xl hover:border-white/20 hover:scale-[1.02] transition-all flex flex-col justify-between group space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-[#ff3538] font-bold">03 — 24/7 SURVEILLANCE</span>
                  <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Continuous Monitoring
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Monitor multiple camera feeds without relying on someone watching every screen.
                </p>
              </div>

              {/* VISUAL: 4-CAM MINI STREAM STATUS GRID */}
              <div className="bg-[#0c0d10] border border-white/10 rounded-xl p-2.5 relative overflow-hidden font-mono text-[9px] space-y-2">
                <div className="grid grid-cols-2 gap-1.5">
                  {["01", "02", "03", "04"].map((cam, i) => (
                    <motion.div
                      key={cam}
                      animate={{ borderColor: ["rgba(255,255,255,0.1)", "rgba(6,182,212,0.5)", "rgba(255,255,255,0.1)"] }}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                      className="bg-slate-900 border border-white/10 rounded p-1.5 space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-bold text-[8px]">CAM {cam}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      </div>
                      <span className="text-[7.5px] text-slate-300 block font-bold">LIVE (100%)</span>
                    </motion.div>
                  ))}
                </div>

                <div className="bg-white/5 border border-white/10 rounded p-1 text-center text-[8px] text-slate-300 font-bold">
                  100% AUTOMATED SCREENING ACTIVE
                </div>
              </div>

            </motion.div>

          </div>

          {/* BOTTOM ROW: 2 UNEQUAL CARDS (CARD 4 & CARD 5 - LARGEST) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5">

            {/* CARD 04: EVIDENCE PRESERVATION (SPAN 2) */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.7, delay: 0.35, type: "spring", stiffness: 90 }}
              className="md:col-span-2 rounded-2xl border border-white/10 bg-[#161820]/90 p-5 sm:p-6 backdrop-blur-xl shadow-xl hover:border-white/20 hover:scale-[1.01] transition-all flex flex-col justify-between group space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-[#ff3538] font-bold">04 — FORENSIC ARCHIVE</span>
                  <Lock className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Evidence Preservation
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Automatically preserve the critical visual evidence surrounding an incident.
                </p>
              </div>

              {/* VISUAL: INCIDENT SNAPSHOT & METADATA PACKET */}
              <div className="bg-[#0c0d10] border border-white/10 rounded-xl p-3 relative overflow-hidden font-mono text-[9px] space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                  <span className="text-[#ff3538] font-bold">INCIDENT #0241</span>
                  <Badge className="bg-white/10 text-white text-[7.5px] px-1.5 py-0.2 rounded border border-white/15 font-mono">
                    EVIDENCE PRESERVED
                  </Badge>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded p-2 space-y-1 text-[8.5px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">TIMESTAMP:</span>
                    <span className="text-white font-bold">23:41:08</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">CAMERA ID:</span>
                    <span className="text-white font-bold">CAM-03</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">EVENT TYPE:</span>
                    <span className="text-[#ff3538] font-bold">INTRUSION</span>
                  </div>
                </div>

                <div className="text-[8px] text-slate-400 text-center pt-0.5">
                  CRYPTO-HASH SECURED • UNALTERED
                </div>
              </div>

            </motion.div>

            {/* CARD 05: INCIDENT UNDERSTANDING (SPAN 3 - LARGEST & MOST VISUALLY IMPRESSIVE) */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.7, delay: 0.45, type: "spring", stiffness: 90 }}
              className="md:col-span-3 rounded-2xl border border-white/10 bg-[#161820]/90 p-5 sm:p-6 backdrop-blur-xl shadow-xl hover:border-white/20 hover:scale-[1.01] transition-all flex flex-col justify-between group space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-[#ff3538] font-bold">05 — CONTEXTUAL RECONSTRUCTION</span>
                  <Badge className="bg-[#ff3538]/20 text-[#ff3538] border border-[#ff3538]/40 text-[8px] px-2 py-0.2 rounded-full font-mono">
                    KEY CAPABILITY
                  </Badge>
                </div>
                <h3 className="text-xl font-extrabold text-white mb-1">
                  Incident Understanding
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                  Go beyond individual alerts and understand how an incident unfolded across time, space, and multiple cameras.
                </p>
              </div>

              {/* VISUAL: MULTI-CAMERA RECONSTRUCTION MAP */}
              <div className="bg-[#0c0d10] border border-white/10 rounded-xl p-3.5 relative overflow-hidden font-mono text-[10px] space-y-3">
                <div className="flex items-center justify-between text-slate-400 text-[9px] border-b border-white/10 pb-1.5">
                  <span>CROSS-CAMERA SPATIAL MAPPING</span>
                  <span className="text-white font-bold">3 FEEDS CONNECTED</span>
                </div>

                {/* Visual Flow Nodes */}
                <div className="relative py-2 px-1">
                  {/* Connected Background Beam */}
                  <div className="absolute top-6 inset-x-6 h-0.5 bg-gradient-to-r from-slate-700 via-cyan-400 to-[#ff3538] rounded-full" />

                  {/* Moving Pulse Ball */}
                  <motion.div
                    animate={{ left: ["5%", "90%", "5%"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[21px] z-20 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]"
                  />

                  <div className="grid grid-cols-3 gap-3 relative z-10 text-center">
                    <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 flex flex-col items-center space-y-0.5">
                      <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-400 text-white flex items-center justify-center font-bold text-[9px]">
                        01
                      </div>
                      <span className="text-white font-bold text-[9px]">23:41</span>
                      <span className="text-slate-400 text-[8px]">CAM 01</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-600 rounded-lg p-2 flex flex-col items-center space-y-0.5">
                      <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-300 text-white flex items-center justify-center font-bold text-[9px]">
                        03
                      </div>
                      <span className="text-white font-bold text-[9px]">23:44</span>
                      <span className="text-slate-300 text-[8px]">CAM 03</span>
                    </div>

                    <div className="bg-[#ff3538]/10 border border-[#ff3538] rounded-lg p-2 flex flex-col items-center space-y-0.5">
                      <div className="w-6 h-6 rounded-full bg-[#ff3538] text-white flex items-center justify-center font-bold text-[9px]">
                        07
                      </div>
                      <span className="text-white font-bold text-[9px]">23:47</span>
                      <span className="text-[#ff3538] font-bold text-[8px]">CAM 07</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded p-2 flex items-center justify-between text-[8.5px]">
                  <span className="text-slate-400">CHRONOLOGY: <span className="text-white font-bold">23:41 → 23:44 → 23:47</span></span>
                  <span className="text-white font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-[#ff3538]" /> FULL PATH RECONSTRUCTED
                  </span>
                </div>
              </div>

            </motion.div>

          </div>

        </div>

      </div>
    </section>
  );
}
