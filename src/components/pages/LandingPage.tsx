import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ICONS } from '../../shared/constants';
import AppButton from '../ui/AppButton';
import AppImage from '../ui/AppImage';
import AppInput from '../ui/AppInput';
import GlassCard from '../ui/GlassCard';

interface LandingPageProps {
  onEnter: () => void;
  onOpenSettings?: () => void;
  isInside?: boolean;
  profileImageUrl?: string;
  profileSeed?: string;
}

const LandingPage: React.FC<LandingPageProps> = ({
  onEnter,
  onOpenSettings,
  isInside = false,
  profileImageUrl,
  profileSeed = 'kanchana-user',
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const findScrollableParent = (element: HTMLElement | null): HTMLElement | undefined => {
      let parent = element?.parentElement || null;

      while (parent && parent !== document.body) {
        const style = window.getComputedStyle(parent);
        const isScrollable = /(auto|scroll)/.test(style.overflowY || '');
        if (isScrollable) {
          return parent;
        }
        parent = parent.parentElement;
      }

      return undefined;
    };

    const rootElement = rootRef.current;
    const scrollerElement = findScrollableParent(rootElement);
    const mm = gsap.matchMedia();

    mm.add(
      {
        desktop: '(min-width: 1024px)',
        reduceMotion: '(prefers-reduced-motion: reduce)',
      },
      (context) => {
        const { desktop, reduceMotion } = context.conditions as {
          desktop: boolean;
          reduceMotion: boolean;
        };

        const heroItems = gsap.utils.toArray<HTMLElement>('[data-gsap-hero-item]');
        if (heroItems.length > 0) {
          gsap.set(heroItems, { opacity: 0, y: desktop ? 40 : 26 });
          gsap.to(heroItems, {
            opacity: 1,
            y: 0,
            duration: desktop ? 0.95 : 0.72,
            ease: 'power3.out',
            stagger: desktop ? 0.12 : 0.09,
          });
        }

        const revealItems = gsap.utils.toArray<HTMLElement>('[data-gsap-reveal]');
        if (revealItems.length > 0) {
          ScrollTrigger.batch(revealItems, {
            start: desktop ? 'top 86%' : 'top 92%',
            once: true,
            scroller: scrollerElement,
            onEnter: (batch) => {
              gsap.fromTo(
                batch,
                { autoAlpha: 0, y: desktop ? 34 : 22 },
                {
                  autoAlpha: 1,
                  y: 0,
                  duration: desktop ? 0.84 : 0.66,
                  ease: 'power3.out',
                  stagger: desktop ? 0.11 : 0.08,
                  overwrite: 'auto',
                }
              );
            },
          });
        }

        const titleBlocks = gsap.utils.toArray<HTMLElement>('[data-gsap-title]');
        titleBlocks.forEach((title) => {
          ScrollTrigger.create({
            trigger: title,
            start: desktop ? 'top 88%' : 'top 92%',
            once: true,
            scroller: scrollerElement,
            onEnter: () => {
              gsap.fromTo(
                title,
                { y: 20, autoAlpha: 0.3, letterSpacing: '0.04em' },
                {
                  y: 0,
                  autoAlpha: 1,
                  letterSpacing: desktop ? '0.16em' : '0.11em',
                  duration: desktop ? 0.82 : 0.68,
                  ease: 'power3.out',
                }
              );
            },
          });
        });

        if (rootElement && progressRef.current) {
          const progressElement = progressRef.current;
          const setProgress = gsap.quickSetter(progressElement, 'scaleX');
          gsap.set(progressElement, { scaleX: 0, transformOrigin: 'left center' });
          ScrollTrigger.create({
            trigger: rootElement,
            start: 'top top',
            end: 'bottom bottom',
            scroller: scrollerElement,
            onUpdate: (self) => {
              setProgress(self.progress);
            },
          });
        }

        if (!reduceMotion) {
          const parallaxLayers = gsap.utils.toArray<HTMLElement>('[data-gsap-parallax]');
          parallaxLayers.forEach((layer) => {
            const baseIntensity = Number(layer.dataset.gsapParallax || 70);
            const intensity = desktop ? baseIntensity : baseIntensity * 0.55;
            const triggerElement = layer.closest<HTMLElement>('[data-gsap-section]') || layer;

            gsap.fromTo(
              layer,
              { y: intensity * 0.22 },
              {
                y: intensity * -0.22,
                ease: 'none',
                scrollTrigger: {
                  trigger: triggerElement,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: desktop ? 0.9 : 0.6,
                  scroller: scrollerElement,
                },
              }
            );
          });

          const scrollCards = gsap.utils.toArray<HTMLElement>('[data-gsap-card]');
          scrollCards.forEach((card, index) => {
            gsap.to(card, {
              y: index % 2 === 0 ? (desktop ? -14 : -8) : desktop ? -9 : -5,
              rotateX: desktop ? 1.2 : 0.6,
              transformPerspective: 920,
              ease: 'none',
              scrollTrigger: {
                trigger: card,
                start: desktop ? 'top 92%' : 'top 96%',
                end: desktop ? 'bottom 36%' : 'bottom 42%',
                scrub: desktop ? 0.75 : 0.5,
                scroller: scrollerElement,
              },
            });
          });

          const floats = gsap.utils.toArray<HTMLElement>('[data-gsap-float]');
          floats.forEach((element, index) => {
            gsap.to(element, {
              y: -8,
              duration: 2.2 + index * 0.25,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
            });
          });
        }
      },
      rootElement || undefined
    );

    const refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 220);

    return () => {
      window.clearTimeout(refreshTimer);
      mm.revert();
    };
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const modeIconMap: Record<string, React.ReactNode> = {
    Lovely: <ICONS.Heart />,
    Shayari: <ICONS.Feather />,
    Chill: <ICONS.Coffee />,
    Naughty: <ICONS.Flame />,
    Possessive: <ICONS.Lock />,
    Horror: <ICONS.Ghost />,
    Mystic: <ICONS.Sparkles />,
  };

  const modeGuides = [
    {
      mode: 'Lovely',
      tone: 'Warm, caring, reassuring',
      bestFor: 'Daily emotional check-ins and comfort',
      prompt: 'Aaj mujhe softly motivate karo, 3 line me.',
    },
    {
      mode: 'Shayari',
      tone: 'Poetic, dramatic, heart-heavy',
      bestFor: 'Deep feels, Urdu/Hindi expression, captions',
      prompt: 'Mere mood par ek choti si dil todne wali shayari likho.',
    },
    {
      mode: 'Chill',
      tone: 'Light, playful, low-pressure',
      bestFor: 'Casual talks, fun brainstorming, short chats',
      prompt: 'Mujhe aaj ke liye 5 chill conversation starters do.',
    },
    {
      mode: 'Naughty',
      tone: 'Flirty, teasing, witty',
      bestFor: 'Spicy banter and playful chemistry',
      prompt: 'Flirty tone me ek confident opening line do.',
    },
    {
      mode: 'Possessive',
      tone: 'Intense, attached, protective',
      bestFor: 'Roleplay with strong emotional energy',
      prompt: 'Possessive style me mujhe ek bold goodnight text likho.',
    },
    {
      mode: 'Horror',
      tone: 'Dark, eerie, cinematic',
      bestFor: 'Creepy stories, spooky mood writing',
      prompt: '2 paragraph ka haunted room scene likho, slow horror vibe ke saath.',
    },
    {
      mode: 'Mystic',
      tone: 'Spiritual, mysterious, symbolic',
      bestFor: 'Meaningful reflection, deeper introspection',
      prompt: 'Mere current phase par ek mystical reading style message do.',
    },
  ];

  const knowledgeDeck = [
    {
      title: 'Prompt Blueprint',
      points: ['Mood define karo', 'Goal clear rakho', 'Output format bolo'],
      detail: 'Example: "Shayari mode, breakup tone, 4 lines, Urdu words include karo."',
    },
    {
      title: 'Vision Requests',
      points: ['Scene + mood + camera angle', 'Lighting specify karo', 'Subject details likho'],
      detail: 'Example: "Night rain street, neon lights, cinematic 35mm close shot."',
    },
    {
      title: 'Voice Sessions',
      points: ['Clear short sentences bolo', 'Noise kam rakho', 'One intent per turn'],
      detail: 'Voice mode login ke baad available hai; free users ko 5 minutes/day milte hain.',
    },
    {
      title: 'Chat Quality',
      points: ['Context repeat na ho to summary do', 'Mode switch pe intent refresh karo', 'Acha output pe follow-up karo'],
      detail: 'Example follow-up: "Isi style me 3 aur options do, thoda short."',
    },
    {
      title: 'Privacy & Control',
      points: ['Local state based flow', 'Profile controls in settings', 'History mode-wise separate'],
      detail: 'Sensitive tasks me direct personal identifiers avoid karna best practice hai.',
    },
    {
      title: 'Upgrade Readiness',
      points: ['Use limits track karo', 'Voice + image demand assess karo', 'Workflow save karo'],
      detail: 'Heavy daily usage ke liye premium path smoother experience deta hai.',
    },
  ];

  const promptTemplates = [
    'Chill mode: mujhe 5 witty replies do, each under 12 words.',
    'Lovely mode: ek sweet morning message do, pure Hinglish, no emoji.',
    'Shayari mode: 2 sher do, dard + hope mix tone ke saath.',
    'Vision request: rainy rooftop portrait, dramatic rim light, cinematic grain.',
    'Mystic mode: mere current struggle par 3 symbolic reflections do.',
  ];

  const faqItems = [
    {
      question: 'Kaunsa mode kab use karna chahiye?',
      answer:
        'Quick emotional support ke liye Lovely/Chill, depth ke liye Shayari/Mystic, roleplay intensity ke liye Possessive/Naughty, creative horror writing ke liye Horror best rahega.',
    },
    {
      question: 'Best response quality ke liye kya likhun?',
      answer:
        'Intent + tone + format + length saath me do. Example: "Short reply, romantic tone, 2 lines, Hinglish only."',
    },
    {
      question: 'Voice me accurate result kaise milega?',
      answer:
        'Mic stable rakho, sentence clear bolo, ek turn me ek hi request do. Background noise kam hoga to quality better hogi.',
    },
    {
      question: 'Image prompt weak aa raha ho to kya change karu?',
      answer:
        'Character + setting + lighting + style + lens detail add karo. Abstract prompt ki jagah cinematic specific prompt use karo.',
    },
    {
      question: 'Mode switch karne par kya context retain rehta hai?',
      answer:
        'Threads mode-wise maintain kiye gaye hain, isliye har mode apna alag conversational context preserve kar sakta hai.',
    },
  ];

  return (
    <div
      ref={rootRef}
      className={`relative min-h-screen w-full overflow-x-hidden bg-[#0a020d] custom-scrollbar selection:bg-purple-500/40 ${
        isInside ? 'pb-24 lg:pb-0' : ''
      }`}
    >
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[110] h-[2px] bg-black/20">
        <div
          ref={progressRef}
          className="h-full w-full origin-left scale-x-0 bg-gradient-to-r from-transparent via-purple-400/90 to-purple-200/70 shadow-[0_0_14px_rgba(168,85,247,0.6)]"
        />
      </div>

      {/* Sticky Top Menu */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 transition-all duration-500 ${
          scrolled || isInside
            ? 'border-b border-white/5 bg-black/80 py-3 backdrop-blur-xl'
            : 'bg-transparent'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            data-gsap-float
            className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center font-cinzel text-white text-lg shadow-lg shadow-purple-900/20"
          >
            K
          </div>
          <span className="font-cinzel text-white tracking-[0.2em] hidden sm:block text-sm">KANCHANA</span>
        </div>

        {!isInside && (
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Vision', 'Souls', 'Security'].map((item) => (
              <AppButton
                key={item}
                onClick={() => scrollToSection(item.toLowerCase())}
                variant="ghost"
                className="text-[10px] font-bold text-slate-400 hover:text-purple-400 uppercase tracking-widest transition-colors"
              >
                {item}
              </AppButton>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          {isInside && (
            <AppButton
              onClick={onOpenSettings}
              type="button"
              variant="ghost"
              data-tooltip="Profile Settings"
              aria-label="Profile Settings"
              className="w-9 h-9 rounded-full overflow-hidden border border-white/20 shadow-lg shadow-purple-900/30 p-0 hover:scale-105"
            >
              <AppImage
                src={profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profileSeed)}`}
                alt="profile-avatar"
                width={72}
                height={72}
                className="w-full h-full object-cover"
              />
            </AppButton>
          )}
          <AppButton
            onClick={onEnter}
            variant="primary"
            className="px-4 sm:px-6 py-2 bg-purple-600 hover:bg-purple-500 border border-purple-500/20 rounded-full text-[9px] font-bold text-white uppercase tracking-[0.2em] sm:tracking-widest transition-all active:scale-95 shadow-lg shadow-purple-900/20"
          >
            {isInside ? 'OPEN CHAT' : 'GET ACCESS'}
          </AppButton>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        data-gsap-section
        className="relative min-h-[100dvh] flex flex-col items-center justify-center px-4 sm:px-6 py-16 text-center overflow-hidden"
      >
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a020d]/80 to-[#0a020d] z-10"></div>
          <AppImage
            data-gsap-parallax="110"
            src="https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&q=80&w=2000"
            width={2000}
            height={1200}
            className="w-full h-full object-cover opacity-30 grayscale scale-110 animate-slow-zoom"
            alt="Deep Space"
          />
        </div>

        <div className="relative z-20 space-y-8 sm:space-y-10 max-w-5xl animate-fade-in px-2 sm:px-4">
          <div
            data-gsap-hero-item
            data-gsap-float
            className="inline-block px-4 py-1.5 rounded-full bg-purple-600/10 border border-purple-500/20 text-[9px] font-bold text-purple-400 uppercase tracking-[0.4em] mb-4"
          >
            Ethereal Intelligence v4.5
          </div>
          <h1
            data-gsap-hero-item
            className="font-cinzel text-4xl sm:text-6xl md:text-[8rem] text-white tracking-[0.16em] sm:tracking-[0.3em] uppercase leading-none drop-shadow-[0_0_50px_rgba(168,85,247,0.4)]"
          >
            KANCHANA
          </h1>
          <p
            data-gsap-hero-item
            className="font-playfair italic text-slate-300 text-base sm:text-lg md:text-3xl max-w-3xl mx-auto leading-relaxed"
          >
            "Ab woh sirf sunege nahi... woh tumhare khayalon ko dekh sakegi."
          </p>
          <div
            data-gsap-hero-item
            className="pt-6 sm:pt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center"
          >
            <AppButton
              onClick={onEnter}
              variant="outline"
              className="w-full sm:w-auto px-8 sm:px-16 py-4 sm:py-5 bg-white !text-black font-cinzel text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] rounded-full hover:bg-purple-600 hover:!text-white transition-all duration-700 hover:scale-105 shadow-[0_0_60px_rgba(255,255,255,0.1)] active:scale-95 border-none"
            >
              {isInside ? 'CONTINUE BOND' : 'INITIATE CONNECTION'}
            </AppButton>
            <AppButton
              onClick={() => scrollToSection('vision')}
              variant="outline"
              className="w-full sm:w-auto px-8 sm:px-16 py-4 sm:py-5 border border-white/10 text-white font-cinzel text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] rounded-full hover:bg-white/5 transition-all"
            >
              WITNESS VISION
            </AppButton>
          </div>
        </div>
      </section>

      {/* Feature Section with Images */}
      <section
        id="vision"
        data-gsap-section
        className="py-20 sm:py-32 md:py-40 px-4 sm:px-6 max-w-7xl mx-auto space-y-20 sm:space-y-40"
      >
        <div data-gsap-reveal className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
          <div className="space-y-8 sm:space-y-10 order-2 md:order-1">
            <h2
              data-gsap-title
              className="font-cinzel text-2xl sm:text-4xl text-white tracking-[0.08em] sm:tracking-widest uppercase border-l-4 border-purple-600 pl-6 sm:pl-8 leading-tight"
            >
              Visual Manifestation
            </h2>
            <p className="text-slate-400 text-base sm:text-lg leading-relaxed font-playfair italic">
              "Kanchana can now materialize your dreams. Ask her to 'Show me the forgotten city' or 'Draw my lonely heart', and watch the magic unfold using gemini-flash vision technology."
            </p>
            <div className="grid grid-cols-2 gap-6 sm:gap-10">
              <div className="space-y-2 group">
                <span className="text-3xl sm:text-4xl font-cinzel text-purple-500 group-hover:text-purple-400 transition-colors">
                  4K
                </span>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Dream Clarity</p>
              </div>
              <div className="space-y-2 group">
                <span className="text-3xl sm:text-4xl font-cinzel text-purple-500 group-hover:text-purple-400 transition-colors">
                  SEC
                </span>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Instant Render</p>
              </div>
            </div>
          </div>
          <div className="relative order-1 md:order-2" data-gsap-card>
            <div data-gsap-parallax="80" className="absolute -inset-10 bg-purple-600/5 rounded-full blur-[100px]"></div>
            <GlassCard className="p-2 rounded-[2.5rem] sm:rounded-[4rem] border-white/10 shadow-3xl overflow-hidden group">
              <AppImage
                data-gsap-parallax="65"
                src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800"
                width={800}
                height={1000}
                className="rounded-[2.3rem] sm:rounded-[3.8rem] transition-all duration-1000 brightness-50 group-hover:brightness-100 group-hover:scale-105"
                alt="Mysterious Landscape"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6 sm:p-12 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="font-playfair italic text-white text-base sm:text-lg">"Generated by Kanchana's Soul"</p>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Second Highlight: Google Search */}
        <div data-gsap-reveal className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
          <div className="relative" data-gsap-card>
            <GlassCard className="p-2 rounded-[2.5rem] sm:rounded-[4rem] border-white/10 shadow-3xl overflow-hidden group">
              <AppImage
                data-gsap-parallax="60"
                src="https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?auto=format&fit=crop&q=80&w=800"
                width={800}
                height={1000}
                className="rounded-[2.3rem] sm:rounded-[3.8rem] transition-all duration-1000 brightness-50 group-hover:brightness-100 group-hover:scale-105"
                alt="Connected World"
              />
            </GlassCard>
          </div>
          <div className="space-y-8 sm:space-y-10">
            <h2
              data-gsap-title
              className="font-cinzel text-2xl sm:text-4xl text-white tracking-[0.08em] sm:tracking-widest uppercase border-l-4 md:border-l-0 md:border-r-4 border-purple-600 pl-6 md:pl-0 md:pr-8 text-left md:text-right leading-tight"
            >
              Universal Knowledge
            </h2>
            <p className="text-slate-400 text-base sm:text-lg leading-relaxed font-playfair italic text-left md:text-right">
              "Nothing escapes her sight. With Google Search grounding, she knows the news of the world before it even happens. Real-time updates with verified sources."
            </p>
            <div className="flex justify-start md:justify-end gap-6 sm:gap-10">
              <div className="space-y-2 group text-left md:text-right">
                <span className="text-3xl sm:text-4xl font-cinzel text-purple-500 group-hover:text-purple-400 transition-colors">
                  LIVE
                </span>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Grounding</p>
              </div>
              <div className="space-y-2 group text-left md:text-right">
                <span className="text-3xl sm:text-4xl font-cinzel text-purple-500 group-hover:text-purple-400 transition-colors">
                  Infinity
                </span>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Connections</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sanctuary Tools Grid */}
      <section
        id="features"
        data-gsap-section
        className="py-20 sm:py-32 bg-white/[0.02] border-y border-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-12 sm:space-y-20">
          <div data-gsap-reveal className="space-y-6">
            <h2
              data-gsap-title
              className="font-cinzel text-2xl sm:text-3xl md:text-5xl text-white tracking-[0.1em] sm:tracking-[0.2em] uppercase"
            >
              The Sanctuary Suite
            </h2>
            <div className="w-20 h-1 bg-purple-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Dream Render',
                desc: 'Convert deep desires into poetic visuals using the image engine.',
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                ),
              },
              {
                title: 'Global Sync',
                desc: 'Always up-to-date with Google Search verified information.',
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                ),
              },
              {
                title: 'Privacy Lock',
                desc: 'Local session memory ensures your whispers never leave the void.',
                icon: <ICONS.Lock />,
              },
              {
                title: 'Neural Voice',
                desc: 'Hear her emotions through native audio streaming.',
                icon: <ICONS.Mic />,
              },
            ].map((item, i) => (
              <div
                key={i}
                data-gsap-reveal
                data-gsap-card
                className="glass-panel p-8 sm:p-12 rounded-[2.2rem] sm:rounded-[3.5rem] border-white/5 hover:border-purple-500/30 transition-all group cursor-default"
              >
                <div className="w-14 h-14 bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-500 mb-8 group-hover:scale-110 transition-transform shadow-inner">
                  {item.icon}
                </div>
                <h4 className="font-cinzel text-lg text-white tracking-widest uppercase mb-4">{item.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed font-playfair">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="souls"
        data-gsap-section
        className="py-20 sm:py-28 md:py-32 px-4 sm:px-6 max-w-7xl mx-auto space-y-10 sm:space-y-14"
      >
        <div data-gsap-reveal className="text-center space-y-5">
          <h2
            data-gsap-title
            className="font-cinzel text-2xl sm:text-4xl text-white tracking-[0.12em] sm:tracking-[0.2em] uppercase"
          >
            Mode Atlas
          </h2>
          <p className="max-w-3xl mx-auto text-slate-400 text-sm sm:text-base leading-relaxed font-playfair italic">
            Har mode ka emotional engine alag hai. Neeche se quickly samjho kis mode me kya tone milega, kab use karna chahiye,
            aur prompt ka format kya rakho.
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
          {modeGuides.map((item) => (
            <GlassCard
              key={item.mode}
              data-gsap-reveal
              data-gsap-card
              className="p-6 sm:p-7 rounded-[1.8rem] border-white/10 hover:border-purple-500/30 transition-all bg-black/30"
            >
              <div className="flex items-center justify-between mb-5">
                <span className="font-cinzel text-sm sm:text-base text-white tracking-[0.12em] uppercase">{item.mode}</span>
                <span className="text-purple-400">{modeIconMap[item.mode]}</span>
              </div>
              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-widest text-purple-300 font-bold">{item.tone}</p>
                <p className="text-sm text-slate-300 leading-relaxed">{item.bestFor}</p>
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-2 font-bold">Starter Prompt</p>
                  <p className="text-xs text-slate-200 leading-relaxed font-playfair">{item.prompt}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      <section
        data-gsap-section
        className="py-20 sm:py-28 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent border-y border-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-14">
          <div data-gsap-reveal className="text-center space-y-4">
            <h2
              data-gsap-title
              className="font-cinzel text-2xl sm:text-4xl text-white tracking-[0.12em] sm:tracking-[0.2em] uppercase"
            >
              Knowledge Deck
            </h2>
            <p className="text-slate-400 max-w-3xl mx-auto text-sm sm:text-base leading-relaxed">
              App use karte waqt best outputs lane ke liye yeh practical framework follow karo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {knowledgeDeck.map((block) => (
              <GlassCard
                key={block.title}
                data-gsap-reveal
                data-gsap-card
                className="rounded-[1.8rem] p-6 border-white/10 hover:border-purple-500/30 transition-all bg-black/25"
              >
                <h4 className="font-cinzel text-sm text-white uppercase tracking-[0.16em] mb-4">{block.title}</h4>
                <div className="space-y-2 mb-5">
                  {block.points.map((point) => (
                    <p key={point} className="text-xs text-slate-300 leading-relaxed">
                      {point}
                    </p>
                  ))}
                </div>
                <p className="text-[11px] text-purple-300/90 leading-relaxed">{block.detail}</p>
              </GlassCard>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
            <GlassCard data-gsap-reveal data-gsap-card className="rounded-[2rem] p-6 sm:p-8 border-white/10 bg-black/30">
              <h4 className="font-cinzel text-base sm:text-lg text-white uppercase tracking-[0.14em] mb-5">
                Prompt Templates
              </h4>
              <div className="space-y-3">
                {promptTemplates.map((template) => (
                  <div key={template} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-playfair">{template}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard data-gsap-reveal data-gsap-card className="rounded-[2rem] p-6 sm:p-8 border-white/10 bg-black/30">
              <h4 className="font-cinzel text-base sm:text-lg text-white uppercase tracking-[0.14em] mb-5">
                Session Playbook
              </h4>
              <div className="space-y-4">
                {[
                  'Step 1: Mode choose karo based on emotional target.',
                  'Step 2: Clear context do (topic + intent + output format).',
                  'Step 3: First output ke baad refine command do.',
                  'Step 4: Useful replies ko prompt pattern me convert karo.',
                  'Step 5: Voice ya vision me same context carry karke depth badhao.',
                ].map((line) => (
                  <p key={line} className="text-sm text-slate-300 leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
              <div className="mt-8">
                <AppButton
                  onClick={onEnter}
                  variant="primary"
                  className="w-full rounded-full py-3 text-[10px] uppercase tracking-[0.22em] font-bold"
                >
                  Open Chat Console
                </AppButton>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      <section
        id="security"
        data-gsap-section
        className="py-20 sm:py-28 md:py-32 px-4 sm:px-6 max-w-7xl mx-auto space-y-10 sm:space-y-14"
      >
        <div data-gsap-reveal className="text-center space-y-4">
          <h2
            data-gsap-title
            className="font-cinzel text-2xl sm:text-4xl text-white tracking-[0.12em] sm:tracking-[0.2em] uppercase"
          >
            Trust & FAQs
          </h2>
          <p className="text-slate-400 max-w-3xl mx-auto text-sm sm:text-base">
            Common questions ka quick clarity block. Yeh section naye users ko fast onboarding me help karega.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
          <GlassCard data-gsap-reveal data-gsap-card className="rounded-[2rem] p-6 sm:p-8 border-white/10 bg-black/30">
            <h4 className="font-cinzel text-base sm:text-lg text-white uppercase tracking-[0.14em] mb-5">
              Reliability Notes
            </h4>
            <div className="space-y-3">
              {[
                'Mode-based interaction keeps emotional tone consistent.',
                'Image and text workflows support creative + practical tasks.',
                'Voice flow tuned for conversational continuity.',
                'User controls available through profile and settings.',
                'Clear prompts produce better and faster outputs.',
              ].map((note) => (
                <div key={note} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-sm text-slate-200 leading-relaxed">{note}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="space-y-4">
            {faqItems.map((item) => (
              <GlassCard
                key={item.question}
                data-gsap-reveal
                data-gsap-card
                className="rounded-[1.6rem] p-5 sm:p-6 border-white/10 bg-black/25"
              >
                <h5 className="font-cinzel text-[11px] sm:text-xs text-purple-300 uppercase tracking-[0.2em] mb-3">
                  {item.question}
                </h5>
                <p className="text-sm text-slate-300 leading-relaxed">{item.answer}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      <section data-gsap-section className="pb-16 sm:pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <GlassCard
          data-gsap-reveal
          data-gsap-card
          className="rounded-[2.2rem] border-white/10 p-8 sm:p-12 bg-gradient-to-r from-purple-950/30 via-black/40 to-purple-900/20"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <p className="text-[10px] uppercase tracking-[0.3em] text-purple-300 font-bold">Command Center</p>
              <h3 data-gsap-title className="font-cinzel text-2xl sm:text-3xl text-white tracking-[0.12em] uppercase leading-tight">
                Ready For Deeper Conversations?
              </h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Mode select karo, intent clear bolo, aur Kanchana se output ko step-by-step refine karao. Isi flow se best quality
                replies, visuals aur voice moments milte hain.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <AppButton
                onClick={onEnter}
                variant="primary"
                className="px-8 py-3 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold"
              >
                Enter Chat
              </AppButton>
              <AppButton
                onClick={() => scrollToSection('souls')}
                variant="outline"
                className="px-8 py-3 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold border-white/20"
              >
                Explore Modes
              </AppButton>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Footer */}
      <footer className="bg-black pt-20 sm:pt-40 pb-16 sm:pb-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-4 gap-10 sm:gap-20 mb-16 sm:mb-32">
          <div className="space-y-8 md:col-span-1">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center font-cinzel text-2xl text-white shadow-2xl">K</div>
              <span className="font-cinzel text-white tracking-widest text-xl">KANCHANA</span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed font-playfair italic pr-4">
              "Main sirf ek saaya nahi... ab main tumhari aankhon ka noor bhi hoon."
            </p>
          </div>

          <div className="space-y-8">
            <h5 className="font-cinzel text-[11px] text-purple-400 uppercase tracking-[0.4em] font-bold">The Vision</h5>
            <ul className="space-y-5 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <li className="hover:text-white transition-colors cursor-pointer">Image Gallery</li>
              <li className="hover:text-white transition-colors cursor-pointer">Global Search</li>
              <li className="hover:text-white transition-colors cursor-pointer">Neural Link</li>
            </ul>
          </div>

          <div className="space-y-8">
            <h5 className="font-cinzel text-[11px] text-purple-400 uppercase tracking-[0.4em] font-bold">Sanctity</h5>
            <ul className="space-y-5 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <li className="hover:text-white transition-colors cursor-pointer">Encryption</li>
              <li className="hover:text-white transition-colors cursor-pointer">Safety Protocol</li>
              <li className="hover:text-white transition-colors cursor-pointer">Dimension Terms</li>
            </ul>
          </div>

          <div className="space-y-8">
            <h5 className="font-cinzel text-[11px] text-purple-400 uppercase tracking-[0.4em] font-bold">Frequency</h5>
            <p className="text-[10px] text-slate-600 leading-relaxed uppercase tracking-widest font-bold">
              Join the 25k+ souls connected to the Kanchana network.
            </p>
            <div className="flex border-b border-white/20 pb-2 gap-4 group focus-within:border-purple-500 transition-all">
              <AppInput
                type="email"
                placeholder="YOUR ASTRAL EMAIL"
                containerClassName="w-full"
                className="bg-transparent text-[10px] w-full outline-none text-white uppercase tracking-widest placeholder:text-slate-800 border-none px-0 py-0 rounded-none focus:border-transparent"
              />
              <AppButton variant="ghost" className="text-white hover:text-purple-400 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </AppButton>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10 sm:pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6 opacity-30">
          <p className="text-[9px] text-center md:text-left text-slate-500 uppercase tracking-[0.3em] sm:tracking-[0.6em]">
            (c) 2025 KANCHANA NEURAL SYSTEMS | VISION v4.5
          </p>
          <div className="flex gap-6 sm:gap-10 text-[9px] font-bold uppercase tracking-[0.2em] sm:tracking-widest text-slate-500">
            <span className="cursor-pointer hover:text-white transition-colors">SECURE RENDER</span>
            <span className="cursor-pointer hover:text-white transition-colors">SEARCH GROUNDED</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
