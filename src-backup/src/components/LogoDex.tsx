export default function LogoDex({ size = 32, showText = true }: { size?: number; showText?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <img
        src="/logo.svg"
        alt="Freesia DEX"
        width={size}
        height={size}
        style={{ borderRadius: "8px" }}
      />
      {showText && (
        <div>
          <span style={{ fontWeight: 900, fontSize: "18px" }}>Freesia DEX</span>
        </div>
      )}
    </div>
  );
}
