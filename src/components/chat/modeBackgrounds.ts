import { KanchanaMode } from '../../shared/types';

const MODE_BACKGROUND_WEBP: Record<KanchanaMode, string> = {
  [KanchanaMode.LOVELY]:
    'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1800&q=80&fm=webp',
  [KanchanaMode.SHAYARI]:
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1800&q=80&fm=webp',
  [KanchanaMode.CHILL]:
    'https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=1800&q=80&fm=webp',
  [KanchanaMode.NAUGHTY]:
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1800&q=80&fm=webp',
  [KanchanaMode.POSSESSIVE]:
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1800&q=80&fm=webp',
  [KanchanaMode.HORROR]:
    'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=1800&q=80&fm=webp',
  [KanchanaMode.MYSTIC]:
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1800&q=80&fm=webp',
};

export const getModeBackground = (mode: KanchanaMode): string =>
  MODE_BACKGROUND_WEBP[mode] || MODE_BACKGROUND_WEBP[KanchanaMode.LOVELY];
