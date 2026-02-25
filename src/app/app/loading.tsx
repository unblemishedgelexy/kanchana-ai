export default function AppSectionLoadingPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#050107] px-6 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(88,28,135,0.25),transparent_48%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_78%,rgba(67,56,202,0.2),transparent_46%)]" />
      <div className="relative z-10 w-full max-w-lg rounded-[2rem] border border-white/10 bg-black/45 px-8 py-10 text-center backdrop-blur-xl">
        <div className="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border-2 border-purple-300/30 border-t-purple-300" />
        <p className="font-cinzel text-base uppercase tracking-[0.24em]">Loading Workspace</p>
        <p className="mt-2 text-sm text-slate-300">
          Chat, modes, and profile controls are being synced.
        </p>
      </div>
    </div>
  );
}
