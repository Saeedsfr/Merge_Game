type Props = {
  dragIndex: number | null;
  trashHover: boolean;
  setTrashHover: (b: boolean) => void;
};

export default function TrashBin({
  dragIndex,
  trashHover,
  setTrashHover,
}: Props) {
  return (
    <div
      className="trash-bin"
      onPointerMove={() => {
        if (dragIndex !== null) {
          setTrashHover(true);
        }
      }}
      onPointerLeave={() => setTrashHover(false)}
      onTouchMove={() => {
        if (dragIndex !== null) {
          setTrashHover(true);
        }
      }}
      onTouchEnd={() => {
        // drop در global pointerup انجام می‌شود
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
        cursor: "pointer",
      }}
    >
      🗑️
    </div>
  );
}
