import { useState, useEffect } from 'react';
import { getEndpoints } from '../api';
import type { DashboardFilters, Endpoint } from '../types';
import { Filter, X } from 'lucide-react';

interface FiltersBarProps {
  filters: DashboardFilters;
  onChange: (f: Partial<DashboardFilters>) => void;
  isDemo: boolean;
}

function sevenDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().split('T')[0];
}
function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function FiltersBar({ filters, onChange, isDemo }: FiltersBarProps) {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);

  useEffect(() => {
    getEndpoints(isDemo).catch(() => null).then(eps => {
      if (eps) setEndpoints(eps);
    });
  }, [isDemo]);

  const isps = Array.from(new Set(endpoints.map(e => e.isp))).sort();
  const sites = Array.from(new Set(endpoints.map(e => e.site_label))).sort();

  const hasActive = !!(filters.medium || filters.isp || filters.site || filters.device_connection || filters.date_from || filters.date_to);

  const clearAll = () => onChange({ medium: '', isp: '', site: '', device_connection: '', date_from: '', date_to: '' });

  return (
    <section className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-gray-500" />
        <h2 className="text-sm font-semibold text-gray-700">Filters</h2>
        {hasActive && (
          <button onClick={clearAll} className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors">
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Access Medium */}
        <div>
          <label className="metric-label block mb-1">Access Medium</label>
          <select className="form-select" value={filters.medium} onChange={e => onChange({ medium: e.target.value })}>
            <option value="">All media</option>
            <option value="fiber">Fiber Broadband</option>
            <option value="mobile">Mobile / Cellular</option>
            <option value="fixed_wireless">Fixed Wireless</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* ISP */}
        <div>
          <label className="metric-label block mb-1">ISP</label>
          <select className="form-select" value={filters.isp} onChange={e => onChange({ isp: e.target.value })}>
            <option value="">All ISPs</option>
            {isps.map(isp => <option key={isp} value={isp}>{isp}</option>)}
          </select>
        </div>

        {/* Site */}
        <div>
          <label className="metric-label block mb-1">Location / Site</label>
          <select className="form-select" value={filters.site} onChange={e => onChange({ site: e.target.value })}>
            <option value="">All sites</option>
            {sites.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Device connection */}
        <div>
          <label className="metric-label block mb-1">Device Connection</label>
          <select className="form-select" value={filters.device_connection} onChange={e => onChange({ device_connection: e.target.value })}>
            <option value="">All connections</option>
            <option value="wifi">Wi-Fi</option>
            <option value="ethernet">Ethernet</option>
            <option value="cellular">Cellular</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>

        {/* Date from */}
        <div>
          <label className="metric-label block mb-1">From Date</label>
          <input
            type="date"
            className="form-input"
            value={filters.date_from}
            onChange={e => onChange({ date_from: e.target.value })}
            max={filters.date_to || today()}
          />
        </div>

        {/* Date to */}
        <div>
          <label className="metric-label block mb-1">To Date</label>
          <div className="flex gap-1">
            <input
              type="date"
              className="form-input"
              value={filters.date_to}
              onChange={e => onChange({ date_to: e.target.value })}
              min={filters.date_from}
              max={today()}
            />
          </div>
          <button
            className="mt-1 text-xs text-brand-600 hover:text-brand-800 font-medium"
            onClick={() => onChange({ date_from: sevenDaysAgo(), date_to: today() })}
          >
            Last 7 days
          </button>
        </div>
      </div>
    </section>
  );
}
