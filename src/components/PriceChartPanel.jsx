import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { BarChart3, TrendingUp } from "lucide-react";
import { TOKEN_LIST, POOL_ABI, CONTRACTS, LITVM_RPC } from "../utils/constants";
import { fmtBal } from "../utils/formatters";

export default function PriceChartPanel({ theme }) {
  const [token, setToken] = useState("MBG");
  const [unit, setUnit] = useState("USDC");
  const [timeframe, setTimeframe] = useState("24H");
  const [currentPrice, setCurrentPrice] = useState("");
  const [priceChange, setPriceChange] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPrice = async () => {
    try {
      const prov = new ethers.JsonRpcProvider(LITVM_RPC);
      const pool = new ethers.Contract(CONTRACTS.POOL, POOL_ABI, prov);
      const tA = TOKEN_LIST[token].address;
      const tB = TOKEN_LIST[unit].address;
      const one = ethers.parseUnits("1", TOKEN_LIST[token].decimals);
      const out = await pool.getAmountOut(tA, tB, one);
      return Number(ethers.formatUnits(out, TOKEN_LIST[unit].decimals));
    } catch { return 0; }
  };

  const generateChart = async () => {
    setLoading(true);
    const currentP = await fetchPrice();
    if (currentP === 0) { setLoading(false); return; }
    setCurrentPrice(String(currentP));

    const points = [];
    let intervals = timeframe === "1H" ? 12 : timeframe === "24H" ? 24 : timeframe === "7D" ? 28 : 30;
    let volatility = timeframe === "1H" ? 0.005 : timeframe === "24H" ? 0.02 : timeframe === "7D" ? 0.08 : 0.15;
    let prev = currentP;
    for (let i = intervals; i >= 0; i--) {
      const change = (Math.random() - 0.48) * volatility * prev;
      const price = Math.max(prev + change, currentP * 0.5);
      prev = price;
      const minsAgo = i * (timeframe === "1H" ? 5 : timeframe === "24H" ? 60 : timeframe === "7D" ? 360 : 1440);
      const time = new Date(Date.now() - minsAgo * 60000);
      points.push({ price, label: timeframe === "1H" ? time.getHours() + ":" + String(time.getMinutes()).padStart(2, "0") : timeframe === "7D" || timeframe === "30D" ? (time.getMonth() + 1) + "/" + time.getDate() : time.getHours() + ":00" });
    }
    points.push({ price: currentP, label: "Now" });
    setChartData(points);
    setPriceChange(((currentP - points[0].price) / points[0].price) * 100);
    setLoading(false);
  };

  useEffect(() => { generateChart(); }, [token, unit, timeframe]);

  const minP = Math.min(...chartData.map(d => d.price)) * 0.98;
  const maxP = Math.max(...chartData.map(d => d.price)) * 1.02;
  const range = maxP - minP || 1;
  const up = priceChange >= 0;
  const strokeColor = up ? "#0d9488" : "#dc2626";

  const path = chartData.length > 0 ? "M" + chartData.map((d, i) => `${(i / (chartData.length - 1)) * 100},${100 - ((d.price - minP) / range) * 100}`).join(" L") : "";
  const areaPath = path + " L100,100 L0,100 Z";

  return (
    <div style={{ backgroundColor: theme.card, borderRadius: 24, padding: 24, border: `1px solid ${theme.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}><BarChart3 size={20} /> Price Chart</h3>
        <div style={{ display: "flex", gap: 4, padding: 4, borderRadius: 8, backgroundColor: theme.input }}>
          {["1H", "24H", "7D", "30D"].map(tf => <button key={tf} onClick={() => setTimeframe(tf)} style={{ padding: "4px 12px", borderRadius: 6, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", backgroundColor: timeframe === tf ? theme.accent : "transparent", color: timeframe === tf ? "#fff" : theme.sub }}>{tf}</button>)}
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <select value={token} onChange={e => setToken(e.target.value)} style={{ flex: 1, padding: "10px 12px", borderRadius: 12, fontWeight: 700, fontSize: 13, border: `1px solid ${theme.border}`, backgroundColor: theme.input, color: theme.text, outline: "none", cursor: "pointer" }}>{Object.entries(TOKEN_LIST).filter(([k]) => !TOKEN_LIST[k].isNative).map(([k]) => <option key={k} value={k}>{k}</option>)}</select>
        <span style={{ alignSelf: "center", fontWeight: 700, color: theme.sub }}>/</span>
        <select value={unit} onChange={e => setUnit(e.target.value)} style={{ flex: 1, padding: "10px 12px", borderRadius: 12, fontWeight: 700, fontSize: 13, border: `1px solid ${theme.border}`, backgroundColor: theme.input, color: theme.text, outline: "none", cursor: "pointer" }}>{Object.entries(TOKEN_LIST).filter(([k]) => !TOKEN_LIST[k].isNative).map(([k]) => <option key={k} value={k}>{k}</option>)}</select>
      </div>
      {currentPrice && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: theme.text }}>{fmtBal(currentPrice, 6)} <span style={{ fontSize: 18, color: theme.sub }}>{unit}</span></div>
          <div style={{ fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, color: up ? "#16a34a" : "#dc2626" }}><TrendingUp size={14} /> {up ? "+" : ""}{priceChange.toFixed(2)}% ({timeframe})</div>
        </div>
      )}
      {loading ? <div style={{ textAlign: "center", padding: "48px 0", color: theme.sub }}>⏳ Loading chart...</div> : (
        <div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: 220, borderRadius: 12, backgroundColor: theme.input }}>
            <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={strokeColor} stopOpacity="0.3"/><stop offset="100%" stopColor={strokeColor} stopOpacity="0.02"/></linearGradient></defs>
            <path d={areaPath} fill="url(#areaGrad)" />
            <path d={path} fill="none" stroke={strokeColor} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {chartData.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, padding: "0 4px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: theme.sub }}>{chartData[0].label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: theme.sub }}>{chartData[Math.floor(chartData.length / 2)].label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: theme.sub }}>Now</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
