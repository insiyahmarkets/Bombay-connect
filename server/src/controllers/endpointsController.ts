import { queryAll, queryOne, runInsert, Param } from '../db/database';

export interface Endpoint {
  id: number;
  participant_id: string;
  site_label: string;
  access_medium: string;
  isp: string;
  device_connection: string;
  notes: string | null;
  is_demo: number;
  created_at: string;
}

export interface EndpointInput {
  participant_id: string;
  site_label: string;
  access_medium: string;
  isp: string;
  device_connection: string;
  notes?: string;
}

export async function getAllEndpoints(includeDemo = false): Promise<Endpoint[]> {
  if (includeDemo) {
    return queryAll<Endpoint>('SELECT * FROM endpoints ORDER BY created_at DESC');
  }
  return queryAll<Endpoint>('SELECT * FROM endpoints WHERE is_demo = 0 ORDER BY created_at DESC');
}

export async function getEndpointById(id: number): Promise<Endpoint | undefined> {
  return queryOne<Endpoint>('SELECT * FROM endpoints WHERE id = ?', [id]);
}

export async function getEndpointByParticipantId(participantId: string): Promise<Endpoint | undefined> {
  return queryOne<Endpoint>('SELECT * FROM endpoints WHERE participant_id = ?', [participantId]);
}

export async function createEndpoint(input: EndpointInput): Promise<Endpoint> {
  const id = await runInsert(
    `INSERT INTO endpoints (participant_id, site_label, access_medium, isp, device_connection, notes, is_demo)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [input.participant_id, input.site_label, input.access_medium, input.isp, input.device_connection, input.notes ?? null]
  );
  return (await getEndpointById(id))!;
}
