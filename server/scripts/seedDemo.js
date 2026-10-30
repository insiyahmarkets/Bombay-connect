#!/usr/bin/env node
// seedDemo.js - Seeds SYNTHETIC/DEMO data
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.cwd(), process.env.DB_PATH)
  : path.resolve(process.cwd(), 'netcompare.db');
const SEED_PATH = path.resolve(__dirname, '../../database/demo-seed.sql');

const seed = fs.readFileSync(SEED_PATH, 'utf8');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) { console.error('DB open error:', err); process.exit(1); }
  console.log('Seeding DEMO/SYNTHETIC data (is_demo=1)...');
  db.exec(seed, (err) => {
    if (err) { console.error('Seed error:', err); process.exit(1); }
    db.get('SELECT COUNT(*) as c FROM endpoints WHERE is_demo=1', (e, r1) => {
      db.get('SELECT COUNT(*) as c FROM measurements WHERE is_demo=1', (e2, r2) => {
        console.log(`✅ Seeded ${r1?.c} DEMO endpoints and ${r2?.c} DEMO measurements.`);
        console.log('NOTE: Demo data is labelled SYNTHETIC and must not be presented as real measurements.');
        db.close();
      });
    });
  });
});
