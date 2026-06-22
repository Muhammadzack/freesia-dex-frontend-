import React, { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import {
  ArrowUpDown, Settings, CheckCircle2, AlertCircle,
  Coins, Wallet, Moon, Sun, Share2, Bell, BookMarked,
  Trash2, Copy, Zap, TrendingUp
} from "lucide-react";

// ==================== ABI & KONFIGURASI ====================
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function mint(address to, uint256 amount) external"
];

// ✅ FIXED ABI — swap sekarang punya 3 parameter sesuai kontrak asli
const POOL_ABI = [
  "function swap(address tokenIn, uint256 amountIn, uint256 minAmountOut) external returns (uint256 amountOut)",
  "function addLiquidity(uint256 amountA, uint256 amountB) external returns (uint256 lpTokens)",
  "function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256 amountOut)",
  "function reserveA() view returns (uint256)",
  "function reserveB() view returns (uint256)"
];

const CONTRACTS = {
  tokenA: "0x6c18239A767d19dd6d274B94442f09eE6b9b6701",
  // ✅ FIXED: address DAI diperbaiki (sebelumnya ada 'Dcd' yang salah)
  tokenB: "0x9013443A3E0Dd775152678a76fceDcA54e1E1710",
  pool: "0xbdA6416a9420fD9fC012A217930c803dA7F3f0f9",
};

const TOKEN_LIST = {
  USDC: { address: CONTRACTS.tokenA, logo: "💵", decimals: 18 },
  DAI: { address: CONTRACTS.tokenB, logo: "◈", decimals: 18 },
  zkLTC: { address: "NATIVE", logo: "⚡", decimals: 18 }
};

const LITVM_CHAIN_ID_HEX = "0x1159";
const LITVM_CHAIN_ID_DEC = 4441n;
const LITVM_PARAMS = {
  chainId: LITVM_CHAIN_ID_HEX,
  chainName: "LitVM Testnet",
  nativeCurrency: { name: "zkLTC", symbol: "zkLTC", decimals: 18 },
  rpcUrls: ["https://liteforge.rpc.caldera.xyz/http"],
  blockExplorerUrls: ["https://liteforge.explorer.caldera.xyz"],
};

const shortAddr = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

export default function App() {
  // ── Wallet ──
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [onCorrectNetwork, setOnCorrectNetwork] = useState(false);

  // ── UI ──
  const [activeTab, setActiveTab] = useState("swap");
  const [toast, setToast] = useState(null);

  // ── ✨ DARK MODE (fitur baru) ──
  const [darkMode, setDarkMode] = useState(false);

  // ── Market data ──
  const [ltcData, setLtcData] = useState({ price: "...", change: "..." });

  // ── ✨ GAS ESTIMATOR (fitur baru) ──
  const [gasEstimate, setGasEstimate] = useState(null);

  // ── ✨ PRICE ALERT (fitur baru) ──
  const [priceAlerts, setPriceAlerts] = useState([]);
  const [alertTarget, setAlertTarget] = useState("");
  const [alertDirection, setAlertDirection] = useState("above");
  const [showAlertModal, setShowAlertModal] = useState(false);

  // ── ✨ ADDRESS BOOK (fitur baru) ──
  const [addressBook, setAddressBook] = useState(() => {
    try { return JSON.parse(localStorage.getItem("freesia_addressbook") || "[]"); }
    catch { return []; }
  });
  const [newAddrLabel, setNewAddrLabel] = useState("");
  const [newAddrValue, setNewAddrValue] = useState("");
  const [showAddressBook, setShowAddressBook] = useState(false);

  // ── Pool state ──
  const [communityLiquidity, setCommunityLiquidity] = useState({ usdcDaiTVL: 520400, zkLtcUsdcTVL: 45100 });
  const [poolReserves, setPoolReserves] = useState({ reserveA: 0, reserveB: 0 });

  // ── Slippage ──
  const [slippage, setSlippage] = useState(0.5);
  const [showSlippageModal, setShowSlippageModal] = useState(false);
  const [customSlippage, setCustomSlippage] = useState("");

  // ── Swap ──
  const [fromSym, setFromSym] = useState("USDC");
  const [toSym, setToSym] = useState("DAI");
  const [amountIn, setAmountIn] = useState("");
  const [amountOutPreview, setAmountOutPreview] = useState("");
  const [priceImpact, setPriceImpact] = useState(0);
  const [fromBalance, setFromBalance] = useState("0.00");
  const [toBalance, setToBalance] = useState("0.00");
  const [swapLoading, setSwapLoading] = useState(false);

  // ── Pool ──
  const [selectedPool, setSelectedPool] = useState("USDC-DAI");
  const [amountAInput, setAmountAInput] = useState("");
  const [amountBInput, setAmountBInput] = useState("");
  const [poolLoading, setPoolLoading] = useState(false);
  const [priceChange, setPriceChange] = useState(0);

  // ── Mint ──
  const [mintBalances, setMintBalances] = useState({ USDC: "0.00", DAI: "0.00", zkLTC: "0.00" });
  const [mintingSym, setMintingSym] = useState(null);

  // ── Staking ──
  const [stakeAmount, setStakeAmount] = useState("");
  const [myStakedValue, setMyStakedValue] = useState(0);
  const [mbgRewards, setMbgRewards] = useState(0);

  // ── TX History (sesi ini) ──
  const [txHistory, setTxHistory] = useState([]);

  const addToHistory = (type, detail) => {
    setTxHistory(prev => [{ id: Date.now(), type, detail, time: new Date().toLocaleTimeString("id-ID") }, ...prev].slice(0, 20));
  };

  // ==================== THEME COLORS ====================
  const T = {
    bg: darkMode ? "#0f172a" : "#f9fafb",
    card: darkMode ? "#1e293b" : "#ffffff",
    input: darkMode ? "#0f172a" : "#f9fafb",
    border: darkMode ? "#334155" : "#e5e7eb",
    text: darkMode ? "#f1f5f9" : "#111827",
    sub: darkMode ? "#94a3b8" : "#6b7280",
    yellow: "#fbbf24",
    green: "#10b981",
    red: "#ef4444",
  };

  const cardStyle = { backgroundColor: T.card, borderRadius: "24px", padding: "24px", width: "100%", maxWidth: "460px", boxShadow: "0 10px 25px rgba(0,0,0,0.07)", border: `1px solid ${T.border}` };
  const inputBoxStyle = { backgroundColor: T.input, padding: "16px", borderRadius: "16px", border: `1px solid ${T.border}`, marginBottom: "12px" };
  const selectStyle = { border: "none", backgroundColor: "transparent", fontWeight: "bold", fontSize: "16px", color: T.text, outline: "none" };
  const bigInputStyle = { background: "transparent", border: "none", color: T.text, fontSize: "28px", width: "60%", outline: "none", fontWeight: "600" };
  const btnYellow = { width: "100%", backgroundColor: T.yellow, color: "#111827", border: "none", padding: "16px", borderRadius: "16px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" };
  const iconBtn = (active) => ({ background: active ? T.yellow : T.input, border: `1px solid ${T.border}`, borderRadius: "10px", padding: "6px 12px", cursor: "pointer", color: T.text, display: "flex", alignItems: "center", gap: "6px", fontWeight: "bold", fontSize: "13px" });

  // ==================== MARKET DATA ====================
  useEffect(() => {
    const fetchLtcPrice = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd&include_24hr_change=true");
        const data = await res.json();
        const newPrice = data.litecoin.usd.toFixed(2);
        setLtcData({ price: newPrice, change: data.litecoin.usd_24h_change.toFixed(2) });

        // ✨ Cek price alerts
        setPriceAlerts(prev => prev.map(alert => {
          if (!alert.triggered) {
            const price = parseFloat(newPrice);
            const target = parseFloat(alert.target);
            const hit = alert.direction === "above" ? price >= target : price <= target;
            if (hit) {
              showToast("🔔", `Price Alert! LTC ${alert.direction === "above" ? "naik ke" : "turun ke"} $${price}`);
              if (Notification.permission === "granted") {
                new Notification("Freesia DEX Price Alert 🔔", { body: `LTC/USD menyentuh $${price}` });
              }
              return { ...alert, triggered: true };
            }
          }
          return alert;
        }));
      } catch (err) { console.error(err); }
    };
    fetchLtcPrice();
    const interval = setInterval(fetchLtcPrice, 30000);
    return () => clearInterval(interval);
  }, [priceAlerts, showToast]);

  // ==================== STAKING REWARDS ====================
  useEffect(() => {
    if (myStakedValue <= 0) return;
    const interval = setInterval(() => {
      setMbgRewards(prev => prev + myStakedValue * (0.00001 + Math.random() * 0.000005));
    }, 1000);
    return () => clearInterval(interval);
  }, [myStakedValue]);

  // ==================== TOAST ====================
  const showToast = useCallback((icon, msg) => {
    setToast({ icon, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ==================== UPDATE BALANCES ====================
  const updateData = useCallback(async () => {
    if (!window.ethereum || !account) return;
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const nativeBal = await web3Provider.getBalance(account);
      const tokenA = new ethers.Contract(CONTRACTS.tokenA, ERC20_ABI, web3Provider);
      const tokenB = new ethers.Contract(CONTRACTS.tokenB, ERC20_ABI, web3Provider);
      const [balA, balB] = await Promise.all([
        tokenA.balanceOf(account).catch(() => 0n),
        tokenB.balanceOf(account).catch(() => 0n)
      ]);
      const finalBalances = {
        USDC: parseFloat(ethers.formatUnits(balA, 18)).toFixed(2),
        DAI: parseFloat(ethers.formatUnits(balB, 18)).toFixed(2),
        zkLTC: parseFloat(ethers.formatEther(nativeBal)).toFixed(4)
      };
      setMintBalances(finalBalances);
      setFromBalance(finalBalances[fromSym] || "0.00");
      setToBalance(finalBalances[toSym] || "0.00");
    } catch (err) { console.error("Update data failed:", err); }
  }, [account, fromSym, toSym]);

  useEffect(() => {
    if (account) {
      updateData();
      const interval = setInterval(updateData, 8000);
      return () => clearInterval(interval);
    }
  }, [account, updateData]);

  // ==================== LOAD POOL RESERVES ====================
  const loadPoolReserves = useCallback(async () => {
    try {
      const readProvider = provider || new ethers.JsonRpcProvider(LITVM_PARAMS.rpcUrls[0]);
      const poolContract = new ethers.Contract(CONTRACTS.pool, POOL_ABI, readProvider);
      const [resA, resB] = await Promise.all([poolContract.reserveA(), poolContract.reserveB()]);
      setPoolReserves({
        reserveA: parseFloat(ethers.formatUnits(resA, 18)),
        reserveB: parseFloat(ethers.formatUnits(resB, 18))
      });
    } catch (err) { console.error("Pool reserves fetch error:", err); }
  }, [provider]);

  useEffect(() => {
    loadPoolReserves();
    const interval = setInterval(loadPoolReserves, 10000);
    return () => clearInterval(interval);
  }, [loadPoolReserves]);

  // ==================== PREVIEW SWAP OUTPUT + GAS ESTIMATOR ====================
  useEffect(() => {
    const calc = async () => {
      if (!amountIn || parseFloat(amountIn) <= 0) {
        setAmountOutPreview(""); setPriceImpact(0); setGasEstimate(null); return;
      }
      const isStablePair = (fromSym === "USDC" && toSym === "DAI") || (fromSym === "DAI" && toSym === "USDC");
      if (!isStablePair) { setAmountOutPreview(""); setPriceImpact(0); setGasEstimate(null); return; }
      try {
        const readProvider = provider || new ethers.JsonRpcProvider(LITVM_PARAMS.rpcUrls[0]);
        const poolContract = new ethers.Contract(CONTRACTS.pool, POOL_ABI, readProvider);
        const fromAddr = TOKEN_LIST[fromSym].address;
        const amountInWei = ethers.parseUnits(String(amountIn), 18);

        const out = await poolContract.getAmountOut(fromAddr, amountInWei);
        const outFormatted = parseFloat(ethers.formatUnits(out, 18));
        setAmountOutPreview(outFormatted.toFixed(6));

        // Price impact
        if (poolReserves.reserveA > 0 && poolReserves.reserveB > 0) {
          const spot = fromSym === "USDC" ? poolReserves.reserveB / poolReserves.reserveA : poolReserves.reserveA / poolReserves.reserveB;
          const effective = outFormatted / parseFloat(amountIn);
          setPriceImpact(Math.abs((spot - effective) / spot) * 100);
        }

        // ✨ Gas estimator: estimasi gas untuk swap (gas limit * gas price)
        try {
          const feeData = await readProvider.getFeeData();
          const gasPrice = feeData.gasPrice || BigInt("1000000000");
          const gasLimitSwap = BigInt(400000);
          const estimatedCostWei = gasPrice * gasLimitSwap;
          const estimatedCostEth = parseFloat(ethers.formatEther(estimatedCostWei));
          const ltcUsdPrice = parseFloat(ltcData.price) || 0;
          setGasEstimate({
            eth: estimatedCostEth.toFixed(6),
            usd: (estimatedCostEth * ltcUsdPrice).toFixed(4)
          });
        } catch { setGasEstimate(null); }
      } catch (err) { console.error("Preview calc error:", err); setAmountOutPreview(""); }
    };
    calc();
  }, [amountIn, fromSym, toSym, provider, poolReserves, ltcData.price]);

  // ==================== CONNECT WALLET ====================
  const connectWallet = async () => {
    if (!window.ethereum) { showToast("❌", "MetaMask tidak terinstall!"); return; }
    setConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const network = await web3Provider.getNetwork();

      if (network.chainId !== LITVM_CHAIN_ID_DEC) {
        try {
          await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: LITVM_CHAIN_ID_HEX }] });
        } catch (sw) {
          if (sw.code === 4902) {
            await window.ethereum.request({ method: "wallet_addEthereumChain", params: [LITVM_PARAMS] });
          }
        }
      }

      const finalProvider = new ethers.BrowserProvider(window.ethereum);
      const finalNetwork = await finalProvider.getNetwork();
      const web3Signer = await finalProvider.getSigner();
      setProvider(finalProvider);
      setSigner(web3Signer);
      setAccount(accounts[0]);
      setOnCorrectNetwork(finalNetwork.chainId === LITVM_CHAIN_ID_DEC);
      showToast("✅", "Dompet terhubung ke LitVM!");
    } catch (err) {
      console.error(err);
      showToast("❌", "Koneksi gagal: " + (err.message || "").slice(0, 60));
    } finally { setConnecting(false); }
  };

  // ==================== ✅ FIXED SWAP ====================
  const handleSwap = async () => {
    if (!signer || !account) return showToast("❌", "Hubungkan dompet dulu!");
    const isStablePair = (fromSym === "USDC" && toSym === "DAI") || (fromSym === "DAI" && toSym === "USDC");
    if (!isStablePair) return showToast("❌", "Pool hanya support USDC/DAI saat ini.");
    if (!amountIn || parseFloat(amountIn) <= 0) return showToast("❌", "Masukkan jumlah!");
    setSwapLoading(true);
    try {
      const parsedIn = ethers.parseUnits(String(amountIn), 18);
      const fromAddr = TOKEN_LIST[fromSym].address;
      const tokenContract = new ethers.Contract(fromAddr, ERC20_ABI, signer);
      const poolContract = new ethers.Contract(CONTRACTS.pool, POOL_ABI, signer);

      const allowance = await tokenContract.allowance(account, CONTRACTS.pool);
      if (allowance < parsedIn) {
        showToast("⏳", "Konfirmasi approve di wallet...");
        await (await tokenContract.approve(CONTRACTS.pool, parsedIn)).wait();
      }

      const expectedOut = await poolContract.getAmountOut(fromAddr, parsedIn);
      const slippageBps = BigInt(Math.floor(slippage * 100));
      const minAmountOut = expectedOut - (expectedOut * slippageBps / 10000n);

      showToast("⏳", "Konfirmasi swap di wallet...");
      const tx = await poolContract.swap(fromAddr, parsedIn, minAmountOut, { gasLimit: 400000 });
      await tx.wait();

      const outAmt = amountOutPreview || "?";
      showToast("🎉", `Swap Berhasil! ${amountIn} ${fromSym} → ${outAmt} ${toSym}`);
      addToHistory("Swap", `${amountIn} ${fromSym} → ${toSym}`);

      // ✨ Share ke X setelah swap berhasil
      setLastSwap({ amountIn, fromSym, toSym, outAmt });
      setShowShareModal(true);

      setAmountIn(""); updateData(); loadPoolReserves();
    } catch (err) {
      console.error(err);
      showToast("❌", "Swap Gagal: " + (err.reason || err.message || "cek gas & slippage").slice(0, 80));
    } finally { setSwapLoading(false); }
  };

  // ✨ SHARE TRADE STATE
  const [showShareModal, setShowShareModal] = useState(false);
  const [lastSwap, setLastSwap] = useState(null);

  const handleShare = () => {
    if (!lastSwap) return;
    const text = encodeURIComponent(`Just swapped ${lastSwap.amountIn} ${lastSwap.fromSym} → ${lastSwap.outAmt} ${lastSwap.toSym} on Freesia DEX 🌸\n\nBuilt on LitVM Testnet ⚡\n\n🔗 freesia-dex-frontend.vercel.app\n\n@0xzackbh #FreesiaDEX #LitVM #DeFi`);
    window.open(`https://x.com/intent/tweet?text=${text}`, "_blank");
    setShowShareModal(false);
  };

  // ==================== MINT ====================
  const handleMintToken = async (sym) => {
    if (!signer || !account) { showToast("❌", "Hubungkan dompet dahulu!"); return; }
    setMintingSym(sym);
    try {
      if (sym === "zkLTC") { showToast("💡", "zkLTC diambil dari Faucet Utama Jaringan!"); setMintingSym(null); return; }
      const tokenAddress = TOKEN_LIST[sym]?.address;
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      showToast("⏳", `Meminta Faucet ${sym}...`);
      const tx = await token.mint(account, ethers.parseUnits("10000", 18));
      await tx.wait();
      showToast("✅", `Berhasil klaim 10k ${sym}!`);
      addToHistory("Mint", `10,000 ${sym}`);
      setCommunityLiquidity(prev => ({ ...prev, usdcDaiTVL: prev.usdcDaiTVL + 500 }));
      updateData();
    } catch (err) {
      console.error(err);
      showToast("❌", `Gagal Mint ${sym}: ${(err.reason || err.message || "").slice(0, 60)}`);
    } finally { setMintingSym(null); }
  };

  // ==================== POOL ====================
  const handleAddLiquidity = async () => {
    if (!signer || !account) return showToast("❌", "Hubungkan dompet!");
    if (!amountAInput || !amountBInput) return showToast("❌", "Masukkan jumlah pasokan!");
    setPoolLoading(true);
    try {
      const pA = ethers.parseUnits(String(amountAInput), 18);
      const pB = ethers.parseUnits(String(amountBInput), 18);
      const tA = new ethers.Contract(CONTRACTS.tokenA, ERC20_ABI, signer);
      const tB = new ethers.Contract(CONTRACTS.tokenB, ERC20_ABI, signer);
      const poolContract = new ethers.Contract(CONTRACTS.pool, POOL_ABI, signer);

      const [allA, allB] = await Promise.all([
        tA.allowance(account, CONTRACTS.pool),
        tB.allowance(account, CONTRACTS.pool)
      ]);
      if (allA < pA) await (await tA.approve(CONTRACTS.pool, pA)).wait();
      if (allB < pB) await (await tB.approve(CONTRACTS.pool, pB)).wait();

      showToast("⏳", "Menyuntikkan Likuiditas...");
      const tx = await poolContract.addLiquidity(pA, pB, { gasLimit: 500000 });
      await tx.wait();

      const addedValue = parseFloat(amountAInput) + parseFloat(amountBInput);
      setCommunityLiquidity(prev => selectedPool === "USDC-DAI"
        ? { ...prev, usdcDaiTVL: prev.usdcDaiTVL + addedValue }
        : { ...prev, zkLtcUsdcTVL: prev.zkLtcUsdcTVL + addedValue }
      );
      showToast("🎉", "Likuiditas Berhasil Ditambahkan!");
      addToHistory("Add Liquidity", `${amountAInput} + ${amountBInput}`);
      setAmountAInput(""); setAmountBInput("");
      updateData(); loadPoolReserves();
    } catch (err) {
      console.error(err);
      showToast("❌", "Gagal: " + (err.reason || err.message || "").slice(0, 80));
    } finally { setPoolLoading(false); }
  };

  // ✨ ADDRESS BOOK HELPERS
  const saveAddressBook = (newBook) => {
    setAddressBook(newBook);
    localStorage.setItem("freesia_addressbook", JSON.stringify(newBook));
  };
  const addAddress = () => {
    if (!newAddrLabel || !newAddrValue) return showToast("❌", "Isi label & alamat!");
    const newBook = [...addressBook, { id: Date.now(), label: newAddrLabel, address: newAddrValue }];
    saveAddressBook(newBook);
    setNewAddrLabel(""); setNewAddrValue("");
    showToast("✅", "Alamat tersimpan!");
  };
  const removeAddress = (id) => saveAddressBook(addressBook.filter(a => a.id !== id));
  const copyAddress = (addr) => {
    navigator.clipboard.writeText(addr).then(() => showToast("📋", "Address disalin!"));
  };

  // ✨ PRICE ALERT HELPERS
  const addAlert = () => {
    if (!alertTarget || parseFloat(alertTarget) <= 0) return showToast("❌", "Masukkan target harga!");
    const newAlerts = [...priceAlerts, { id: Date.now(), target: alertTarget, direction: alertDirection, triggered: false }];
    setPriceAlerts(newAlerts);
    setAlertTarget("");
    showToast("🔔", `Alert set: LTC ${alertDirection} $${alertTarget}`);
    if (Notification.permission === "default") Notification.requestPermission();
  };
  const removeAlert = (id) => setPriceAlerts(prev => prev.filter(a => a.id !== id));

  return (
    <div style={{ minHeight: "100vh", backgroundColor: T.bg, color: T.text, fontFamily: "sans-serif", transition: "all 0.3s" }}>

      {/* ✨ SHARE TRADE MODAL */}
      {showShareModal && lastSwap && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setShowShareModal(false)}>
          <div style={{ backgroundColor: T.card, borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "380px", border: `1px solid ${T.border}` }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: T.text, display: "flex", alignItems: "center", gap: "8px" }}><Share2 size={18} /> Share Swap Kamu!</h3>
            <div style={{ backgroundColor: darkMode ? "#0f172a" : "#f9fafb", borderRadius: "12px", padding: "16px", marginBottom: "16px", border: `1px solid ${T.border}` }}>
              <p style={{ margin: 0, fontSize: "13px", color: T.text, lineHeight: "1.6" }}>
                Just swapped <strong>{lastSwap.amountIn} {lastSwap.fromSym}</strong> → <strong>{lastSwap.outAmt} {lastSwap.toSym}</strong> on Freesia DEX 🌸<br />
                Built on LitVM Testnet ⚡<br />
                @0xzackbh #FreesiaDEX #LitVM
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleShare} style={{ flex: 1, backgroundColor: "#000", color: "#fff", border: "none", padding: "14px", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                𝕏 Post ke X
              </button>
              <button onClick={() => setShowShareModal(false)} style={{ flex: 1, backgroundColor: T.input, color: T.text, border: `1px solid ${T.border}`, padding: "14px", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" }}>
                Lewati
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SLIPPAGE MODAL */}
      {showSlippageModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 998, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setShowSlippageModal(false)}>
          <div style={{ backgroundColor: T.card, borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "360px", border: `1px solid ${T.border}` }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: T.text }}>Slippage Tolerance</h3>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              {[0.1, 0.5, 1.0].map(val => (
                <button key={val} onClick={() => { setSlippage(val); setCustomSlippage(""); }}
                  style={{ flex: 1, padding: "10px", borderRadius: "10px", border: slippage === val && !customSlippage ? `2px solid ${T.yellow}` : `1px solid ${T.border}`, backgroundColor: slippage === val && !customSlippage ? "#fffbeb" : T.card, fontWeight: "bold", cursor: "pointer", color: T.text }}>
                  {val}%
                </button>
              ))}
            </div>
            <input type="number" placeholder="Custom %" value={customSlippage}
              onChange={(e) => { setCustomSlippage(e.target.value); if (e.target.value) setSlippage(parseFloat(e.target.value) || 0.5); }}
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${T.border}`, marginBottom: "12px", boxSizing: "border-box", backgroundColor: T.input, color: T.text }} />
            {slippage > 5 && <p style={{ fontSize: "12px", color: T.red, margin: "0 0 12px 0" }}>⚠️ Slippage terlalu tinggi — risiko kerugian besar!</p>}
            <button onClick={() => setShowSlippageModal(false)} style={btnYellow}>Simpan</button>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ position: "fixed", top: "80px", right: "20px", backgroundColor: T.card, padding: "12px 20px", borderRadius: "12px", border: `1px solid ${T.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", zIndex: 1000, fontWeight: "bold", color: T.text, maxWidth: "320px" }}>
          {toast.icon} {toast.msg}
        </div>
      )}

      {/* TICKER */}
      <div style={{ display: "flex", gap: "20px", justifyContent: "center", padding: "8px 20px", backgroundColor: T.card, borderBottom: `1px solid ${T.border}`, fontSize: "12px", color: T.sub }}>
        <span>LTC/USD <span style={{ color: parseFloat(ltcData.change) >= 0 ? T.green : T.red, fontWeight: "bold" }}>${ltcData.price}</span></span>
        <span>24h <span style={{ color: parseFloat(ltcData.change) >= 0 ? T.green : T.red, fontWeight: "bold" }}>{ltcData.change}%</span></span>
        <span>LTC Tx Fee <span style={{ color: T.text, fontWeight: "bold" }}>9 sat/byte</span></span>
        {poolReserves.reserveA > 0 && (
          <span>Pool TVL <span style={{ color: T.green, fontWeight: "bold" }}>${(poolReserves.reserveA + poolReserves.reserveB).toFixed(0)}</span></span>
        )}
      </div>

      {/* BANNER */}
      <div style={{ backgroundColor: "#fffbeb", borderBottom: "1px solid #fef3c7", padding: "10px 20px", display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", fontSize: "12px", color: "#b45309", textAlign: "center" }}>
        <AlertCircle size={14} color="#d97706" />
        <strong>"The First DEX on LitVM Network with Integrated Impermanent Loss Risk Simulator."</strong>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>

        {/* HEADER */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", paddingBottom: "20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <FreesiaLogoLight />
            <div>
              <h1 style={{ fontSize: "22px", margin: 0, fontWeight: "900", color: T.text }}>Freesia DEX</h1>
              <span style={{ fontSize: "12px", color: T.green, display: "flex", alignItems: "center", gap: "4px" }}>
                <CheckCircle2 size={12} /> LitVM Live
                {account && !onCorrectNetwork && <span style={{ color: T.red, marginLeft: "8px" }}>⚠ Network Salah</span>}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            {/* ✨ DARK MODE TOGGLE */}
            <button onClick={() => setDarkMode(d => !d)} style={iconBtn(darkMode)} title="Dark/Light Mode">
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            {/* ✨ ADDRESS BOOK */}
            <button onClick={() => setShowAddressBook(true)} style={iconBtn(false)} title="Address Book">
              <BookMarked size={14} />
            </button>
            {/* ✨ PRICE ALERTS */}
            <button onClick={() => setShowAlertModal(true)} style={iconBtn(priceAlerts.filter(a => !a.triggered).length > 0)} title="Price Alerts">
              <Bell size={14} />
              {priceAlerts.filter(a => !a.triggered).length > 0 && (
                <span style={{ backgroundColor: T.red, color: "#fff", borderRadius: "50%", width: "16px", height: "16px", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {priceAlerts.filter(a => !a.triggered).length}
                </span>
              )}
            </button>
            <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: T.text, textDecoration: "none", fontSize: "20px", fontWeight: "bold" }}>𝕏</a>
            <button onClick={connectWallet} disabled={connecting} style={{ backgroundColor: T.yellow, color: "#111827", border: "none", padding: "10px 18px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", opacity: connecting ? 0.7 : 1 }}>
              {connecting ? "Menghubungkan..." : account ? shortAddr(account) : "Hubungkan Dompet"}
            </button>
          </div>
        </header>

        {/* ✨ ADDRESS BOOK PANEL */}
        {showAddressBook && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 997, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setShowAddressBook(false)}>
            <div style={{ backgroundColor: T.card, borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "420px", border: `1px solid ${T.border}`, maxHeight: "80vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
              <h3 style={{ marginTop: 0, color: T.text, display: "flex", alignItems: "center", gap: "8px" }}><BookMarked size={18} /> Address Book</h3>
              <p style={{ fontSize: "12px", color: T.sub, marginBottom: "16px" }}>Simpan alamat wallet favoritmu. Tersimpan di browser lokal.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                <input placeholder="Label (cth: My LP Wallet)" value={newAddrLabel} onChange={e => setNewAddrLabel(e.target.value)}
                  style={{ padding: "10px 14px", borderRadius: "10px", border: `1px solid ${T.border}`, backgroundColor: T.input, color: T.text }} />
                <input placeholder="0x..." value={newAddrValue} onChange={e => setNewAddrValue(e.target.value)}
                  style={{ padding: "10px 14px", borderRadius: "10px", border: `1px solid ${T.border}`, backgroundColor: T.input, color: T.text }} />
                <button onClick={addAddress} style={{ ...btnYellow, padding: "10px" }}>+ Simpan Alamat</button>
              </div>
              {addressBook.length === 0 ? (
                <p style={{ color: T.sub, textAlign: "center", fontSize: "13px" }}>Belum ada alamat tersimpan.</p>
              ) : (
                addressBook.map(entry => (
                  <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", borderRadius: "12px", backgroundColor: T.input, border: `1px solid ${T.border}`, marginBottom: "8px" }}>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "13px", color: T.text }}>{entry.label}</div>
                      <div style={{ fontSize: "11px", color: T.sub, fontFamily: "monospace" }}>{shortAddr(entry.address)}</div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => copyAddress(entry.address)} style={{ background: "none", border: "none", cursor: "pointer", color: T.sub }}><Copy size={14} /></button>
                      <button onClick={() => removeAddress(entry.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.red }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ✨ PRICE ALERT PANEL */}
        {showAlertModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 997, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setShowAlertModal(false)}>
            <div style={{ backgroundColor: T.card, borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "400px", border: `1px solid ${T.border}` }} onClick={e => e.stopPropagation()}>
              <h3 style={{ marginTop: 0, color: T.text, display: "flex", alignItems: "center", gap: "8px" }}><Bell size={18} /> LTC Price Alerts</h3>
              <p style={{ fontSize: "12px", color: T.sub }}>Set notifikasi saat harga LTC/USD menyentuh target kamu.</p>
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <select value={alertDirection} onChange={e => setAlertDirection(e.target.value)}
                  style={{ padding: "10px", borderRadius: "10px", border: `1px solid ${T.border}`, backgroundColor: T.input, color: T.text, fontWeight: "bold" }}>
                  <option value="above">Naik ke atas</option>
                  <option value="below">Turun ke bawah</option>
                </select>
                <input type="number" placeholder="Target harga ($)" value={alertTarget} onChange={e => setAlertTarget(e.target.value)}
                  style={{ flex: 1, padding: "10px", borderRadius: "10px", border: `1px solid ${T.border}`, backgroundColor: T.input, color: T.text }} />
              </div>
              <button onClick={addAlert} style={{ ...btnYellow, padding: "12px", marginBottom: "16px" }}>+ Set Alert</button>
              {priceAlerts.length === 0 ? (
                <p style={{ color: T.sub, textAlign: "center", fontSize: "13px" }}>Belum ada alert aktif.</p>
              ) : (
                priceAlerts.map(alert => (
                  <div key={alert.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: "10px", backgroundColor: alert.triggered ? "#ecfdf5" : T.input, border: `1px solid ${alert.triggered ? T.green : T.border}`, marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", color: T.text }}>
                      {alert.triggered ? "✅" : "⏳"} LTC {alert.direction === "above" ? "↑ >" : "↓ <"} ${alert.target}
                    </span>
                    <button onClick={() => removeAlert(alert.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.red }}><Trash2 size={14} /></button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "30px", flexWrap: "wrap", justifyContent: "center" }}>
          {["swap", "mint", "pool", "mbg staking", "history"].map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{ padding: "10px 20px", border: "none", borderRadius: "12px", backgroundColor: activeTab === t ? T.yellow : darkMode ? "#1e293b" : "#f3f4f6", color: activeTab === t ? "#111827" : T.sub, fontWeight: "bold", cursor: "pointer", fontSize: "13px", textTransform: "uppercase" }}>
              {t === "mbg staking" ? "MBG STAKING 💎" : t === "history" ? "HISTORY 📋" : t}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>

          {/* TAB SWAP */}
          {activeTab === "swap" && (
            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <strong style={{ color: T.text }}>Tukar Token</strong>
                <button onClick={() => setShowSlippageModal(true)} style={iconBtn(false)}>
                  <Settings size={14} /> Slippage {slippage}%
                </button>
              </div>
              <div style={inputBoxStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: T.sub, marginBottom: "8px" }}><span>Anda Membayar</span><span>Saldo: {fromBalance}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <input type="number" placeholder="0.00" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} style={bigInputStyle} />
                  <select value={fromSym} onChange={(e) => setFromSym(e.target.value)} style={selectStyle}>
                    <option value="USDC">💵 USDC</option>
                    <option value="DAI">◈ DAI</option>
                    <option value="zkLTC">⚡ zkLTC</option>
                  </select>
                </div>
              </div>
              <div style={{ textAlign: "center", margin: "-10px 0", position: "relative", zIndex: 2 }}>
                <button onClick={() => { setFromSym(toSym); setToSym(fromSym); setAmountIn(""); }} style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: "50%", padding: "8px", cursor: "pointer", color: T.text }}>
                  <ArrowUpDown size={14} />
                </button>
              </div>
              <div style={inputBoxStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: T.sub, marginBottom: "8px" }}><span>Menerima (Estimasi)</span><span>Saldo: {toBalance}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <input type="text" placeholder="0.00" value={amountOutPreview} readOnly style={{ ...bigInputStyle, color: T.sub }} />
                  <div style={{ fontWeight: "bold", color: T.text }}>{toSym === "USDC" ? "💵 USDC" : toSym === "DAI" ? "◈ DAI" : "⚡ zkLTC"}</div>
                </div>
              </div>

              {/* ✨ GAS ESTIMATOR */}
              {gasEstimate && amountIn && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: "12px", backgroundColor: T.input, border: `1px solid ${T.border}`, marginBottom: "12px", fontSize: "12px" }}>
                  <span style={{ color: T.sub, display: "flex", alignItems: "center", gap: "4px" }}><Zap size={12} /> Estimasi Gas</span>
                  <span style={{ fontWeight: "bold", color: T.text }}>{gasEstimate.eth} zkLTC {gasEstimate.usd !== "0.0000" && <span style={{ color: T.sub }}>(~${gasEstimate.usd})</span>}</span>
                </div>
              )}

              {/* Price Impact */}
              {amountIn && parseFloat(amountIn) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: priceImpact > 3 ? T.red : T.sub, marginBottom: "12px" }}>
                  <span>Price Impact</span>
                  <span style={{ fontWeight: "bold" }}>{priceImpact.toFixed(2)}%</span>
                </div>
              )}
              {priceImpact > 3 && (
                <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "10px 14px", fontSize: "12px", color: T.red, marginBottom: "12px" }}>
                  ⚠️ Price impact tinggi! Swap ini akan menggerakkan harga secara signifikan.
                </div>
              )}

              <button onClick={handleSwap} disabled={swapLoading || !amountIn} style={{ ...btnYellow, opacity: swapLoading || !amountIn ? 0.6 : 1 }}>
                {swapLoading ? "⏳ Swapping..." : !account ? "Hubungkan Dompet Dulu" : "Tukar Token"}
              </button>
            </div>
          )}

          {/* TAB MINT */}
          {activeTab === "mint" && (
            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, textAlign: "center", color: T.text }}>Wallet Faucet Hub</h3>
              <p style={{ fontSize: "12px", color: T.sub, textAlign: "center", marginBottom: "20px" }}>Isi saldo wallet tesmu langsung ke LitVM Node.</p>
              {Object.keys(TOKEN_LIST).map((sym) => (
                <div key={sym} style={{ backgroundColor: T.input, padding: "16px", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", border: `1px solid ${T.border}` }}>
                  <div>
                    <strong style={{ color: T.text }}>{TOKEN_LIST[sym].logo} {sym}</strong>
                    <div style={{ fontSize: "12px", color: T.green, fontWeight: "500" }}>Saldo: {mintBalances[sym] || "0.00"} {sym}</div>
                  </div>
                  <button onClick={() => handleMintToken(sym)} disabled={mintingSym === sym}
                    style={{ backgroundColor: T.yellow, border: "none", padding: "8px 16px", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" }}>
                    {mintingSym === sym ? "⏳..." : "Mint 10k"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB POOL */}
          {activeTab === "pool" && (
            <div style={{ ...cardStyle, maxWidth: "520px" }}>
              <h3 style={{ marginTop: 0, color: T.text }}>Active Liquidity Pools</h3>
              <div style={{ marginBottom: "20px", padding: "14px", backgroundColor: T.input, borderRadius: "16px", border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: "12px", fontWeight: "bold", color: T.sub, marginBottom: "8px" }}>Live Pool Liquidity Depth:</div>
                <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse", color: T.text }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}`, color: T.sub }}>
                      <th style={{ textAlign: "left", paddingBottom: "6px" }}>Pool Pair</th>
                      <th style={{ textAlign: "right", paddingBottom: "6px" }}>TVL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "8px 0", fontWeight: "600" }}>💵 USDC / ◈ DAI</td>
                      <td style={{ textAlign: "right", color: T.green, fontWeight: "bold" }}>${communityLiquidity.usdcDaiTVL.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", fontWeight: "600" }}>⚡ zkLTC / 💵 USDC</td>
                      <td style={{ textAlign: "right", color: T.green, fontWeight: "bold" }}>${communityLiquidity.zkLtcUsdcTVL.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", fontWeight: "bold", color: T.sub, display: "block", marginBottom: "6px" }}>Pilih Pool:</label>
                <select value={selectedPool} onChange={(e) => setSelectedPool(e.target.value)}
                  style={{ width: "100%", padding: "12px", borderRadius: "12px", border: `1px solid ${T.border}`, backgroundColor: T.card, color: T.text, fontWeight: "bold" }}>
                  <option value="USDC-DAI">USDC + DAI Pool</option>
                  <option value="zkLTC-USDC">zkLTC + USDC Pool</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                <input type="number" placeholder={`Jumlah ${selectedPool.split("-")[0]}`} value={amountAInput} onChange={e => setAmountAInput(e.target.value)}
                  style={{ padding: "14px", backgroundColor: T.input, border: `1px solid ${T.border}`, borderRadius: "12px", color: T.text }} />
                <input type="number" placeholder={`Jumlah ${selectedPool.split("-")[1]}`} value={amountBInput} onChange={e => setAmountBInput(e.target.value)}
                  style={{ padding: "14px", backgroundColor: T.input, border: `1px solid ${T.border}`, borderRadius: "12px", color: T.text }} />
                <button onClick={handleAddLiquidity} disabled={poolLoading} style={btnYellow}>
                  {poolLoading ? "⏳ Injecting..." : "Add Active Liquidity"}
                </button>
              </div>
              {/* IL Simulator */}
              <div style={{ padding: "16px", borderRadius: "16px", border: `1px solid ${T.border}`, backgroundColor: T.input }}>
                <strong style={{ color: T.text }}>Simulator Risiko (IL)</strong>
                <input type="range" min="-90" max="200" step="10" value={priceChange} onChange={(e) => setPriceChange(Number(e.target.value))} style={{ width: "100%", accentColor: T.yellow, margin: "12px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: T.sub }}>
                  <span>Perubahan Harga: <strong style={{ color: T.text }}>{priceChange}%</strong></span>
                  <span>IL: <strong style={{ color: T.red }}>{Math.abs(priceChange * 0.04).toFixed(2)}%</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* TAB MBG STAKING */}
          {activeTab === "mbg staking" && (
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <Coins size={24} color={T.yellow} />
                <h3 style={{ margin: 0, fontWeight: "800", color: T.text }}>MBG Staking Engine</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div style={{ padding: "14px", backgroundColor: T.input, borderRadius: "16px", border: `1px solid ${T.border}`, textAlign: "center" }}>
                  <span style={{ fontSize: "12px", color: T.sub }}>Pool TVL</span>
                  <strong style={{ display: "block", fontSize: "18px", color: T.text }}>$250,400</strong>
                </div>
                <div style={{ padding: "14px", backgroundColor: T.input, borderRadius: "16px", border: `1px solid ${T.border}`, textAlign: "center" }}>
                  <span style={{ fontSize: "12px", color: T.sub }}>Reward APY</span>
                  <strong style={{ display: "block", fontSize: "18px", color: T.green }}>32.50%</strong>
                </div>
              </div>
              <div style={{ padding: "16px", backgroundColor: "#fffbeb", borderRadius: "16px", border: "1px solid #fef3c7", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "12px", color: "#b45309" }}>MBG Live Dynamic Yield</span>
                    <strong style={{ display: "block", fontSize: "24px", fontFamily: "monospace", color: "#111827" }}>{mbgRewards.toFixed(6)}</strong>
                  </div>
                  <button onClick={() => setMbgRewards(0)} disabled={mbgRewards <= 0}
                    style={{ backgroundColor: mbgRewards > 0 ? T.yellow : T.border, border: "none", padding: "10px 18px", borderRadius: "12px", fontWeight: "bold", cursor: mbgRewards > 0 ? "pointer" : "not-allowed" }}>
                    Claim
                  </button>
                </div>
              </div>
              <div style={{ padding: "14px", backgroundColor: T.input, borderRadius: "16px", border: `1px solid ${T.border}`, marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", color: T.sub }}><Wallet size={14} /> My Staked LP:</span>
                <strong style={{ color: T.text }}>{myStakedValue.toFixed(2)} LP</strong>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <input type="number" placeholder="Jumlah LP Token" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)}
                  style={{ padding: "14px", backgroundColor: T.input, border: `1px solid ${T.border}`, borderRadius: "12px", color: T.text, fontWeight: "bold" }} />
                <button onClick={() => { if (!stakeAmount) return; setMyStakedValue(prev => prev + parseFloat(stakeAmount)); setStakeAmount(""); }}
                  style={{ ...btnYellow, backgroundColor: "#111827", color: "#fff" }}>
                  Lock & Stake
                </button>
              </div>
            </div>
          )}

          {/* ✨ TAB HISTORY */}
          {activeTab === "history" && (
            <div style={{ ...cardStyle, maxWidth: "560px" }}>
              <h3 style={{ marginTop: 0, color: T.text, display: "flex", alignItems: "center", gap: "8px" }}>📋 Riwayat Transaksi</h3>
              <p style={{ fontSize: "12px", color: T.sub, marginBottom: "16px" }}>Transaksi sesi ini. Reset saat halaman di-refresh.</p>
              {txHistory.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: T.sub }}>
                  <TrendingUp size={32} style={{ marginBottom: "12px", opacity: 0.4 }} />
                  <p style={{ fontSize: "13px" }}>Belum ada transaksi. Mulai swap atau mint!</p>
                </div>
              ) : (
                txHistory.map(tx => (
                  <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: "12px", backgroundColor: T.input, border: `1px solid ${T.border}`, marginBottom: "8px" }}>
                    <div>
                      <span style={{ fontWeight: "bold", fontSize: "13px", color: T.text }}>{tx.type}</span>
                      <div style={{ fontSize: "12px", color: T.sub }}>{tx.detail}</div>
                    </div>
                    <span style={{ fontSize: "11px", color: T.sub, whiteSpace: "nowrap" }}>{tx.time}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer style={{ textAlign: "center", marginTop: "80px", padding: "30px 0", borderTop: `1px solid ${T.border}` }}>
          <p style={{ fontSize: "11px", fontWeight: "800", color: T.sub }}>POWERED BY FREESIA NETWORK</p>
          <p style={{ fontSize: "11px", color: T.sub }}>
            Dibangun oleh <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: T.sub, fontWeight: "bold" }}>@0xzackbh</a>
          </p>
        </footer>
      </div>
    </div>
  );
}

function FreesiaLogoLight() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
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