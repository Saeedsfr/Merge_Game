import type { GameState } from "../../core/types";
import { AUTO_MERGE_PRICE } from "../../core/config";

type Props = {
  state: GameState;
  highestLevel: number;
  spawnFreeItem: (s: GameState) => GameState;
  spawnAdItem: (s: GameState) => GameState;
  setState: (fn: (prev: GameState) => GameState) => void;
};

export default function Controls({
  state,
  highestLevel,
  spawnFreeItem,
  spawnAdItem,
  setState,
}: Props) {
  return (
    <div
      style={{
        marginTop: 20,
        display: "flex",
        justifyContent: "center",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      {/* Free Spawn */}
      <button
        onClick={() => setState((prev: GameState) => spawnFreeItem(prev))}
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

      {/* Ad Spawn */}
      <button
        onClick={() => setState((prev: GameState) => spawnAdItem(prev))}
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

      {/* Auto‑Merge */}
      <button
        onClick={() =>
          setState((prev: GameState) => {
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
        ⚡ Auto‑Merge {state.autoMergeEnabled ? "ON" : `(${AUTO_MERGE_PRICE})`}
      </button>
    </div>
  );
}
