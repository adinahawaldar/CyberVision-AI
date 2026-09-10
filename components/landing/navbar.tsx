"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-[#111317]/90 backdrop-blur-md border-b border-white/10 shadow-2xl py-3"
          : "bg-transparent py-5"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">

          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff3538] to-slate-800 p-0.5 shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-[#111317] rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#ff3538]" />
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs font-mono uppercase tracking-widest text-slate-300">
            <a href="#features" className="hover:text-[#ff3538] transition-colors">
              SERVICES
            </a>
            <a href="#capabilities" className="hover:text-[#ff3538] transition-colors">
              AI CAPABILITIES
            </a>
            <a href="#live-specs" className="hover:text-[#ff3538] transition-colors">
              EQUIPMENT
            </a>
            <a href="#alerts" className="hover:text-[#ff3538] transition-colors">
              CONTACTS
            </a>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <Button
              onClick={handleDashboardClick}
              size="sm"
              className="bg-[#ff3538] hover:bg-[#e02b2e] text-white shadow-lg shadow-red-500/20 border-0 font-mono text-xs uppercase tracking-wider font-semibold"
            >
              Dashboard
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#111317]/95 backdrop-blur-2xl border-b border-white/10 px-4 pt-4 pb-6 space-y-4 shadow-2xl">
          <nav className="flex flex-col space-y-3 font-mono text-xs uppercase tracking-wider">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-[#ff3538] py-2 border-b border-white/10"
            >
              SERVICES & FEATURES
            </a>
            <a
              href="#capabilities"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-[#ff3538] py-2 border-b border-white/10"
            >
              AI CAPABILITIES
            </a>
            <a
              href="#live-specs"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-[#ff3538] py-2 border-b border-white/10"
            >
              SYSTEM SPECS
            </a>
          </nav>

          <div className="flex flex-col space-y-2 pt-2">
            <Button
              onClick={(e) => {
                setMobileMenuOpen(false);
                handleDashboardClick(e);
              }}
              className="w-full justify-center bg-[#ff3538] hover:bg-[#e02b2e] text-white font-mono text-xs uppercase font-semibold"
            >
              Get Started
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
