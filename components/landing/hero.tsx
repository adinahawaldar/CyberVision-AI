"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
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

      {/* Curved Dark Silhouette Overlay in Center Background */}
      <div className="absolute inset-0 pointer-events-none z-0 flex justify-center">
        <div className="w-full max-w-7xl h-full relative">
          <svg
            className="w-full h-full text-[#181a20] opacity-95"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            {/* Hourglass / Curved Funnel shape behind the title */}
            <path d="M 0 0 L 1000 0 L 1000 100 C 700 150 650 350 650 550 C 650 750 900 900 1000 1000 L 0 1000 C 250 900 350 750 350 550 C 350 350 300 150 0 100 Z" />
          </svg>
        </div>
      </div>

      {/* TOP LEFT 3D CAMERA */}
      <div className="absolute top-0 left-0 z-5 w-52 sm:w-64 md:w-72 lg:w-[370px] pointer-events-none transition-transform duration-700 hover:scale-105">
        <div className="relative w-full aspect-square mix-blend-lighten [mask-image:radial-gradient(ellipse_at_30%_30%,black_45%,transparent_85%)]">
          <Image
            src="/images/cctv_left.jpg"
            alt="3D CCTV Camera Left"
            fill
            priority
            className="object-contain object-top-left"
          />
          {/* Edge fade overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#111317]/90 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#111317]/90 pointer-events-none" />
        </div>
      </div>

      {/* TOP RIGHT 3D CAMERA */}
      <div className="absolute top-0 right-0 z-5 w-52 sm:w-64 md:w-72 lg:w-[370px] pointer-events-none transition-transform duration-700 hover:scale-105">
        <div className="relative w-full aspect-square mix-blend-lighten [mask-image:radial-gradient(ellipse_at_70%_30%,black_45%,transparent_85%)]">
          <Image
            src="/images/cctv_right.jpg"
            alt="3D CCTV Camera Right"
            fill
            priority
            className="object-contain object-top-right"
          />
          {/* Edge fade overlays */}
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#111317]/90 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#111317]/90 pointer-events-none" />
        </div>
      </div>

      {/* HERO MAIN CONTENT AREA - PERFECTLY CENTERED */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center text-center my-auto pt-8">

        {/* HIGH-IMPACT TYPOGRAPHY "WE SEE MORE" */}
        <div className="relative select-none my-2 sm:my-4">
          <h1 className="font-extrabold uppercase tracking-tighter leading-[0.88] flex flex-col items-center justify-center">
            {/* "WE" */}
            <span className="text-5xl sm:text-7xl md:text-8xl lg:text-[8.5rem] font-black text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] tracking-tight">
              WE
            </span>

            {/* "SEE MORE" ROW */}
            <div className="flex items-center justify-center space-x-2 sm:space-x-4 md:space-x-5 mt-1 sm:mt-2">
              {/* "SEE" Highlight Block in Vibrant Coral-Red */}
              <span className="bg-[#ff3538] text-white px-4 sm:px-6 py-0.5 sm:py-1 rounded-xl sm:rounded-2xl text-4xl sm:text-6xl md:text-7xl lg:text-[7.5rem] font-black tracking-tight shadow-[0_8px_30px_rgba(255,53,56,0.45)] transform -rotate-1 hover:rotate-0 transition-transform">
                SEE
              </span>
              {/* "MORE" */}
              <span className="text-5xl sm:text-7xl md:text-8xl lg:text-[8.5rem] font-black text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] tracking-tight">
                MORE
              </span>
            </div>
          </h1>
        </div>

        {/* GET STARTED CTA BUTTON */}
        <div className="mt-8 sm:mt-10">
          <Button
            onClick={handleActionClick}
            size="lg"
            className="bg-white text-black hover:bg-slate-200 font-extrabold tracking-widest text-xs sm:text-sm uppercase px-8 sm:px-10 py-5 sm:py-6 rounded-full shadow-xl shadow-white/15 transition-all hover:scale-105 border border-white/80 flex items-center space-x-2 cursor-pointer"
          >
            <span>GET STARTED</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </Button>
        </div>

      </div>

    </section>
  );
}
