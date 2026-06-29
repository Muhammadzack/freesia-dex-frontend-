import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { fmtBal } from "../utils/formatters";

export default function ILSimulatorPanel({ theme }) {
  const [priceChange, setPriceChange] = useState(0);
  const [initialPrice, setInitialPrice] = useState("1.0");
  const [invested, setInvested] = useState("10000");
  const [feeApr, setFeeApr] = useState("0.25");
  const [days, setDays] = useState(30);

  const P = priceChange >= 0 ? 1 + priceChange / 100 : 1 / (1 + Math.abs(priceChange) / 100);
  const il = 2 * Math.sqrt(P) / (1 + P) - 1;
  const ilPct = il * 100;
  const lpVal = Number(invested) * (1 + il) * (1 + Number(feeApr) * days / 365);
  const feeEarned = Number(invested) * Number(feeApr) * days / 365;
  const netReturn = lpVal - Number(invested);
  const totalReturnPct = (netReturn / Number(invested)) * 100;
  const risk = Math.abs(ilPct) < 1 ? "SAFE" : Math.abs(ilPct) < 5 ? "MODERATE" : "HIGH";
  const riskColor = risk === "SAFE" ? "#16a34a" : risk === "MODERATE" ? "#f59e0b" : "#dc2626";

  return (
    <div style={{ backgroundColor: theme.card, borderRadius: 24, padding: 24, border: `1px solid ${theme.border}` }}>
      <h3 style={{ margin: "0 0 16px 0", fontSize: 20, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}><ShieldCheck size={20} /> IL Risk Simulator</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div><label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4, color: theme.sub }}>Initial Price</label><input type="number" value={initialPrice} onChange={e => setInitialPrice(e.target.value)} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, fontWeight: 700, border: `1px solid ${theme.border}`, backgroundColor: theme.input, color: theme.text, outline: "none", boxSizing: "border-box" }} /></div>
        <div><label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4, color: theme.sub }}>Investment ($)</label><input type="number" value={invested} onChange={e => setInvested(e.target.value)} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, fontWeight: 700, border: `1px solid ${theme.border}`, backgroundColor: theme.input, color: theme.text, outline: "none", boxSizing: "border-box" }} /></div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 8, color: theme.sub }}><span>Price Change: {priceChange > 0 ? "+" : ""}{priceChange}%</span></div>
        <input type="range" min="-90" max="500" value={priceChange} onChange={e => setPriceChange(Number(e.target.value))} style={{ width: "100%" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 4, color: theme.sub }}><span>-90%</span><span>0%</span><span>+500%</span></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div><label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4, color: theme.sub }}>Fee APR (%)</label><input type="number" step="0.01" value={feeApr} onChange={e => setFeeApr(e.target.value)} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, fontWeight: 700, border: `1px solid ${theme.border}`, backgroundColor: theme.input, color: theme.text, outline: "none", boxSizing: "border-box" }} /></div>
        <div><label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4, color: theme.sub }}>Days</label><input type="number" value={days} onChange={e => setDays(Number(e.target.value))} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, fontWeight: 700, border: `1px solid ${theme.border}`, backgroundColor: theme.input, color: theme.text, outline: "none", boxSizing: "border-box" }} /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 12, borderRadius: 12, backgroundColor: theme.cardSec, textAlign: "center" }}><div style={{ fontSize: 11, fontWeight: 700, color: theme.sub }}>IL</div><div style={{ fontSize: 18, fontWeight: 800, color: riskColor }}>{ilPct.toFixed(2)}%</div></div>
        <div style={{ padding: 12, borderRadius: 12, backgroundColor: theme.cardSec, textAlign: "center" }}><div style={{ fontSize: 11, fontWeight: 700, color: theme.sub }}>Risk</div><div style={{ fontSize: 18, fontWeight: 800, color: riskColor }}>{risk}</div></div>
        <div style={{ padding: 12, borderRadius: 12, backgroundColor: theme.cardSec, textAlign: "center" }}><div style={{ fontSize: 11, fontWeight: 700, color: theme.sub }}>Fees Earned</div><div style={{ fontSize: 18, fontWeight: 800, color: theme.accent }}>${fmtBal(feeEarned)}</div></div>
        <div style={{ padding: 12, borderRadius: 12, backgroundColor: theme.cardSec, textAlign: "center" }}><div style={{ fontSize: 11, fontWeight: 700, color: theme.sub }}>Total Return</div><div style={{ fontSize: 18, fontWeight: 800, color: totalReturnPct >= 0 ? theme.green : theme.red }}>{totalReturnPct >= 0 ? "+" : ""}{totalReturnPct.toFixed(2)}%</div></div>
      </div>
      <div style={{ padding: 16, borderRadius: 12, backgroundColor: theme.cardSec, border: "2px solid " + (totalReturnPct >= 0 ? "#bbf7d0" : "#fecaca") }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 14, fontWeight: 700, color: theme.sub }}>LP Value</span><strong style={{ color: theme.text }}>${fmtBal(lpVal)}</strong></div>
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${theme.border}` }}>
          <strong style={{ fontSize: 14, color: totalReturnPct >= 0 ? theme.green : theme.red }}>{totalReturnPct >= 0 ? "✅" : "⚠️"} LP is {totalReturnPct >= 0 ? "profitable" : "at a loss"} by ${fmtBal(Math.abs(netReturn))} vs HODL</strong>
        </div>
      </div>
    </div>
  );
}
