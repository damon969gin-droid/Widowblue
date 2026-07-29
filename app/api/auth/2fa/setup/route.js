import { getDb } from "../../../../../lib/server/db.js";
import { generateTotpSecret, totpUri } from "../../../../../lib/server/security.js";
import { getUserId, unauthorized } from "../../../../../lib/server/authHelper.js";

export async function POST(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();

  const db = getDb();
  const secret = generateTotpSecret();
  db.prepare("UPDATE users SET totp_secret = ? WHERE id = ?").run(secret, userId);
  const user = db.prepare("SELECT email FROM users WHERE id = ?").get(userId);

  return Response.json({ secret, otpauthUri: totpUri(secret, user.email) });
}
