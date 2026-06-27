export default function Logo({ size = 40, showText = true, textSize = 22 }: { size?: number; showText?: boolean; textSize?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <img
        src="/logo.svg"
        alt="Freesia DEX"
        width={size}
        height={size}
        style={{
          borderRadius: "10px",
          border: "2px solid #000",
          boxShadow: "3px 3px 0 #000",
          background: "#fff",
        }}
      />
      {showText && (
        <span style={{ fontWeight: 900, fontSize: `${textSize}px`, color: "#1a1a1a" }}>
          Freesia DEX
        </span>
      )}
    </div>
  );
}
