import { getDb } from "../../../../../lib/server/db.js";
import { verifyTotp } from "../../../../../lib/server/security.js";
import { getUserId, unauthorized } from "../../../../../lib/server/authHelper.js";

export async function POST(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const code = String(body.code || "");

  const db = getDb();
  const user = db.prepare("SELECT totp_secret FROM users WHERE id = ?").get(userId);

  if (!user || !user.totp_secret) {
    return Response.json({ error: "Nessun setup 2FA in corso" }, { status: 400 });
  }
  if (!verifyTotp(user.totp_secret, code)) {
    return Response.json({ error: "Codice non valido" }, { status: 400 });
  }

  db.prepare("UPDATE users SET totp_enabled = 1 WHERE id = ?").run(userId);
  return Response.json({ ok: true, totpEnabled: true });
}
