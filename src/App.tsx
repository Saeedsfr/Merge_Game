import GameGrid from "./ui/components/GameGrid";
import TrashBin from "./ui/components/TrashBin";
import Controls from "./ui/components/Controls";
import OfflinePopup from "./ui/components/OfflinePopup";

import { useGameState } from "./ui/hooks/useGameState";

export default function App() {
  const {
    state,
    setState,

    dragIndex,
    hoverIndex,
    mergeFlashIndex,
    trashHover,

    setDragIndex,
    setHoverIndex,
    setTrashHover,

    handleDrop,
    collectOffline,
    doubleOfflineWithAd,

    highestLevel,
    formatCoins,

    spawnFreeItem,
    spawnAdItem,
    unlockCell,
  } = useGameState();

  return (
    <div className="page-container">
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
          trashHover={trashHover}
          setTrashHover={setTrashHover}
        />

        <TrashBin
          dragIndex={dragIndex}
          trashHover={trashHover}
          setTrashHover={setTrashHover}
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
    </div>
  );
}
