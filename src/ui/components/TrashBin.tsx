type Props = {
  dragIndex: number | null;
  trashHover: boolean;
  setTrashHover: (b: boolean) => void;
  handleDrop: (from: number, to: number) => void;
};

export default function TrashBin({
  dragIndex,
  trashHover,
  setTrashHover,
  handleDrop,
}: Props) {
  return (
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
        cursor: "pointer",
      }}
    >
      🗑️
    </div>
  );
}
