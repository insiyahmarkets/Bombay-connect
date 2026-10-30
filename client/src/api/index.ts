import axios from 'axios';
import type {
  Endpoint,
  Measurement,
  DashboardSummary,
  TrendPoint,
  ComparisonRow,
  DashboardFilters,
} from '../types';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});
// ------ Health ------
export async function checkHealth(): Promise<{ status: string; db: string; uptime_seconds: number }> {
  const res = await api.get('/health');
  return res.data;
}

// ------ Endpoints ------
export async function getEndpoints(includeDemo = false): Promise<Endpoint[]> {
  const res = await api.get('/endpoints', { params: { demo: includeDemo ? 'true' : 'false' } });
  return res.data.data;
}

export async function registerEndpoint(data: {
  participant_id: string;
  site_label: string;
  access_medium: string;
  isp: string;
  device_connection: string;
  notes?: string;
}): Promise<Endpoint> {
  const res = await api.post('/endpoints', data);
  return res.data.data;
}

// ------ Measurements ------
export interface MeasurementListResponse {
  data: Measurement[];
  count: number;
  total: number;
}

function filtersToParams(filters: Partial<DashboardFilters> & { limit?: number; offset?: number }) {
  const p: Record<string, string> = {};
  if (filters.medium) p.medium = filters.medium;
  if (filters.isp) p.isp = filters.isp;
  if (filters.site) p.site = filters.site;
  if (filters.device_connection) p.device_connection = filters.device_connection;
  if (filters.date_from) p.date_from = filters.date_from;
  if (filters.date_to) p.date_to = filters.date_to;
  if (filters.demo !== undefined) p.demo = filters.demo ? 'true' : 'false';
  if (filters.limit !== undefined) p.limit = String(filters.limit);
  if (filters.offset !== undefined) p.offset = String(filters.offset);
  return p;
}

export async function getMeasurements(
  filters: Partial<DashboardFilters> & { limit?: number; offset?: number } = {}
): Promise<MeasurementListResponse> {
  const res = await api.get('/measurements', { params: filtersToParams(filters) });
  return res.data;
}

export async function submitMeasurement(data: {
  endpoint_id: number;
  measured_at: string;
  latency_ms?: number | null;
  packet_loss_percent?: number | null;
  dns_response_ms?: number | null;
  throughput_mbps?: number | null;
  measurement_status?: string;
  failure_reason?: string | null;
  measurement_method?: string | null;
}): Promise<Measurement> {
  const res = await api.post('/measurements', data);
  return res.data.data;
}

// ------ Dashboard ------
export async function getDashboardSummary(filters: Partial<DashboardFilters> = {}): Promise<DashboardSummary> {
  const res = await api.get('/dashboard/summary', { params: filtersToParams(filters) });
  return res.data.data;
}

export async function getDashboardTrends(filters: Partial<DashboardFilters> = {}): Promise<TrendPoint[]> {
  const res = await api.get('/dashboard/trends', { params: filtersToParams(filters) });
  return res.data.data;
}

export async function getDashboardComparison(filters: Partial<DashboardFilters> = {}): Promise<ComparisonRow[]> {
  const res = await api.get('/dashboard/comparison', { params: filtersToParams(filters) });
  return res.data.data;
}
