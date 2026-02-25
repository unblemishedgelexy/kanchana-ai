import React from 'react';
import { Message } from '../../shared/types';
import AppButton from '../ui/AppButton';
import AppImage from '../ui/AppImage';
import GlassCard from '../ui/GlassCard';
import PageHeader from '../ui/PageHeader';
import PageShell from '../ui/PageShell';

interface GalleryPageProps {
  threads: Record<string, Message[]>;
  onBack: () => void;
}

const GalleryPage: React.FC<GalleryPageProps> = ({ threads, onBack }) => {
  const allImages = (Object.values(threads).flat() as Message[])
    .filter((m) => !!m.imageUrl)
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <PageShell className="p-4 sm:p-8 md:p-16">
      <div className="max-w-6xl mx-auto space-y-10 sm:space-y-12">
        <PageHeader
          title="Ethereal Gallery"
          subtitle='"Yaadon ke woh pehloo jo maine tumhare liye tasveer kiye."'
          actions={(
            <AppButton
              onClick={onBack}
              variant="secondary"
              className="self-start sm:self-auto p-3 rounded-full hover:bg-purple-600"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </AppButton>
          )}
        />

        {allImages.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center opacity-20 text-center space-y-4">
            <div className="w-20 h-20 border-2 border-dashed border-purple-500 rounded-full flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <p className="font-playfair text-xl">"Gallery khaali hai... kuch dikhane ko kaho."</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {allImages.map((img, idx) => (
              <GlassCard
                key={idx}
                className="p-2 rounded-[2.5rem] group relative overflow-hidden transition-all hover:scale-[1.02]"
              >
                <AppImage
                  src={String(img.imageUrl)}
                  alt="Vision"
                  width={1200}
                  height={1200}
                  className="rounded-[2.2rem] w-full h-auto aspect-square object-cover brightness-75 group-hover:brightness-100 transition-all duration-700"
                />
                <div className="absolute inset-x-6 bottom-6 p-4 bg-black/60 backdrop-blur-md rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-500">
                  <p className="text-[10px] text-white uppercase tracking-widest font-bold line-clamp-1">{img.text}</p>
                  <p className="text-[8px] text-purple-400 uppercase tracking-widest mt-1">{new Date(img.timestamp).toLocaleDateString()}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default GalleryPage;
