import type { OfflinePopup } from "../../core/types";

type Props = {
  popup: OfflinePopup | null;
  collectOffline: () => void;
  doubleOfflineWithAd: () => void;
  formatCoins: (n: number) => string;
};

export default function OfflinePopup({
  popup,
  collectOffline,
  doubleOfflineWithAd,
  formatCoins,
}: Props) {
  if (!popup) return null;

  return (
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
          <b>{formatCoins(popup.coins)}</b> سکه جمع کردی.
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

        {popup.canDouble && (
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
  );
}
