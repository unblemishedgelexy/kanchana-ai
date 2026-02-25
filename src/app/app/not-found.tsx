import Link from 'next/link';

export default function AppSectionNotFoundPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050107] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(76,29,149,0.26),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_74%,rgba(88,28,135,0.22),transparent_48%)]" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-black/45 p-8 sm:p-10 text-center backdrop-blur-xl">
          <p className="font-cinzel text-5xl text-purple-300 tracking-[0.12em]">404</p>
          <h1 className="mt-3 font-cinzel text-lg sm:text-xl uppercase tracking-[0.18em]">
            Page Not Found
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            Yeh route app workspace me available nahi hai.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/app/home"
              className="rounded-full border border-purple-300/35 bg-purple-600/80 px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-bold text-white transition hover:bg-purple-500"
            >
              App Home
            </Link>
            <Link
              href="/app/chat"
              className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-bold text-white transition hover:bg-white/10"
            >
              Open Chat
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
