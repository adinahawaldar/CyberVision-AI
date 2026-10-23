"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Menu, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleAuthOrDashboard = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigating(true);
    setMobileMenuOpen(false);
    window.location.href = isAuthenticated ? "/dashboard" : "/sign-in";
  };

  return (
    <header className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-xl sm:max-w-2xl md:max-w-3xl">
      {/* FLOATING CAPSULE NAVBAR CONTAINER */}
      <div className="relative bg-[#1e1e20] border border-white/10 rounded-full p-1.5 shadow-2xl backdrop-blur-xl flex items-center justify-between">
        
        {/* LEFT: BRAND LOGO */}
        <Link href="/" className="flex items-center pl-3.5 pr-1 group shrink-0">
          <Image
            src="/images/logo/logo.png"
            alt="CyberVision AI"
            width={140}
            height={30}
            className="h-[21px] sm:h-[25px] w-auto object-contain transition-transform group-hover:scale-105 duration-200"
            priority
          />
        </Link>

        {/* CENTER: DESKTOP NAVIGATION LINKS */}
        <nav className="hidden md:flex items-center space-x-6 sm:space-x-8 text-[15px] sm:text-base font-medium text-slate-200 px-4">
          <a href="#features" className="hover:text-white transition-colors">
            Services
          </a>
          <a href="#working" className="hover:text-white transition-colors">
            Operations
          </a>
          <a href="#detection-pipeline" className="hover:text-white transition-colors">
            Pipeline
          </a>
        </nav>

        {/* RIGHT: WHITE ROUNDED PILL SIGN IN / DASHBOARD CTA BUTTON */}
        <div className="hidden md:flex items-center shrink-0">
          <button
            onClick={handleAuthOrDashboard}
            disabled={isNavigating}
            className="h-10 px-6 rounded-full bg-white hover:bg-slate-100 text-black font-semibold text-sm sm:text-base transition-all shadow-sm flex items-center justify-center cursor-pointer disabled:opacity-85 space-x-2"
          >
            {isNavigating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Loading...</span>
              </>
            ) : (
              <span>{isAuthenticated ? "Dashboard" : "Sign In"}</span>
            )}
          </button>
        </div>

        {/* MOBILE MENU TOGGLE BUTTON */}
        <div className="md:hidden flex items-center pr-1">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 bg-[#1e1e20]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 space-y-4 shadow-2xl">
          <nav className="flex flex-col space-y-3 text-base font-medium text-slate-200">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white py-2 border-b border-white/10"
            >
              Services
            </a>
            <a
              href="#working"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white py-2 border-b border-white/10"
            >
              Operations
            </a>
            <a
              href="#detection-pipeline"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white py-2 border-b border-white/10"
            >
              Pipeline
            </a>
          </nav>

          <div className="pt-2">
            <button
              onClick={handleAuthOrDashboard}
              disabled={isNavigating}
              className="w-full rounded-full bg-white hover:bg-slate-100 text-black font-semibold text-base py-2.5 shadow-md border-0 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-85 space-x-2"
            >
              {isNavigating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Loading...</span>
                </>
              ) : (
                <span>{isAuthenticated ? "Dashboard" : "Sign In"}</span>
              )}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
