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

const CONTRACTS = { pool: "0xbDA6416a9420fD9fC012A21930c803dA7F3f0f91" };

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
  
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, padding: "20px" },
  modalContent: { backgroundColor: "#FFFFFF", borderRadius: "24px", padding: "24px", width: "100%", maxWidth: "380px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", border: "1px solid #FDC500" },
  walletBtnActive: { width: "100%", padding: "16px", borderRadius: "16px", border: "2px solid #FDC500", backgroundColor: "#FFFBEB", fontSize: "16px", fontWeight: "bold", color: "#0F172A", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", transition: "0.2s" },
  walletBtnDisabled: { width: "100%", padding: "16px", borderRadius: "16px", border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", fontSize: "16px", fontWeight: "bold", color: "#94A3B8", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", opacity: 0.8 }
};

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  
  const [tokens, setTokens] = useState({
    zkLTC: { address: "NATIVE", isNative: true },
    USDC: { address: "0x6c18239A767d19dd6d274B94442f09eE6b9b6701", isNative: false },
    DAI: { address: "0x9013443A3E0Dd775152678a76fceDCBase54e1E1710", isNative: false }
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

  // 🦊 METODE KONEKSI MODERAT & COCOK UNTUK SEMUA BROWSER/EXTENSION
  const connectPrimaryWallet = async () => {
    if (!window.ethereum) {
      alert("Sila buka laman ini melalui Mises Browser, MetaMask App, atau browser Web3 yang memiliki extension Rabby/MetaMask!");
      return;
    }
    try {
      // Langkah 1: Minta izin akun secara langsung dari inframerah window.ethereum dasar
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts && accounts.length > 0) {
        // Langkah 2: Baru bungkus objek ke dalam Ethers BrowserProvider setelah akun diizinkan
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const web3Signer = await web3Provider.getSigner();
        
        setProvider(web3Provider);
        setSigner(web3Signer);
        setAccount(accounts[0]);
        setShowWalletModal(false);
      }
    } catch (err) { 
      console.error("Koneksi gagal total:", err);
      alert("Gagal terhubung. Pastikan popup dompet terbuka dan berikan konfirmasi persetujuan.");
    }
  };

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
    } catch (err) { console.error("Balance fetch error"); }
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

  const handleSwap = async () => {
    if (!signer || !amountIn) return alert("Masukkan jumlah!");
    setLoading(true);
    try {
      const parsedIn = ethers.parseUnits(String(amountIn), 18);
      if (tokens[fromSym].isNative) {
        const tx = await signer.sendTransaction({ to: account, value: 0 });
        await tx.wait();
      } else {
        const tokenContract = new ethers.Contract(tokens[fromSym].address, SimpleERC20_ABI, signer);
        await (await tokenContract.approve(CONTRACTS.pool, parsedIn)).wait();
        const poolContract = new ethers.Contract(CONTRACTS.pool, SimpleLiquidityPool_ABI, signer);
        await (await poolContract.swap(tokens[fromSym].address, parsedIn, { gasLimit: 400000 })).wait();
      }
      alert("Swap Berhasil!");
      setTxCount(prev => prev + 1);
      setAmountIn("");
      updateData();
    } catch (err) { console.error(err); alert("Swap Gagal. Pastikan gas fee cukup."); } 
    finally { setLoading(false); }
  };

  const handleMint = async (sym) => {
    if (!signer) return alert("Hubungkan dompet!");
    setLoading(true);
    try {
      const contract = new ethers.Contract(tokens[sym].address, SimpleERC20_ABI, signer);
      await (await contract.mint(account, ethers.parseUnits("10000", 18))).wait();
      alert(`Mint 10,000 ${sym} Berhasil!`);
      setTxCount(prev => prev + 1);
      updateData();
    } catch (err) { console.error(err); alert("Mint Gagal."); }
    setLoading(false);
  };

  const handleAddLiquidity = async () => {
    if (!signer || !amountAInput || !amountBInput) return alert("Isi nominal!");
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
    } catch (err) { console.error(err); alert("Gagal tambah likuiditas."); }
    setLoading(false);
  };

  return (
    <div style={styles.layout}>
      
      {/* 🔮 MODAL CONNECT WALLET */}
      {showWalletModal && (
        <div style={styles.modalOverlay} onClick={() => setShowWalletModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ margin: 0, color: "#0F172A", fontSize: "20px", fontWeight: "900" }}>Pilih Dompet</h3>
              <button onClick={() => setShowWalletModal(false)} style={{ background: "#F1F5F9", border: "none", width: "32px", height: "32px", borderRadius: "50%", fontWeight: "bold", cursor: "pointer", color: "#64748B" }}>✕</button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column" }}>
              <button onClick={connectPrimaryWallet} style={styles.walletBtnActive}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "22px" }}>🦊</span>
                  <span>MetaMask / Rabby</span>
                </div>
                {account ? (
                  <span style={{ backgroundColor: "#D1FAE5", color: "#059669", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: "900" }}>Terkoneksi 🟢</span>
                ) : (
                  <span style={{ color: "#D97706" }}>→</span>
                )}
              </button>

              {["Bitget Wallet", "OKX Wallet", "Trust Wallet"].map(wallet => (
                <div key={wallet} style={styles.walletBtnDisabled}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "20px", opacity: 0.5 }}>💼</span>
                    <span>{wallet}</span>
                  </div>
                  <span style={{ backgroundColor: "#FEF3C7", color: "#D97706", padding: "4px 8px", borderRadius: "8px", fontSize: "10px", fontWeight: "900", letterSpacing: "0.5px" }}>SEGERA HADIR</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 1. HEADER */}
      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FreesiaLogo />
          <div>
            <h1 style={{ fontSize: "20px", margin: 0, fontWeight: "900", color: "#0F172A" }}>Freesia DEX</h1>
            <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "bold" }}>LitVM Testnet</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: "#0F172A", textDecoration: "none", fontSize: "22px", fontWeight: "bold" }}>𝕏</a>
          <button onClick={() => setShowWalletModal(true)} style={{ backgroundColor: "#FDC500", border: "none", padding: "10px 16px", borderRadius: "10px", fontWeight: "bold", color: "#000", cursor: "pointer" }}>
            {account ? `🟢 ${account.substring(0, 6)}...` : "Connect Wallet"}
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
                  <button onClick={() => handleMint(sym)} style={{ backgroundColor: "#FDC500", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Mint 10k</button>
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

      {/* 🌸 FOOTER LOGO FREESIA DENGAN EFEK PULSE ANIMATION */}
      <footer style={styles.footer}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", animation: "pulse 3s infinite ease-in-out" }}>
          <FreesiaLogo />
        </div>
        <p style={{ fontSize: "12px", fontWeight: "bold", color: "#94A3B8", letterSpacing: "1px", margin: 0 }}>
          POWERED BY FREESIA NETWORK
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
