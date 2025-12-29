import type { GameState } from "./types";
import { calculateIncome } from "./economy";

export function autoMergeTick(state: GameState): GameState {
  if (!state.autoMergeEnabled) return state;

  if (state.autoMergeExpiresAt && Date.now() > state.autoMergeExpiresAt) {
    return {
      ...state,
      autoMergeEnabled: false,
      autoMergeExpiresAt: null,
    };
  }

  const grid = [...state.grid];

  const items = grid
    .map((c, i) => ({ cell: c, index: i }))
    .filter((x) => x.cell.type === "item");

  if (items.length < 2) return state;

  const groups: Record<number, number[]> = {};
  for (const { cell, index } of items) {
    const lvl = (cell as any).level as number;
    if (!groups[lvl]) groups[lvl] = [];
    groups[lvl].push(index);
  }

  let targetLevel: number | null = null;
  const levels = Object.keys(groups)
    .map(Number)
    .sort((a, b) => a - b);

  for (const lvl of levels) {
    if (groups[lvl].length >= 2) {
      targetLevel = lvl;
      break;
    }
  }

  if (targetLevel === null) return state;

  const [a, b] = groups[targetLevel];

  grid[a] = { type: "item", level: targetLevel + 1 };
  grid[b] = { type: "empty" };

  const tempState: GameState = { ...state, grid };
  return {
    ...tempState,
    incomePerSecond: calculateIncome(tempState),
  };
}
