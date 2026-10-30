import { queryAll, queryOne, runInsert, Param } from '../db/database';

export interface Measurement {
  id: number;
  endpoint_id: number;
  participant_id: string;
  site_label: string;
  access_medium: string;
  isp: string;
  device_connection: string;
  measured_at: string;
  latency_ms: number | null;
  packet_loss_percent: number | null;
  dns_response_ms: number | null;
  throughput_mbps: number | null;
  measurement_status: string;
  failure_reason: string | null;
  measurement_method: string | null;
  is_demo: number;
}

export interface MeasurementInput {
  endpoint_id: number;
  measured_at: string;
  latency_ms?: number | null;
  packet_loss_percent?: number | null;
  dns_response_ms?: number | null;
  throughput_mbps?: number | null;
  measurement_status?: string;
  failure_reason?: string | null;
  measurement_method?: string | null;
}

export interface MeasurementFilters {
  medium?: string;
  isp?: string;
  site?: string;
  device_connection?: string;
  date_from?: string;
  date_to?: string;
  is_demo?: boolean;
  limit?: number;
  offset?: number;
}

export function buildFilterWhere(filters: MeasurementFilters): { conditions: string[]; params: Param[] } {
  const conditions: string[] = [];
  const params: Param[] = [];

  if (filters.is_demo !== undefined) { conditions.push('m.is_demo = ?'); params.push(filters.is_demo ? 1 : 0); }
  if (filters.medium) { conditions.push('e.access_medium = ?'); params.push(filters.medium); }
  if (filters.isp) { conditions.push('e.isp = ?'); params.push(filters.isp); }
  if (filters.site) { conditions.push('e.site_label = ?'); params.push(filters.site); }
  if (filters.device_connection) { conditions.push('e.device_connection = ?'); params.push(filters.device_connection); }
  if (filters.date_from) { conditions.push('m.measured_at >= ?'); params.push(filters.date_from); }
  if (filters.date_to) { conditions.push('m.measured_at <= ?'); params.push(filters.date_to); }

  return { conditions, params };
}

export async function getMeasurements(filters: MeasurementFilters = {}): Promise<Measurement[]> {
  const { conditions, params } = buildFilterWhere(filters);
  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const limit = filters.limit ?? 100;
  const offset = filters.offset ?? 0;

  return queryAll<Measurement>(
    `SELECT m.*, e.participant_id, e.site_label, e.access_medium, e.isp, e.device_connection
     FROM measurements m JOIN endpoints e ON m.endpoint_id = e.id
     ${where}
     ORDER BY m.measured_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
}

export async function getMeasurementCount(filters: MeasurementFilters = {}): Promise<number> {
  const { conditions, params } = buildFilterWhere(filters);
  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const row = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM measurements m JOIN endpoints e ON m.endpoint_id = e.id ${where}`,
    params
  );
  return row?.count ?? 0;
}

export async function createMeasurement(input: MeasurementInput): Promise<Measurement> {
  const id = await runInsert(
    `INSERT INTO measurements (endpoint_id, measured_at, latency_ms, packet_loss_percent,
       dns_response_ms, throughput_mbps, measurement_status, failure_reason, measurement_method, is_demo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      input.endpoint_id,
      input.measured_at,
      input.latency_ms ?? null,
      input.packet_loss_percent ?? null,
      input.dns_response_ms ?? null,
      input.throughput_mbps ?? null,
      input.measurement_status ?? 'ok',
      input.failure_reason ?? null,
      input.measurement_method ?? null,
    ]
  );

  return (await queryOne<Measurement>(
    `SELECT m.*, e.participant_id, e.site_label, e.access_medium, e.isp, e.device_connection
     FROM measurements m JOIN endpoints e ON m.endpoint_id = e.id
     WHERE m.id = ?`,
    [id]
  ))!;
}
