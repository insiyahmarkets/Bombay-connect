import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

export type Param = string | number | null | boolean | undefined;

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.cwd(), process.env.DB_PATH)
  : path.resolve(process.cwd(), 'netcompare.db');

let db: sqlite3.Database | null = null;

export function getDb(): sqlite3.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/** Run a single SQL statement (write) */
export function runWrite(sql: string, params: Param[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/** Run SQL and return all rows */
export function queryAll<T>(sql: string, params: Param[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve((rows || []) as T[]);
    });
  });
}

/** Run SQL and return first row or undefined */
export async function queryOne<T>(sql: string, params: Param[] = []): Promise<T | undefined> {
  const rows = await queryAll<T>(sql, params);
  return rows[0];
}

/** Run an INSERT and return the last inserted row id */
export function runInsert(sql: string, params: Param[] = []): Promise<number> {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function(this: sqlite3.RunResult, err: Error | null) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

const SCHEMA = `
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS endpoints (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  participant_id       TEXT    NOT NULL UNIQUE,
  site_label           TEXT    NOT NULL,
  access_medium        TEXT    NOT NULL,
  isp                  TEXT    NOT NULL,
  device_connection    TEXT    NOT NULL,
  notes                TEXT,
  is_demo              INTEGER NOT NULL DEFAULT 0,
  created_at           TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE IF NOT EXISTS measurements (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint_id          INTEGER NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
  measured_at          TEXT    NOT NULL,
  latency_ms           REAL,
  packet_loss_percent  REAL,
  dns_response_ms      REAL,
  throughput_mbps      REAL,
  measurement_status   TEXT    NOT NULL DEFAULT 'ok',
  failure_reason       TEXT,
  measurement_method   TEXT,
  is_demo              INTEGER NOT NULL DEFAULT 0,
  created_at           TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_measurements_endpoint_id  ON measurements(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_measurements_measured_at  ON measurements(measured_at);
CREATE INDEX IF NOT EXISTS idx_measurements_status       ON measurements(measurement_status);
CREATE INDEX IF NOT EXISTS idx_measurements_is_demo      ON measurements(is_demo);
CREATE INDEX IF NOT EXISTS idx_endpoints_participant_id  ON endpoints(participant_id);
CREATE INDEX IF NOT EXISTS idx_endpoints_access_medium   ON endpoints(access_medium);
`;

function execSchema(database: sqlite3.Database, schema: string): Promise<void> {
  // Split schema into individual statements and run each
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  return new Promise((resolve, reject) => {
    let i = 0;
    const next = () => {
      if (i >= statements.length) return resolve();
      const stmt = statements[i++];
      database.run(stmt, (err) => {
        if (err && !err.message.includes('already exists')) {
          return reject(new Error(`Schema error on "${stmt.slice(0, 60)}": ${err.message}`));
        }
        next();
      });
    };
    next();
  });
}

export async function initializeDatabase(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // Enable verbose mode in development
  if (process.env.NODE_ENV !== 'production') {
    sqlite3.verbose();
  }

  await execSchema(db!, SCHEMA);
  console.log('✅ Database initialized:', DB_PATH);
}

export function closeDb(): Promise<void> {
  return new Promise((resolve) => {
    if (db) {
      db.close(() => {
        db = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}
