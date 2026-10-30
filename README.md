# NetCompare — Internet Quality Pilot Dashboard

**Project:** Pilot Internet-Quality Comparison by Verified Access Medium  
**Project ID:** A3-PS014-TC466  
**Team:** Bombay Connect  
**Event:** AIORI Hackathon 3  

---

## What Is This?

NetCompare is a full-stack pilot web application that collects, stores, and visualises four Internet-quality metrics from volunteer endpoints across different access media (fiber, mobile/cellular, fixed wireless):

| Metric | Unit | Direction |
|--------|------|-----------|
| Latency | ms | Lower is better |
| Packet Loss | % | Lower is better |
| DNS Response Time | ms | Lower is better |
| Throughput | Mbps | Higher is better |

This is a **controlled pilot study**, not a nationwide ranking system. Results are indicative and depend on measurement conditions.

---

## Project Structure

```
netcompare/
├── server/           Express + TypeScript backend (port 3001)
│   ├── src/
│   │   ├── db/database.ts        SQLite access layer (sqlite3)
│   │   ├── controllers/          Business logic
│   │   ├── routes/               API routes
│   │   ├── middleware/           Error handling
│   │   └── index.ts              Entry point
│   ├── scripts/
│   │   ├── initDb.js             Initialize schema
│   │   ├── seedDemo.js           Load SYNTHETIC demo data
│   │   ├── resetDb.js            Wipe and reinitialize (DEV only)
│   │   └── testApi.js            API smoke tests
│   ├── dist/                     Compiled JS (after npm run build)
│   ├── netcompare.db             SQLite database file
│   ├── .env                      Your config (copy from .env.example)
│   └── package.json
├── client/           React + Vite + TypeScript frontend (port 5173)
│   ├── src/
│   │   ├── api/index.ts          API client
│   │   ├── components/           All UI components
│   │   ├── hooks/useDashboard.ts Data fetching hook
│   │   ├── types/index.ts        Shared TypeScript types
│   │   ├── App.tsx               Root component
│   │   └── main.tsx              Entry point
│   └── package.json
├── agent/            Volunteer measurement agent (Node.js)
│   ├── src/agent.js              The measurement script
│   ├── .env.example              Agent configuration template
│   └── package.json
├── database/
│   ├── schema.sql                SQLite schema (used by initDb)
│   └── demo-seed.sql             SYNTHETIC demo data (is_demo=1)
├── .env.example                  Server config template
└── README.md                     This file
```

---

## 1. Prerequisites

- **Node.js ≥ 18** (tested on v24.18.0)
- **npm** (comes with Node.js)
- Windows, macOS, or Linux
- No external services required for local development

---

## 2. Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install

# Agent (optional, for real measurements)
cd ../agent
npm install
```

---

## 3. Configure Environment Variables

```bash
# Copy the example config
cp .env.example server/.env
```

Edit `server/.env`:

```
PORT=3001
NODE_ENV=development
DB_PATH=./netcompare.db
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

**Never commit real secrets.** The `.env` file is not tracked by git.

---

## 4. Initialize the Database

```bash
cd server
node scripts/initDb.js
```

This creates `server/netcompare.db` with the schema.

---

## 5. Load Demo Data (Optional)

```bash
cd server
node scripts/seedDemo.js
```

This loads **8 SYNTHETIC endpoints** and **224 SYNTHETIC measurements** (all labelled `is_demo=1`).

Demo data is clearly marked in the UI and must not be presented as real measurements.

To remove demo data and start fresh:

```bash
node scripts/resetDb.js   # DEV only — deletes and reinitializes the DB
```

---

## 6. Start the Backend

### Option A: Compiled (recommended)
```bash
cd server
npm run build
npm start
```

### Option B: Development (ts-node)
```bash
cd server
npm run dev
```

Backend runs on **http://localhost:3001**

---

## 7. Start the Frontend

```bash
cd client
npm run dev
```

Dashboard opens at **http://localhost:5173**

The Vite dev server proxies `/api` requests to `http://localhost:3001` automatically.

---

## 8. Register a Test Endpoint

**Via the dashboard UI:**
1. Open http://localhost:5173
2. Scroll to "Register Measurement Endpoint"
3. Click "▼ Open"
4. Fill in the form (use an anonymous ID like `P001`)
5. Submit

**Via the API:**
```bash
curl -X POST http://localhost:3001/api/endpoints \
  -H "Content-Type: application/json" \
  -d '{
    "participant_id": "P001",
    "site_label": "Mumbai Central",
    "access_medium": "fiber",
    "isp": "JioFiber",
    "device_connection": "ethernet",
    "notes": "Test endpoint"
  }'
```

---

## 9. Run the Measurement Agent

The agent measures latency, packet loss, DNS response time, and throughput from a volunteer's device.

```bash
cd agent
cp .env.example .env
# Edit .env: set ENDPOINT_ID to your registered participant_id
node src/agent.js --once     # Run a single measurement
node src/agent.js            # Run continuously (every 5 minutes by default)
```

**Important:** The agent must be running on the **volunteer's actual device** for measurements to reflect their real Internet connection. Server-side measurements do not represent volunteer connectivity.

### Scheduled measurements (7-day pilot)

**Windows Task Scheduler:**
```
Action: node C:\path\to\netcompare\agent\src\agent.js --once
Trigger: Daily, repeat every 30 minutes for 7 days
```

**Linux/macOS cron (every 30 min):**
```cron
*/30 * * * * cd /path/to/agent && node src/agent.js --once >> /var/log/netcompare-agent.log 2>&1
```

---

## 10. Test the API

```bash
cd server
node scripts/testApi.js
```

Expected: **24 tests pass, 0 fail**

Manual tests:

```bash
# Health check
curl http://localhost:3001/api/health

# List real endpoints
curl http://localhost:3001/api/endpoints

# List demo endpoints
curl "http://localhost:3001/api/endpoints?demo=true"

# Dashboard summary (real data)
curl http://localhost:3001/api/dashboard/summary

# Dashboard summary (demo data)
curl "http://localhost:3001/api/dashboard/summary?demo=true"

# 7-day trends (demo)
curl "http://localhost:3001/api/dashboard/trends?demo=true"

# Comparison (demo)
curl "http://localhost:3001/api/dashboard/comparison?demo=true"

# Measurements with filters
curl "http://localhost:3001/api/measurements?medium=fiber&limit=5"
```

---

## 11. Distinguish Demo from Real Data

| Feature | Demo Data | Real Data |
|---------|-----------|-----------|
| Database flag | `is_demo = 1` | `is_demo = 0` |
| Dashboard toggle | "Showing Demo Data" (amber) | Default |
| API query param | `?demo=true` | `?demo=false` or omitted |
| Measurement history | (D) suffix on endpoint ID | No suffix |
| Banner | Yellow warning banner | None |

**Demo data is never mixed silently with real data.** The `is_demo` column is set at insertion and is never changed.

---

## 12. API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Backend health check |
| GET | `/api/endpoints` | List endpoints |
| POST | `/api/endpoints` | Register new endpoint |
| GET | `/api/measurements` | List measurements (filterable) |
| POST | `/api/measurements` | Submit a measurement |
| GET | `/api/dashboard/summary` | Summary stats + pilot status |
| GET | `/api/dashboard/trends` | Daily trend data |
| GET | `/api/dashboard/comparison` | Group comparison table |

All endpoints support query params: `medium`, `isp`, `site`, `device_connection`, `date_from`, `date_to`, `demo`.

---

## 13. Current Limitations

### Measurement method limitations
- **Latency** is measured via HTTP round-trip (not ICMP ping). Results may differ from true ping.
- **Packet loss** is estimated from HTTP probe failures. Firewalls, NAT, and server load affect this.
- **DNS response time** uses Node.js `dns.resolve()`. OS-level caching may return cached results.
- **Throughput** measures the HTTP download speed to the configured server. It does not measure raw link speed.

### Pilot scope
- This is a pilot with 10–20 volunteer endpoints, not a population-level study.
- Comparisons between connection types are not controlled experiments — location, time, and device differ.
- Seven days of scheduled measurements requires each volunteer to run the agent continuously.

### What needs real-world validation
- [ ] Real volunteer devices must install and run the agent script
- [ ] A publicly accessible measurement server is needed for deployed use
- [ ] HTTPS must be used for data submission in production (`NETCOMPARE_BACKEND=https://...`)
- [ ] The measurement agent's results should be verified against known-good tools (e.g., iperf3, dig)
- [ ] Agent throughput measurement needs a dedicated download endpoint for accuracy

### Privacy
- No personal information is collected.
- Only anonymous participant IDs, timestamps, and network metrics are stored.
- The measurement agent does not capture browsing history or device identifiers.

---

## 14. Development Commands

```bash
# Server
npm run build          # Compile TypeScript to dist/
npm start              # Run compiled server
npm run dev            # ts-node (development)
npm run db:init        # Initialize schema
npm run db:seed        # Load demo data
npm run db:reset       # Reset DB (DEV only)
npm test               # Run API smoke tests

# Client
npm run dev            # Vite dev server
npm run build          # Production build
npm run preview        # Preview production build
```

---

*NetCompare is a pilot research tool. Results should be interpreted in context and not used for commercial ISP comparisons without appropriate statistical controls.*
