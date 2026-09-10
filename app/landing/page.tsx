import Navbar from "@/components/landing/navbar";
import Hero from "@/components/landing/hero";
import Features from "@/components/landing/features";
import Working from "@/components/landing/working";
import DetectionPipeline from "@/components/landing/detection-pipeline";
import AIShowcase from "@/components/landing/ai-showcase";
import Stats from "@/components/landing/stats";
import CTA from "@/components/landing/cta";

export const metadata = {
  title: "CyberVision-AI — Smart AI CCTV Surveillance System",
  description: "Autonomous AI-powered CCTV surveillance dashboard with YOLO object detection, real-time threat alerts, multi-camera HLS streaming, and node health monitoring.",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground antialiased selection:bg-cyan-500 selection:text-black">
      <Navbar />
      <Hero />
      <Features />
      <Working />
      <DetectionPipeline />
      <AIShowcase />
      <Stats />
      <CTA />
    </main>
  );
}
