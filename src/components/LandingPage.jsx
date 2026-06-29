import { ArrowRight, TrendingUp, Shield, Zap, BarChart3, Droplets, Coins } from "lucide-react";
export default function LandingPage({ onLaunch }) {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #e0f7fa 100%)", fontFamily: "system-ui, sans-serif" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.svg" width={32} height={32} alt="" style={{ borderRadius: 8 }} />
          <span style={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>Freesia DEX</span>
        </div>
        <button onClick={onLaunch} style={{ backgroundColor: "#0d9488", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>Launch App <ArrowRight size={14} /></button>
      </nav>
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 40px", textAlign: "center" }}>
        <span style={{ display: "inline-block", backgroundColor: "#fef3c7", color: "#92400e", padding: "6px 16px", borderRadius: 20, fontSize: 11, fontWeight: 800, marginBottom: 24 }}>⚡ Live on LitVM Testnet</span>
        <h1 style={{ fontSize: 56, fontWeight: 900, color: "#0f172a", marginBottom: 20, lineHeight: 1.1 }}>Trade Smarter on<br /><span style={{ color: "#0d9488" }}>LitVM Network</span></h1>
        <p style={{ fontSize: 18, color: "#64748b", maxWidth: 500, margin: "0 auto 32px" }}>The first DEX with built-in Impermanent Loss Simulator, Limit Orders, and Live Price Charts.</p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <button onClick={onLaunch} style={{ backgroundColor: "#0d9488", color: "#fff", border: "none", padding: "14px 28px", borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: "pointer" }}>Launch App →</button>
          <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ backgroundColor: "#fff", color: "#0f172a", border: "2px solid #e2e8f0", padding: "14px 28px", borderRadius: 12, fontWeight: 800, fontSize: 15, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>𝕏 Follow on X</a>
        </div>
      </section>
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px 60px" }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, textAlign: "center", marginBottom: 32, color: "#0f172a" }}>Key Features</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {[{icon: <Zap size={24} color="#f59e0b" />, title: "Lightning Swaps", desc: "Execute trades in under 2 seconds with zk-rollup settlement."}, {icon: <Shield size={24} color="#0d9488" />, title: "IL Simulator", desc: "Preview impermanent loss risk and calculate fees before adding liquidity."}, {icon: <TrendingUp size={24} color="#2563eb" />, title: "Limit Orders", desc: "Set buy/sell price targets and execute automatically when reached."}, {icon: <BarChart3 size={24} color="#7c3aed" />, title: "Live Charts", desc: "Track token prices in real-time with interactive price charts."}, {icon: <Droplets size={24} color="#0891b2" />, title: "Add Liquidity", desc: "Provide liquidity to earn trading fees with full LP token management."}, {icon: <Coins size={24} color="#db2777" />, title: "Staking", desc: "Stake LP tokens to earn MBG rewards with competitive APY."}].map((f, i) => (
            <div key={i} style={{ backgroundColor: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
              <div style={{ marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section style={{ maxWidth: 600, margin: "0 auto", padding: "0 40px 60px", textAlign: "center" }}>
        <div style={{ background: "linear-gradient(135deg, #0d9488, #0891b2)", borderRadius: 24, padding: 40, color: "#fff" }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Ready to Start Trading?</h2>
          <p style={{ color: "#ccfbf1", marginBottom: 20 }}>Connect your wallet and explore the most advanced DEX on LitVM.</p>
          <button onClick={onLaunch} style={{ backgroundColor: "#fff", color: "#0d9488", border: "none", padding: "12px 28px", borderRadius: 10, fontWeight: 800, cursor: "pointer" }}>Launch App →</button>
        </div>
      </section>
      <footer style={{ textAlign: "center", padding: "20px 40px", color: "#94a3b8", fontSize: 13, borderTop: "1px solid #e2e8f0" }}>
        <p>© 2026 Freesia DEX. Built by <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: "#0d9488", fontWeight: 700, textDecoration: "none" }}>@0xzackbh</a> on LitVM Testnet.</p>
      </footer>
    </div>
  );
}
