import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { ArrowUpDown, RefreshCw, Droplets, Copy, Check } from "lucide-react";

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
  tokenA: "0x6c18239A767d19dd6d274B94442f09eE6b9b6701", // USDC
  tokenB: "0x9013443A3E0Dd775152678a76fceDcA54e1E1710", // DAI
  pool: "0xbdA6416a9420fD9fC012A217930c803dA7F3f0f9",   // POOL
};

const TOKEN_LIST = {
  USDC: { address: CONTRACTS.tokenA, logo: "💵" },
  DAI: { address: CONTRACTS.tokenB, logo: "◈" },
  USDT: { address: null, logo: "💲" },
  WETH: { address: null, logo: "⟠" }
};

const LITVM_CHAIN_ID = 4441;
const LITVM_CHAIN_ID_HEX = "0x1159";

// ==================== KOMPONEN UTAMA ====================
function App() {
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState("swap");
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  // State untuk Swap
  const [fromSym, setFromSym] = useState("USDC");
  const [toSym, setToSym] = useState("DAI");
  const [amountIn, setAmountIn] = useState("");
  const [fromBalance, setFromBalance] = useState("—");
  const [toBalance, setToBalance] = useState("—");
  const [swapLoading, setSwapLoading] = useState(false);

  // State untuk Pool
  const [reserveA, setReserveA] = useState("—");
  const [reserveB, setReserveB] = useState("—");
  const [rateText, setRateText] = useState("—");
  const [amountAInput, setAmountAInput] = useState("");
  const [amountBInput, setAmountBInput] = useState("");
  const [poolLoading, setPoolLoading] = useState(false);

  // State untuk Mint
  const [mintBalances, setMintBalances] = useState({});
  const [mintingSym, setMintingSym] = useState(null);
  const [copiedAddr, setCopiedAddr] = useState(null);

  // ==================== FUNGSI BANTUAN ====================
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
      console.log("🔄 Menghubungkan ke MetaMask...");
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      
      if (!accounts || accounts.length === 0) {
        throw new Error("Tidak ada akun yang dipilih");
      }

      console.log("✅ Akun terhubung:", accounts[0]);
      setAccount(accounts[0]);
      setProvider(web3Provider);

      const web3Signer = await web3Provider.getSigner();
      setSigner(web3Signer);

      // Cek dan switch network ke LitVM
      const network = await web3Provider.getNetwork();
      if (network.chainId !== BigInt(LITVM_CHAIN_ID)) {
        console.log("🔄 Switching ke LitVM Testnet...");
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

  // ==================== UPDATE DATA ====================
  const updateData = useCallback(async () => {
    if (!provider || !account) return;

    try {
      console.log("🔄 Update data...");
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
      setReserveA(ethers.formatUnits(resA, 18));
      setReserveB(ethers.formatUnits(resB, 18));
      
      if (resA > 0n) {
        const rate = Number(resB) / Number(resA);
        setRateText(`1 USDC = ${rate.toFixed(4)} DAI`);
      } else {
        setRateText("Pool Kosong");
      }

    } catch (err) {
      console.error("❌ Error update data:", err);
    }
  }, [provider, account, fromSym]);

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
      console.log(`🔄 Minting ${sym}...`);
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const tx = await token.mint(account, ethers.parseUnits("10000", 18));
      showToast("⏳", `Memproses Mint 10,000 ${sym}...`);
      await tx.wait();
      showToast("✅", `Berhasil Mint 10,000 ${sym}!`);
      updateData();
    } catch (err) {
      console.error(`❌ Gagal mint ${sym}:`, err);
      showToast("❌", `Gagal mint ${sym}. Lihat console.`);
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
      console.log(`🔄 Swap ${amountIn} ${fromSym} -> ${toSym}`);

      // Cek saldo
      const tokenContract = new ethers.Contract(fromAddr, ERC20_ABI, signer);
      const balance = await tokenContract.balanceOf(account);
      if (balance < parsedIn) {
        throw new Error(`Saldo ${fromSym} tidak cukup!`);
      }

      // Cek allowance
      const allowance = await tokenContract.allowance(account, CONTRACTS.pool);
      if (allowance < parsedIn) {
        console.log("🔄 Approve token...");
        const approveTx = await tokenContract.approve(CONTRACTS.pool, parsedIn);
        await approveTx.wait();
        console.log("✅ Approve selesai!");
      }

      // Eksekusi swap
      const poolContract = new ethers.Contract(CONTRACTS.pool, POOL_ABI, signer);
      console.log("🔄 Eksekusi swap...");
      const swapTx = await poolContract.swap(fromAddr, parsedIn, {
        gasLimit: 500000,
        gasPrice: ethers.parseUnits("1", "gwei")
      });
      await swapTx.wait();

      console.log("✅ Swap berhasil!");
      showToast("🎉", "Swap Berhasil!");
      setAmountIn("");
      updateData();

    } catch (err) {
      console.error("❌ Error swap:", err);
      setError(err.message);
      showToast("❌", `Swap Gagal: ${err.message}`);
    } finally {
      setSwapLoading(false);
    }
  };

  // ==================== TAMBAH LIKUIDITAS ====================
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

      // Approve USDC
      const allowanceA = await tokenA.allowance(account, CONTRACTS.pool);
      if (allowanceA < parsedA) {
        console.log("🔄 Approve USDC...");
        const approveTxA = await tokenA.approve(CONTRACTS.pool, parsedA);
        await approveTxA.wait();
        console.log("✅ Approve USDC selesai!");
      }

      // Approve DAI
      const allowanceB = await tokenB.allowance(account, CONTRACTS.pool);
      if (allowanceB < parsedB) {
        console.log("🔄 Approve DAI...");
        const approveTxB = await tokenB.approve(CONTRACTS.pool, parsedB);
        await approveTxB.wait();
        console.log("✅ Approve DAI selesai!");
      }

      // Tambah likuiditas
      showToast("⏳", "Menambahkan likuiditas...");
      const tx = await pool.addLiquidity(parsedA, parsedB, {
        gasLimit: 500000,
        gasPrice: ethers.parseUnits("1", "gwei")
      });
      await tx.wait();

      showToast("🎉", "Likuiditas Berhasil Ditambahkan!");
      setAmountAInput("");
      setAmountBInput("");
      updateData();

    } catch (err) {
      console.error("❌ Error add liquidity:", err);
      showToast("❌", `Gagal: ${err.message}`);
    } finally {
      setPoolLoading(false);
    }
  };

  const handleCopyAddress = (addr) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddr(addr);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  // ==================== RENDER TAMPILAN ====================
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0b0f19", color: "#f3f4f6", fontFamily: "sans-serif", padding: "20px" }}>
      {/* Toast Notifikasi */}
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

      {/* ===== HEADER (DENGAN LOGO ASLI) ===== */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "600px", margin: "0 auto 30px auto", borderBottom: "1px solid #1e293b", paddingBottom: "15px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FreesiaLogo /> {/* <-- LOGO ASLI DI SINI */}
          <div>
            <h1 style={{ fontSize: "20px", margin: 0, color: "#fbbf24" }}>Freesia DEX</h1>
            <span style={{ fontSize: "12px", color: "#10b981" }}>● LitVM Testnet</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ backgroundColor: "#1e293b", color: "#fff", border: "1px solid #334155", padding: "8px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", textDecoration: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <button 
            onClick={connectWallet} 
            disabled={connecting}
            style={{ 
              backgroundColor: account ? "#10b981" : "#fbbf24", 
              color: account ? "#fff" : "#000", 
              border: "none", 
              padding: "8px 16px", 
              borderRadius: "10px", 
              fontWeight: "bold", 
              cursor: connecting ? "not-allowed" : "pointer",
              opacity: connecting ? 0.7 : 1
            }}
          >
            {connecting ? "⏳ Connecting..." : 
             account ? `✅ ${account.substring(0,6)}...${account.substring(account.length-4)}` : 
             "🔌 Connect Wallet"}
          </button>
        </div>
      </header>

      {/* ===== MAIN CARD ===== */}
      <div style={{ maxWidth: "450px", margin: "0 auto", backgroundColor: "#111827", borderRadius: "20px", padding: "20px", border: "1px solid #1e293b" }}>
        
        {/* TAB NAVIGATION */}
        <div style={{ display: "flex", backgroundColor: "#0f172a", padding: "4px", borderRadius: "10px", marginBottom: "20px" }}>
          {["swap", "mint", "pool"].map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, padding: "8px", border: "none", borderRadius: "8px", backgroundColor: activeTab === t ? "#1e293b" : "transparent", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ===== TAB SWAP ===== */}
        {activeTab === "swap" && (
          <div>
            <div style={{ backgroundColor: "#0f172a", padding: "12px", borderRadius: "12px", marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9ca3af" }}>
                <span>Bayar ({fromSym})</span>
                <span>Saldo: {fromBalance}</span>
              </div>
              <input 
                type="number" 
                placeholder="0.0" 
                value={amountIn} 
                onChange={(e) => setAmountIn(e.target.value)} 
                style={{ background: "transparent", border: "none", color: "#fff", fontSize: "20px", width: "100%", outline: "none", marginTop: "5px" }} 
              />
            </div>
            <button 
              onClick={() => { setFromSym(toSym); setToSym(fromSym); }} 
              style={{ display: "block", margin: "10px auto", backgroundColor: "#1e293b", border: "none", color: "#fbbf24", padding: "6px", borderRadius: "8px", cursor: "pointer" }}
            >
              <ArrowUpDown size={16} />
            </button>
            <div style={{ backgroundColor: "#0f172a", padding: "12px", borderRadius: "12px", marginBottom: "15px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9ca3af" }}>
                <span>Terima ({toSym})</span>
                <span>Saldo: {toBalance}</span>
              </div>
              <input 
                type="text" 
                placeholder="0.0" 
                value={amountIn ? (parseFloat(amountIn) * 0.99).toFixed(1) : ""} 
                readOnly 
                style={{ background: "transparent", border: "none", color: "#9ca3af", fontSize: "20px", width: "100%", outline: "none", marginTop: "5px" }} 
              />
            </div>
            <button 
              onClick={handleSwap} 
              disabled={swapLoading || !amountIn || !account} 
              style={{ 
                width: "100%", 
                backgroundColor: account && amountIn ? "#fbbf24" : "#4b5563", 
                color: account && amountIn ? "#000" : "#9ca3af", 
                border: "none", 
                padding: "12px", 
                borderRadius: "12px", 
                fontWeight: "bold", 
                cursor: account && amountIn ? "pointer" : "not-allowed" 
              }}
            >
              {!account ? "🔌 Connect Wallet" : 
               swapLoading ? "⏳ Memproses..." : 
               !amountIn ? "Masukkan Jumlah" : 
               "🔄 Tukar Token"}
            </button>
          </div>
        )}

        {/* ===== TAB MINT ===== */}
        {activeTab === "mint" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <p style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", marginBottom: "5px" }}>
              Ambil 10,000 token testnet gratis langsung ke dompetmu.
            </p>
            {Object.keys(TOKEN_LIST).map((sym) => (
              <div key={sym} style={{ backgroundColor: "#0f172a", padding: "12px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "20px" }}>{TOKEN_LIST[sym].logo}</span>
                  <div>
                    <strong>{sym}</strong>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>Saldo: {mintBalances[sym] || "0.0"}</div>
                  </div>
                </div>
                <button 
                  onClick={() => handleMintToken(sym)} 
                  disabled={mintingSym === sym || !TOKEN_LIST[sym].address || !account} 
                  style={{ 
                    backgroundColor: "#1e293b", 
                    color: TOKEN_LIST[sym].address && account ? "#fbbf24" : "#4b5563", 
                    border: `1px solid ${TOKEN_LIST[sym].address && account ? "#fbbf24" : "#4b5563"}`, 
                    padding: "6px 12px", 
                    borderRadius: "8px", 
                    cursor: TOKEN_LIST[sym].address && account ? "pointer" : "not-allowed", 
                    fontWeight: "bold" 
                  }}
                >
                  {!account ? "🔌 Connect" : 
                   mintingSym === sym ? "⏳ Minting..." : 
                   !TOKEN_LIST[sym].address ? "Soon" : 
                   "Mint 10k"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ===== TAB POOL ===== */}
        {activeTab === "pool" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ textAlign: "center", backgroundColor: "#0f172a", padding: "12px", borderRadius: "12px" }}>
              <Droplets style={{ color: "#fbbf24", margin: "0 auto 5px auto" }} size={20} />
              <div style={{ fontSize: "12px", color: "#9ca3af" }}>Kurs Pool</div>
              <div style={{ fontSize: "16px", fontWeight: "bold" }}>{rateText}</div>
            </div>

            <div style={{ backgroundColor: "#0f172a", padding: "12px", borderRadius: "12px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <span>Cadangan USDC:</span><strong>{reserveA}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Cadangan DAI:</span><strong>{reserveB}</strong>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #1e293b", paddingTop: "12px", marginTop: "4px" }}>
              <div style={{ fontSize: "13px", fontWeight: "bold", color: "#fbbf24", marginBottom: "8px" }}>
                Tambah Likuiditas
              </div>
              
              <div style={{ backgroundColor: "#0f172a", padding: "10px", borderRadius: "10px", marginBottom: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#9ca3af" }}>
                  <span>Jumlah USDC</span>
                </div>
                <input 
                  type="number" 
                  placeholder="0.0" 
                  value={amountAInput} 
                  onChange={(e) => setAmountAInput(e.target.value)} 
                  style={{ background: "transparent", border: "none", color: "#fff", fontSize: "16px", width: "100%", outline: "none", marginTop: "3px" }} 
                />
              </div>

              <div style={{ backgroundColor: "#0f172a", padding: "10px", borderRadius: "10px", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#9ca3af" }}>
                  <span>Jumlah DAI</span>
                </div>
                <input 
                  type="number" 
                  placeholder="0.0" 
                  value={amountBInput} 
                  onChange={(e) => setAmountBInput(e.target.value)} 
                  style={{ background: "transparent", border: "none", color: "#fff", fontSize: "16px", width: "100%", outline: "none", marginTop: "3px" }} 
                />
              </div>

              <button 
                onClick={handleAddLiquidity} 
                disabled={poolLoading || !amountAInput || !amountBInput || !account} 
                style={{ 
                  width: "100%", 
                  backgroundColor: account ? "#10b981" : "#4b5563", 
                  color: account ? "#000" : "#9ca3af", 
                  border: "none", 
                  padding: "10px", 
                  borderRadius: "10px", 
                  fontWeight: "bold", 
                  cursor: account ? "pointer" : "not-allowed", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  gap: "6px" 
                }}
              >
                {!account ? "🔌 Connect Wallet" : 
                 poolLoading ? <RefreshCw className="animate-spin" size={16} /> : 
                 "Tambah Likuiditas"}
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>
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

      {/* ===== FOOTER (DENGAN LOGO DAN POWERED BY) ===== */}
      <footer style={{ textAlign: "center", marginTop: "30px", padding: "20px 0", borderTop: "1px solid #1e293b" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <FreesiaLogo /> {/* <-- LOGO ASLI JUGA DI FOOTER */}
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

// ===== KOMPONEN LOGO FREESIA =====
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