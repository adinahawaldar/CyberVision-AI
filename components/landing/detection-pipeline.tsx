"use client";

import { motion } from "framer-motion";
import {
  Video,
  Layers,
  Cpu,
  Activity,
  Bell,
  FileText,
  Search,
  ShieldAlert,
  Sparkles,
  GitMerge
} from "lucide-react";

export default function DetectionPipeline() {
  // Row 1: Steps 1 to 4 (Left to Right)
  const stepsRow1 = [
    {
      number: "1",
      icon: Video,
      title: "CCTV Cameras",
      subtitle: "RTSP / Video Stream",
      accent: "group-hover:border-cyan-500 group-hover:shadow-cyan-500/20",
      iconBg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
    },
    {
      number: "2",
      icon: Layers,
      title: "Video Processing",
      subtitle: "OpenCV / Frame Extract",
      accent: "group-hover:border-blue-500 group-hover:shadow-blue-500/20",
      iconBg: "bg-blue-500/10 border-blue-500/30 text-blue-400"
    },
    {
      number: "3",
      icon: Cpu,
      title: "AI Detection",
      subtitle: "YOLO / CV Model",
      accent: "group-hover:border-indigo-500 group-hover:shadow-indigo-500/20",
      iconBg: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
    },
    {
      number: "4",
      icon: Activity,
      title: "Event Analysis",
      subtitle: "Person / Vehicle / Zone",
      accent: "group-hover:border-[#ff3538] group-hover:shadow-[#ff3538]/20",
      iconBg: "bg-[#ff3538]/10 border-[#ff3538]/30 text-[#ff3538]"
    }
  ];

  // Row 2: Steps 8, 7, 6, 5 rendered so visual order on screen is 8 <- 7 <- 6 <- 5
  const stepsRow2 = [
    {
      number: "8",
      icon: ShieldAlert,
      title: "Security Response",
      subtitle: "Monitor & Action Protocol",
      accent: "group-hover:border-emerald-500 group-hover:shadow-emerald-500/20",
      iconBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
    },
    {
      number: "7",
      icon: Search,
      title: "Investigation",
      subtitle: "Timeline + Video Sync",
      accent: "group-hover:border-teal-500 group-hover:shadow-teal-500/20",
      iconBg: "bg-teal-500/10 border-teal-500/30 text-teal-400"
    },
    {
      number: "6",
      icon: FileText,
      title: "Incident Engine",
      subtitle: "Event + Timestamp + Evidence",
      accent: "group-hover:border-purple-500 group-hover:shadow-purple-500/20",
      iconBg: "bg-purple-500/10 border-purple-500/30 text-purple-400"
    },
    {
      number: "5",
      icon: Bell,
      title: "Alert Engine",
      subtitle: "Severity + Live Alert",
      accent: "group-hover:border-amber-500 group-hover:shadow-amber-500/20",
      iconBg: "bg-amber-500/10 border-amber-500/30 text-amber-400"
    }
  ];

  return (
    <section id="detection-pipeline" className="relative min-h-[85vh] bg-[#111317] text-white py-24 sm:py-32 overflow-hidden border-t border-white/5 flex flex-col items-center justify-center">

      {/* Background Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/4 w-[700px] h-[450px] bg-cyan-500/10 rounded-full blur-[160px]"
        />
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/3 right-1/4 w-[700px] h-[450px] bg-[#ff3538]/10 rounded-full blur-[160px]"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center">

        {/* SECTION HEADER WITH SCROLL ANIMATION */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto space-y-3 mb-20"
        >


          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-tight">
            DETECTION PIPELINE FLOW
          </h2>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Sequential 8-step intelligence workflow powering CyberVision-AI real-time surveillance.
          </p>
        </motion.div>

        {/* S-SERPENTINE 8-STEP PROCESS FLOW CONTAINER */}
        <div className="w-full max-w-6xl mx-auto relative">

          {/* DESKTOP S-CURVE CONNECTING SVG BRIDGING ALL 8 NODES CONTINUOUSLY */}
          <div className="hidden lg:block absolute inset-0 pointer-events-none z-0">
            <svg className="w-full h-full" viewBox="0 0 1000 280" fill="none" preserveAspectRatio="none">
              <motion.path
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ duration: 2, ease: "easeInOut" }}
                d="M 125 48 Q 250 88 375 48 M 375 48 Q 500 8 625 48 M 625 48 Q 750 88 875 48 M 875 48 Q 935 144 875 240 M 875 240 Q 750 200 625 240 M 625 240 Q 500 280 375 240 M 375 240 Q 250 200 125 240"
                stroke="rgba(255,53,56,0.45)"
                strokeWidth="2.5"
                strokeDasharray="6 6"
              />
            </svg>
          </div>

          <div className="space-y-16 sm:space-y-20 relative z-10">

            {/* ROW 1: STEPS 1 TO 4 (LEFT TO RIGHT) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 items-start">
              {stepsRow1.map((step, idx) => {
                const IconComponent = step.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.6, y: 50 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.7, delay: idx * 0.12, type: "spring", stiffness: 100 }}
                    className="flex flex-col items-center text-center group"
                  >
                    <div className="relative mb-4">
                      {/* Minimal Number Badge */}
                      <div className="absolute -top-2 -left-2 z-20 w-6 h-6 rounded-full bg-[#1c1f2b] border border-white/20 text-[11px] font-mono font-bold text-slate-200 flex items-center justify-center shadow-lg group-hover:border-cyan-400 group-hover:text-cyan-400 transition-colors">
                        {step.number}
                      </div>

                      {/* Minimal Outer Circle Node */}
                      <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#151722]/90 border border-white/10 ${step.accent} shadow-xl flex items-center justify-center transition-all duration-500 backdrop-blur-xl group-hover:scale-110 relative`}>
                        {/* Orbit Neon Glow Effect */}
                        <div className="absolute inset-0 rounded-full border border-cyan-400/20 group-hover:border-cyan-400/80 animate-spin opacity-50 transition-opacity" style={{ animationDuration: "12s" }} />

                        {/* Minimal Inner Icon Badge */}
                        <div className={`p-2 sm:p-2.5 rounded-xl border ${step.iconBg} transition-transform duration-500 group-hover:scale-110`}>
                          <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                      </div>
                    </div>

                    <h3 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-tight mb-1 group-hover:text-cyan-400 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono font-medium max-w-[160px]">
                      {step.subtitle}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            {/* ROW 2: STEPS 8 TO 5 (FLIPPED ORDER RIGHT TO LEFT: 8 <- 7 <- 6 <- 5) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 items-start">
              {stepsRow2.map((step, idx) => {
                const IconComponent = step.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.6, y: 50 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.7, delay: (4 + idx) * 0.12, type: "spring", stiffness: 100 }}
                    className="flex flex-col items-center text-center group"
                  >
                    <div className="relative mb-4">
                      {/* Minimal Number Badge */}
                      <div className="absolute -top-2 -left-2 z-20 w-6 h-6 rounded-full bg-[#1c1f2b] border border-white/20 text-[11px] font-mono font-bold text-slate-200 flex items-center justify-center shadow-lg group-hover:border-cyan-400 group-hover:text-cyan-400 transition-colors">
                        {step.number}
                      </div>

                      {/* Minimal Outer Circle Node */}
                      <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#151722]/90 border border-white/10 ${step.accent} shadow-xl flex items-center justify-center transition-all duration-500 backdrop-blur-xl group-hover:scale-110 relative`}>
                        {/* Orbit Neon Glow Effect */}
                        <div className="absolute inset-0 rounded-full border border-red-400/20 group-hover:border-red-400/80 animate-spin opacity-50 transition-opacity" style={{ animationDuration: "12s" }} />

                        {/* Minimal Inner Icon Badge */}
                        <div className={`p-2 sm:p-2.5 rounded-xl border ${step.iconBg} transition-transform duration-500 group-hover:scale-110`}>
                          <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                      </div>
                    </div>

                    <h3 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-tight mb-1 group-hover:text-cyan-400 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono font-medium max-w-[160px]">
                      {step.subtitle}
                    </p>
                  </motion.div>
                );
              })}
            </div>

          </div>

        </div>

      </div>

    </section>
  );
}
