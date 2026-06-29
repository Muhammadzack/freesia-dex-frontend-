import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { Plus, Minus, Droplets } from "lucide-react";
import { TOKEN_LIST, ERC20_ABI, POOL_ABI, CONTRACTS, LITVM_RPC } from "../utils/constants";
import { fmtBal } from "../utils/formatters";
import TokenLogo from "./TokenLogo";

export default function PoolPanel({ account, signer, provider, balances, showToast, theme, addHistory }) {
  const [mode, setMode] = useState("add");
  const [tokenA, setTokenA] = useState("USDC");
  const [tokenB, setTokenB] = useState("DAI");
  const [amtA, setAmtA] = useState("");
  const [amtB, setAmtB] = useState("");
  const [lpAmt, setLpAmt] = useState("");
  const [loading, setLoading] = useState(false);
  const [poolInfo, setPoolInfo] = useState(null);

  const readPoolData = useCallback(async () => {
    const prov = provider || new ethers.JsonRpcProvider(LITVM_RPC);
    const pool = new ethers.Contract(CONTRACTS.POOL, POOL_ABI, prov);
    try {
      const [resA, resB] = await pool.getReserves();
      let userLPVal = 0n;
      if (account) { try { userLPVal = await pool.getUserLP(account); } catch {} }
      setPoolInfo({ reserveA: ethers.formatUnits(resA, TOKEN_LIST[tokenA]?.decimals || 6), reserveB: ethers.formatUnits(resB, TOKEN_LIST[tokenB]?.decimals || 18), userLP: ethers.formatUnits(userLPVal, 18) });
    } catch {}
  }, [provider, tokenA, tokenB, account]);

  useEffect(() => { readPoolData(); }, [readPoolData]);
  useEffect(() => { const iv = setInterval(readPoolData, 10000); return () => clearInterval(iv); }, [readPoolData]);

  const addLiquidity = async () => {
    if (!signer || !account) return showToast("❌", "Connect wallet!");
    if (!amtA || !amtB) return;
    setLoading(true);
    try {
      const pool = new ethers.Contract(CONTRACTS.POOL, POOL_ABI, signer);
      const amountA = ethers.parseUnits(amtA, TOKEN_LIST[tokenA].decimals);
      const amountB = ethers.parseUnits(amtB, TOKEN_LIST[tokenB].decimals);
      for (const sym of [tokenA, tokenB]) {
        const c = new ethers.Contract(TOKEN_LIST[sym].address, ERC20_ABI, signer);
        const allow = await c.allowance(account, CONTRACTS.POOL);
        if (allow < (sym === tokenA ? amountA : amountB)) { showToast("⏳", `Approving ${sym}...`); await (await c.approve(CONTRACTS.POOL, ethers.MaxUint256)).wait(); }
      }
      showToast("⏳", "Adding liquidity...");
      const tx = await pool.addLiquidity(TOKEN_LIST[tokenA].address, TOKEN_LIST[tokenB].address, amountA, amountB, { gasLimit: 600000 });
      await tx.wait();
      showToast("✅", `Added ${amtA} ${tokenA} + ${amtB} ${tokenB}`);
      addHistory("pool", `Added ${amtA} ${tokenA} + ${amtB} ${tokenB}`, tx.hash);
    } catch (err) { showToast("❌", (err?.reason || err?.message || "").slice(0, 60)); }
    finally { setLoading(false); }
  };

  const removeLiquidity = async () => {
    if (!signer || !account) return showToast("❌", "Connect wallet!");
    if (!lpAmt) return;
    setLoading(true);
    try {
      const pool = new ethers.Contract(CONTRACTS.POOL, POOL_ABI, signer);
      const lp = ethers.parseUnits(lpAmt, 18);
      showToast("⏳", "Removing liquidity...");
      const tx = await pool.removeLiquidity(TOKEN_LIST[tokenA].address, TOKEN_LIST[tokenB].address, lp, { gasLimit: 500000 });
      await tx.wait();
      showToast("✅", `Removed ${lpAmt} LP tokens`);
      addHistory("pool", `Removed ${lpAmt} LP from ${tokenA}/${tokenB}`, tx.hash);
    } catch (err) { showToast("❌", (err?.reason || err?.message || "").slice(0, 60)); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ backgroundColor: theme.card, borderRadius: 24, padding: 24, border: `1px solid ${theme.border}` }}>
      <h3 style={{ margin: "0 0 16px 0", fontSize: 20, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}><Droplets size={20} /> Pool</h3>
      {poolInfo && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{ padding: 12, borderRadius: 12, backgroundColor: theme.cardSec, textAlign: "center" }}><div style={{ fontSize: 11, fontWeight: 700, color: theme.sub }}>TVL</div><div style={{ fontSize: 14, fontWeight: 800 }}>{fmtBal(poolInfo.reserveA)} {tokenA}</div></div>
          <div style={{ padding: 12, borderRadius: 12, backgroundColor: theme.cardSec, textAlign: "center" }}><div style={{ fontSize: 11, fontWeight: 700, color: theme.sub }}>Reserve</div><div style={{ fontSize: 14, fontWeight: 800 }}>{fmtBal(poolInfo.reserveB)} {tokenB}</div></div>
          <div style={{ padding: 12, borderRadius: 12, backgroundColor: theme.cardSec, textAlign: "center" }}><div style={{ fontSize: 11, fontWeight: 700, color: theme.sub }}>Your LP</div><div style={{ fontSize: 14, fontWeight: 800, color: theme.accent }}>{fmtBal(poolInfo.userLP)}</div></div>
        </div>
      )}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, padding: 4, borderRadius: 12, backgroundColor: theme.input }}>
        <button onClick={() => setMode("add")} style={{ flex: 1, padding: "10px 16px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: mode === "add" ? theme.accent : "transparent", color: mode === "add" ? "#fff" : theme.sub }}><Plus size={14} /> Add</button>
        <button onClick={() => setMode("remove")} style={{ flex: 1, padding: "10px 16px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: mode === "remove" ? theme.red : "transparent", color: mode === "remove" ? "#fff" : theme.sub }}><Minus size={14} /> Remove</button>
      </div>
      {mode === "add" ? (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <select value={tokenA} onChange={e => setTokenA(e.target.value)} style={{ flex: 1, padding: "12px", borderRadius: 12, fontWeight: 700, fontSize: 13, border: `1px solid ${theme.border}`, backgroundColor: theme.input, color: theme.text, cursor: "pointer" }}>{Object.keys(TOKEN_LIST).filter(k => k !== tokenB).map(k => <option key={k} value={k}>{k}</option>)}</select>
            <select value={tokenB} onChange={e => setTokenB(e.target.value)} style={{ flex: 1, padding: "12px", borderRadius: 12, fontWeight: 700, fontSize: 13, border: `1px solid ${theme.border}`, backgroundColor: theme.input, color: theme.text, cursor: "pointer" }}>{Object.keys(TOKEN_LIST).filter(k => k !== tokenA).map(k => <option key={k} value={k}>{k}</option>)}</select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 4, color: theme.sub }}>
              <span>Amount {tokenA}</span>
              <span>Bal: {fmtBal(balances[tokenA] || "0")} {tokenA}</span>
            </div>
            <input type="number" placeholder={`0.0 ${tokenA}`} value={amtA} onChange={e => setAmtA(e.target.value)} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, fontWeight: 700, fontSize: 15, border: `1px solid ${theme.border}`, backgroundColor: theme.input, color: theme.text, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 4, color: theme.sub }}>
              <span>Amount {tokenB}</span>
              <span>Bal: {fmtBal(balances[tokenB] || "0")} {tokenB}</span>
            </div>
            <input type="number" placeholder={`0.0 ${tokenB}`} value={amtB} onChange={e => setAmtB(e.target.value)} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, fontWeight: 700, fontSize: 15, border: `1px solid ${theme.border}`, backgroundColor: theme.input, color: theme.text, outline: "none", boxSizing: "border-box" }} />
          </div>
          <button onClick={addLiquidity} disabled={loading} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", fontWeight: 800, fontSize: 15, color: "#fff", cursor: "pointer", backgroundColor: theme.accent, opacity: loading ? 0.5 : 1 }}>{loading ? "⏳" : "Add Liquidity"}</button>
        </>
      ) : (
        <>
          <input type="number" placeholder="LP Token Amount" value={lpAmt} onChange={e => setLpAmt(e.target.value)} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, fontWeight: 700, fontSize: 15, border: `1px solid ${theme.border}`, backgroundColor: theme.input, color: theme.text, outline: "none", marginBottom: 16, boxSizing: "border-box" }} />
          <button onClick={removeLiquidity} disabled={loading} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", fontWeight: 800, fontSize: 15, color: "#fff", cursor: "pointer", backgroundColor: theme.red, opacity: loading ? 0.5 : 1 }}>{loading ? "⏳" : "Remove Liquidity"}</button>
        </>
      )}
    </div>
  );
}
