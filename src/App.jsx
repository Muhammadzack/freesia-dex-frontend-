import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { 
  ArrowUpDown, RefreshCw, Droplets, Copy, Check, 
  Settings, History, BarChart3, Clock, AlertCircle, 
  LogOut // <-- Untuk tombol disconnect
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
  tokenB: "0x9013443A3E0Dd775152678a76fceDcA54e1E1710",
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
function App() {
  // State Dasar
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState("swap");
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  // ===== FITUR 1: STATISTIK POOL =====
  const [poolStats, setPoolStats] = useState({
    totalLiquidity: "—",
    volume24h: "—",
    reserveA: "—",
    reserveB: "—",
    rate: "—",
    priceHistory: []
  });

  // ===== FITUR 2: HISTORY TRANSAKSI =====
  const [txHistory, setTxHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // ===== FITUR 3: SLIPPAGE SETTINGS =====
  const [slippage, setSlippage] = useState(0.5);
  const [showSlippageModal, setShowSlippageModal] = useState(false);
  const [customSlippage, setCustomSlippage] = useState("");

  // State Swap
  const [fromSym, setFromSym] = useState("USDC");
  const [toSym, setToSym] = useState("DAI");
  const [amountIn, setAmountIn] = useState("");
  const [fromBalance, setFromBalance] = useState("—");
  const [toBalance, setToBalance] = useState("—");
  const [swapLoading, setSwapLoading] = useState(false);

  // State Pool
  const [amountAInput, setAmountAInput] = useState("");
  const [amountBInput, setAmountBInput] = useState("");
  const [poolLoading, setPoolLoading] = useState(false);

  // State Mint
  const [mintBalances, setMintBalances] = useState({});
  const [mintingSym, setMintingSym] = useState(null);
  const [copiedAddr, setCopiedAddr] = useState(null);

  // ==================== DISCONNECT WALLET ====================
  const disconnectWallet = () => {
    setAccount("");
    setProvider(null);
    setSigner(null);
    setFromBalance("—");
    setToBalance("—");
    setMintBalances({});
    showToast("👋", "Dompet terputus");
  };

  // ==================== LOAD HISTORY DARI LOCALSTORAGE ====================
  useEffect(() => {
    const saved = localStorage.getItem("freesia_tx_history");
    if (saved) {
      try {
        setTxHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Gagal load history:", e);
      }
    }
  }, []);

  // ==================== SIMPAN HISTORY KE LOCALSTORAGE ====================
  const saveHistory = useCallback((newTx) => {
    setTxHistory(prev => {
      const updated = [newTx, ...prev].slice(0, 100);
      localStorage.setItem("freesia_tx_history", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ==================== TAMBAH HISTORY ====================
  const addToHistory = useCallback((type, details, status = "success", txHash = "") => {
    const entry = {
      id: Date.now(),
      type,
      details,
      status,
      txHash,
      timestamp: new Date().toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    };
    saveHistory(entry);
  }, [saveHistory]);

  // ==================== TOAST ====================
  const showToast = useCallback((icon, msg) => {
    setToast({ icon, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ==================== KONEKSI WALLET ====================
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("❌ MetaMask tidak terinstall!");
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      
      if (!accounts || accounts.length === 0) {
        throw new Error("Tidak ada akun yang dipilih");
      }

      setAccount(accounts[0]);
      setProvider(web3Provider);
      const web3Signer = await web3Provider.getSigner();
      setSigner(web3Signer);

      const network = await web3Provider.getNetwork();
      if (network.chainId !== BigInt(LITVM_CHAIN_ID)) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: LITVM_CHAIN_ID_HEX }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: LITVM_CHAIN_ID_HEX,
                chainName: "LitVM Testnet",
                nativeCurrency: { name: "zkLTC", symbol: "zkLTC", decimals: 18 },
                rpcUrls: ["https://liteforge.rpc.caldera.xyz/http"],
                blockExplorerUrls: ["https://liteforge.explorer.caldera.xyz"],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }

      showToast("✅", "Dompet berhasil terhubung!");
      setTimeout(() => updateData(), 1000);

    } catch (err) {
      console.error("❌ Error connect wallet:", err);
      setError(err.message);
      showToast("❌", `Gagal connect: ${err.message}`);
    } finally {
      setConnecting(false);
    }
  };

  // ==================== UPDATE DATA + STATISTIK ====================
  const updateData = useCallback(async () => {
    if (!provider || !account) return;

    try {
      const tokenA = new ethers.Contract(CONTRACTS.tokenA, ERC20_ABI, provider);
      const tokenB = new ethers.Contract(CONTRACTS.tokenB, ERC20_ABI, provider);
      const pool = new ethers.Contract(CONTRACTS.pool, POOL_ABI, provider);

      const [balA, balB] = await Promise.all([
        tokenA.balanceOf(account),
        tokenB.balanceOf(account)
      ]);

      const formattedA = ethers.formatUnits(balA, 18);
      const formattedB = ethers.formatUnits(balB, 18);

      setMintBalances({
        USDC: parseFloat(formattedA).toFixed(1),
        DAI: parseFloat(formattedB).toFixed(1),
        USDT: "0.0",
        WETH: "0.0"
      });

      if (fromSym === "USDC") {
        setFromBalance(parseFloat(formattedA).toFixed(1));
        setToBalance(parseFloat(formattedB).toFixed(1));
      } else {
        setFromBalance(parseFloat(formattedB).toFixed(1));
        setToBalance(parseFloat(formattedA).toFixed(1));
      }

      const [resA, resB] = await pool.getReserves();
      const resAFormatted = ethers.formatUnits(resA, 18);
      const resBFormatted = ethers.formatUnits(resB, 18);
      
      setPoolStats(prev => ({
        ...prev,
        reserveA: parseFloat(resAFormatted).toFixed(2),
        reserveB: parseFloat(resBFormatted).toFixed(2),
        totalLiquidity: (parseFloat(resAFormatted) + parseFloat(resBFormatted)).toFixed(2),
        rate: resA > 0n ? (Number(resB) / Number(resA)).toFixed(4) : "—"
      }));

      const today = new Date().toDateString();
      const todayTxs = txHistory.filter(tx => 
        tx.timestamp.includes(today) && tx.type === "Swap" && tx.status === "success"
      );
      const volume24h = todayTxs.reduce((sum, tx) => {
        const match = tx.details.match(/([\d.]+)/);
        return sum + (match ? parseFloat(match[1]) : 0);
      }, 0);
      setPoolStats(prev => ({
        ...prev,
        volume24h: volume24h.toFixed(2)
      }));

    } catch (err) {
      console.error("❌ Error update data:", err);
    }
  }, [provider, account, fromSym, txHistory]);

  useEffect(() => {
    if (provider && account) {
      updateData();
      const interval = setInterval(updateData, 8000);
      return () => clearInterval(interval);
    }
  }, [provider, account, updateData]);

  // ==================== MINT TOKEN ====================
  const handleMintToken = async (sym) => {
    if (!signer || !account) {
      alert("🔴 Hubungkan dompet dahulu!");
      return;
    }

    const tokenAddress = TOKEN_LIST[sym]?.address;
    if (!tokenAddress) {
      alert(`🔴 Token ${sym} belum aktif.`);
      return;
    }

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
      console.error(`❌ Gagal mint ${sym}:`, err);
      showToast("❌", `Gagal mint ${sym}.`);
      addToHistory("Mint", `${sym} 10,000`, "failed");
    } finally {
      setMintingSym(null);
    }
  };

  // ==================== SWAP TOKEN ====================
  const handleSwap = async () => {
    if (!signer || !account) {
      alert("🔴 Hubungkan dompet dahulu!");
      return;
    }

    if (!amountIn || parseFloat(amountIn) <= 0) {
      alert("🔴 Masukkan jumlah yang valid!");
      return;
    }

    setSwapLoading(true);
    setError(null);

    try {
      const fromAddr = TOKEN_LIST[fromSym]?.address;
      if (!fromAddr) {
        throw new Error(`Token ${fromSym} tidak punya address`);
      }

      const parsedIn = ethers.parseUnits(String(amountIn), 18);
      const slippageMultiplier = 1 - (slippage / 100);
      const amountOutMin = BigInt(Math.floor(Number(parsedIn) * slippageMultiplier));

      const tokenContract = new ethers.Contract(fromAddr, ERC20_ABI, signer);
      const balance = await tokenContract.balanceOf(account);
      if (balance < parsedIn) {
        throw new Error(`Saldo ${fromSym} tidak cukup!`);
      }

      const allowance = await tokenContract.allowance(account, CONTRACTS.pool);
      if (allowance < parsedIn) {
        const approveTx = await tokenContract.approve(CONTRACTS.pool, parsedIn);
        await approveTx.wait();
      }

      const poolContract = new ethers.Contract(CONTRACTS.pool, POOL_ABI, signer);
      const swapTx = await poolContract.swap(fromAddr, parsedIn, amountOutMin, {
        gasLimit: 800000,
        gasPrice: ethers.parseUnits("2", "gwei")
      });
      await swapTx.wait();

      showToast("🎉", "Swap Berhasil!");
      addToHistory("Swap", `${amountIn} ${fromSym} → ${toSym}`, "success", swapTx.hash);
      setAmountIn("");
      updateData();

    } catch (err) {
      console.error("❌ Error swap:", err);
      setError(err.message);
      showToast("❌", `Swap Gagal: ${err.message}`);
      addToHistory("Swap", `${amountIn} ${fromSym} → ${toSym}`, "failed");
    } finally {
      setSwapLoading(false);
    }
  };

  // ==================== ADD LIQUIDITY ====================
  const handleAddLiquidity = async () => {
    if (!signer || !account) {
      alert("🔴 Hubungkan dompet dahulu!");
      return;
    }

    if (!amountAInput || parseFloat(amountAInput) <= 0) {
      alert("🔴 Masukkan jumlah USDC yang valid!");
      return;
    }
    if (!amountBInput || parseFloat(amountBInput) <= 0) {
      alert("🔴 Masukkan jumlah DAI yang valid!");
      return;
    }

    setPoolLoading(true);
    try {
      const parsedA = ethers.parseUnits(String(amountAInput), 18);
      const parsedB = ethers.parseUnits(String(amountBInput), 18);

      const tokenA = new ethers.Contract(CONTRACTS.tokenA, ERC20_ABI, signer);
      const tokenB = new ethers.Contract(CONTRACTS.tokenB, ERC20_ABI, signer);
      const pool = new ethers.Contract(CONTRACTS.pool, POOL_ABI, signer);

      const allowanceA = await tokenA.allowance(account, CONTRACTS.pool);
      if (allowanceA < parsedA) {
        const approveTxA = await tokenA.approve(CONTRACTS.pool, parsedA);
        await approveTxA.wait();
      }

      const allowanceB = await tokenB.allowance(account, CONTRACTS.pool);
      if (allowanceB < parsedB) {
        const approveTxB = await tokenB.approve(CONTRACTS.pool, parsedB);
        await approveTxB.wait();
      }

      showToast("⏳", "Menambahkan likuiditas...");
      const tx = await pool.addLiquidity(parsedA, parsedB, {
        gasLimit: 800000,
        gasPrice: ethers.parseUnits("2", "gwei")
      });
      await tx.wait();

      showToast("🎉", "Likuiditas Berhasil Ditambahkan!");
      addToHistory("Add Liquidity", `${amountAInput} USDC + ${amountBInput} DAI`, "success", tx.hash);
      setAmountAInput("");
      setAmountBInput("");
      updateData();

    } catch (err) {
      console.error("❌ Error add liquidity:", err);
      showToast("❌", `Gagal: ${err.message}`);
      addToHistory("Add Liquidity", `${amountAInput} USDC + ${amountBInput} DAI`, "failed");
    } finally {
      setPoolLoading(false);
    }
  };

  const handleCopyAddress = (addr) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddr(addr);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  // ==================== RENDER GRAFIK ====================
  const renderChart = () => {
    const price = poolStats.rate !== "—" ? parseFloat(poolStats.rate) : 1;
    const history = poolStats.priceHistory.length > 0 ? poolStats.priceHistory : [price * 0.98, price * 0.99, price, price * 1.01, price * 1.02];
    
    const max = Math.max(...history) * 1.1;
    const min = Math.min(...history) * 0.9;
    const range = max - min || 1;

    return (
      <div style={{ width: "100%", height: "80px", display: "flex", alignItems: "flex-end", gap: "4px", padding: "8px 0" }}>
        {history.map((value, i) => {
          const height = ((value - min) / range) * 60 + 10;
          const isUp = i > 0 && value > history[i-1];
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: "100%",
                height: `${height}px`,
                backgroundColor: isUp ? "#10b981" : "#ef4444",
                borderRadius: "3px 3px 0 0",
                minHeight: "4px",
                transition: "height 0.5s ease"
              }} />
            </div>
          );
        })}
      </div>
    );
  };

  // ==================== RENDER ====================
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0b0f19", color: "#f3f4f6", fontFamily: "sans-serif", padding: "20px" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: "20px", right: "20px", backgroundColor: "#1e293b", padding: "12px 20px", borderRadius: "10px", border: "1px solid #334155", zIndex: 1000 }}>
          {toast.icon} {toast.msg}
        </div>
      )}

      {error && (
        <div style={{ position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#7f1d1d", padding: "10px 20px", borderRadius: "10px", border: "1px solid #991b1b", zIndex: 1000, maxWidth: "90%" }}>
          ⚠️ {error}
        </div>
      )}

      {/* ===== SLIPPAGE MODAL ===== */}
      {showSlippageModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div style={{ backgroundColor: "#1e293b", padding: "24px", borderRadius: "16px", maxWidth: "400px", width: "90%" }}>
            <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Settings size={18} /> Slippage Tolerance
            </h3>
            <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "12px" }}>
              Harga akan ditoleransi sebesar slippage yang dipilih.
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {[0.1, 0.5, 1.0, 2.0].map(val => (
                <button key={val} onClick={() => { setSlippage(val); setShowSlippageModal(false); }} style={{
                  flex: 1,
                  padding: "8px 12px",
                  backgroundColor: slippage === val ? "#fbbf24" : "#0f172a",
                  color: slippage === val ? "#000" : "#fff",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  minWidth: "60px"
                }}>
                  {val}%
                </button>
              ))}
            </div>
            <div style={{ marginTop: "10px" }}>
              <input
                type="number"
                placeholder="Custom %"
                value={customSlippage}
                onChange={(e) => setCustomSlippage(e.target.value)}
                onBlur={() => {
                  if (customSlippage && !isNaN(customSlippage)) {
                    setSlippage(parseFloat(customSlippage));
                    setShowSlippageModal(false);
                  }
                }}
                style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "#fff" }}
              />
            </div>
            {slippage > 5 && (
              <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                <AlertCircle size={14} /> Slippage tinggi! Hati-hati dengan front-running.
              </p>
            )}
            <button onClick={() => setShowSlippageModal(false)} style={{ marginTop: "12px", width: "100%", padding: "8px", backgroundColor: "#334155", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer" }}>
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ===== HISTORY MODAL ===== */}
      {showHistory && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div style={{ backgroundColor: "#1e293b", padding: "24px", borderRadius: "16px", maxWidth: "500px", width: "90%", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <History size={18} /> Riwayat Transaksi
              </h3>
              <button onClick={() => setShowHistory(false)} style={{ backgroundColor: "#334155", border: "none", borderRadius: "8px", padding: "4px 12px", color: "#fff", cursor: "pointer" }}>
                ✕
              </button>
            </div>
            {txHistory.length === 0 ? (
              <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>Belum ada transaksi</p>
            ) : (
              txHistory.map(tx => (
                <div key={tx.id} style={{ backgroundColor: "#0f172a", padding: "12px", borderRadius: "8px", marginBottom: "8px", borderLeft: `4px solid ${tx.status === "success" ? "#10b981" : "#ef4444"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold", fontSize: "14px" }}>{tx.type}</span>
                    <span style={{ fontSize: "11px", color: tx.status === "success" ? "#10b981" : "#ef4444" }}>
                      {tx.status === "success" ? "✅" : "❌"} {tx.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", color: "#94a3b8" }}>{tx.details}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    <span><Clock size={12} style={{ display: "inline", marginRight: "4px" }} /> {tx.timestamp}</span>
                    {tx.txHash && <span style={{ fontSize: "10px" }}>🔗 {tx.txHash.substring(0, 10)}...</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===== HEADER ===== */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "600px", margin: "0 auto 30px auto", borderBottom: "1px solid #1e293b", paddingBottom: "15px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FreesiaLogo />
          <div>
            <h1 style={{ fontSize: "20px", margin: 0, color: "#fbbf24" }}>Freesia DEX</h1>
            <span style={{ fontSize: "12px", color: "#10b981" }}>● LitVM Testnet</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button onClick={() => setShowHistory(true)} style={{ backgroundColor: "#1e293b", border: "1px solid #334155", padding: "8px", borderRadius: "10px", color: "#fff", cursor: "pointer" }} title="Riwayat">
            <History size={16} />
          </button>
          <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ backgroundColor: "#1e293b", color: "#fff", border: "1px solid #334155", padding: "8px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", textDecoration: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          {account ? (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button 
                onClick={disconnectWallet}
                style={{ 
                  backgroundColor: "#ef4444", 
                  color: "#fff", 
                  border: "none", 
                  padding: "8px 12px", 
                  borderRadius: "10px", 
                  fontWeight: "bold", 
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px"
                }}
                title="Disconnect Wallet"
              >
                <LogOut size={14} /> 
                <span style={{ display: "inline" }}>{account.substring(0,4)}...{account.substring(account.length-4)}</span>
              </button>
            </div>
          ) : (
            <button onClick={connectWallet} disabled={connecting} style={{ backgroundColor: "#fbbf24", color: "#000", border: "none", padding: "8px 16px", borderRadius: "10px", fontWeight: "bold", cursor: connecting ? "not-allowed" : "pointer", opacity: connecting ? 0.7 : 1 }}>
              {connecting ? "⏳ Connecting..." : "🔌 Connect Wallet"}
            </button>
          )}
        </div>
      </header>

      {/* ===== MAIN CARD ===== */}
      <div style={{ maxWidth: "450px", margin: "0 auto" }}>
        
        {/* ===== TAB NAVIGASI ===== */}
        <div style={{ display: "flex", backgroundColor: "#111827", padding: "4px", borderRadius: "12px", marginBottom: "16px", border: "1px solid #1e293b" }}>
          {["swap", "mint", "pool"].map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, padding: "10px", border: "none", borderRadius: "8px", backgroundColor: activeTab === t ? "#1e293b" : "transparent", color: "#fff", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ===== TAB SWAP ===== */}
        {activeTab === "swap" && (
          <div style={{ backgroundColor: "#111827", borderRadius: "16px", padding: "20px", border: "1px solid #1e293b" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
              <button onClick={() => setShowSlippageModal(true)} style={{ backgroundColor: "#1e293b", border: "none", color: "#94a3b8", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                <Settings size={14} /> Slippage: {slippage}%
              </button>
            </div>

            <div style={{ backgroundColor: "#0f172a", padding: "12px", borderRadius: "12px", marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9ca3af" }}>
                <span>Bayar ({fromSym})</span>
                <span>Saldo: {fromBalance}</span>
              </div>
              <input type="number" placeholder="0.0" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} style={{ background: "transparent", border: "none", color: "#fff", fontSize: "20px", width: "100%", outline: "none", marginTop: "5px" }} />
            </div>
            <button onClick={() => { setFromSym(toSym); setToSym(fromSym); }} style={{ display: "block", margin: "10px auto", backgroundColor: "#1e293b", border: "none", color: "#fbbf24", padding: "6px", borderRadius: "8px", cursor: "pointer" }}>
              <ArrowUpDown size={16} />
            </button>
            <div style={{ backgroundColor: "#0f172a", padding: "12px", borderRadius: "12px", marginBottom: "15px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9ca3af" }}>
                <span>Terima ({toSym})</span>
                <span>Saldo: {toBalance}</span>
              </div>
              <input type="text" placeholder="0.0" value={amountIn ? (parseFloat(amountIn) * (1 - slippage/100)).toFixed(1) : ""} readOnly style={{ background: "transparent", border: "none", color: "#9ca3af", fontSize: "20px", width: "100%", outline: "none", marginTop: "5px" }} />
            </div>
            <button onClick={handleSwap} disabled={swapLoading || !amountIn || !account} style={{ width: "100%", backgroundColor: account && amountIn ? "#fbbf24" : "#4b5563", color: account && amountIn ? "#000" : "#9ca3af", border: "none", padding: "12px", borderRadius: "12px", fontWeight: "bold", cursor: account && amountIn ? "pointer" : "not-allowed" }}>
              {!account ? "🔌 Connect Wallet" : swapLoading ? "⏳ Memproses..." : !amountIn ? "Masukkan Jumlah" : "🔄 Tukar Token"}
            </button>
          </div>
        )}

        {/* ===== TAB MINT ===== */}
        {activeTab === "mint" && (
          <div style={{ backgroundColor: "#111827", borderRadius: "16px", padding: "20px", border: "1px solid #1e293b" }}>
            <p style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", marginBottom: "12px" }}>
              Ambil 10,000 token testnet gratis langsung ke dompetmu.
            </p>
            {Object.keys(TOKEN_LIST).map((sym) => (
              <div key={sym} style={{ backgroundColor: "#0f172a", padding: "12px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "20px" }}>{TOKEN_LIST[sym].logo}</span>
                  <div>
                    <strong>{sym}</strong>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>Saldo: {mintBalances[sym] || "0.0"}</div>
                  </div>
                </div>
                <button onClick={() => handleMintToken(sym)} disabled={mintingSym === sym || !TOKEN_LIST[sym].address || !account} style={{ backgroundColor: "#1e293b", color: TOKEN_LIST[sym].address && account ? "#fbbf24" : "#4b5563", border: `1px solid ${TOKEN_LIST[sym].address && account ? "#fbbf24" : "#4b5563"}`, padding: "6px 12px", borderRadius: "8px", cursor: TOKEN_LIST[sym].address && account ? "pointer" : "not-allowed", fontWeight: "bold" }}>
                  {!account ? "🔌 Connect" : mintingSym === sym ? "⏳ Minting..." : !TOKEN_LIST[sym].address ? "Soon" : "Mint 10k"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ===== TAB POOL ===== */}
        {activeTab === "pool" && (
          <div style={{ backgroundColor: "#111827", borderRadius: "16px", padding: "20px", border: "1px solid #1e293b" }}>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              <div style={{ backgroundColor: "#0f172a", padding: "12px", borderRadius: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#94a3b8" }}>Total Likuiditas</div>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#fbbf24" }}>${poolStats.totalLiquidity}</div>
              </div>
              <div style={{ backgroundColor: "#0f172a", padding: "12px", borderRadius: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#94a3b8" }}>Volume 24 Jam</div>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#10b981" }}>${poolStats.volume24h}</div>
              </div>
            </div>

            <div style={{ backgroundColor: "#0f172a", padding: "12px", borderRadius: "12px", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
                <span>Harga USDC/DAI</span>
                <span style={{ color: "#fbbf24", fontWeight: "bold" }}>{poolStats.rate}</span>
              </div>
              {renderChart()}
            </div>

            <div style={{ backgroundColor: "#0f172a", padding: "12px", borderRadius: "12px", fontSize: "13px", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#94a3b8" }}>Cadangan USDC:</span>
                <strong>{poolStats.reserveA}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Cadangan DAI:</span>
                <strong>{poolStats.reserveB}</strong>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #1e293b", paddingTop: "12px" }}>
              <div style={{ fontSize: "13px", fontWeight: "bold", color: "#fbbf24", marginBottom: "8px" }}>
                <Droplets size={16} style={{ display: "inline", marginRight: "6px" }} /> Tambah Likuiditas
              </div>
              
              <div style={{ backgroundColor: "#0f172a", padding: "10px", borderRadius: "10px", marginBottom: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#9ca3af" }}>
                  <span>Jumlah USDC</span>
                </div>
                <input type="number" placeholder="0.0" value={amountAInput} onChange={(e) => setAmountAInput(e.target.value)} style={{ background: "transparent", border: "none", color: "#fff", fontSize: "16px", width: "100%", outline: "none", marginTop: "3px" }} />
              </div>

              <div style={{ backgroundColor: "#0f172a", padding: "10px", borderRadius: "10px", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#9ca3af" }}>
                  <span>Jumlah DAI</span>
                </div>
                <input type="number" placeholder="0.0" value={amountBInput} onChange={(e) => setAmountBInput(e.target.value)} style={{ background: "transparent", border: "none", color: "#fff", fontSize: "16px", width: "100%", outline: "none", marginTop: "3px" }} />
              </div>

              <button onClick={handleAddLiquidity} disabled={poolLoading || !amountAInput || !amountBInput || !account} style={{ width: "100%", backgroundColor: account ? "#10b981" : "#4b5563", color: account ? "#000" : "#9ca3af", border: "none", padding: "10px", borderRadius: "10px", fontWeight: "bold", cursor: account ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                {!account ? "🔌 Connect Wallet" : poolLoading ? <RefreshCw className="animate-spin" size={16} /> : "Tambah Likuiditas"}
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#6b7280", marginTop: "12px" }}>
              <span>Pool Contract:</span>
              <div style={{ display: "flex", gap: "4px", alignItems: "center", color: "#9ca3af" }}>
                <span>{CONTRACTS.pool.substring(0, 10)}...</span>
                <button onClick={() => handleCopyAddress(CONTRACTS.pool)} style={{ background: "transparent", border: "none", color: "#fbbf24", cursor: "pointer" }}>
                  {copiedAddr === CONTRACTS.pool ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== FOOTER ===== */}
      <footer style={{ textAlign: "center", marginTop: "30px", padding: "20px 0", borderTop: "1px solid #1e293b" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <FreesiaLogo />
          <span style={{ fontSize: "14px", fontWeight: "bold", color: "#fbbf24" }}>Freesia DEX</span>
        </div>
        <p style={{ fontSize: "12px", fontWeight: "bold", color: "#94a3b8", margin: "4px 0" }}>
          POWERED BY FREESIA NETWORK
        </p>
        <p style={{ fontSize: "11px", color: "#64748b", margin: "4px 0" }}>
          Dibangun oleh <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: "#fbbf24", textDecoration: "none" }}>@0xzackbh</a>
        </p>
      </footer>
    </div>
  );
}

// ===== KOMPONEN LOGO =====
function FreesiaLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" stroke="#fbbf24" strokeWidth="2" />
      <path d="M10 16 L22 16 M16 10 L16 22" stroke="#fbbf24" strokeWidth="2" />
      <circle cx="16" cy="16" r="4" fill="#fbbf24" />
    </svg>
  );
}

export default App;
