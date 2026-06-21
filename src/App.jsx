import React, { useState } from 'react';

const styles = {
  container: { backgroundColor: "#0b0f19", color: "#f3f4f6", minHeight: "100vh", padding: "20px", fontFamily: "'Inter', sans-serif" },
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
      <header style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "40px", justifyContent: "center" }}>
        <img src="/freesia-logo.png" alt="F" style={{ width: "50px", height: "50px" }} />
        <h1 style={{ fontSize: "32px", color: "#FFD1DC", margin: 0 }}>Freesia</h1>
      </header>

      <div style={{ maxWidth: "450px", margin: "0 auto" }}>
        <div style={styles.card}>
          <h3 style={{ marginTop: 0, color: "#fff" }}>Swap</h3>
          <input style={styles.input} type="number" placeholder="Jumlah (USDC)" />
          <button style={styles.button} onClick={handleSwap} disabled={loading}>
            {loading ? (
              <img src="https://cdn-icons-png.flaticon.com/512/5962/5962463.png" alt="minion" style={{ width: "24px", animation: "spin 2s linear infinite" }} />
            ) : "Konfirmasi Swap"}
          </button>
        </div>
      </div>
      
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
