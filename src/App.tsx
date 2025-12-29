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
  levelColors,
  levelStickers,
  getHighestLevel,
  AUTO_MERGE_PRICE,
  type GameState,
  type Cell,
} from "./gameLogic";

const STORAGE_KEY = "merge-game-state-v1";
const LAST_OFFLINE_KEY = "merge-game-last-offline";

const MAX_OFFLINE_MS = 30 * 60 * 1000; // 30 دقیقه
const DOUBLE_THRESHOLD_MS = 6 * 60 * 60 * 1000; // 6 ساعت

function App() {
  const [state, setState] = useState<GameState>(() => {
    if (typeof window === "undefined") return initialState;

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return initialState;

      const parsed = JSON.parse(saved) as GameState;
      const tempState: GameState = {
        ...parsed,
        incomePerSecond: calculateIncome(parsed),
        lastUpdatedAt: Date.now(),
        offlinePopup: null,
      };
      return tempState;
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
    } catch {
      // ignore
    }
  }, [state]);

  // ----------------------
  // Idle income (1/sec) – incomePerSecond خودش /1000 شده
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
  // Free generator every 10s
  // ----------------------
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => consumeQueue(spawnFreeItem(prev)));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // ----------------------
  // Auto‑Merge tick every 1s
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

  // هنگام mount: محاسبه درآمد آفلاین اگر lastOfflineAt وجود داشته باشد
  useEffect(() => {
    if (typeof window === "undefined") return;

    const lastOfflineStr = window.localStorage.getItem(LAST_OFFLINE_KEY);
    if (!lastOfflineStr) return;

    const lastOfflineAt = Number(lastOfflineStr);
    if (!lastOfflineAt || Number.isNaN(lastOfflineAt)) return;

    const now = Date.now();
    const offlineMs = now - lastOfflineAt;
    if (offlineMs <= 0) return;

    const effective = Math.min(offlineMs, MAX_OFFLINE_MS);

    setState((prev) => {
      const coinsGained = prev.incomePerSecond * (effective / 1000); // incomePerSecond already /1000
      if (coinsGained <= 0) {
        return { ...prev, offlinePopup: null };
      }

      const canDouble = offlineMs >= DOUBLE_THRESHOLD_MS;

      return {
        ...prev,
        offlinePopup: {
          coins: coinsGained,
          canDouble,
        },
      };
    });

    // یک بار مصرف
    window.localStorage.removeItem(LAST_OFFLINE_KEY);
  }, []);

  // ثبت زمان آفلاین وقتی تب مخفی می‌شود
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibility = () => {
      if (document.hidden) {
        try {
          window.localStorage.setItem(LAST_OFFLINE_KEY, String(Date.now()));
        } catch {
          // ignore
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // احتیاط: قبل از unload هم ثبت کنیم
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeUnload = () => {
      try {
        window.localStorage.setItem(LAST_OFFLINE_KEY, String(Date.now()));
      } catch {
        // ignore
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const highestLevel = getHighestLevel(state);

  // ----------------------
  // Drag logic (manual)
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
      } else if (toCell.type === "item") {
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

  function isUnlockAllowed(index: number, grid: Cell[]): boolean {
    if (index === 9) return true;
    if (index === 10) return grid[9].type !== "locked";
    if (index === 11) return grid[10].type !== "locked";
    return false;
  }

  // ----------------------
  // Offline popup handlers
  // ----------------------
  function collectOffline() {
    setState((prev) => {
      if (!prev.offlinePopup) return prev;
      return {
        ...prev,
        coins: prev.coins + prev.offlinePopup.coins,
        offlinePopup: null,
      };
    });
  }

  function doubleOfflineWithAd() {
    // اینجا جای اتصال به SDK تبلیغ است
    setState((prev) => {
      if (!prev.offlinePopup) return prev;
      if (!prev.offlinePopup.canDouble) {
        return {
          ...prev,
          coins: prev.coins + prev.offlinePopup.coins,
          offlinePopup: null,
        };
      }
      return {
        ...prev,
        coins: prev.coins + prev.offlinePopup.coins * 2,
        offlinePopup: null,
      };
    });
  }

  // نمایش اعشاری با دو رقم
  const formatCoins = (n: number) => n.toFixed(2);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0d0d0f, #1a1a1f)",
        padding: 20,
        color: "white",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: 24,
          fontWeight: "bold",
          marginBottom: 20,
          textAlign: "center",
          letterSpacing: 1,
        }}
      >
        Merge Creatures
      </div>

      {/* Grid Container */}
      <div
        style={{
          padding: 16,
          borderRadius: 16,
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 0 20px rgba(0,0,0,0.4)",
          width: "fit-content",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 80px)",
            gap: 10,
          }}
        >
          {state.grid.map((cell: Cell, index: number) => {
            if (cell.type === "locked") {
              const sequentialAllowed = isUnlockAllowed(index, state.grid);
              const canPay = state.coins >= cell.price;
              const canUnlock = sequentialAllowed && canPay;

              return (
                <div
                  key={index}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    color: "#bbb",
                  }}
                >
                  🔒 {cell.price}
                  <button
                    onClick={() => {
                      if (canUnlock) {
                        setState((prev) => unlockCell(prev, index));
                      }
                    }}
                    style={{
                      marginTop: 4,
                      padding: "2px 6px",
                      borderRadius: 6,
                      border: "none",
                      background: canUnlock
                        ? "#4b7bec"
                        : sequentialAllowed
                        ? "#555"
                        : "#333",
                      color: "white",
                      cursor: canUnlock ? "pointer" : "not-allowed",
                      fontSize: 10,
                    }}
                  >
                    Unlock
                  </button>
                </div>
              );
            }

            const isItem = cell.type === "item";
            const level = isItem ? (cell as any).level : 1;
            const sticker = isItem ? levelStickers[level] : "";
            const bg = isItem
              ? levelColors[level]
              : "rgba(255,255,255,0.05)";

            const isDragging = dragIndex === index;
            const isHover = hoverIndex === index;
            const isFlash = mergeFlashIndex === index;

            return (
              <div
                key={index}
                draggable={isItem}
                onDragStart={() => isItem && setDragIndex(index)}
                onDragEnd={() => {
                  setDragIndex(null);
                  setHoverIndex(null);
                  setTrashHover(false);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setHoverIndex(index);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setHoverIndex(null);
                  if (dragIndex !== null) handleDrop(dragIndex, index);
                }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 12,
                  background: bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 34,
                  transition:
                    "transform 150ms ease, box-shadow 150ms ease, background 150ms ease",
                  transform: isFlash
                    ? "scale(1.15)"
                    : isDragging
                    ? "scale(1.1)"
                    : isHover
                    ? "scale(1.05)"
                    : "scale(1)",
                  boxShadow: isFlash
                    ? "0 0 15px rgba(0,255,150,0.9)"
                    : isHover
                    ? "0 0 10px rgba(255,255,255,0.3)"
                    : "0 0 6px rgba(0,0,0,0.4)",
                  cursor: isItem ? "grab" : "default",
                }}
              >
                {sticker}
              </div>
            );
          })}
        </div>
      </div>

      {/* Trash Bin (فقط آیکن) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setTrashHover(true);
        }}
        onDragLeave={() => setTrashHover(false)}
        onDrop={(e) => {
          e.preventDefault();
          if (dragIndex !== null) handleDrop(dragIndex, -1);
          setTrashHover(false);
        }}
        style={{
          marginTop: 10,
          width: 60,
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: trashHover ? 50 : 40,
          marginLeft: "auto",
          marginRight: "auto",
          transition: "all 150ms ease",
          color: trashHover ? "red" : "white",
        }}
      >
        🗑️
      </div>

      {/* Buttons */}
      <div
        style={{
          marginTop: 20,
          display: "flex",
          justifyContent: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setState((prev) => spawnFreeItem(prev))}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: "#4b7bec",
            color: "white",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          🎁 Free Lvl {highestLevel >= 12 ? "2" : "1"}
        </button>

        <button
          onClick={() => setState((prev) => spawnAdItem(prev))}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: "#20bf6b",
            color: "white",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          🎥 Ad Lvl {highestLevel >= 12 ? "4" : "3"}
        </button>

        <button
          onClick={() =>
            setState((prev) => {
              if (prev.autoMergeEnabled) return prev;
              if (prev.coins < AUTO_MERGE_PRICE) return prev;

              return {
                ...prev,
                coins: prev.coins - AUTO_MERGE_PRICE,
                autoMergeEnabled: true,
                autoMergeExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
              };
            })
          }
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: state.autoMergeEnabled ? "#777" : "#f368e0",
            color: "white",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          ⚡ Auto‑Merge{" "}
          {state.autoMergeEnabled ? "ON" : `(${AUTO_MERGE_PRICE})`}
        </button>
      </div>

      {/* Info */}
      <div style={{ marginTop: 20, textAlign: "center" }}>
        <p>💰 Coins: {formatCoins(state.coins)}</p>
        <p>📈 Income/sec: {formatCoins(state.incomePerSecond)}</p>
        <p>🕒 Queue: {state.queue ? `L${state.queue.level}` : "empty"}</p>
        <p>⭐ Highest Level: {highestLevel}</p>
      </div>

      {/* Offline Popup */}
      {state.offlinePopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "rgba(30,30,40,0.95)",
              borderRadius: 16,
              padding: 20,
              minWidth: 260,
              maxWidth: 320,
              textAlign: "center",
              boxShadow: "0 0 20px rgba(0,0,0,0.6)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <h3 style={{ marginBottom: 10 }}>Welcome back!</h3>
            <p style={{ marginBottom: 10 }}>
              در زمان آفلاین بودن،{" "}
              <b>{formatCoins(state.offlinePopup.coins)}</b> سکه جمع کردی.
            </p>

            <button
              onClick={collectOffline}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "none",
                background: "#20bf6b",
                color: "white",
                fontSize: 14,
                cursor: "pointer",
                marginRight: 8,
              }}
            >
              Collect
            </button>

            {state.offlinePopup.canDouble && (
              <button
                onClick={doubleOfflineWithAd}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: "#eb3b5a",
                  color: "white",
                  fontSize: 14,
                  cursor: "pointer",
                  marginLeft: 8,
                }}
              >
                2x with Ad
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
