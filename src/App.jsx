import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  ArrowUpDown, Settings, History, Clock, LogOut, CheckCircle2, AlertCircle
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
  USDT: { address: null, logo: "💲", decimals: 6 },
  WETH: { address: null, logo: "⟠", decimals: 18 }
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

  const [poolStats, setPoolStats] = useState({ totalLiquidity: "—", volume24h: "—", reserveA: "—", reserveB: "—", rate: "—" });
  const [txHistory, setTxHistory] = useState([]);

  const [slippage, setSlippage] = useState(0.5);

  const [fromSym, setFromSym] = useState("USDC");
  const [toSym, setToSym] = useState("DAI");
  const [amountIn, setAmountIn] = useState("");
  const [fromBalance, setFromBalance] = useState("0.00");
  const [toBalance, setToBalance] = useState("0.00");
  const [swapLoading, setSwapLoading] = useState(false);

  const [amountAInput, setAmountAInput] = useState("");
  const [amountBInput, setAmountBInput] = useState("");
  const [poolLoading, setPoolLoading] = useState(false);

  const [mintBalances, setMintBalances] = useState({});
  const [mintingSym, setMintingSym] = useState(null);

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

  useEffect(() => {
    const saved = localStorage.getItem("freesia_tx_history");
    if (saved) { try { setTxHistory(JSON.parse(saved)); } catch (e) { console.error(e); } }
  }, []);

  // ===== WALLET LOGIC =====
  const disconnectWallet = () => {
    setAccount(""); setProvider(null); setSigner(null); setFromBalance("0.00"); setToBalance("0.00"); setMintBalances({});
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

      const network = await web3Provider.getNetwork();
      if (network.chainId !== BigInt(LITVM_CHAIN_ID)) {
        try {
          await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: LITVM_CHAIN_ID_HEX }] });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{ chainId: LITVM_CHAIN_ID_HEX, chainName: "LitVM Testnet", nativeCurrency: { name: "zkLTC", symbol: "zkLTC", decimals: 18 }, rpcUrls: ["https://liteforge.rpc.caldera.xyz/http"], blockExplorerUrls: ["https://liteforge.explorer.caldera.xyz"] }],
            });
          }
        }
      }
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
      const pool = new ethers.Contract(CONTRACTS.pool, POOL_ABI, provider);

      const [balA, balB] = await Promise.all([tokenA.balanceOf(account), tokenB.balanceOf(account)]);
      const formattedA = ethers.formatUnits(balA, 18);
      const formattedB = ethers.formatUnits(balB, 18);

      setMintBalances({ USDC: parseFloat(formattedA).toFixed(2), DAI: parseFloat(formattedB).toFixed(2) });
      if (fromSym === "USDC") { setFromBalance(parseFloat(formattedA).toFixed(2)); setToBalance(parseFloat(formattedB).toFixed(2)); } 
      else { setFromBalance(parseFloat(formattedB).toFixed(2)); setToBalance(parseFloat(formattedA).toFixed(2)); }

      const [resA, resB] = await pool.getReserves();
      const resAFormatted = ethers.formatUnits(resA, 18);
      const resBFormatted = ethers.formatUnits(resB, 18);
      
      setPoolStats(prev => ({
        ...prev, reserveA: parseFloat(resAFormatted).toFixed(2), reserveB: parseFloat(resBFormatted).toFixed(2),
        totalLiquidity: (parseFloat(resAFormatted) + parseFloat(resBFormatted)).toFixed(2),
      }));

    } catch (err) { console.error(err); }
  }, [provider, account, fromSym]);

  useEffect(() => {
    if (provider && account) { updateData(); const interval = setInterval(updateData, 8000); return () => clearInterval(interval); }
  }, [provider, account, updateData]);

  // ===== SMART CONTRACT INTERACTIONS =====
  const handleSwap = async () => {
    if (!signer || !account) return;
    setSwapLoading(true);
    try {
      const fromAddr = TOKEN_LIST[fromSym]?.address;
      const parsedIn = ethers.parseUnits(String(amountIn), 18);
      const slippageMultiplier = 1 - (slippage / 100);
      const amountOutMin = BigInt(Math.floor(Number(parsedIn) * slippageMultiplier));

      const tokenContract = new ethers.Contract(fromAddr, ERC20_ABI, signer);
      const allowance = await tokenContract.allowance(account, CONTRACTS.pool);
      if (allowance < parsedIn) {
        const approveTx = await tokenContract.approve(CONTRACTS.pool, parsedIn);
        await approveTx.wait();
      }

      const poolContract = new ethers.Contract(CONTRACTS.pool, POOL_ABI, signer);
      const swapTx = await poolContract.swap(fromAddr, parsedIn, amountOutMin, { gasLimit: 800000, gasPrice: ethers.parseUnits("2", "gwei") });
      await swapTx.wait();

      showToast("🎉", "Swap Berhasil!");
      addToHistory("Swap", `${amountIn} ${fromSym} → ${toSym}`, "success", swapTx.hash);
      setAmountIn(""); updateData();
    } catch (err) {
      showToast("❌", `Swap Gagal`);
      addToHistory("Swap", `${amountIn} ${fromSym} → ${toSym}`, "failed");
    } finally { setSwapLoading(false); }
  };

  const handleMintToken = async (sym) => {
    if (!signer || !account) return;
    const tokenAddress = TOKEN_LIST[sym]?.address;
    setMintingSym(sym);
    try {
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const tx = await token.mint(account, ethers.parseUnits("10000", 18));
      showToast("⏳", `Memproses Mint 10,000 ${sym}...`);
      await tx.wait();
      showToast("✅", `Berhasil Mint 10,000 ${sym}!`);
      addToHistory("Mint", `${sym} 10,000`, "success", tx.hash);
      updateData();
    } catch (err) {
      showToast("❌", `Gagal mint ${sym}.`);
      addToHistory("Mint", `${sym} 10,000`, "failed");
    } finally { setMintingSym(null); }
  };

  const handleAddLiquidity = async () => {
    if (!signer || !account) return;
    setPoolLoading(true);
    try {
      const parsedA = ethers.parseUnits(String(amountAInput), 18);
      const parsedB = ethers.parseUnits(String(amountBInput), 18);
      const tokenA = new ethers.Contract(CONTRACTS.tokenA, ERC20_ABI, signer);
      const tokenB = new ethers.Contract(CONTRACTS.tokenB, ERC20_ABI, signer);
      const pool = new ethers.Contract(CONTRACTS.pool, POOL_ABI, signer);

      const allowanceA = await tokenA.allowance(account, CONTRACTS.pool);
      if (allowanceA < parsedA) { const approveTxA = await tokenA.approve(CONTRACTS.pool, parsedA); await approveTxA.wait(); }
      const allowanceB = await tokenB.allowance(account, CONTRACTS.pool);
      if (allowanceB < parsedB) { const approveTxB = await tokenB.approve(CONTRACTS.pool, parsedB); await approveTxB.wait(); }

      showToast("⏳", "Menambahkan likuiditas...");
      const tx = await pool.addLiquidity(parsedA, parsedB, { gasLimit: 800000, gasPrice: ethers.parseUnits("2", "gwei") });
      await tx.wait();

      showToast("🎉", "Likuiditas Berhasil Ditambahkan!");
      addToHistory("Add Liquidity", `${amountAInput} USDC + ${amountBInput} DAI`, "success", tx.hash);
      setAmountAInput(""); setAmountBInput(""); updateData();
    } catch (err) {
      showToast("❌", `Gagal menambahkan likuiditas`);
      addToHistory("Add Liquidity", `${amountAInput} USDC + ${amountBInput} DAI`, "failed");
    } finally { setPoolLoading(false); }
  };

  // ===== UI RENDER (TEMA TERANG) =====
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", color: "#111827", fontFamily: "sans-serif" }}>
      
      {/* TICKER LTC */}
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', padding: '8px', backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', fontSize: '12px', color: '#6b7280' }}>
        <span>LTC/USD <span style={{ color: ltcData.change >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>${ltcData.price}</span></span>
        <span>LTC Tx Fee <span style={{ color: '#111827', fontWeight: 'bold' }}>9 sat/byte</span></span>
      </div>

      {/* TOAST */}
      {toast && <div style={{ position: "fixed", top: "20px", right: "20px", backgroundColor: "#ffffff", padding: "12px 20px", borderRadius: "8px", border: "1px solid #e5e7eb", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", zIndex: 1000, fontWeight: "bold" }}>{toast.icon} {toast.msg}</div>}

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
        
        {/* HEADER */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", paddingBottom: "20px", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <FreesiaLogoLight />
            <div>
              <h1 style={{ fontSize: "22px", margin: 0, fontWeight: "900", color: "#1f2937", letterSpacing: "-0.5px" }}>Freesia DEX</h1>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                <span>LitVM Testnet</span>
                <span style={{ display: "flex", alignItems: "center", color: "#10b981", gap: "2px", fontWeight: "600" }}><CheckCircle2 size={12} /> Network Benar</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: "#4b5563", textDecoration: "none" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            {account ? (
              <button onClick={disconnectWallet} style={{ backgroundColor: "#fbbf24", color: "#111827", border: "none", padding: "8px 16px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 2px 4px rgba(251, 191, 36, 0.3)" }}>
                <span style={{ width: "8px", height: "8px", backgroundColor: "#10b981", borderRadius: "50%", display: "inline-block" }}></span>
                {account.substring(0,5)}...{account.substring(account.length-4)}
              </button>
            ) : (
              <button onClick={connectWallet} disabled={connecting} style={{ backgroundColor: "#fbbf24", color: "#111827", border: "none", padding: "8px 16px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 2px 4px rgba(251, 191, 36, 0.3)" }}>
                {connecting ? "⏳ Menghubungkan..." : "Hubungkan Dompet"}
              </button>
            )}
          </div>
        </header>

        {/* NAVIGATION TABS (5 + 1 Baru) */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "30px", flexWrap: "wrap", justifyContent: "center" }}>
          {["dashboard", "swap", "mint", "pool", "import", "mbg staking"].map((t) => (
            <button 
              key={t} 
              onClick={() => setActiveTab(t)} 
              style={{ 
                padding: "10px 20px", 
                border: "none", 
                borderRadius: "12px", 
                backgroundColor: activeTab === t ? "#fbbf24" : "#f3f4f6", 
                color: activeTab === t ? "#111827" : "#4b5563", 
                fontWeight: "bold", 
                cursor: "pointer", 
                fontSize: "13px",
                textTransform: "uppercase",
                transition: "all 0.2s ease"
              }}
            >
              {t === "mbg staking" ? "MBG STAKING (SOON)" : t}
            </button>
          ))}
        </div>

        {/* MAIN CONTENT AREA */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          
          {/* TAMPILAN SWAP */}
          {activeTab === "swap" && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", padding: "24px", width: "100%", maxWidth: "460px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
              
              <div style={{ backgroundColor: "#f9fafb", padding: "16px", borderRadius: "16px", border: "1px solid #f3f4f6", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6b7280", marginBottom: "8px" }}>
                  <span>Anda Membayar</span>
                  <span>Saldo: {fromBalance}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <input type="number" placeholder="0.00" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} style={{ background: "transparent", border: "none", color: "#111827", fontSize: "28px", width: "60%", outline: "none", fontWeight: "600" }} />
                  <div style={{ backgroundColor: "#ffffff", padding: "6px 12px", borderRadius: "20px", border: "1px solid #e5e7eb", fontWeight: "bold", fontSize: "14px", display: "flex", alignItems: "center", gap: "4px" }}>
                    {fromSym}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyItems: "center", justifyContent: "center", margin: "-12px 0", position: "relative", zIndex: 2 }}>
                <button onClick={() => { setFromSym(toSym); setToSym(fromSym); }} style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", color: "#6b7280", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                  <ArrowUpDown size={14} />
                </button>
              </div>

              <div style={{ backgroundColor: "#f9fafb", padding: "16px", borderRadius: "16px", border: "1px solid #f3f4f6", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6b7280", marginBottom: "8px" }}>
                  <span>Menerima (Estimasi)</span>
                  <span>Saldo: {toBalance}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <input type="text" placeholder="0.00" value={amountIn ? (parseFloat(amountIn) * (1 - slippage/100)).toFixed(2) : ""} readOnly style={{ background: "transparent", border: "none", color: "#9ca3af", fontSize: "28px", width: "60%", outline: "none", fontWeight: "600" }} />
                  <div style={{ backgroundColor: "#ffffff", padding: "6px 12px", borderRadius: "20px", border: "1px solid #e5e7eb", fontWeight: "bold", fontSize: "14px", display: "flex", alignItems: "center", gap: "4px" }}>
                    {toSym}
                  </div>
                </div>
              </div>

              <button onClick={handleSwap} disabled={!account || !amountIn || swapLoading} style={{ width: "100%", backgroundColor: "#fbbf24", color: "#111827", border: "none", padding: "16px", borderRadius: "16px", fontWeight: "bold", fontSize: "16px", cursor: account && amountIn ? "pointer" : "not-allowed", opacity: account && amountIn ? 1 : 0.7, boxShadow: account && amountIn ? "0 4px 12px rgba(251, 191, 36, 0.3)" : "none" }}>
                {!account ? "Hubungkan Dompet" : swapLoading ? "⏳ Memproses..." : !amountIn ? "Masukkan Jumlah" : "Tukar Token"}
              </button>
            </div>
          )}

          {/* HALAMAN LAINNYA (Placeholder) */}
          {["dashboard", "import", "mbg staking"].includes(activeTab) && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", padding: "40px", width: "100%", maxWidth: "460px", textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
              <h2 style={{ margin: "0 0 10px 0", color: "#1f2937" }}>{activeTab.toUpperCase()}</h2>
              <p style={{ color: "#6b7280", fontSize: "14px" }}>Fitur ini sedang dalam tahap pengembangan.</p>
            </div>
          )}

          {/* TAB MINT */}
          {activeTab === "mint" && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", padding: "24px", width: "100%", maxWidth: "460px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
              <h3 style={{ marginTop: 0, textAlign: "center", color: "#1f2937" }}>Faucet Testnet</h3>
              <p style={{ fontSize: "13px", color: "#6b7280", textAlign: "center", marginBottom: "20px" }}>Dapatkan token gratis untuk mencoba Freesia DEX.</p>
              {Object.keys(TOKEN_LIST).map((sym) => (
                <div key={sym} style={{ backgroundColor: "#f9fafb", padding: "16px", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", border: "1px solid #f3f4f6" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "24px" }}>{TOKEN_LIST[sym].logo}</span>
                    <div>
                      <strong style={{ color: "#1f2937" }}>{sym}</strong>
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>Saldo: {mintBalances[sym] || "0.00"}</div>
                    </div>
                  </div>
                  <button onClick={() => handleMintToken(sym)} disabled={!TOKEN_LIST[sym].address || !account || mintingSym === sym} style={{ backgroundColor: TOKEN_LIST[sym].address && account ? "#fbbf24" : "#e5e7eb", color: TOKEN_LIST[sym].address && account ? "#111827" : "#9ca3af", border: "none", padding: "8px 16px", borderRadius: "12px", cursor: TOKEN_LIST[sym].address && account ? "pointer" : "not-allowed", fontWeight: "bold" }}>
                    {!TOKEN_LIST[sym].address ? "Segera" : mintingSym === sym ? "⏳..." : "Mint 10k"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB POOL */}
          {activeTab === "pool" && (
             <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", padding: "24px", width: "100%", maxWidth: "460px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
               <h3 style={{ marginTop: 0, textAlign: "center", color: "#1f2937" }}>Tambah Likuiditas</h3>
               <p style={{ fontSize: "13px", color: "#6b7280", textAlign: "center", marginBottom: "20px" }}>Gabungkan aset ke dalam pool untuk mendapatkan fee.</p>
               
               <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px", marginBottom: "16px" }}>
                  <div style={{ backgroundColor: "#f9fafb", padding: "12px", borderRadius: "12px", textAlign: "center", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "11px", color: "#6b7280" }}>Total Likuiditas Pool</div>
                    <div style={{ fontSize: "18px", fontWeight: "bold", color: "#10b981" }}>${poolStats.totalLiquidity}</div>
                  </div>
               </div>

               <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                 <input type="number" placeholder="Jumlah USDC" value={amountAInput} onChange={e => setAmountAInput(e.target.value)} style={{ width: "100%", padding: "16px", background: "#f9fafb", border: "1px solid #e5e7eb", color: "#111827", borderRadius: "16px", outline: "none", fontWeight: "bold", boxSizing: "border-box" }} />
                 <input type="number" placeholder="Jumlah DAI" value={amountBInput} onChange={e => setAmountBInput(e.target.value)} style={{ width: "100%", padding: "16px", background: "#f9fafb", border: "1px solid #e5e7eb", color: "#111827", borderRadius: "16px", outline: "none", fontWeight: "bold", boxSizing: "border-box" }} />
                 <button onClick={handleAddLiquidity} disabled={!account || poolLoading} style={{ width: "100%", marginTop: "10px", backgroundColor: account ? "#fbbf24" : "#e5e7eb", color: account ? "#111827" : "#9ca3af", border: "none", padding: "16px", borderRadius: "16px", fontWeight: "bold", cursor: account ? "pointer" : "not-allowed", fontSize: "16px" }}>
                   {poolLoading ? "⏳ Memproses..." : "Tambah Likuiditas"}
                 </button>
               </div>
             </div>
          )}

        </div>

        {/* FOOTER */}
        <footer style={{ textAlign: "center", marginTop: "80px", padding: "30px 0", borderTop: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <FreesiaLogoLight scale={0.8} />
          </div>
          <p style={{ fontSize: "11px", fontWeight: "800", color: "#9ca3af", margin: "4px 0", letterSpacing: "1px" }}>
            POWERED BY FREESIA NETWORK
          </p>
          <p style={{ fontSize: "11px", color: "#d1d5db", margin: "4px 0" }}>
            Dibangun oleh <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: "#9ca3af", textDecoration: "underline" }}>@0xzackbh</a>
          </p>
        </footer>

      </div>
    </div>
  );
}

// ===== KOMPONEN LOGO BUNGA (TEMA TERANG) =====
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
