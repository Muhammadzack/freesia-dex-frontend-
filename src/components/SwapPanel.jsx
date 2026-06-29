import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ArrowDownUp, Settings } from "lucide-react";
import { TOKEN_LIST, ERC20_ABI, POOL_ABI, CONTRACTS } from "../utils/constants";
import { fmtBal } from "../utils/formatters";
import TokenLogo from "./TokenLogo";

export default function SwapPanel({ account, signer, provider, balances, showToast, theme, addHistory }) {
  const [tokenA, setTokenA] = useState("USDC");
  const [tokenB, setTokenB] = useState("DAI");
  const [amountIn, setAmountIn] = useState("");
  const [quoteOut, setQuoteOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);

  const getQuote = async () => {
    if (!amountIn || !provider) { setQuoteOut(""); return; }
    try {
      const pool = new ethers.Contract(CONTRACTS.POOL, POOL_ABI, provider);
      const amt = ethers.parseUnits(amountIn, TOKEN_LIST[tokenA].decimals);
      const out = await pool.getAmountOut(TOKEN_LIST[tokenA].address, TOKEN_LIST[tokenB].address, amt);
      setQuoteOut(ethers.formatUnits(out, TOKEN_LIST[tokenB].decimals));
    } catch { setQuoteOut("0"); }
  };
  useEffect(() => { getQuote(); }, [amountIn, tokenA, tokenB, provider]);

  const swap = async () => {
    if (!signer || !account) return showToast("❌", "Connect wallet!");
    if (!amountIn) return;
    setLoading(true);
    try {
      const pool = new ethers.Contract(CONTRACTS.POOL, POOL_ABI, signer);
      const amt = ethers.parseUnits(amountIn, TOKEN_LIST[tokenA].decimals);
      const minOut = ethers.parseUnits((Number(quoteOut) * (1 - slippage / 100)).toFixed(TOKEN_LIST[tokenB].decimals), TOKEN_LIST[tokenB].decimals);
      const tokenC = new ethers.Contract(TOKEN_LIST[tokenA].address, ERC20_ABI, signer);
      const allow = await tokenC.allowance(account, CONTRACTS.POOL);
      if (allow < amt) { showToast("⏳", "Approving..."); await (await tokenC.approve(CONTRACTS.POOL, ethers.MaxUint256)).wait(); }
      showToast("⏳", "Swapping...");
      const tx = await pool.swap(TOKEN_LIST[tokenA].address, TOKEN_LIST[tokenB].address, amt, minOut, { gasLimit: 500000 });
      await tx.wait();
      showToast("✅", `Swapped ${amountIn} ${tokenA} → ${fmtBal(quoteOut)} ${tokenB}`);
      addHistory("swap", `Swapped ${amountIn} ${tokenA} → ${fmtBal(quoteOut)} ${tokenB}`, tx.hash);
    } catch (err) { showToast("❌", (err?.reason || err?.message || "").slice(0, 60)); }
    finally { setLoading(false); }
  };
  const switchTokens = () => { setTokenA(tokenB); setTokenB(tokenA); setQuoteOut(""); };

  return (
    <div style={{ backgroundColor: theme.card, borderRadius: 24, padding: 24, border: `1px solid ${theme.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}><ArrowDownUp size={20} /> Swap</h3>
        <button onClick={() => setShowSettings(!showSettings)} style={{ background: "none", border: "none", padding: 8, borderRadius: 8, cursor: "pointer", color: theme.sub }}><Settings size={18} /></button>
      </div>
      {showSettings && (
        <div style={{ backgroundColor: theme.cardSec, padding: 16, borderRadius: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: theme.sub }}>Slippage Tolerance</div>
          <div style={{ display: "flex", gap: 8 }}>{[0.5, 1, 2].map(s => <button key={s} onClick={() => setSlippage(s)} style={{ padding: "6px 12px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", backgroundColor: slippage === s ? theme.accent : theme.input, color: slippage === s ? "#fff" : theme.text }}>{s}%</button>)}</div>
        </div>
      )}
      <div style={{ backgroundColor: theme.input, borderRadius: 16, padding: 16, border: `1px solid ${theme.border}`, marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 12, fontWeight: 700, color: theme.sub }}>From</span><span style={{ fontSize: 12, color: theme.sub }}>Bal: {fmtBal(balances[tokenA] || "0")}</span></div>
        <div style={{ display: "flex", gap: 12 }}>
          <input type="number" placeholder="0.0" value={amountIn} onChange={e => setAmountIn(e.target.value)} style={{ flex: 1, background: "transparent", border: "none", fontSize: 24, fontWeight: 800, outline: "none", color: theme.text }} />
          <select value={tokenA} onChange={e => setTokenA(e.target.value)} style={{ padding: "8px 12px", borderRadius: 10, fontWeight: 700, fontSize: 13, border: `1px solid ${theme.border}`, backgroundColor: theme.card, color: theme.text, cursor: "pointer" }}>{Object.keys(TOKEN_LIST).filter(k => k !== tokenB).map(k => <option key={k} value={k}>{k}</option>)}</select>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", margin: "4px 0" }}><button onClick={switchTokens} style={{ backgroundColor: theme.cardSec, border: "none", padding: 8, borderRadius: 10, cursor: "pointer", fontSize: 18 }}>⇅</button></div>
      <div style={{ backgroundColor: theme.input, borderRadius: 16, padding: 16, border: `1px solid ${theme.border}`, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 12, fontWeight: 700, color: theme.sub }}>To</span><span style={{ fontSize: 12, color: theme.sub }}>Bal: {fmtBal(balances[tokenB] || "0")}</span></div>
        <div style={{ display: "flex", gap: 12 }}>
          <input type="text" readOnly value={quoteOut ? fmtBal(quoteOut) : "0.0"} style={{ flex: 1, background: "transparent", border: "none", fontSize: 24, fontWeight: 800, outline: "none", color: theme.text }} />
          <select value={tokenB} onChange={e => setTokenB(e.target.value)} style={{ padding: "8px 12px", borderRadius: 10, fontWeight: 700, fontSize: 13, border: `1px solid ${theme.border}`, backgroundColor: theme.card, color: theme.text, cursor: "pointer" }}>{Object.keys(TOKEN_LIST).filter(k => k !== tokenA).map(k => <option key={k} value={k}>{k}</option>)}</select>
        </div>
      </div>
      {quoteOut && <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 16, color: theme.sub }}>Rate: 1 {tokenA} ≈ {fmtBal(Number(quoteOut) / Number(amountIn || 1), 6)} {tokenB}</div>}
      <button onClick={swap} disabled={loading || !account} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", fontWeight: 800, fontSize: 15, color: "#fff", cursor: "pointer", backgroundColor: theme.accent, opacity: loading || !account ? 0.5 : 1 }}>{loading ? "⏳ Swapping..." : account ? "Swap" : "Connect Wallet"}</button>
    </div>
  );
}
