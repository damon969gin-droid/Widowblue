import { getDb } from "../../../../lib/server/db.js";
import { verifyPassword, verifyTotp } from "../../../../lib/server/security.js";
import { signToken } from "../../../../lib/server/authHelper.js";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const totpCode = body.totpCode;

  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!user || !verifyPassword(password, user.password_hash)) {
    return Response.json({ error: "Credenziali non valide" }, { status: 401 });
  }

  if (user.totp_enabled) {
    if (!totpCode || !verifyTotp(user.totp_secret, String(totpCode))) {
      return Response.json({ error: "Codice 2FA mancante o non valido", requires2fa: true }, { status: 401 });
    }
  }

  const token = signToken(user.id);
  return Response.json({ token, user: { id: user.id, email: user.email } });
}
