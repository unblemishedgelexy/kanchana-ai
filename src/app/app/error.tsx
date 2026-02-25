'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import AppButton from '../../components/ui/AppButton';

interface AppSectionErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppSectionErrorPage({ error, reset }: AppSectionErrorPageProps) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050107] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(127,29,29,0.26),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_75%,rgba(88,28,135,0.26),transparent_48%)]" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-[2rem] border border-red-400/20 bg-black/50 p-8 sm:p-10 backdrop-blur-xl">
          <p className="text-[10px] uppercase tracking-[0.3em] text-red-300 font-bold">Workspace Error</p>
          <h1 className="mt-3 font-cinzel text-lg sm:text-xl uppercase tracking-[0.18em]">
            We Hit A Temporary Issue
          </h1>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            Aapka session safe hai. Retry karo ya home se fresh start le lo.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <AppButton
              onClick={reset}
              variant="primary"
              className="rounded-full px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-bold"
            >
              Retry View
            </AppButton>
            <Link
              href="/app/home"
              className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-bold text-white text-center transition hover:bg-white/10"
            >
              Back To App Home
            </Link>
          </div>

          <div className="mt-6">
            <AppButton
              onClick={() => setShowDetails((prev) => !prev)}
              variant="ghost"
              className="text-xs text-slate-400 hover:text-white uppercase tracking-[0.16em]"
            >
              {showDetails ? 'Hide Error Details' : 'Show Error Details'}
            </AppButton>
            {showDetails && (
              <pre className="mt-3 rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-red-200 whitespace-pre-wrap break-words">
                {error.message || 'Unknown error'}
                {error.digest ? `\nDigest: ${error.digest}` : ''}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
