import type { DashboardSummary } from '../types';
import { Users, Wifi, CheckCircle, XCircle, Calendar } from 'lucide-react';

interface PilotStatusProps {
  summary: DashboardSummary | null;
  loading: boolean;
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
      <div className={`h-1.5 rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatusCard({ icon: Icon, label, value, target, targetLabel, color, progressColor }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  target?: number;
  targetLabel?: string;
  color: string;
  progressColor?: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="metric-label">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      {target !== undefined && typeof value === 'number' && (
        <>
          <ProgressBar value={value} max={target} color={progressColor || 'bg-brand-500'} />
          <p className="text-xs text-gray-400 mt-1">Target: {targetLabel || target}</p>
        </>
      )}
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function PilotStatus({ summary, loading }: PilotStatusProps) {
  const p = summary?.pilot;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-base font-semibold text-gray-800">Pilot Status</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Pilot Targets vs. Actual</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse h-28 bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatusCard
            icon={Users}
            label="Endpoints"
            value={p?.endpoint_count ?? 0}
            target={p?.target_endpoints}
            targetLabel={`${p?.target_endpoints} volunteers`}
            color="bg-brand-600"
            progressColor="bg-brand-500"
          />
          <StatusCard
            icon={Wifi}
            label="Access Media"
            value={p?.medium_count ?? 0}
            target={p?.target_media}
            targetLabel={`≥${p?.target_media} media types`}
            color="bg-violet-600"
            progressColor="bg-violet-500"
          />
          <StatusCard
            icon={CheckCircle}
            label="Valid Tests"
            value={p?.valid_measurement_count ?? 0}
            color="bg-emerald-600"
          />
          <StatusCard
            icon={XCircle}
            label="Failed / Incomplete"
            value={p?.failed_measurement_count ?? 0}
            color="bg-red-500"
          />
          <div className="card p-4 col-span-2 sm:col-span-1 lg:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <span className="metric-label">Measurement Period</span>
            </div>
            {p?.period_start ? (
              <div className="text-sm font-medium text-gray-800">
                {formatDate(p.period_start)} — {formatDate(p.period_end)}
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">No measurements yet</div>
            )}
            <p className="text-xs text-gray-400 mt-1">Target: 7 consecutive days</p>
          </div>
        </div>
      )}

      <p className="mt-2 text-xs text-gray-400">
        Progress bars reflect actual data vs. pilot targets. Targets are goals, not completed achievements.
      </p>
    </section>
  );
}
