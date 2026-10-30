import { queryAll, queryOne, Param } from '../db/database';
import { MeasurementFilters, buildFilterWhere } from './measurementsController';

function median(vals: number[]): number | null {
  if (vals.length === 0) return null;
  const sorted = [...vals].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export async function getDashboardSummary(filters: MeasurementFilters) {
  const { conditions, params } = buildFilterWhere(filters);
  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const validWhere = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')} AND m.measurement_status = 'ok'`
    : "WHERE m.measurement_status = 'ok'";
  const failedWhere = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')} AND m.measurement_status != 'ok'`
    : "WHERE m.measurement_status != 'ok'";

  const isDemo = filters.is_demo ?? false;

  const [epRow, medRow, validRow, failedRow, periodRow, latencyRows, plRows, dnsRows, tpRows] = await Promise.all([
    queryOne<{ c: number }>('SELECT COUNT(*) as c FROM endpoints WHERE is_demo = ?', [isDemo ? 1 : 0]),
    queryOne<{ c: number }>('SELECT COUNT(DISTINCT access_medium) as c FROM endpoints WHERE is_demo = ?', [isDemo ? 1 : 0]),
    queryOne<{ c: number }>(`SELECT COUNT(*) as c FROM measurements m JOIN endpoints e ON m.endpoint_id=e.id ${validWhere}`, params),
    queryOne<{ c: number }>(`SELECT COUNT(*) as c FROM measurements m JOIN endpoints e ON m.endpoint_id=e.id ${failedWhere}`, params),
    queryOne<{ period_start: string | null; period_end: string | null }>(
      `SELECT MIN(measured_at) as period_start, MAX(measured_at) as period_end FROM measurements m JOIN endpoints e ON m.endpoint_id=e.id ${where}`,
      params
    ),
    queryAll<{ latency_ms: number }>(`SELECT latency_ms FROM measurements m JOIN endpoints e ON m.endpoint_id=e.id ${validWhere} AND latency_ms IS NOT NULL`, params),
    queryAll<{ packet_loss_percent: number }>(`SELECT packet_loss_percent FROM measurements m JOIN endpoints e ON m.endpoint_id=e.id ${validWhere} AND packet_loss_percent IS NOT NULL`, params),
    queryAll<{ dns_response_ms: number }>(`SELECT dns_response_ms FROM measurements m JOIN endpoints e ON m.endpoint_id=e.id ${validWhere} AND dns_response_ms IS NOT NULL`, params),
    queryAll<{ throughput_mbps: number }>(`SELECT throughput_mbps FROM measurements m JOIN endpoints e ON m.endpoint_id=e.id ${validWhere} AND throughput_mbps IS NOT NULL`, params),
  ]);

  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const round1 = (v: number | null) => v !== null ? Math.round(v * 10) / 10 : null;
  const round2 = (v: number | null) => v !== null ? Math.round(v * 100) / 100 : null;

  const latVals = latencyRows.map(r => r.latency_ms);
  const plVals = plRows.map(r => r.packet_loss_percent);
  const dnsVals = dnsRows.map(r => r.dns_response_ms);
  const tpVals = tpRows.map(r => r.throughput_mbps);

  return {
    pilot: {
      endpoint_count: epRow?.c ?? 0,
      medium_count: medRow?.c ?? 0,
      valid_measurement_count: validRow?.c ?? 0,
      failed_measurement_count: failedRow?.c ?? 0,
      period_start: periodRow?.period_start ?? null,
      period_end: periodRow?.period_end ?? null,
      target_endpoints: 20,
      target_days: 7,
      target_media: 2,
    },
    metrics: {
      latency: { avg: round1(avg(latVals)), median: round1(median(latVals)), count: latVals.length },
      packet_loss: { avg: round2(avg(plVals)), median: round2(median(plVals)), count: plVals.length },
      dns: { avg: round1(avg(dnsVals)), median: round1(median(dnsVals)), count: dnsVals.length },
      throughput: { avg: round1(avg(tpVals)), median: round1(median(tpVals)), count: tpVals.length },
    },
  };
}

export async function getDashboardTrends(filters: MeasurementFilters) {
  const { conditions, params } = buildFilterWhere(filters);
  const validWhere = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')} AND m.measurement_status = 'ok'`
    : "WHERE m.measurement_status = 'ok'";

  const rows = await queryAll<{
    day: string;
    avg_latency: number | null;
    avg_packet_loss: number | null;
    avg_dns: number | null;
    avg_throughput: number | null;
    sample_count: number;
  }>(
    `SELECT
       date(m.measured_at) as day,
       AVG(m.latency_ms) as avg_latency,
       AVG(m.packet_loss_percent) as avg_packet_loss,
       AVG(m.dns_response_ms) as avg_dns,
       AVG(m.throughput_mbps) as avg_throughput,
       COUNT(*) as sample_count
     FROM measurements m JOIN endpoints e ON m.endpoint_id = e.id
     ${validWhere}
     GROUP BY date(m.measured_at)
     ORDER BY day ASC`,
    params
  );

  return rows.map(r => ({
    day: r.day,
    latency: r.avg_latency !== null ? Math.round(r.avg_latency * 10) / 10 : null,
    packet_loss: r.avg_packet_loss !== null ? Math.round(r.avg_packet_loss * 100) / 100 : null,
    dns: r.avg_dns !== null ? Math.round(r.avg_dns * 10) / 10 : null,
    throughput: r.avg_throughput !== null ? Math.round(r.avg_throughput * 10) / 10 : null,
    sample_count: r.sample_count,
  }));
}

export async function getDashboardComparison(filters: MeasurementFilters) {
  const { conditions, params } = buildFilterWhere(filters);
  const validWhere = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')} AND m.measurement_status = 'ok'`
    : "WHERE m.measurement_status = 'ok'";

  interface CompRow {
    access_medium: string;
    isp: string;
    site_label: string;
    device_connection: string;
    valid_tests: number;
    avg_latency: number | null;
    avg_packet_loss: number | null;
    avg_dns: number | null;
    avg_throughput: number | null;
    min_latency: number | null;
    max_latency: number | null;
    min_throughput: number | null;
    max_throughput: number | null;
  }

  const rows = await queryAll<CompRow>(
    `SELECT
       e.access_medium, e.isp, e.site_label, e.device_connection,
       COUNT(*) as valid_tests,
       AVG(m.latency_ms) as avg_latency,
       AVG(m.packet_loss_percent) as avg_packet_loss,
       AVG(m.dns_response_ms) as avg_dns,
       AVG(m.throughput_mbps) as avg_throughput,
       MIN(m.latency_ms) as min_latency,
       MAX(m.latency_ms) as max_latency,
       MIN(m.throughput_mbps) as min_throughput,
       MAX(m.throughput_mbps) as max_throughput
     FROM measurements m JOIN endpoints e ON m.endpoint_id = e.id
     ${validWhere}
     GROUP BY e.access_medium, e.isp, e.site_label, e.device_connection
     ORDER BY avg_latency ASC`,
    params
  );

  const results = await Promise.all(rows.map(async r => {
    const groupParams: Param[] = [...params, r.access_medium, r.isp, r.site_label, r.device_connection];
    const latRows = await queryAll<{ latency_ms: number }>(
      `SELECT m.latency_ms FROM measurements m JOIN endpoints e ON m.endpoint_id=e.id
       ${validWhere} AND m.latency_ms IS NOT NULL
       AND e.access_medium = ? AND e.isp = ? AND e.site_label = ? AND e.device_connection = ?
       ORDER BY m.latency_ms`,
      groupParams
    );
    const latVals = latRows.map(x => x.latency_ms);
    const med = median(latVals);

    return {
      access_medium: r.access_medium,
      isp: r.isp,
      site_label: r.site_label,
      device_connection: r.device_connection,
      valid_tests: r.valid_tests,
      avg_latency: r.avg_latency !== null ? Math.round(r.avg_latency * 10) / 10 : null,
      median_latency: med !== null ? Math.round(med * 10) / 10 : null,
      avg_packet_loss: r.avg_packet_loss !== null ? Math.round(r.avg_packet_loss * 100) / 100 : null,
      avg_dns: r.avg_dns !== null ? Math.round(r.avg_dns * 10) / 10 : null,
      avg_throughput: r.avg_throughput !== null ? Math.round(r.avg_throughput * 10) / 10 : null,
      min_latency: r.min_latency,
      max_latency: r.max_latency,
      min_throughput: r.min_throughput,
      max_throughput: r.max_throughput,
    };
  }));

  return results;
}
