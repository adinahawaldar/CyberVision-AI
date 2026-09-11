"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Scan } from "lucide-react";

export default function Features() {
  return (
    <section id="features" className="relative min-h-[75vh] sm:min-h-[85vh] bg-[#111317] text-white py-12 sm:py-20 overflow-hidden border-t border-white/5 flex flex-col items-center justify-center">

      {/* BACKGROUND SPOTLIGHT GLOW ACCENTS MATCHING HERO */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[700px] bg-cyan-500/15 rounded-full blur-[160px]"
        />
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-[#ff3538]/15 rounded-full blur-[140px]"
        />
      </div>

      <div className="relative z-10 max-w-[92rem] mx-auto px-2 sm:px-4 lg:px-6 w-full flex flex-col items-center justify-center">



        {/* EXPANDED FULL-WIDTH FEATURE IMAGE SHOWCASE WITH 3D TILT & LASER SCAN BEAM */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88, rotateX: 20, y: 60 }}
          whileInView={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 1.1, type: "spring", stiffness: 70 }}
          className="relative w-full max-w-[90rem] aspect-[16/9] sm:aspect-[21/9] my-auto overflow-hidden group [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_98%)] shadow-2xl rounded-3xl border border-white/10"
        >

          {/* Feature Showcase Render Image */}
          <Image
            src="/images/image.png"
            alt="CyberVision-AI Hardware & Threat Monitoring Showcase"
            fill
            priority
            className="object-cover object-center brightness-[1.08] contrast-[1.05] group-hover:scale-105 transition-transform duration-1000"
          />

          {/* CONTINUOUS CYBER LASER SCAN BEAM */}
          <motion.div
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#06b6d4] z-20 pointer-events-none opacity-80"
          />

          {/* CORNER TARGET RETICLE BRACKETS CONTRACTION ANIMATION */}
          <motion.div
            initial={{ padding: "3rem" }}
            whileInView={{ padding: "1.5rem" }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.9, type: "spring" }}
            className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between"
          >
            <div className="flex justify-between">
              <div className="w-8 h-8 border-t-2 border-l-2 border-cyan-400 shadow-[0_0_10px_#06b6d4]" />
              <div className="w-8 h-8 border-t-2 border-r-2 border-cyan-400 shadow-[0_0_10px_#06b6d4]" />
            </div>
            <div className="flex justify-between">
              <div className="w-8 h-8 border-b-2 border-l-2 border-cyan-400 shadow-[0_0_10px_#06b6d4]" />
              <div className="w-8 h-8 border-b-2 border-r-2 border-cyan-400 shadow-[0_0_10px_#06b6d4]" />
            </div>
          </motion.div>

          {/* 4-DIRECTIONAL SEAMLESS GRADIENT BLEND OVERLAYS INTO #111317 */}
          <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-[#111317] via-[#111317]/50 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#111317] via-[#111317]/50 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-[#111317] via-[#111317]/50 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-[#111317] via-[#111317]/50 to-transparent pointer-events-none z-10" />

        </motion.div>

      </div>

    </section>
  );
}
