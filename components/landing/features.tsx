"use client";

import { 
  ShieldCheck, 
  Cpu, 
  Video, 
  Bot, 
  Activity, 
  Bell, 
  Eye, 
  Zap, 
  Sparkles,
  Lock,
  Compass,
  Server
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Features() {
  const featureList = [
    {
      icon: Cpu,
      title: "YOLOv8 Real-Time AI Engine",
      description: "Detect humans, vehicles, and objects with deep precision. Track multi-target trajectories simultaneously across high-resolution CCTV camera streams.",
      color: "from-cyan-500 to-blue-600",
      badge: "60 FPS Processing",
      accent: "text-cyan-400"
    },
    {
      icon: ShieldCheck,
      title: "Behavioral Threat Detection",
      description: "Automated flagging for fall detection, crowd formation, unauthorized zone entry, and suspicious loitering before critical security incidents escalate.",
      color: "from-red-500 to-amber-600",
      badge: "Instant Severity Tagging",
      accent: "text-red-400"
    },
    {
      icon: Video,
      title: "Multi-Camera HLS Matrix",
      description: "Ultra-low latency HTTP Live Streaming (HLS) grid dashboard supporting 100+ concurrent cameras with fluid resolution switching.",
      color: "from-blue-500 to-indigo-600",
      badge: "HLS / RTSP Stream",
      accent: "text-blue-400"
    },
    {
      icon: Bot,
      title: "AI Natural Language Log Query",
      description: "Ask plain-language questions like 'Show me all red-alert incidents from Entrance 3 between 2 PM and 4 PM' to fetch video highlights instantly.",
      color: "from-emerald-500 to-teal-600",
      badge: "LLM Security Assistant",
      accent: "text-emerald-400"
    },
    {
      icon: Activity,
      title: "Node Infrastructure Health",
      description: "Continuous telemetry tracking server CPU load, RAM usage, storage volume, and network throughput to ensure zero surveillance blind spots.",
      color: "from-purple-500 to-pink-600",
      badge: "99.99% Uptime Monitor",
      accent: "text-purple-400"
    },
    {
      icon: Bell,
      title: "WebSockets Alert Dispatch",
      description: "Real-time socket alerts delivered directly to guards and admin control rooms with color-coded urgency (Critical 🔴, Warning 🟡, Info 🟢).",
      color: "from-amber-500 to-orange-600",
      badge: "<10ms WebSockets",
      accent: "text-amber-400"
    }
  ];

  return (
    <section id="features" className="py-20 md:py-32 bg-slate-950/60 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="outline" className="px-3 py-1 text-xs font-mono text-cyan-400 border-cyan-500/30 bg-cyan-950/30">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
            INTELLIGENT ARCHITECTURE
          </Badge>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
            Engineered for Modern <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">Security Operations</span>
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground">
            CyberVision-AI replaces manual screen fatigue with autonomous computer vision intelligence, offering complete situational awareness across municipal and enterprise facilities.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {featureList.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <Card 
                key={index}
                className="bg-card/40 backdrop-blur-xl border-border/60 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-950/30 group relative overflow-hidden flex flex-col justify-between"
              >
                {/* Top Subtle Gradient Accent */}
                <div className={`h-1 w-full bg-gradient-to-r ${feat.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
                
                <CardHeader className="space-y-3 pt-6">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-background/80 border border-border/60 group-hover:scale-105 transition-transform duration-300">
                      <Icon className={`w-6 h-6 ${feat.accent}`} />
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-mono bg-accent/80 text-muted-foreground border border-border/40">
                      {feat.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold text-foreground group-hover:text-cyan-400 transition-colors">
                    {feat.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pb-6">
                  <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                    {feat.description}
                  </CardDescription>
                </CardContent>

              </Card>
            );
          })}
        </div>

      </div>
    </section>
  );
}
