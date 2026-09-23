"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Play } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";

export default function Hero() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleViewPlatform = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  const handleSeeHowItWorks = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("working");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push("#working");
    }
  };

  return (
    <section id="hero" className="relative min-h-[85vh] sm:min-h-screen bg-[#111317] text-white overflow-hidden flex flex-col justify-center items-center py-20 sm:py-24">

      {/* Ambient Background Glows */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-cyan-500/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#ff3538]/15 rounded-full blur-[150px]" />
      </div>

      {/* Curved Dark Silhouette Overlay in Center Background */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.95 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0 pointer-events-none z-0 flex justify-center"
      >
        <div className="w-full max-w-7xl h-full relative">
          <svg
            className="w-full h-full text-[#181a20]"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            {/* Hourglass / Curved Funnel shape behind the title */}
            <path d="M 0 0 L 1000 0 L 1000 100 C 700 150 650 350 650 550 C 650 750 900 900 1000 1000 L 0 1000 C 250 900 350 750 350 550 C 350 350 300 150 0 100 Z" />
          </svg>
        </div>
      </motion.div>

      {/* TOP LEFT 3D CAMERA */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.75 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="absolute top-4 sm:top-0 left-0 z-10 w-40 sm:w-56 md:w-64 lg:w-[350px] pointer-events-none"
      >
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [0, -2, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-full aspect-square mix-blend-lighten [mask-image:radial-gradient(ellipse_at_30%_30%,black_45%,transparent_85%)]"
        >
          <Image
            src="/images/cctv_left.jpg"
            alt="3D CCTV Camera Left"
            fill
            priority
            className="object-contain object-top-left"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#111317]/90 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#111317]/90 pointer-events-none" />
        </motion.div>
      </motion.div>

      {/* TOP RIGHT 3D CAMERA */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.75 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="absolute top-4 sm:top-0 right-0 z-10 w-40 sm:w-56 md:w-64 lg:w-[350px] pointer-events-none"
      >
        <motion.div
          animate={{ y: [0, -14, 0], rotate: [0, 2, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="relative w-full aspect-square mix-blend-lighten [mask-image:radial-gradient(ellipse_at_70%_30%,black_45%,transparent_85%)]"
        >
          <Image
            src="/images/cctv_right.jpg"
            alt="3D CCTV Camera Right"
            fill
            priority
            className="object-contain object-top-right"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#111317]/90 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#111317]/90 pointer-events-none" />
        </motion.div>
      </motion.div>

      {/* HERO MAIN CONTENT AREA - CENTERED */}
      <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center text-center my-auto pt-6 sm:pt-10">

        {/* PROFESSIONAL HEADLINE */}
        <motion.h1
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-bold tracking-tight text-3xl sm:text-5xl md:text-6xl text-white max-w-3xl mx-auto leading-tight"
        >
          Turn CCTV footage into{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff3538] to-rose-400">
            actionable evidence.
          </span>
        </motion.h1>

        {/* SUBTITLE DESCRIPTION */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-slate-400 text-xs sm:text-sm md:text-base max-w-xl mx-auto mt-4 leading-relaxed font-normal"
        >
          CyberVision AI detects suspicious activity, generates real-time alerts, and automatically builds structured incident reports from CCTV footage &amp; videos.
        </motion.p>

        {/* COMPACT ACTION BUTTONS */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto"
        >
          {/* VIEW PLATFORM BUTTON */}
          <Button
            onClick={handleViewPlatform}
            className="w-full sm:w-auto h-10 sm:h-11 px-6 rounded-full bg-white hover:bg-slate-100 text-black font-semibold text-xs sm:text-sm transition-all shadow-sm hover:shadow flex items-center justify-center space-x-2 cursor-pointer group"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5 text-black group-hover:translate-x-0.5 transition-transform" />
          </Button>

          {/* SEE HOW IT WORKS BUTTON */}
          <Button
            onClick={handleSeeHowItWorks}
            variant="outline"
            className="w-full sm:w-auto h-10 sm:h-11 px-6 rounded-full bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border-white/15 hover:border-white/30 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer backdrop-blur-sm group"
          >
            <Play className="w-3 h-3 text-[#ff3538] fill-[#ff3538] group-hover:scale-110 transition-transform" />
            <span>See How It Works</span>
          </Button>
        </motion.div>

      </div>

    </section>
  );
}
