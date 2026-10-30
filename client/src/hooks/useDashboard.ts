import { useState, useEffect, useCallback, useRef } from 'react';
import { checkHealth, getDashboardSummary, getDashboardTrends, getDashboardComparison, getMeasurements } from '../api';
import type { DashboardSummary, TrendPoint, ComparisonRow, DashboardFilters, Measurement } from '../types';

type ConnectionStatus = 'connecting' | 'connected' | 'error';

interface UseDashboardState {
  connectionStatus: ConnectionStatus;
  summary: DashboardSummary | null;
  trends: TrendPoint[];
  comparison: ComparisonRow[];
  measurements: Measurement[];
  measurementTotal: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  measurementPage: number;
  setMeasurementPage: (p: number) => void;
}

const PAGE_SIZE = 20;

export function useDashboard(filters: DashboardFilters): UseDashboardState {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [comparison, setComparison] = useState<ComparisonRow[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [measurementTotal, setMeasurementTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [measurementPage, setMeasurementPage] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(() => {
    setMeasurementPage(0);
    setTick(t => t + 1);
  }, []);

  // Health check
  useEffect(() => {
    setConnectionStatus('connecting');
    checkHealth()
      .then(h => setConnectionStatus(h.status === 'ok' ? 'connected' : 'error'))
      .catch(() => setConnectionStatus('error'));
  }, [tick]);

  // Data fetch
  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    Promise.all([
      getDashboardSummary(filters),
      getDashboardTrends(filters),
      getDashboardComparison(filters),
      getMeasurements({ ...filters, limit: PAGE_SIZE, offset: measurementPage * PAGE_SIZE }),
    ])
      .then(([s, t, c, m]) => {
        setSummary(s);
        setTrends(t);
        setComparison(c);
        setMeasurements(m.data);
        setMeasurementTotal(m.total);
        setError(null);
      })
      .catch(err => {
        if (err?.code !== 'ERR_CANCELED') {
          setError('Failed to load dashboard data. Is the backend running?');
        }
      })
      .finally(() => setLoading(false));
  }, [tick, filters, measurementPage]);

  return {
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
  };
}
