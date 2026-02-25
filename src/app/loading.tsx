export default function RootLoadingPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050107] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(88,28,135,0.28),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(76,29,149,0.24),transparent_48%)]" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="flex w-full max-w-lg flex-col items-center rounded-[2rem] border border-white/10 bg-black/40 px-8 py-12 text-center backdrop-blur-xl">
          <div className="relative mb-8 h-24 w-24">
            <span className="absolute inset-0 animate-spin rounded-full border-2 border-purple-400/40 border-t-purple-300" />
            <span className="absolute inset-3 animate-pulse rounded-full border border-white/20" />
            <span className="absolute inset-8 rounded-full bg-purple-500/40 shadow-[0_0_26px_rgba(168,85,247,0.65)]" />
          </div>
          <p className="font-cinzel text-lg uppercase tracking-[0.24em] text-white">Loading Kanchana</p>
          <p className="mt-3 max-w-md text-sm text-slate-300">
            Session, modes, and your latest context are being prepared.
          </p>
          <div className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/3 animate-[pulse_1.25s_ease-in-out_infinite] rounded-full bg-purple-400/80" />
          </div>
        </div>
      </div>
    </div>
  );
}
