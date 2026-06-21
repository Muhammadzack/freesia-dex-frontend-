import React, { useState } from 'react';

// Vektor SVG Logo Resmi Freesia - Huruf F Cantik & Kelopak Bunga Pink
const FreesiaLogo = () => (
  <svg width="45" height="45" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 50 C50 20, 35 25, 50 10 C65 25, 50 20, 50 50" fill="#FFA6C9" />
    <path d="M50 50 C50 80, 65 75, 50 90 C35 75, 50 80, 50 50" fill="#FFA6C9" />
    <path d="M50 50 C20 50, 25 35, 10 50 C25 65, 20 50, 50 50" fill="#FFA6C9" />
    <path d="M50 50 C80 50, 75 65, 90 50 C75 35, 80 50, 50 50" fill="#FFA6C9" />
    <path d="M50 50 C30 30, 20 45, 22 22 C45 20, 30 30, 50 50" fill="#FFB6D9" opacity="0.9" />
    <path d="M50 50 C70 70, 80 55, 78 78 C55 80, 70 70, 50 50" fill="#FFB6D9" opacity="0.9" />
    <path d="M50 50 C70 30, 55 20, 78 22 C80 45, 70 30, 50 50" fill="#FFB6D9" opacity="0.9" />
    <path d="M50 50 C30 70, 45 80, 22 78 C20 55, 30 70, 50 50" fill="#FFB6D9" opacity="0.9" />
    <path d="M60 25 C52 22, 44 30, 44 42 L44 78 M34 45 L56 45" stroke="#0F172A" strokeWidth="8" strokeLinecap="round" fill="none" />
  </svg>
);

const styles = {
  container: { backgroundColor: "#0b0f19", color: "#f3f4f6", minHeight: "100vh", padding: "20px", fontFamily: "sans-serif" },
  card: { backgroundColor: "#111827", borderRadius: "20px", padding: "30px", border: "1px solid #30363d", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" },
  button: { backgroundColor: "#FDC500", color: "#000", border: "none", padding: "16px", borderRadius: "12px", fontWeight: "900", cursor: "pointer", width: "100%", fontSize: "16px", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" },
  input: { width: "100%", padding: "18px", borderRadius: "12px", border: "1px solid #30363d", backgroundColor: "#1f2937", color: "white", marginBottom: "20px", fontSize: "16px" }
};

export default function App() {
  const [loading, setLoading] = useState(false);

  const handleSwap = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div style={styles.container}>
      {/* Banner Notifikasi Atas */}
      <div style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", textAlign: "center", padding: "8px 16px", fontSize: "12px", fontWeight: "600", marginBottom: "20px", borderRadius: "8px" }}>
        ⚠️ Berjalan di LitVM Testnet (Chain ID: 4441)
      </div>

      {/* Header Utama dengan Logo Immersive SVG */}
      <header style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "40px", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <FreesiaLogo />
          <div>
            <h1 style={{ fontSize: "24px", color: "#ffffff", margin: 0 }}>Freesia</h1>
            <div style={{ fontSize: "11px", color: "#fbbf24", fontWeight: "bold" }}>DEFI TRADING PROTOCOL</div>
          </div>
        </div>
        <a href="https://x.com" target="_blank" rel="noreferrer" style={{ color: "#ffffff", textDecoration: "none", fontSize: "20px", fontWeight: "bold" }}>𝕏</a>
      </header>

      {/* Panel Utama Swap */}
      <div style={{ maxWidth: "450px", margin: "0 auto" }}>
        <div style={styles.card}>
          <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#fff" }}>Tukar Token (Swap)</h3>
          <input style={styles.input} type="number" placeholder="0.00" />
          
          <button style={styles.button} onClick={handleSwap} disabled={loading}>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {/* Animasi Minion Berputar Aktif Saat Loading */}
                <img src="https://cdn-icons-png.flaticon.com/512/5962/5962463.png" alt="minion" style={{ width: "24px", animation: "spin 2s linear infinite" }} />
                <span>Memproses...</span>
              </div>
            ) : "Konfirmasi Swap"}
          </button>
        </div>
      </div>
      
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
