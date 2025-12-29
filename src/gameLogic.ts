// ----------------------
// Types
// ----------------------
export type Cell =
  | { type: "empty" }
  | { type: "item"; level: number }
  | { type: "locked"; price: number };

export type QueueItem = { level: number } | null;

export type OfflinePopup =
  | {
      coins: number;
      canDouble: boolean;
    }
  | null;

export type GameState = {
  grid: Cell[];
  coins: number;              // می‌تواند اعشاری باشد
  incomePerSecond: number;    // اعشاری (همه‌چیز /1000)
  lastUpdatedAt: number;
  queue: QueueItem;

  autoMergeEnabled: boolean;
  autoMergeExpiresAt: number | null;

  offlinePopup: OfflinePopup;
};

// ----------------------
// Config
// ----------------------
export const AUTO_MERGE_PRICE = 50000;

// ----------------------
// Level visual config
// ----------------------
export const levelColors: Record<number, string> = {
  1: "#ffe066",
  2: "#fab666",
  3: "#f68f6a",
  4: "#f06d6d",
  5: "#d65db1",
  6: "#845ec2",
  7: "#4b7bec",
  8: "#2d98da",
  9: "#20bf6b",
  10: "#26de81",
  11: "#1dd1a1",
  12: "#10ac84",
};

export const levelStickers: Record<number, string> = {
  1: "🐣",
  2: "🐥",
  3: "🐤",
  4: "🐇",
  5: "🦊",
  6: "🐱",
  7: "🐯",
  8: "🐺",
  9: "🐲",
  10: "🐉",
  11: "🦄",
  12: "🐘",
};

// ----------------------
// Helpers
// ----------------------
export function getHighestLevel(state: GameState): number {
  const levels = state.grid
    .filter((c) => c.type === "item")
    .map((c) => (c.type === "item" ? c.level : 1));

  if (levels.length === 0) return 1;
  return Math.max(...levels);
}

// درآمد خام برای هر لول (قبل از تقسیم بر 1000)
export function getRawIncomeForLevel(level: number): number {
  return Math.pow(3, level - 1);
}

// incomePerSecond نهایی (بعد از تقسیم بر 1000)
export function calculateIncome(state: GameState): number {
  const raw = state.grid
    .filter((c) => c.type === "item")
    .reduce((sum, c) => sum + getRawIncomeForLevel((c as any).level), 0);

  return raw / 1000; // کل درآمد تقسیم بر 1000
}

// ----------------------
// Initial State (3x4 grid)
// indices:
// 0  1  2
// 3  4  5
// 6  7  8
// 9 10 11  (locked)
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
// Generic spawn
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

// ----------------------
// Spawn Free (dynamic level)
// ----------------------
export function spawnFreeItem(state: GameState): GameState {
  const highest = getHighestLevel(state);
  const level = highest >= 12 ? 2 : 1;
  return spawnItemOfLevel(state, level);
}

// ----------------------
// Spawn Ad (dynamic level)
// ----------------------
export function spawnAdItem(state: GameState): GameState {
  const highest = getHighestLevel(state);
  const level = highest >= 12 ? 4 : 3;
  return spawnItemOfLevel(state, level);
}

// ----------------------
// Unlock (sequential: 9 → 10 → 11)
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
// Consume queue
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
// Delete item (for trash)
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

// ----------------------
// Auto‑Merge: مثل بازیکن که درگ می‌کند
// کارت‌ها لازم نیست کنار هم باشند
// هر تیک فقط یک Merge
// ----------------------
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
    .map((s) => Number(s))
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
