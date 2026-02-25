import React from 'react';
import AppButton from '../ui/AppButton';
import PageShell from '../ui/PageShell';

interface Props {
  type: 'privacy' | 'security';
  onBack: () => void;
}

const PrivacySecurityPage: React.FC<Props> = ({ type, onBack }) => {
  const content = type === 'privacy' ? {
    title: 'Soul Privacy Protocol',
    desc: 'Your secrets are between you and the void.',
    sections: [
      { h: 'Data Sanctity', p: 'We do not store your conversations on external servers for training. Every message is encrypted at rest using your unique soul-key.' },
      { h: 'Neural Cookies', p: 'We only use local memory to remember your preferred mode and conversation threads. No tracking pixels, no behavioral profiling.' },
      { h: 'Identity Shadows', p: 'Your real identity is never required. We only need a frequency (email) to re-establish connection if the bond is severed.' },
    ],
  } : {
    title: 'Neural Link Security',
    desc: 'Protected by 256-bit Emotional Encryption.',
    sections: [
      { h: 'The Golden Wall', p: 'Access to Kanchana is protected by multi-factor frequency checks. Your secret key is hashed and never stored in plain text.' },
      { h: 'Session Erasure', p: 'You can trigger a "Total Amnesia" event anytime, which wipes all conversation threads from our local memory permanently.' },
      { h: 'Astral Integrity', p: 'Kanchana is powered by Gemini 3.0, ensuring state-of-the-art protection against unauthorized astral intrusions.' },
    ],
  };

  return (
    <PageShell className="p-4 sm:p-8 md:p-20">
      <div className="max-w-3xl mx-auto space-y-10 sm:space-y-12">
        <AppButton onClick={onBack} variant="ghost" className="group flex items-center gap-3 text-slate-500 hover:text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Return to Sanctuary</span>
        </AppButton>

        <header className="space-y-4">
          <h1 className="font-cinzel text-3xl sm:text-4xl text-white tracking-[0.12em] sm:tracking-widest uppercase">{content.title}</h1>
          <p className="font-playfair italic text-purple-400 text-base sm:text-lg">{content.desc}</p>
        </header>

        <div className="space-y-10 sm:space-y-12 pt-6 sm:pt-10">
          {content.sections.map((s, i) => (
            <section key={i} className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l-2 border-purple-600 pl-4">{s.h}</h3>
              <p className="text-slate-500 leading-relaxed font-playfair">{s.p}</p>
            </section>
          ))}
        </div>

        <div className="pt-20 text-center opacity-30">
          <p className="text-[8px] tracking-[0.4em] uppercase">Last Updated: Astral Epoch 2025.03</p>
        </div>
      </div>
    </PageShell>
  );
};

export default PrivacySecurityPage;
