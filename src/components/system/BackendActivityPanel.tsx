import React from 'react';
import { API_BASE_URL, ApiActivityEvent } from '../../services/api';
import AppButton from '../ui/AppButton';

type BackendHealthState = 'checking' | 'online' | 'offline';

interface BackendActivityPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
  healthState: BackendHealthState;
  latencyMs: number | null;
  lastCheckedAt: number | null;
  totalRequests: number;
  pendingRequests: number;
  successRequests: number;
  errorRequests: number;
  events: ApiActivityEvent[];
}

const healthStyleMap: Record<BackendHealthState, string> = {
  checking: 'bg-yellow-500/25 text-yellow-200 border-yellow-500/40',
  online: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
  offline: 'bg-rose-500/20 text-rose-200 border-rose-500/40',
};

const eventStyleMap: Record<'pending' | 'success' | 'error', string> = {
  pending: 'border-yellow-500/35 bg-yellow-500/10 text-yellow-100',
  success: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-100',
  error: 'border-rose-500/35 bg-rose-500/10 text-rose-100',
};

const formatTime = (timestamp: number | null) => {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleTimeString();
};

const formatHealthLabel = (state: BackendHealthState) => {
  if (state === 'online') return 'Online';
  if (state === 'offline') return 'Offline';
  return 'Checking';
};

const BackendActivityPanel: React.FC<BackendActivityPanelProps> = ({
  isOpen,
  onToggle,
  onClear,
  healthState,
  latencyMs,
  lastCheckedAt,
  totalRequests,
  pendingRequests,
  successRequests,
  errorRequests,
  events,
}) => {
  return (
    <div className="fixed bottom-4 right-4 z-[90] w-[min(94vw,460px)] pointer-events-none">
      <div className="pointer-events-auto flex justify-end">
        <AppButton
          onClick={onToggle}
          variant="secondary"
          type="button"
          className="rounded-full border border-fuchsia-500/50 bg-black/70 px-3 py-2 text-[11px] font-semibold text-fuchsia-100 shadow-lg backdrop-blur-md transition hover:bg-black/85"
        >
          {isOpen ? 'Hide Backend Activity' : 'Show Backend Activity'}
        </AppButton>
      </div>

      {isOpen && (
        <section className="pointer-events-auto mt-2 overflow-hidden rounded-2xl border border-white/15 bg-black/75 backdrop-blur-md">
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <h3 className="text-sm font-bold text-white">Backend Activity</h3>
              <p className="text-[10px] text-white/55">{API_BASE_URL}</p>
            </div>
            <div
              className={`rounded-full border px-2 py-1 text-[10px] font-bold ${healthStyleMap[healthState]}`}
            >
              {formatHealthLabel(healthState)}
            </div>
          </header>

          <div className="grid grid-cols-2 gap-2 px-4 py-3 text-[11px]">
            <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/90">
              <div className="text-white/55">Latency</div>
              <div className="font-semibold">{latencyMs !== null ? `${latencyMs} ms` : '-'}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/90">
              <div className="text-white/55">Last Check</div>
              <div className="font-semibold">{formatTime(lastCheckedAt)}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/90">
              <div className="text-white/55">Requests</div>
              <div className="font-semibold">{totalRequests}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/90">
              <div className="text-white/55">Pending</div>
              <div className="font-semibold">{pendingRequests}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/90">
              <div className="text-white/55">Success</div>
              <div className="font-semibold">{successRequests}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/90">
              <div className="text-white/55">Errors</div>
              <div className="font-semibold">{errorRequests}</div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 px-4 py-2">
            <p className="text-[10px] uppercase tracking-wider text-white/45">Latest Backend Calls</p>
            <AppButton
              onClick={onClear}
              type="button"
              variant="secondary"
              className="rounded border border-white/20 px-2 py-1 text-[10px] font-semibold text-white/80 transition hover:bg-white/10"
            >
              Clear
            </AppButton>
          </div>

          <div className="max-h-72 space-y-2 overflow-y-auto px-4 pb-4">
            {events.length === 0 && (
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/60">
                No backend events yet.
              </div>
            )}

            {events.map((event) => {
              const statusLabel =
                event.status === 'success'
                  ? `${event.statusCode || 200} | ${event.durationMs || 0}ms`
                  : event.status === 'error'
                  ? `${event.statusCode || 'ERR'} | ${event.durationMs || 0}ms`
                  : 'pending';

              return (
                <div
                  key={event.requestId}
                  className={`rounded-lg border px-3 py-2 text-[11px] ${eventStyleMap[event.status]}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold uppercase tracking-wide">
                      {event.method} {event.path}
                    </span>
                    <span className="text-[10px] opacity-80">{statusLabel}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[10px] opacity-85">
                    <span className="truncate">{event.message}</span>
                    <span>{formatTime(event.timestamp)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default BackendActivityPanel;


