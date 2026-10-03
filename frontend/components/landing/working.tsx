"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Radio, Bell, Activity, Eye, ShieldCheck } from "lucide-react";

export default function Working() {
  return (
    <section id="working" className="relative min-h-screen bg-[#111317] text-white py-20 sm:py-28 overflow-hidden border-t border-white/5">

      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-500/10 rounded-full blur-[160px]"
        />
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-[#ff3538]/10 rounded-full blur-[140px]"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">

        {/* SECTION CAPTION WITH SCROLL ANIMATION */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-16 space-y-3"
        >


          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-tight">
            SYSTEM OPERATIONS & WORKFLOW
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Connecting edge CCTV camera streams directly to real-time AI computer vision analysis and unified mobile & desktop control rooms.
          </p>
        </motion.div>

        {/* FULL-WIDTH 2-COLUMN SHOWCASE WITH 3D SPLIT CARDS REVEAL ON SCROLL IN & UP */}
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center [perspective:1200px]">

          {/* LEFT IMAGE: CCTV CAMERA AI DETECTION WITH 3D ROTATION & SNAP TARGET RETICLES */}
          <motion.div
            initial={{ opacity: 0, x: -100, rotateY: -22, scale: 0.9 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 1.1, type: "spring", stiffness: 75 }}
            className="relative group w-full flex flex-col items-center justify-center"
          >
            <div className="relative w-full aspect-[4/3] flex items-center justify-center overflow-hidden [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_98%)] rounded-2xl border border-white/10 shadow-2xl">

              {/* CCTV Camera AI Detection Image */}
              <Image
                src="/images/cctv_camera_detection.jpg"
                alt="Live Security CCTV Camera Feed with AI Reticle Detection"
                fill
                priority
                className="object-cover group-hover:scale-105 transition-transform duration-700 brightness-95 contrast-105"
              />

              {/* 4-SIDE SEAMLESS BACKGROUND BLEND OVERLAYS */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#111317] via-transparent via-50% to-[#111317] pointer-events-none z-10" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#111317] via-transparent via-50% to-[#111317] pointer-events-none z-10" />

              {/* Central Grid Cross Pattern Background */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25 z-10">
                <div className="w-64 h-64 border border-cyan-500/30 grid grid-cols-6 grid-rows-6 [mask-image:radial-gradient(circle,black_60%,transparent_100%)]">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div key={i} className="border border-cyan-500/20" />
                  ))}
                </div>
              </div>

              {/* Crosshair Lines */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25 z-10">
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                <div className="absolute w-[1px] h-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent" />
              </div>

              {/* CAMERA RETICLE BORDER CORNER BRACKETS [ ] WITH SNAP ANIMATION */}
              <motion.div
                initial={{ scale: 1.25, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
                className="absolute inset-6 pointer-events-none z-20 flex flex-col justify-between p-2"
              >
                {/* Top Row Brackets */}
                <div className="w-full flex justify-between">
                  <div className="w-8 h-8 border-t-2 border-l-2 border-white shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
                  <div className="w-8 h-8 border-t-2 border-r-2 border-white shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
                </div>

                {/* Center Pulsing Red Detection Target */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-12 h-12 rounded-full bg-[#ff3538] animate-ping opacity-75" />
                    <span className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#ff3538] shadow-[0_0_20px_#ff3538] border-2 border-white/90" />
                  </div>
                </div>

                {/* Bottom Row Brackets */}
                <div className="w-full flex justify-between">
                  <div className="w-8 h-8 border-b-2 border-l-2 border-white shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
                  <div className="w-8 h-8 border-b-2 border-r-2 border-white shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
                </div>
              </motion.div>

              {/* Floating Top & Bottom Telemetry Badges */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ delay: 0.5 }}
                className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded border border-[#ff3538]/40 flex items-center space-x-2 z-20 shadow-lg"
              >
                <span className="w-2 h-2 rounded-full bg-[#ff3538] animate-ping" />
                <span className="text-[10px] font-mono font-bold text-white tracking-widest uppercase">CAM 14H • INTRUSION LOCK</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ delay: 0.6 }}
                className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded border border-cyan-500/40 flex items-center space-x-2 z-20 shadow-lg"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider">YOLOv8 Engine • 99.2%</span>
              </motion.div>

            </div>
          </motion.div>

          {/* RIGHT IMAGE: DESKTOP & MOBILE COMMAND DASHBOARD WITH 3D ROTATION */}
          <motion.div
            initial={{ opacity: 0, x: 100, rotateY: 22, scale: 0.9 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 1.1, type: "spring", stiffness: 75, delay: 0.1 }}
            className="relative group w-full flex flex-col items-center justify-center"
          >
            <div className="relative w-full aspect-[4/3] flex items-center justify-center overflow-hidden [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_98%)] rounded-2xl border border-white/10 shadow-2xl">

              {/* Desktop & Mobile Command Dashboard Image */}
              <Image
                src="/images/mobile_desktop_dashboard.jpg"
                alt="Desktop and Mobile View Security Command Dashboard"
                fill
                priority
                className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
              />

              {/* 4-SIDE SEAMLESS BACKGROUND BLEND OVERLAYS */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#111317] via-transparent via-50% to-[#111317] pointer-events-none z-10" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#111317] via-transparent via-50% to-[#111317] pointer-events-none z-10" />

              {/* DASHBOARD CORNER RETICLE ACCENTS */}
              <div className="absolute inset-6 pointer-events-none z-20 flex flex-col justify-between p-2 opacity-60">
                <div className="w-full flex justify-between">
                  <div className="w-6 h-6 border-t border-l border-cyan-400" />
                  <div className="w-6 h-6 border-t border-r border-cyan-400" />
                </div>
                <div className="w-full flex justify-between">
                  <div className="w-6 h-6 border-b border-l border-cyan-400" />
                  <div className="w-6 h-6 border-b border-r border-cyan-400" />
                </div>
              </div>

              {/* Telemetry Badges */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ delay: 0.5 }}
                className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded border border-cyan-500/40 flex items-center space-x-2 z-20 shadow-lg"
              >
                <Bell className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span className="text-[10px] font-mono font-bold text-white tracking-wider">COMMAND MATRIX</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ delay: 0.6 }}
                className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded border border-emerald-500/40 flex items-center space-x-2 z-20 shadow-lg"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider">LIVE WEBSOCKETS</span>
              </motion.div>

            </div>
          </motion.div>

        </div>

      </div>

    </section>
  );
}
