import { getDb } from "../../../../lib/server/db.js";
import { getUserId, unauthorized } from "../../../../lib/server/authHelper.js";
import { STEP_GOAL, today } from "../../../../lib/server/rewardsLogic.js";

export async function GET(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();

  const db = getDb();
  const row = db
    .prepare("SELECT steps, wblu_awarded FROM steps_log WHERE user_id = ? AND day = ?")
    .get(userId, today());

  if (!row) {
    return Response.json({ day: today(), steps: 0, stepGoal: STEP_GOAL, wbluAwarded: 0, euroEstimate: 0 });
  }
  return Response.json({
    day: today(),
    steps: row.steps,
    stepGoal: STEP_GOAL,
    wbluAwarded: row.wblu_awarded,
    euroEstimate: row.wblu_awarded,
  });
}
