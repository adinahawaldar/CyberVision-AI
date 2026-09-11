"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldAlert, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";

export default function Hero() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleActionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/login");
  };

  return (
    <section className="relative min-h-[85vh] sm:min-h-screen bg-[#111317] text-white overflow-hidden flex flex-col justify-center items-center py-20">

      {/* Ambient Pulsing Background Glows */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-cyan-500/10 rounded-full blur-[160px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.45, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#ff3538]/15 rounded-full blur-[150px]"
        />
      </div>

      {/* Curved Dark Silhouette Overlay in Center Background */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 0.95, scale: 1 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
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

      {/* TOP LEFT 3D CAMERA - CRAZY SCROLL IN & UP ANIMATION */}
      <motion.div
        initial={{ opacity: 0, x: -120, y: -60, rotate: -15 }}
        whileInView={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 1.1, type: "spring", stiffness: 70 }}
        className="absolute top-0 left-0 z-5 w-52 sm:w-64 md:w-72 lg:w-[370px] pointer-events-none"
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

      {/* TOP RIGHT 3D CAMERA - CRAZY SCROLL IN & UP ANIMATION */}
      <motion.div
        initial={{ opacity: 0, x: 120, y: -60, rotate: 15 }}
        whileInView={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 1.1, type: "spring", stiffness: 70 }}
        className="absolute top-0 right-0 z-5 w-52 sm:w-64 md:w-72 lg:w-[370px] pointer-events-none"
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

      {/* HERO MAIN CONTENT AREA - PERFECTLY CENTERED */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center text-center my-auto pt-8">



        {/* HIGH-IMPACT TYPOGRAPHY "WE SEE MORE" WITH STAGGERED 3D REVEAL */}
        <div className="relative select-none my-2 sm:my-4">
          <h1 className="font-black uppercase tracking-tighter leading-[0.88] flex flex-col items-center justify-center font-extrabold">

            {/* "WE" */}
            <motion.span
              initial={{ opacity: 0, y: 50, scale: 0.7, rotateX: 60 }}
              whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 90 }}
              className="text-5xl sm:text-7xl md:text-8xl lg:text-[8.5rem] font-black font-extrabold text-white drop-shadow-[0_10px_25px_rgba(0,0,0,0.95)] tracking-tight"
            >
              WE
            </motion.span>

            {/* "SEE MORE" ROW */}
            <div className="flex items-center justify-center space-x-2 sm:space-x-4 md:space-x-5 mt-1 sm:mt-2">

              {/* "SEE" Highlight Block in Vibrant Coral-Red with 3D Pop */}
              <motion.span
                initial={{ opacity: 0, scale: 0.4, rotate: -15 }}
                whileInView={{ opacity: 1, scale: 1, rotate: -2 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ duration: 0.8, delay: 0.25, type: "spring", stiffness: 120 }}
                className="bg-[#ff3538] text-white px-4 sm:px-6 py-0.5 sm:py-1 rounded-xl sm:rounded-2xl text-4xl sm:text-6xl md:text-7xl lg:text-[7.5rem] font-black font-extrabold tracking-tight shadow-[0_8px_30px_rgba(255,53,56,0.55)] hover:rotate-0 hover:scale-105 transition-all duration-300"
              >
                SEE
              </motion.span>

              {/* "MORE" */}
              <motion.span
                initial={{ opacity: 0, y: 50, scale: 0.7, rotateX: 60 }}
                whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ duration: 0.8, delay: 0.35, type: "spring", stiffness: 90 }}
                className="text-5xl sm:text-7xl md:text-8xl lg:text-[8.5rem] font-black font-extrabold text-white drop-shadow-[0_10px_25px_rgba(0,0,0,0.95)] tracking-tight"
              >
                MORE
              </motion.span>

            </div>
          </h1>
        </div>

        {/* SUBTITLE SPEC */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="text-slate-400 text-xs sm:text-sm md:text-base max-w-xl mx-auto mt-4 font-mono font-medium tracking-wide"
        >
          Autonomous real-time object tracking • Instant threat alerts • Unified multi-camera intelligence
        </motion.p>

        {/* GET STARTED CTA BUTTON WITH SPRING EXPANSION */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.8 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.8, delay: 0.6, type: "spring", stiffness: 100 }}
          className="mt-8 sm:mt-10"
        >
          <Button
            onClick={handleActionClick}
            size="lg"
            className="bg-white text-black hover:bg-slate-200 font-extrabold tracking-widest text-xs sm:text-sm uppercase px-8 sm:px-10 py-5 sm:py-6 rounded-full shadow-xl shadow-white/20 transition-all duration-300 hover:scale-110 border border-white/80 flex items-center space-x-2 cursor-pointer group"
          >
            <span>GET STARTED</span>
            <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>

      </div>

    </section>
  );
}
