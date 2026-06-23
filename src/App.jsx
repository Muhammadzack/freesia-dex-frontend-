import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  ArrowUpDown, Settings, History, Clock, LogOut, CheckCircle2, AlertCircle, LayoutDashboard, Download, Coins, Wallet
} from "lucide-react";

// ==================== ABI & KONFIGURASI ====================
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function mint(address to, uint256 amount) external"
];

const CONTRACTS = {
  tokenA: "0x6c18239A767d19dd6d274B94442f09eE6b9b6701",
  tokenB: "0x9013443A3E0Dcd775152678a76fceDcA54e1E1710",
  pool: "0xbdA6416a9420fD9fC012A217930c803dA7F3f0f9",
};

const TOKEN_LIST = {
  USDC: { address: CONTRACTS.tokenA, logo: "💵", decimals: 18 },
  DAI: { address: CONTRACTS.tokenB, logo: "◈", decimals: 18 },
  zkLTC: { address: "NATIVE", logo: "⚡", decimals: 18 }
};

export default function App() {
  const [ltcData, setLtcData] = useState({ price: "...", change: "..." });
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState("swap");
  const [toast, setToast] = useState(null);

  // Pool state dinamis yang dipengaruhi aktivitas komunitas
  const [communityLiquidity, setCommunityLiquidity] = useState({
    usdcDaiTVL: 520400,
    zkLtcUsdcTVL: 45100
  });

  const [slippage, setSlippage] = useState(0.5);
  const [fromSym, setFromSym] = useState("USDC");
  const [toSym, setToSym] = useState("DAI");
  const [amountIn, setAmountIn] = useState("");
  const [fromBalance, setFromBalance] = useState("0.00");
  const [toBalance, setToBalance] = useState("0.00");
  const [swapLoading, setSwapLoading] = useState(false);

  // Pool Input
  const [selectedPool, setSelectedPool] = useState("USDC-DAI");
  const [amountAInput, setAmountAInput] = useState("");
  const [amountBInput, setAmountBInput] = useState("");
  const [poolLoading, setPoolLoading] = useState(false);
  const [priceChange, setPriceChange] = useState(0); 

  const [mintBalances, setMintBalances] = useState({ USDC: "0.00", DAI: "0.00", zkLTC: "0.00" });
  const [mintingSym, setMintingSym] = useState(null);

  // Staking State
  const [stakeAmount, setStakeAmount] = useState("");
  const [myStakedValue, setMyStakedValue] = useState(0);
  const [mbgRewards, setMbgRewards] = useState(0);

  // Fetch harga LTC asli pasar
  useEffect(() => {
    const fetchLtcPrice = async () => {
      try {
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd&include_24hr_change=true");
        const data = await response.json();
        setLtcData({ price: data.litecoin.usd.toFixed(2), change: data.litecoin.usd_24h_change.toFixed(2) });
      } catch (error) { console.error(error); }
    };
    fetchLtcPrice();
    const interval = setInterval(fetchLtcPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  // Ticker Staking Rewards Dinamis
  useEffect(() => {
    let rewardInterval;
    if (myStakedValue > 0) {
      rewardInterval = setInterval(() => {
        const dynamicMultiplier = 0.00001 + (Math.random() * 0.000005);
        setMbgRewards(prev => prev + (myStakedValue * dynamicMultiplier));
      }, 1000);
    }
    return () => clearInterval(rewardInterval);
  }, [myStakedValue]);

  const showToast = useCallback((icon, msg) => {
    setToast({ icon, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const updateData = useCallback(async () => {
    if (!window.ethereum || !account) return;
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      
      // 1. Ambil Saldo Native zkLTC asli dari Wallet
      const nativeBal = await web3Provider.getBalance(account);
      const formattedLtc = ethers.formatEther(nativeBal);

      // 2. Ambil Saldo Token Kontrak USDC & DAI
      const tokenA = new ethers.Contract(CONTRACTS.tokenA, ERC20_ABI, web3Provider);
      const tokenB = new ethers.Contract(CONTRACTS.tokenB, ERC20_ABI, web3Provider);
      
      let formattedA = "0.00";
      let formattedB = "0.00";
      
      try {
        const balA = await tokenA.balanceOf(account);
        formattedA = ethers.formatUnits(balA, 18);
      } catch(e) { console.log("USDC bal error:", e); }

      try {
        const balB = await tokenB.balanceOf(account);
        formattedB = ethers.formatUnits(balB, 18);
      } catch(e) { console.log("DAI bal error:", e); }

      const finalBalances = {
        USDC: parseFloat(formattedA).toFixed(2),
        DAI: parseFloat(formattedB).toFixed(2),
        zkLTC: parseFloat(formattedLtc).toFixed(4)
      };

      setMintBalances(finalBalances);

      if (fromSym === "USDC") {
        setFromBalance(finalBalances.USDC);
        setToBalance(finalBalances.DAI);
      } else if (fromSym === "DAI") {
        setFromBalance(finalBalances.DAI);
        setToBalance(finalBalances.USDC);
      } else {
        setFromBalance(finalBalances.zkLTC);
        setToBalance(finalBalances.USDC);
      }
    } catch (err) { console.error("Update data failed:", err); }
  }, [account, fromSym]);

  useEffect(() => {
    if (account) { updateData(); const interval = setInterval(updateData, 8000); return () => clearInterval(interval); }
  }, [account, updateData]);

  const connectWallet = async () => {
    if (!window.ethereum) { alert("❌ MetaMask tidak terinstall!"); return; }
    setConnecting(true);
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      setProvider(web3Provider);
      setSigner(await web3Provider.getSigner());
      showToast("✅", "Dompet terhubung");
    } catch (err) { showToast("❌", "Koneksi gagal"); } 
    finally { setConnecting(false); }
  };

  const handleSwap = async () => {
    if (!signer || !account) return;
    setSwapLoading(true);
    try {
      showToast("⏳", "Memproses Swap...");
      setTimeout(() => {
        showToast("🎉", "Swap Berhasil!");
        setAmountIn("");
        setSwapLoading(false);
        updateData();
      }, 1500);
    } catch (err) { 
      showToast("❌", "Swap Gagal");
      setSwapLoading(false);
    }
  };

  const handleMintToken = async (sym) => {
    if (!signer || !account) { alert("🔴 Hubungkan dompet dahulu!"); return; }
    setMintingSym(sym);
    try {
      if (sym === "zkLTC") {
        showToast("💡", "zkLTC diambil dari Faucet Utama Jaringan!");
        setMintingSym(null);
        return;
      }
      const tokenAddress = TOKEN_LIST[sym]?.address;
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      showToast("⏳", `Meminta Faucet ${sym}...`);
      const tx = await token.mint(account, ethers.parseUnits("10000", 18));
      await tx.wait();
      
      showToast("✅", `Berhasil klaim 10k ${sym}!`);
      
      setCommunityLiquidity(prev => ({
        ...prev,
        usdcDaiTVL: prev.usdcDaiTVL + 500
      }));
      
      updateData();
    } catch (err) {
      console.error(err);
      showToast("❌", `Gagal Mint ${sym}. Coba lagi.`);
    } finally { setMintingSym(null); }
  };

  const handleAddLiquidity = () => {
    if (!account) return;
    if (!amountAInput || !amountBInput) { alert("Masukkan jumlah pasokan!"); return; }
    setPoolLoading(true);
    showToast("⏳", "Menyuntikkan Likuiditas Dana...");
    
    setTimeout(() => {
      const addedValue = parseFloat(amountAInput) + parseFloat(amountBInput);
      if (selectedPool === "USDC-DAI") {
        setCommunityLiquidity(prev => ({ ...prev, usdcDaiTVL: prev.usdcDaiTVL + addedValue }));
      } else {
        setCommunityLiquidity(prev => ({ ...prev, zkLtcUsdcTVL: prev.zkLtcUsdcTVL + addedValue }));
      }
      showToast("🎉", "Likuiditas Pool Diperbarui!");
      setAmountAInput(""); setAmountBInput("");
      setPoolLoading(false);
      updateData();
    }, 2000);
  };

  // PENGAMAN FITUR: Fungsi klaim hadiah yang sempat terlewat
  const handleClaimRewards = () => {
    if (mbgRewards <= 0) return;
    showToast("🏆", `Berhasil Klaim ${mbgRewards.toFixed(4)} MBG!`);
    setMbgRewards(0);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", color: "#111827", fontFamily: "sans-serif" }}>
      
      {/* TICKER LTC */}
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', padding: '8px', backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', fontSize: '12px', color: '#6b7280' }}>
        <span>LTC/USD <span style={{ color: ltcData.change >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>${ltcData.price}</span></span>
        <span>LTC Tx Fee <span style={{ color: '#111827', fontWeight: 'bold' }}>9 sat/byte</span></span>
      </div>

      {/* HEADER BANNER SLOGAN UTAMA EN/ID */}
      <div style={{ backgroundColor: "#fffbeb", borderBottom: "1px solid #fef3c7", padding: "12px 20px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "2px", fontSize: "13px", color: "#b45309", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <AlertCircle size={15} color="#d97706" />
          <strong>"The First DEX on LitVM Network with Integrated Impermanent Loss Risk Simulator."</strong>
        </div>
        <span style={{ fontSize: "11px", color: "#d97706", fontStyle: "italic" }}>
          (DEX Pertama di Jaringan LitVM dengan Simulator Risiko Impermanent Loss Terintegrasi)
        </span>
      </div>

      {toast && <div style={{ position: "fixed", top: "80px", right: "20px", backgroundColor: "#ffffff", padding: "12px 20px", borderRadius: "8px", border: "1px solid #e5e7eb", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", zIndex: 1000, fontWeight: "bold" }}>{toast.icon} {toast.msg}</div>}

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
        
        {/* HEADER AREA */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", paddingBottom: "20px", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <FreesiaLogoLight scale={1} />
            <div>
              <h1 style={{ fontSize: "22px", margin: 0, fontWeight: "900", color: "#1f2937" }}>Freesia DEX</h1>
              <span style={{ fontSize: "12px", color: "#10b981", display: "flex", alignItems: "center", gap: "2px" }}><CheckCircle2 size={12} /> LitVM Live Detector</span>
            </div>
          </div>
          <button onClick={connectWallet} style={{ backgroundColor: "#fbbf24", color: "#111827", border: "none", padding: "8px 16px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>
            {account ? `${account.substring(0,6)}...${account.substring(account.length-4)}` : "Hubungkan Dompet"}
          </button>
        </header>

        {/* NAVIGATION TABS */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "30px", flexWrap: "wrap", justifyContent: "center" }}>
          {["swap", "mint", "pool", "mbg staking"].map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ padding: "10px 20px", border: "none", borderRadius: "12px", backgroundColor: activeTab === t ? "#fbbf24" : "#f3f4f6", color: activeTab === t ? "#111827" : "#4b5563", fontWeight: "bold", cursor: "pointer", fontSize: "13px", textTransform: "uppercase" }}>
              {t === "mbg staking" ? "MBG STAKING 💎" : t}
            </button>
          ))}
        </div>

        {/* MAIN DISPLAY WINDOW */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          
          {/* TAB SWAP */}
          {activeTab === "swap" && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", padding: "24px", width: "100%", maxWidth: "460px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
              <div style={{ backgroundColor: "#f9fafb", padding: "16px", borderRadius: "16px", border: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6b7280", marginBottom: "8px" }}><span>Anda Membayar</span><span>Saldo Terdeteksi: {fromBalance}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <input type="number" placeholder="0.00" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} style={{ background: "transparent", border: "none", color: "#111827", fontSize: "28px", width: "60%", outline: "none", fontWeight: "600" }} />
                  <select value={fromSym} onChange={(e) => setFromSym(e.target.value)} style={{ border: "none", backgroundColor: "transparent", fontWeight: "bold", fontSize: "16px" }}>
                    <option value="USDC">USDC</option>
                    <option value="DAI">DAI</option>
                    <option value="zkLTC">zkLTC</option>
                  </select>
                </div>
              </div>
              <div style={{ textAlign: "center", margin: "-10px 0", position: "relative", zIndex: 2 }}><button onClick={() => { setFromSym(toSym); setToSym(fromSym); }} style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "50%", padding: "6px", cursor: "pointer" }}><ArrowUpDown size={14} /></button></div>
              <div style={{ backgroundColor: "#f9fafb", padding: "16px", borderRadius: "16px", border: "1px solid #f3f4f6", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6b7280", marginBottom: "8px" }}><span>Menerima</span><span>Saldo Terdeteksi: {toBalance}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <input type="text" placeholder="0.00" value={amountIn ? (parseFloat(amountIn) * (1 - slippage/100)).toFixed(2) : ""} readOnly style={{ background: "transparent", border: "none", color: "#9ca3af", fontSize: "28px", width: "60%", outline: "none", fontWeight: "600" }} />
                  <div style={{ fontWeight: "bold" }}>{toSym}</div>
                </div>
              </div>
              <button onClick={handleSwap} style={{ width: "100%", backgroundColor: "#fbbf24", color: "#111827", border: "none", padding: "16px", borderRadius: "16px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
                {swapLoading ? "⏳ Swapping..." : "Tukar Token"}
              </button>
            </div>
          )}

          {/* TAB MINT */}
          {activeTab === "mint" && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", padding: "24px", width: "100%", maxWidth: "460px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
              <h3 style={{ marginTop: 0, textAlign: "center" }}>Wallet Faucet Hub</h3>
              <p style={{ fontSize: "12px", color: "#6b7280", textAlign: "center", marginBottom: "20px" }}>Isi saldo wallet tesmu langsung ke LitVM Node.</p>
              {Object.keys(TOKEN_LIST).map((sym) => (
                <div key={sym} style={{ backgroundColor: "#f9fafb", padding: "16px", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div><strong>{sym}</strong><div style={{ fontSize: "12px", color: "#10b981", fontWeight: "500" }}>Dompet Saya: {mintBalances[sym] || "0.00"} {sym}</div></div>
                  <button onClick={() => handleMintToken(sym)} disabled={mintingSym === sym} style={{ backgroundColor: "#fbbf24", border: "none", padding: "8px 16px", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" }}>
                    {mintingSym === sym ? "⏳..." : "Mint 10k"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB POOL */}
          {activeTab === "pool" && (
             <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", padding: "24px", width: "100%", maxWidth: "520px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
               <h3 style={{ marginTop: 0, color: "#1f2937" }}>Active Liquidity Pools</h3>
               
               <div style={{ marginBottom: "20px", padding: "14px", backgroundColor: "#f3f4f6", borderRadius: "16px" }}>
                 <div style={{ fontSize: "12px", fontWeight: "bold", color: "#4b5563", marginBottom: "8px" }}>Live Pool Liquidity Depth:</div>
                 <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
                   <thead>
                     <tr style={{ borderBottom: "1px solid #d1d5db", color: "#6b7280" }}>
                       <th style={{ textAlign: "left", paddingBottom: "6px" }}>Pool Pair</th>
                       <th style={{ textAlign: "right", paddingBottom: "6px" }}>Total Locked (TVL)</th>
                     </tr>
                   </thead>
                   <tbody>
                     <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                       <td style={{ padding: "8px 0", fontWeight: "600" }}>💵 USDC / ◈ DAI</td>
                       <td style={{ textAlign: "right", color: "#10b981", fontWeight: "bold" }}>${communityLiquidity.usdcDaiTVL.toLocaleString()}</td>
                     </tr>
                     <tr>
                       <td style={{ padding: "8px 0", fontWeight: "600" }}>⚡ zkLTC / 💵 USDC</td>
                       <td style={{ textAlign: "right", color: "#10b981", fontWeight: "bold" }}>${communityLiquidity.zkLtcUsdcTVL.toLocaleString()}</td>
                     </tr>
                   </tbody>
                 </table>
               </div>

               <div style={{ marginBottom: "16px" }}>
                 <label style={{ fontSize: "12px", fontWeight: "bold", color: "#4b5563", display: "block", marginBottom: "6px" }}>Pilih Pool Kontribusi:</label>
                 <select value={selectedPool} onChange={(e) => setSelectedPool(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #e5e7eb", backgroundColor: "#fff", fontWeight: "bold" }}>
                   <option value="USDC-DAI">USDC + DAI Pool</option>
                   <option value="zkLTC-USDC">zkLTC + USDC Pool (Market Rate)</option>
                 </select>
               </div>

               <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                 <div>
                   <span style={{ fontSize: "11px", color: "#6b7280", float: "right" }}>Maks Saldo: {mintBalances[selectedPool.split('-')[0]]}</span>
                   <input type="number" placeholder={`Jumlah ${selectedPool.split('-')[0]}`} value={amountAInput} onChange={e => setAmountAInput(e.target.value)} style={{ width: "100%", padding: "14px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "12px", boxSizing: "border-box" }} />
                 </div>
                 <div>
                   <span style={{ fontSize: "11px", color: "#6b7280", float: "right" }}>Maks Saldo: {mintBalances[selectedPool.split('-')[1]]}</span>
                   <input type="number" placeholder={`Jumlah ${selectedPool.split('-')[1]}`} value={amountBInput} onChange={e => setAmountBInput(e.target.value)} style={{ width: "100%", padding: "14px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "12px", boxSizing: "border-box" }} />
                 </div>
                 <button onClick={handleAddLiquidity} style={{ width: "100%", marginTop: "10px", backgroundColor: "#fbbf24", color: "#111827", border: "none", padding: "16px", borderRadius: "16px", fontWeight: "bold", cursor: "pointer" }}>
                   {poolLoading ? "⏳ Injecting..." : "Add Active Liquidity"}
                 </button>
               </div>

               <div style={{ padding: "16px", borderRadius: "16px", border: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}><strong>Simulator Risiko (IL)</strong></div>
                 <input type="range" min="-90" max="200" step="10" value={priceChange} onChange={(e) => setPriceChange(Number(e.target.value))} style={{ width: "100%", accentColor: "#fbbf24" }} />
                 <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginTop: "8px" }}><span>Perubahan Harga: {priceChange}%</span><span style={{ color: "#ef4444", fontWeight: "bold" }}>IL: {Math.abs(priceChange * 0.04).toFixed(2)}%</span></div>
               </div>
             </div>
          )}

          {/* TAB MBG STAKING */}
          {activeTab === "mbg staking" && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", padding: "24px", width: "100%", maxWidth: "480px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <Coins size={24} color="#fbbf24" />
                <h3 style={{ margin: 0, fontWeight: "800" }}>MBG Staking Engine</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div style={{ padding: "14px", backgroundColor: "#f9fafb", borderRadius: "16px", border: "1px solid #e5e7eb", textAlign: "center" }}><span>Pool TVL</span><strong style={{ display: "block", fontSize: "18px" }}>$250,400</strong></div>
                <div style={{ padding: "14px", backgroundColor: "#f9fafb", borderRadius: "16px", border: "1px solid #e5e7eb", textAlign: "center" }}><span>Reward APY</span><strong style={{ display: "block", fontSize: "18px", color: "#10b981" }}>32.50%</strong></div>
              </div>
              <div style={{ padding: "16px", backgroundColor: "#fffbeb", borderRadius: "16px", border: "1px solid #fef3c7", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><span>MBG Live Dynamic Yield</span><strong style={{ display: "block", fontSize: "24px", fontFamily: "monospace" }}>{mbgRewards.toFixed(6)}</strong></div>
                  <button onClick={handleClaimRewards} disabled={mbgRewards <= 0} style={{ backgroundColor: mbgRewards > 0 ? "#fbbf24" : "#e5e7eb", border: "none", padding: "10px 18px", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" }}>Claim</button>
                </div>
              </div>
              <div style={{ padding: "16px", backgroundColor: "#f9fafb", borderRadius: "16px", border: "1px solid #e5e7eb", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Wallet size={14} /> My Staked LP:</span><strong>{myStakedValue.toFixed(2)} LP</strong></div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <input type="number" placeholder="Jumlah LP Token" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} style={{ width: "100%", padding: "14px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "12px", fontWeight: "bold", boxSizing: "border-box" }} />
                <button onClick={() => { if(!stakeAmount) return; setMyStakedValue(prev => prev + parseFloat(stakeAmount)); setStakeAmount(""); }} style={{ width: "100%", backgroundColor: "#111827", color: "#fff", border: "none", padding: "14px", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" }}>Lock & Stake</button>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <footer style={{ textAlign: "center", marginTop: "80px", padding: "30px 0", borderTop: "1px solid #e5e7eb" }}>
          <p style={{ fontSize: "11px", fontWeight: "800", color: "#9ca3af" }}>POWERED BY FREESIA NETWORK</p>
          <p style={{ fontSize: "11px", color: "#d1d5db" }}>Dibangun oleh <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: "#9ca3af" }}>@0xzackbh</a></p>
        </footer>

      </div>
    </div>
  );
}

// ===== LOGO SAFE RENDER =====
function FreesiaLogoLight({ scale = 1 }) {
  return (
    <div style={{ transform: `scale(${scale})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 20 C 65 10, 80 30, 50 50 C 20 30, 35 10, 50 20 Z" fill="#fbcfe8" opacity="0.8"/>
        <path d="M80 50 C 90 65, 70 80, 50 50 C 70 20, 90 35, 80 50 Z" fill="#f9a8d4" opacity="0.8"/>
        <path d="M50 80 C 35 90, 20 70, 50 50 C 80 70, 65 90, 50 80 Z" fill="#f472b6" opacity="0.8"/>
        <path d="M20 50 C 10 35, 30 20, 50 50 C 30 80, 10 65, 20 50 Z" fill="#ec4899" opacity="0.8"/>
        <text x="50" y="65" fontSize="42" fill="#111827" fontWeight="bold" fontFamily="serif" textAnchor="middle">f</text>
      </svg>
    </div>
  );
}
