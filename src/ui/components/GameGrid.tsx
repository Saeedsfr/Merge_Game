import type { GameState, Cell } from "../../core/types";
import { levelColors, levelStickers } from "../../core/config";

type Props = {
  state: GameState;
  dragIndex: number | null;
  hoverIndex: number | null;
  mergeFlashIndex: number | null;
  setDragIndex: (i: number | null) => void;
  setHoverIndex: (i: number | null) => void;
  handleDrop: (from: number, to: number) => void;
  unlockCell: (state: GameState, index: number) => GameState;
  setState: (fn: (prev: GameState) => GameState) => void;
};

export default function GameGrid({
  state,
  dragIndex,
  hoverIndex,
  mergeFlashIndex,
  setDragIndex,
  setHoverIndex,
  handleDrop,
  unlockCell,
  setState,
}: Props) {
  function isUnlockAllowed(index: number, grid: Cell[]): boolean {
    if (index === 9) return true;
    if (index === 10) return grid[9].type !== "locked";
    if (index === 11) return grid[10].type !== "locked";
    return false;
  }

  return (
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
  );
}
