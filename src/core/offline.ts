import type { GameState, OfflinePopup } from "./types";
import { MAX_OFFLINE_MS, DOUBLE_THRESHOLD_MS } from "./config";

// ----------------------
// محاسبه درآمد آفلاین
// ----------------------
export function computeOfflineEarnings(
  prevState: GameState,
  now: number
): OfflinePopup {
  const diff = now - prevState.lastUpdatedAt;

  if (diff < 1000) return null;

  const effectiveMs = Math.min(diff, MAX_OFFLINE_MS);

  const coins = prevState.incomePerSecond * (effectiveMs / 1000);

  const canDouble = diff >= DOUBLE_THRESHOLD_MS;

  return {
    coins,
    canDouble,
  };
}

// ----------------------
// اعمال درآمد آفلاین
// ----------------------
export function applyOfflineEarnings(
  state: GameState,
  popup: OfflinePopup
): GameState {
  if (!popup) return state;

  return {
    ...state,
    coins: state.coins + popup.coins,
    offlinePopup: null,
    lastUpdatedAt: Date.now(),
  };
}

// ----------------------
// اعمال درآمد آفلاین با تبلیغ
// ----------------------
export function applyOfflineDouble(
  state: GameState,
  popup: OfflinePopup
): GameState {
  if (!popup) return state;

  return {
    ...state,
    coins: state.coins + popup.coins * 2,
    offlinePopup: null,
    lastUpdatedAt: Date.now(),
  };
}
