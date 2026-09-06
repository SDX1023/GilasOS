/**
 * FSRS (Free Spaced Repetition Scheduler) implementation
 * Based on the FSRS-5 algorithm
 */

export interface CardState {
  stability: number;
  difficulty: number;
  due: number; // timestamp
  lastReview: number; // timestamp
  reps: number;
  lapses: number;
}

export const DEFAULT_PARAMS = {
  requestRetention: 0.9,
  maximumInterval: 36500,
  w: [
    0.4072, 0.3366, 0.9099, 0.2513, 0.6892, 0.6501, 0.0696,
    0.0042, 1.5330, 0.0745, 0.3552, 1.3398, 0.3914, 0.3025, 0.0498,
    0.1945, 0.1978, 0.0024, 0.1208, 0.2394, 0.0019, 0.1664, 0.0033,
    0.1847, 0.1664, 0.0019, 0.1208, 0.2394, 0.0019, 0.1664, 0.0033,
  ],
};

export function getDefaultState(): CardState {
  return {
    stability: 0,
    difficulty: 0,
    due: Date.now(),
    lastReview: 0,
    reps: 0,
    lapses: 0,
  };
}

// Initial stability after first review based on difficulty
function initialStability(params: typeof DEFAULT_PARAMS, rating: number): number {
  const w = params.w;
  return Math.max(
    0.1,
    w[rating - 1 + 4] *
      Math.exp(w[rating - 1 + 8] * (0.1 - w[17]))
  );
}

// Difficulty after first review
function initialDifficulty(params: typeof DEFAULT_PARAMS, rating: number): number {
  const w = params.w;
  return Math.min(
    1,
    Math.max(
      0,
      w[2] - (rating - 3) * w[3] + Math.random() * 0.01
    )
  );
}

// Stability after successful review (no lapse)
function nextRecallStability(
  params: typeof DEFAULT_PARAMS,
  state: CardState,
  rating: number
): number {
  const w = params.w;
  const elapsedDays = Math.max(1, (Date.now() - state.lastReview) / 86400000);
  const retrievability = Math.exp(
    Math.log(params.requestRetention) * Math.pow(elapsedDays / state.stability, w[11])
  );
  const newStability =
    state.stability *
    (1 +
      Math.exp(w[12]) *
        (11 - state.difficulty) *
        Math.pow(state.stability, -w[13]) *
        (Math.exp((1 - retrievability) * w[14]) - 1) *
        (rating === 4 ? 1 : w[15] * (rating === 1 ? 1 : 0)));
  return Math.max(0.1, Math.min(newStability, params.maximumInterval));
}

// Stability after lapse
function nextForgetStability(
  params: typeof DEFAULT_PARAMS,
  state: CardState
): number {
  const w = params.w;
  return Math.max(
    0.1,
    w[8] *
      Math.pow(state.difficulty, -w[9]) *
      (Math.pow(state.stability + 1, w[10]) - 1) *
      Math.exp(w[11] * (1 - state.reps / state.stability))
  );
}

// Difficulty after review
function nextDifficulty(
  params: typeof DEFAULT_PARAMS,
  state: CardState,
  rating: number
): number {
  const w = params.w;
  const newDiff =
    state.difficulty -
    w[6] * (rating - 3);
  return Math.min(1, Math.max(0, newDiff));
}

export function scheduleCard(
  state: CardState,
  rating: 1 | 2 | 3 | 4, // 1=Again, 2=Hard, 3=Good, 4=Easy
  params = DEFAULT_PARAMS
): CardState {
  const now = Date.now();
  const isFirstReview = state.reps === 0;

  let newStability: number;
  let newDifficulty: number;
  let newLapses = state.lapses;

  if (isFirstReview) {
    newStability = initialStability(params, rating);
    newDifficulty = initialDifficulty(params, rating);
  } else if (rating <= 2) {
    // Lapse (Again or Hard)
    newStability = nextForgetStability(params, state);
    newDifficulty = nextDifficulty(params, state, rating);
    newLapses = state.lapses + 1;
  } else {
    // Success (Good or Easy)
    newStability = nextRecallStability(params, state, rating);
    newDifficulty = nextDifficulty(params, state, rating);
  }

  // Calculate next review interval
  const retentionRatio = rating <= 2 ? 0.1 : params.requestRetention;
  const intervalDays = Math.max(
    1,
    Math.round(newStability * Math.pow(retentionRatio, -1 / params.w[11]) - 1)
  );

  // Apply easy bonus for Easy rating
  const easyBonus = rating === 4 ? 1.3 : 1.0;
  const finalInterval = Math.min(
    intervalDays * easyBonus,
    params.maximumInterval
  );

  return {
    stability: newStability,
    difficulty: newDifficulty,
    due: now + finalInterval * 86400000,
    lastReview: now,
    reps: state.reps + 1,
    lapses: newLapses,
  };
}

export function isDue(state: CardState): boolean {
  return Date.now() >= state.due;
}

export function daysUntilDue(state: CardState): number {
  return Math.max(0, Math.ceil((state.due - Date.now()) / 86400000));
}

export function getCardProgress(state: CardState): {
  level: "new" | "learning" | "review" | "mature";
  retention: number;
} {
  if (state.reps === 0) return { level: "new", retention: 0 };
  if (state.lapses > 0 && state.reps - state.lapses <= 1) return { level: "learning", retention: 0 };
  if (state.stability >= 21) return { level: "mature", retention: state.stability };
  return { level: "review", retention: state.stability };
}
