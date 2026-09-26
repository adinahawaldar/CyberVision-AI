import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="relative min-h-screen bg-[#0e1015] text-white flex flex-col items-center justify-center p-4">
      {/* Background ambient aura */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#ff3538]/10 rounded-full blur-[140px]" />
      </div>

      {/* Top back button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="flex items-center space-x-2 text-xs font-mono text-slate-400 hover:text-white transition-colors bg-white/5 border border-white/10 rounded-full px-4 py-2 backdrop-blur-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Landing</span>
        </Link>
      </div>

      <div className="relative z-10 w-full flex items-center justify-center py-10">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
