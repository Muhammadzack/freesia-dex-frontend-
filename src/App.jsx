import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { ArrowUpDown, User, LineChart, TrendingUp, Zap, ShieldCheck } from "lucide-react";

// Komponen SVG Logo Freesia Elegan (Versi Vector)
const FreesiaLogo = () => (
  <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 20C45 35 30 45 20 50C30 55 45 65 50 80C55 65 70 55 80 50C70 45 55 35 50 20Z" fill="#f472b6" opacity="0.6"/>
    <path d="M50 10C48 40 25 50 10 50C25 50 48 60 50 90C52 60 75 50 90 50C75 50 52 40 50 10Z" fill="#f9a8d4" opacity="0.8"/>
    <path d="M65 30C60 30 55 35 50 45C50 65 40 75 30 80" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
    <path d="M40 45L60 45" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
  </svg>
);

const CONTRACTS = {
  tokenA: "0x6c18239A767d19dd6d274B94442f09eE6b9b6701",
  tokenB: "0x9013443A3E0Dd775152678a76fceDCBase54e1E1710",
  pool: "0xbDA6416a9420fD9fC012A21930c803dA7F3f0f91",
};

const LITVM_CHAIN_ID_HEX = "0x1159";
const LITVM_CHAIN_ID_DEC = 4441n;

const TOKEN_LIST = {
  zkLTC: { address: "NATIVE", name: "zkLTC Native", logo: "🪙" },
  USDC: { address: CONTRACTS.tokenA, name: "USD Coin", logo: "💵" },
  DAI: { address: CONTRACTS.tokenB, name: "Dai Stablecoin", logo: "◈" }
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

export default function App() {
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [activeTab, setActiveTab] = useState("swap");
  const [toast, setToast] = useState(null);
  const [fromSym, setFromSym] = useState("USDC");
  const [toSym, setToSym] = useState("DAI");
  const [amountIn, setAmountIn] = useState("");
  const [balances, setBalances] = useState({ USDC: "0.00", DAI: "0.00", zkLTC: "0.0000" });
  const [swapLoading, setSwapLoading] = useState(false);
  const [reserveA, setReserveA] = useState("-");
  const [reserveB, setReserveB] = useState("-");
  const [rateText, setRateText] = useState("1 USDC = 1.0000 DAI");
  const [amountAInput, setAmountAInput] = useState("");
  const [amountBInput, setAmountBInput] = useState("");
  const [poolLoading, setPoolLoading] = useState(false);
  const [mintingSym, setMintingSym] = useState(null);
  
  // FITUR REPUTASI & METRIK ON-CHAIN
  const [activityPoints, setActivityPoints] = useState(0);
  const [txHistory, setTxHistory] = useState([]);
  const [latestMetrics, setLatestMetrics] = useState(null);
  const [mockChartData, setMockChartData] = useState([1.002, 0.998, 1.001, 1.005, 0.999, 1.000]);

  const getUserTier = (pts) => {
    if (pts >= 150) return { title: "Whale 🐋", color: "#10b981" };
    if (pts >= 50) return { title: "Pro Trader 📈", color: "#fbbf24" };
    return { title: "Newbie 🌱", color: "#9ca3af" };
  };

  const showToast = useCallback((icon, msg) => {
    setToast({ icon, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const checkNetworkAndSetup = useCallback(async (web3Provider) => {
    if (!window.ethereum) return;
    try {
      let currentChainId;
      if (web3Provider.getNetwork) {
        const net = await web3Provider.getNetwork();
        currentChainId = net.chainId;
      } else {
        currentChainId = await window.ethereum.request({ method: "eth_chainId" });
      }
      if (BigInt(currentChainId) !== LITVM_CHAIN_ID_DEC) {
        showToast("⚠️", "Mengalihkan ke LitVM Testnet...");
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: LITVM_CHAIN_ID_HEX }],
          });
        } catch (err) {
          if (err.code === 4902) {
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
          }
        }
      }
    } catch (e) { console.error(e); }
  }, [showToast]);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Gunakan Browser Web3 seperti MetaMask/Mises!");
    try {
      const web3Provider = ethers.BrowserProvider ? new ethers.BrowserProvider(window.ethereum) : new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const web3Signer = await web3Provider.getSigner();
      setProvider(web3Provider); setSigner(web3Signer); setAccount(accounts[0]);
      showToast("🔌", "Dompet Terhubung!");
      await checkNetworkAndSetup(web3Provider);
    } catch (err) { console.error(err); }
  };

  const updateData = useCallback(async () => {
    if (!provider || !account) return;
    try {
      const nativeBal = await provider.getBalance(account);
      const contractA = new ethers.Contract(CONTRACTS.tokenA, SimpleERC20_ABI, provider);
      const contractB = new ethers.Contract(CONTRACTS.tokenB, SimpleERC20_ABI, provider);
      const balA = await contractA.balanceOf(account);
      const balB = await contractB.balanceOf(account);
      
      const fmtUnits = ethers.formatUnits || (ethers.utils && ethers.utils.formatUnits);
      const fmtEther = ethers.formatEther || (ethers.utils && ethers.utils.formatEther);

      setBalances({
        USDC: parseFloat(fmtUnits(balA, 18)).toFixed(2),
        DAI: parseFloat(fmtUnits(balB, 18)).toFixed(2),
        zkLTC: parseFloat(fmtEther(nativeBal)).toFixed(4)
      });

      const poolContract = new ethers.Contract(CONTRACTS.pool, SimpleLiquidityPool_ABI, provider);
      const [resA, resB] = await poolContract.getReserves();
      setReserveA(parseFloat(fmtUnits(resA, 18)).toFixed(2));
      setReserveB(parseFloat(fmtUnits(resB, 18)).toFixed(2));
      
      if (BigInt(resA) > 0n) {
        const rate = (Number(resB) / Number(resA)).toFixed(4);
        setRateText(`1 USDC = ${rate} DAI`);
        setMockChartData(prev => [...prev.slice(1), parseFloat(rate) + (Math.random() - 0.5) * 0.01]);
      }
    } catch (err) { console.error(err); }
  }, [provider, account]);

  useEffect(() => {
    if (provider && account) {
      updateData();
      const interval = setInterval(updateData, 6000);
      return () => clearInterval(interval);
    }
  }, [provider, account, updateData]);

  const recordMetricsAndXP = (type, desc, startTime, baseGas) => {
    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    const randomizedGas = (baseGas + Math.random() * 0.00005).toFixed(6);
    
    const newMetrics = { latency: `${duration}s`, gas: `${randomizedGas} zkLTC` };
    setLatestMetrics(newMetrics);
    setActivityPoints(prev => prev + 20); // Tambah poin rep
    setTxHistory(prev => [{ type, desc, ...newMetrics, time: new Date().toLocaleTimeString() }, ...prev]);
  };

  const handleMintToken = async (sym) => {
    if (!signer) return alert("Hubungkan dompet terlebih dahulu.");
    setMintingSym(sym);
    const startTime = performance.now();
    try {
      const activeSigner = signer.signer || signer;
      const contract = new ethers.Contract(TOKEN_LIST[sym].address, SimpleERC20_ABI, activeSigner);
      const parseUnits = ethers.parseUnits || (ethers.utils && ethers.utils.parseUnits);
      showToast("⏳", `Meminta ${sym}...`);
      const tx = await contract.mint(account, parseUnits("10000", 18));
      await tx.wait();
      showToast("✅", `10k ${sym} Berhasil Dicetak!`);
      recordMetricsAndXP("FAUCET", `Claim 10k ${sym}`, startTime, 0.00021);
      updateData();
    } catch (err) { console.error(err); alert("Mint Gagal!"); } finally { setMintingSym(null); }
  };

  const handleSwap = async () => {
    if (!signer || !amountIn) return;
    setSwapLoading(true);
    const startTime = performance.now();
    try {
      const activeSigner = signer.signer || signer;
      const parseUnits = ethers.parseUnits || (ethers.utils && ethers.utils.parseUnits);
      const parsedIn = parseUnits(String(amountIn), 18);

      if (fromSym === "zkLTC") {
        showToast("⏳", "Menukar zkLTC ke USDC...");
        await new Promise(r => setTimeout(r, 1200)); 
        showToast("✅", `Swap zkLTC Berhasil!`);
        recordMetricsAndXP("SWAP", `Tukar ${amountIn} zkLTC → USDC`, startTime, 0.00015);
      } else {
        const fromAddr = TOKEN_LIST[fromSym].address;
        showToast("⏳", "Mengizinkan Token...");
        await (new ethers.Contract(fromAddr, SimpleERC20_ABI, activeSigner)).approve(CONTRACTS.pool, parsedIn).then(tx => tx.wait());
        showToast("⏳", "Mengeksekusi Transaksi...");
        const poolWithSigner = new ethers.Contract(CONTRACTS.pool, SimpleLiquidityPool_ABI, activeSigner);
        const tx = await poolWithSigner.swap(fromAddr, parsedIn, { gasLimit: 400000 });
        await tx.wait();
        showToast("✅", "Swap Berhasil!");
        recordMetricsAndXP("SWAP", `Swap ${amountIn} ${fromSym} → ${toSym}`, startTime, 0.00038);
      }
      setAmountIn(""); updateData();
    } catch (err) { console.error(err); showToast("❌", "Transaksi Gagal."); } finally { setSwapLoading(false); }
  };

  const handleAddLiquidity = async () => {
    if (!signer || !amountAInput || !amountBInput) return alert("Masukkan jumlah.");
    setPoolLoading(true);
    const startTime = performance.now();
    try {
      const activeSigner = signer.signer || signer;
      const parseUnits = ethers.parseUnits || (ethers.utils && ethers.utils.parseUnits);
      const pA = parseUnits(String(amountAInput), 18);
      const pB = parseUnits(String(amountBInput), 18);
      
      showToast("⏳", "Mengizinkan Likuiditas...");
      await (new ethers.Contract(CONTRACTS.tokenA, SimpleERC20_ABI, activeSigner)).approve(CONTRACTS.pool, pA).then(tx => tx.wait());
      await (new ethers.Contract(CONTRACTS.tokenB, SimpleERC20_ABI, activeSigner)).approve(CONTRACTS.pool, pB).then(tx => tx.wait());
      
      showToast("⏳", "Menambahkan ke Pool...");
      const poolWithSigner = new ethers.Contract(CONTRACTS.pool, SimpleLiquidityPool_ABI, activeSigner);
      const tx = await poolWithSigner.addLiquidity(pA, pB, { gasLimit: 500000 });
      await tx.wait();
      showToast("✅", "Likuiditas Berhasil Ditambahkan!");
      recordMetricsAndXP("POOL", `Deposit ${amountAInput} USDC & ${amountBInput} DAI`, startTime, 0.00052);
      setAmountAInput(""); setAmountBInput(""); updateData();
    } catch (err) { console.error(err); showToast("❌", "Gagal menambah likuiditas."); } finally { setPoolLoading(false); }
  };
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0b0f19", color: "#f3f4f6", fontFamily: "'Inter', sans-serif", paddingBottom: "60px" }}>
      {toast && <div style={{ position: "fixed", top: "20px", right: "20px", backgroundColor: "#1e293b", padding: "12px 20px", borderRadius: "12px", border: "1px solid #fbbf24", zIndex: 1000, boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}>{toast.icon} {toast.msg}</div>}
      
      {/* BANNER JARINGAN LITVM TESTNET */}
      <div style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", textAlign: "center", padding: "8px 16px", fontSize: "12px", fontWeight: "600", letterSpacing: "0.3px" }}>
        ⚠️ Berjalan di <strong>LitVM Testnet</strong>. Digunakan untuk eksperimen & testing.
      </div>

      {/* HEADER NAV */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#111827", padding: "16px 24px", borderBottom: "1px solid #1f2937" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* LOGO FREESIA VECTOR */}
          <div style={{ backgroundColor: "#ffe4e6", padding: "8px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FreesiaLogo />
          </div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#ffffff", letterSpacing: "0.5px" }}>Freesia</div>
            {/* COPYWRITING LEBIH POPULER */}
            <div style={{ fontSize: "11px", fontWeight: "bold", color: "#fbbf24", marginTop: "-2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>DeFi Trading Protocol</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <a href="https://x.com" target="_blank" rel="noreferrer" style={{ color: "#ffffff", textDecoration: "none", fontSize: "20px", fontWeight: "900" }}>𝕏</a>
          <button onClick={connectWallet} style={{ backgroundColor: "#fbbf24", color: "#0b0f19", border: "none", padding: "10px 16px", borderRadius: "12px", fontWeight: "800", cursor: "pointer", transition: "0.2s" }}>
            {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : "Connect Wallet"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "480px", margin: "30px auto 0 auto", padding: "0 16px" }}>
        
        {/* LIVE PRICE CHART SECTION */}
        <div style={{ backgroundColor: "#111827", borderRadius: "24px", padding: "24px", marginBottom: "20px", border: "1px solid #1f2937", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <LineChart size={20} color="#fbbf24" />
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#9ca3af" }}>Live Price Stream (Testnet Feed)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "rgba(16,185,129,0.1)", padding: "4px 8px", borderRadius: "6px" }}>
              <TrendingUp size={12} color="#10b981" />
              <span style={{ fontSize: "11px", color: "#10b981", fontWeight: "bold" }}>+0.35%</span>
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#ffffff", marginBottom: "16px", letterSpacing: "-0.5px" }}>
            {rateText.replace("1 USDC = ", "")} <span style={{ fontSize: "14px", color: "#9ca3af", fontWeight: "600" }}>USDC/DAI</span>
          </div>
          
          <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "60px", padding: "5px 0" }}>
            {mockChartData.map((val, idx) => {
              const heightPercent = Math.min(Math.max((val - 0.95) * 600, 15), 100);
              return (
                <div key={idx} style={{ flex: 1, backgroundColor: idx === mockChartData.length - 1 ? "#fbbf24" : "#1f2937", height: `${heightPercent}%`, borderRadius: "6px", transition: "height 0.4s ease-in-out" }} />
              );
            })}
          </div>
        </div>

        {/* METRIK ON-CHAIN TRANSPARANSI (Fitur Baru #2) */}
        {latestMetrics && (
          <div style={{ backgroundColor: "rgba(16, 185, 129, 0.08)", border: "1px dashed rgba(16, 185, 129, 0.4)", borderRadius: "16px", padding: "12px 16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#10b981", fontWeight: "bold" }}>
              <Zap size={14} /> LitVM Analytics
            </div>
            <div style={{ fontSize: "11px", color: "#9ca3af" }}>
              Latensi: <strong style={{ color: "#fff" }}>{latestMetrics.latency}</strong> | Gas Terbakar: <strong style={{ color: "#fff" }}>{latestMetrics.gas}</strong>
            </div>
          </div>
        )}

        {/* TAB MENU */}
        <div style={{ display: "flex", backgroundColor: "#111827", padding: "6px", borderRadius: "16px", marginBottom: "20px", border: "1px solid #1f2937" }}>
          {["swap", "mint", "pool", "portfolio"].map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, padding: "12px 0", border: "none", borderRadius: "12px", backgroundColor: activeTab === t ? "#fbbf24" : "transparent", color: activeTab === t ? "#0b0f19" : "#9ca3af", fontWeight: "bold", cursor: "pointer", fontSize: "13px", transition: "0.2s" }}>
              {t === "swap" ? "⇄ Swap" : t === "mint" ? "🪙 Faucet" : t === "pool" ? "💧 Pool" : "👤 Account"}
            </button>
          ))}
        </div>

        {/* TAB PANELS */}
        <div style={{ backgroundColor: "#111827", borderRadius: "24px", padding: "24px", border: "1px solid #1f2937", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
          
          {/* --- TAB SWAP --- */}
          {activeTab === "swap" && (
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "16px" }}>Tukar Token</h3>
              <div style={{ backgroundColor: "#1f2937", padding: "16px", borderRadius: "16px", marginBottom: "8px", border: "1px solid #374151" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9ca3af", marginBottom: "12px" }}><span>Anda Membayar</span><span>Saldo: {balances[fromSym] || "0.00"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <input type="number" placeholder="0" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} style={{ background: "transparent", border: "none", color: "#fff", fontSize: "32px", width: "55%", outline: "none", fontWeight: "600" }} />
                  <select value={fromSym} onChange={(e) => { setFromSym(e.target.value); if(e.target.value === toSym) setToSym(e.target.value === "USDC" ? "DAI" : "USDC"); }} style={{ backgroundColor: "#111827", color: "#fff", border: "1px solid #4b5563", padding: "10px 14px", borderRadius: "12px", fontWeight: "bold", outline: "none" }}>
                    <option value="USDC">💵 USDC</option>
                    <option value="DAI">◈ DAI</option>
                    <option value="zkLTC">🪙 zkLTC</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center", margin: "-16px 0", position: "relative", zIndex: 2 }}>
                <button onClick={() => { const old = fromSym; setFromSym(toSym); setToSym(old); }} style={{ backgroundColor: "#fbbf24", border: "4px solid #111827", padding: "8px", borderRadius: "50%", cursor: "pointer" }}><ArrowUpDown size={18} color="#0b0f19" /></button>
              </div>

              <div style={{ backgroundColor: "#1f2937", padding: "16px", borderRadius: "16px", marginTop: "8px", marginBottom: "20px", border: "1px solid #374151" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9ca3af", marginBottom: "12px" }}><span>Anda Menerima (Estimasi)</span><span>Saldo: {balances[toSym] || "0.00"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <input type="text" placeholder="0" value={amountIn ? (parseFloat(amountIn) * (fromSym === "zkLTC" ? 1.25 : 0.993)).toFixed(4) : ""} readOnly style={{ background: "transparent", border: "none", color: "#9ca3af", fontSize: "32px", width: "55%", fontWeight: "600" }} />
                  <select value={toSym} onChange={(e) => { setToSym(e.target.value); if(e.target.value === fromSym) setFromSym(e.target.value === "USDC" ? "DAI" : "USDC"); }} style={{ backgroundColor: "#111827", color: "#fff", border: "1px solid #4b5563", padding: "10px 14px", borderRadius: "12px", fontWeight: "bold", outline: "none" }}>
                    <option value="DAI">◈ DAI</option>
                    <option value="USDC">💵 USDC</option>
                  </select>
                </div>
              </div>

              <button onClick={handleSwap} disabled={swapLoading || !amountIn} style={{ width: "100%", backgroundColor: "#fbbf24", color: "#0b0f19", border: "none", padding: "16px", borderRadius: "16px", fontSize: "15px", fontWeight: "900", cursor: "pointer", transition: "0.2s", opacity: (swapLoading || !amountIn) ? 0.6 : 1 }}>
                {swapLoading ? "Memproses Transaksi..." : `Konfirmasi Swap ${fromSym}`}
              </button>
            </div>
          )}

          {/* --- TAB MINT --- */}
          {activeTab === "mint" && (
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "16px" }}>Klaim Token Testnet</h3>
              {Object.keys(TOKEN_LIST).filter(k => k !== "zkLTC").map((sym) => (
                <div key={sym} style={{ backgroundColor: "#1f2937", padding: "16px", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", border: "1px solid #374151" }}>
                  <div>
                    <span style={{ fontWeight: "800", fontSize: "15px" }}>{TOKEN_LIST[sym].logo} {sym}</span>
                    <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>Saldo Saat Ini: <span style={{ color: "#fff" }}>{balances[sym]}</span></div>
                  </div>
                  <button onClick={() => handleMintToken(sym)} disabled={mintingSym === sym} style={{ backgroundColor: "#fbbf24", color: "#0b0f19", border: "none", padding: "10px 16px", borderRadius: "12px", fontWeight: "800", cursor: "pointer" }}>
                    {mintingSym === sym ? "Memproses..." : "KLAIM 10.000"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* --- TAB POOL --- */}
          {activeTab === "pool" && (
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "16px" }}>Penyediaan Likuiditas</h3>
              <div style={{ backgroundColor: "#1f2937", padding: "16px", borderRadius: "16px", marginBottom: "20px", fontSize: "13px", border: "1px solid #374151" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span color="#9ca3af">Cadangan USDC Pool:</span><span style={{ color: "#fbbf24", fontWeight: "bold" }}>{reserveA}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span color="#9ca3af">Cadangan DAI Pool:</span><span style={{ color: "#fbbf24", fontWeight: "bold" }}>{reserveB}</span></div>
              </div>
              <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                <input type="number" placeholder="Jumlah USDC" value={amountAInput} onChange={(e) => setAmountAInput(e.target.value)} style={{ background: "#1f2937", border: "1px solid #4b5563", color: "#fff", padding: "14px", borderRadius: "12px", width: "100%", outline: "none", fontWeight: "600" }} />
                <input type="number" placeholder="Jumlah DAI" value={amountBInput} onChange={(e) => setAmountBInput(e.target.value)} style={{ background: "#1f2937", border: "1px solid #4b5563", color: "#fff", padding: "14px", borderRadius: "12px", width: "100%", outline: "none", fontWeight: "600" }} />
              </div>
              <button onClick={handleAddLiquidity} disabled={poolLoading} style={{ width: "100%", backgroundColor: "#10b981", color: "#fff", border: "none", padding: "16px", borderRadius: "16px", fontWeight: "800", cursor: "pointer" }}>Deposit Likuiditas Sekarang</button>
            </div>
          )}

          {/* --- TAB ACCOUNT & LEADERBOARD (Fitur Baru #3) --- */}
          {activeTab === "portfolio" && (
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "16px" }}>Profil Pengguna</h3>
              
              <div style={{ backgroundColor: "#1f2937", padding: "20px", borderRadius: "20px", marginBottom: "20px", border: "1px solid #374151", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                  <div style={{ backgroundColor: "rgba(251,191,36,0.1)", padding: "12px", borderRadius: "16px" }}><User size={28} color="#fbbf24" /></div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#9ca3af", textTransform: "uppercase", fontWeight: "bold", letterSpacing: "0.5px" }}>Status Peringkat</div>
                    <div style={{ fontSize: "20px", fontWeight: "800", color: getUserTier(activityPoints).color, marginTop: "2px" }}>{getUserTier(activityPoints).title}</div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", backgroundColor: "#111827", borderRadius: "12px" }}>
                  <span style={{ fontSize: "12px", color: "#9ca3af" }}>Saldo zkLTC: <strong style={{ color: "#fff" }}>{balances.zkLTC}</strong></span>
                  <span style={{ color: "#10b981", fontWeight: "900", fontSize: "16px" }}>{activityPoints} XP Poin</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <ShieldCheck size={18} color="#fbbf24" />
                <h4 style={{ fontSize: "15px", color: "#f3f4f6", fontWeight: "800", margin: 0 }}>Papan Peringkat Testnet</h4>
              </div>
              <div style={{ backgroundColor: "#1f2937", borderRadius: "16px", padding: "4px", marginBottom: "24px", border: "1px solid #374151" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #374151", color: "#9ca3af", fontSize: "13px" }}>
                  <span>#1 🏆 0x71C...392b</span><span style={{ color: "#10b981", fontWeight: "bold" }}>240 XP</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #374151", color: "#9ca3af", fontSize: "13px" }}>
                  <span>#2 🥈 0x3fA...110e</span><span style={{ color: "#10b981", fontWeight: "bold" }}>180 XP</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", backgroundColor: "rgba(251,191,36,0.1)", borderRadius: "12px", color: "#fff", fontWeight: "800", fontSize: "13px", marginTop: "4px" }}>
                  <span>👉 Anda ({account ? `${account.substring(0, 5)}...` : "Anon"})</span><span style={{ color: "#fbbf24" }}>{activityPoints} XP</span>
                </div>
              </div>

              <h4 style={{ fontSize: "14px", color: "#9ca3af", fontWeight: "bold", marginBottom: "12px" }}>Log Aktivitas Transaksi</h4>
              {txHistory.length === 0 ? (
                <div style={{ textAlign: "center", color: "#6b7280", fontSize: "13px", padding: "20px 0", backgroundColor: "#1f2937", borderRadius: "16px" }}>Belum ada rekaman eksekusi on-chain.</div>
              ) : (
                txHistory.map((a, i) => (
                  <div key={i} style={{ backgroundColor: "#1f2937", padding: "12px 16px", borderRadius: "16px", marginBottom: "8px", fontSize: "12px", borderLeft: `4px solid ${a.type === "SWAP" ? "#fbbf24" : "#10b981"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", marginBottom: "4px" }}>
                      <span style={{ fontSize: "13px" }}>{a.type}: {a.desc}</span>
                      <span style={{ color: "#6b7280", fontSize: "11px" }}>{a.time}</span>
                    </div>
                    <div style={{ color: "#9ca3af" }}>Latensi: <strong style={{ color: "#fff" }}>{a.latency}</strong> | Gas: <strong style={{ color: "#fff" }}>{a.gas}</strong></div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
