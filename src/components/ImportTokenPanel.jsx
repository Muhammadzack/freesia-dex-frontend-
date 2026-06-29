import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Search, Plus, Trash2, ExternalLink } from "lucide-react";
import { ERC20_INFO_ABI, LITVM_RPC } from "../utils/constants";
import { fmtBal } from "../utils/formatters";

export default function ImportTokenPanel({ provider, account, theme }) {
  const [importedTokens, setImportedTokens] = useState(() => { try { const s = localStorage.getItem("freesia_imported_tokens"); return s ? JSON.parse(s) : []; } catch { return []; } });
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [error, setError] = useState("");
  const [balances, setBalances] = useState({});

  const fetchTokenInfo = async (addr) => {
    setError(""); setTokenInfo(null);
    if (!addr || !addr.match(/^0x[a-fA-F0-9]{40}$/)) { setError("Invalid address format"); return; }
    setLoading(true);
    try {
      const prov = provider || new ethers.JsonRpcProvider(LITVM_RPC);
      const c = new ethers.Contract(addr, ERC20_INFO_ABI, prov);
      const [name, symbol, decimals] = await Promise.all([c.name(), c.symbol(), c.decimals()]);
      setTokenInfo({ address: addr, name, symbol, decimals: Number(decimals) });
    } catch { setError("Cannot fetch token info. Make sure address is a valid ERC20 contract."); }
    finally { setLoading(false); }
  };

  const addToken = () => {
    if (!tokenInfo) return;
    if (importedTokens.find(t => t.address.toLowerCase() === tokenInfo.address.toLowerCase())) { setError("Token already imported!"); return; }
    const updated = [...importedTokens, tokenInfo];
    setImportedTokens(updated);
    localStorage.setItem("freesia_imported_tokens", JSON.stringify(updated));
    setAddress(""); setTokenInfo(null); setError("");
  };

  const removeToken = (addr) => {
    const updated = importedTokens.filter(t => t.address.toLowerCase() !== addr.toLowerCase());
    setImportedTokens(updated);
    localStorage.setItem("freesia_imported_tokens", JSON.stringify(updated));
  };

  useEffect(() => {
    if (!account || !provider) return;
    const updateBalances = async () => {
      const bals = {};
      for (const t of importedTokens) {
        try { const c = new ethers.Contract(t.address, ERC20_INFO_ABI, provider); const b = await c.balanceOf(account); bals[t.address] = ethers.formatUnits(b, t.decimals); } catch { bals[t.address] = "0"; }
      }
      setBalances(bals);
    };
    updateBalances();
  }, [account, provider, importedTokens]);

  return (
    <div style={{ backgroundColor: theme.card, borderRadius: 24, padding: 24, border: `1px solid ${theme.border}` }}>
      <h3 style={{ margin: "0 0 8px 0", fontSize: 20, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}><Search size={20} /> Import Token</h3>
      <p style={{ fontSize: 13, color: theme.sub, marginBottom: 20 }}>Paste a contract address to add custom tokens to your DEX</p>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input type="text" placeholder="0x... contract address" value={address} onChange={e => setAddress(e.target.value)} style={{ flex: 1, padding: "14px 16px", borderRadius: 12, fontWeight: 700, fontSize: 14, border: `1px solid ${theme.border}`, backgroundColor: theme.input, color: theme.text, outline: "none", boxSizing: "border-box" }} />
        <button onClick={() => fetchTokenInfo(address)} disabled={loading || !address} style={{ padding: "14px 20px", borderRadius: 12, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", backgroundColor: theme.accent }}>{loading ? "⏳" : "Lookup"}</button>
      </div>
      {error && <div style={{ padding: 12, borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 16, backgroundColor: "#fef3c7", color: "#92400e" }}>{error}</div>}
      {tokenInfo && (
        <div style={{ padding: 20, borderRadius: 16, backgroundColor: theme.input, border: `2px solid ${theme.accent}`, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div><div style={{ fontSize: 20, fontWeight: 800 }}>{tokenInfo.name} <span style={{ color: theme.accent }}>({tokenInfo.symbol})</span></div><div style={{ fontSize: 12, color: theme.sub }}>Decimals: {tokenInfo.decimals}</div></div>
            <button onClick={addToken} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 10, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", backgroundColor: "#16a34a" }}><Plus size={16} /> Add</button>
          </div>
          <div style={{ fontSize: 11, wordBreak: "break-all", fontFamily: "monospace", color: theme.sub }}>{tokenInfo.address}</div>
        </div>
      )}
      <h4 style={{ fontSize: 16, fontWeight: 800, marginTop: 20, marginBottom: 12 }}>Your Imported Tokens ({importedTokens.length})</h4>
      {importedTokens.length === 0 ? <div style={{ textAlign: "center", padding: 32, borderRadius: 12, color: theme.sub, backgroundColor: theme.input }}>📭 No custom tokens imported yet.</div> : importedTokens.map((t, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, borderRadius: 12, backgroundColor: theme.input, border: `1px solid ${theme.border}`, marginBottom: 10 }}>
          <div><div style={{ fontWeight: 800, fontSize: 16 }}>{t.name} <span style={{ color: theme.accent }}>{t.symbol}</span></div><div style={{ fontSize: 11, fontFamily: "monospace", color: theme.sub }}>{t.address.slice(0, 20)}...{t.address.slice(-6)}</div><div style={{ fontSize: 12, fontWeight: 600, color: "#16a34a" }}>Bal: {fmtBal(balances[t.address] || "0")}</div></div>
          <div style={{ display: "flex", gap: 8 }}>
            <a href={`https://liteforge.explorer.caldera.xyz/address/${t.address}`} target="_blank" rel="noreferrer" style={{ color: theme.sub, padding: 6 }}><ExternalLink size={16} /></a>
            <button onClick={() => removeToken(t.address)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "#dc2626" }}><Trash2 size={16} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}
