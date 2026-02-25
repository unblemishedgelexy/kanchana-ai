'use client';

import CardsPage from '../../../components/pages/CardsPage';
import { useAppRuntime } from '../../providers/AppRuntimeProvider';

export default function CardsRoutePage() {
  const runtime = useAppRuntime();
  return <CardsPage onBack={() => runtime.setView('chat')} />;
}
