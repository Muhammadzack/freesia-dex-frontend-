import { ScrollText, Trash2 } from "lucide-react";

export default function HistoryPanel({ txHistory, theme }) {
  const clearHistory = () => { localStorage.removeItem("freesia_tx_history"); window.location.reload(); };
  return (
    <div style={{ backgroundColor: theme.card, borderRadius: 24, padding: 24, border: `1px solid ${theme.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}><ScrollText size={20} /> Transaction History</h3>
        {txHistory.length > 0 && <button onClick={clearHistory} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", backgroundColor: "#fef2f2", color: "#dc2626" }}><Trash2 size={14} /> Clear</button>}
      </div>
      {txHistory.length === 0 ? <div style={{ textAlign: "center", padding: 32, borderRadius: 12, color: theme.sub, backgroundColor: theme.input }}>📭 No transactions yet. Start trading!</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {txHistory.map(tx => (
            <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, borderRadius: 12, backgroundColor: theme.input, border: `1px solid ${theme.border}` }}>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{tx.type}</div><div style={{ fontSize: 12, color: theme.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tx.detail}</div></div>
              <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}><div style={{ fontSize: 12, fontWeight: 700, color: theme.sub, marginBottom: 2 }}>{tx.time}</div>{tx.hash && <a href={`https://liteforge.explorer.caldera.xyz/tx/${tx.hash}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 700, color: theme.accent, textDecoration: "none" }}>View →</a>}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
