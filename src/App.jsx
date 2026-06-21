import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// 🌸 LOGO FREESIA (Disesuaikan untuk Tema Terang)
const FreesiaLogo = () => (
  <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 50 C50 20, 35 25, 50 10 C65 25, 50 20, 50 50" fill="#FFA6C9" />
    <path d="M50 50 C50 80, 65 75, 50 90 C35 75, 50 80, 50 50" fill="#FFA6C9" />
    <path d="M50 50 C20 50, 25 35, 10 50 C25 65, 20 50, 50 50" fill="#FFA6C9" />
    <path d="M50 50 C80 50, 75 65, 90 50 C75 35, 80 50, 50 50" fill="#FFA6C9" />
    <path d="M50 50 C30 30, 20 45, 22 22 C45 20, 30 30, 50 50" fill="#FFB6D9" />
    <path d="M50 50 C70 70, 80 55, 78 78 C55 80, 70 70, 50 50" fill="#FFB6D9" />
    <path d="M50 50 C70 30, 55 20, 78 22 C80 45, 70 30, 50 50" fill="#FFB6D9" />
    <path d="M50 50 C30 70, 45 80, 22 78 C20 55, 30 70, 50 50" fill="#FFB6D9" />
    {/* Huruf F berwarna Biru Gelap (Navy) agar kontras di tema terang */}
    <path d="M60 25 C52 22, 44 30, 44 42 L44 78 M34 45 L56 45" stroke="#0F172A" strokeWidth="8" strokeLinecap="round" fill="none" />
  </svg>
);

// 🛠 KONFIGURASI SMART CONTRACT LITVM
const CONTRACTS = {
  tokenA: "0x6c18239A767d19dd6d274B94442f09eE6b9b6701",
  tokenB: "0x9013443A3E0Dd775152678a76fceDCBase54e1E1710",
  pool: "0xbDA6416a9420fD9fC012A21930c803dA7F3f0f91",
};

const SimpleERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function mint(address to, uint256 amount) external"
];

const SimpleLiquidityPool_ABI = [
  "function getReserves() view returns (uint256, uint256)",
  "function swap(address fromToken, uint256 amountIn) external returns (uint256)",
  "function addLiquidity(uint256 amountA, uint256 amountB) external returns (uint256)"
];

// 🎨 STYLING (TEMA DASHBOARD TERANG SEPERTI GAMBAR 2)
const styles = {
  layout: { backgroundColor: "#F9F8F6", color: "#0F172A", minHeight: "100vh", fontFamily: "'Inter', sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", backgroundColor: "#FFFFFF", borderBottom: "1px solid #E2E8F0" },
  navContainer: { display: "flex", gap: "10px", padding: "20px 24px", overflowX: "auto" },
  navTab: (isActive) => ({ padding: "10px 20px", borderRadius: "12px", border: "none", fontWeight: "bold", cursor: "pointer", backgroundColor: isActive ? "#FDC500" : "#F1F5F9", color: isActive ? "#000" : "#64748B", transition: "0.2s" }),
  mainContent: { padding: "0 24px 40px 24px", maxWidth: "1000px", margin: "0 auto" },
  card: { backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "24px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px rgba(0,0,0,0.02)", marginBottom: "20px" },
  button: { backgroundColor: "#FDC500", color: "#000", border: "none", padding: "16px", borderRadius: "12px", fontWeight: "900", cursor: "pointer", width: "100%", fontSize: "16px", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" },
  inputBox: { backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", padding: "16px", borderRadius: "12px", marginBottom: "16px" },
  input: { width: "100%", border: "none", backgroundColor: "transparent", fontSize: "24px", fontWeight: "bold", color: "#0F172A", outline: "none", marginTop: "8px" }
};

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  
  // States untuk DEX
  const [balances, setBalances] = useState({ USDC: "0.00", DAI: "0.00", zkLTC: "0.00" });
  const [amountIn, setAmountIn] = useState("");
  const [amountAInput, setAmountAInput] = useState("");
  const [amountBInput, setAmountBInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [txCount, setTxCount] = useState(0);

  // 🦊 KONEKSI DOMPET
  const connectWallet = async () => {
    if (!window.ethereum) return alert("Gunakan MetaMask/Mises Browser!");
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      const web3Signer = await web3Provider.getSigner();
      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(accounts[0]);
      updateData(web3Provider, accounts[0]);
    } catch (err) { console.error(err); }
  };

  // 📊 BACA DATA SALDO
  const updateData = async (prov = provider, acc = account) => {
    if (!prov || !acc) return;
    try {
      const nativeBal = await prov.getBalance(acc);
      const contractA = new ethers.Contract(CONTRACTS.tokenA, SimpleERC20_ABI, prov);
      const contractB = new ethers.Contract(CONTRACTS.tokenB, SimpleERC20_ABI, prov);
      
      const balA = await contractA.balanceOf(acc);
      const balB = await contractB.balanceOf(acc);
      
      setBalances({
        USDC: parseFloat(ethers.formatUnits(balA, 18)).toFixed(2),
        DAI: parseFloat(ethers.formatUnits(balB, 18)).toFixed(2),
        zkLTC: parseFloat(ethers.formatEther(nativeBal)).toFixed(4)
      });
    } catch (err) { console.error("Update data error:", err); }
  };

  // 💱 FUNGSI SWAP Ethers v6
  const handleSwap = async () => {
    if (!signer || !amountIn) return alert("Masukkan jumlah!");
    setLoading(true);
    try {
      const parsedIn = ethers.parseUnits(String(amountIn), 18);
      const tokenContract = new ethers.Contract(CONTRACTS.tokenA, SimpleERC20_ABI, signer);
      
      // Approve
      const tx1 = await tokenContract.approve(CONTRACTS.pool, parsedIn);
      await tx1.wait();
      
      // Swap
      const poolContract = new ethers.Contract(CONTRACTS.pool, SimpleLiquidityPool_ABI, signer);
      const tx2 = await poolContract.swap(CONTRACTS.tokenA, parsedIn, { gasLimit: 400000 });
      await tx2.wait();
      
      alert("Swap Berhasil!");
      setTxCount(prev => prev + 1);
      setAmountIn("");
      updateData();
    } catch (err) {
      console.error(err);
      alert("Transaksi gagal. Pastikan memiliki gas fee zkLTC.");
    } finally {
      setLoading(false);
    }
  };

  // 🚰 FUNGSI MINT FAUCET
  const handleMint = async (tokenAddress) => {
    if (!signer) return alert("Hubungkan dompet!");
    setLoading(true);
    try {
      const contract = new ethers.Contract(tokenAddress, SimpleERC20_ABI, signer);
      const tx = await contract.mint(account, ethers.parseUnits("10000", 18));
      await tx.wait();
      alert("Mint 10,000 Token Berhasil!");
      setTxCount(prev => prev + 1);
      updateData();
    } catch (err) { console.error(err); alert("Mint Gagal."); }
    setLoading(false);
  };

  return (
    <div style={styles.layout}>
      {/* 1. HEADER MIRIP REFERENSI */}
      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FreesiaLogo />
          <div>
            <h1 style={{ fontSize: "20px", margin: 0, fontWeight: "900", color: "#0F172A" }}>Freesia DEX</h1>
            <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "bold" }}>LITVM TESTNET</span>
          </div>
        </div>
        <button onClick={connectWallet} style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", padding: "10px 16px", borderRadius: "10px", fontWeight: "bold", color: "#0F172A", cursor: "pointer" }}>
          {account ? `🟢 ${account.substring(0, 6)}...${account.substring(account.length - 4)}` : "Connect Wallet"}
        </button>
      </header>

      {/* 2. MENU NAVIGASI */}
      <div style={styles.navContainer}>
        {["dashboard", "swap", "mint", "pool"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={styles.navTab(activeTab === tab)}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* 3. KONTEN UTAMA */}
      <main style={styles.mainContent}>
        
        {/* --- TAB DASHBOARD (Seperti Gambar 2) --- */}
        {activeTab === "dashboard" && (
          <div>
            <h2 style={{ fontSize: "14px", color: "#64748B", marginTop: 0 }}>GLOBAL NETWORK STATS</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px", marginBottom: "32px" }}>
              <div style={styles.card}>
                <span style={{ color: "#64748B", fontSize: "12px", fontWeight: "bold" }}>GLOBAL SWAPPED</span>
                <h2 style={{ margin: "8px 0 0 0", fontSize: "28px" }}>$45,210</h2>
                <span style={{ color: "#10B981", fontSize: "12px" }}>↑ Active Testnet</span>
              </div>
              <div style={styles.card}>
                <span style={{ color: "#64748B", fontSize: "12px", fontWeight: "bold" }}>YOUR ACTIVITY (TXNS)</span>
                <h2 style={{ margin: "8px 0 0 0", fontSize: "28px" }}>{txCount}</h2>
                <span style={{ color: "#F59E0B", fontSize: "12px" }}>Points: {txCount * 15} XP</span>
              </div>
            </div>

            <h2 style={{ fontSize: "14px", color: "#64748B" }}>LEADERBOARD & RECENT</h2>
            <div style={{ ...styles.card, padding: "0" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between" }}>
                <span>🏆 0x71C...392b</span><strong>240 XP</strong>
              </div>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between" }}>
                <span>🥈 0x3fA...110e</span><strong>180 XP</strong>
              </div>
              <div style={{ padding: "16px 24px", backgroundColor: "#FFFBEB", display: "flex", justifyContent: "space-between", borderBottomLeftRadius: "16px", borderBottomRightRadius: "16px" }}>
                <span>👉 Anda ({account ? account.substring(0,6) : "Anon"})</span><strong style={{ color: "#D97706" }}>{txCount * 15} XP</strong>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB SWAP (Fungsional) --- */}
        {activeTab === "swap" && (
          <div style={{ maxWidth: "480px", margin: "0 auto" }}>
            <div style={styles.card}>
              <div style={styles.inputBox}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B", fontSize: "13px" }}>
                  <span>Anda Membayar (USDC)</span>
                  <span>Saldo: {balances.USDC}</span>
                </div>
                <input style={styles.input} type="number" placeholder="0.00" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} />
              </div>

              <div style={{ display: "flex", justifyContent: "center", margin: "-28px 0 12px 0", position: "relative", zIndex: 2 }}>
                <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", padding: "8px", borderRadius: "50%" }}>⇅</div>
              </div>

              <div style={styles.inputBox}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B", fontSize: "13px" }}>
                  <span>Anda Menerima (DAI - Estimasi)</span>
                  <span>Saldo: {balances.DAI}</span>
                </div>
                <input style={styles.input} type="number" placeholder="0.00" value={amountIn ? (amountIn * 0.99).toFixed(2) : ""} readOnly />
              </div>

              <button style={styles.button} onClick={handleSwap} disabled={loading || !amountIn}>
                {loading ? (
                  <><img src="https://cdn-icons-png.flaticon.com/512/5962/5962463.png" alt="minion" style={{ width: "24px", animation: "spin 2s linear infinite" }} /> Memproses...</>
                ) : "Tukar Token"}
              </button>
            </div>
          </div>
        )}

        {/* --- TAB MINT FAUCET --- */}
        {activeTab === "mint" && (
          <div style={{ maxWidth: "480px", margin: "0 auto" }}>
            <div style={styles.card}>
              <h3 style={{ marginTop: 0 }}>Klaim Faucet Testnet</h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", border: "1px solid #E2E8F0", borderRadius: "12px", marginBottom: "12px" }}>
                <div><strong>USDC</strong><div style={{ fontSize: "12px", color: "#64748B" }}>Saldo: {balances.USDC}</div></div>
                <button onClick={() => handleMint(CONTRACTS.tokenA)} style={{ backgroundColor: "#FDC500", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "bold" }}>Mint 10k</button>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", border: "1px solid #E2E8F0", borderRadius: "12px" }}>
                <div><strong>DAI</strong><div style={{ fontSize: "12px", color: "#64748B" }}>Saldo: {balances.DAI}</div></div>
                <button onClick={() => handleMint(CONTRACTS.tokenB)} style={{ backgroundColor: "#FDC500", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "bold" }}>Mint 10k</button>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB POOL --- */}
        {activeTab === "pool" && (
           <div style={{ maxWidth: "480px", margin: "0 auto" }}>
            <div style={styles.card}>
              <h3 style={{ marginTop: 0 }}>Suntik Likuiditas (Pool)</h3>
              <p style={{ fontSize: "13px", color: "#64748B" }}>Fitur penambahan likuiditas sedang dioptimalkan. Silakan gunakan tab Swap untuk menguji transaksi jaringan.</p>
              <button onClick={() => setActiveTab("swap")} style={styles.button}>Kembali ke Swap</button>
            </div>
           </div>
        )}

      </main>
      
      {/* Animasi Global untuk Minion */}
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
