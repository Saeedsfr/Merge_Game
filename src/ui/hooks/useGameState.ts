import { useState, useEffect } from "react";

import {
  initialState,
  spawnFreeItem,
  spawnAdItem,
  calculateIncome,
  unlockCell,
  consumeQueue,
  deleteItem,
  autoMergeTick,
  getHighestLevel,
  computeOfflineEarnings,
  applyOfflineEarnings,
  applyOfflineDouble,
  type GameState,
} from "../../gameLogic";

const STORAGE_KEY = "merge-game-state-v1";
const LAST_OFFLINE_KEY = "merge-game-last-offline";

export function useGameState() {
  // ----------------------
  // Main game state
  // ----------------------
  const [state, setState] = useState<GameState>(() => {
    if (typeof window === "undefined") return initialState;

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return initialState;

      const parsed = JSON.parse(saved) as GameState;
      return {
        ...parsed,
        incomePerSecond: calculateIncome(parsed),
        lastUpdatedAt: Date.now(),
        offlinePopup: null,
      };
    } catch {
      return initialState;
    }
  });

  // ----------------------
  // UI state
  // ----------------------
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mergeFlashIndex, setMergeFlashIndex] = useState<number | null>(null);
  const [trashHover, setTrashHover] = useState<boolean>(false);

  // ----------------------
  // Save state
  // ----------------------
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  // ----------------------
  // Idle income
  // ----------------------
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        coins: prev.coins + prev.incomePerSecond,
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ----------------------
  // Free generator
  // ----------------------
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => consumeQueue(spawnFreeItem(prev)));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // ----------------------
  // Auto‑Merge tick
  // ----------------------
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => autoMergeTick(prev));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ----------------------
  // Offline handling
  // ----------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const lastOfflineStr = window.localStorage.getItem(LAST_OFFLINE_KEY);
    if (!lastOfflineStr) return;

    const lastOfflineAt = Number(lastOfflineStr);
    if (!lastOfflineAt || Number.isNaN(lastOfflineAt)) return;

    const now = Date.now();

    setState((prev) => ({
      ...prev,
      offlinePopup: computeOfflineEarnings(prev, now),
    }));

    window.localStorage.removeItem(LAST_OFFLINE_KEY);
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        window.localStorage.setItem(LAST_OFFLINE_KEY, String(Date.now()));
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      window.localStorage.setItem(LAST_OFFLINE_KEY, String(Date.now()));
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () =>
      window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // ----------------------
  // Drag logic
  // ----------------------
  function handleDrop(from: number, to: number) {
    if (from === to) return;

    if (to === -1) {
      setState((prev) => deleteItem(prev, from));
      return;
    }

    setState((prev) => {
      const fromCell = prev.grid[from];
      const toCell = prev.grid[to];

      if (!fromCell || fromCell.type !== "item") return prev;
      if (!toCell || toCell.type === "locked") return prev;

      const newGrid = [...prev.grid];
      let didMerge = false;

      if (toCell.type === "empty") {
        newGrid[to] = fromCell;
        newGrid[from] = { type: "empty" };
      } else if (toCell.type === "item" && toCell.level === fromCell.level) {
        newGrid[to] = { type: "item", level: toCell.level + 1 };
        newGrid[from] = { type: "empty" };
        didMerge = true;
      } else {
        newGrid[to] = fromCell;
        newGrid[from] = toCell;
      }

      const tempState: GameState = {
        ...prev,
        grid: newGrid,
        incomePerSecond: calculateIncome({ ...prev, grid: newGrid }),
      };

      if (didMerge) {
        setMergeFlashIndex(to);
        setTimeout(() => setMergeFlashIndex(null), 250);
      }

      return consumeQueue(tempState);
    });
  }

  // ----------------------
  // Offline popup handlers
  // ----------------------
  function collectOffline() {
    setState((prev) => {
      if (!prev.offlinePopup) return prev;
      return applyOfflineEarnings(prev, prev.offlinePopup);
    });
  }

  function doubleOfflineWithAd() {
    setState((prev) => {
      if (!prev.offlinePopup) return prev;
      return applyOfflineDouble(prev, prev.offlinePopup);
    });
  }

  const highestLevel = getHighestLevel(state);
  const formatCoins = (n: number) => n.toFixed(2);

  return {
    state,
    setState,

    dragIndex,
    hoverIndex,
    mergeFlashIndex,
    trashHover,

    setDragIndex,
    setHoverIndex,
    setMergeFlashIndex,
    setTrashHover,

    handleDrop,
    collectOffline,
    doubleOfflineWithAd,

    highestLevel,
    formatCoins,

    spawnFreeItem,
    spawnAdItem,
    unlockCell,
  };
}
