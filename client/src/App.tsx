import { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { FiltersBar } from './components/FiltersBar';
import { MetricCards } from './components/MetricCards';
import { TrendCharts } from './components/TrendCharts';
import { ComparisonTable } from './components/ComparisonTable';
import { PilotStatus } from './components/PilotStatus';
import { MeasurementHistory } from './components/MeasurementHistory';
import { EndpointRegistration } from './components/EndpointRegistration';
import { useDashboard } from './hooks/useDashboard';
import type { DashboardFilters } from './types';
import { AlertCircle } from 'lucide-react';

const DEFAULT_FILTERS: DashboardFilters = {
  medium: '',
  isp: '',
  site: '',
  device_connection: '',
  date_from: '',
  date_to: '',
  demo: false,
};

export default function App() {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);

  const updateFilters = useCallback((patch: Partial<DashboardFilters>) => {
    setFilters(f => ({ ...f, ...patch }));
  }, []);

  const toggleDemo = useCallback(() => {
    setFilters(f => ({ ...DEFAULT_FILTERS, demo: !f.demo }));
  }, []);

  const {
    connectionStatus,
    summary,
    trends,
    comparison,
    measurements,
    measurementTotal,
    loading,
    error,
    refresh,
    measurementPage,
    setMeasurementPage,
  } = useDashboard(filters);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        connectionStatus={connectionStatus}
        isDemo={filters.demo}
        onToggleDemo={toggleDemo}
        onRefresh={refresh}
      />

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Global error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Backend connection error</p>
              <p className="text-xs mt-0.5 text-red-600">{error}</p>
              <p className="text-xs mt-1 text-red-500">Make sure the server is running on port 3001 and try refreshing.</p>
            </div>
          </div>
        )}

        {/* Section B: Filters */}
        <FiltersBar filters={filters} onChange={updateFilters} isDemo={filters.demo} />

        {/* Section C: Metric Cards */}
        <MetricCards summary={summary} loading={loading} isDemo={filters.demo} />

        {/* Section E: Trend Charts */}
        <TrendCharts trends={trends} loading={loading} isDemo={filters.demo} />

        {/* Section D: Comparison Table */}
        <ComparisonTable comparison={comparison} loading={loading} isDemo={filters.demo} />

        {/* Section F: Pilot Status */}
        <PilotStatus summary={summary} loading={loading} />

        {/* Section G: Measurement History */}
        <MeasurementHistory
          measurements={measurements}
          total={measurementTotal}
          page={measurementPage}
          onPageChange={setMeasurementPage}
          loading={loading}
          isDemo={filters.demo}
        />

        {/* Section: Endpoint Registration */}
        <EndpointRegistration onRegistered={refresh} />

        {/* Footer */}
        <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200">
          <p>
            NetCompare · Pilot Internet-Quality Comparison Platform · A3-PS014-TC466
          </p>
          <p className="mt-1">
            Bombay Connect · AIORI Hackathon 3 · Data collected for pilot research purposes only.
          </p>
          <p className="mt-1 text-gray-300">
            This is a local development instance. Real measurements require the agent script to be running on volunteer devices.
          </p>
        </footer>
      </main>
    </div>
  );
}
