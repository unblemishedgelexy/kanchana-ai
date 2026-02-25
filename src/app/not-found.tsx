import Link from 'next/link';

export default function RootNotFoundPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050107] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(76,29,149,0.28),transparent_48%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_74%,rgba(88,28,135,0.22),transparent_46%)]" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-2xl rounded-[2.2rem] border border-white/10 bg-black/45 p-8 sm:p-12 text-center backdrop-blur-xl">
          <p className="font-cinzel text-6xl sm:text-7xl text-purple-300 tracking-[0.12em]">404</p>
          <h1 className="mt-4 font-cinzel text-xl sm:text-2xl uppercase tracking-[0.2em] text-white">
            Lost In The Void
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Jo page aap dhoondh rahe ho woh ya to move ho chuka hai ya ab exist nahi karta.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/app/home"
              className="rounded-full border border-purple-300/35 bg-purple-600/80 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-purple-500"
            >
              Open App Home
            </Link>
            <Link
              href="/"
              className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
            >
              Go Landing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
