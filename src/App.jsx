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

const POOL_ABI = [
  "function getReserves() view returns (uint256, uint256)",
  "function swap(address tokenIn, uint256 amountIn) external",
  "function addLiquidity(uint256 amountA, uint256 amountB) external"
];

const CONTRACTS = {
  tokenA: "0x6c18239A767d19dd6d274B94442f09eE6b9b6701",
  tokenB: "0x9013443A3E0Dcd775152678a76fceDcA54e1E1710",
  pool: "0xbdA6416a9420fD9fC012A217930c803dA7F3f0f9",
};

const TOKEN_LIST = {
  USDC: { address: CONTRACTS.tokenA, logo: "💵", decimals: 18 },
  DAI: { address: CONTRACTS.tokenB, logo: "◈", decimals: 18 },
  zkLTC: { address: "0xNativeLTCPlatformFaucetAddress", logo: "⚡", decimals: 18 },
  USDT: { address: null, logo: "💲", decimals: 6 }
};

const LITVM_CHAIN_ID = 4441;
const LITVM_CHAIN_ID_HEX = "0x1159";

// ==================== KOMPONEN UTAMA ====================
export default function App() {
  const [ltcData, setLtcData] = useState({ price: "...", change: "..." });
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState("swap");
  const [toast, setToast] = useState(null);

  const [poolStats, setPoolStats] = useState({ totalLiquidity: "520400.00", volume24h: "14205.50", reserveA: "260200", reserveB: "260200" });
  const [txHistory, setTxHistory] = useState([]);
  const [slippage, setSlippage] = useState(0.5);

  const [fromSym, setFromSym] = useState("USDC");
  const [toSym, setToSym] = useState("DAI");
  const [amountIn, setAmountIn] = useState("");
  const [fromBalance, setFromBalance] = useState("0.00");
  const [toBalance, setToBalance] = useState("0.00");
  const [swapLoading, setSwapLoading] = useState(false);

  // Pool State
  const [selectedPool, setSelectedPool] = useState("USDC-DAI");
  const [amountAInput, setAmountAInput] = useState("");
  const [amountBInput, setAmountBInput] = useState("");
  const [poolLoading, setPoolLoading] = useState(false);
  const [priceChange, setPriceChange] = useState(0); 

  const [mintBalances, setMintBalances] = useState({});
  const [mintingSym, setMintingSym] = useState(null);

  // ===== STATE SIMULASI MBG STAKING DINAMIS =====
  const [stakeAmount, setStakeAmount] = useState("");
  const [myStakedValue, setMyStakedValue] = useState(0);
  const [mbgRewards, setMbgRewards] = useState(0);
  const [isStakingLoading, setIsStakingLoading] = useState(false);

  // ===== FETCH LTC PRICE =====
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

  // ===== EFFECT REWARD DINAMIS (STAKING) =====
  useEffect(() => {
    let rewardInterval;
    if (myStakedValue > 0) {
      rewardInterval = setInterval(() => {
        // Reward melompat secara dinamis menggunakan pengali acak kecil (simulasi fluktuasi APY real-time)
        const dynamicMultiplier = 0.00001 + (Math.random() * 0.000005);
        setMbgRewards(prev => prev + (myStakedValue * dynamicMultiplier));
      }, 1000);
    }
    return () => clearInterval(rewardInterval);
  }, [myStakedValue]);

  // ===== TOAST & HISTORY LOGIC =====
  const showToast = useCallback((icon, msg) => {
    setToast({ icon, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const saveHistory = useCallback((newTx) => {
    setTxHistory(prev => {
      const updated = [newTx, ...prev].slice(0, 100);
      localStorage.setItem("freesia_tx_history", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addToHistory = useCallback((type, details, status = "success", txHash = "") => {
    const entry = {
      id: Date.now(), type, details, status, txHash,
      timestamp: new Date().toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    };
    saveHistory(entry);
  }, [saveHistory]);

  // ===== WALLET LOGIC =====
  const disconnectWallet = () => {
    setAccount(""); setProvider(null); setSigner(null); setFromBalance("0.00"); setToBalance("0.00"); setMintBalances({});
    setMyStakedValue(0); setMbgRewards(0);
    showToast("👋", "Dompet terputus");
  };

  const connectWallet = async () => {
    if (!window.ethereum) { alert("❌ MetaMask tidak terinstall!"); return; }
    setConnecting(true);
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]); setProvider(web3Provider);
      setSigner(await web3Provider.getSigner());
      showToast("✅", "Dompet terhubung");
      setTimeout(() => updateData(), 1000);
    } catch (err) { showToast("❌", "Koneksi gagal"); } 
    finally { setConnecting(false); }
  };

  const updateData = useCallback(async () => {
    if (!provider || !account) return;
    try {
      const tokenA = new ethers.Contract(CONTRACTS.tokenA, ERC20_ABI, provider);
      const tokenB = new ethers.Contract(CONTRACTS.tokenB, ERC20_ABI, provider);
      const [balA, balB] = await Promise.all([tokenA.balanceOf(account), tokenB.balanceOf(account)]);
      
      const formattedA = ethers.formatUnits(balA, 18);
      const formattedB = ethers.formatUnits(balB, 18);

      setMintBalances({ USDC: parseFloat(formattedA).toFixed(2), DAI: parseFloat(formattedB).toFixed(2), zkLTC: "12.50", USDT: "0.00" });
      if (fromSym === "USDC") { setFromBalance(parseFloat(formattedA).toFixed(2)); setToBalance(parseFloat(formattedB).toFixed(2)); } 
      else { setFromBalance(parseFloat(formattedB).toFixed(2)); setToBalance(parseFloat(formattedA).toFixed(2)); }
    } catch (err) { console.error(err); }
  }, [provider, account, fromSym]);

  useEffect(() => {
    if (provider && account) { updateData(); const interval = setInterval(updateData, 8000); return () => clearInterval(interval); }
  }, [provider, account, updateData]);

  // ===== INTERACTIONS =====
  const handleSwap = async () => {
    if (!signer || !account) return;
    setSwapLoading(true);
    try {
      const fromAddr = TOKEN_LIST[fromSym]?.address;
      const parsedIn = ethers.parseUnits(String(amountIn), 18);
      const tokenContract = new ethers.Contract(fromAddr, ERC20_ABI, signer);
      const allowance = await tokenContract.allowance(account, CONTRACTS.pool);
      if (allowance < parsedIn) {
        const approveTx = await tokenContract.approve(CONTRACTS.pool, parsedIn);
        await approveTx.wait();
      }
      showToast("🎉", "Swap Berhasil!");
      setAmountIn(""); updateData();
    } catch (err) { showToast("❌", "Swap Gagal"); } 
    finally { setSwapLoading(false); }
  };

  const handleMintToken = async (sym) => {
    if (!signer || !account) { alert("🔴 Hubungkan dompet dahulu!"); return; }
    const tokenAddress = TOKEN_LIST[sym]?.address;
    if (!tokenAddress || sym === "zkLTC") { 
      showToast("✅", "Mint Berhasil via Native Gas Node!"); 
      return; 
    }
    setMintingSym(sym);
    try {
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const tx = await token.mint(account, ethers.parseUnits("10000", 18));
      showToast("⏳", "Memproses Faucet...");
      await tx.wait();
      showToast("✅", "Berhasil dapat 10k Token!");
      updateData();
    } catch (err) {
      showToast("❌", "Gagal melakukan Mint.");
    } finally { setMintingSym(null); }
  };

  const handleAddLiquidity = () => {
    if (!account) return;
    setPoolLoading(true);
    showToast("⏳", "Menambahkan likuiditas ke " + selectedPool);
    setTimeout(() => {
      showToast("🎉", "Likuiditas Berhasil Ditambahkan!");
      setAmountAInput(""); setAmountBInput("");
      setPoolLoading(false);
    }, 2000);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", color: "#111827", fontFamily: "sans-serif" }}>
      
      {/* TICKER LTC */}
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', padding: '8px', backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', fontSize: '12px', color: '#6b7280' }}>
        <span>LTC/USD <span style={{ color: ltcData.change >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>${ltcData.price}</span></span>
        <span>LTC Tx Fee <span style={{ color: '#111827', fontWeight: 'bold' }}>9 sat/byte</span></span>
      </div>

      {/* HEADER BANNER SLOGAN UTAMA */}
      <div style={{ backgroundColor: "#fffbeb", borderBottom: "1px solid #fef3c7", padding: "10px 20px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", fontSize: "13px", color: "#b45309", textAlign: "center" }}>
        <AlertCircle size={16} color="#d97706" />
        <span>
          <strong>Freesia DEX:</strong> DEX Pertama di Jaringan LitVM dengan Simulator Risiko Impermanent Loss Terintegrasi. 
          <span style={{ textDecoration: "underline", fontWeight: "bold", marginLeft: "6px", cursor: "pointer" }} onClick={() => setActiveTab("pool")}>
            Coba Simulator IL ➔
          </span>
        </span>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
        
        {/* HEADER */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", paddingBottom: "20px", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <FreesiaLogoLight />
            <div>
              <h1 style={{ fontSize: "22px", margin: 0, fontWeight: "900", color: "#1f2937" }}>Freesia DEX</h1>
              <span style={{ fontSize: "12px", color: "#10b981", display: "flex", alignItems: "center", gap: "2px" }}><CheckCircle2 size={12} /> LitVM Testnet Connected</span>
            </div>
          </div>
          <button onClick={connectWallet} style={{ backgroundColor: "#fbbf24", color: "#111827", border: "none", padding: "8px 16px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>
            {account ? `${account.substring(0,6)}...${account.substring(account.length-4)}` : "Hubungkan Dompet"}
          </button>
        </header>

        {/* NAVIGATION TABS */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "30px", flexWrap: "wrap", justifyContent: "center" }}>
          {["dashboard", "swap", "mint", "pool", "import", "mbg staking"].map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ padding: "10px 20px", border: "none", borderRadius: "12px", backgroundColor: activeTab === t ? "#fbbf24" : "#f3f4f6", color: activeTab === t ? "#111827" : "#4b5563", fontWeight: "bold", cursor: "pointer", fontSize: "13px", textTransform: "uppercase" }}>
              {t === "mbg staking" ? "MBG STAKING 💎" : t}
            </button>
          ))}
        </div>

        {/* CONTENT RENDERING */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          
          {/* TAB SWAP */}
          {activeTab === "swap" && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", padding: "24px", width: "100%", maxWidth: "460px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
              <div style={{ backgroundColor: "#f9fafb", padding: "16px", borderRadius: "16px", border: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6b7280", marginBottom: "8px" }}><span>Anda Membayar</span><span>Saldo: {fromBalance}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <input type="number" placeholder="0.00" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} style={{ background: "transparent", border: "none", color: "#111827", fontSize: "28px", width: "60%", outline: "none", fontWeight: "600" }} />
                  <div style={{ fontWeight: "bold" }}>{fromSym}</div>
                </div>
              </div>
              <div style={{ textAlign: "center", margin: "-10px 0", position: "relative", zIndex: 2 }}><button onClick={() => { setFromSym(toSym); setToSym(fromSym); }} style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "50%", padding: "6px", cursor: "pointer" }}><ArrowUpDown size={14} /></button></div>
              <div style={{ backgroundColor: "#f9fafb", padding: "16px", borderRadius: "16px", border: "1px solid #f3f4f6", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6b7280", marginBottom: "8px" }}><span>Menerima</span><span>Saldo: {toBalance}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <input type="text" placeholder="0.00" value={amountIn ? (parseFloat(amountIn) * (1 - slippage/100)).toFixed(2) : ""} readOnly style={{ background: "transparent", border: "none", color: "#9ca3af", fontSize: "28px", width: "60%", outline: "none", fontWeight: "600" }} />
                  <div style={{ fontWeight: "bold" }}>{toSym}</div>
                </div>
              </div>
              <button onClick={handleSwap} style={{ width: "100%", backgroundColor: "#fbbf24", color: "#111827", border: "none", padding: "16px", borderRadius: "16px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>Tukar Token</button>
            </div>
          )}

          {/* TAB MINT (FIXED DAI) */}
          {activeTab === "mint" && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", padding: "24px", width: "100%", maxWidth: "460px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
              <h3 style={{ marginTop: 0, textAlign: "center" }}>Faucet Testnet</h3>
              {Object.keys(TOKEN_LIST).map((sym) => (
                <div key={sym} style={{ backgroundColor: "#f9fafb", padding: "16px", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div><strong>{sym}</strong><div style={{ fontSize: "12px", color: "#6b7280" }}>Saldo: {mintBalances[sym] || "0.00"}</div></div>
                  <button onClick={() => handleMintToken(sym)} style={{ backgroundColor: "#fbbf24", border: "none", padding: "8px 16px", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" }}>Mint 10k</button>
                </div>
              ))}
            </div>
          )}

          {/* TAB POOL AKTIF DENGAN SELEKSI zkLTC & TABEL LIKUIDITAS */}
          {activeTab === "pool" && (
             <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", padding: "24px", width: "100%", maxWidth: "520px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
               <h3 style={{ marginTop: 0, color: "#1f2937" }}>Manajemen Pool Likuiditas</h3>
               
               {/* 1. Fitur Informasi Daftar Pool Aktif */}
               <div style={{ marginBottom: "20px", padding: "14px", backgroundColor: "#f3f4f6", borderRadius: "16px" }}>
                 <div style={{ fontSize: "12px", fontWeight: "bold", color: "#4b5563", marginBottom: "8px" }}>Status Kedalaman Likuiditas Platform:</div>
                 <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
                   <thead>
                     <tr style={{ borderBottom: "1px solid #d1d5db", color: "#6b7280" }}>
                       <th style={{ textAlign: "left", paddingBottom: "6px" }}>Pasangan Pool</th>
                       <th style={{ textAlign: "right", paddingBottom: "6px" }}>Total TVL</th>
                       <th style={{ textAlign: "right", paddingBottom: "6px" }}>Status</th>
                     </tr>
                   </thead>
                   <tbody>
                     <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                       <td style={{ padding: "6px 0", fontWeight: "600" }}>💵 USDC / ◈ DAI</td>
                       <td style={{ textAlign: "right", color: "#10b981", fontWeight: "bold" }}>$520,400</td>
                       <td style={{ textAlign: "right", color: "#10b981" }}>Sehat (Cukup)</td>
                     </tr>
                     <tr>
                       <td style={{ padding: "6px 0", fontWeight: "600" }}>⚡ zkLTC / 💵 USDC</td>
                       <td style={{ textAlign: "right", color: "#b45309", fontWeight: "bold" }}>$45,100</td>
                       <td style={{ textAlign: "right", color: "#d97706" }}>Awal (Butuh LP)</td>
                     </tr>
                   </tbody>
                 </table>
               </div>

               {/* Opsi Pilihan Pasangan Pasokan Dana */}
               <div style={{ marginBottom: "16px" }}>
                 <label style={{ fontSize: "12px", fontWeight: "bold", color: "#4b5563", display: "block", marginBottom: "6px" }}>Pilih Pool Tujuan:</label>
                 <select value={selectedPool} onChange={(e) => setSelectedPool(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #e5e7eb", backgroundColor: "#fff", fontWeight: "bold" }}>
                   <option value="USDC-DAI">Pool: USDC + DAI</option>
                   <option value="zkLTC-USDC">Pool: zkLTC + USDC (Harga Pasar Testnet)</option>
                 </select>
               </div>

               <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                 <input type="number" placeholder={`Jumlah Aset 1 (${selectedPool.split('-')[0]})`} value={amountAInput} onChange={e => setAmountAInput(e.target.value)} style={{ width: "100%", padding: "14px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "12px", outline: "none" }} />
                 <input type="number" placeholder={`Jumlah Aset 2 (${selectedPool.split('-')[1]})`} value={amountBInput} onChange={e => setAmountBInput(e.target.value)} style={{ width: "100%", padding: "14px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "12px", outline: "none" }} />
                 <button onClick={handleAddLiquidity} style={{ width: "100%", marginTop: "10px", backgroundColor: "#fbbf24", color: "#111827", border: "none", padding: "16px", borderRadius: "16px", fontWeight: "bold", cursor: "pointer" }}>
                   {poolLoading ? "⏳ Memproses..." : `Pasok Likuiditas ${selectedPool}`}
                 </button>
               </div>

               {/* SIMULATOR IL */}
               <div style={{ padding: "16px", borderRadius: "16px", border: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}><strong>Simulator Risiko (IL)</strong></div>
                 <input type="range" min="-90" max="200" step="10" value={priceChange} onChange={(e) => setPriceChange(Number(e.target.value))} style={{ width: "100%", accentColor: "#fbbf24" }} />
                 <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginTop: "8px" }}><span>Perubahan Harga: {priceChange}%</span><span style={{ color: "#ef4444", fontWeight: "bold" }}>IL: {Math.abs(priceChange * 0.04).toFixed(2)}%</span></div>
               </div>
             </div>
          )}

          {/* TAB MBG STAKING (FITUR REWARD DINAMIS AKTIF) */}
          {activeTab === "mbg staking" && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", padding: "24px", width: "100%", maxWidth: "480px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <Coins size={24} color="#fbbf24" />
                <h3 style={{ margin: 0, fontWeight: "800" }}>MBG Staking Pool</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div style={{ padding: "14px", backgroundColor: "#f9fafb", borderRadius: "16px", border: "1px solid #e5e7eb", textAlign: "center" }}><span>Pool TVL</span><strong style={{ display: "block", fontSize: "18px" }}>$250,400</strong></div>
                <div style={{ padding: "14px", backgroundColor: "#f9fafb", borderRadius: "16px", border: "1px solid #e5e7eb", textAlign: "center" }}><span>Reward APY</span><strong style={{ display: "block", fontSize: "18px", color: "#10b981" }}>32.50%</strong></div>
              </div>
              <div style={{ padding: "16px", backgroundColor: "#fffbeb", borderRadius: "16px", border: "1px solid #fef3c7", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><span>MBG Earned (Dinamis Live)</span><strong style={{ display: "block", fontSize: "24px", fontFamily: "monospace" }}>{mbgRewards.toFixed(6)}</strong></div>
                  <button onClick={handleClaimRewards} disabled={mbgRewards <= 0} style={{ backgroundColor: mbgRewards > 0 ? "#fbbf24" : "#e5e7eb", border: "none", padding: "10px 18px", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" }}>Claim</button>
                </div>
              </div>
              <div style={{ padding: "16px", backgroundColor: "#f9fafb", borderRadius: "16px", border: "1px solid #e5e7eb", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Wallet size={14} /> Total Staked:</span><strong>{myStakedValue.toFixed(2)} LP</strong></div>
                {myStakedValue > 0 && <button onClick={handleUnstakeAll} style={{ marginTop: "10px", width: "100%", background: "transparent", border: "1px solid #ef4444", color: "#ef4444", padding: "6px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>Unstake All</button>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <input type="number" placeholder="0.00" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} style={{ width: "100%", padding: "14px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "12px", fontWeight: "bold" }} />
                <button onClick={handleExecuteStake} style={{ width: "100%", backgroundColor: "#111827", color: "#fff", border: "none", padding: "14px", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" }}>{isStakingLoading ? "Locking..." : "Lock & Stake Asset"}</button>
              </div>
            </div>
          )}

          {/* TAB DASHBOARD & IMPORT PLACEHOLDER */}
          {["dashboard", "import"].includes(activeTab) && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", padding: "40px", width: "100%", maxWidth: "460px", textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
              <h2 style={{ margin: "0 0 10px 0" }}>{activeTab.toUpperCase()}</h2>
              <p style={{ color: "#6b7280", fontSize: "14px" }}>Fitur penjelajah data luar ekosistem sedang dipetakan.</p>
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

// ===== LOGO =====
function FreesiaLogoLight() {
  return (
    <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 20 C 65 10, 80 30, 50 50 C 20 30, 35 10, 50 20 Z" fill="#fbcfe8" opacity="0.8"/>
      <path d="M80 50 C 90 65, 70 80, 50 50 C 70 20, 90 35, 80 50 Z" fill="#f9a8d4" opacity="0.8"/>
      <path d="M50 80 C 35 90, 20 70, 50 50 C 80 70, 65 90, 50 80 Z" fill="#f472b6" opacity="0.8"/>
      <path d="M20 50 C 10 35, 30 20, 50 50 C 30 80, 10 65, 20 50 Z" fill="#ec4899" opacity="0.8"/>
      <text x="50" y="65" fontSize="42" fill="#111827" fontWeight="bold" fontFamily="serif" textAnchor="middle">f</text>
    </svg>
  );
}
