"use client";

import { motion } from "framer-motion";
import {
  FolderPlus,
  UploadCloud,
  ShieldCheck,
  Cpu,
  Clock,
  Bot,
  FileCheck,
  FileText
} from "lucide-react";

export default function DetectionPipeline() {
  // Ordered Steps 01 to 08
  const step01 = {
    number: "01",
    icon: FolderPlus,
    title: "Create Case",
    desc: "Start a new investigation with incident details, priority, location, and case information.",
    accent: "group-hover:border-cyan-500 group-hover:shadow-cyan-500/20",
    iconBg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
  };

  const step02 = {
    number: "02",
    icon: UploadCloud,
    title: "Collect Evidence",
    desc: "Upload CCTV footage, images, videos, logs, documents, and other digital evidence.",
    accent: "group-hover:border-blue-500 group-hover:shadow-blue-500/20",
    iconBg: "bg-blue-500/10 border-blue-500/30 text-blue-400"
  };

  const step03 = {
    number: "03",
    icon: ShieldCheck,
    title: "Verify Evidence",
    desc: "Record evidence metadata and generate integrity hashes to maintain a reliable evidence trail.",
    accent: "group-hover:border-indigo-500 group-hover:shadow-indigo-500/20",
    iconBg: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
  };

  const step04 = {
    number: "04",
    icon: Cpu,
    title: "Analyze Evidence",
    desc: "FORENSIGHT processes the available evidence and identifies relevant events, entities, and indicators.",
    accent: "group-hover:border-[#ff3538] group-hover:shadow-[#ff3538]/20",
    iconBg: "bg-[#ff3538]/10 border-[#ff3538]/30 text-[#ff3538]"
  };

  const step05 = {
    number: "05",
    icon: Clock,
    title: "Reconstruct Timeline",
    desc: "Combine events from CCTV and digital sources into a chronological incident timeline.",
    accent: "group-hover:border-amber-500 group-hover:shadow-amber-500/20",
    iconBg: "bg-amber-500/10 border-amber-500/30 text-amber-400"
  };

  const step06 = {
    number: "06",
    icon: Bot,
    title: "Investigate with AI",
    desc: "Ask Case AI questions about the incident, evidence, and timeline to assist the investigation.",
    accent: "group-hover:border-purple-500 group-hover:shadow-purple-500/20",
    iconBg: "bg-purple-500/10 border-purple-500/30 text-purple-400"
  };

  const step07 = {
    number: "07",
    icon: FileCheck,
    title: "Review Findings",
    desc: "Investigators review AI-generated insights, add observations, validate evidence, and finalize findings.",
    accent: "group-hover:border-teal-500 group-hover:shadow-teal-500/20",
    iconBg: "bg-teal-500/10 border-teal-500/30 text-teal-400"
  };

  const step08 = {
    number: "08",
    icon: FileText,
    title: "Generate Report",
    desc: "Create a structured investigation report containing the case summary, evidence, timeline, findings, and review details.",
    accent: "group-hover:border-emerald-500 group-hover:shadow-emerald-500/20",
    iconBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
  };

  // Row 1: Steps 1 to 4 (Left to Right)
  const stepsRow1 = [step01, step02, step03, step04];

  // Row 2 Desktop: 08 <- 07 <- 06 <- 05 (Serpentine looping right to left under Row 1)
  const stepsRow2Desktop = [step08, step07, step06, step05];

  // Mobile/Tablet: 01 to 08 in strict sequential order
  const allStepsMobile = [step01, step02, step03, step04, step05, step06, step07, step08];

  const renderStepCard = (step: typeof step01, idx: number) => {
    const IconComponent = step.icon;
    return (
      <motion.div
        key={step.number}
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: idx * 0.06 }}
        className="flex flex-col items-center text-center group px-2"
      >
        <div className="relative mb-4">
          {/* Number Badge */}
          <div className="absolute -top-2 -left-2 z-20 w-7 h-7 rounded-full bg-[#1c1f2b] border border-white/20 text-[11px] font-mono font-bold text-slate-200 flex items-center justify-center shadow-lg group-hover:border-cyan-400 group-hover:text-cyan-400 transition-colors">
            {step.number}
          </div>

          {/* Outer Circle Node */}
          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#151722]/90 border border-white/10 ${step.accent} shadow-xl flex items-center justify-center backdrop-blur-xl relative transition-all duration-300 group-hover:scale-105`}>
            {/* Orbit Border Ring */}
            <div className="absolute inset-0 rounded-full border border-cyan-400/20 opacity-50" />

            {/* Inner Icon Badge */}
            <div className={`p-2.5 sm:p-3 rounded-xl border ${step.iconBg} transition-transform duration-300 group-hover:scale-110`}>
              <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight mb-1.5 group-hover:text-cyan-400 transition-colors">
          {step.title}
        </h3>
        <p className="text-xs text-slate-400 font-normal leading-relaxed max-w-[220px]">
          {step.desc}
        </p>
      </motion.div>
    );
  };

  return (
    <section id="detection-pipeline" className="relative min-h-[85vh] bg-[#111317] text-white py-24 sm:py-32 overflow-hidden border-t border-white/5 flex flex-col items-center justify-center">

      {/* Background Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/3 left-1/4 w-[700px] h-[450px] bg-cyan-500/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[700px] h-[450px] bg-[#ff3538]/10 rounded-full blur-[160px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center">

        {/* SECTION HEADER */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-3 mb-20"
        >
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-tight">
            DETECTION PIPELINE FLOW
          </h2>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Sequential 8-step intelligence &amp; evidence investigation workflow powering CyberVision-AI.
          </p>
        </motion.div>

        {/* DESKTOP S-SERPENTINE 8-STEP PROCESS FLOW */}
        <div className="hidden lg:block w-full max-w-6xl mx-auto relative">

          {/* DESKTOP S-CURVE CONNECTING SVG BRIDGING ALL 8 NODES CONTINUOUSLY */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <svg className="w-full h-full" viewBox="0 0 1000 280" fill="none" preserveAspectRatio="none">
              <path
                d="M 125 48 Q 250 88 375 48 M 375 48 Q 500 8 625 48 M 625 48 Q 750 88 875 48 M 875 48 Q 935 144 875 240 M 875 240 Q 750 200 625 240 M 625 240 Q 500 280 375 240 M 375 240 Q 250 200 125 240"
                stroke="rgba(255,53,56,0.45)"
                strokeWidth="2.5"
                strokeDasharray="6 6"
              />
            </svg>
          </div>

          <div className="space-y-20 relative z-10">
            {/* ROW 1: STEPS 01 TO 04 (LEFT TO RIGHT) */}
            <div className="grid grid-cols-4 gap-6 items-start">
              {stepsRow1.map((step, idx) => renderStepCard(step, idx))}
            </div>

            {/* ROW 2: STEPS 08 TO 05 (FLIPPED ORDER RIGHT TO LEFT: 08 <- 07 <- 06 <- 05) */}
            <div className="grid grid-cols-4 gap-6 items-start">
              {stepsRow2Desktop.map((step, idx) => renderStepCard(step, idx + 4))}
            </div>
          </div>
        </div>

        {/* MOBILE / TABLET VIEW: CLEAN 1-2 COLUMN SEQUENTIAL LIST (01 TO 08) */}
        <div className="lg:hidden w-full max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-10 items-start">
          {allStepsMobile.map((step, idx) => renderStepCard(step, idx))}
        </div>

      </div>

    </section>
  );
}
