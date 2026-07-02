import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Droplets, ExternalLink } from "lucide-react";
import { TOKEN_LIST, ERC20_ABI, FAUCET_AMOUNT } from "../utils/constants";
import { fmtBal } from "../utils/formatters";
import TokenLogo from "./TokenLogo";
import { withRetry } from "../utils/rpc";

export default function FaucetPanel({ account, signer, provider, showToast, theme, addHistory }) {
  const [loading, setLoading] = useState(null);
  const [claimAmt, setClaimAmt] = useState(FAUCET_AMOUNT);

  const claim = async (symbol) => {
    if (!signer || !account) return showToast("❌", "Connect wallet!");
    if (symbol === "zkLTC") { window.open("https://liteforge.faucet.caldera.xyz/", "_blank"); return; }
    setLoading(symbol);
    try {
      const token = new ethers.Contract(TOKEN_LIST[symbol].address, ERC20_ABI, signer);
      const amt = ethers.parseUnits(claimAmt, TOKEN_LIST[symbol].decimals);

      // Try to estimate gas first
      let gasLimit = 300000;
      try {
        const estimated = await token.faucet.estimateGas(amt);
        gasLimit = Math.floor(Number(estimated) * 1.5); // Add 50% buffer
      } catch { /* Use default */ }

      showToast("⏳", `Claiming ${claimAmt} ${symbol}...`);
      const tx = await token.faucet(amt, { gasLimit });
      await tx.wait();
      showToast("✅", `Claimed ${claimAmt} ${symbol}!`);
      addHistory("faucet", `Claimed ${claimAmt} ${symbol}`, tx.hash);
    } catch (err) {
      const msg = err?.reason || err?.message || "";
      if (msg.includes("-32005")) showToast("❌", "RPC rate limit. Wait 10s and retry.");
      else if (msg.includes("insufficient")) showToast("❌", "Need zkLTC for gas. Go to external faucet first!");
      else if (msg.includes("faucet")) showToast("❌", "Faucet empty or rate limited.");
      else showToast("❌", msg.slice(0, 60));
    }
    finally { setLoading(null); }
  };


  const [userBalances, setUserBalances] = useState({});

  useEffect(() => {
    if (!account || !provider) return;
    const fetchAll = async () => {
      const b = {};
for (const [sym] of Object.entries(TOKEN_LIST)) {
  try {
    if (TOKEN_LIST[sym].isNative) {
      const bal = await withRetry(() => provider.getBalance(account));
      b[sym] = ethers.formatEther(bal);
    } else {
      const token = new ethers.Contract(TOKEN_LIST[sym].address, ERC20_ABI, provider);
      const bal = await withRetry(() => token.balanceOf(account));
      b[sym] = ethers.formatUnits(bal, TOKEN_LIST[sym].decimals);
    }
  } catch { b[sym] = "0"; }
  await new Promise(res => setTimeout(res, 300));
}
      setUserBalances(b);
    };
    fetchAll();
  }, [account, provider]);

  return (
    <div style={{ backgroundColor: theme.card, borderRadius: 24, padding: 24, border: `1px solid ${theme.border}` }}>
      <h3 style={{ margin: "0 0 8px 0", fontSize: 20, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}><Droplets size={20} /> Faucet Hub</h3>
      <p style={{ fontSize: 13, color: theme.sub, marginBottom: 16 }}>Get free test tokens for LitVM Testnet.</p>

      {/* Amount selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: 12, borderRadius: 12, backgroundColor: theme.input }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: theme.sub }}>Amount:</span>
        <input type="number" value={claimAmt} onChange={e => setClaimAmt(e.target.value)} style={{ width: 80, padding: "6px 10px", borderRadius: 8, border: `1px solid ${theme.border}`, backgroundColor: theme.card, color: theme.text, fontWeight: 700, fontSize: 14, outline: "none" }} />
        <span style={{ fontSize: 12, color: theme.sub }}>tokens</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: theme.sub }}>zkLTC: {fmtBal(userBalances.zkLTC || "0", 6)}</span>
      </div>

      {/* zkLTC warning */}
      {(!userBalances.zkLTC || Number(userBalances.zkLTC) < 0.001) && (
        <div style={{ padding: 12, borderRadius: 10, backgroundColor: "#fef3c7", color: "#92400e", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          ⚠️ You need zkLTC for gas fees. Claim zkLTC from the external faucet first!
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {Object.entries(TOKEN_LIST).map(([sym, info]) => (
          <div key={sym} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, borderRadius: 16, backgroundColor: theme.input, border: `1px solid ${theme.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <TokenLogo symbol={sym} size={32} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{sym}</div>
                <div style={{ fontSize: 12, color: theme.sub }}>{info.name}</div>
                {!info.isNative && <div style={{ fontSize: 11, color: theme.accent }}>Bal: {fmtBal(userBalances[sym] || "0")}</div>}
              </div>
            </div>
            <button onClick={() => claim(sym)} disabled={!!loading} style={{ padding: "10px 20px", borderRadius: 10, border: "none", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", backgroundColor: sym === "zkLTC" ? theme.accent2 : theme.accent, opacity: loading === sym ? 0.5 : 1 }}>
              {sym === "zkLTC" ? <><ExternalLink size={14} style={{ verticalAlign: "middle", marginRight: 4 }} /> Get zkLTC</> : (loading === sym ? "⏳" : `Claim ${claimAmt}`)}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
