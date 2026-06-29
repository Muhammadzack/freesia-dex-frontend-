import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Target, Bell, Trash2, TrendingUp, TrendingDown, Play } from "lucide-react";
import { TOKEN_LIST, ERC20_ABI, POOL_ABI, CONTRACTS, LITVM_RPC } from "../utils/constants";
import { fmtBal } from "../utils/formatters";

export default function LimitOrderPanel({ account, signer, provider, showToast, theme }) {
  const [orders, setOrders] = useState(() => { try { const s = localStorage.getItem("freesia_limit_orders"); return s ? JSON.parse(s) : []; } catch { return []; } });
  const [mode, setMode] = useState("buy");
  const [token, setToken] = useState("MBG");
  const [amount, setAmount] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [priceUnit, setPriceUnit] = useState("USDC");

  const fetchPrice = async () => {
    try {
      const prov = provider || new ethers.JsonRpcProvider(LITVM_RPC);
      const pool = new ethers.Contract(CONTRACTS.POOL, POOL_ABI, prov);
      const tA = TOKEN_LIST[token].address;
      const tB = TOKEN_LIST[priceUnit].address;
      const one = ethers.parseUnits("1", TOKEN_LIST[token].decimals);
      const out = await pool.getAmountOut(tA, tB, one);
      setCurrentPrice(ethers.formatUnits(out, TOKEN_LIST[priceUnit].decimals));
    } catch { setCurrentPrice(""); }
  };
  useEffect(() => { fetchPrice(); const iv = setInterval(fetchPrice, 15000); return () => clearInterval(iv); }, [token, priceUnit, provider]);

  const placeOrder = () => {
    if (!account) return showToast("❌", "Connect wallet!");
    const amt = parseFloat(amount);
    const price = parseFloat(targetPrice);
    if (!amt || amt <= 0 || !price || price <= 0) return showToast("❌", "Enter valid amount and price!");
    const order = { id: Date.now(), mode, token, priceUnit, amount: amt, targetPrice: price, created: new Date().toLocaleString("id-ID"), status: "open", executed: null, txHash: null };
    const updated = [order, ...orders];
    setOrders(updated);
    localStorage.setItem("freesia_limit_orders", JSON.stringify(updated));
    showToast("🎯", `${mode.toUpperCase()} order placed at ${price} ${priceUnit}!`);
    setAmount(""); setTargetPrice("");
  };

  const cancelOrder = (id) => {
    const updated = orders.filter(o => o.id !== id);
    setOrders(updated);
    localStorage.setItem("freesia_limit_orders", JSON.stringify(updated));
    showToast("🗑️", "Order cancelled");
  };

  const executeOrder = async (order) => {
    if (!signer || !account) return showToast("❌", "Connect wallet!");
    setLoading(true);
    try {
      const pool = new ethers.Contract(CONTRACTS.POOL, POOL_ABI, signer);
      const amt = ethers.parseUnits(String(order.amount), TOKEN_LIST[order.token].decimals);
      const tokenAddr = TOKEN_LIST[order.token].address;
      const unitAddr = TOKEN_LIST[order.priceUnit].address;
      const tokenC = new ethers.Contract(tokenAddr, ERC20_ABI, signer);
      const allow = await tokenC.allowance(account, CONTRACTS.POOL);
      if (allow < amt) { showToast("⏳", "Approving..."); await (await tokenC.approve(CONTRACTS.POOL, ethers.MaxUint256)).wait(); }
      showToast("⏳", "Executing order...");
      const minOut = ethers.parseUnits("0", TOKEN_LIST[order.priceUnit].decimals);
      let tx;
      if (order.mode === "sell") { tx = await pool.swap(tokenAddr, unitAddr, amt, minOut, { gasLimit: 500000 }); }
      else {
        const buyAmt = ethers.parseUnits(String(order.amount * order.targetPrice), TOKEN_LIST[order.priceUnit].decimals);
        const unitC = new ethers.Contract(unitAddr, ERC20_ABI, signer);
        const allB = await unitC.allowance(account, CONTRACTS.POOL);
        if (allB < buyAmt) { showToast("⏳", "Approving payment token..."); await (await unitC.approve(CONTRACTS.POOL, ethers.MaxUint256)).wait(); }
        tx = await pool.swap(unitAddr, tokenAddr, buyAmt, minOut, { gasLimit: 500000 });
      }
      await tx.wait();
      const updated = orders.map(o => o.id === order.id ? { ...o, status: "executed", executed: new Date().toLocaleString("id-ID"), txHash: tx.hash } : o);
      setOrders(updated);
      localStorage.setItem("freesia_limit_orders", JSON.stringify(updated));
      showToast("🎉", `Order executed! ${order.mode.toUpperCase()} ${order.amount} ${order.token}`);
    } catch (err) { showToast("❌", "Execution failed: " + (err.reason || err.message || "").slice(0, 60)); }
    finally { setLoading(false); }
  };

  const getOrderStatus = (order) => {
    if (order.status !== "open" || !currentPrice) return order.status;
    const cp = parseFloat(currentPrice);
    const tp = order.targetPrice;
    if (order.mode === "sell" && cp >= tp) return "executable";
    if (order.mode === "buy" && cp <= tp) return "executable";
    return "open";
  };

  const openOrders = orders.filter(o => o.status === "open");
  const execOrders = orders.filter(o => o.status === "executed");

  return (
    <div style={{ backgroundColor: theme.card, borderRadius: 24, padding: 24, border: `1px solid ${theme.border}` }}>
      <h3 style={{ margin: "0 0 8px 0", fontSize: 20, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}><Target size={20} /> Limit Order</h3>
      <p style={{ fontSize: 13, color: theme.sub, marginBottom: 16 }}>Set price targets. Execute when the price is reached.</p>
      {currentPrice && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14, borderRadius: 12, backgroundColor: theme.input, border: `1px solid ${theme.border}`, marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: theme.sub }}>Current: 1 {token} =</span>
          <strong style={{ fontSize: 18, color: theme.accent }}>{fmtBal(currentPrice, 6)} {priceUnit}</strong>
        </div>
      )}
      <div style={{ display: "flex", gap: 4, padding: 4, borderRadius: 12, backgroundColor: theme.input, marginBottom: 16 }}>
        <button onClick={() => setMode("buy")} style={{ flex: 1, padding: "10px 16px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: mode === "buy" ? "#16a34a" : "transparent", color: mode === "buy" ? "#fff" : theme.sub }}><TrendingDown size={14} /> Buy Limit</button>
        <button onClick={() => setMode("sell")} style={{ flex: 1, padding: "10px 16px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: mode === "sell" ? "#dc2626" : "transparent", color: mode === "sell" ? "#fff" : theme.sub }}><TrendingUp size={14} /> Sell Limit</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div><label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4, color: theme.sub }}>Token</label><select value={token} onChange={e => setToken(e.target.value)} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, fontWeight: 700, fontSize: 13, border: `1px solid ${theme.border}`, backgroundColor: theme.input, color: theme.text, outline: "none", cursor: "pointer", boxSizing: "border-box" }}>{Object.entries(TOKEN_LIST).filter(([k]) => !TOKEN_LIST[k].isNative).map(([k]) => <option key={k} value={k}>{k}</option>)}</select></div>
        <div><label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4, color: theme.sub }}>Price Unit</label><select value={priceUnit} onChange={e => setPriceUnit(e.target.value)} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, fontWeight: 700, fontSize: 13, border: `1px solid ${theme.border}`, backgroundColor: theme.input, color: theme.text, outline: "none", cursor: "pointer", boxSizing: "border-box" }}>{Object.entries(TOKEN_LIST).filter(([k]) => !TOKEN_LIST[k].isNative).map(([k]) => <option key={k} value={k}>{k}</option>)}</select></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div><label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4, color: theme.sub }}>Amount ({token})</label><input type="number" placeholder="0.0" value={amount} onChange={e => setAmount(e.target.value)} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, fontWeight: 700, fontSize: 15, border: `1px solid ${theme.border}`, backgroundColor: theme.input, color: theme.text, outline: "none", boxSizing: "border-box" }} /></div>
        <div><label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4, color: theme.sub }}>Target Price ({priceUnit})</label><input type="number" placeholder="0.0" value={targetPrice} onChange={e => setTargetPrice(e.target.value)} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, fontWeight: 700, fontSize: 15, border: `1px solid ${theme.border}`, backgroundColor: theme.input, color: theme.text, outline: "none", boxSizing: "border-box" }} /></div>
      </div>
      <button onClick={placeOrder} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", fontWeight: 800, fontSize: 15, color: "#fff", cursor: "pointer", backgroundColor: mode === "buy" ? "#16a34a" : "#dc2626" }}>Place {mode === "buy" ? "Buy" : "Sell"} Limit Order</button>
      <h4 style={{ fontSize: 16, fontWeight: 800, marginTop: 24, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><Bell size={16} /> Open Orders ({openOrders.length})</h4>
      {openOrders.length === 0 ? <div style={{ textAlign: "center", padding: 24, borderRadius: 12, color: theme.sub, backgroundColor: theme.input }}>📭 No open orders.</div> : openOrders.map(o => {
        const status = getOrderStatus(o);
        const isExec = status === "executable";
        return (
          <div key={o.id} style={{ padding: 16, borderRadius: 12, backgroundColor: isExec ? "#ecfdf5" : theme.input, border: `1px solid ${isExec ? "#16a34a" : theme.border}`, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 12, fontWeight: 800, backgroundColor: o.mode === "buy" ? "#dcfce7" : "#fef3c7", color: o.mode === "buy" ? "#166534" : "#92400e" }}>{o.mode.toUpperCase()}</span>
                <strong style={{ fontSize: 15 }}>{o.amount} {o.token}</strong>
              </div>
              {isExec ? <button onClick={() => executeOrder(o)} disabled={loading} style={{ padding: "8px 14px", borderRadius: 8, border: "none", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, backgroundColor: "#16a34a" }}><Play size={14} /> {loading ? "..." : "Execute"}</button> : <button onClick={() => cancelOrder(o.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}><Trash2 size={16} /></button>}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: theme.sub }}>Target: {o.targetPrice} {o.priceUnit}</span><span style={{ fontWeight: 700, color: isExec ? "#16a34a" : theme.sub }}>{isExec ? "🎯 Price reached!" : "Waiting..."}</span></div>
          </div>
        );
      })}
      {execOrders.length > 0 && <><h4 style={{ fontSize: 16, fontWeight: 800, marginTop: 20, marginBottom: 12 }}>Executed ({execOrders.length})</h4>{execOrders.slice(0, 5).map(o => <div key={o.id} style={{ padding: 12, borderRadius: 10, backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", marginBottom: 8, fontSize: 13 }}><span style={{ color: "#16a34a", fontWeight: 700 }}>✓ {o.mode.toUpperCase()}</span> {o.amount} {o.token} @ {o.targetPrice} {o.priceUnit} — {o.executed}</div>)}</>}
    </div>
  );
}
