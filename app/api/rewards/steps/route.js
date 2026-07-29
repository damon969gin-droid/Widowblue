import { getDb } from "../../../../lib/server/db.js";
import { getUserId, unauthorized } from "../../../../lib/server/authHelper.js";
import { STEP_GOAL, MAX_PLAUSIBLE_STEPS, computeReward, today } from "../../../../lib/server/rewardsLogic.js";

export async function POST(request) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const steps = body.steps;

  if (!Number.isInteger(steps) || steps < 0) {
    return Response.json({ error: "Valore passi non valido" }, { status: 400 });
  }
  if (steps > MAX_PLAUSIBLE_STEPS) {
    return Response.json({ error: "Valore passi non plausibile, segnalato per revisione", flagged: true }, { status: 422 });
  }

  const day = today();
  const reward = computeReward(steps);

  const db = getDb();
  db.prepare(
    `INSERT INTO steps_log (user_id, day, steps, wblu_awarded) VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, day) DO UPDATE SET steps = excluded.steps, wblu_awarded = excluded.wblu_awarded`
  ).run(userId, day, steps, reward);

  return Response.json({ day, steps, stepGoal: STEP_GOAL, wbluAwarded: reward, euroEstimate: reward });
}
