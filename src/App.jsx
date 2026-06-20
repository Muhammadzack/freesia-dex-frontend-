import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { ArrowUpDown, Droplets, User, Flower } from "lucide-react";

const CONTRACTS = {
  tokenA: "0x6c18239A767d19dd6d274B94442f09eE6b9b6701",
  tokenB: "0x9013443A3E0Dd775152678a76fceDCBase54e1E1710",
  pool: "0xbDA6416a9420fD9fC012A21930c803dA7F3f0f91",
};

const LITVM_CHAIN_ID_HEX = "0x1159";
const LITVM_CHAIN_ID_DEC = 4441n;

const TOKEN_LIST = {
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
  const [rateText, setRateText] = useState("-");
  const [amountAInput, setAmountAInput] = useState("");
  const [amountBInput, setAmountBInput] = useState("");
  const [poolLoading, setPoolLoading] = useState(false);
  const [mintingSym, setMintingSym] = useState(null);
  const [activityPoints, setActivityPoints] = useState(0);
  const [txHistory, setTxHistory] = useState([]);

  const showToast = useCallback((icon, msg) => {
    setToast({ icon, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const checkNetworkAndSetup = useCallback(async (web3Provider) => {
    if (!window.ethereum) return;
    try {
      // Deteksi chain ID secara aman untuk v5 maupun v6
      let currentChainId;
      if (web3Provider.getNetwork) {
        const net = await web3Provider.getNetwork();
        currentChainId = net.chainId;
      } else {
        currentChainId = await window.ethereum.request({ method: "eth_chainId" });
      }
      
      const currentChainIdDec = BigInt(currentChainId);

      if (currentChainIdDec !== LITVM_CHAIN_ID_DEC) {
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
    if (!window.ethereum) {
      alert("Silakan buka web ini dari dalam Browser MetaMask / Mises Browser!");
      return;
    }
    try {
      // Cara inisialisasi paling aman dan kompatibel (v5 & v6)
      let web3Provider;
      if (ethers.BrowserProvider) {
        web3Provider = new ethers.BrowserProvider(window.ethereum);
      } else if (ethers.providers && ethers.providers.Web3Provider) {
        web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      } else {
        web3Provider = new ethers.Web3Provider(window.ethereum);
      }

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const web3Signer = await web3Provider.getSigner();
      
      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(accounts[0]);
      
      showToast("🦊", "Dompet Berhasil Terhubung!");
      await checkNetworkAndSetup(web3Provider);
    } catch (err) {
      console.error(err);
      alert("Gagal koneksi dompet: " + err.message);
    }
  };

  const updateData = useCallback(async () => {
    if (!provider || !account) return;
    try {
      let nativeBal;
      if (provider.getBalance) {
        nativeBal = await provider.getBalance(account);
      } else {
        nativeBal = await provider.getSigner().getBalance();
      }

      const contractA = new ethers.Contract(CONTRACTS.tokenA, SimpleERC20_ABI, provider);
      const contractB = new ethers.Contract(CONTRACTS.tokenB, SimpleERC20_ABI, provider);
      const balA = await contractA.balanceOf(account);
      const balB = await contractB.balanceOf(account);
      
      const fmtUnits = ethers.formatUnits || (ethers.utils && ethers.utils.formatUnits);
      const fmtEther = ethers.formatEther || (ethers.utils && ethers.utils.formatEther);

      const parsedBalA = fmtUnits(balA, 18);
      const parsedBalB = fmtUnits(balB, 18);
      const parsedNative = fmtEther(nativeBal);

      setBalances({
        USDC: parseFloat(parsedBalA).toFixed(2),
        DAI: parseFloat(parsedBalB).toFixed(2),
        zkLTC: parseFloat(parsedNative).toFixed(4)
      });

      const poolContract = new ethers.Contract(CONTRACTS.pool, SimpleLiquidityPool_ABI, provider);
      const [resA, resB] = await poolContract.getReserves();
      
      const parsedResA = fmtUnits(resA, 18);
      const parsedResB = fmtUnits(resB, 18);

      setReserveA(parseFloat(parsedResA).toFixed(2));
      setReserveB(parseFloat(parsedResB).toFixed(2));
      if (BigInt(resA) > 0n) {
        setRateText(`1 USDC = ${(Number(resB) / Number(resA)).toFixed(4)} DAI`);
      } else { setRateText("Pool Kosong"); }
    } catch (err) { console.error(err); }
  }, [provider, account]);

  useEffect(() => {
    if (provider && account) {
      updateData();
      const interval = setInterval(updateData, 7000);
      return () => clearInterval(interval);
    }
  }, [provider, account, updateData]);

  const addActivity = (type, desc) => {
    setActivityPoints(prev => prev + 10);
    setTxHistory(prev => [{ type, desc, time: new Date().toLocaleTimeString() }, ...prev]);
  };

  const handleMintToken = async (sym) => {
    if (!signer) return alert("Hubungkan dompet!");
    setMintingSym(sym);
    try {
      const contract = new ethers.Contract(TOKEN_LIST[sym].address, SimpleERC20_ABI, signer);
      const parseUnits = ethers.parseUnits || (ethers.utils && ethers.utils.parseUnits);
      const mintAmount = parseUnits("10000", 18);
      await (await contract.mint(account, mintAmount)).wait();
      showToast("🎉", `Mint 10k ${sym} Berhasil!`);
      addActivity("MINT", `Mint 10,000 ${sym}`);
      updateData();
    } catch (err) { console.error(err); } finally { setMintingSym(null); }
  };

  const handleSwap = async () => {
    if (!signer || !amountIn) return;
    setSwapLoading(true);
    try {
      const fromAddr = TOKEN_LIST[fromSym].address;
      const parseUnits = ethers.parseUnits || (ethers.utils && ethers.utils.parseUnits);
      const parsedIn = parseUnits(String(amountIn), 18);
      showToast("⏳", "Approve token...");
      await (await new ethers.Contract(fromAddr, SimpleERC20_ABI, signer).approve(CONTRACTS.pool, parsedIn)).wait();
      showToast("⏳", "Eksekusi Swap...");
      await (await new ethers.Contract(CONTRACTS.pool, SimpleLiquidityPool_ABI, signer).swap(fromAddr, parsedIn, { gasLimit: 500000 })).wait();
      showToast("🎉", "Swap Berhasil!");
      addActivity("SWAP", `Swap ${amountIn} ${fromSym}`);
      setAmountIn(""); updateData();
    } catch (err) { console.error(err); showToast("❌", "Swap Gagal."); } finally { setSwapLoading(false); }
  };

  const handleAddLiquidity = async () => {
    if (!signer || !amountAInput || !amountBInput) return alert("Isi nominal!");
    setPoolLoading(true);
    try {
      const parseUnits = ethers.parseUnits || (ethers.utils && ethers.utils.parseUnits);
      const pA = parseUnits(String(amountAInput), 18);
      const pB = parseUnits(String(amountBInput), 18);
      showToast("⏳", "Approve token...");
      await (await new ethers.Contract(CONTRACTS.tokenA, SimpleERC20_ABI, signer).approve(CONTRACTS.pool, pA)).wait();
      await (await new ethers.Contract(CONTRACTS.tokenB, SimpleERC20_ABI, signer).approve(CONTRACTS.pool, pB)).wait();
      showToast("⏳", "Suntik Likuiditas...");
      await (await new ethers.Contract(CONTRACTS.pool, SimpleLiquidityPool_ABI, signer).addLiquidity(pA, pB, { gasLimit: 500000 })).wait();
      showToast("🎉", "Likuiditas Terisi!");
      addActivity("LIQUIDITY", `Add ${amountAInput} USDC & ${amountBInput} DAI`);
      setAmountAInput(""); setAmountBInput(""); updateData();
    } catch (err) { console.error(err); showToast("❌", "Likuiditas Gagal."); } finally { setPoolLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0e1322", color: "#f3f4f6", fontFamily: "'Inter', sans-serif", paddingBottom: "40px" }}>
      {toast && <div style={{ position: "fixed", top: "20px", right: "20px", backgroundColor: "#1e293b", padding: "12px 20px", borderRadius: "12px", border: "1px solid #334155", zIndex: 1000 }}>{toast.icon} {toast.msg}</div>}
      
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#111827", padding: "12px 24px", borderBottom: "1px solid #1f2937" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ backgroundColor: "#ffe4e6", padding: "6px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Flower size={20} color="#f472b6" fill="#f472b6" />
          </div>
          <div>
            <div style={{ fontSize: "18px", fontWeight: "800", letterSpacing: "0.5px", color: "#ffffff" }}>Freesia</div>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: "#fbbf24", marginTop: "-2px" }}>DEX</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={connectWallet} style={{ backgroundColor: "#fbbf24", color: "#0b0f19", border: "none", padding: "10px 18px", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" }}>
            {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : "Connect Wallet"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "460px", margin: "40px auto 0 auto", padding: "0 16px" }}>
        <div style={{ display: "flex", backgroundColor: "#111827", padding: "6px", borderRadius: "16px", marginBottom: "24px", border: "1px solid #1f2937" }}>
          {["swap", "mint", "pool", "portfolio"].map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: "12px", backgroundColor: activeTab === t ? "#fbbf24" : "transparent", color: activeTab === t ? "#0b0f19" : "#9ca3af", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}>
              {t === "swap" ? "⇄ Swap" : t === "mint" ? "🪙 Mint" : t === "pool" ? "💧 Pool" : "👤 Account"}
            </button>
          ))}
        </div>

        <div style={{ backgroundColor: "#111827", borderRadius: "24px", padding: "24px", border: "1px solid #1f2937" }}>
          {activeTab === "swap" && (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Tukar Token</h3>
              <div style={{ backgroundColor: "#1f2937", padding: "16px", borderRadius: "16px", marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9ca3af", marginBottom: "8px" }}><span>Bayar</span><span>Saldo: {balances[fromSym]}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <input type="number" placeholder="0.00" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} style={{ background: "transparent", border: "none", color: "#fff", fontSize: "24px", width: "60%", outline: "none" }} />
                  <select value={fromSym} onChange={(e) => { setFromSym(e.target.value); setToSym(e.target.value === "USDC" ? "DAI" : "USDC"); }} style={{ backgroundColor: "#111827", color: "#fff", border: "1px solid #374151", padding: "8px 12px", borderRadius: "10px" }}>
                    <option value="USDC">💵 USDC</option><option value="DAI">◈ DAI</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center", margin: "-12px 0" }}>
                <button onClick={() => { setFromSym(toSym); setToSym(fromSym); }} style={{ backgroundColor: "#fbbf24", border: "none", padding: "10px", borderRadius: "50%", cursor: "pointer", zIndex: 2 }}><ArrowUpDown size={16} /></button>
              </div>

              <div style={{ backgroundColor: "#1f2937", padding: "16px", borderRadius: "16px", marginTop: "8px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9ca3af", marginBottom: "8px" }}><span>Terima</span><span>Saldo: {balances[toSym]}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <input type="text" placeholder="0.00" value={amountIn ? (parseFloat(amountIn) * 0.99).toFixed(2) : ""} readOnly style={{ background: "transparent", border: "none", color: "#9ca3af", fontSize: "24px", width: "60%" }} />
                  <select value={toSym} onChange={(e) => { setToSym(e.target.value); setFromSym(e.target.value === "USDC" ? "DAI" : "USDC"); }} style={{ backgroundColor: "#111827", color: "#fff", border: "1px solid #374151", padding: "8px 12px", borderRadius: "10px" }}>
                    <option value="DAI">◈ DAI</option><option value="USDC">💵 USDC</option>
                  </select>
                </div>
              </div>
              <div style={{ fontSize: "12px", color: "#fbbf24", marginBottom: "12px", textAlign: "right" }}>{rateText}</div>
              <button onClick={handleSwap} disabled={swapLoading || !amountIn} style={{ width: "100%", backgroundColor: "#1f2937", color: "#fbbf24", border: "1px solid #fbbf24", padding: "14px", borderRadius: "16px", fontWeight: "bold" }}>
                {swapLoading ? "Memproses Tukar..." : "Tukar Token (Swap)"}
              </button>
            </div>
          )}

          {activeTab === "mint" && (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Faucet Testnet</h3>
              {Object.keys(TOKEN_LIST).map((sym) => (
                <div key={sym} style={{ backgroundColor: "#1f2937", padding: "16px", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div><span style={{ fontWeight: "bold" }}>{TOKEN_LIST[sym].logo} {sym}</span><div style={{ fontSize: "12px", color: "#9ca3af" }}>Saldo: {balances[sym]}</div></div>
                  <button onClick={() => handleMintToken(sym)} disabled={mintingSym === sym} style={{ backgroundColor: "#fbbf24", color: "#0b0f19", border: "none", padding: "8px 16px", borderRadius: "10px", fontWeight: "bold" }}>MINT 10K</button>
                </div>
              ))}
            </div>
          )}

          {activeTab === "pool" && (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Liquidity Pool</h3>
              <div style={{ backgroundColor: "#1f2937", padding: "14px", borderRadius: "12px", marginBottom: "16px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}><span>Cadangan USDC:</span><span>{reserveA}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Cadangan DAI:</span><span>{reserveB}</span></div>
              </div>
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <input type="number" placeholder="Jumlah USDC" value={amountAInput} onChange={(e) => setAmountAInput(e.target.value)} style={{ background: "#1f2937", border: "1px solid #374151", color: "#fff", padding: "12px", borderRadius: "12px", width: "100%", outline: "none" }} />
                <input type="number" placeholder="Jumlah DAI" value={amountBInput} onChange={(e) => setAmountBInput(e.target.value)} style={{ background: "#1f2937", border: "1px solid #374151", color: "#fff", padding: "12px", borderRadius: "12px", width: "100%", outline: "none" }} />
              </div>
              <button onClick={handleAddLiquidity} disabled={poolLoading} style={{ width: "100%", backgroundColor: "#10b981", color: "#0b0f19", border: "none", padding: "12px", borderRadius: "12px", fontWeight: "bold" }}>Suntik Likuiditas</button>
            </div>
          )}

          {activeTab === "portfolio" && (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Akun Saya</h3>
              <div style={{ backgroundColor: "#1f2937", padding: "20px", borderRadius: "16px", textAlign: "center", marginBottom: "16px" }}>
                <User style={{ color: "#fbbf24", margin: "0 auto 8px auto" }} size={24} />
                <div style={{ fontSize: "12px", color: "#9ca3af" }}>zkLTC: {balances.zkLTC}</div>
                <div style={{ fontSize: "24px", fontWeight: "800", color: "#10b981", marginTop: "4px" }}>{activityPoints} Pts</div>
              </div>
              {txHistory.length === 0 ? (
                <div style={{ textTransform: "center", color: "#6b7280", fontSize: "13px" }}>Belum ada aktivitas transaksi.</div>
              ) : (
                txHistory.map((a, i) => (
                  <div key={i} style={{ backgroundColor: "#1f2937", padding: "12px", borderRadius: "10px", display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}>
                    <span>⚡ <strong>{a.type}</strong> - {a.desc}</span><span style={{ color: "#6b7280" }}>{a.time}</span>
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
