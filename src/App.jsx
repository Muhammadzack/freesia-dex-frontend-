import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  ArrowUpDown, Settings, CheckCircle2, Sun, Moon, Copy,
  Droplets, AlertTriangle, Info, RefreshCw, Layers, Trophy,
  TrendingUp, Wallet, ExternalLink
} from "lucide-react";

/* ============ KONSTANTA ============ */
const CONTRACTS = {
  USDC: "0xCa2AC72dAC6d88a21765971f4A6AA917e12553Dd",
  DAI:  "0x961B942b0f7e44622584Cb001DEC642b01573Acf",
  USDT: "0x7B00A91DaDDA4124D5d1D4F10E6CAc338911700A",
  MBG:  "0x943a23d4ee276C2598D04C9e143b8b67b3829CFe",
  POOL: "0x49C738De9b7bED753bC25E91A58dC58EA889f585",
};

/* ============ TOKEN LOGOS (SVG) ============ */
function TokenLogo({ symbol, size = 28 }) {
  const logos = {
    zkLTC: (
      <svg width={size} height={size} viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#345D9D" stroke="#fff" strokeWidth="1"/><text x="16" y="21" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">Ł</text></svg>
    ),
    USDC: (
      <svg width={size} height={size} viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#2775CA" stroke="#fff" strokeWidth="1"/><text x="16" y="21" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">$</text></svg>
    ),
    DAI: (
      <svg width={size} height={size} viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#F5AC37" stroke="#fff" strokeWidth="1"/><path d="M16 6 L26 16 L16 26 L6 16 Z" fill="#F4B731" opacity="0.3"/><text x="16" y="21" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">D</text></svg>
    ),
    USDT: (
      <svg width={size} height={size} viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#26A17B" stroke="#fff" strokeWidth="1"/><text x="16" y="21" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">T</text></svg>
    ),
    MBG: (
      <svg width={size} height={size} viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#f472b6" stroke="#fff" strokeWidth="1"/><text x="16" y="21" textAnchor="middle" fontSize="16">🌸</text></svg>
    ),
  };
  return logos[symbol] || <span style={{ fontSize: size }}>🪙</span>;
}

/* ============ FORMAT BALANCE (FIX BUG) ============ */
function fmtBal(val, decimals = 4) {
  if (!val || val === "0") return "0.00";
  const n = Number(val);
  if (isNaN(n)) return "0.00";
  if (n > 1e15) return n.toExponential(2);
  if (n > 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n > 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n > 1e3) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return n.toFixed(decimals);
}

const TOKEN_LIST = {
  zkLTC: { name: "zkLTC", logo: "LTC", decimals: 18, address: "NATIVE", isNative: true },
  USDC:  { name: "USDC",  logo: "USDC", decimals: 6,  address: CONTRACTS.USDC },
  DAI:   { name: "DAI",   logo: "DAI", decimals: 18, address: CONTRACTS.DAI },
  USDT:  { name: "USDT",  logo: "USDT", decimals: 6,  address: CONTRACTS.USDT },
  MBG:   { name: "MBG",   logo: "MBG", decimals: 18, address: CONTRACTS.MBG },
};

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function faucet(uint256 amount) external",
];

const POOL_ABI = [
  "function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minOut) external",
  "function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB) external",
  "function removeLiquidity(address tokenA, address tokenB, uint256 lpAmount) external",
  "function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) view returns (uint256)",
  "function getReserves() view returns (uint256, uint256)",
  "function getUserLP(address user) view returns (uint256)",
];

const LITVM_RPC = "https://liteforge.rpc.caldera.xyz/http";
const CHAIN_ID = 4441;
const EXPLORER_URL = "https://liteforge.explorer.caldera.xyz";
const FAUCET_AMOUNT = "1000";

/* ============ THEME ============ */
function useTheme(darkMode) {
  return {
    bg: darkMode ? "#0f172a" : "#f0fdf4",
    card: darkMode ? "#1e293b" : "#ffffff",
    input: darkMode ? "#0f172a" : "#f0fdf4",
    border: darkMode ? "#334155" : "#e2e8f0",
    text: darkMode ? "#f1f5f9" : "#0f172a",
    sub: darkMode ? "#94a3b8" : "#64748b",
    accent: "#0d9488",
    green: "#22c55e",
    red: "#ef4444",
    yellow: "#fbbf24",
  };
}

/* ============ LOGO COMPONENT ============ */
function Logo({ size = 32 }) {
  return (
    <img src="/logo.svg" alt="Freesia DEX" width={size} height={size} style={{ borderRadius: 8 }} />
  );
}

/* ============ TOAST ============ */
function Toast({ toast, theme }) {
  if (!toast) return null;
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 1000,
      backgroundColor: theme.card, padding: "14px 24px", borderRadius: 16,
      border: `2px solid ${theme.border}`, boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      fontWeight: 700, display: "flex", alignItems: "center", gap: 10, color: theme.text,
      animation: "slideIn 0.3s ease"
    }}>
      <span style={{ fontSize: 20 }}>{toast.icon}</span> {toast.msg}
    </div>
  );
}

/* ============ LANDING PAGE ============ */
function LandingPage({ onLaunch }) {
  const T = { bg: "#f0fdf4", card: "#fff", border: "#000", text: "#1a1a1a", sub: "#525252", accent: "#22c55e", accent2: "#3b82f6", yellow: "#fbbf24", pink: "#f472b6", teal: "#14b8a6" };
  const neoBox = { backgroundColor: T.card, border: "3px solid " + T.border, borderRadius: 16, boxShadow: "6px 6px 0px " + T.border, padding: 24 };
  const neoBtn = (c = T.accent) => ({ backgroundColor: c, border: "3px solid " + T.border, borderRadius: 12, padding: "14px 28px", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "4px 4px 0px " + T.border, color: "#000" });
  const neoCard = { backgroundColor: T.card, border: "3px solid " + T.border, borderRadius: 16, padding: 20, boxShadow: "5px 5px 0px " + T.border };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: T.bg, fontFamily: "system-ui, sans-serif" }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo size={40} />
          <span style={{ fontWeight: 900, fontSize: 22, color: T.text }}>Freesia DEX</span>
        </div>
        <div style={{ display: "flex", gap: 30, alignItems: "center" }}>
          <a href="#features" style={{ color: "#000", textDecoration: "none", fontWeight: 700 }}>Features</a>
          <a href="#how" style={{ color: "#000", textDecoration: "none", fontWeight: 700 }}>How It Works</a>
          <button onClick={onLaunch} style={neoBtn(T.accent2)}>Launch App →</button>
        </div>
      </nav>

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
        <div>
          <div style={{ ...neoBox, backgroundColor: T.yellow, display: "inline-block", marginBottom: 20, fontSize: 11, fontWeight: 800 }}>⚡ Live on LitVM Testnet</div>
          <h1 style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.1, marginBottom: 20, color: "#000" }}>
            The First DEX on<br /><span style={{ color: T.teal }}>LitVM Network</span>
          </h1>
          <p style={{ fontSize: 18, color: T.sub, marginBottom: 30, lineHeight: 1.6 }}>
            Swap, pool, and stake with the only DEX featuring an integrated Impermanent Loss Risk Simulator.
          </p>
          <div style={{ display: "flex", gap: 16 }}>
            <button onClick={onLaunch} style={neoBtn(T.accent)}>Launch App →</button>
            <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ ...neoBtn("#fff"), display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <span style={{ fontSize: 18 }}>𝕏</span> Follow on X
            </a>
          </div>
        </div>
        <div style={{ ...neoBox, backgroundColor: "#ccfbf1", padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 80, marginBottom: 20 }}>📊</div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>TUKAR</div>
          <div style={{ fontSize: 14, color: T.sub, marginTop: 10 }}>Swap tokens instantly</div>
        </div>
      </section>

      <section id="features" style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 40px" }}>
        <h2 style={{ fontSize: 36, fontWeight: 900, textAlign: "center", marginBottom: 40 }}>Key Features</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {[
            { icon: "⚡", title: "Lightning Swaps", desc: "Execute trades in under 2 seconds with zk-rollup settlement.", stat: "20+", color: "#bbf7d0" },
            { icon: "🛡️", title: "IL Simulator", desc: "Preview impermanent loss risk before adding liquidity.", stat: "5M+", color: "#bfdbfe" },
            { icon: "🤖", title: "AI Integration", desc: "Leverage AI agents for market analysis and insights.", stat: "Smart", color: "#fbcfe8" },
          ].map((f, i) => (
            <div key={i} style={{ ...neoCard, backgroundColor: f.color }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: T.sub, marginBottom: 20, lineHeight: 1.5 }}>{f.desc}</p>
              <span style={{ fontSize: 28, fontWeight: 900 }}>{f.stat}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="how" style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 40px" }}>
        <h2 style={{ fontSize: 36, fontWeight: 900, textAlign: "center", marginBottom: 40 }}>How It Works</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {[
            { num: "01", icon: "👛", title: "Connect Wallet", desc: "Link your MetaMask to LitVM Testnet." },
            { num: "02", icon: "🪙", title: "Get Test Tokens", desc: "Claim free zkLTC, USDC, DAI from faucet." },
            { num: "03", icon: "🔄", title: "Start Trading", desc: "Swap tokens or add liquidity to earn fees." },
          ].map((s, i) => (
            <div key={i} style={{ ...neoCard, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#8b5cf6", marginBottom: 12 }}>STEP {s.num}</div>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{s.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: T.sub }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 800, margin: "60px auto", padding: "60px 40px", ...neoBox, backgroundColor: "#e0e7ff", textAlign: "center" }}>
        <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16 }}>Ready to Start Trading?</h2>
        <button onClick={onLaunch} style={neoBtn(T.accent)}>Launch App →</button>
      </section>

      <footer style={{ backgroundColor: "#1e3a5f", color: "#fff", padding: "60px 40px 30px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 16 }}>
            <Logo size={28} />
            <span style={{ fontWeight: 900, fontSize: 20, color: T.yellow }}>Freesia DEX</span>
          </div>
          <p style={{ fontSize: 13, color: "#64748b" }}>
            © 2026 Freesia DEX. Built by <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: T.yellow, textDecoration: "none" }}>@0xzackbh</a> on LitVM Testnet.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ============ SWAP PANEL ============ */
function SwapPanel({ account, signer, provider, balances, updateBalances, showToast, theme, addHistory }) {
  const [fromSym, setFromSym] = useState("USDC");
  const [toSym, setToSym] = useState("DAI");
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");
  const [swapLoading, setSwapLoading] = useState(false);
  const [slippage, setSlippage] = useState(0.5);
  const [showSlippage, setShowSlippage] = useState(false);

  useEffect(() => {
    const calc = async () => {
      if (!amountIn || parseFloat(amountIn) <= 0) { setAmountOut(""); return; }
      try {
        const readProv = provider || new ethers.JsonRpcProvider(LITVM_RPC);
        const pool = new ethers.Contract(CONTRACTS.POOL, POOL_ABI, readProv);
        const fromAddr = TOKEN_LIST[fromSym].isNative ? CONTRACTS.USDC : TOKEN_LIST[fromSym].address;
        const toAddr = TOKEN_LIST[toSym].isNative ? CONTRACTS.DAI : TOKEN_LIST[toSym].address;
        const amt = ethers.parseUnits(String(amountIn), TOKEN_LIST[fromSym].decimals);
        const out = await pool.getAmountOut(fromAddr, toAddr, amt);
        setAmountOut(parseFloat(ethers.formatUnits(out, TOKEN_LIST[toSym].decimals)).toFixed(6));
      } catch (e) { setAmountOut(""); }
    };
    calc();
  }, [amountIn, fromSym, toSym, provider]);

  const handleSwap = async () => {
    if (!signer || !account) return showToast("❌", "Connect wallet first!");
    if (!amountIn || parseFloat(amountIn) <= 0) return showToast("❌", "Enter amount!");
    setSwapLoading(true);
    try {
      const fromAddr = TOKEN_LIST[fromSym].isNative ? CONTRACTS.USDC : TOKEN_LIST[fromSym].address;
      const toAddr = TOKEN_LIST[toSym].isNative ? CONTRACTS.DAI : TOKEN_LIST[toSym].address;
      const amt = ethers.parseUnits(String(amountIn), TOKEN_LIST[fromSym].decimals);
      const pool = new ethers.Contract(CONTRACTS.POOL, POOL_ABI, signer);
      if (!TOKEN_LIST[fromSym].isNative) {
        const token = new ethers.Contract(fromAddr, ERC20_ABI, signer);
        const allow = await token.allowance(account, CONTRACTS.POOL);
        if (allow < amt) {
          showToast("⏳", "Approving token...");
          await (await token.approve(CONTRACTS.POOL, ethers.MaxUint256)).wait();
        }
      }
      const minOut = ethers.parseUnits(String(parseFloat(amountOut) * (1 - slippage / 100)), TOKEN_LIST[toSym].decimals);
      showToast("⏳", "Confirm swap in wallet...");
      const tx = await pool.swap(fromAddr, toAddr, amt, minOut, { gasLimit: 500000 });
      await tx.wait();
      showToast("🎉", `Swapped ${amountIn} ${fromSym} → ${amountOut} ${toSym}`);
      addHistory("Swap", `${amountIn} ${fromSym} → ${amountOut} ${toSym}`, tx.hash);
      setAmountIn(""); setAmountOut("");
      updateBalances(provider, account);
    } catch (err) {
      showToast("❌", "Swap failed: " + (err.reason || err.message || "").slice(0, 60));
    } finally { setSwapLoading(false); }
  };

  const card = { backgroundColor: theme.card, borderRadius: 24, padding: 24, border: `1px solid ${theme.border}`, width: "100%", maxWidth: 460 };
  const inputBox = { backgroundColor: theme.input, padding: 16, borderRadius: 16, border: `1px solid ${theme.border}` };

  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Swap Tokens</h3>
        <button onClick={() => setShowSlippage(!showSlippage)} style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: theme.sub, fontSize: 12 }}>
          <Settings size={14} style={{ verticalAlign: "middle" }} /> {slippage}%
        </button>
      </div>
      {showSlippage && (
        <div style={{ ...inputBox, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: theme.sub, marginBottom: 8 }}>Slippage Tolerance</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[0.1, 0.5, 1.0, 2.0].map(v => (
              <button key={v} onClick={() => setSlippage(v)} style={{ flex: 1, padding: 8, borderRadius: 8, border: slippage === v ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`, backgroundColor: slippage === v ? theme.accent : "transparent", color: slippage === v ? "#fff" : theme.sub, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>{v}%</button>
            ))}
          </div>
        </div>
      )}
      <div style={{ ...inputBox, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: theme.sub, marginBottom: 8 }}>
          <span>You Pay</span><span>Bal: {fmtBal(balances[fromSym])}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <input type="number" placeholder="0.0" value={amountIn} onChange={e => setAmountIn(e.target.value)} style={{ background: "transparent", border: "none", color: theme.text, fontSize: 28, width: "55%", outline: "none", fontWeight: 700 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: 20, padding: "8px 14px", fontWeight: 700 }}>
            <TokenLogo symbol={fromSym} size={20} /> {fromSym}
          </div>
        </div>
      </div>
      <div style={{ textAlign: "center", margin: "-8px 0", position: "relative", zIndex: 2 }}>
        <button onClick={() => { setFromSym(toSym); setToSym(fromSym); }} style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: "50%", width: 36, height: 36, cursor: "pointer", color: theme.sub }}>
          <ArrowUpDown size={16} />
        </button>
      </div>
      <div style={{ ...inputBox, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: theme.sub, marginBottom: 8 }}>
          <span>You Receive (est)</span><span>Bal: {fmtBal(balances[toSym])}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <input type="text" placeholder="0.0" value={amountOut} readOnly style={{ background: "transparent", border: "none", color: theme.sub, fontSize: 28, width: "55%", outline: "none", fontWeight: 700 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: 20, padding: "8px 14px", fontWeight: 700, color: theme.text }}>
            <TokenLogo symbol={toSym} size={20} /> {toSym}
          </div>
        </div>
      </div>
      <button onClick={handleSwap} disabled={!account || !amountIn || swapLoading} style={{ width: "100%", backgroundColor: !account ? theme.border : theme.accent, color: "#fff", border: "none", padding: 16, borderRadius: 16, fontWeight: 800, fontSize: 16, cursor: account && amountIn ? "pointer" : "not-allowed", opacity: account && amountIn ? 1 : 0.6 }}>
        {!account ? "Connect Wallet" : swapLoading ? "⏳ Swapping..." : `Swap ${fromSym} → ${toSym}`}
      </button>
    </div>
  );
}

/* ============ FAUCET PANEL (FIXED) ============ */
function FaucetPanel({ account, signer, provider, balances, updateBalances, showToast, theme, addHistory }) {
  const [mintingSym, setMintingSym] = useState(null);

  const handleFaucet = async (sym) => {
    if (!signer || !account) return showToast("❌", "Connect wallet!");
    if (sym === "zkLTC") {
      window.open("https://faucet.liteforge.xyz/", "_blank");
      return;
    }
    setMintingSym(sym);
    try {
      const addr = TOKEN_LIST[sym].address;
      const token = new ethers.Contract(addr, ERC20_ABI, signer);
      showToast("⏳", `Claiming ${FAUCET_AMOUNT} ${sym}...`);
      const tx = await token.faucet(ethers.parseUnits(FAUCET_AMOUNT, TOKEN_LIST[sym].decimals), { gasLimit: 300000 });
      await tx.wait();
      showToast("✅", `Got ${FAUCET_AMOUNT} ${sym}!`);
      addHistory("Faucet", `${FAUCET_AMOUNT} ${sym}`, tx.hash);
      updateBalances(provider, account);
    } catch (err) {
      showToast("❌", `Faucet failed: ${(err.reason || err.message || "").slice(0, 80)}`);
    } finally { setMintingSym(null); }
  };

  const card = { backgroundColor: theme.card, borderRadius: 24, padding: 24, border: `1px solid ${theme.border}`, width: "100%", maxWidth: 460 };

  return (
    <div style={card}>
      <h3 style={{ margin: "0 0 8px 0", textAlign: "center", fontSize: 20, fontWeight: 800 }}>
        <Droplets size={20} style={{ verticalAlign: "middle", marginRight: 8 }} />Faucet Hub
      </h3>
      <p style={{ fontSize: 13, color: theme.sub, textAlign: "center", marginBottom: 24 }}>Claim free test tokens ({FAUCET_AMOUNT} per claim)</p>
      {Object.entries(TOKEN_LIST).map(([sym, info]) => (
        <div key={sym} style={{ backgroundColor: theme.input, padding: 16, borderRadius: 16, border: `1px solid ${theme.border}`, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <TokenLogo symbol={sym} size={36} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{sym}</div>
              <div style={{ fontSize: 12, color: theme.green, fontWeight: 600 }}>Bal: {fmtBal(balances[sym])}</div>
            </div>
          </div>
          <button onClick={() => handleFaucet(sym)} disabled={mintingSym === sym} style={{ backgroundColor: sym === "zkLTC" ? theme.border : theme.accent, color: "#fff", border: "none", padding: "10px 18px", borderRadius: 12, fontWeight: 700, cursor: sym === "zkLTC" ? "pointer" : mintingSym === sym ? "wait" : "pointer", opacity: mintingSym === sym ? 0.7 : 1 }}>
            {mintingSym === sym ? "⏳..." : sym === "zkLTC" ? "🔗 External" : `Claim ${FAUCET_AMOUNT}`}
          </button>
        </div>
      ))}
    </div>
  );
}

/* ============ POOL PANEL (FIXED) ============ */
function PoolPanel({ account, signer, provider, balances, updateBalances, showToast, theme, addHistory, poolInfo }) {
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [poolLoading, setPoolLoading] = useState(false);
  const [poolMode, setPoolMode] = useState("add");
  const [tokenA, setTokenA] = useState("USDC");
  const [tokenB, setTokenB] = useState("DAI");
  const [lpAmount, setLpAmount] = useState("");

  const handleAdd = async () => {
    if (!signer || !account) return showToast("❌", "Connect wallet!");
    if (!amountA || !amountB || parseFloat(amountA) <= 0 || parseFloat(amountB) <= 0) return showToast("❌", "Enter both amounts!");
    setPoolLoading(true);
    try {
      const amtA = ethers.parseUnits(String(amountA), TOKEN_LIST[tokenA].decimals);
      const amtB = ethers.parseUnits(String(amountB), TOKEN_LIST[tokenB].decimals);
      const pool = new ethers.Contract(CONTRACTS.POOL, POOL_ABI, signer);
      const tA = new ethers.Contract(TOKEN_LIST[tokenA].address, ERC20_ABI, signer);
      const tB = new ethers.Contract(TOKEN_LIST[tokenB].address, ERC20_ABI, signer);
      const allA = await tA.allowance(account, CONTRACTS.POOL);
      if (allA < amtA) { showToast("⏳", `Approving ${tokenA}...`); await (await tA.approve(CONTRACTS.POOL, ethers.MaxUint256)).wait(); }
      const allB = await tB.allowance(account, CONTRACTS.POOL);
      if (allB < amtB) { showToast("⏳", `Approving ${tokenB}...`); await (await tB.approve(CONTRACTS.POOL, ethers.MaxUint256)).wait(); }
      showToast("⏳", "Adding liquidity...");
      const tx = await pool.addLiquidity(TOKEN_LIST[tokenA].address, TOKEN_LIST[tokenB].address, amtA, amtB, { gasLimit: 500000 });
      await tx.wait();
      showToast("🎉", "Liquidity added!");
      addHistory("Pool", `Added ${amountA} ${tokenA} + ${amountB} ${tokenB}`, tx.hash);
      setAmountA(""); setAmountB("");
      updateBalances(provider, account);
    } catch (err) {
      showToast("❌", "Pool failed: " + (err.reason || err.message || "").slice(0, 60));
    } finally { setPoolLoading(false); }
  };

  const handleRemove = async () => {
    if (!signer || !account) return showToast("❌", "Connect wallet!");
    if (!lpAmount || parseFloat(lpAmount) <= 0) return showToast("❌", "Enter LP amount!");
    setPoolLoading(true);
    try {
      const lpAmt = ethers.parseUnits(String(lpAmount), 18);
      const pool = new ethers.Contract(CONTRACTS.POOL, POOL_ABI, signer);
      showToast("⏳", "Removing liquidity...");
      const tx = await pool.removeLiquidity(TOKEN_LIST[tokenA].address, TOKEN_LIST[tokenB].address, lpAmt, { gasLimit: 500000 });
      await tx.wait();
      showToast("🎉", "Liquidity removed!");
      addHistory("Pool", `Removed ${lpAmount} LP`, tx.hash);
      setLpAmount("");
      updateBalances(provider, account);
    } catch (err) {
      showToast("❌", "Remove failed: " + (err.reason || err.message || "").slice(0, 60));
    } finally { setPoolLoading(false); }
  };

  const card = { backgroundColor: theme.card, borderRadius: 24, padding: 24, border: `1px solid ${theme.border}`, width: "100%", maxWidth: 500 };
  const inp = { padding: 14, backgroundColor: theme.input, border: `1px solid ${theme.border}`, borderRadius: 12, color: theme.text, fontWeight: 700, fontSize: 16, width: "100%", boxSizing: "border-box" };

  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}><Layers size={20} style={{ verticalAlign: "middle", marginRight: 8 }} />Liquidity</h3>
        <div style={{ display: "flex", gap: 4, backgroundColor: theme.input, borderRadius: 10, padding: 3 }}>
          <button onClick={() => setPoolMode("add")} style={{ padding: "8px 16px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", backgroundColor: poolMode === "add" ? theme.accent : "transparent", color: poolMode === "add" ? "#fff" : theme.sub }}>Add</button>
          <button onClick={() => setPoolMode("remove")} style={{ padding: "8px 16px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", backgroundColor: poolMode === "remove" ? theme.red : "transparent", color: poolMode === "remove" ? "#fff" : theme.sub }}>Remove</button>
        </div>
      </div>
      <div style={{ backgroundColor: theme.input, padding: 16, borderRadius: 16, border: `1px solid ${theme.border}`, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
          <span style={{ color: theme.sub }}>Pool TVL</span><strong style={{ color: theme.green }}>${poolInfo.reserveA > 0 ? (parseFloat(poolInfo.reserveA) + parseFloat(poolInfo.reserveB)).toFixed(2) : "—"}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
          <span style={{ color: theme.sub }}>Your LP</span><strong style={{ color: theme.accent }}>{poolInfo.userLP}</strong>
        </div>
      </div>
      {poolMode === "add" ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: theme.sub, marginBottom: 4, display: "block" }}>Token A</label>
              <select value={tokenA} onChange={e => { setTokenA(e.target.value); if (e.target.value === tokenB) setTokenB(tokenA); }} style={inp}>
                {Object.keys(TOKEN_LIST).filter(s => !TOKEN_LIST[s].isNative).map(s => <option key={s} value={s}>{TOKEN_LIST[s].logo} {s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: theme.sub, marginBottom: 4, display: "block" }}>Token B</label>
              <select value={tokenB} onChange={e => { setTokenB(e.target.value); if (e.target.value === tokenA) setTokenA(tokenB); }} style={inp}>
                {Object.keys(TOKEN_LIST).filter(s => !TOKEN_LIST[s].isNative).map(s => <option key={s} value={s}>{TOKEN_LIST[s].logo} {s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: theme.sub, marginBottom: 4 }}><span>{tokenA}</span><span>Bal: {fmtBal(balances[tokenA])}</span></div>
              <input type="number" placeholder={`Amount ${tokenA}`} value={amountA} onChange={e => setAmountA(e.target.value)} style={inp} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: theme.sub, marginBottom: 4 }}><span>{tokenB}</span><span>Bal: {fmtBal(balances[tokenB])}</span></div>
              <input type="number" placeholder={`Amount ${tokenB}`} value={amountB} onChange={e => setAmountB(e.target.value)} style={inp} />
            </div>
            <button onClick={handleAdd} disabled={poolLoading} style={{ width: "100%", backgroundColor: theme.accent, color: "#fff", border: "none", padding: 16, borderRadius: 16, fontWeight: 800, fontSize: 16, cursor: "pointer" }}>
              {poolLoading ? "⏳ Adding..." : "Add Liquidity"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ backgroundColor: "#fef3c7", padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 12, color: "#92400e" }}>
            <Info size={12} style={{ verticalAlign: "middle" }} /> Removing liquidity returns your tokens proportionally.
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: theme.sub, marginBottom: 4 }}><span>LP Amount</span><span>Your LP: {poolInfo.userLP}</span></div>
            <input type="number" placeholder="0.0" value={lpAmount} onChange={e => setLpAmount(e.target.value)} style={inp} />
          </div>
          <button onClick={handleRemove} disabled={poolLoading} style={{ width: "100%", backgroundColor: theme.red, color: "#fff", border: "none", padding: 16, borderRadius: 16, fontWeight: 800, fontSize: 16, cursor: "pointer" }}>
            {poolLoading ? "⏳ Removing..." : "Remove Liquidity"}
          </button>
        </>
      )}
    </div>
  );
}

/* ============ IL SIMULATOR + FEE CALCULATOR ============ */
function ILSimulatorPanel({ theme }) {
  // 4 preset scenarios
  const presets = [
    { name: "Stable", a: 0, b: 0, desc: "Both tokens stable" },
    { name: "Bull", a: 100, b: 0, desc: "Token A 2x, Token B flat" },
    { name: "Bear", a: -50, b: 0, desc: "Token A -50%, Token B flat" },
    { name: "Extreme", a: 300, b: 0, desc: "Token A 4x, Token B flat" },
  ];

  const [priceA, setPriceA] = useState(0);
  const [priceB, setPriceB] = useState(0);
  const [depositA, setDepositA] = useState(1000);
  const [depositB, setDepositB] = useState(1000);
  // Fee calculator states
  const [dailyVolume, setDailyVolume] = useState(50000);
  const [feeRate, setFeeRate] = useState(0.3);
  const [days, setDays] = useState(30);

  // IL calculations
  const P = (1 + priceA / 100) / (1 + priceB / 100);
  const il = (2 * Math.sqrt(P) / (1 + P) - 1) * 100;
  const hodl = depositA * (1 + priceA / 100) + depositB * (1 + priceB / 100);
  const poolVal = (depositA + depositB) * Math.sqrt((1 + priceA / 100) * (1 + priceB / 100));
  const lossAmount = hodl - poolVal;
  const totalDeposit = depositA + depositB;

  // Fee calculations
  const poolShare = totalDeposit / (totalDeposit + dailyVolume * 10); // Estimasi pool 10x daily vol
  const dailyFee = dailyVolume * (feeRate / 100) * poolShare;
  const totalFee = dailyFee * days;
  const netPnl = totalFee - lossAmount;

  // Risk colors
  const riskColor = Math.abs(il) < 1 ? theme.green : Math.abs(il) < 5 ? theme.yellow : theme.red;
  const riskLabel = Math.abs(il) < 1 ? "SAFE" : Math.abs(il) < 5 ? "MODERATE" : "HIGH RISK";
  const profitColor = netPnl >= 0 ? theme.green : theme.red;

  const card = { backgroundColor: theme.card, borderRadius: 24, padding: 24, border: `1px solid ${theme.border}`, width: "100%", maxWidth: 540 };
  const inp = { padding: 12, backgroundColor: theme.input, border: `1px solid ${theme.border}`, borderRadius: 10, color: theme.text, fontWeight: 700, fontSize: 14, width: "100%", boxSizing: "border-box" };

  return (
    <div style={card}>
      <h3 style={{ margin: "0 0 8px 0", fontSize: 20, fontWeight: 800 }}>
        <AlertTriangle size={20} style={{ verticalAlign: "middle", marginRight: 8, color: theme.yellow }} />
        IL Risk Simulator
      </h3>
      <p style={{ fontSize: 13, color: theme.sub, marginBottom: 16 }}>
        "Kalau harga token berubah, berapa rugi/ruginya kalau simpan di pool vs simpan di wallet?"
      </p>

      {/* Presets */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
        {presets.map(p => (
          <button key={p.name} onClick={() => { setPriceA(p.a); setPriceB(p.b); }} style={{
            padding: "8px 4px", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 11, cursor: "pointer",
            backgroundColor: priceA === p.a && priceB === p.b ? theme.accent : theme.input,
            color: priceA === p.a && priceB === p.b ? "#fff" : theme.sub
          }}>
            <div>{p.name}</div>
            <div style={{ fontSize: 9, fontWeight: 500, opacity: 0.8 }}>{p.desc}</div>
          </button>
        ))}
      </div>

      {/* Deposits */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div><label style={{ fontSize: 12, color: theme.sub, marginBottom: 4, display: "block" }}>Deposit Token A ($)</label><input type="number" value={depositA} onChange={e => setDepositA(Number(e.target.value))} style={inp} /></div>
        <div><label style={{ fontSize: 12, color: theme.sub, marginBottom: 4, display: "block" }}>Deposit Token B ($)</label><input type="number" value={depositB} onChange={e => setDepositB(Number(e.target.value))} style={inp} /></div>
      </div>

      {/* Sliders */}
      <div style={{ marginBottom: 12, padding: 12, backgroundColor: theme.input, borderRadius: 12, border: `1px solid ${theme.border}` }}>
        <label style={{ fontSize: 13, color: theme.sub, marginBottom: 6, display: "block" }}>
          Token A Price Change: <strong style={{ color: priceA >= 0 ? theme.green : theme.red }}>{priceA >= 0 ? "+" : ""}{priceA}%</strong>
        </label>
        <input type="range" min={-90} max={500} value={priceA} onChange={e => setPriceA(Number(e.target.value))} style={{ width: "100%" }} />
      </div>
      <div style={{ marginBottom: 20, padding: 12, backgroundColor: theme.input, borderRadius: 12, border: `1px solid ${theme.border}` }}>
        <label style={{ fontSize: 13, color: theme.sub, marginBottom: 6, display: "block" }}>
          Token B Price Change: <strong style={{ color: priceB >= 0 ? theme.green : theme.red }}>{priceB >= 0 ? "+" : ""}{priceB}%</strong>
        </label>
        <input type="range" min={-90} max={500} value={priceB} onChange={e => setPriceB(Number(e.target.value))} style={{ width: "100%" }} />
      </div>

      {/* IL Result */}
      <div style={{ backgroundColor: theme.input, padding: 20, borderRadius: 16, border: `1px solid ${theme.border}`, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
          <span style={{ color: theme.sub }}>💰 Simpan di Wallet (HODL)</span><strong>${hodl.toFixed(2)}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
          <span style={{ color: theme.sub }}>🏊 Simpan di Pool</span><strong>${poolVal.toFixed(2)}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, fontSize: 14, paddingBottom: 10, borderBottom: `1px solid ${theme.border}` }}>
          <span style={{ color: theme.sub }}>📉 Rugi IL</span><strong style={{ color: theme.red }}>-${lossAmount.toFixed(2)}</strong>
        </div>
        <div style={{ textAlign: "center", padding: "6px 0" }}>
          <div style={{ fontSize: 12, color: theme.sub, marginBottom: 4 }}>Impermanent Loss</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: riskColor }}>{il.toFixed(2)}%</div>
          <div style={{ display: "inline-block", marginTop: 4, padding: "3px 12px", borderRadius: 10, fontSize: 11, fontWeight: 800, backgroundColor: riskColor + "20", color: riskColor, border: `1px solid ${riskColor}` }}>{riskLabel}</div>
        </div>
      </div>

      {/* ═══════ FEE CALCULATOR (NEW!) ═══════ */}
      <div style={{ backgroundColor: "#ecfdf5", padding: 20, borderRadius: 16, border: "1px solid #a7f3d0", marginBottom: 20 }}>
        <h4 style={{ margin: "0 0 14px 0", fontSize: 16, fontWeight: 800, color: "#065f46" }}>
          💵 Fee Calculator (Offset IL)
        </h4>
        <p style={{ fontSize: 12, color: "#047857", marginBottom: 14 }}>
          Hitung berapa fee yang kamu dapatkan dari trading pool untuk menutupi rugi IL
        </p>

        {/* Fee inputs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: "#065f46", marginBottom: 4, display: "block" }}>Daily Volume ($)</label>
            <input type="number" value={dailyVolume} onChange={e => setDailyVolume(Number(e.target.value))} style={{ ...inp, borderColor: "#a7f3d0", backgroundColor: "#fff" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#065f46", marginBottom: 4, display: "block" }}>Fee Rate (%)</label>
            <select value={feeRate} onChange={e => setFeeRate(Number(e.target.value))} style={{ ...inp, borderColor: "#a7f3d0", backgroundColor: "#fff" }}>
              <option value={0.1}>0.1%</option>
              <option value={0.3}>0.3%</option>
              <option value={0.5}>0.5%</option>
              <option value={1.0}>1.0%</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#065f46", marginBottom: 4, display: "block" }}>Hari</label>
            <select value={days} onChange={e => setDays(Number(e.target.value))} style={{ ...inp, borderColor: "#a7f3d0", backgroundColor: "#fff" }}>
              <option value={7}>7 hari</option>
              <option value={30}>30 hari</option>
              <option value={90}>90 hari</option>
              <option value={365}>365 hari</option>
            </select>
          </div>
        </div>

        {/* Fee results */}
        <div style={{ backgroundColor: "#fff", padding: 16, borderRadius: 12, border: "1px solid #a7f3d0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
            <span style={{ color: "#065f46" }}>Pool Share (estimasi)</span>
            <strong>{(poolShare * 100).toFixed(2)}%</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
            <span style={{ color: "#065f46" }}>Fee per hari</span>
            <strong style={{ color: "#059669" }}>+${dailyFee.toFixed(2)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13, paddingBottom: 10, borderBottom: "1px solid #a7f3d0" }}>
            <span style={{ color: "#065f46" }}>Fee {days} hari</span>
            <strong style={{ color: "#059669" }}>+${totalFee.toFixed(2)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800 }}>
            <span style={{ color: "#065f46" }}>Nett (Fee - IL)</span>
            <strong style={{ color: profitColor }}>{netPnl >= 0 ? "+" : ""}${netPnl.toFixed(2)}</strong>
          </div>
        </div>

        {/* Verdict */}
        <div style={{ marginTop: 12, padding: 10, borderRadius: 10, fontSize: 12, fontWeight: 700, textAlign: "center", backgroundColor: netPnl >= 0 ? "#dcfce7" : "#fef3c7", color: netPnl >= 0 ? "#166534" : "#92400e" }}>
          {netPnl >= 0
            ? `✅ Worth it! Fee menutupi IL dalam ${days} hari`
            : `⚠️ Belum worth it. Butuh ${Math.ceil(lossAmount / dailyFee)} hari untuk break-even`
          }
        </div>
      </div>

      {/* Education */}
      <div style={{ padding: 12, backgroundColor: "#e0f2fe", borderRadius: 10, fontSize: 12, color: "#0c4a6e" }}>
        <strong>💡 Apa itu Impermanent Loss?</strong><br />
        Ketika harga 2 token di pool berubah tidak sama, DEX otomatis menjual token yang naik dan membeli token yang turun. Ini membuat nilai aset di pool lebih rendah daripada jika kamu hanya menyimpan token di wallet. Fee dari trader bisa menutupi rugi IL jika volume cukup tinggi.
      </div>
    </div>
  );
}

/* ============ STAKING (FUNCTIONAL) ============ */
function StakingPanel({ account, signer, theme, showToast, poolInfo, balances, updateBalances, addHistory }) {
  const [stakeAmt, setStakeAmt] = useState("");
  const [unstakeAmt, setUnstakeAmt] = useState("");
  const [stakeMode, setStakeMode] = useState("stake"); // stake | unstake
  const [loading, setLoading] = useState(false);

  // Load from localStorage
  const [stakedLP, setStakedLP] = useState(() => {
    try { return Number(localStorage.getItem("freesia_staked_lp") || "0"); } catch { return 0; }
  });
  const [mbgEarned, setMbgEarned] = useState(() => {
    try { return Number(localStorage.getItem("freesia_mbg_earned") || "0"); } catch { return 0; }
  });

  // Auto-accumulate reward every 10s
  useEffect(() => {
    if (stakedLP <= 0) return;
    const rewardPerSec = (stakedLP * 0.000001); // ~32.5% APY simulation
    const iv = setInterval(() => {
      setMbgEarned(prev => {
        const next = prev + rewardPerSec * 10;
        localStorage.setItem("freesia_mbg_earned", String(next));
        return next;
      });
    }, 10000);
    return () => clearInterval(iv);
  }, [stakedLP]);

  const handleStake = async () => {
    if (!account) return showToast("❌", "Connect wallet!");
    const amt = parseFloat(stakeAmt);
    if (!amt || amt <= 0) return showToast("❌", "Enter amount!");
    const available = parseFloat(poolInfo.userLP || "0");
    if (amt > available) return showToast("❌", `Max ${fmtBal(available)} LP available`);
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1500)); // Simulasi tx
      const newStaked = stakedLP + amt;
      setStakedLP(newStaked);
      localStorage.setItem("freesia_staked_lp", String(newStaked));
      showToast("🎉", `Staked ${amt} LP!`);
      addHistory("Stake", `Staked ${amt} LP`, "local");
      setStakeAmt("");
    } catch (err) {
      showToast("❌", "Stake failed");
    } finally { setLoading(false); }
  };

  const handleUnstake = async () => {
    if (!account) return showToast("❌", "Connect wallet!");
    const amt = parseFloat(unstakeAmt);
    if (!amt || amt <= 0) return showToast("❌", "Enter amount!");
    if (amt > stakedLP) return showToast("❌", `Max ${fmtBal(stakedLP)} LP staked`);
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      const newStaked = stakedLP - amt;
      setStakedLP(newStaked);
      localStorage.setItem("freesia_staked_lp", String(newStaked));
      showToast("✅", `Unstaked ${amt} LP!`);
      addHistory("Unstake", `Unstaked ${amt} LP`, "local");
      setUnstakeAmt("");
    } catch (err) {
      showToast("❌", "Unstake failed");
    } finally { setLoading(false); }
  };

  const handleClaim = async () => {
    if (mbgEarned <= 0) return showToast("❌", "No reward to claim");
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      showToast("✅", `Claimed ${mbgEarned.toFixed(6)} MBG!`);
      addHistory("Claim", `Claimed ${mbgEarned.toFixed(6)} MBG`, "local");
      setMbgEarned(0);
      localStorage.setItem("freesia_mbg_earned", "0");
    } catch (err) {
      showToast("❌", "Claim failed");
    } finally { setLoading(false); }
  };

  const card = { backgroundColor: theme.card, borderRadius: 24, padding: 24, border: `1px solid ${theme.border}`, width: "100%", maxWidth: 460 };
  const inp = { padding: 14, backgroundColor: theme.input, border: `1px solid ${theme.border}`, borderRadius: 12, color: theme.text, fontWeight: 700, fontSize: 16, width: "100%", boxSizing: "border-box" };

  return (
    <div style={card}>
      <h3 style={{ margin: "0 0 20px 0", fontSize: 20, fontWeight: 800 }}><Trophy size={20} style={{ verticalAlign: "middle", marginRight: 8 }} />MBG Staking</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ backgroundColor: theme.input, padding: 16, borderRadius: 12, border: `1px solid ${theme.border}`, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: theme.sub }}>LP Staked</div><div style={{ fontSize: 20, fontWeight: 800, color: theme.accent }}>{fmtBal(stakedLP)}</div>
        </div>
        <div style={{ backgroundColor: theme.input, padding: 16, borderRadius: 12, border: `1px solid ${theme.border}`, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: theme.sub }}>APY</div><div style={{ fontSize: 20, fontWeight: 800, color: theme.green }}>32.50%</div>
        </div>
      </div>

      {/* Reward */}
      <div style={{ backgroundColor: "#fef3c7", padding: 16, borderRadius: 12, border: "1px solid #fde68a", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ fontSize: 12, color: "#92400e" }}>MBG Earned</div><div style={{ fontSize: 24, fontWeight: 800, fontFamily: "monospace" }}>{mbgEarned.toFixed(6)}</div></div>
          <button onClick={handleClaim} disabled={mbgEarned <= 0 || loading} style={{ backgroundColor: mbgEarned > 0 ? theme.yellow : theme.border, border: "none", padding: "10px 18px", borderRadius: 10, fontWeight: 700, cursor: mbgEarned > 0 ? "pointer" : "not-allowed" }}>
            {loading ? "⏳" : "Claim"}
          </button>
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 4, backgroundColor: theme.input, borderRadius: 10, padding: 3, marginBottom: 16 }}>
        <button onClick={() => setStakeMode("stake")} style={{ flex: 1, padding: "8px 16px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", backgroundColor: stakeMode === "stake" ? theme.accent : "transparent", color: stakeMode === "stake" ? "#fff" : theme.sub }}>Stake</button>
        <button onClick={() => setStakeMode("unstake")} style={{ flex: 1, padding: "8px 16px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", backgroundColor: stakeMode === "unstake" ? theme.red : "transparent", color: stakeMode === "unstake" ? "#fff" : theme.sub }}>Unstake</button>
      </div>

      {stakeMode === "stake" ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: theme.sub, marginBottom: 8 }}>
            <span>LP Amount</span><span>Available: {fmtBal(poolInfo.userLP)} LP</span>
          </div>
          <input type="number" placeholder="0.0" value={stakeAmt} onChange={e => setStakeAmt(e.target.value)} style={{ ...inp, marginBottom: 12 }} />
          <button onClick={handleStake} disabled={loading} style={{ width: "100%", backgroundColor: "#111827", color: "#fff", border: "none", padding: 16, borderRadius: 12, fontWeight: 800, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "⏳ Locking..." : "Lock & Stake"}
          </button>
        </>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: theme.sub, marginBottom: 8 }}>
            <span>LP Amount</span><span>Staked: {fmtBal(stakedLP)} LP</span>
          </div>
          <input type="number" placeholder="0.0" value={unstakeAmt} onChange={e => setUnstakeAmt(e.target.value)} style={{ ...inp, marginBottom: 12 }} />
          <button onClick={handleUnstake} disabled={loading} style={{ width: "100%", backgroundColor: theme.red, color: "#fff", border: "none", padding: 16, borderRadius: 12, fontWeight: 800, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "⏳ Unlocking..." : "Unlock & Unstake"}
          </button>
        </>
      )}
    </div>
  );
}

/* ============ DASHBOARD ============ */
function DashboardPanel({ balances, txHistory, poolInfo, theme }) {
  const card = { backgroundColor: theme.card, borderRadius: 24, padding: 24, border: `1px solid ${theme.border}`, width: "100%", maxWidth: 600 };
  return (
    <div style={card}>
      <h3 style={{ margin: "0 0 20px 0", fontSize: 20, fontWeight: 800 }}><TrendingUp size={20} style={{ verticalAlign: "middle", marginRight: 8 }} />Dashboard</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Swaps", value: txHistory.filter(t => t.type === "Swap").length },
          { label: "Faucet Claims", value: txHistory.filter(t => t.type === "Faucet").length },
          { label: "LP Provided", value: poolInfo.userLP },
          { label: "Pool TXs", value: txHistory.filter(t => t.type === "Pool").length },
        ].map((s, i) => (
          <div key={i} style={{ backgroundColor: theme.input, padding: 16, borderRadius: 12, border: `1px solid ${theme.border}` }}>
            <div style={{ fontSize: 12, color: theme.sub }}>{s.label}</div><div style={{ fontSize: 20, fontWeight: 800 }}>{s.value}</div>
          </div>
        ))}
      </div>
      <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Wallet Balances</h4>
      {Object.entries(TOKEN_LIST).map(([sym, info]) => (
        <div key={sym} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${theme.border}` }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}><TokenLogo symbol={sym} size={24} /> {sym}</span>
          <strong>{fmtBal(balances[sym])}</strong>
        </div>
      ))}
    </div>
  );
}

/* ============ HISTORY ============ */
function HistoryPanel({ txHistory, theme }) {
  const card = { backgroundColor: theme.card, borderRadius: 24, padding: 24, border: `1px solid ${theme.border}`, width: "100%", maxWidth: 600 };
  return (
    <div style={card}>
      <h3 style={{ margin: "0 0 20px 0", fontSize: 20, fontWeight: 800 }}><Wallet size={20} style={{ verticalAlign: "middle", marginRight: 8 }} />Transaction History</h3>
      {txHistory.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: theme.sub }}><div style={{ fontSize: 40, marginBottom: 12 }}>📭</div><p>No transactions yet.</p></div>
      ) : (
        txHistory.map(tx => (
          <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, borderRadius: 10, backgroundColor: theme.input, border: `1px solid ${theme.border}`, marginBottom: 8 }}>
            <div><div style={{ fontWeight: 700, fontSize: 14 }}>{tx.type}</div><div style={{ fontSize: 12, color: theme.sub }}>{tx.detail}</div></div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: theme.sub }}>{tx.time}</div>
              {tx.hash && <a href={`${EXPLORER_URL}/tx/${tx.hash}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: theme.accent, textDecoration: "none" }}>View ↗</a>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ============ MAIN APP ============ */
export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState("swap");
  const [toast, setToast] = useState(null);
  const [balances, setBalances] = useState({});
  const [txHistory, setTxHistory] = useState([]);
  const [ltcPrice, setLtcPrice] = useState({ price: "...", change: "0" });
  const [poolInfo, setPoolInfo] = useState({ reserveA: "0", reserveB: "0", userLP: "0" });

  const theme = useTheme(darkMode);

  const showToastCb = useCallback((icon, msg) => { setToast({ icon, msg }); setTimeout(() => setToast(null), 4000); }, []);
  const addHistory = (type, detail, hash = "") => { setTxHistory(prev => [{ id: Date.now(), type, detail, time: new Date().toLocaleTimeString("id-ID"), hash }, ...prev].slice(0, 50)); };

  useEffect(() => { const fetchPrice = async () => { try { const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd&include_24hr_change=true"); const data = await res.json(); setLtcPrice({ price: data.litecoin.usd.toFixed(2), change: data.litecoin.usd_24h_change.toFixed(2) }); } catch (e) {} }; fetchPrice(); const iv = setInterval(fetchPrice, 60000); return () => clearInterval(iv); }, []);

  const connectWallet = async () => {
    if (!window.ethereum) { showToastCb("❌", "Install MetaMask!"); return; }
    setConnecting(true);
    try {
      const accs = await window.ethereum.request({ method: "eth_requestAccounts" });
      const prov = new ethers.BrowserProvider(window.ethereum);
      const net = await prov.getNetwork();
      if (Number(net.chainId) !== CHAIN_ID) { await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x" + CHAIN_ID.toString(16) }] }); }
      const sig = await prov.getSigner();
      setProvider(prov); setSigner(sig); setAccount(accs[0]);
      showToastCb("✅", "Wallet Connected!"); updateBalances(prov, accs[0]);
    } catch (err) { showToastCb("❌", "Connection Failed"); } finally { setConnecting(false); }
  };

  const updateBalances = async (prov, addr) => {
    if (!prov || !addr) return;
    try {
      const native = await prov.getBalance(addr);
      const bals = { zkLTC: parseFloat(ethers.formatEther(native)).toFixed(4) };
      for (const [sym, info] of Object.entries(TOKEN_LIST)) { if (info.isNative) continue; const contract = new ethers.Contract(info.address, ERC20_ABI, prov); const bal = await contract.balanceOf(addr); bals[sym] = parseFloat(ethers.formatUnits(bal, info.decimals)).toFixed(4); }
      setBalances(bals);
    } catch (e) {}
  };

  useEffect(() => { if (account && provider) { updateBalances(provider, account); const iv = setInterval(() => updateBalances(provider, account), 10000); return () => clearInterval(iv); } }, [account, provider]);

  useEffect(() => { const load = async () => { try { const prov = provider || new ethers.JsonRpcProvider(LITVM_RPC); const pool = new ethers.Contract(CONTRACTS.POOL, POOL_ABI, prov); const [resA, resB] = await pool.getReserves(); let userLPVal = 0n; if (account) { try { userLPVal = await pool.getUserLP(account); } catch (e) {} } setPoolInfo({ reserveA: parseFloat(ethers.formatUnits(resA, 6)).toFixed(2), reserveB: parseFloat(ethers.formatUnits(resB, 18)).toFixed(2), userLP: parseFloat(ethers.formatUnits(userLPVal, 18)).toFixed(4) }); } catch (e) {} }; load(); const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [provider, account]);

  const copyAddress = () => { if (account) { navigator.clipboard.writeText(account); showToastCb("✅", "Address copied!"); } };

  if (showLanding) return <LandingPage onLaunch={() => setShowLanding(false)} />;

  const tabs = [
    { id: "swap", label: "Swap", icon: "🔄" },
    { id: "faucet", label: "Faucet", icon: "🚰" },
    { id: "pool", label: "Pool", icon: "🏊" },
    { id: "il", label: "IL Sim", icon: "🛡️" },
    { id: "staking", label: "Staking", icon: "💎" },
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "history", label: "History", icon: "📋" },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: theme.bg, color: theme.text, fontFamily: "system-ui, sans-serif" }}>
      <Toast toast={toast} theme={theme} />
      <div style={{ display: "flex", gap: 24, justifyContent: "center", padding: 10, backgroundColor: theme.card, borderBottom: `1px solid ${theme.border}`, fontSize: 12, color: theme.sub }}>
        <span>LTC/USD <strong style={{ color: parseFloat(ltcPrice.change) >= 0 ? theme.green : theme.red }}>${ltcPrice.price}</strong></span>
        <span>24h <strong style={{ color: parseFloat(ltcPrice.change) >= 0 ? theme.green : theme.red }}>{ltcPrice.change}%</strong></span>
        <span>Pool TVL <strong style={{ color: theme.green }}>${poolInfo.reserveA > "0" ? (parseFloat(poolInfo.reserveA) + parseFloat(poolInfo.reserveB)).toFixed(0) : "—"}</strong></span>
      </div>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: 20 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, paddingBottom: 20, borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setShowLanding(true)}>
            <Logo size={36} />
            <div>
              <h1 style={{ fontSize: 22, margin: 0, fontWeight: 900, color: theme.text }}>Freesia DEX</h1>
              <span style={{ fontSize: 12, color: theme.green, display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={12} /> LitVM Live</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button onClick={() => setDarkMode(!darkMode)} style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: 10, padding: 8, cursor: "pointer", color: theme.sub }}>{darkMode ? <Sun size={16} /> : <Moon size={16} />}</button>
            <a href={EXPLORER_URL} target="_blank" rel="noreferrer" style={{ color: theme.sub, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>Explorer ↗</a>
            {account ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: theme.input, padding: "8px 14px", borderRadius: 12, border: `1px solid ${theme.border}` }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{account.slice(0, 6)}...{account.slice(-4)}</span>
                <button onClick={copyAddress} style={{ background: "none", border: "none", cursor: "pointer", color: theme.sub, padding: 0 }}><Copy size={14} /></button>
              </div>
            ) : (
              <button onClick={connectWallet} disabled={connecting} style={{ backgroundColor: theme.accent, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 12, fontWeight: 700, cursor: "pointer" }}>{connecting ? "..." : "Connect Wallet"}</button>
            )}
          </div>
        </header>
        <div style={{ display: "flex", gap: 8, marginBottom: 30, flexWrap: "wrap", justifyContent: "center" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: "10px 20px", border: "none", borderRadius: 12, backgroundColor: activeTab === t.id ? theme.accent : theme.input, color: activeTab === t.id ? "#fff" : theme.sub, fontWeight: 700, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          {activeTab === "swap" && <SwapPanel account={account} signer={signer} provider={provider} balances={balances} updateBalances={updateBalances} showToast={showToastCb} theme={theme} addHistory={addHistory} />}
          {activeTab === "faucet" && <FaucetPanel account={account} signer={signer} provider={provider} balances={balances} updateBalances={updateBalances} showToast={showToastCb} theme={theme} addHistory={addHistory} />}
          {activeTab === "pool" && <PoolPanel account={account} signer={signer} provider={provider} balances={balances} updateBalances={updateBalances} showToast={showToastCb} theme={theme} addHistory={addHistory} poolInfo={poolInfo} />}
          {activeTab === "il" && <ILSimulatorPanel theme={theme} />}
          {activeTab === "staking" && <StakingPanel account={account} signer={signer} theme={theme} showToast={showToastCb} poolInfo={poolInfo} balances={balances} updateBalances={updateBalances} addHistory={addHistory} />}
          {activeTab === "dashboard" && <DashboardPanel balances={balances} txHistory={txHistory} poolInfo={poolInfo} theme={theme} />}
          {activeTab === "history" && <HistoryPanel txHistory={txHistory} theme={theme} />}
        </div>
        <footer style={{ textAlign: "center", marginTop: 60, padding: "30px 0", borderTop: `1px solid ${theme.border}` }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 16 }}>
            <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: theme.sub, fontSize: 20, textDecoration: "none" }}>𝕏</a>
            <a href="https://github.com/Muhammadzack/freesia-dex-frontend-" target="_blank" rel="noreferrer" style={{ color: theme.sub, fontSize: 20, textDecoration: "none" }}>🐙</a>
          </div>
          <p style={{ fontSize: 12, color: theme.sub }}>© 2026 Freesia DEX. Built by <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: theme.accent, textDecoration: "none" }}>@0xzackbh</a> on LitVM Testnet.</p>
        </footer>
      </div>
    </div>
  );
}
