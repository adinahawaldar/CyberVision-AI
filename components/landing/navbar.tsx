"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    <header className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-xl sm:max-w-2xl md:max-w-3xl">
      {/* FLOATING CAPSULE NAVBAR CONTAINER */}
      <div className="relative bg-[#1e1e20] border border-white/10 rounded-full p-1.5 shadow-2xl backdrop-blur-xl flex items-center justify-between">
        
        {/* LEFT: WHITE CIRCULAR BRAND LOGO BADGE */}
        <Link href="/" className="flex items-center group shrink-0">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
            <Shield className="w-5 h-5 text-black stroke-[2.2]" />
          </div>
        </Link>

        {/* CENTER: DESKTOP NAVIGATION LINKS */}
        <nav className="hidden md:flex items-center space-x-6 sm:space-x-8 text-sm font-medium text-slate-300 px-4">
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

        {/* RIGHT: WHITE ROUNDED PILL DASHBOARD CTA BUTTON */}
        <div className="hidden md:flex items-center shrink-0">
          <button
            onClick={handleDashboardClick}
            className="h-10 px-6 rounded-full bg-white hover:bg-slate-100 text-black font-semibold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center cursor-pointer"
          >
            Dashboard
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
          <nav className="flex flex-col space-y-3 text-sm font-medium text-slate-300">
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
              onClick={(e) => {
                setMobileMenuOpen(false);
                handleDashboardClick(e);
              }}
              className="w-full rounded-full bg-white hover:bg-slate-100 text-black font-semibold text-sm py-2.5 shadow-md border-0 transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
