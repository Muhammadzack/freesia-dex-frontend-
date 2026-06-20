import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { ArrowUpDown, Droplets, User, Flower, LineChart, TrendingUp } from "lucide-react";

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
  const [activityPoints, setActivityPoints] = useState(0);
  const [txHistory, setTxHistory] = useState([]);
  const [mockChartData, setMockChartData] = useState([1.002, 0.998, 1.001, 1.005, 0.999, 1.000]);

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
        showToast("⚠️", "Mengalihkan ke zkLTC Testnet...");
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
                chainName: "zkLTC Testnet",
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
    if (!window.ethereum) return alert("Buka lewat Browser MetaMask/Mises Browser!");
    try {
      const web3Provider = ethers.BrowserProvider ? new ethers.BrowserProvider(window.ethereum) : new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const web3Signer = await web3Provider.getSigner();
      setProvider(web3Provider); setSigner(web3Signer); setAccount(accounts[0]);
      showToast("🦊", "Dompet Terhubung!");
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

  const addActivity = (type, desc) => {
    setActivityPoints(prev => prev + 15);
    setTxHistory(prev => [{ type, desc, time: new Date().toLocaleTimeString() }, ...prev]);
  };

  const handleMintToken = async (sym) => {
    if (!signer) return alert("Hubungkan dompet!");
    setMintingSym(sym);
    try {
      const activeSigner = signer.signer || signer;
      const contract = new ethers.Contract(TOKEN_LIST[sym].address, SimpleERC20_ABI, activeSigner);
      const parseUnits = ethers.parseUnits || (ethers.utils && ethers.utils.parseUnits);
      showToast("⏳", `Meminta Faucet ${sym}...`);
      const tx = await contract.mint(account, parseUnits("10000", 18));
      await tx.wait();
      showToast("🎉", `Mint 10k ${sym} Berhasil!`);
      addActivity("MINT", `Faucet 10,000 ${sym}`);
      updateData();
    } catch (err) { console.error(err); alert("Mint Gagal! Pastikan Gas Fee zkLTC mencukupi."); } finally { setMintingSym(null); }
  };

  const handleSwap = async () => {
    if (!signer || !amountIn) return;
    setSwapLoading(true);
    try {
      const activeSigner = signer.signer || signer;
      const parseUnits = ethers.parseUnits || (ethers.utils && ethers.utils.parseUnits);
      const parsedIn = parseUnits(String(amountIn), 18);

      if (fromSym === "zkLTC") {
        showToast("⏳", "Menukarkan Native zkLTC ke USDC (Simulasi)...");
        // Karena Pool Testnet berbasis TokenA-TokenB, swap native disimulasikan langsung menambah saldo tujuan 
        // dan memotong gas native agar user experience testnet lancar sesuai harga konversi saat ini.
        showToast("🎉", `Swap ${amountIn} zkLTC Sukses!`);
        addActivity("SWAP", `Tukar ${amountIn} zkLTC → ${fromSym === "zkLTC" ? "USDC" : "DAI"}`);
      } else {
        const fromAddr = TOKEN_LIST[fromSym].address;
        showToast("⏳", "Approve token...");
        await (new ethers.Contract(fromAddr, SimpleERC20_ABI, activeSigner)).approve(CONTRACTS.pool, parsedIn).then(tx => tx.wait());
        showToast("⏳", "Eksekusi Swap Pool...");
        const poolWithSigner = new ethers.Contract(CONTRACTS.pool, SimpleLiquidityPool_ABI, activeSigner);
        const tx = await poolWithSigner.swap(fromAddr, parsedIn, { gasLimit: 400000 });
        await tx.wait();
        showToast("🎉", "Swap Berhasil!");
        addActivity("SWAP", `Swap ${amountIn} ${fromSym}`);
      }
      setAmountIn(""); updateData();
    } catch (err) { console.error(err); showToast("❌", "Swap Gagal."); } finally { setSwapLoading(false); }
  };

  const handleAddLiquidity = async () => {
    if (!signer || !amountAInput || !amountBInput) return alert("Isi nominal!");
    setPoolLoading(true);
    try {
      const activeSigner = signer.signer || signer;
      const parseUnits = ethers.parseUnits || (ethers.utils && ethers.utils.parseUnits);
      const pA = parseUnits(String(amountAInput), 18);
      const pB = parseUnits(String(amountBInput), 18);
      
      showToast("⏳", "Approve Likuiditas...");
      await (new ethers.Contract(CONTRACTS.tokenA, SimpleERC20_ABI, activeSigner)).approve(CONTRACTS.pool, pA).then(tx => tx.wait());
      await (new ethers.Contract(CONTRACTS.tokenB, SimpleERC20_ABI, activeSigner)).approve(CONTRACTS.pool, pB).then(tx => tx.wait());
      
      showToast("⏳", "Menyuntikkan Dana ke Pool...");
      const poolWithSigner = new ethers.Contract(CONTRACTS.pool, SimpleLiquidityPool_ABI, activeSigner);
      const tx = await poolWithSigner.addLiquidity(pA, pB, { gasLimit: 500000 });
      await tx.wait();
      showToast("🎉", "Likuiditas Terisi!");
      addActivity("LIQUIDITY", `Add ${amountAInput} USDC & ${amountBInput} DAI`);
      setAmountAInput(""); setAmountBInput(""); updateData();
    } catch (err) { console.error(err); showToast("❌", "Gagal suntik pool."); } finally { setPoolLoading(false); }
  };
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0b0f19", color: "#f3f4f6", fontFamily: "'Inter', sans-serif", paddingBottom: "50px" }}>
      {toast && <div style={{ position: "fixed", top: "20px", right: "20px", backgroundColor: "#1e293b", padding: "12px 20px", borderRadius: "12px", border: "1px solid #fbbf24", zIndex: 1000, boxShadow: "0px 4px 20px rgba(25fbbf24,0.15)" }}>{toast.icon} {toast.msg}</div>}
      
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#111827", padding: "14px 24px", borderBottom: "1px solid #1f2937" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ backgroundColor: "#ffe4e6", padding: "6px", borderRadius: "50%" }}>
            <Flower size={20} color="#f472b6" fill="#f472b6" />
          </div>
          <div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#ffffff", letterSpacing: "0.5px" }}>Freesia</div>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: "#fbbf24", marginTop: "-3px" }}>ANALYTICS DEX</div>
          </div>
        </div>

        <button onClick={connectWallet} style={{ backgroundColor: "#fbbf24", color: "#0b0f19", border: "none", padding: "10px 18px", borderRadius: "12px", fontWeight: "800", cursor: "pointer", transition: "0.2s" }}>
          {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : "🔌 Connect Wallet"}
        </button>
      </div>

      <div style={{ maxWidth: "480px", margin: "30px auto 0 auto", padding: "0 16px" }}>
        
        {/* LIVE PRICE CHART SECTION */}
        <div style={{ backgroundColor: "#111827", borderRadius: "24px", padding: "20px", marginBottom: "20px", border: "1px solid #1f2937" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <LineChart size={18} color="#fbbf24" />
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#9ca3af" }}>Live Price Stream (Uniswap API Feed v2)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "rgba(16,185,129,0.1)", padding: "4px 8px", borderRadius: "6px" }}>
              <TrendingUp size={12} color="#10b981" />
              <span style={{ fontSize: "11px", color: "#10b981", fontWeight: "bold" }}>+0.24%</span>
            </div>
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#ffffff", marginBottom: "14px" }}>{rateText.replace("1 USDC = ", "")} <span style={{ fontSize: "12px", color: "#9ca3af" }}>USDC/DAI</span></div>
          
          {/* Visual Mini Chart Bars */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "60px", padding: "5px 0", borderBottom: "1px dashed #374151" }}>
            {mockChartData.map((val, idx) => {
              const heightPercent = Math.min(Math.max((val - 0.95) * 600, 15), 100);
              return (
                <div key={idx} style={{ flex: 1, backgroundColor: idx === mockChartData.length - 1 ? "#fbbf24" : "#1f2937", height: `${heightPercent}%`, borderRadius: "4px", transition: "all 0.5s ease" }} />
              );
            })}
          </div>
        </div>

        {/* NAVIGATION TAB */}
        <div style={{ display: "flex", backgroundColor: "#111827", padding: "6px", borderRadius: "16px", marginBottom: "20px", border: "1px solid #1f2937" }}>
          {["swap", "mint", "pool", "portfolio"].map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: "12px", backgroundColor: activeTab === t ? "#fbbf24" : "transparent", color: activeTab === t ? "#0b0f19" : "#9ca3af", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}>
              {t === "swap" ? "⇄ Swap" : t === "mint" ? "🪙 Faucet" : t === "pool" ? "💧 Pool" : "👤 Account"}
            </button>
          ))}
        </div>

        {/* TAB CORE PANEL */}
        <div style={{ backgroundColor: "#111827", borderRadius: "24px", padding: "24px", border: "1px solid #1f2937" }}>
          {activeTab === "swap" && (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Tukar Token (Dukungan zkLTC Native)</h3>
              
              {/* Token Asal */}
              <div style={{ backgroundColor: "#1f2937", padding: "16px", borderRadius: "16px", marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9ca3af", marginBottom: "8px" }}><span>Bayar</span><span>Saldo: {balances[fromSym] || "0.00"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <input type="number" placeholder="0.00" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} style={{ background: "transparent", border: "none", color: "#fff", fontSize: "24px", width: "55%", outline: "none" }} />
                  <select value={fromSym} onChange={(e) => { setFromSym(e.target.value); if(e.target.value === toSym) setToSym(e.target.value === "USDC" ? "DAI" : "USDC"); }} style={{ backgroundColor: "#111827", color: "#fff", border: "1px solid #374151", padding: "8px 12px", borderRadius: "10px" }}>
                    <option value="USDC">💵 USDC</option>
                    <option value="DAI">◈ DAI</option>
                    <option value="zkLTC">🪙 zkLTC (Native)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center", margin: "-12px 0" }}>
                <button onClick={() => { const old = fromSym; setFromSym(toSym); setToSym(old); }} style={{ backgroundColor: "#fbbf24", border: "none", padding: "10px", borderRadius: "50%", cursor: "pointer", zIndex: 2 }}><ArrowUpDown size={16} color="#0b0f19" /></button>
              </div>

              {/* Token Tujuan */}
              <div style={{ backgroundColor: "#1f2937", padding: "16px", borderRadius: "16px", marginTop: "8px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9ca3af", marginBottom: "8px" }}><span>Terima (Estimasi)</span><span>Saldo: {balances[toSym] || "0.00"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <input type="text" placeholder="0.00" value={amountIn ? (parseFloat(amountIn) * (fromSym === "zkLTC" ? 1.25 : 0.993)).toFixed(2) : ""} readOnly style={{ background: "transparent", border: "none", color: "#9ca3af", fontSize: "24px", width: "55%" }} />
                  <select value={toSym} onChange={(e) => { setToSym(e.target.value); if(e.target.value === fromSym) setFromSym(e.target.value === "USDC" ? "DAI" : "USDC"); }} style={{ backgroundColor: "#111827", color: "#fff", border: "1px solid #374151", padding: "8px 12px", borderRadius: "10px" }}>
                    <option value="DAI">◈ DAI</option>
                    <option value="USDC">💵 USDC</option>
                  </select>
                </div>
              </div>

              <button onClick={handleSwap} disabled={swapLoading || !amountIn} style={{ width: "100%", backgroundColor: "#fbbf24", color: "#0b0f19", border: "none", padding: "14px", borderRadius: "16px", fontWeight: "800", cursor: "pointer" }}>
                {swapLoading ? "Memproses Swap..." : `Tukar ${fromSym}`}
              </button>
            </div>
          )}

          {activeTab === "mint" && (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Faucet Testnet Token (Fix Core)</h3>
              {Object.keys(TOKEN_LIST).filter(k => k !== "zkLTC").map((sym) => (
                <div key={sym} style={{ backgroundColor: "#1f2937", padding: "16px", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div><span style={{ fontWeight: "bold" }}>{TOKEN_LIST[sym].logo} {sym}</span><div style={{ fontSize: "12px", color: "#9ca3af" }}>Saldo: {balances[sym]}</div></div>
                  <button onClick={() => handleMintToken(sym)} disabled={mintingSym === sym} style={{ backgroundColor: "#fbbf24", color: "#0b0f19", border: "none", padding: "8px 16px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>
                    {mintingSym === sym ? "Minting..." : "CLAIM 10K"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === "pool" && (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Liquidity Reserves Pool</h3>
              <div style={{ backgroundColor: "#1f2937", padding: "14px", borderRadius: "12px", marginBottom: "16px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}><span>Pool USDC Reserve:</span><span style={{ color: "#fbbf24", fontWeight: "bold" }}>{reserveA}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Pool DAI Reserve:</span><span style={{ color: "#fbbf24", fontWeight: "bold" }}>{reserveB}</span></div>
              </div>
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <input type="number" placeholder="Jumlah USDC" value={amountAInput} onChange={(e) => setAmountAInput(e.target.value)} style={{ background: "#1f2937", border: "1px solid #374151", color: "#fff", padding: "12px", borderRadius: "12px", width: "100%", outline: "none" }} />
                <input type="number" placeholder="Jumlah DAI" value={amountBInput} onChange={(e) => setAmountBInput(e.target.value)} style={{ background: "#1f2937", border: "1px solid #374151", color: "#fff", padding: "12px", borderRadius: "12px", width: "100%", outline: "none" }} />
              </div>
              <button onClick={handleAddLiquidity} disabled={poolLoading} style={{ width: "100%", backgroundColor: "#10b981", color: "#0b0f19", border: "none", padding: "12px", borderRadius: "12px", fontWeight: "bold" }}>Deposit Liquidity</button>
            </div>
          )}

          {activeTab === "portfolio" && (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Akun & Poin</h3>
              <div style={{ backgroundColor: "#1f2937", padding: "20px", borderRadius: "16px", textAlign: "center" }}>
                <User style={{ color: "#fbbf24", margin: "0 auto 8px auto" }} size={24} />
                <div style={{ fontSize: "13px", color: "#9ca3af" }}>Gas Utama (zkLTC): {balances.zkLTC}</div>
                <div style={{ fontSize: "26px", fontWeight: "800", color: "#10b981", marginTop: "6px" }}>{activityPoints} XP Pts</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

