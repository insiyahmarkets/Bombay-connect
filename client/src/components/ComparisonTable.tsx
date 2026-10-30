import { useState, useMemo } from 'react';
import type { ComparisonRow } from '../types';
import { MEDIUM_LABELS, CONNECTION_LABELS } from '../types';
import { ArrowUpDown, ArrowUp, ArrowDown, BarChart3 } from 'lucide-react';

interface ComparisonTableProps {
  comparison: ComparisonRow[];
  loading: boolean;
  isDemo: boolean;
}

type SortKey = 'avg_latency' | 'avg_packet_loss' | 'avg_dns' | 'avg_throughput' | 'valid_tests';
type SortDir = 'asc' | 'desc';

const MEDIUM_CHIP: Record<string, string> = {
  fiber: 'bg-blue-100 text-blue-800',
  mobile: 'bg-amber-100 text-amber-800',
  fixed_wireless: 'bg-emerald-100 text-emerald-800',
  other: 'bg-gray-100 text-gray-700',
};

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
  return dir === 'asc' ? <ArrowUp className="w-3 h-3 text-brand-600" /> : <ArrowDown className="w-3 h-3 text-brand-600" />;
}

function fmt(v: number | null, decimals = 1): string {
  return v === null ? '—' : v.toFixed(decimals);
}

export function ComparisonTable({ comparison, loading, isDemo }: ComparisonTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('avg_latency');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'avg_throughput' || key === 'valid_tests' ? 'desc' : 'asc');
    }
  };

  const sorted = useMemo(() => {
    return [...comparison].sort((a, b) => {
      const av = a[sortKey] ?? (sortDir === 'asc' ? Infinity : -Infinity);
      const bv = b[sortKey] ?? (sortDir === 'asc' ? Infinity : -Infinity);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [comparison, sortKey, sortDir]);

  const ColHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <th
      className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 cursor-pointer select-none hover:bg-gray-50 whitespace-nowrap"
      onClick={() => toggleSort(k)}
    >
      <span className="flex items-center gap-1">
        {label}
        <SortIcon active={sortKey === k} dir={sortDir} />
      </span>
    </th>
  );

  return (
    <section className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-gray-500" />
        <h2 className="text-base font-semibold text-gray-800">Connection Comparison</h2>
        {isDemo && <span className="demo-badge">DEMO</span>}
        <p className="ml-auto text-xs text-gray-400">
          Click column headers to sort · Context affects results
        </p>
      </div>

      {/* Context disclaimer */}
      <div className="px-5 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-700">
        ℹ Differences between connection types reflect multiple factors (location, time, device, routing), not access medium alone.
        These results are not a ranking.
      </div>

      {loading ? (
        <div className="p-8 flex items-center justify-center">
          <div className="text-gray-400 text-sm animate-pulse">Loading comparison data…</div>
        </div>
      ) : sorted.length === 0 ? (
        <div className="p-8 flex flex-col items-center justify-center text-gray-400">
          <BarChart3 className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-sm">No comparison data available</p>
          <p className="text-xs mt-1">Register endpoints and submit measurements to compare</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Access Medium</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">ISP</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">Site</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">Device</th>
                <ColHeader label="Tests" k="valid_tests" />
                <ColHeader label="Avg Latency (ms)" k="avg_latency" />
                <ColHeader label="Median Lat (ms)" k="avg_latency" />
                <ColHeader label="Avg PktLoss (%)" k="avg_packet_loss" />
                <ColHeader label="Avg DNS (ms)" k="avg_dns" />
                <ColHeader label="Avg Throughput (Mbps)" k="avg_throughput" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5">
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${MEDIUM_CHIP[row.access_medium] || MEDIUM_CHIP.other}`}>
                      {MEDIUM_LABELS[row.access_medium] ?? row.access_medium}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-medium text-gray-800">{row.isp}</td>
                  <td className="px-3 py-2.5 text-gray-600">{row.site_label}</td>
                  <td className="px-3 py-2.5 text-gray-600">{CONNECTION_LABELS[row.device_connection] ?? row.device_connection}</td>
                  <td className="px-3 py-2.5 font-medium text-gray-700">{row.valid_tests}</td>
                  <td className="px-3 py-2.5 text-gray-700">{fmt(row.avg_latency)}</td>
                  <td className="px-3 py-2.5 text-gray-700">{fmt(row.median_latency)}</td>
                  <td className="px-3 py-2.5 text-gray-700">{fmt(row.avg_packet_loss, 2)}</td>
                  <td className="px-3 py-2.5 text-gray-700">{fmt(row.avg_dns)}</td>
                  <td className="px-3 py-2.5 text-gray-700">{fmt(row.avg_throughput)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
