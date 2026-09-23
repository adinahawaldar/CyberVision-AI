"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";

export default function WorkflowVideo() {
  return (
    <section
      id="working"
      className="relative bg-[#111317] text-white py-20 sm:py-28 border-t border-white/5 overflow-hidden"
    >
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-cyan-500/10 rounded-full blur-[170px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#ff3538]/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* SECTION HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 space-y-3"
        >

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            The Investigation Starts With the Footage          </h2>

        </motion.div>

        {/* FULL-WIDTH VIDEO SHOWCASE CONTAINER */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 30 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 80 }}
          className="w-full max-w-7xl mx-auto"
        >
          <div className="relative aspect-video sm:aspect-[21/9] sm:min-h-[480px] w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 bg-[#0d0f14] shadow-2xl group flex flex-col justify-between p-4 sm:p-6">

            {/* VIDEO ELEMENT / MEDIA SLOT (READY FOR USER TO ADD VIDEO) */}
            {/*
              ============================================================
              ADD YOUR VIDEO HERE:
              To add your video file:
              1. Drop your video in the /public folder (e.g., /public/workflow.mp4)
              2. Uncomment the <video> tag below:

              <video
                src="/workflow.mp4"
                controls
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-0"
              />

              Or if embedding YouTube/Vimeo:
              <iframe
                src="YOUR_EMBED_URL"
                className="absolute inset-0 w-full h-full z-0"
                allow="autoplay; fullscreen"
              />
              ============================================================
            */}

            {/* Background Grid Pattern & Ambient Glow */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#14161f] via-[#0d0f14] to-[#111317]">
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
                  backgroundSize: "48px 48px",
                }}
              />
              {/* Scanline light effect */}
              <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/60 pointer-events-none" />
            </div>

            {/* TOP HUD: SYSTEM TELEMETRY */}
            <div className="relative z-10 flex items-center justify-between w-full text-xs font-mono">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/70 border border-white/10 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff3538] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff3538]"></span>
                </span>
                <span className="text-slate-300 font-semibold tracking-wider text-[11px]">
                  LIVE WORKFLOW STREAM
                </span>
              </div>


            </div>

            {/* CENTER: PLAY INDICATOR & PLACEHOLDER CONTENT */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto py-8 sm:py-12 space-y-4">
              <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-white/10 group-hover:bg-[#ff3538] border border-white/20 group-hover:border-transparent flex items-center justify-center text-white transition-all duration-300 transform group-hover:scale-110 shadow-2xl backdrop-blur-md cursor-pointer">
                <Play className="w-7 sm:w-8 h-7 sm:h-8 fill-white ml-1 transition-transform" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">


              </div>
            </div>



          </div>
        </motion.div>

      </div>
    </section>
  );
}
