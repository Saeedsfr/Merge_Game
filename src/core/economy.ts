import type { GameState } from "./types";

// درآمد خام هر لول (قبل از تقسیم بر 1000)
export function getRawIncomeForLevel(level: number): number {
  return Math.pow(3, level - 1);
}

// incomePerSecond نهایی (بعد از تقسیم بر 1000)
export function calculateIncome(state: GameState): number {
  const raw = state.grid
    .filter((c) => c.type === "item")
    .reduce((sum, c) => sum + getRawIncomeForLevel((c as any).level), 0);

  return raw / 1000;
}
