import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { Lock, Unlock } from "lucide-react";
import { POOL_ABI, CONTRACTS, LITVM_RPC } from "../utils/constants";
import { fmtBal } from "../utils/formatters";

export default function StakingPanel({ account, theme, showToast, provider }) {
  const [mode, setMode] = useState("stake");
  const [lpBalance, setLpBalance] = useState("0");
  const [inputAmount, setInputAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [reward, setReward] = useState("0");

  const readData = useCallback(async () => {
    if (!account) { setLpBalance("0"); setReward("0"); return; }
    try {
      const prov = provider || new ethers.JsonRpcProvider(LITVM_RPC);
      const pool = new ethers.Contract(CONTRACTS.POOL, POOL_ABI, prov);
      const lp = await pool.getUserLP(account);
      const lpNum = ethers.formatUnits(lp, 18);
      setLpBalance(lpNum);
      // Simulated reward: 32.5% APY / 365 days
      const dailyReward = Number(lpNum) * 0.325 / 365;
      setReward(String(dailyReward));
    } catch (err) {
      setLpBalance("0");
      setReward("0");
    }
  }, [account, provider]);

  useEffect(() => { readData(); }, [readData]);
  useEffect(() => { const iv = setInterval(readData, 15000); return () => clearInterval(iv); }, [readData]);

  const handleStake = async () => {
    if (!account) return showToast("❌", "Connect wallet!");
    if (!inputAmount || Number(inputAmount) <= 0) return showToast("❌", "Enter amount!");
    if (Number(inputAmount) > Number(lpBalance)) return showToast("❌", "Insufficient LP balance!");
    setLoading(true);
    try {
      // Simulated staking - in production this would call a staking contract
      await new Promise(r => setTimeout(r, 1500));
      showToast("✅", `${inputAmount} LP tokens staked!`);
      setInputAmount("");
    } catch { showToast("❌", "Staking failed"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ backgroundColor: theme.card, borderRadius: 24, padding: 24, border: `1px solid ${theme.border}` }}>
      <h3 style={{ margin: "0 0 16px 0", fontSize: 20, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}><Lock size={20} /> Staking</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 12, borderRadius: 12, backgroundColor: theme.cardSec, textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.sub }}>Available LP</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: theme.accent }}>{fmtBal(lpBalance)}</div>
        </div>
        <div style={{ padding: 12, borderRadius: 12, backgroundColor: theme.cardSec, textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.sub }}>APY</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: theme.green }}>32.5%</div>
        </div>
        <div style={{ padding: 12, borderRadius: 12, backgroundColor: theme.cardSec, textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.sub }}>MBG/day</div>
          <div style={{ fontSize: 14, fontWeight: 800 }}>{fmtBal(reward)}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 16, padding: 4, borderRadius: 12, backgroundColor: theme.input }}>
        <button onClick={() => setMode("stake")} style={{ flex: 1, padding: "10px 16px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: mode === "stake" ? theme.accent : "transparent", color: mode === "stake" ? "#fff" : theme.sub }}><Lock size={14} /> Stake</button>
        <button onClick={() => setMode("unstake")} style={{ flex: 1, padding: "10px 16px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: mode === "unstake" ? theme.red : "transparent", color: mode === "unstake" ? "#fff" : theme.sub }}><Unlock size={14} /> Unstake</button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 4, color: theme.sub }}>
          <span>{mode === "stake" ? "Amount to Stake" : "Amount to Unstake"}</span>
          <span>Available: {fmtBal(lpBalance)} LP</span>
        </div>
        <input type="number" placeholder="0.0" value={inputAmount} onChange={e => setInputAmount(e.target.value)} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, fontWeight: 700, fontSize: 15, border: `1px solid ${theme.border}`, backgroundColor: theme.input, color: theme.text, outline: "none", boxSizing: "border-box" }} />
      </div>
      <button onClick={handleStake} disabled={loading || !account} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", fontWeight: 800, fontSize: 15, color: "#fff", cursor: "pointer", backgroundColor: mode === "stake" ? theme.accent : theme.red, opacity: loading || !account ? 0.5 : 1 }}>{loading ? "⏳" : mode === "stake" ? "Stake LP Tokens" : "Unstake LP Tokens"}</button>
    </div>
  );
}
