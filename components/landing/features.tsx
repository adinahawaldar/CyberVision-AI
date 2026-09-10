"use client";

import Image from "next/image";

export default function Features() {
  return (
    <section id="features" className="relative min-h-[75vh] sm:min-h-[85vh] bg-[#111317] text-white py-12 sm:py-20 overflow-hidden border-t border-white/5 flex flex-col items-center justify-center">

      {/* BACKGROUND SPOTLIGHT GLOW ACCENTS MATCHING HERO */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[700px] bg-cyan-500/15 rounded-full blur-[160px] opacity-60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-[#ff3538]/15 rounded-full blur-[140px] opacity-50" />
      </div>

      <div className="relative z-10 max-w-[92rem] mx-auto px-2 sm:px-4 lg:px-6 w-full flex flex-col items-center justify-center">

        {/* EXPANDED FULL-WIDTH FEATURE IMAGE SHOWCASE WITH SEAMLESS 4-DIRECTIONAL BACKGROUND BLEND */}
        <div className="relative w-full max-w-[90rem] aspect-[16/9] sm:aspect-[21/9] my-auto overflow-hidden group [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_98%)] transition-transform duration-700 hover:scale-[1.005]">

          {/* Feature Showcase Render Image */}
          <Image
            src="/images/image.png"
            alt="CyberVision-AI Hardware & Threat Monitoring Showcase"
            fill
            priority
            className="object-cover object-center brightness-[1.08] contrast-[1.05]"
          />

          {/* 4-DIRECTIONAL SEAMLESS GRADIENT BLEND OVERLAYS INTO #111317 */}
          <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-[#111317] via-[#111317]/50 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#111317] via-[#111317]/50 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-[#111317] via-[#111317]/50 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-[#111317] via-[#111317]/50 to-transparent pointer-events-none z-10" />

        </div>

      </div>

    </section>
  );
}
