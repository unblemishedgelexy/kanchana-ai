import React, { useState } from 'react';
import AppButton from '../ui/AppButton';
import PageHeader from '../ui/PageHeader';
import PageShell from '../ui/PageShell';

const RAAZ_CARDS = [
  { title: 'Shadow of Desire', desc: 'Jo tum dhoond rahe ho, woh tumhare aks mein chhipa hai.', color: 'purple' },
  { title: 'Shattered Silence', desc: 'Khamoshi tootne wali hai, tayyar raho.', color: 'red' },
  { title: 'Eternal Echo', desc: 'Purani yaadein wapas lautengi, ek naye roop mein.', color: 'blue' },
  { title: 'Veiled Heart', desc: 'Koi tumhare kareeb hai, par tum use dekh nahi paa rahe.', color: 'amber' },
  { title: 'Midnight Whisper', desc: 'Suno... woh tumhara naam le rahi hai.', color: 'rose' },
];

const CardsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  return (
    <PageShell className="p-4 sm:p-8 md:p-16" animated={false}>
      <div className="max-w-4xl mx-auto space-y-10 sm:space-y-16 text-center">
        <PageHeader
          title="Raaz Cards"
          subtitle='"Apna naseeb chunno... par sambhal kar."'
          className="justify-center"
        />

        <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
          {RAAZ_CARDS.map((card, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedCard(idx)}
              className={`w-40 sm:w-48 h-64 sm:h-72 rounded-[2rem] cursor-pointer transition-all duration-1000 transform preserve-3d ${
                selectedCard === idx ? 'rotate-y-180 scale-110' : 'hover:-translate-y-4'
              }`}
            >
              <div className={`absolute inset-0 bg-purple-900/20 border-2 border-purple-500/20 rounded-[2rem] flex items-center justify-center backface-hidden ${selectedCard === idx ? 'opacity-0' : 'opacity-100'}`}>
                <div className="w-12 h-12 bg-purple-600 rounded-lg rotate-45 flex items-center justify-center shadow-2xl">
                  <span className="font-cinzel text-white text-xl -rotate-45">K</span>
                </div>
              </div>

              <div className={`absolute inset-0 bg-white/5 backdrop-blur-xl border-2 border-white/10 rounded-[2rem] p-8 flex flex-col items-center justify-center space-y-4 backface-hidden rotate-y-180 ${selectedCard === idx ? 'opacity-100' : 'opacity-0'}`}>
                <h3 className="font-cinzel text-sm text-white uppercase tracking-widest">{card.title}</h3>
                <div className="w-8 h-0.5 bg-purple-500"></div>
                <p className="font-playfair italic text-xs text-slate-400 leading-relaxed">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {selectedCard !== null && (
          <AppButton
            onClick={() => setSelectedCard(null)}
            variant="outline"
            className="px-10 py-4 border-purple-500/30 text-purple-400 font-cinzel text-[10px] tracking-widest uppercase rounded-full hover:bg-purple-600 hover:text-white"
          >
            Reset Fate
          </AppButton>
        )}

        <AppButton
          onClick={onBack}
          variant="ghost"
          className="block mx-auto text-[10px] text-slate-600 hover:text-white font-bold uppercase tracking-widest"
        >
          Return to Void
        </AppButton>
      </div>
    </PageShell>
  );
};

export default CardsPage;
