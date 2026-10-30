#!/usr/bin/env node
// resetDb.js - Drops and reinitializes the database (DEV only)
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

if (process.env.NODE_ENV === 'production') {
  console.error('ERROR: resetDb must not run in production!');
  process.exit(1);
}

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.cwd(), process.env.DB_PATH)
  : path.resolve(process.cwd(), 'netcompare.db');
const SCHEMA_PATH = path.resolve(__dirname, '../../database/schema.sql');

if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log(`Deleted: ${DB_PATH}`);
}

const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) { console.error('DB open error:', err); process.exit(1); }
  db.exec(schema, (err) => {
    if (err) { console.error('Schema error:', err); process.exit(1); }
    console.log('✅ Database reset and reinitialized.');
    db.close();
  });
});
