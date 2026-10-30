import type { Measurement } from '../types';
import { MEDIUM_LABELS, CONNECTION_LABELS } from '../types';
import { History, ChevronLeft, ChevronRight } from 'lucide-react';

interface MeasurementHistoryProps {
  measurements: Measurement[];
  total: number;
  page: number;
  onPageChange: (p: number) => void;
  loading: boolean;
  isDemo: boolean;
}

const PAGE_SIZE = 20;

const STATUS_CHIP: Record<string, string> = {
  ok: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
  partial: 'bg-amber-100 text-amber-800',
  incomplete: 'bg-gray-100 text-gray-700',
};

function fmt(v: number | null, dec = 1): string {
  return v === null ? '—' : v.toFixed(dec);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function MeasurementHistory({ measurements, total, page, onPageChange, loading, isDemo }: MeasurementHistoryProps) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-2">
        <History className="w-4 h-4 text-gray-500" />
        <h2 className="text-base font-semibold text-gray-800">Measurement History</h2>
        {isDemo && <span className="demo-badge">DEMO</span>}
        <span className="ml-auto text-xs text-gray-400">{total} total records</span>
      </div>

      <div className="px-5 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
        Anonymous endpoint IDs only — no personal information is stored or displayed.
      </div>

      {loading ? (
        <div className="p-8 flex items-center justify-center">
          <div className="text-gray-400 text-sm animate-pulse">Loading measurement history…</div>
        </div>
      ) : measurements.length === 0 ? (
        <div className="p-8 flex flex-col items-center justify-center text-gray-400">
          <History className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-sm">No measurements to show</p>
          <p className="text-xs mt-1">Submit measurements using the agent or API to see them here</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Endpoint ID</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Timestamp</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Site</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Medium</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">ISP</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Device</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Latency (ms)</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Pkt Loss (%)</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-gray-600">DNS (ms)</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Throughput (Mbps)</th>
                  <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {measurements.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5 font-mono font-medium text-gray-800">
                      {m.participant_id}
                      {m.is_demo ? <span className="ml-1 text-amber-600 text-xs">(D)</span> : null}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{fmtDate(m.measured_at)}</td>
                    <td className="px-3 py-2.5 text-gray-600">{m.site_label}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-block px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {MEDIUM_LABELS[m.access_medium] ?? m.access_medium}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{m.isp}</td>
                    <td className="px-3 py-2.5 text-gray-500">{CONNECTION_LABELS[m.device_connection] ?? m.device_connection}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700">{fmt(m.latency_ms)}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700">{fmt(m.packet_loss_percent, 2)}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700">{fmt(m.dns_response_ms)}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700">{fmt(m.throughput_mbps)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_CHIP[m.measurement_status] || STATUS_CHIP.incomplete}`}>
                        {m.measurement_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Page {page + 1} of {totalPages} · {total} total
            </span>
            <div className="flex items-center gap-1">
              <button
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
