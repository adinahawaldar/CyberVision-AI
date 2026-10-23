export default function SignUpLoading() {
  return (
    <div className="relative min-h-screen bg-[#0e1015] text-white flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#ff3538]/10 rounded-full blur-[140px]" />
      </div>
      <div className="relative z-10 w-full max-w-md p-8 rounded-2xl bg-[#161820]/80 border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-[#ff3538]" />
        <p className="text-xs font-mono uppercase tracking-widest text-slate-400">Loading Registration...</p>
      </div>
    </div>
  );
}
