"use client";

import { motion } from "framer-motion";
import { Activity, ShieldCheck, Zap, Server, Globe, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Stats() {
  const metrics = [
    {
      value: "< 30ms",
      label: "Inference Latency",
      detail: "Ultra-fast frame processing on GPU nodes",
      icon: Zap,
      accent: "from-cyan-400 to-blue-500",
      textColor: "text-cyan-400"
    },
    {
      value: "99.99%",
      label: "System Uptime",
      detail: "Fail-safe node cluster health tracking",
      icon: Server,
      accent: "from-emerald-400 to-teal-500",
      textColor: "text-emerald-400"
    },
    {
      value: "100+",
      label: "Concurrent Streams",
      detail: "Multi-threaded HLS / RTSP camera matrix",
      icon: Activity,
      accent: "from-blue-400 to-indigo-500",
      textColor: "text-blue-400"
    },
    {
      value: "0.01%",
      label: "False Positive Rate",
      detail: "Strict confidence thresholding algorithms",
      icon: ShieldCheck,
      accent: "from-purple-400 to-pink-500",
      textColor: "text-purple-400"
    }
  ];

  return (
    <section id="live-specs" className="py-20 bg-slate-950/80 border-y border-border/50 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-48 bg-cyan-500/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto mb-12 space-y-2"
        >
          <Badge variant="outline" className="text-xs font-mono text-cyan-400 border-cyan-500/30 bg-cyan-950/30">
            PERFORMANCE SPECS
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Benchmarked for High-Stakes Environments
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 60, scale: 0.85 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ duration: 0.7, delay: idx * 0.12, type: "spring", stiffness: 100 }}
                className="p-6 rounded-2xl bg-card/30 backdrop-blur-md border border-border/60 hover:border-cyan-500/40 hover:scale-105 transition-all duration-300 group flex flex-col justify-between shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 group-hover:scale-110 transition-transform">
                    <Icon className={`w-5 h-5 ${m.textColor}`} />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">
                    METRIC #0{idx + 1}
                  </span>
                </div>

                <div>
                  <div className={`text-4xl font-extrabold font-mono tracking-tight bg-gradient-to-r ${m.accent} bg-clip-text text-transparent`}>
                    {m.value}
                  </div>
                  <div className="text-sm font-semibold text-foreground mt-1">
                    {m.label}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-normal">
                    {m.detail}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
