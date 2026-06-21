import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// 🌸 LOGO FREESIA VECTOR
const FreesiaLogo = () => (
  <svg width="45" height="45" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 50 C50 20, 35 25, 50 10 C65 25, 50 20, 50 50" fill="#FFA6C9" />
    <path d="M50 50 C50 80, 65 75, 50 90 C35 75, 50 80, 50 50" fill="#FFA6C9" />
    <path d="M50 50 C20 50, 25 35, 10 50 C25 65, 20 50, 50 50" fill="#FFA6C9" />
    <path d="M50 50 C80 50, 75 65, 90 50 C75 35, 80 50, 50 50" fill="#FFA6C9" />
    <path d="M50 50 C30 30, 20 45, 22 22 C45 20, 30 30, 50 50" fill="#FFB6D9" />
    <path d="M50 50 C70 70, 80 55, 78 78 C55 80, 70 70, 50 50" fill="#FFB6D9" />
    <path d="M50 50 C70 30, 55 20, 78 22 C80 45, 70 30, 50 50" fill="#FFB6D9" />
    <path d="M50 50 C30 70, 45 80, 22 78 C20 55, 30 70, 50 50" fill="#FFB6D9" />
    <path d="M60 25 C52 22, 44 30, 44 42 L44 78 M34 45 L56 45" stroke="#0F172A" strokeWidth="8" strokeLinecap="round" fill="none" />
  </svg>
);

// ✅ FIXED: address pool sesuai hasil deploy asli (tidak ada karakter ekstra)
const CONTRACTS = { pool: "0xbdA6416a9420fD9fC012A217930c803dA7F3f0f9" };

// ✅ NETWORK CONFIG — LitVM Testnet (chain ID 4441)
const LITVM_CHAIN_ID_HEX = "0x1159"; // 4441 dalam hex
const LITVM_CHAIN_ID_DEC = 4441n;
const LITVM_PARAMS = {
  chainId: LITVM_CHAIN_ID_HEX,
  chainName: "LitVM Testnet",
  nativeCurrency: { name: "zkLTC", symbol: "zkLTC", decimals: 18 },
  rpcUrls: ["https://liteforge.rpc.caldera.xyz/http"],
  blockExplorerUrls: ["https://liteforge.explorer.caldera.xyz"],
};

const SimpleERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function mint(address to, uint256 amount) external",
  "function symbol() view returns (string)"
];

const SimpleLiquidityPool_ABI = [
  "function swap(address fromToken, uint256 amountIn) external returns (uint256)",
  "function addLiquidity(uint256 amountA, uint256 amountB) external returns (uint256)"
];

const styles = {
  layout: { backgroundColor: "#F9F8F6", color: "#0F172A", minHeight: "100vh", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", backgroundColor: "#FFFFFF", borderBottom: "1px solid #E2E8F0" },
  navContainer: { display: "flex", gap: "10px", padding: "20px 24px", overflowX: "auto" },
  navTab: (isActive) => ({ padding: "10px 20px", borderRadius: "12px", border: "none", fontWeight: "bold", cursor: "pointer", backgroundColor: isActive ? "#FDC500" : "#F1F5F9", color: isActive ? "#000" : "#64748B", transition: "0.2s" }),
  mainContent: { padding: "0 24px 40px 24px", maxWidth: "1000px", margin: "0 auto", flexGrow: 1, width: "100%", boxSizing: "border-box" },
  card: { backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "24px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px rgba(0,0,0,0.02)", marginBottom: "20px" },
  button: { backgroundColor: "#FDC500", color: "#000", border: "none", padding: "16px", borderRadius: "12px", fontWeight: "900", cursor: "pointer", width: "100%", fontSize: "16px", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" },
  inputBox: { backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", padding: "16px", borderRadius: "12px", marginBottom: "16px" },
  input: { width: "100%", border: "none", backgroundColor: "transparent", fontSize: "24px", fontWeight: "bold", color: "#0F172A", outline: "none", marginTop: "8px" },
  footer: { textAlign: "center", padding: "40px 20px", color: "#64748B", marginTop: "auto", borderTop: "1px solid #E2E8F0" },
  networkBadge: (ok) => ({ fontSize: "11px", fontWeight: "bold", color: ok ? "#10B981" : "#DC2626", backgroundColor: ok ? "#ECFDF5" : "#FEF2F2", padding: "2px 8px", borderRadius: "6px", marginLeft: "8px" })
};

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [onCorrectNetwork, setOnCorrectNetwork] = useState(false);

  // ✅ FIXED: address DAI diperbaiki (sebelumnya ada teks "Base" nyelip di tengah)
  const [tokens, setTokens] = useState({
    zkLTC: { address: "NATIVE", isNative: true },
    USDC: { address: "0x6c18239A767d19dd6d274B94442f09eE6b9b6701", isNative: false },
    DAI: { address: "0x9013443A3E0Dd775152678a76fceDcA54e1E1710", isNative: false }
  });

  const [balances, setBalances] = useState({ zkLTC: "0.0000", USDC: "0.00", DAI: "0.00" });
  const [fromSym, setFromSym] = useState("USDC");
  const [toSym, setToSym] = useState("DAI");
  const [amountIn, setAmountIn] = useState("");
  const [poolTokenA, setPoolTokenA] = useState("USDC");
  const [poolTokenB, setPoolTokenB] = useState("DAI");
  const [amountAInput, setAmountAInput] = useState("");
  const [amountBInput, setAmountBInput] = useState("");
  const [customAddress, setCustomAddress] = useState("");
  const [customSymbol, setCustomSymbol] = useState("");

  const [loading, setLoading] = useState(false);
  const [txCount, setTxCount] = useState(0);

  // 🦊 CONNECT WALLET — sekarang otomatis switch/tambah network LitVM
  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert("Ekstensi/Dompet Web3 tidak terdeteksi! Silakan buka tautan ini di dApp Browser di dalam aplikasi dompet Anda.");
      return;
    }

    try {
      setConnecting(true);

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        alert("Tidak ada akun yang dipilih di wallet.");
        setConnecting(false);
        return;
      }

      // ✅ Cek network saat ini, pindah ke LitVM kalau belum benar
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const network = await web3Provider.getNetwork();

      if (network.chainId !== LITVM_CHAIN_ID_DEC) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: LITVM_CHAIN_ID_HEX }],
          });
        } catch (switchErr) {
          // 4902 = network belum dikenal wallet, perlu ditambahkan dulu
          if (switchErr.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [LITVM_PARAMS],
              });
            } catch (addErr) {
              console.error(addErr);
              alert("Gagal menambahkan network LitVM Testnet ke wallet kamu.");
              setConnecting(false);
              return;
            }
          } else {
            alert("Silakan ganti network ke LitVM Testnet (chain ID 4441) secara manual di wallet kamu.");
            setConnecting(false);
            return;
          }
        }
      }

      // Re-create provider setelah switch network supaya state-nya fresh
      const finalProvider = new ethers.BrowserProvider(window.ethereum);
      const finalNetwork = await finalProvider.getNetwork();
      const web3Signer = await finalProvider.getSigner();

      setProvider(finalProvider);
      setSigner(web3Signer);
      setAccount(accounts[0]);
      setOnCorrectNetwork(finalNetwork.chainId === LITVM_CHAIN_ID_DEC);

    } catch (err) {
      console.error("Koneksi gagal:", err);
      alert("Gagal terhubung: " + (err.message || "Unknown error").slice(0, 100));
    } finally {
      setConnecting(false);
    }
  };

  // ✅ Dengarkan perubahan network/akun dari wallet, refresh status otomatis
  useEffect(() => {
    if (!window.ethereum) return;

    const handleChainChanged = (chainIdHex) => {
      setOnCorrectNetwork(chainIdHex.toLowerCase() === LITVM_CHAIN_ID_HEX);
      window.location.reload();
    };
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAccount("");
        setSigner(null);
      } else {
        window.location.reload();
      }
    };

    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  const updateData = useCallback(async () => {
    if (!provider || !account) return;
    try {
      let newBalances = {};
      for (const [sym, data] of Object.entries(tokens)) {
        if (data.isNative) {
          const bal = await provider.getBalance(account);
          newBalances[sym] = parseFloat(ethers.formatEther(bal)).toFixed(4);
        } else {
          const contract = new ethers.Contract(data.address, SimpleERC20_ABI, provider);
          const bal = await contract.balanceOf(account).catch(() => 0n);
          newBalances[sym] = parseFloat(ethers.formatUnits(bal, 18)).toFixed(2);
        }
      }
      setBalances(prev => ({ ...prev, ...newBalances }));
    } catch (err) { console.error("Balance fetch error", err); }
  }, [provider, account, tokens]);

  useEffect(() => {
    if (provider && account) {
      updateData();
      const interval = setInterval(updateData, 4000);
      return () => clearInterval(interval);
    }
  }, [provider, account, tokens, updateData]);

  const handleAddToken = () => {
    if (!customAddress || !customSymbol) return alert("Isi alamat dan simbol token!");
    const symUpper = customSymbol.toUpperCase();
    setTokens(prev => ({ ...prev, [symUpper]: { address: customAddress, isNative: false } }));
    setBalances(prev => ({ ...prev, [symUpper]: "0.00" }));
    alert(`${symUpper} berhasil ditambahkan!`);
    setCustomAddress(""); setCustomSymbol("");
    updateData();
  };

  const ensureCorrectNetwork = async () => {
    if (!signer) {
      alert("Hubungkan wallet dulu!");
      return false;
    }
    if (!onCorrectNetwork) {
      alert("Wallet kamu belum di network LitVM Testnet. Klik Connect Wallet lagi untuk pindah network otomatis.");
      return false;
    }
    return true;
  };

  const handleSwap = async () => {
    if (!(await ensureCorrectNetwork())) return;
    if (!amountIn) return alert("Masukkan jumlah!");
    setLoading(true);
    try {
      const parsedIn = ethers.parseUnits(String(amountIn), 18);
      if (tokens[fromSym].isNative) {
        alert("Swap langsung dari zkLTC native belum didukung pool ini. Gunakan USDC/DAI.");
      } else {
        const tokenContract = new ethers.Contract(tokens[fromSym].address, SimpleERC20_ABI, signer);
        await (await tokenContract.approve(CONTRACTS.pool, parsedIn)).wait();
        const poolContract = new ethers.Contract(CONTRACTS.pool, SimpleLiquidityPool_ABI, signer);
        await (await poolContract.swap(tokens[fromSym].address, parsedIn, { gasLimit: 400000 })).wait();
        alert("Swap Berhasil!");
        setTxCount(prev => prev + 1);
        setAmountIn("");
        updateData();
      }
    } catch (err) {
      console.error(err);
      alert("Swap Gagal: " + (err.reason || err.message || "Pastikan gas fee cukup.").slice(0, 100));
    } finally { setLoading(false); }
  };

  const handleMint = async (sym) => {
    if (!(await ensureCorrectNetwork())) return;
    setLoading(true);
    try {
      const contract = new ethers.Contract(tokens[sym].address, SimpleERC20_ABI, signer);
      await (await contract.mint(account, ethers.parseUnits("10000", 18))).wait();
      alert(`Mint 10,000 ${sym} Berhasil!`);
      setTxCount(prev => prev + 1);
      updateData();
    } catch (err) {
      console.error(err);
      alert("Mint Gagal: " + (err.reason || err.message || "Unknown error").slice(0, 100));
    }
    setLoading(false);
  };

  const handleAddLiquidity = async () => {
    if (!(await ensureCorrectNetwork())) return;
    if (!amountAInput || !amountBInput) return alert("Isi nominal!");
    setLoading(true);
    try {
      const pA = ethers.parseUnits(String(amountAInput), 18);
      const pB = ethers.parseUnits(String(amountBInput), 18);
      const tokenAContract = new ethers.Contract(tokens[poolTokenA].address, SimpleERC20_ABI, signer);
      const tokenBContract = new ethers.Contract(tokens[poolTokenB].address, SimpleERC20_ABI, signer);

      await (await tokenAContract.approve(CONTRACTS.pool, pA)).wait();
      await (await tokenBContract.approve(CONTRACTS.pool, pB)).wait();

      const poolContract = new ethers.Contract(CONTRACTS.pool, SimpleLiquidityPool_ABI, signer);
      await (await poolContract.addLiquidity(pA, pB, { gasLimit: 500000 })).wait();

      alert("Likuiditas Berhasil Ditambahkan!");
      setTxCount(prev => prev + 1);
      setAmountAInput(""); setAmountBInput("");
      updateData();
    } catch (err) {
      console.error(err);
      alert("Gagal tambah likuiditas: " + (err.reason || err.message || "Unknown error").slice(0, 100));
    }
    setLoading(false);
  };

  return (
    <div style={styles.layout}>

      {/* 1. HEADER */}
      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FreesiaLogo />
          <div>
            <h1 style={{ fontSize: "20px", margin: 0, fontWeight: "900", color: "#0F172A" }}>Freesia DEX</h1>
            <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "bold" }}>
              LitVM Testnet
              {account && (
                <span style={styles.networkBadge(onCorrectNetwork)}>
                  {onCorrectNetwork ? "✓ Network Benar" : "⚠ Network Salah"}
                </span>
              )}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: "#0F172A", textDecoration: "none", fontSize: "22px", fontWeight: "bold" }}>𝕏</a>
          <button onClick={connectWallet} disabled={connecting} style={{ backgroundColor: "#FDC500", border: "none", padding: "10px 16px", borderRadius: "10px", fontWeight: "bold", color: "#000", cursor: connecting ? "wait" : "pointer", opacity: connecting ? 0.7 : 1 }}>
            {connecting ? "Menghubungkan..." : account ? `🟢 ${account.substring(0, 6)}...` : "Connect Wallet"}
          </button>
        </div>
      </header>

      {/* 2. MENU NAVIGASI */}
      <div style={styles.navContainer}>
        {["dashboard", "swap", "mint", "pool", "import"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={styles.navTab(activeTab === tab)}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <main style={styles.mainContent}>
        {/* TAB DASHBOARD */}
        {activeTab === "dashboard" && (
          <div>
            <h2 style={{ fontSize: "14px", color: "#64748B", marginTop: 0 }}>AKUN & LEADERBOARD</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px", marginBottom: "32px" }}>
              <div style={styles.card}>
                <span style={{ color: "#64748B", fontSize: "12px", fontWeight: "bold" }}>AKTIVITAS ON-CHAIN (TXNS)</span>
                <h2 style={{ margin: "8px 0 0 0", fontSize: "28px" }}>{txCount}</h2>
                <span style={{ color: "#10B981", fontSize: "12px" }}>Reputasi: {txCount * 15} XP Pts</span>
              </div>
            </div>
            <div style={{ ...styles.card, padding: "0" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between" }}>
                <span>🏆 0x71C...392b</span><strong>240 XP</strong>
              </div>
              <div style={{ padding: "16px 24px", backgroundColor: "#FFFBEB", display: "flex", justifyContent: "space-between", borderBottomLeftRadius: "16px", borderBottomRightRadius: "16px" }}>
                <span>👉 Anda ({account ? account.substring(0,6) : "Anon"})</span><strong style={{ color: "#D97706" }}>{txCount * 15} XP</strong>
              </div>
            </div>
          </div>
        )}

        {/* TAB SWAP */}
        {activeTab === "swap" && (
          <div style={{ maxWidth: "480px", margin: "0 auto" }}>
            <div style={styles.card}>
              <div style={styles.inputBox}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B", fontSize: "13px" }}>
                  <span>Anda Membayar</span>
                  <span>Saldo: {balances[fromSym] || "0.00"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <input style={styles.input} type="number" placeholder="0.00" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} />
                  <select value={fromSym} onChange={(e) => setFromSym(e.target.value)} style={{ padding: "8px", borderRadius: "8px", border: "1px solid #E2E8F0", fontWeight: "bold", background: "#fff", outline: "none" }}>
                    {Object.keys(tokens).map(sym => <option key={sym} value={sym}>{sym}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ textAlign: "center", margin: "-20px 0 10px 0", zIndex: 2, position: "relative" }}>
                <span style={{ backgroundColor: "#FFF", border: "1px solid #E2E8F0", padding: "6px 12px", borderRadius: "50%" }}>⇅</span>
              </div>

              <div style={styles.inputBox}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B", fontSize: "13px" }}>
                  <span>Menerima (Estimasi)</span>
                  <span>Saldo: {balances[toSym] || "0.00"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <input style={styles.input} type="number" placeholder="0.00" value={amountIn ? (amountIn * 0.99).toFixed(4) : ""} readOnly />
                  <select value={toSym} onChange={(e) => setToSym(e.target.value)} style={{ padding: "8px", borderRadius: "8px", border: "1px solid #E2E8F0", fontWeight: "bold", background: "#fff", outline: "none" }}>
                    {Object.keys(tokens).map(sym => <option key={sym} value={sym}>{sym}</option>)}
                  </select>
                </div>
              </div>

              <button style={styles.button} onClick={handleSwap} disabled={loading || !amountIn}>
                {loading ? "Memproses..." : "Tukar Token"}
              </button>
            </div>
          </div>
        )}

        {/* TAB MINT FAUCET */}
        {activeTab === "mint" && (
          <div style={{ maxWidth: "480px", margin: "0 auto" }}>
            <div style={styles.card}>
              <h3 style={{ marginTop: 0 }}>Klaim Faucet Testnet</h3>
              {Object.entries(tokens).filter(([_, data]) => !data.isNative).map(([sym, _]) => (
                <div key={sym} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", border: "1px solid #E2E8F0", borderRadius: "12px", marginBottom: "12px" }}>
                  <div><strong>{sym}</strong><div style={{ fontSize: "12px", color: "#64748B" }}>Saldo: {balances[sym] || "0.00"}</div></div>
                  <button onClick={() => handleMint(sym)} disabled={loading} style={{ backgroundColor: "#FDC500", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "bold", cursor: loading ? "wait" : "pointer" }}>Mint 10k</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB POOL */}
        {activeTab === "pool" && (
           <div style={{ maxWidth: "480px", margin: "0 auto" }}>
            <div style={styles.card}>
              <h3 style={{ marginTop: 0 }}>Suntik Likuiditas (Pool)</h3>
              <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "bold" }}>Token A</span>
                  <select value={poolTokenA} onChange={(e) => setPoolTokenA(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0", marginTop: "6px" }}>
                    {Object.keys(tokens).filter(t => !tokens[t].isNative).map(sym => <option key={sym} value={sym}>{sym}</option>)}
                  </select>
                  <input type="number" placeholder="Jumlah" value={amountAInput} onChange={(e) => setAmountAInput(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0", marginTop: "10px", boxSizing: "border-box" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "bold" }}>Token B</span>
                  <select value={poolTokenB} onChange={(e) => setPoolTokenB(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0", marginTop: "6px" }}>
                    {Object.keys(tokens).filter(t => !tokens[t].isNative).map(sym => <option key={sym} value={sym}>{sym}</option>)}
                  </select>
                  <input type="number" placeholder="Jumlah" value={amountBInput} onChange={(e) => setAmountBInput(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0", marginTop: "10px", boxSizing: "border-box" }} />
                </div>
              </div>
              <button style={styles.button} onClick={handleAddLiquidity} disabled={loading}>
                {loading ? "Memproses..." : "Tambah Likuiditas"}
              </button>
            </div>
           </div>
        )}

        {/* TAB IMPORT TOKEN */}
        {activeTab === "import" && (
          <div style={{ maxWidth: "480px", margin: "0 auto" }}>
            <div style={styles.card}>
              <h3 style={{ marginTop: 0 }}>Import Token Kustom</h3>
              <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "20px" }}>Masukkan smart contract token ERC20 untuk menambahkannya ke dalam DEX.</p>
              <div style={styles.inputBox}>
                <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "bold" }}>Alamat Kontrak (0x...)</span>
                <input style={{ ...styles.input, fontSize: "16px" }} type="text" placeholder="0x123..." value={customAddress} onChange={(e) => setCustomAddress(e.target.value)} />
              </div>
              <div style={styles.inputBox}>
                <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "bold" }}>Simbol Token (cth: PEPE)</span>
                <input style={{ ...styles.input, fontSize: "16px" }} type="text" placeholder="PEPE" value={customSymbol} onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())} />
              </div>
              <button style={styles.button} onClick={handleAddToken}>+ Tambahkan Token</button>
            </div>
          </div>
        )}
      </main>

      {/* 🌸 FOOTER LOGO FREESIA */}
      <footer style={styles.footer}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", animation: "pulse 3s infinite ease-in-out" }}>
          <FreesiaLogo />
        </div>
        <p style={{ fontSize: "12px", fontWeight: "bold", color: "#94A3B8", letterSpacing: "1px", margin: 0 }}>
          POWERED BY FREESIA NETWORK
        </p>
        <p style={{ fontSize: "11px", color: "#CBD5E1", margin: "6px 0 0 0" }}>
          Dibangun oleh <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: "#94A3B8", fontWeight: "bold" }}>@0xzackbh</a>
        </p>
      </footer>

      <style>{`
        @keyframes pulse { 
          0%, 100% { transform: scale(1); opacity: 0.85; } 
          50% { transform: scale(1.06); opacity: 1; } 
        }
      `}</style>
    </div>
  );
}
