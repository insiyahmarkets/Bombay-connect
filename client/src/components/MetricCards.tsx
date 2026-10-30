import type { DashboardSummary } from '../types';

interface MetricCardsProps {
  summary: DashboardSummary | null;
  loading: boolean;
  isDemo: boolean;
}

interface CardProps {
  title: string;
  unit: string;
  direction: 'lower' | 'higher';
  avg: number | null;
  median: number | null;
  count: number;
  loading: boolean;
  color: string;
  description: string;
}

function MetricCard({ title, unit, direction, avg, median, count, loading, color, description }: CardProps) {
  const isEmpty = !loading && avg === null;

  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="metric-label">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          direction === 'lower' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
        }`}>
          {direction === 'lower' ? '↓ Lower is better' : '↑ Higher is better'}
        </span>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-100 rounded w-32" />
        </div>
      ) : isEmpty ? (
        <div className="py-4 text-center text-sm text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          No measurements available yet
        </div>
      ) : (
        <>
          <div className="flex items-end gap-2">
            <span className={`text-3xl font-bold ${color}`}>{avg?.toFixed(1)}</span>
            <span className="text-sm text-gray-500 mb-1">{unit}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Avg: <span className="font-medium text-gray-700">{avg?.toFixed(1)} {unit}</span></span>
            {median !== null && (
              <span>Median: <span className="font-medium text-gray-700">{median.toFixed(1)} {unit}</span></span>
            )}
            <span className="ml-auto">
              <span className="font-medium text-gray-700">{count}</span> valid tests
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export function MetricCards({ summary, loading, isDemo }: MetricCardsProps) {
  const m = summary?.metrics;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-base font-semibold text-gray-800">Quality Metrics</h2>
        {isDemo && <span className="demo-badge">DEMO</span>}
        {summary && !loading && (
          <span className="ml-auto text-xs text-gray-400">
            {summary.pilot.valid_measurement_count} valid · {summary.pilot.failed_measurement_count} failed
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Latency"
          unit="ms"
          direction="lower"
          avg={m?.latency.avg ?? null}
          median={m?.latency.median ?? null}
          count={m?.latency.count ?? 0}
          loading={loading}
          color="text-brand-700"
          description="Round-trip response time"
        />
        <MetricCard
          title="Packet Loss"
          unit="%"
          direction="lower"
          avg={m?.packet_loss.avg ?? null}
          median={m?.packet_loss.median ?? null}
          count={m?.packet_loss.count ?? 0}
          loading={loading}
          color="text-red-600"
          description="Probes lost within timeout"
        />
        <MetricCard
          title="DNS Response"
          unit="ms"
          direction="lower"
          avg={m?.dns.avg ?? null}
          median={m?.dns.median ?? null}
          count={m?.dns.count ?? 0}
          loading={loading}
          color="text-violet-700"
          description="DNS lookup duration"
        />
        <MetricCard
          title="Throughput"
          unit="Mbps"
          direction="higher"
          avg={m?.throughput.avg ?? null}
          median={m?.throughput.median ?? null}
          count={m?.throughput.count ?? 0}
          loading={loading}
          color="text-emerald-700"
          description="Controlled data transfer rate"
        />
      </div>
    </section>
  );
}
