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
} from "./gameLogic";

import GameGrid from "./ui/components/GameGrid";
import TrashBin from "./ui/components/TrashBin";
import Controls from "./ui/components/Controls";
import OfflinePopup from "./ui/components/OfflinePopup";

const STORAGE_KEY = "merge-game-state-v1";
const LAST_OFFLINE_KEY = "merge-game-last-offline";

export default function App() {
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
      setState((prev: GameState) => ({
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
      setState((prev: GameState) => consumeQueue(spawnFreeItem(prev)));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // ----------------------
  // Auto‑Merge tick
  // ----------------------
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev: GameState) => autoMergeTick(prev));
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

    setState((prev: GameState) => ({
      ...prev,
      offlinePopup: computeOfflineEarnings(prev, now),
    }));

    window.localStorage.removeItem(LAST_OFFLINE_KEY);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

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

  const highestLevel = getHighestLevel(state);

  // ----------------------
  // Drag logic
  // ----------------------
  function handleDrop(from: number, to: number) {
    if (from === to) return;

    if (to === -1) {
      setState((prev: GameState) => deleteItem(prev, from));
      return;
    }

    setState((prev: GameState) => {
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
    setState((prev: GameState) => {
      if (!prev.offlinePopup) return prev;
      return applyOfflineEarnings(prev, prev.offlinePopup);
    });
  }

  function doubleOfflineWithAd() {
    setState((prev: GameState) => {
      if (!prev.offlinePopup) return prev;
      return applyOfflineDouble(prev, prev.offlinePopup);
    });
  }

  const formatCoins = (n: number) => n.toFixed(2);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0d0d0f, #1a1a1f)",
        padding: 20,
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <h1
        style={{
          fontSize: 24,
          fontWeight: "bold",
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        Merge Creatures
      </h1>

      <GameGrid
        state={state}
        dragIndex={dragIndex}
        hoverIndex={hoverIndex}
        mergeFlashIndex={mergeFlashIndex}
        setDragIndex={setDragIndex}
        setHoverIndex={setHoverIndex}
        handleDrop={handleDrop}
        unlockCell={unlockCell}
        setState={setState}
      />

      <TrashBin
        dragIndex={dragIndex}
        trashHover={trashHover}
        setTrashHover={setTrashHover}
        handleDrop={handleDrop}
      />

      <Controls
        state={state}
        highestLevel={highestLevel}
        spawnFreeItem={spawnFreeItem}
        spawnAdItem={spawnAdItem}
        setState={setState}
      />

      <div style={{ marginTop: 20, textAlign: "center" }}>
        <p>💰 Coins: {formatCoins(state.coins)}</p>
        <p>📈 Income/sec: {formatCoins(state.incomePerSecond)}</p>
        <p>🕒 Queue: {state.queue ? `L${state.queue.level}` : "empty"}</p>
        <p>⭐ Highest Level: {highestLevel}</p>
      </div>

      <OfflinePopup
        popup={state.offlinePopup}
        collectOffline={collectOffline}
        doubleOfflineWithAd={doubleOfflineWithAd}
        formatCoins={formatCoins}
      />
    </div>
  );
}
