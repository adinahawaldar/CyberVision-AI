"use client";

import Image from "next/image";

export default function Features() {
  return (
    <section id="features" className="relative min-h-[70vh] sm:min-h-[80vh] bg-[#111317] text-white py-12 sm:py-20 overflow-hidden border-t border-white/5 flex flex-col items-center justify-center">

      {/* BACKGROUND SPOTLIGHT GLOW ACCENTS MATCHING HERO */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-cyan-500/15 rounded-full blur-[120px] opacity-60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] bg-[#ff3538]/15 rounded-full blur-[100px] opacity-50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center justify-center">

        {/* 3D HARDWARE DEVICES SHOWCASE IMAGE WITH SEAMLESS 4-SIDE BACKGROUND BLEND */}
        <div className="relative w-full max-w-4xl sm:max-w-5xl aspect-[16/10] sm:aspect-[16/9] my-auto overflow-hidden group [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_90%)] transition-transform duration-700 hover:scale-[1.02]">

          {/* 3D Hardware Devices Render Image */}
          <Image
            src="/images/surveillance_devices.jpg"
            alt="3D Surveillance Hardware Showcase - Bullet CCTV Camera, Dome Camera, Biometric Terminal, NVR Hub"
            fill
            priority
            className="object-cover object-center brightness-[1.12] contrast-[1.08]"
          />

          {/* 4-DIRECTIONAL GRADIENT BLEND OVERLAYS INTO #111317 */}
          <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-[#111317] via-[#111317]/60 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#111317] via-[#111317]/60 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[#111317] via-[#111317]/60 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-[#111317] via-[#111317]/60 to-transparent pointer-events-none z-10" />

        </div>

      </div>

    </section>
  );
}






