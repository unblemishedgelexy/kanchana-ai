import { useEffect, useMemo, useState } from 'react';
import { api, ApiActivityEvent, subscribeApiActivity } from '../../services/api';
import { BACKEND_POLL_MS } from '../appState';

export const useBackendState = ({
  token,
  isAuthenticated,
}: {
  token: string;
  isAuthenticated: boolean;
}) => {
  const [backendPanelOpen, setBackendPanelOpen] = useState(false);
  const [backendHealthState, setBackendHealthState] = useState<'checking' | 'online' | 'offline'>(
    'checking'
  );
  const [backendLatencyMs, setBackendLatencyMs] = useState<number | null>(null);
  const [backendLastCheckedAt, setBackendLastCheckedAt] = useState<number | null>(null);
  const [backendEvents, setBackendEvents] = useState<ApiActivityEvent[]>([]);

  const backendSummary = useMemo(() => {
    const pendingRequests = backendEvents.filter((event) => event.status === 'pending').length;
    const successRequests = backendEvents.filter((event) => event.status === 'success').length;
    const errorRequests = backendEvents.filter((event) => event.status === 'error').length;
    return {
      totalRequests: backendEvents.length,
      pendingRequests,
      successRequests,
      errorRequests,
    };
  }, [backendEvents]);

  useEffect(() => {
    const unsubscribe = subscribeApiActivity((event) => {
      setBackendEvents((prev) => {
        const existingIndex = prev.findIndex((item) => item.requestId === event.requestId);
        if (existingIndex >= 0) {
          const withoutExisting = prev.filter((item) => item.requestId !== event.requestId);
          return [event, ...withoutExisting].slice(0, 120);
        }

        return [event, ...prev].slice(0, 120);
      });
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (backendPanelOpen) return;
    if (backendEvents[0]?.status === 'error') {
      setBackendPanelOpen(true);
    }
  }, [backendEvents, backendPanelOpen]);

  useEffect(() => {
    let cancelled = false;

    const checkBackendHealth = async () => {
      const startedAt = Date.now();
      try {
        await api.health();
        if (cancelled) return;
        setBackendHealthState('online');
        setBackendLatencyMs(Date.now() - startedAt);
      } catch {
        if (cancelled) return;
        setBackendHealthState('offline');
        setBackendLatencyMs(null);
      } finally {
        if (!cancelled) {
          setBackendLastCheckedAt(Date.now());
        }
      }
    };

    checkBackendHealth();
    const interval = window.setInterval(checkBackendHealth, BACKEND_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!token || !isAuthenticated) return;

    const executePing = () => {
      api
        .ping()
        .then(() => {
          setBackendHealthState('online');
          setBackendLastCheckedAt(Date.now());
        })
        .catch(() => {
          setBackendHealthState('offline');
          setBackendLastCheckedAt(Date.now());
        });
    };

    const interval = window.setInterval(executePing, 5 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [token, isAuthenticated]);

  const clearBackendEvents = () => setBackendEvents([]);

  return {
    backendPanelOpen,
    setBackendPanelOpen,
    backendHealthState,
    backendLatencyMs,
    backendLastCheckedAt,
    backendEvents,
    backendSummary,
    clearBackendEvents,
  };
};

