import type { GameState } from "./types";
import { calculateIncome } from "./economy";

export function autoMergeTick(state: GameState): GameState {
  if (!state.autoMergeEnabled) return state;

  // Auto-merge expiration
  if (state.autoMergeExpiresAt && Date.now() > state.autoMergeExpiresAt) {
    return {
      ...state,
      autoMergeEnabled: false,
      autoMergeExpiresAt: null,
    };
  }

  let grid = [...state.grid];
  let changed = false;

  while (true) {
    // پیدا کردن همه آیتم‌ها
    const items = grid
      .map((c, i) => ({ cell: c, index: i }))
      .filter((x) => x.cell.type === "item");

    if (items.length < 2) break;

    // گروه‌بندی بر اساس level
    const groups: Record<number, number[]> = {};
    for (const { cell, index } of items) {
      const lvl = (cell as any).level as number;
      if (!groups[lvl]) groups[lvl] = [];
      groups[lvl].push(index);
    }

    // پیدا کردن بالاترین level که حداقل ۲ آیتم دارد
    const mergeableLevels = Object.keys(groups)
      .map(Number)
      .filter((lvl) => groups[lvl].length >= 2)
      .sort((a, b) => b - a); // از بالا به پایین

    if (mergeableLevels.length === 0) break;

    const targetLevel = mergeableLevels[0];
    const [a, b] = groups[targetLevel];

    // merge
    grid[a] = { type: "item", level: targetLevel + 1 };
    grid[b] = { type: "empty" };

    changed = true;
  }

  if (!changed) return state;

  const newState: GameState = {
    ...state,
    grid,
  };

  return {
    ...newState,
    incomePerSecond: calculateIncome(newState),
  };
}
