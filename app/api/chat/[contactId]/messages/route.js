import { getDb } from "../../../../../lib/server/db.js";
import { getUserId, unauthorized } from "../../../../../lib/server/authHelper.js";
import { publish } from "../../../../../lib/server/pubsub.js";

export async function GET(request, { params }) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();

  const { contactId } = params;
  const db = getDb();
  const contact = db.prepare("SELECT id FROM contacts WHERE id = ?").get(contactId);
  if (!contact) return Response.json({ error: "Contatto non trovato" }, { status: 404 });

  const rows = db
    .prepare("SELECT id, sender, text, created_at FROM messages WHERE contact_id = ? ORDER BY id ASC")
    .all(contactId);

  return Response.json(rows.map((r) => ({ id: r.id, from: r.sender, text: r.text, time: r.created_at })));
}

export async function POST(request, { params }) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();

  const { contactId } = params;
  const body = await request.json().catch(() => ({}));
  const text = (body.text || "").trim();

  if (!text) return Response.json({ error: "Messaggio vuoto" }, { status: 400 });
  if (text.length > 4000) return Response.json({ error: "Messaggio troppo lungo" }, { status: 400 });

  const db = getDb();
  const contact = db.prepare("SELECT id FROM contacts WHERE id = ?").get(contactId);
  if (!contact) return Response.json({ error: "Contatto non trovato" }, { status: 404 });

  const result = db
    .prepare("INSERT INTO messages (contact_id, user_id, sender, text) VALUES (?, ?, 'me', ?)")
    .run(contactId, userId, text);

  const row = db
    .prepare("SELECT id, sender, text, created_at FROM messages WHERE id = ?")
    .get(Number(result.lastInsertRowid));

  const payload = { id: row.id, from: row.sender, text: row.text, time: row.created_at };
  publish(contactId, payload);

  return Response.json(payload, { status: 201 });
}
