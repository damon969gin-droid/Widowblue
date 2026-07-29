import { getDb } from "../../../../lib/server/db.js";
import { hashPassword } from "../../../../lib/server/security.js";
import { signToken } from "../../../../lib/server/authHelper.js";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const phone = (body.phone || "").trim();

  if (!email || !email.includes("@")) {
    return Response.json({ error: "Email non valida" }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "La password deve avere almeno 8 caratteri" }, { status: 400 });
  }
  if (!phone) {
    return Response.json({ error: "Numero di telefono obbligatorio" }, { status: 400 });
  }

  const db = getDb();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return Response.json({ error: "Email già registrata" }, { status: 409 });
  }

  const passwordHash = hashPassword(password);
  const result = db
    .prepare("INSERT INTO users (email, phone, password_hash) VALUES (?, ?, ?)")
    .run(email, phone, passwordHash);
  const userId = Number(result.lastInsertRowid);
  const token = signToken(userId);

  return Response.json({ token, user: { id: userId, email } }, { status: 201 });
}
