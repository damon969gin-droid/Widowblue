/**
 * Persistenza con node:sqlite — preferibile su Node.js 22+ ma Render usa Node 20.
 * Fallback a better-sqlite3 per garantire compatibilità con Node 20 in fase di build.
 * Questo file espone la stessa API (prepare, exec, run, get) in modo che le route non
 * debbano cambiare.
 */

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

let DatabaseSyncCtor;
try {
  // Proviamo a caricare il builtin di Node 22+ (node:sqlite).
  const mod = await import("node:sqlite");
  DatabaseSyncCtor = mod.DatabaseSync;
} catch (e) {
  // Se non disponibile (es. Node 20), usiamo better-sqlite3 come fallback.
  // better-sqlite3 è un modulo nativo che espone una classe Database compatibile
  // (prepare, exec, close, run, get).
  const mod = await import("better-sqlite3");
  DatabaseSyncCtor = mod.default || mod;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Su Render con Persistent Disk: usa /data/widowblue.db
// Su Render senza Persistent Disk: usa /tmp/widowblue.db (ephemeral ma funzionante)
// Localmente: usa widowblue.db nella root del progetto
function getDbPath() {
  if (process.env.WIDOWBLUE_DB_PATH) {
    return process.env.WIDOWBLUE_DB_PATH;
  }
  // Se siamo su Render (NODE_ENV=production) ma senza percorso custom, usa /tmp
  if (process.env.NODE_ENV === "production") {
    return "/tmp/widowblue.db";
  }
  // Sviluppo locale
  return path.join(__dirname, "..", "..", "widowblue.db");
}

export const DB_PATH = getDbPath();

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
    if (dir && !dir.startsWith(":")) {
      // Evita di creare directory se il path è weird
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {
    // ignoriamo errori di creazione della directory e lasciamo che DatabaseSync fallisca se necessario
    console.warn(`[db.js] Warning: Could not create directory for ${dbPath}:`, e.message);
  }

  const db = new DatabaseSyncCtor(dbPath);
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
