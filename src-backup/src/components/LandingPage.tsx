import Logo from "./Logo";

const THEME = {
  bg: "#f0fdf4",
  card: "#ffffff",
  border: "#000000",
  text: "#1a1a1a",
  sub: "#525252",
  accent: "#22c55e",
  accent2: "#3b82f6",
  yellow: "#fbbf24",
  pink: "#f472b6",
  purple: "#8b5cf6",
  teal: "#14b8a6",
};

const neo: Record<string, any> = {
  box: {
    backgroundColor: THEME.card,
    border: "3px solid " + THEME.border,
    borderRadius: "16px",
    boxShadow: "6px 6px 0px " + THEME.border,
    padding: "24px",
  },
  btn: (color = THEME.accent) => ({
    backgroundColor: color,
    border: "3px solid " + THEME.border,
    borderRadius: "12px",
    padding: "14px 28px",
    fontWeight: "800",
    fontSize: "15px",
    cursor: "pointer",
    boxShadow: "4px 4px 0px " + THEME.border,
    color: "#000",
  }),
  btnSmall: (color = THEME.yellow) => ({
    backgroundColor: color,
    border: "2px solid " + THEME.border,
    borderRadius: "10px",
    padding: "8px 16px",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer",
    boxShadow: "3px 3px 0px " + THEME.border,
    color: "#000",
  }),
  card: {
    backgroundColor: THEME.card,
    border: "3px solid " + THEME.border,
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "5px 5px 0px " + THEME.border,
  },
  badge: (color: string) => ({
    backgroundColor: color,
    border: "2px solid " + THEME.border,
    borderRadius: "20px",
    padding: "4px 12px",
    fontSize: "11px",
    fontWeight: "800",
    boxShadow: "2px 2px 0px " + THEME.border,
  }),
};

export default function LandingPage({ onLaunch }: { onLaunch: () => void }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: THEME.bg, fontFamily: "system-ui, sans-serif" }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", maxWidth: "1200px", margin: "0 auto" }}>
        <Logo size={40} textSize={22} />
        <div style={{ display: "flex", gap: "30px", alignItems: "center" }}>
          <a href="#features" style={{ color: "#000", textDecoration: "none", fontWeight: 700 }}>Features</a>
          <a href="#how" style={{ color: "#000", textDecoration: "none", fontWeight: 700 }}>How It Works</a>
          <a href="#stats" style={{ color: "#000", textDecoration: "none", fontWeight: 700 }}>Stats</a>
          <button onClick={onLaunch} style={neo.btnSmall(THEME.accent2)}>Launch App →</button>
        </div>
      </nav>

      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center" }}>
        <div>
          <div style={{ ...neo.badge(THEME.yellow), display: "inline-block", marginBottom: "20px" }}>⚡ Live on LitVM Testnet</div>
          <h1 style={{ fontSize: "52px", fontWeight: 900, lineHeight: "1.1", marginBottom: "20px", color: "#000" }}>
            The First DEX on<br />
            <span style={{ color: THEME.teal }}>LitVM Network</span>
          </h1>
          <p style={{ fontSize: "18px", color: THEME.sub, marginBottom: "30px", lineHeight: "1.6" }}>
            Swap, pool, and stake with the only DEX featuring an integrated Impermanent Loss Risk Simulator.
          </p>
          <div style={{ display: "flex", gap: "16px" }}>
            <button onClick={onLaunch} style={neo.btn(THEME.accent)}>Launch App →</button>
            <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ ...neo.btnSmall("#fff"), display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
              <span style={{ fontSize: "18px" }}>𝕏</span> Follow on X
            </a>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ ...neo.box, backgroundColor: "#ccfbf1", padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: "80px", marginBottom: "20px" }}>📊</div>
            <div style={{ fontSize: "24px", fontWeight: 900 }}>TUKAR</div>
            <div style={{ fontSize: "14px", color: THEME.sub, marginTop: "10px" }}>Swap tokens instantly</div>
          </div>
          <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "60px", height: "60px", backgroundColor: THEME.yellow, border: "3px solid #000", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "3px 3px 0 #000", fontSize: "28px" }}>⭐</div>
          <div style={{ position: "absolute", bottom: "-15px", left: "-15px", width: "50px", height: "50px", backgroundColor: THEME.pink, border: "3px solid #000", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "3px 3px 0 #000", fontSize: "22px" }}>🚀</div>
        </div>
      </section>

      <section id="stats" style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
          {[
            { label: "Total Value Locked", value: "$1.245.000", icon: "💎" },
            { label: "Total Volume", value: "$8.900.000", icon: "📈" },
            { label: "Active Users", value: "4.200", icon: "👥" },
            { label: "Transactions", value: "156.000", icon: "⚡" },
          ].map((s, i) => (
            <div key={i} style={neo.card}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>{s.icon}</div>
              <div style={{ fontSize: "24px", fontWeight: 900 }}>{s.value}</div>
              <div style={{ fontSize: "13px", color: THEME.sub, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 40px" }}>
        <h2 style={{ fontSize: "36px", fontWeight: 900, textAlign: "center", marginBottom: "40px" }}>Key Features</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
          {[
            { icon: "⚡", title: "Lightning Swaps", desc: "Execute trades in under 2 seconds with zk-rollup settlement.", stat: "20+", statLabel: "Assets Supported", color: "#bbf7d0" },
            { icon: "🛡️", title: "IL Simulator", desc: "Preview impermanent loss risk before adding liquidity.", stat: "5M+", statLabel: "Liquidity Locked", color: "#bfdbfe" },
            { icon: "🤖", title: "AI Integration", desc: "Leverage AI agents for market analysis and insights.", stat: "Smart", statLabel: "Market Assistant", color: "#fbcfe8" },
          ].map((f, i) => (
            <div key={i} style={{ ...neo.card, backgroundColor: f.color }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>{f.icon}</div>
              <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>{f.title}</h3>
              <p style={{ fontSize: "14px", color: THEME.sub, marginBottom: "20px", lineHeight: "1.5" }}>{f.desc}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ fontSize: "28px", fontWeight: 900 }}>{f.stat}</span>
                <span style={{ fontSize: "13px", color: THEME.sub, fontWeight: 600 }}>{f.statLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="how" style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 40px" }}>
        <h2 style={{ fontSize: "36px", fontWeight: 900, textAlign: "center", marginBottom: "40px" }}>How It Works</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
          {[
            { num: "01", icon: "👛", title: "Connect Wallet", desc: "Link your MetaMask to LitVM Testnet." },
            { num: "02", icon: "🪙", title: "Get Test Tokens", desc: "Claim free zkLTC, USDC, DAI from faucet." },
            { num: "03", icon: "🔄", title: "Start Trading", desc: "Swap tokens or add liquidity to earn fees." },
          ].map((s, i) => (
            <div key={i} style={{ ...neo.card, textAlign: "center" }}>
              <div style={{ fontSize: "14px", fontWeight: 800, color: THEME.purple, marginBottom: "12px" }}>STEP {s.num}</div>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>{s.icon}</div>
              <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "8px" }}>{s.title}</h3>
              <p style={{ fontSize: "14px", color: THEME.sub }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: "800px", margin: "60px auto", padding: "60px 40px", ...neo.box, backgroundColor: "#e0e7ff", textAlign: "center" }}>
        <h2 style={{ fontSize: "32px", fontWeight: 900, marginBottom: "16px" }}>Ready to Start Trading?</h2>
        <p style={{ fontSize: "16px", color: THEME.sub, marginBottom: "30px" }}>Join thousands of users trading on Freesia DEX.</p>
        <button onClick={onLaunch} style={neo.btn(THEME.accent)}>Launch App →</button>
      </section>

      <footer style={{ backgroundColor: "#1e3a5f", color: "#fff", padding: "60px 40px 30px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "40px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <img src="/logo.svg" alt="Freesia DEX" width="28" height="28" style={{ borderRadius: "6px" }} />
              <span style={{ fontWeight: 900, fontSize: "20px", color: THEME.yellow }}>Freesia DEX</span>
            </div>
            <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: "1.6" }}>
              The first decentralized exchange on LitVM Testnet with integrated IL simulator.
            </p>
          </div>
          <div>
            <h4 style={{ fontWeight: 800, marginBottom: "16px" }}>Product</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <span onClick={onLaunch} style={{ color: "#94a3b8", cursor: "pointer" }}>Swap</span>
              <span onClick={onLaunch} style={{ color: "#94a3b8", cursor: "pointer" }}>Pool</span>
              <span onClick={onLaunch} style={{ color: "#94a3b8", cursor: "pointer" }}>Staking</span>
            </div>
          </div>
          <div>
            <h4 style={{ fontWeight: 800, marginBottom: "16px" }}>Developers</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a href="https://github.com/Muhammadzack/freesia-dex-frontend-" target="_blank" rel="noreferrer" style={{ color: "#94a3b8", textDecoration: "none" }}>GitHub</a>
              <a href="#" style={{ color: "#94a3b8", textDecoration: "none" }}>Docs</a>
              <a href="https://liteforge.explorer.caldera.xyz" target="_blank" rel="noreferrer" style={{ color: "#94a3b8", textDecoration: "none" }}>Explorer ↗</a>
            </div>
          </div>
          <div>
            <h4 style={{ fontWeight: 800, marginBottom: "16px" }}>Community</h4>
            <div style={{ display: "flex", gap: "16px" }}>
              <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: THEME.yellow, fontSize: "20px", textDecoration: "none" }}>𝕏</a>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: "1200px", margin: "40px auto 0", paddingTop: "20px", borderTop: "1px solid #334155", textAlign: "center", fontSize: "13px", color: "#64748b" }}>
          © 2026 Freesia DEX. Built by <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: THEME.yellow, textDecoration: "none" }}>@0xzackbh</a> on LitVM Testnet.
        </div>
      </footer>
    </div>
  );
}
