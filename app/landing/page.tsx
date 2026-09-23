"use client";

import Navbar from "@/components/landing/navbar";
import Hero from "@/components/landing/hero";
import Incidents from "@/components/landing/incidents";
import WorkflowVideo from "@/components/landing/workflow-video";
import Features from "@/components/landing/features";
import DetectionPipeline from "@/components/landing/detection-pipeline";
import Security from "@/components/landing/security";
import CTA from "@/components/landing/cta";
import Footer from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground antialiased selection:bg-cyan-500 selection:text-black">
      <Navbar />
      <Hero />
      <Incidents />
      <WorkflowVideo />
      <DetectionPipeline />
      <Security />
      <CTA />
      <Footer />
    </main>
  );
}
