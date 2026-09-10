"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import LoginForm from '@/components/auth/login-form';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-slate-950 to-slate-900 relative p-4">
      <div className="absolute top-6 left-6">
        <Link href="/" className="flex items-center space-x-2 text-xs font-mono text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing Page</span>
        </Link>
      </div>

      <div className="w-full max-w-[400px] mx-auto space-y-4">
        <div className="flex flex-col items-center text-center space-y-2 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-slate-800 p-0.5 shadow-xl">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-white font-mono">CyberVision-AI Admin</h1>
          <p className="text-xs text-slate-400">Sign in to access live surveillance console</p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
