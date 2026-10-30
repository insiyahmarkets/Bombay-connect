// Shared TypeScript types for NetCompare

export type AccessMedium = 'fiber' | 'mobile' | 'fixed_wireless' | 'other';
export type DeviceConnection = 'wifi' | 'ethernet' | 'cellular' | 'unknown';
export type MeasurementStatus = 'ok' | 'failed' | 'partial' | 'incomplete';

export interface Endpoint {
  id: number;
  participant_id: string;
  site_label: string;
  access_medium: AccessMedium;
  isp: string;
  device_connection: DeviceConnection;
  notes?: string;
  is_demo: number;
  created_at: string;
}

export interface Measurement {
  id: number;
  endpoint_id: number;
  participant_id: string;
  site_label: string;
  access_medium: AccessMedium;
  isp: string;
  device_connection: DeviceConnection;
  measured_at: string;
  latency_ms: number | null;
  packet_loss_percent: number | null;
  dns_response_ms: number | null;
  throughput_mbps: number | null;
  measurement_status: MeasurementStatus;
  failure_reason: string | null;
  measurement_method: string | null;
  is_demo: number;
}

export interface MetricStats {
  avg: number | null;
  median: number | null;
  count: number;
}

export interface DashboardSummary {
  pilot: {
    endpoint_count: number;
    medium_count: number;
    valid_measurement_count: number;
    failed_measurement_count: number;
    period_start: string | null;
    period_end: string | null;
    target_endpoints: number;
    target_days: number;
    target_media: number;
  };
  metrics: {
    latency: MetricStats;
    packet_loss: MetricStats;
    dns: MetricStats;
    throughput: MetricStats;
  };
}

export interface TrendPoint {
  day: string;
  latency: number | null;
  packet_loss: number | null;
  dns: number | null;
  throughput: number | null;
  sample_count: number;
}

export interface ComparisonRow {
  access_medium: AccessMedium;
  isp: string;
  site_label: string;
  device_connection: DeviceConnection;
  valid_tests: number;
  avg_latency: number | null;
  median_latency: number | null;
  avg_packet_loss: number | null;
  avg_dns: number | null;
  avg_throughput: number | null;
  min_latency: number | null;
  max_latency: number | null;
  min_throughput: number | null;
  max_throughput: number | null;
}

export interface DashboardFilters {
  medium: string;
  isp: string;
  site: string;
  device_connection: string;
  date_from: string;
  date_to: string;
  demo: boolean;
}

export const MEDIUM_LABELS: Record<string, string> = {
  fiber: 'Fiber Broadband',
  mobile: 'Mobile / Cellular',
  fixed_wireless: 'Fixed Wireless',
  other: 'Other',
};

export const CONNECTION_LABELS: Record<string, string> = {
  wifi: 'Wi-Fi',
  ethernet: 'Ethernet',
  cellular: 'Cellular',
  unknown: 'Unknown',
};

export const MEDIUM_COLORS: Record<string, string> = {
  fiber: '#2563eb',
  mobile: '#f59e0b',
  fixed_wireless: '#10b981',
  other: '#8b5cf6',
};
