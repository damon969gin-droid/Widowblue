/**
 * Persistenza con node:sqlite — preferibile su Node.js 22+ ma Render usa Node 20.
 * Fallback a better-sqlite3 per garantire compatibilità con Node 20 in fase di build.
 * Questo file espone la stessa API (prepare, exec, run, get) in modo che le route non
 * debbano cambiare.
 */

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
let DatabaseSyncCtor;
let _dbInitError = null;

// Risolviamo le implementazioni in modo sincrono per evitare top-level await
try {
  // Proviamo prima il builtin (Node 22+). Se non disponibile, require solleverà.
  try {
    const mod = require("node:sqlite");
    DatabaseSyncCtor = mod.DatabaseSync;
  } catch (e) {
    // Node builtin non disponibile: proviamo better-sqlite3 (nativo)
    const mod2 = require("better-sqlite3");
    DatabaseSyncCtor = mod2.default || mod2;
  }
} catch (e) {
  // Non abbiamo trovato nessuna implementazione al momento. Salviamo l'errore e lo rilanciamo all'apertura.
  _dbInitError = e;
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

  if (_dbInitError) {
    console.error("[db.js] No sqlite implementation available:", _dbInitError);
    throw new Error("No sqlite implementation available. Check that either node:sqlite (Node 22+) or better-sqlite3 is installed and can be built.");
  }

  try {
    // Funzione helper per tentare apertura e inizializzazione
    function tryOpenAndInit(pathToTry) {
      try {
        const db = new DatabaseSyncCtor(pathToTry);
        db.exec(SCHEMA);
        const insert = db.prepare("INSERT OR IGNORE INTO contacts (id, name, is_group) VALUES (?, ?, ?)");
        for (const [id, name, isGroup] of SEED_CONTACTS) insert.run(id, name, isGroup);
        return db;
      } catch (err) {
        console.error(`[db.js] Failed to open or initialize DB at ${pathToTry}:`, err?.message || err);
        return null;
      }
    }

    // Primo tentativo sul path richiesto
    let db = tryOpenAndInit(dbPath);
    if (db) return db;

    // Se il primo tentativo fallisce e il path non è /tmp, fare fallback su /tmp
    if (!db && !dbPath.startsWith("/tmp")) {
      const fallback = "/tmp/widowblue.db";
      console.warn(`[db.js] Falling back from ${dbPath} to ${fallback}`);
      try {
        const tmpDir = path.dirname(fallback);
        fs.mkdirSync(tmpDir, { recursive: true });
      } catch (e) {
        // ignore
      }
      db = tryOpenAndInit(fallback);
      if (db) return db;
    }

    // Se ancora nulla, rilanciamo l'errore originale per segnalarlo al caller
    throw new Error("Could not open any database file. See previous logs for details.");
  } catch (err) {
    // Rilanciamo per far fallire il caller (es. server start) con un messaggio chiaro
    console.error("[db.js] initFresh failed:", err?.message || err);
    throw err;
  }
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
