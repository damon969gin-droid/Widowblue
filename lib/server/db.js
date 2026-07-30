/**
 * Persistenza con node:sqlite — nativo di Node.js 22+, nessuna libreria esterna.
 * Stesso schema del backend Python: passare a Postgres in produzione
 * significa cambiare questo file, non la logica delle route.
 */
import { DatabaseSync } from "node:sqlite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Legge il percorso del DB da environment se impostato (utile su Render con Persistent Disk)
export const DB_PATH = process.env.WIDOWBLUE_DB_PATH || path.join(__dirname, "..", "..", "widowblue.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  totp_secret TEXT,
  totp_enabled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_group INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  sender TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS steps_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  day TEXT NOT NULL,
  steps INTEGER NOT NULL,
  wblu_awarded REAL NOT NULL,
  UNIQUE(user_id, day)
);
`;

const SEED_CONTACTS = [
  ["giulia", "Giulia Bianchi", 0],
  ["marco", "Marco - Sviluppo", 0],
  ["nodo-milano", "Nodo Milano Centro", 1],
  ["team", "Widow Blue Team", 1],
];

let _db = null;

export function getDb(customPath) {
  if (customPath) {
    return initFresh(customPath);
  }
  if (_db) return _db;
  _db = initFresh(DB_PATH);
  return _db;
}

function initFresh(dbPath) {
  // Assicuriamoci che la directory del db esista (utile se montiamo /data su hosting)
  try {
    const dir = path.dirname(dbPath);
    if (dir) fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    // ignoriamo errori di creazione della directory e lasciamo che DatabaseSync fallisca se necessario
  }

  const db = new DatabaseSync(dbPath);
  db.exec(SCHEMA);
  const insert = db.prepare("INSERT OR IGNORE INTO contacts (id, name, is_group) VALUES (?, ?, ?)");
  for (const [id, name, isGroup] of SEED_CONTACTS) insert.run(id, name, isGroup);
  return db;
}

export function resetDb(customPath) {
  if (_db) {
    try {
      _db.close();
    } catch {
      // già chiuso o mai aperto, ignorabile
    }
  }
  _db = initFresh(customPath || DB_PATH);
  return _db;
}
