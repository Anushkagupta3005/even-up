const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'db', 'evenup.db');
const SCHEMA_PATH = path.join(__dirname, '..', '..', 'db', 'schema.sql');

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// Apply schema on every boot — CREATE TABLE IF NOT EXISTS is idempotent/safe.
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);

module.exports = db;
