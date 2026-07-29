import { getDb } from "../../../../lib/server/db.js";
import { getUserId, unauthorized } from "../../../../lib/server/authHelper.js";

export async function GET(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();

  const db = getDb();
  const rows = db.prepare("SELECT id, name, is_group FROM contacts").all();
  return Response.json(rows.map((r) => ({ id: r.id, name: r.name, group: !!r.is_group })));
}
