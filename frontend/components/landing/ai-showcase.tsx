"use client";

import { useState } from "react";
import { 
  Eye, 
  AlertOctagon, 
  UserCheck, 
  Activity, 
  ShieldAlert, 
  Bot, 
  Terminal, 
  Clock, 
  Zap,
  CheckCircle,
  FileCode2,
  Sliders
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AIShowcase() {
  const [activeTab, setActiveTab] = useState("fall-detection");

  const scenarios = [
    {
      id: "fall-detection",
      name: "Fall & Medical Emergency",
      severity: "CRITICAL",
      severityColor: "bg-red-500/20 text-red-400 border-red-500/40",
      cam: "CAM-04 (Public Park Sector 2)",
      confidence: "99.4%",
      latency: "28ms",
      desc: "Detects human rapid downward velocity vectors followed by posture irregularity on floor surfaces.",
      logs: [
        { time: "00:36:12", type: "POSE_ANALYSIS", text: "Keypoints 11-16 horizontal displacement triggered threshold" },
        { time: "00:36:13", type: "FALL_DETECTED", text: "High confidence person posture anomaly detected (ID #904)" },
        { time: "00:36:14", type: "DISPATCH_SENT", text: "Medical emergency alert sent to Control Room Node" }
      ]
    },
    {
      id: "perimeter-intrusion",
      name: "Perimeter Zone Intrusion",
      severity: "HIGH",
      severityColor: "bg-amber-500/20 text-amber-400 border-amber-500/40",
      cam: "CAM-01 (Building West Gate)",
      confidence: "98.7%",
      latency: "32ms",
      desc: "Draws virtual polygon fences over CCTV frames to alert guards when unauthorized personnel cross restricted lines.",
      logs: [
        { time: "00:34:02", type: "FENCE_CROSS", text: "Bounding Box centroid crossed Line-Alpha coordinates" },
        { time: "00:34:03", type: "INTRUSION_ALERT", text: "Unregistered subject in restricted vault corridor" },
        { time: "00:34:04", type: "PTZ_LOCK", text: "Automated PTZ Camera tracking target trajectory" }
      ]
    },
    {
      id: "crowd-density",
      name: "Crowd Density Anomaly",
      severity: "MEDIUM",
      severityColor: "bg-blue-500/20 text-blue-400 border-blue-500/40",
      cam: "CAM-08 (Metro Station Lobby)",
      confidence: "96.5%",
      latency: "41ms",
      desc: "Counts real-time human density per square meter to prevent stampedes and monitor congestion.",
      logs: [
        { time: "00:31:40", type: "DENSITY_COUNT", text: "Occupancy limit exceeded: 84 humans in 25m² sector" },
        { time: "00:31:42", type: "CONGESTION_FLAG", text: "Turnstile bottleneck warning logged" },
        { time: "00:31:45", type: "ROUTING_RECOMMEND", text: "Suggested secondary gate opening to station manager" }
      ]
    }
  ];

  const currentScenario = scenarios.find(s => s.id === activeTab) || scenarios[0];

  return (
    <section id="capabilities" className="py-20 md:py-32 bg-background relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-gradient-to-l from-cyan-500/10 via-blue-600/5 to-transparent rounded-full blur-[140px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="outline" className="px-3 py-1 text-xs font-mono text-cyan-400 border-cyan-500/30 bg-cyan-950/30">
            <Eye className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
            COMPUTER VISION IN ACTION
          </Badge>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
            Autonomous Detection <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">Scenarios</span>
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground">
            Explore how CyberVision-AI evaluates video frames in real time, executing deep neural inference to categorize events with zero manual intervention.
          </p>
        </div>

        {/* Interactive Scenario Workbench */}
        <div className="mt-14 max-w-5xl mx-auto">
          <Tabs defaultValue="fall-detection" onValueChange={setActiveTab} className="w-full">
            
            <TabsList className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-border/60 h-auto">
              <TabsTrigger 
                value="fall-detection" 
                className="py-3 text-xs sm:text-sm font-medium font-mono data-[state=active]:bg-cyan-950 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/40 border border-transparent rounded-lg transition-all"
              >
                Fall & Medical Alert
              </TabsTrigger>
              <TabsTrigger 
                value="perimeter-intrusion" 
                className="py-3 text-xs sm:text-sm font-medium font-mono data-[state=active]:bg-cyan-950 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/40 border border-transparent rounded-lg transition-all"
              >
                Zone Intrusion
              </TabsTrigger>
              <TabsTrigger 
                value="crowd-density" 
                className="py-3 text-xs sm:text-sm font-medium font-mono data-[state=active]:bg-cyan-950 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/40 border border-transparent rounded-lg transition-all"
              >
                Crowd Density
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 rounded-2xl border border-border/80 bg-slate-950 p-6 shadow-2xl">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Scenario Details */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                      ACTIVE SCENARIO
                    </span>
                    <Badge variant="outline" className={`font-mono text-xs ${currentScenario.severityColor}`}>
                      {currentScenario.severity} SEVERITY
                    </Badge>
                  </div>

                  <h3 className="text-2xl font-bold text-foreground">
                    {currentScenario.name}
                  </h3>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {currentScenario.desc}
                  </p>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono">
                      <div className="text-[10px] text-muted-foreground">CAMERA SOURCE</div>
                      <div className="text-xs font-bold text-cyan-400 truncate mt-1">{currentScenario.cam}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono">
                      <div className="text-[10px] text-muted-foreground">AI CONFIDENCE</div>
                      <div className="text-xs font-bold text-emerald-400 mt-1">{currentScenario.confidence}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono">
                      <div className="text-[10px] text-muted-foreground">INFERENCE TIME</div>
                      <div className="text-xs font-bold text-blue-400 mt-1">{currentScenario.latency}</div>
                    </div>
                  </div>

                  {/* Simulated Telemetry Log */}
                  <div className="mt-4 rounded-xl bg-slate-900/90 border border-slate-800 p-4 font-mono text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
                      <span className="flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                        INFERENCE TELEMETRY LOG
                      </span>
                      <span className="text-emerald-400">STREAMING ACTIVE</span>
                    </div>
                    
                    {currentScenario.logs.map((log, i) => (
                      <div key={i} className="flex items-start space-x-2 pt-1 text-[11px]">
                        <span className="text-muted-foreground font-semibold">[{log.time}]</span>
                        <span className="text-cyan-400 font-bold">[{log.type}]</span>
                        <span className="text-slate-300">{log.text}</span>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Right Interactive Detection Payload Preview */}
                <div className="lg:col-span-5 flex flex-col justify-between rounded-xl bg-slate-900 border border-slate-800 p-5 font-mono">
                  
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                      <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                        <FileCode2 className="w-4 h-4 text-cyan-400" />
                        WEBSOCKET PAYLOAD (JSON)
                      </span>
                      <Badge className="bg-cyan-500/20 text-cyan-300 text-[9px] border-0">
                        LIVE API
                      </Badge>
                    </div>

                    <pre className="mt-4 text-[11px] leading-relaxed text-cyan-300/90 overflow-x-auto p-2 bg-slate-950 rounded border border-slate-800/80">
{`{
  "event_id": "evt_908412",
  "camera_id": "${currentScenario.cam.split(' ')[0]}",
  "timestamp": "2026-09-10T00:37:15Z",
  "model": "YOLOv8x-Surveillance",
  "detections": [
    {
      "class": "${currentScenario.id === 'fall-detection' ? 'human_fall' : currentScenario.id === 'perimeter-intrusion' ? 'person_restricted' : 'crowd_cluster'}",
      "confidence": ${Number(currentScenario.confidence.replace('%', '')) / 100},
      "bbox": [140, 220, 310, 480],
      "severity": "${currentScenario.severity}"
    }
  ]
}`}
                    </pre>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Dispatch Status:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> ACKNOWLEDGED
                    </span>
                  </div>

                </div>

              </div>

            </div>

          </Tabs>
        </div>

      </div>
    </section>
  );
}
