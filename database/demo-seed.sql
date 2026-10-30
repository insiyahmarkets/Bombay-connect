-- NetCompare Demo Seed Data
-- ALL records in this file are SYNTHETIC/DEMO data.
-- is_demo = 1 marks them as demo in the database.
-- This data is used only for dashboard demonstration before real measurements are collected.

-- Demo Endpoints
INSERT OR IGNORE INTO endpoints (participant_id, site_label, access_medium, isp, device_connection, notes, is_demo)
VALUES
  ('P001','Mumbai Central','fiber','JioFiber','ethernet','Demo endpoint - fiber at office',1),
  ('P002','Andheri West','fiber','ACT Fibernet','wifi','Demo endpoint - fiber home user',1),
  ('P003','Bandra East','mobile','Airtel','cellular','Demo endpoint - 4G mobile user',1),
  ('P004','Thane','mobile','Jio','cellular','Demo endpoint - 4G mobile user',1),
  ('P005','Navi Mumbai','fixed_wireless','Hathway','wifi','Demo endpoint - fixed wireless',1),
  ('P006','Powai','fiber','JioFiber','ethernet','Demo endpoint - fiber lab',1),
  ('P007','Dadar','mobile','Vi','cellular','Demo endpoint - 4G mobile',1),
  ('P008','Kurla','fixed_wireless','YOU Broadband','wifi','Demo endpoint - fixed wireless',1);

-- Helper: generate demo measurements for 7 days
-- Day offsets: -6 days to today (2026-10-27)
-- P001 - Fiber/JioFiber/Ethernet (good performance)
INSERT INTO measurements (endpoint_id, measured_at, latency_ms, packet_loss_percent, dns_response_ms, throughput_mbps, measurement_status, measurement_method, is_demo)
SELECT e.id,
  datetime('2026-10-21T08:00:00Z', '+' || (n.d * 3600 * 6) || ' seconds'),
  6 + (abs(random()) % 8),
  round((abs(random() % 100)) / 100.0, 2),
  12 + (abs(random()) % 10),
  85 + (abs(random()) % 30),
  'ok', 'demo-synthetic', 1
FROM endpoints e, (SELECT 0 d UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 UNION SELECT 27) n
WHERE e.participant_id = 'P001' AND e.is_demo = 1;

-- P002 - Fiber/ACT/WiFi (slightly worse due to WiFi overhead)
INSERT INTO measurements (endpoint_id, measured_at, latency_ms, packet_loss_percent, dns_response_ms, throughput_mbps, measurement_status, measurement_method, is_demo)
SELECT e.id,
  datetime('2026-10-21T09:00:00Z', '+' || (n.d * 3600 * 6) || ' seconds'),
  10 + (abs(random()) % 12),
  round((abs(random() % 150)) / 100.0, 2),
  18 + (abs(random()) % 14),
  65 + (abs(random()) % 25),
  'ok', 'demo-synthetic', 1
FROM endpoints e, (SELECT 0 d UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 UNION SELECT 27) n
WHERE e.participant_id = 'P002' AND e.is_demo = 1;

-- P003 - Mobile/Airtel/Cellular (higher latency)
INSERT INTO measurements (endpoint_id, measured_at, latency_ms, packet_loss_percent, dns_response_ms, throughput_mbps, measurement_status, measurement_method, is_demo)
SELECT e.id,
  datetime('2026-10-21T10:00:00Z', '+' || (n.d * 3600 * 6) || ' seconds'),
  35 + (abs(random()) % 40),
  round((abs(random() % 400)) / 100.0, 2),
  45 + (abs(random()) % 30),
  18 + (abs(random()) % 15),
  'ok', 'demo-synthetic', 1
FROM endpoints e, (SELECT 0 d UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 UNION SELECT 27) n
WHERE e.participant_id = 'P003' AND e.is_demo = 1;

-- P004 - Mobile/Jio/Cellular
INSERT INTO measurements (endpoint_id, measured_at, latency_ms, packet_loss_percent, dns_response_ms, throughput_mbps, measurement_status, measurement_method, is_demo)
SELECT e.id,
  datetime('2026-10-21T11:00:00Z', '+' || (n.d * 3600 * 6) || ' seconds'),
  30 + (abs(random()) % 35),
  round((abs(random() % 350)) / 100.0, 2),
  40 + (abs(random()) % 25),
  22 + (abs(random()) % 18),
  'ok', 'demo-synthetic', 1
FROM endpoints e, (SELECT 0 d UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 UNION SELECT 27) n
WHERE e.participant_id = 'P004' AND e.is_demo = 1;

-- P005 - Fixed Wireless/Hathway/WiFi
INSERT INTO measurements (endpoint_id, measured_at, latency_ms, packet_loss_percent, dns_response_ms, throughput_mbps, measurement_status, measurement_method, is_demo)
SELECT e.id,
  datetime('2026-10-21T07:30:00Z', '+' || (n.d * 3600 * 6) || ' seconds'),
  20 + (abs(random()) % 25),
  round((abs(random() % 250)) / 100.0, 2),
  28 + (abs(random()) % 20),
  35 + (abs(random()) % 20),
  'ok', 'demo-synthetic', 1
FROM endpoints e, (SELECT 0 d UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 UNION SELECT 27) n
WHERE e.participant_id = 'P005' AND e.is_demo = 1;

-- P006 - Fiber/JioFiber/Ethernet
INSERT INTO measurements (endpoint_id, measured_at, latency_ms, packet_loss_percent, dns_response_ms, throughput_mbps, measurement_status, measurement_method, is_demo)
SELECT e.id,
  datetime('2026-10-21T08:30:00Z', '+' || (n.d * 3600 * 6) || ' seconds'),
  5 + (abs(random()) % 7),
  round((abs(random() % 80)) / 100.0, 2),
  11 + (abs(random()) % 8),
  90 + (abs(random()) % 40),
  'ok', 'demo-synthetic', 1
FROM endpoints e, (SELECT 0 d UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 UNION SELECT 27) n
WHERE e.participant_id = 'P006' AND e.is_demo = 1;

-- P007 - Mobile/Vi/Cellular (some failures)
INSERT INTO measurements (endpoint_id, measured_at, latency_ms, packet_loss_percent, dns_response_ms, throughput_mbps, measurement_status, measurement_method, is_demo)
SELECT e.id,
  datetime('2026-10-21T12:00:00Z', '+' || (n.d * 3600 * 6) || ' seconds'),
  CASE WHEN n.d % 7 = 3 THEN NULL ELSE 45 + (abs(random()) % 50) END,
  CASE WHEN n.d % 7 = 3 THEN NULL ELSE round((abs(random() % 600)) / 100.0, 2) END,
  CASE WHEN n.d % 7 = 3 THEN NULL ELSE 55 + (abs(random()) % 40) END,
  CASE WHEN n.d % 7 = 3 THEN NULL ELSE 12 + (abs(random()) % 10) END,
  CASE WHEN n.d % 7 = 3 THEN 'failed' ELSE 'ok' END,
  'demo-synthetic', 1
FROM endpoints e, (SELECT 0 d UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 UNION SELECT 27) n
WHERE e.participant_id = 'P007' AND e.is_demo = 1;

-- P008 - Fixed Wireless/YOU Broadband/WiFi
INSERT INTO measurements (endpoint_id, measured_at, latency_ms, packet_loss_percent, dns_response_ms, throughput_mbps, measurement_status, measurement_method, is_demo)
SELECT e.id,
  datetime('2026-10-21T13:00:00Z', '+' || (n.d * 3600 * 6) || ' seconds'),
  22 + (abs(random()) % 20),
  round((abs(random() % 200)) / 100.0, 2),
  30 + (abs(random()) % 18),
  30 + (abs(random()) % 15),
  'ok', 'demo-synthetic', 1
FROM endpoints e, (SELECT 0 d UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 UNION SELECT 27) n
WHERE e.participant_id = 'P008' AND e.is_demo = 1;
