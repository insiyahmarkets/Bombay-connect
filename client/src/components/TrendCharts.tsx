import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { TrendPoint } from '../types';
import { TrendingUp } from 'lucide-react';

interface TrendChartsProps {
  trends: TrendPoint[];
  loading: boolean;
  isDemo: boolean;
}

type MetricKey = 'latency' | 'packet_loss' | 'dns' | 'throughput';

const METRICS: { key: MetricKey; label: string; unit: string; color: string }[] = [
  { key: 'latency',      label: 'Latency',        unit: 'ms',   color: '#2563eb' },
  { key: 'packet_loss',  label: 'Packet Loss',     unit: '%',    color: '#dc2626' },
  { key: 'dns',          label: 'DNS Response',    unit: 'ms',   color: '#7c3aed' },
  { key: 'throughput',   label: 'Throughput',      unit: 'Mbps', color: '#059669' },
];

function formatDay(day: string): string {
  const d = new Date(day + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Custom tooltip that shows null as "No data"
function CustomTooltip({ active, payload, label, unit }: {
  active?: boolean; payload?: { value: number | null; name: string }[]; label?: string; unit: string;
}) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-lg px-3 py-2 text-sm">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {val === null ? (
        <p className="text-gray-400 italic">No data</p>
      ) : (
        <p className="text-brand-700 font-semibold">{val} {unit}</p>
      )}
    </div>
  );
}

export function TrendCharts({ trends, loading, isDemo }: TrendChartsProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('latency');

  const metric = METRICS.find(m => m.key === selectedMetric)!;

  // Convert null values to undefined so Recharts shows a gap
  const chartData = trends.map(t => ({
    day: formatDay(t.day),
    value: t[selectedMetric] ?? undefined,
    samples: t.sample_count,
  }));

  const hasDays = trends.length > 0;
  const hasSevenDays = trends.length >= 7;

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-500" />
          <h2 className="text-base font-semibold text-gray-800">7-Day Performance Trends</h2>
          {isDemo && <span className="demo-badge">DEMO</span>}
        </div>
        {/* Metric selector */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {METRICS.map(m => (
            <button
              key={m.key}
              onClick={() => setSelectedMetric(m.key)}
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                selectedMetric === m.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Period warning */}
      {hasDays && !hasSevenDays && (
        <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ℹ {trends.length} day{trends.length !== 1 ? 's' : ''} of data available — full 7-day period not yet collected.
          Gaps indicate days with no valid measurements.
        </div>
      )}

      {loading ? (
        <div className="h-56 flex items-center justify-center">
          <div className="text-gray-400 text-sm animate-pulse">Loading chart data…</div>
        </div>
      ) : !hasDays ? (
        <div className="h-56 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <TrendingUp className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-sm">No trend data available</p>
          <p className="text-xs mt-1">Start collecting measurements to see trends here</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={v => `${v}`}
                label={{ value: metric.unit, angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9ca3af', dx: 12 }}
              />
              <Tooltip content={<CustomTooltip unit={metric.unit} />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="value"
                name={`${metric.label} (${metric.unit})`}
                stroke={metric.color}
                strokeWidth={2}
                dot={{ r: 3, fill: metric.color }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="mt-2 text-xs text-gray-400 text-right">
            Aggregated by day · Gaps = no valid measurements · Axis: {metric.unit}
          </p>
        </>
      )}
    </section>
  );
}
