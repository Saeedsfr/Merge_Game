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
  coins: number;
  incomePerSecond: number;
  lastUpdatedAt: number;
  queue: QueueItem;
  autoMergeEnabled: boolean;
  autoMergeExpiresAt: number | null;
  offlinePopup: OfflinePopup;
};
