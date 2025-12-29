// Facade for all core game logic modules

// grid & state
export {
  initialState,
  spawnFreeItem,
  spawnAdItem,
  spawnItemOfLevel,
  unlockCell,
  consumeQueue,
  deleteItem,
  getHighestLevel,
} from "./core/grid";

// economy
export { calculateIncome, getRawIncomeForLevel } from "./core/economy";

// merge
export { autoMergeTick } from "./core/merge";

// offline
export {
  computeOfflineEarnings,
  applyOfflineEarnings,
  applyOfflineDouble,
} from "./core/offline";

// types
export type { GameState, Cell, QueueItem, OfflinePopup } from "./core/types";

// config
export { levelColors, levelStickers, AUTO_MERGE_PRICE } from "./core/config";
