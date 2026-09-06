/**
 * Simple card tracking — sorts weak cards (forgot/dontKnow) to front
 */

export interface CardState {
  known: number;
  forgot: number;
  dontKnow: number;
  reps: number;
}

export function getDefaultState(): CardState {
  return { known: 0, forgot: 0, dontKnow: 0, reps: 0 };
}

export function updateCardState(state: CardState, result: "known" | "forgot" | "dont_know"): CardState {
  return {
    known: state.known + (result === "known" ? 1 : 0),
    forgot: state.forgot + (result === "forgot" ? 1 : 0),
    dontKnow: state.dontKnow + (result === "dont_know" ? 1 : 0),
    reps: state.reps + 1,
  };
}

export function isWeak(state: CardState): boolean {
  return state.reps > 0 && (state.forgot + state.dontKnow) > state.known;
}

export function getCardLevel(state: CardState): "new" | "weak" | "known" {
  if (state.reps === 0) return "new";
  if (isWeak(state)) return "weak";
  return "known";
}
