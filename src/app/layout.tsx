import type { Metadata } from 'next';
import { Cinzel, Inter, Playfair_Display } from 'next/font/google';
import '../styles/index.css';
import { AppRuntimeProvider } from './providers/AppRuntimeProvider';
import GlobalIconTooltip from '../components/system/GlobalIconTooltip';
import LaptopCursor from '../components/system/LaptopCursor';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: 'Kanchana AI',
  description: 'Kanchana AI frontend (Next.js App Router)',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${cinzel.variable} ${playfair.variable}`}>
        <AppRuntimeProvider>
          {children}
          <LaptopCursor />
          <GlobalIconTooltip />
        </AppRuntimeProvider>
      </body>
    </html>
  );
}
