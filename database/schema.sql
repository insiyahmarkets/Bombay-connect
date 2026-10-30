-- NetCompare Database Schema
-- SQLite

PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS endpoints (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  participant_id       TEXT    NOT NULL UNIQUE,
  site_label           TEXT    NOT NULL,
  access_medium        TEXT    NOT NULL CHECK(access_medium IN ('fiber','mobile','fixed_wireless','other')),
  isp                  TEXT    NOT NULL,
  device_connection    TEXT    NOT NULL CHECK(device_connection IN ('wifi','ethernet','cellular','unknown')),
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
  measurement_status   TEXT    NOT NULL DEFAULT 'ok' CHECK(measurement_status IN ('ok','failed','partial','incomplete')),
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
