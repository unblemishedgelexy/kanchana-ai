'use client';

import GalleryPage from '../../../components/pages/GalleryPage';
import { useAppRuntime } from '../../providers/AppRuntimeProvider';

export default function GalleryRoutePage() {
  const runtime = useAppRuntime();
  return <GalleryPage threads={runtime.threads} onBack={() => runtime.setView('chat')} />;
}
