export const STEP_GOAL = 7000;
export const MAX_EURO_PER_DAY = 20;
export const MAX_PLAUSIBLE_STEPS = 40000;

export function computeReward(steps) {
  const capped = Math.min(steps, STEP_GOAL);
  return Math.round(MAX_EURO_PER_DAY * (capped / STEP_GOAL) * 100) / 100;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
