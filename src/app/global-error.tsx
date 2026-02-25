'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import AppButton from '../components/ui/AppButton';

interface GlobalErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#050107] text-white">
        <div className="relative min-h-screen w-full overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(127,29,29,0.28),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_74%,rgba(88,28,135,0.28),transparent_48%)]" />
          <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
            <div className="w-full max-w-2xl rounded-[2.2rem] border border-red-400/20 bg-black/55 p-8 sm:p-12 backdrop-blur-xl">
              <p className="text-[10px] uppercase tracking-[0.3em] text-red-300 font-bold">Critical Fault</p>
              <h1 className="mt-3 font-cinzel text-xl sm:text-2xl uppercase tracking-[0.18em]">
                App Recovered With Fallback
              </h1>
              <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                Ek unexpected crash handle kar liya gaya hai. Aap retry karo ya safe route par navigate karo.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <AppButton
                  onClick={reset}
                  variant="primary"
                  className="rounded-full px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-bold"
                >
                  Reload App
                </AppButton>
                <Link
                  href="/"
                  className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-bold text-white text-center transition hover:bg-white/10"
                >
                  Go Landing
                </Link>
              </div>

              <div className="mt-7">
                <AppButton
                  onClick={() => setShowDetails((prev) => !prev)}
                  variant="ghost"
                  className="text-xs text-slate-400 hover:text-white uppercase tracking-[0.16em]"
                >
                  {showDetails ? 'Hide Technical Details' : 'Show Technical Details'}
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
      </body>
    </html>
  );
}
