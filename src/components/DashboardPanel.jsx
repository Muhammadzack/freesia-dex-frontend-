import { TrendingUp, Droplets, Zap, ScrollText } from "lucide-react";
import { fmtBal } from "../utils/formatters";

export default function DashboardPanel({ balances, txHistory, theme }) {
  const stats = [
    { label: "Wallet Balance", value: `${fmtBal(balances.zkLTC || "0")} zkLTC`, icon: <Zap size={20} />, color: theme.accent },
    { label: "USDC Balance", value: fmtBal(balances.USDC || "0"), icon: <TrendingUp size={20} />, color: "#2563eb" },
    { label: "Total Transactions", value: String(txHistory.length), icon: <ScrollText size={20} />, color: theme.yellow },
    { label: "DAI Balance", value: fmtBal(balances.DAI || "0"), icon: <Droplets size={20} />, color: "#8b5cf6" },
  ];
  return (
    <div style={{ backgroundColor: theme.card, borderRadius: 24, padding: 24, border: `1px solid ${theme.border}` }}>
      <h3 style={{ margin: "0 0 20px 0", fontSize: 20, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}><TrendingUp size={20} /> Dashboard</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ padding: 16, borderRadius: 16, backgroundColor: theme.cardSec, border: `1px solid ${theme.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: s.color }}>{s.icon}<span style={{ fontSize: 12, fontWeight: 700, color: theme.sub }}>{s.label}</span></div>
            <div style={{ fontSize: 18, fontWeight: 800, color: theme.text }}>{s.value}</div>
          </div>
        ))}
      </div>
      <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Recent Activity</h4>
      {txHistory.length === 0 ? <div style={{ textAlign: "center", padding: 24, borderRadius: 12, fontSize: 14, color: theme.sub, backgroundColor: theme.input }}>No transactions yet.</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {txHistory.slice(0, 5).map(tx => (
            <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, borderRadius: 12, backgroundColor: theme.input, border: `1px solid ${theme.border}` }}>
              <div><div style={{ fontWeight: 700, fontSize: 14 }}>{tx.type}</div><div style={{ fontSize: 12, color: theme.sub }}>{tx.detail}</div></div>
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 12, fontWeight: 700, color: theme.sub }}>{tx.time}</div>{tx.hash && <a href={`https://liteforge.explorer.caldera.xyz/tx/${tx.hash}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 700, color: theme.accent, textDecoration: "none" }}>View</a>}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
