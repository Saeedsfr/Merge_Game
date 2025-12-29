import type { GameState } from "./types";
import { calculateIncome } from "./economy";

// ----------------------
// Initial State
// ----------------------
export const initialState: GameState = {
  grid: [
    { type: "empty" }, { type: "empty" }, { type: "empty" },
    { type: "empty" }, { type: "empty" }, { type: "empty" },
    { type: "empty" }, { type: "empty" }, { type: "empty" },

    { type: "locked", price: 5000 },
    { type: "locked", price: 15000 },
    { type: "locked", price: 30000 },
  ],
  coins: 0,
  incomePerSecond: 0,
  lastUpdatedAt: Date.now(),
  queue: null,
  autoMergeEnabled: false,
  autoMergeExpiresAt: null,
  offlinePopup: null,
};

// ----------------------
// Spawn
// ----------------------
export function spawnItemOfLevel(state: GameState, level: number): GameState {
  const emptyIndex = state.grid.findIndex((c) => c.type === "empty");

  if (emptyIndex !== -1) {
    const newGrid = [...state.grid];
    newGrid[emptyIndex] = { type: "item", level };
    const tempState: GameState = { ...state, grid: newGrid };
    return {
      ...tempState,
      incomePerSecond: calculateIncome(tempState),
    };
  }

  if (state.queue === null) {
    return { ...state, queue: { level } };
  }

  return state;
}

export function spawnFreeItem(state: GameState): GameState {
  const highest = getHighestLevel(state);
  const level = highest >= 12 ? 2 : 1;
  return spawnItemOfLevel(state, level);
}

export function spawnAdItem(state: GameState): GameState {
  const highest = getHighestLevel(state);
  const level = highest >= 12 ? 4 : 3;
  return spawnItemOfLevel(state, level);
}

// ----------------------
// Highest level
// ----------------------
export function getHighestLevel(state: GameState): number {
  const levels = state.grid
    .filter((c) => c.type === "item")
    .map((c) => (c.type === "item" ? c.level : 1));

  if (levels.length === 0) return 1;
  return Math.max(...levels);
}

// ----------------------
// Unlock
// ----------------------
export function unlockCell(state: GameState, index: number): GameState {
  const cell = state.grid[index];
  if (cell.type !== "locked") return state;
  if (state.coins < cell.price) return state;

  if (index === 10 && state.grid[9].type === "locked") return state;
  if (index === 11 && state.grid[10].type === "locked") return state;

  const newGrid = [...state.grid];
  newGrid[index] = { type: "empty" };

  const tempState: GameState = {
    ...state,
    grid: newGrid,
    coins: state.coins - cell.price,
  };
  return {
    ...tempState,
    incomePerSecond: calculateIncome(tempState),
  };
}

// ----------------------
// Queue
// ----------------------
export function consumeQueue(state: GameState): GameState {
  if (state.queue === null) return state;

  const emptyIndex = state.grid.findIndex((c) => c.type === "empty");
  if (emptyIndex === -1) return state;

  const newGrid = [...state.grid];
  newGrid[emptyIndex] = { type: "item", level: state.queue.level };

  const tempState: GameState = { ...state, grid: newGrid, queue: null };
  return {
    ...tempState,
    incomePerSecond: calculateIncome(tempState),
  };
}

// ----------------------
// Delete item
// ----------------------
export function deleteItem(state: GameState, index: number): GameState {
  const cell = state.grid[index];
  if (cell.type !== "item") return state;

  const newGrid = [...state.grid];
  newGrid[index] = { type: "empty" };

  const tempState: GameState = { ...state, grid: newGrid };
  return {
    ...tempState,
    incomePerSecond: calculateIncome(tempState),
  };
}
