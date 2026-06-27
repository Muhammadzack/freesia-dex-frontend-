import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  ArrowUpDown, Settings, CheckCircle2, TrendingUp,
  Layers, Trophy, Wallet, Sun, Moon, Copy, ExternalLink,
  Droplets, AlertTriangle, Info, RefreshCw
} from "lucide-react";
import LogoDex from "./LogoDex";

/* ═══════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════ */
const CONTRACTS = {
  USDC: "0xCa2AC72dAC6d88a21765971f4A6AA917e12553Dd",
  DAI:  "0x961B942b0f7e44622584Cb001DEC642b01573Acf",
  USDT: "0x7B00A91DaDDA4124D5d1D4F10E6CAc338911700A",
  MBG:  "0x943a23d4ee276C2598D04C9e143b8b67b3829CFe",
  POOL: "0x49C738De9b7bED753bC25E91A58dC58EA889f585",
};

const TOKEN_LIST: Record<string, { name: string; logo: string; decimals: number; address: string; isNative?: boolean }> = {
  zkLTC: { name: "zkLTC", logo: "⚡", decimals: 18, address: "NATIVE", isNative: true },
  USDC:  { name: "USDC",  logo: "💵", decimals: 6,  address: CONTRACTS.USDC },
  DAI:   { name: "DAI",   logo: "◈", decimals: 18, address: CONTRACTS.DAI },
  USDT:  { name: "USDT",  logo: "💲", decimals: 6,  address: CONTRACTS.USDT },
  MBG:   { name: "MBG",   logo: "🌸", decimals: 18, address: CONTRACTS.MBG },
};

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function faucet(uint256 amount) external",
  "function decimals() view returns (uint8)",
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

declare global {
  interface Window {
    ethereum?: any;
  }
}

/* ═══════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════ */
function useTheme(darkMode: boolean) {
  return {
    bg: darkMode ? "#0f172a" : "#f0fdf4",
    card: darkMode ? "#1e293b" : "#ffffff",
    input: darkMode ? "#0f172a" : "#f0fdf4",
    border: darkMode ? "#334155" : "#e2e8f0",
    text: darkMode ? "#f1f5f9" : "#0f172a",
    sub: darkMode ? "#94a3b8" : "#64748b",
    accent: "#0d9488",
    accent2: "#14b8a6",
    green: "#22c55e",
    red: "#ef4444",
    yellow: "#fbbf24",
    purple: "#8b5cf6",
  };
}

/* ═══════════════════════════════════════════
   TOAST
   ═══════════════════════════════════════════ */
function Toast({ toast, theme }: { toast: { icon: string; msg: string } | null; theme: ReturnType<typeof useTheme> }) {
  if (!toast) return null;
  return (
    <div style={{
      position: "fixed", top: "20px", right: "20px", zIndex: 1000,
      backgroundColor: theme.card, padding: "14px 24px", borderRadius: "16px",
      border: `2px solid ${theme.border}`, boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      fontWeight: 700, display: "flex", alignItems: "center", gap: "10px",
      color: theme.text, animation: "slideIn 0.3s ease",
    }}>
      <span style={{ fontSize: "20px" }}>{toast.icon}</span> {toast.msg}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SWAP PANEL
   ═══════════════════════════════════════════ */
function SwapPanel({ account, signer, provider, balances, updateBalances, showToast, theme, addHistory }: any) {
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
    } catch (err: any) {
      showToast("❌", "Swap failed: " + (err.reason || err.message || "").slice(0, 60));
    } finally { setSwapLoading(false); }
  };

  const cardStyle = { backgroundColor: theme.card, borderRadius: "24px", padding: "24px", border: `1px solid ${theme.border}`, boxShadow: "0 10px 40px rgba(13,148,136,0.1)" };

  return (
    <div style={{ ...cardStyle, width: "100%", maxWidth: "460px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>Swap Tokens</h3>
        <button onClick={() => setShowSlippage(!showSlippage)} style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: "8px", padding: "6px 10px", cursor: "pointer", color: theme.sub, fontSize: "12px" }}>
          <Settings size={14} style={{ verticalAlign: "middle" }} /> {slippage}%
        </button>
      </div>

      {showSlippage && (
        <div style={{ backgroundColor: theme.input, padding: "12px", borderRadius: "12px", marginBottom: "16px", border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: "12px", color: theme.sub, marginBottom: "8px" }}>Slippage Tolerance</div>
          <div style={{ display: "flex", gap: "8px" }}>
            {[0.1, 0.5, 1.0, 2.0].map(v => (
              <button key={v} onClick={() => setSlippage(v)} style={{
                flex: 1, padding: "8px", borderRadius: "8px",
                border: slippage === v ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
                backgroundColor: slippage === v ? theme.accent : "transparent",
                color: slippage === v ? "#fff" : theme.sub,
                fontWeight: 700, cursor: "pointer", fontSize: "13px"
              }}>{v}%</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ backgroundColor: theme.input, padding: "16px", borderRadius: "16px", border: `1px solid ${theme.border}`, marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: theme.sub, marginBottom: "8px" }}>
          <span>You Pay</span>
          <span>Balance: {balances[fromSym] || "0.00"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <input type="number" placeholder="0.0" value={amountIn} onChange={e => setAmountIn(e.target.value)} style={{ background: "transparent", border: "none", color: theme.text, fontSize: "28px", width: "55%", outline: "none", fontWeight: 700 }} />
          <select value={fromSym} onChange={e => setFromSym(e.target.value)} style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: "20px", padding: "8px 14px", fontWeight: 700, color: theme.text, outline: "none", cursor: "pointer" }}>
            {Object.keys(TOKEN_LIST).map(s => <option key={s} value={s}>{TOKEN_LIST[s].logo} {s}</option>)}
          </select>
        </div>
      </div>

      <div style={{ textAlign: "center", margin: "-8px 0", position: "relative", zIndex: 2 }}>
        <button onClick={() => { setFromSym(toSym); setToSym(fromSym); }} style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", color: theme.sub }}>
          <ArrowUpDown size={16} />
        </button>
      </div>

      <div style={{ backgroundColor: theme.input, padding: "16px", borderRadius: "16px", border: `1px solid ${theme.border}`, marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: theme.sub, marginBottom: "8px" }}>
          <span>You Receive (estimated)</span>
          <span>Balance: {balances[toSym] || "0.00"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <input type="text" placeholder="0.0" value={amountOut} readOnly style={{ background: "transparent", border: "none", color: theme.sub, fontSize: "28px", width: "55%", outline: "none", fontWeight: 700 }} />
          <div style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: "20px", padding: "8px 14px", fontWeight: 700, color: theme.text }}>
            {TOKEN_LIST[toSym].logo} {toSym}
          </div>
        </div>
      </div>

      <button onClick={handleSwap} disabled={!account || !amountIn || swapLoading} style={{
        width: "100%", backgroundColor: !account ? theme.border : theme.accent, color: "#fff", border: "none",
        padding: "16px", borderRadius: "16px", fontWeight: 800, fontSize: "16px",
        cursor: account && amountIn ? "pointer" : "not-allowed", opacity: account && amountIn ? 1 : 0.6
      }}>
        {!account ? "Connect Wallet" : swapLoading ? "⏳ Swapping..." : `Swap ${fromSym} → ${toSym}`}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   FAUCET PANEL (FIXED)
   ═══════════════════════════════════════════ */
function FaucetPanel({ account, signer, provider, balances, updateBalances, showToast, theme, addHistory }: any) {
  const [mintingSym, setMintingSym] = useState<string | null>(null);
  const [faucetError, setFaucetError] = useState<Record<string, string>>({});
  const [faucetSuccess, setFaucetSuccess] = useState<Record<string, boolean>>({});

  const handleFaucet = async (sym: string) => {
    if (!signer || !account) return showToast("❌", "Connect wallet!");
    if (sym === "zkLTC") {
      window.open("https://faucet.liteforge.xyz/", "_blank");
      return;
    }
    setMintingSym(sym);
    setFaucetError(prev => ({ ...prev, [sym]: "" }));
    setFaucetSuccess(prev => ({ ...prev, [sym]: false }));
    try {
      const addr = TOKEN_LIST[sym].address;
      const token = new ethers.Contract(addr, ERC20_ABI, signer);
      showToast("⏳", `Claiming ${FAUCET_AMOUNT} ${sym}...`);
      const tx = await token.faucet(ethers.parseUnits(FAUCET_AMOUNT, TOKEN_LIST[sym].decimals), { gasLimit: 300000 });
      await tx.wait();
      showToast("✅", `Got ${FAUCET_AMOUNT} ${sym}!`);
      setFaucetSuccess(prev => ({ ...prev, [sym]: true }));
      addHistory("Faucet", `${FAUCET_AMOUNT} ${sym}`, tx.hash);
      updateBalances(provider, account);
      setTimeout(() => setFaucetSuccess(prev => ({ ...prev, [sym]: false })), 5000);
    } catch (err: any) {
      const msg = (err.reason || err.message || "").slice(0, 80);
      showToast("❌", `Faucet failed: ${msg}`);
      setFaucetError(prev => ({ ...prev, [sym]: msg }));
    } finally { setMintingSym(null); }
  };

  const cardStyle = { backgroundColor: theme.card, borderRadius: "24px", padding: "24px", border: `1px solid ${theme.border}`, width: "100%", maxWidth: "460px" };

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: "0 0 8px 0", textAlign: "center", fontSize: "20px", fontWeight: 800 }}>
        <Droplets size={20} style={{ verticalAlign: "middle", marginRight: "8px" }} />
        Faucet Hub
      </h3>
      <p style={{ fontSize: "13px", color: theme.sub, textAlign: "center", marginBottom: "24px" }}>
        Claim free test tokens for LitVM Testnet<br />
        <span style={{ fontSize: "11px" }}>({FAUCET_AMOUNT} tokens per claim)</span>
      </p>

      {Object.entries(TOKEN_LIST).map(([sym, info]) => (
        <div key={sym} style={{
          backgroundColor: theme.input, padding: "16px", borderRadius: "16px",
          border: `1px solid ${faucetSuccess[sym] ? "#22c55e" : theme.border}`,
          marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center",
          transition: "border-color 0.3s"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "32px" }}>{info.logo}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: "16px" }}>{sym}</div>
              <div style={{ fontSize: "12px", color: theme.green, fontWeight: 600 }}>Balance: {balances[sym] || "0.00"}</div>
              {faucetError[sym] && (
                <div style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px", maxWidth: "200px" }}>
                  <AlertTriangle size={10} style={{ verticalAlign: "middle" }} /> {faucetError[sym]}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => handleFaucet(sym)}
            disabled={mintingSym === sym}
            style={{
              backgroundColor: sym === "zkLTC" ? theme.border : faucetSuccess[sym] ? "#22c55e" : theme.accent,
              color: "#fff", border: "none", padding: "10px 18px", borderRadius: "12px",
              fontWeight: 700, cursor: sym === "zkLTC" ? "pointer" : mintingSym === sym ? "wait" : "pointer",
              opacity: mintingSym === sym ? 0.7 : 1,
              display: "flex", alignItems: "center", gap: "6px"
            }}
          >
            {mintingSym === sym ? (
              <><RefreshCw size={14} className="spin" /> Claiming...</>
            ) : sym === "zkLTC" ? (
              <><ExternalLink size={14} /> External</>
            ) : faucetSuccess[sym] ? (
              <><CheckCircle2 size={14} /> Claimed!</>
            ) : (
              <><Droplets size={14} /> Faucet {FAUCET_AMOUNT}</>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   POOL PANEL (FIXED + IMPROVED)
   ═══════════════════════════════════════════ */
function PoolPanel({ account, signer, provider, balances, updateBalances, showToast, theme, addHistory, poolInfo }: any) {
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [poolLoading, setPoolLoading] = useState(false);
  const [poolMode, setPoolMode] = useState("add");
  const [tokenA, setTokenA] = useState("USDC");
  const [tokenB, setTokenB] = useState("DAI");
  const [lpAmount, setLpAmount] = useState("");
  const [approving, setApproving] = useState<Record<string, boolean>>({});

  const tokenAAddr = TOKEN_LIST[tokenA]?.isNative ? null : TOKEN_LIST[tokenA]?.address;
  const tokenBAddr = TOKEN_LIST[tokenB]?.isNative ? null : TOKEN_LIST[tokenB]?.address;

  const handleApprove = async (tokenSym: string) => {
    if (!signer || !account) return showToast("❌", "Connect wallet!");
    const addr = TOKEN_LIST[tokenSym].address;
    setApproving(prev => ({ ...prev, [tokenSym]: true }));
    try {
      const token = new ethers.Contract(addr, ERC20_ABI, signer);
      showToast("⏳", `Approving ${tokenSym}...`);
      await (await token.approve(CONTRACTS.POOL, ethers.MaxUint256)).wait();
      showToast("✅", `${tokenSym} approved!`);
    } catch (err: any) {
      showToast("❌", `Approve failed: ${(err.reason || "").slice(0, 50)}`);
    } finally { setApproving(prev => ({ ...prev, [tokenSym]: false })); }
  };

  const handleAddLiquidity = async () => {
    if (!signer || !account) return showToast("❌", "Connect wallet!");
    if (!amountA || !amountB || parseFloat(amountA) <= 0 || parseFloat(amountB) <= 0)
      return showToast("❌", "Enter both amounts!");
    setPoolLoading(true);
    try {
      const amtA = ethers.parseUnits(String(amountA), TOKEN_LIST[tokenA].decimals);
      const amtB = ethers.parseUnits(String(amountB), TOKEN_LIST[tokenB].decimals);
      const pool = new ethers.Contract(CONTRACTS.POOL, POOL_ABI, signer);

      if (tokenAAddr) {
        const tA = new ethers.Contract(tokenAAddr, ERC20_ABI, signer);
        const allA = await tA.allowance(account, CONTRACTS.POOL);
        if (allA < amtA) {
          showToast("⏳", `Approving ${tokenA}...`);
          await (await tA.approve(CONTRACTS.POOL, ethers.MaxUint256)).wait();
        }
      }
      if (tokenBAddr) {
        const tB = new ethers.Contract(tokenBAddr, ERC20_ABI, signer);
        const allB = await tB.allowance(account, CONTRACTS.POOL);
        if (allB < amtB) {
          showToast("⏳", `Approving ${tokenB}...`);
          await (await tB.approve(CONTRACTS.POOL, ethers.MaxUint256)).wait();
        }
      }

      showToast("⏳", "Adding liquidity...");
      const tx = await pool.addLiquidity(tokenAAddr || CONTRACTS.USDC, tokenBAddr || CONTRACTS.DAI, amtA, amtB, { gasLimit: 500000 });
      await tx.wait();
      showToast("🎉", "Liquidity added successfully!");
      addHistory("Pool", `Added ${amountA} ${tokenA} + ${amountB} ${tokenB}`, tx.hash);
      setAmountA(""); setAmountB("");
      updateBalances(provider, account);
    } catch (err: any) {
      showToast("❌", "Pool failed: " + (err.reason || err.message || "").slice(0, 60));
    } finally { setPoolLoading(false); }
  };

  const handleRemoveLiquidity = async () => {
    if (!signer || !account) return showToast("❌", "Connect wallet!");
    if (!lpAmount || parseFloat(lpAmount) <= 0) return showToast("❌", "Enter LP amount!");
    if (parseFloat(lpAmount) > parseFloat(poolInfo.userLP)) return showToast("❌", "Insufficient LP balance!");
    setPoolLoading(true);
    try {
      const lpAmt = ethers.parseUnits(String(lpAmount), 18);
      const pool = new ethers.Contract(CONTRACTS.POOL, POOL_ABI, signer);
      showToast("⏳", "Removing liquidity...");
      const tx = await pool.removeLiquidity(tokenAAddr || CONTRACTS.USDC, tokenBAddr || CONTRACTS.DAI, lpAmt, { gasLimit: 500000 });
      await tx.wait();
      showToast("🎉", "Liquidity removed!");
      addHistory("Pool", `Removed ${lpAmount} LP`, tx.hash);
      setLpAmount("");
      updateBalances(provider, account);
    } catch (err: any) {
      showToast("❌", "Remove failed: " + (err.reason || err.message || "").slice(0, 60));
    } finally { setPoolLoading(false); }
  };

  const cardStyle = { backgroundColor: theme.card, borderRadius: "24px", padding: "24px", border: `1px solid ${theme.border}`, width: "100%", maxWidth: "500px" };
  const inputStyle = { padding: "14px", backgroundColor: theme.input, border: `1px solid ${theme.border}`, borderRadius: "12px", color: theme.text, fontWeight: 700, fontSize: "16px", width: "100%", boxSizing: "border-box" as const };

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 800 }}>
          <Layers size={20} style={{ verticalAlign: "middle", marginRight: "8px" }} />
          Liquidity Pools
        </h3>
        <div style={{ display: "flex", gap: "4px", backgroundColor: theme.input, borderRadius: "10px", padding: "3px" }}>
          <button onClick={() => setPoolMode("add")} style={{
            padding: "8px 16px", borderRadius: "8px", border: "none", fontWeight: 700, fontSize: "13px", cursor: "pointer",
            backgroundColor: poolMode === "add" ? theme.accent : "transparent", color: poolMode === "add" ? "#fff" : theme.sub
          }}>Add</button>
          <button onClick={() => setPoolMode("remove")} style={{
            padding: "8px 16px", borderRadius: "8px", border: "none", fontWeight: 700, fontSize: "13px", cursor: "pointer",
            backgroundColor: poolMode === "remove" ? theme.red : "transparent", color: poolMode === "remove" ? "#fff" : theme.sub
          }}>Remove</button>
        </div>
      </div>

      <div style={{ backgroundColor: theme.input, padding: "16px", borderRadius: "16px", border: `1px solid ${theme.border}`, marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "14px" }}>
          <span style={{ color: theme.sub }}>Pool TVL</span>
          <strong style={{ color: theme.green }}>${poolInfo.reserveA > 0 ? (parseFloat(poolInfo.reserveA) + parseFloat(poolInfo.reserveB)).toFixed(2) : "—"}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "14px" }}>
          <span style={{ color: theme.sub }}>Reserve {tokenA}</span>
          <strong>{poolInfo.reserveA}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "14px" }}>
          <span style={{ color: theme.sub }}>Reserve {tokenB}</span>
          <strong>{poolInfo.reserveB}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
          <span style={{ color: theme.sub }}>Your LP</span>
          <strong style={{ color: theme.accent }}>{poolInfo.userLP}</strong>
        </div>
      </div>

      {poolMode === "add" ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
            <div>
              <label style={{ fontSize: "12px", color: theme.sub, marginBottom: "4px", display: "block" }}>Token A</label>
              <select value={tokenA} onChange={e => { setTokenA(e.target.value); if (e.target.value === tokenB) setTokenB(tokenA); }} style={inputStyle}>
                {Object.keys(TOKEN_LIST).filter(s => !TOKEN_LIST[s].isNative).map(s => <option key={s} value={s}>{TOKEN_LIST[s].logo} {s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "12px", color: theme.sub, marginBottom: "4px", display: "block" }}>Token B</label>
              <select value={tokenB} onChange={e => { setTokenB(e.target.value); if (e.target.value === tokenA) setTokenA(tokenB); }} style={inputStyle}>
                {Object.keys(TOKEN_LIST).filter(s => !TOKEN_LIST[s].isNative).map(s => <option key={s} value={s}>{TOKEN_LIST[s].logo} {s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: theme.sub, marginBottom: "4px" }}>
                <span>{tokenA} Amount</span>
                <span>Balance: {balances[tokenA] || "0.00"}</span>
              </div>
              <input type="number" placeholder={`Amount ${tokenA}`} value={amountA} onChange={e => setAmountA(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: theme.sub, marginBottom: "4px" }}>
                <span>{tokenB} Amount</span>
                <span>Balance: {balances[tokenB] || "0.00"}</span>
              </div>
              <input type="number" placeholder={`Amount ${tokenB}`} value={amountB} onChange={e => setAmountB(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => handleApprove(tokenA)} disabled={approving[tokenA]} style={{ flex: 1, backgroundColor: theme.yellow, color: "#000", border: "none", padding: "10px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: "12px" }}>
                {approving[tokenA] ? "..." : `Approve ${tokenA}`}
              </button>
              <button onClick={() => handleApprove(tokenB)} disabled={approving[tokenB]} style={{ flex: 1, backgroundColor: theme.yellow, color: "#000", border: "none", padding: "10px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: "12px" }}>
                {approving[tokenB] ? "..." : `Approve ${tokenB}`}
              </button>
            </div>
            <button onClick={handleAddLiquidity} disabled={poolLoading} style={{
              width: "100%", backgroundColor: theme.accent, color: "#fff", border: "none",
              padding: "16px", borderRadius: "16px", fontWeight: 800, fontSize: "16px", cursor: "pointer"
            }}>
              {poolLoading ? "⏳ Adding..." : "Add Liquidity"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ backgroundColor: "#fef3c7", padding: "12px", borderRadius: "10px", marginBottom: "16px", fontSize: "12px", color: "#92400e" }}>
            <Info size={12} style={{ verticalAlign: "middle", marginRight: "4px" }} />
            Removing liquidity returns your tokens proportionally from the pool reserves.
          </div>
          <div style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: theme.sub, marginBottom: "4px" }}>
              <span>LP Amount to Remove</span>
              <span>Your LP: {poolInfo.userLP}</span>
            </div>
            <input type="number" placeholder="0.0" value={lpAmount} onChange={e => setLpAmount(e.target.value)} style={inputStyle} />
          </div>
          <button onClick={handleRemoveLiquidity} disabled={poolLoading} style={{
            width: "100%", backgroundColor: theme.red, color: "#fff", border: "none",
            padding: "16px", borderRadius: "16px", fontWeight: 800, fontSize: "16px", cursor: "pointer"
          }}>
            {poolLoading ? "⏳ Removing..." : "Remove Liquidity"}
          </button>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   IL SIMULATOR PANEL (NEW!)
   ═══════════════════════════════════════════ */
function ILSimulatorPanel({ theme }: { theme: ReturnType<typeof useTheme> }) {
  const [priceChangeA, setPriceChangeA] = useState(0);
  const [priceChangeB, setPriceChangeB] = useState(50);
  const [depositA, setDepositA] = useState(1000);
  const [depositB, setDepositB] = useState(1000);

  const P = (1 + priceChangeA / 100) / (1 + priceChangeB / 100);
  const il = (2 * Math.sqrt(P) / (1 + P) - 1) * 100;
  const hodlValue = depositA * (1 + priceChangeA / 100) + depositB * (1 + priceChangeB / 100);
  const poolValue = (depositA + depositB) * Math.sqrt((1 + priceChangeA / 100) * (1 + priceChangeB / 100));

  const cardStyle = { backgroundColor: theme.card, borderRadius: "24px", padding: "24px", border: `1px solid ${theme.border}`, width: "100%", maxWidth: "500px" };
  const inputStyle = { padding: "12px", backgroundColor: theme.input, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, fontWeight: 700, fontSize: "14px", width: "100%", boxSizing: "border-box" as const };

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: 800 }}>
        <AlertTriangle size={20} style={{ verticalAlign: "middle", marginRight: "8px", color: theme.yellow }} />
        IL Risk Simulator
      </h3>
      <p style={{ fontSize: "13px", color: theme.sub, marginBottom: "20px" }}>Preview impermanent loss before adding liquidity</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
        <div>
          <label style={{ fontSize: "12px", color: theme.sub, marginBottom: "4px", display: "block" }}>Deposit A ($)</label>
          <input type="number" value={depositA} onChange={e => setDepositA(Number(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: "12px", color: theme.sub, marginBottom: "4px", display: "block" }}>Deposit B ($)</label>
          <input type="number" value={depositB} onChange={e => setDepositB(Number(e.target.value))} style={inputStyle} />
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ fontSize: "12px", color: theme.sub, marginBottom: "8px", display: "block" }}>
          Token A Price Change: <strong>{priceChangeA}%</strong>
        </label>
        <input type="range" min={-90} max={500} value={priceChangeA} onChange={e => setPriceChangeA(Number(e.target.value))} style={{ width: "100%" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: theme.sub }}>
          <span>-90%</span><span>0%</span><span>+500%</span>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ fontSize: "12px", color: theme.sub, marginBottom: "8px", display: "block" }}>
          Token B Price Change: <strong>{priceChangeB}%</strong>
        </label>
        <input type="range" min={-90} max={500} value={priceChangeB} onChange={e => setPriceChangeB(Number(e.target.value))} style={{ width: "100%" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: theme.sub }}>
          <span>-90%</span><span>0%</span><span>+500%</span>
        </div>
      </div>

      <div style={{ backgroundColor: theme.input, padding: "20px", borderRadius: "16px", border: `1px solid ${theme.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ color: theme.sub }}>HODL Value</span>
          <strong>${hodlValue.toFixed(2)}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ color: theme.sub }}>Pool Value</span>
          <strong>${poolValue.toFixed(2)}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "10px", borderTop: `1px solid ${theme.border}` }}>
          <span style={{ fontWeight: 700 }}>Impermanent Loss</span>
          <strong style={{ color: il <= 0 ? theme.green : theme.red, fontSize: "20px" }}>{il.toFixed(2)}%</strong>
        </div>
        {il < -5 && (
          <div style={{ marginTop: "10px", padding: "8px", backgroundColor: "#fef3c7", borderRadius: "8px", fontSize: "12px", color: "#92400e" }}>
            <AlertTriangle size={12} style={{ verticalAlign: "middle" }} /> High IL risk! Consider your position carefully.
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STAKING PANEL
   ═══════════════════════════════════════════ */
function StakingPanel({ theme, showToast }: { theme: ReturnType<typeof useTheme>; showToast: (icon: string, msg: string) => void }) {
  const [stakeAmt, setStakeAmt] = useState("");
  const [mbgEarned, setMbgEarned] = useState(0);

  const cardStyle = { backgroundColor: theme.card, borderRadius: "24px", padding: "24px", border: `1px solid ${theme.border}`, width: "100%", maxWidth: "460px" };

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: 800 }}>
        <Trophy size={20} style={{ verticalAlign: "middle", marginRight: "8px" }} />
        MBG Staking
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
        <div style={{ backgroundColor: theme.input, padding: "16px", borderRadius: "12px", border: `1px solid ${theme.border}`, textAlign: "center" }}>
          <div style={{ fontSize: "12px", color: theme.sub }}>Pool TVL</div>
          <div style={{ fontSize: "20px", fontWeight: 800 }}>$250,400</div>
        </div>
        <div style={{ backgroundColor: theme.input, padding: "16px", borderRadius: "12px", border: `1px solid ${theme.border}`, textAlign: "center" }}>
          <div style={{ fontSize: "12px", color: theme.sub }}>APY</div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: theme.green }}>32.50%</div>
        </div>
      </div>
      <div style={{ backgroundColor: "#fef3c7", padding: "16px", borderRadius: "12px", border: "1px solid #fde68a", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "12px", color: "#92400e" }}>MBG Earned</div>
            <div style={{ fontSize: "24px", fontWeight: 800, fontFamily: "monospace" }}>{mbgEarned.toFixed(6)}</div>
          </div>
          <button onClick={() => setMbgEarned(0)} disabled={mbgEarned <= 0} style={{ backgroundColor: mbgEarned > 0 ? theme.yellow : theme.border, border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: 700, cursor: mbgEarned > 0 ? "pointer" : "not-allowed" }}>
            Claim
          </button>
        </div>
      </div>
      <input type="number" placeholder="LP Amount to Stake" value={stakeAmt} onChange={e => setStakeAmt(e.target.value)} style={{ padding: "14px", backgroundColor: theme.input, border: `1px solid ${theme.border}`, borderRadius: "12px", color: theme.text, fontWeight: 700, fontSize: "16px", width: "100%", marginBottom: "12px", boxSizing: "border-box" as const }} />
      <button onClick={() => { if (stakeAmt) { setStakeAmt(""); showToast("✅", `Staked ${stakeAmt} LP!`); } }} style={{ width: "100%", backgroundColor: "#111827", color: "#fff", border: "none", padding: "16px", borderRadius: "12px", fontWeight: 800, cursor: "pointer" }}>
        Lock & Stake
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   DASHBOARD PANEL
   ═══════════════════════════════════════════ */
function DashboardPanel({ account, balances, txHistory, poolInfo, theme }: any) {
  const cardStyle = { backgroundColor: theme.card, borderRadius: "24px", padding: "24px", border: `1px solid ${theme.border}`, width: "100%", maxWidth: "600px" };

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: 800 }}>
        <TrendingUp size={20} style={{ verticalAlign: "middle", marginRight: "8px" }} />
        Dashboard
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Total Swaps", value: txHistory.filter((t: any) => t.type === "Swap").length },
          { label: "Total Faucet Claims", value: txHistory.filter((t: any) => t.type === "Faucet").length },
          { label: "LP Provided", value: poolInfo.userLP },
          { label: "Wallet Connected", value: account ? "✅ Yes" : "❌ No" },
        ].map((s, i) => (
          <div key={i} style={{ backgroundColor: theme.input, padding: "16px", borderRadius: "12px", border: `1px solid ${theme.border}` }}>
            <div style={{ fontSize: "12px", color: theme.sub }}>{s.label}</div>
            <div style={{ fontSize: "20px", fontWeight: 800 }}>{s.value}</div>
          </div>
        ))}
      </div>
      <h4 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "12px" }}>Wallet Balances</h4>
      {Object.entries(TOKEN_LIST).map(([sym, info]) => (
        <div key={sym} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${theme.border}` }}>
          <span>{info.logo} {sym}</span>
          <strong>{balances[sym] || "0.00"}</strong>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   HISTORY PANEL
   ═══════════════════════════════════════════ */
function HistoryPanel({ txHistory, theme }: any) {
  const cardStyle = { backgroundColor: theme.card, borderRadius: "24px", padding: "24px", border: `1px solid ${theme.border}`, width: "100%", maxWidth: "600px" };

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: 800 }}>
        <Wallet size={20} style={{ verticalAlign: "middle", marginRight: "8px" }} />
        Transaction History
      </h3>
      {txHistory.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: theme.sub }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
          <p>No transactions yet. Start swapping!</p>
        </div>
      ) : (
        txHistory.map((tx: any) => (
          <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", borderRadius: "10px", backgroundColor: theme.input, border: `1px solid ${theme.border}`, marginBottom: "8px" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px" }}>{tx.type}</div>
              <div style={{ fontSize: "12px", color: theme.sub }}>{tx.detail}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", color: theme.sub }}>{tx.time}</div>
              {tx.hash && (
                <a href={`${EXPLORER_URL}/tx/${tx.hash}`} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: theme.accent, textDecoration: "none" }}>
                  View ↗
                </a>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN DEX APP
   ═══════════════════════════════════════════ */
export default function DexApp({ onBack }: { onBack: () => void }) {
  const [darkMode, setDarkMode] = useState(false);
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState("swap");
  const [toast, setToast] = useState<{ icon: string; msg: string } | null>(null);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [txHistory, setTxHistory] = useState<any[]>([]);
  const [ltcPrice, setLtcPrice] = useState({ price: "...", change: "0" });
  const [poolInfo, setPoolInfo] = useState({ reserveA: "0", reserveB: "0", userLP: "0" });

  const theme = useTheme(darkMode);

  const showToast = useCallback((icon: string, msg: string) => {
    setToast({ icon, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const addHistory = (type: string, detail: string, hash = "") => {
    setTxHistory(prev => [{ id: Date.now(), type, detail, time: new Date().toLocaleTimeString("id-ID"), hash }, ...prev].slice(0, 50));
  };

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd&include_24hr_change=true");
        const data = await res.json();
        setLtcPrice({ price: data.litecoin.usd.toFixed(2), change: data.litecoin.usd_24h_change.toFixed(2) });
      } catch (e) {}
    };
    fetchPrice();
    const iv = setInterval(fetchPrice, 60000);
    return () => clearInterval(iv);
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) { showToast("❌", "Install MetaMask!"); return; }
    setConnecting(true);
    try {
      const accs = await window.ethereum.request({ method: "eth_requestAccounts" });
      const prov = new ethers.BrowserProvider(window.ethereum);
      const net = await prov.getNetwork();
      if (Number(net.chainId) !== CHAIN_ID) {
        await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x" + CHAIN_ID.toString(16) }] });
      }
      const sig = await prov.getSigner();
      setProvider(prov);
      setSigner(sig);
      setAccount(accs[0]);
      showToast("✅", "Wallet Connected!");
      updateBalances(prov, accs[0]);
    } catch (err: any) {
      showToast("❌", "Connection Failed: " + (err.message || "").slice(0, 50));
    } finally { setConnecting(false); }
  };

  const updateBalances = async (prov: any, addr: string) => {
    if (!prov || !addr) return;
    try {
      const native = await prov.getBalance(addr);
      const bals: Record<string, string> = { zkLTC: parseFloat(ethers.formatEther(native)).toFixed(4) };
      for (const [sym, info] of Object.entries(TOKEN_LIST)) {
        if (info.isNative) continue;
        const contract = new ethers.Contract(info.address, ERC20_ABI, prov);
        const bal = await contract.balanceOf(addr);
        bals[sym] = parseFloat(ethers.formatUnits(bal, info.decimals)).toFixed(4);
      }
      setBalances(bals);
    } catch (e) {}
  };

  useEffect(() => {
    if (account && provider) {
      updateBalances(provider, account);
      const iv = setInterval(() => updateBalances(provider, account), 10000);
      return () => clearInterval(iv);
    }
  }, [account, provider]);

  useEffect(() => {
    const load = async () => {
      try {
        const prov = provider || new ethers.JsonRpcProvider(LITVM_RPC);
        const pool = new ethers.Contract(CONTRACTS.POOL, POOL_ABI, prov);
        const [resA, resB] = await pool.getReserves();
        let userLPVal = 0n;
        if (account) {
          try { userLPVal = await pool.getUserLP(account); } catch (e) {}
        }
        setPoolInfo({
          reserveA: parseFloat(ethers.formatUnits(resA, 6)).toFixed(2),
          reserveB: parseFloat(ethers.formatUnits(resB, 18)).toFixed(2),
          userLP: parseFloat(ethers.formatUnits(userLPVal, 18)).toFixed(4),
        });
      } catch (e) {}
    };
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [provider, account]);

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      showToast("✅", "Address copied!");
    }
  };

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

      <div style={{ display: "flex", gap: "24px", justifyContent: "center", padding: "10px", backgroundColor: theme.card, borderBottom: `1px solid ${theme.border}`, fontSize: "12px", color: theme.sub }}>
        <span>LTC/USD <strong style={{ color: parseFloat(ltcPrice.change) >= 0 ? theme.green : theme.red }}>${ltcPrice.price}</strong></span>
        <span>24h <strong style={{ color: parseFloat(ltcPrice.change) >= 0 ? theme.green : theme.red }}>{ltcPrice.change}%</strong></span>
        <span>Gas <strong>9 sat/byte</strong></span>
        <span>Pool TVL <strong style={{ color: theme.green }}>${poolInfo.reserveA > "0" ? (parseFloat(poolInfo.reserveA) + parseFloat(poolInfo.reserveB)).toFixed(0) : "—"}</strong></span>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", paddingBottom: "20px", borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={onBack}>
            <LogoDex size={36} showText={false} />
            <div>
              <h1 style={{ fontSize: "22px", margin: 0, fontWeight: 900, color: theme.text }}>Freesia DEX</h1>
              <span style={{ fontSize: "12px", color: theme.green, display: "flex", alignItems: "center", gap: "4px" }}>
                <CheckCircle2 size={12} /> LitVM Live
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button onClick={() => setDarkMode(!darkMode)} style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: "10px", padding: "8px", cursor: "pointer", color: theme.sub }}>
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a href={EXPLORER_URL} target="_blank" rel="noreferrer" style={{ color: theme.sub, textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>Explorer ↗</a>
            {account ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: theme.input, padding: "8px 14px", borderRadius: "12px", border: `1px solid ${theme.border}` }}>
                <span style={{ fontSize: "13px", fontWeight: 700 }}>{account.slice(0, 6)}...{account.slice(-4)}</span>
                <button onClick={copyAddress} style={{ background: "none", border: "none", cursor: "pointer", color: theme.sub, padding: 0 }}>
                  <Copy size={14} />
                </button>
              </div>
            ) : (
              <button onClick={connectWallet} disabled={connecting} style={{ backgroundColor: theme.accent, color: "#fff", border: "none", padding: "10px 20px", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}>
                {connecting ? "..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </header>

        <div style={{ display: "flex", gap: "8px", marginBottom: "30px", flexWrap: "wrap", justifyContent: "center" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: "10px 20px", border: "none", borderRadius: "12px",
              backgroundColor: activeTab === t.id ? theme.accent : theme.input,
              color: activeTab === t.id ? "#fff" : theme.sub,
              fontWeight: 700, cursor: "pointer", fontSize: "13px",
              display: "flex", alignItems: "center", gap: "6px",
              transition: "all 0.2s"
            }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          {activeTab === "swap" && (
            <SwapPanel account={account} signer={signer} provider={provider} balances={balances}
              updateBalances={updateBalances} showToast={showToast} theme={theme} addHistory={addHistory} />
          )}
          {activeTab === "faucet" && (
            <FaucetPanel account={account} signer={signer} provider={provider} balances={balances}
              updateBalances={updateBalances} showToast={showToast} theme={theme} addHistory={addHistory} />
          )}
          {activeTab === "pool" && (
            <PoolPanel account={account} signer={signer} provider={provider} balances={balances}
              updateBalances={updateBalances} showToast={showToast} theme={theme} addHistory={addHistory} poolInfo={poolInfo} />
          )}
          {activeTab === "il" && (
            <ILSimulatorPanel theme={theme} />
          )}
          {activeTab === "staking" && (
            <StakingPanel theme={theme} showToast={showToast} />
          )}
          {activeTab === "dashboard" && (
            <DashboardPanel account={account} balances={balances} txHistory={txHistory}
              poolInfo={poolInfo} theme={theme} />
          )}
          {activeTab === "history" && (
            <HistoryPanel txHistory={txHistory} theme={theme} />
          )}
        </div>

        <footer style={{ textAlign: "center", marginTop: "60px", padding: "30px 0", borderTop: `1px solid ${theme.border}` }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "16px" }}>
            <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: theme.sub, fontSize: "20px", textDecoration: "none" }}>𝕏</a>
            <a href="https://github.com/Muhammadzack/freesia-dex-frontend-" target="_blank" rel="noreferrer" style={{ color: theme.sub, fontSize: "20px", textDecoration: "none" }}>🐙</a>
            <a href={EXPLORER_URL} target="_blank" rel="noreferrer" style={{ color: theme.sub, fontSize: "20px", textDecoration: "none" }}>🔍</a>
          </div>
          <p style={{ fontSize: "12px", color: theme.sub }}>
            © 2026 Freesia DEX. Built by <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: theme.accent, textDecoration: "none" }}>@0xzackbh</a> on LitVM Testnet.
          </p>
        </footer>
      </div>
    </div>
  );
}
