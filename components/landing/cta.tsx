"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";

export default function CTA() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  return (
    <section className="py-12 sm:py-16 bg-[#111317] text-white relative overflow-hidden flex flex-col justify-center items-center">

      {/* Background Ambient Aura Glow */}
      <div className="absolute inset-0 pointer-events-none z-0 flex justify-center items-center">
        <div className="w-[600px] h-[350px] bg-[#ff3538]/20 rounded-full blur-[140px]" />
      </div>

      {/* Background Curved Silhouette matching Hero section */}
      <div className="absolute inset-0 pointer-events-none z-0 flex justify-center">
        <div className="w-full max-w-7xl h-full relative">
          <svg
            className="w-full h-full text-[#161820] opacity-90"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M 0 1000 L 1000 1000 L 1000 900 C 700 850 650 650 650 450 C 650 250 900 100 1000 0 L 0 0 C 250 100 350 250 350 450 C 350 650 300 850 0 900 Z" />
          </svg>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-white/15 bg-[#161820]/90 p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl text-center space-y-5 relative overflow-hidden"
        >

          {/* High-Impact Heading */}
          <div className="space-y-3 max-w-3xl mx-auto select-none">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-tight">
              READY TO UPGRADE YOUR{" "}
              <span className="inline-block bg-[#ff3538] text-white px-3 sm:px-4 py-0.5 rounded-xl sm:rounded-2xl shadow-[0_8px_30px_rgba(255,53,56,0.55)] my-0.5">
                SURVEILLANCE
              </span>{" "}
              INTELLIGENCE?
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm md:text-base max-w-xl mx-auto font-medium">
              Get started with the dashboard right now. Monitor real-time CCTV streams, test AI object tracking, and experience instant alert dispatches.
            </p>
          </div>

          {/* Minimal Height White CTA Button */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="pt-1 flex justify-center"
          >
            <Button
              onClick={handleDashboardClick}
              className="h-10 sm:h-11 px-6 sm:px-8 rounded-full bg-white hover:bg-slate-100 text-black font-extrabold text-xs uppercase tracking-wider transition-all hover:scale-105 shadow-lg flex items-center space-x-2 cursor-pointer border-0 group"
            >
              <span>GET STARTED NOW</span>
              <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          {/* Feature highlights below CTA button */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#ff3538]" /> Demo Admin Access Built-In
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#ff3538]" /> Mock Camera HLS Streams Active
            </span>
          </div>

        </motion.div>
      </div>
    </section>
  );
}
