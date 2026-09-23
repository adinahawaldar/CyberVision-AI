"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Shield, ArrowLeft, Loader2, ChevronRight, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(username || "admin", password || "admin");
      toast({
        title: "Access Granted",
        description: "Welcome back to CyberVision AI Command Console",
      });
      router.push("/dashboard");
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Please check your credentials (admin / admin)",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await login("admin", "admin");
      toast({
        title: "Google SSO Success",
        description: "Redirecting to CyberVision AI Dashboard...",
      });
      router.push("/dashboard");
    } catch (error) {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e1015] text-slate-100 flex items-center justify-center p-3 sm:p-6 lg:p-8 relative selection:bg-[#ff3538] selection:text-white">
      
      {/* Back link */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
        <Link
          href="/"
          className="flex items-center space-x-2 text-xs font-mono text-slate-400 hover:text-white transition-colors bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 backdrop-blur-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Landing</span>
        </Link>
      </div>

      {/* MAIN CONTAINER */}
      <div className="w-full max-w-6xl bg-[#161820]/95 text-white rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col lg:flex-row min-h-[600px] my-auto border border-white/10 relative backdrop-blur-xl">
        
        {/* LEFT SIDE: DESKTOP SURVEILLANCE IMAGE CARD (HIDDEN ON MOBILE) */}
        <div className="hidden lg:flex flex-1 relative rounded-[24px] overflow-hidden m-3 bg-slate-950 text-white flex-col justify-between p-8 border border-white/10 group min-h-[560px]">
          
          {/* Background Surveillance Image */}
          <Image
            src="/images/cctv_camera_detection.jpg"
            alt="Surveillance Threat AI Detection"
            fill
            priority
            className="object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-80"
          />

          {/* Dark Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/60 z-10" />

          {/* Top Bar Overlay */}
          <div className="relative z-20 flex items-center justify-between">
            <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15">
              <div className="w-2 h-2 rounded-full bg-[#ff3538] animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-white">
                CYBERVISION AI
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1 rounded-full text-slate-200">
                Threat Matrix Active
              </span>
            </div>
          </div>

          {/* Bottom Card Information Overlay */}
          <div className="relative z-20 space-y-4 pt-20">
            <div className="flex items-center justify-between">
              
              <div className="flex items-center space-x-3 bg-black/60 backdrop-blur-md border border-white/15 p-2.5 rounded-2xl pr-5">
                <div className="w-10 h-10 rounded-xl bg-[#ff3538] text-white flex items-center justify-center shadow-lg shadow-[#ff3538]/40">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-mono uppercase">
                    CyberVision Console
                  </h4>
                  <p className="text-[10px] text-slate-300 font-sans">
                    AI Surveillance & Threat Detection
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT SIDE: LOGIN FORM SECTION (DESKTOP & MOBILE - DARK THEME) */}
        <div className="w-full lg:w-[480px] p-6 sm:p-10 md:p-12 flex flex-col justify-center bg-[#161820]/90 text-white relative my-auto space-y-6">
          
          {/* Login Content Area */}
          <div className="space-y-6 max-w-sm mx-auto w-full">
            
            {/* Title */}
            <div className="text-center sm:text-left space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Hi Operator
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                Welcome to CyberVision AI Console
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {/* Email / Username Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Email or Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full px-4 py-3 rounded-xl border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#ff3538]/30 focus:border-[#ff3538] transition-all bg-slate-900/80"
                  disabled={isLoading}
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  <a href="#" onClick={(e) => e.preventDefault()} className="text-[11px] font-semibold text-[#ff3538] hover:underline">
                    Forgot password?
                  </a>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#ff3538]/30 focus:border-[#ff3538] transition-all bg-slate-900/80"
                  disabled={isLoading}
                />
              </div>

              {/* Or Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs text-slate-400 font-medium">
                  <span className="bg-[#161820] px-3">or</span>
                </div>
              </div>

              {/* Google SSO Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Login with Google</span>
              </button>

              {/* Primary Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-full bg-[#ff3538] hover:bg-[#e62e31] text-white font-bold text-sm tracking-wider uppercase shadow-lg shadow-[#ff3538]/25 transition-all cursor-pointer flex items-center justify-center space-x-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>AUTHENTICATING...</span>
                  </>
                ) : (
                  <span>LOGIN</span>
                )}
              </button>

            </form>

            {/* Bottom Register Link */}
            <div className="text-center text-xs text-slate-400 pt-1">
              Don't have an account?{" "}
              <a href="#" onClick={(e) => e.preventDefault()} className="font-semibold text-[#ff3538] hover:underline">
                Sign up
              </a>
            </div>

          </div>

          {/* Bottom Social / Footer icons */}
          <div className="flex items-center justify-center space-x-4 pt-4 text-slate-400 text-xs">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:text-white hover:border-white/30 transition-colors">
              <span className="font-bold text-[11px]">gh</span>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:text-white hover:border-white/30 transition-colors">
              <span className="font-bold text-[11px]">tw</span>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:text-white hover:border-white/30 transition-colors">
              <span className="font-bold text-[11px]">in</span>
            </a>
          </div>

        </div>

      </div>

    </div>
  );
}
