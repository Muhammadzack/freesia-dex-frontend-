import React, { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import {
  ArrowUpDown, Settings, CheckCircle2, AlertCircle, X,
  Coins, Wallet, Moon, Sun, Share2, Zap, TrendingUp,
  ChevronDown, ExternalLink, Info, Clock, BarChart3, Shield,
  MessageCircle, FileText, Globe, HelpCircle,
  Search, Sliders, RefreshCw, ArrowRight, Layers, Percent,
  Activity, DollarSign, CandlestickChart, LayoutDashboard,
  Trophy, Award, Plus, Minus, Home, Menu
} from "lucide-react";

// ===== Inline SVG replacements for removed lucide-react brand icons =====
const GitHubIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
    <path d="M9 18c-4.51 2-5-2-7-2"/>
  </svg>
);

const TwitterIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);
// ========================================================================

const TOKEN_LIST = {
  zkLTC: { name: "zkLTC", logo: "https://cryptologos.cc/logos/litecoin-ltc-logo.png", decimals: 18, address: "0x0000000000000000000000000000000000000000" },
  USDC:  { name: "USDC",  logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png", decimals: 6,  address: "0x1111111111111111111111111111111111111111" },
  DAI:   { name: "DAI",   logo: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png", decimals: 18, address: "0x2222222222222222222222222222222222222222" },
  MBG:   { name: "MBG",   logo: "https://cryptologos.cc/logos/sakura-sakura-logo.png", decimals: 18, address: "0x3333333333333333333333333333333333333333" },
};

const LITVM_RPC = "https://rpc-litvm.pro";
const CHAIN_ID = 4441;

const CONTRACT_ABI = [
  "function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minOut) external",
  "function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB) external",
  "function removeLiquidity(uint256 lpAmount) external",
  "function stakeLP(uint256 amount) external",
  "function unstakeLP(uint256 amount) external",
  "function claimMBG() external",
  "function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) view returns (uint256)",
  "function getReserves() view returns (uint256, uint256)",
  "function lpToken() view returns (address)",
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function mint(address token, uint256 amount) external",
  "function getUserLPBalance(address) view returns (uint256)",
  "function getPoolInfo() view returns (uint256 reserveA, uint256 reserveB, uint256 totalLP, uint256 feeEarned)",
  "event Swap(address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)",
  "event LiquidityAdded(address indexed user, uint256 amountA, uint256 amountB, uint256 lpTokens)",
  "event LiquidityRemoved(address indexed user, uint256 lpAmount, uint256 amountA, uint256 amountB)",
  "event Staked(address indexed user, uint256 amount)",
  "event Unstaked(address indexed user, uint256 amount)",
  "event MBGClaimed(address indexed user, uint256 amount)",
  "event Minted(address indexed user, address token, uint256 amount)",
];

const CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890";

const FEE_TIERS = [
  { name: "0.05%", desc: "Best for stable pairs", color: "#10b981" },
  { name: "0.3%", desc: "Best for most pairs", color: "#3b82f6" },
  { name: "1%", desc: "Best for exotic pairs", color: "#8b5cf6" },
];

const FEATURES = [
  { icon: Zap, title: "Lightning Swaps", desc: "Execute trades in under 2 seconds with zk-rollup settlement." },
  { icon: Shield, title: "IL Simulator", desc: "Preview impermanent loss risk before adding liquidity." },
  { icon: TrendingUp, title: "Live Charts", desc: "Integrated TradingView charts for all trading pairs." },
  { icon: Award, title: "MBG Rewards", desc: "Earn MBG tokens by staking LP and providing liquidity." },
];

const STEPS = [
  { num: "01", icon: Wallet, title: "Connect Wallet", desc: "Link your MetaMask or WalletConnect to LitVM Testnet." },
  { num: "02", icon: Coins, title: "Mint Test Tokens", desc: "Get free zkLTC, USDC, DAI from the built-in faucet." },
  { num: "03", icon: ArrowUpDown, title: "Start Trading", desc: "Swap tokens or add liquidity to earn fees & MBG." },
];

const BADGES = [
  { name: "First Swap", icon: Zap, unlocked: false },
  { name: "LP Provider", icon: Layers, unlocked: false },
  { name: "Staker", icon: Trophy, unlocked: false },
  { name: "Volume King", icon: TrendingUp, unlocked: false },
  { name: "Risk Manager", icon: Shield, unlocked: false },
];

const TABS = [
  { id: "swap", label: "Swap", icon: ArrowUpDown },
  { id: "mint", label: "Faucet", icon: Coins },
  { id: "pool", label: "Pool", icon: Layers },
  { id: "staking", label: "Staking", icon: Trophy },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "history", label: "History", icon: Clock },
];

const THEME = {
  light: {
    bg: "#f8fafc",
    card: "#ffffff",
    text: "#0f172a",
    sub: "#64748b",
    border: "#e2e8f0",
    accent: "#7c3aed",
    accentHover: "#6d28d9",
    input: "#f1f5f9",
    green: "#10b981",
    red: "#ef4444",
  },
  dark: {
    bg: "#0f172a",
    card: "#1e293b",
    text: "#f8fafc",
    sub: "#94a3b8",
    border: "#334155",
    accent: "#8b5cf6",
    accentHover: "#7c3aed",
    input: "#1e293b",
    green: "#34d399",
    red: "#f87171",
  },
};

const Users = ({ size }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

const FreesiaLogo = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }}>
    <defs>
      <linearGradient id="fl1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#5EEAD4"/>
        <stop offset="100%" stopColor="#0E7490"/>
      </linearGradient>
      <linearGradient id="fl2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#2DD4BF"/>
        <stop offset="100%" stopColor="#155E75"/>
      </linearGradient>
    </defs>
    <path d="M100 100 C100 40 130 20 150 50 C170 80 130 90 100 100Z" fill="url(#fl1)" transform="rotate(0 100 100)"/>
    <path d="M100 100 C100 40 130 20 150 50 C170 80 130 90 100 100Z" fill="url(#fl2)" transform="rotate(60 100 100)"/>
    <path d="M100 100 C100 40 130 20 150 50 C170 80 130 90 100 100Z" fill="url(#fl1)" transform="rotate(120 100 100)"/>
    <path d="M100 100 C100 40 130 20 150 50 C170 80 130 90 100 100Z" fill="url(#fl2)" transform="rotate(180 100 100)"/>
    <path d="M100 100 C100 40 130 20 150 50 C170 80 130 90 100 100Z" fill="url(#fl1)" transform="rotate(240 100 100)"/>
    <path d="M100 100 C100 40 130 20 150 50 C170 80 130 90 100 100Z" fill="url(#fl2)" transform="rotate(300 100 100)"/>
    <path d="M100 100 C100 60 115 50 125 65 C135 80 115 85 100 100Z" fill="#fff" opacity="0.95" transform="rotate(30 100 100)"/>
    <path d="M100 100 C100 60 115 50 125 65 C135 80 115 85 100 100Z" fill="#fff" opacity="0.95" transform="rotate(90 100 100)"/>
    <path d="M100 100 C100 60 115 50 125 65 C135 80 115 85 100 100Z" fill="#fff" opacity="0.95" transform="rotate(150 100 100)"/>
    <path d="M100 100 C100 60 115 50 125 65 C135 80 115 85 100 100Z" fill="#fff" opacity="0.95" transform="rotate(210 100 100)"/>
    <path d="M100 100 C100 60 115 50 125 65 C135 80 115 85 100 100Z" fill="#fff" opacity="0.95" transform="rotate(270 100 100)"/>
    <path d="M100 100 C100 60 115 50 125 65 C135 80 115 85 100 100Z" fill="#fff" opacity="0.95" transform="rotate(330 100 100)"/>
    <circle cx="100" cy="100" r="8" fill="#0E7490"/>
  </svg>
);

export default function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [onCorrectNetwork, setOnCorrectNetwork] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState("swap");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [showChart, setShowChart] = useState(false);

  const [fromToken, setFromToken] = useState("zkLTC");
  const [toToken, setToToken] = useState("USDC");
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("0.00");
  const [priceImpact, setPriceImpact] = useState(0);
  const [gasEstimate, setGasEstimate] = useState(null);
  const [slippage, setSlippage] = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState("");
  const [showSlippageModal, setShowSlippageModal] = useState(false);
  const [showTokenSelector, setShowTokenSelector] = useState(null);
  const [feeTier, setFeeTier] = useState(1);

  const [mintBalances, setMintBalances] = useState({});
  const [userLPBalance, setUserLPBalance] = useState(0);
  const [totalLPSupply, setTotalLPSupply] = useState(0);
  const [feeEarned, setFeeEarned] = useState(0);
  const [poolReserves, setPoolReserves] = useState({ reserveA: 0, reserveB: 0 });
  const [selectedPool, setSelectedPool] = useState("zkLTC-USDC");
  const [amountAInput, setAmountAInput] = useState("");
  const [amountBInput, setAmountBInput] = useState("");
  const [priceChange, setPriceChange] = useState(0);
  const [ilResult, setIlResult] = useState({ ilPercent: 0, lossAmount: 0 });

  const [stakeAmount, setStakeAmount] = useState("");
  const [myStakedValue, setMyStakedValue] = useState(0);
  const [mbgRewards, setMbgRewards] = useState(0);

  const [txHistory, setTxHistory] = useState(() => {
    const saved = localStorage.getItem("freesia_tx_history");
    return saved ? JSON.parse(saved) : [];
  });
  const [toast, setToast] = useState(null);
  const [swapCount, setSwapCount] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [poolCount, setPoolCount] = useState(0);

  const [showShareModal, setShowShareModal] = useState(false);
  const [lastSwap, setLastSwap] = useState(null);

  const [showRemoveLPModal, setShowRemoveLPModal] = useState(false);
  const [removeLPAmount, setRemoveLPAmount] = useState("");

  const [ltcData, setLtcData] = useState({ price: "0.00", change: "0.00" });
  const [communityLiquidity, setCommunityLiquidity] = useState({ usdcDaiTVL: 0, zkLtcUsdcTVL: 0 });

  const [animatedStats, setAnimatedStats] = useState({ tvl: 0, volume: 0, users: 0, tx: 0 });

  const toastTimer = useRef(null);
  const T = darkMode ? THEME.dark : THEME.light;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) setAccount(accounts[0]);
        else setAccount(null);
      });
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  }, []);

  useEffect(() => {
    const fetchLtc = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd&include_24hr_change=true", { mode: "no-cors" });
        const data = await res.json();
        setLtcData({ price: data.litecoin.usd.toFixed(2), change: data.litecoin.usd_24h_change.toFixed(2) });
      } catch {
        setLtcData({ price: "78.42", change: "+2.34" });
      }
    };
    fetchLtc();
    const interval = setInterval(fetchLtc, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const target = { tvl: 1245000, volume: 8900000, users: 4200, tx: 156000 };
    const duration = 2000;
    const start = Date.now();
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimatedStats({
        tvl: Math.floor(target.tvl * ease),
        volume: Math.floor(target.volume * ease),
        users: Math.floor(target.users * ease),
        tx: Math.floor(target.tx * ease),
      });
      if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
  }, []);

  useEffect(() => {
    const reserveA = 500000;
    const reserveB = 350000;
    const totalLP = 420000;
    const k = reserveA * reserveB;
    const newReserveA = reserveA * (1 + priceChange / 100);
    const newReserveB = k / newReserveA;
    const il = (2 * Math.sqrt(newReserveA / reserveA) / (1 + newReserveA / reserveA) - 1) * 100;
    const loss = (1000 * Math.abs(il)) / 100;
    setIlResult({ ilPercent: Math.abs(il), lossAmount: loss });
    setPoolReserves({ reserveA, reserveB });
    setTotalLPSupply(totalLP);
    setCommunityLiquidity({ usdcDaiTVL: 450000, zkLtcUsdcTVL: 890000 });
  }, [priceChange]);

  const showToast = useCallback((msg, icon = "✅") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, icon });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) { showToast("Install MetaMask!", "⚠️"); return; }
    try {
      const prov = new ethers.BrowserProvider(window.ethereum);
      await prov.send("eth_requestAccounts", []);
      const sig = await prov.getSigner();
      const addr = await sig.getAddress();
      const net = await prov.getNetwork();
      setProvider(prov);
      setSigner(sig);
      setAccount(addr);
      setOnCorrectNetwork(Number(net.chainId) === CHAIN_ID);
      const ctr = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, sig);
      setContract(ctr);
      showToast("Wallet connected!", "✅");
      await refreshBalances(ctr, addr);
    } catch (e) {
      showToast("Connection failed", "❌");
      console.error(e);
    }
  };

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1159" }],
      });
    } catch {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: "0x1159",
          chainName: "LitVM Testnet",
          rpcUrls: [LITVM_RPC],
          nativeCurrency: { name: "zkLTC", symbol: "zkLTC", decimals: 18 },
          blockExplorerUrls: ["https://liteforge.explorer.caldera.xyz/"],
        }],
      });
    }
  };

  const refreshBalances = async (ctr, addr, prov) => {
    try {
      const prov = new ethers.BrowserProvider(window.ethereum);
      if (!window.ethereum || !addr) return;
      const balances = {};
      for (const [sym, info] of Object.entries(TOKEN_LIST)) {
        if (sym === "zkLTC") {
          const bal = await prov.getBalance(addr);
          balances[sym] = parseFloat(ethers.formatEther(bal)).toFixed(4);
        } else {
          const tokenContract = new ethers.Contract(info.address, ["function balanceOf(address) view returns (uint256)"], prov);
          const bal = await tokenContract.balanceOf(addr);
          balances[sym] = parseFloat(ethers.formatUnits(bal, info.decimals)).toFixed(4);
        }
      }
      setMintBalances(balances);
      console.log("Balances refreshed:", balances);
      const lpBal = await ctr.getUserLPBalance(addr);
      setUserLPBalance(parseFloat(ethers.formatEther(lpBal)));
      const poolInfo = await ctr.getPoolInfo();
      setPoolReserves({ reserveA: parseFloat(ethers.formatEther(poolInfo.reserveA)), reserveB: parseFloat(ethers.formatEther(poolInfo.reserveB)) });
      setTotalLPSupply(parseFloat(ethers.formatEther(poolInfo.totalLP)));
      setFeeEarned(parseFloat(ethers.formatEther(poolInfo.feeEarned)));
    } catch (e) {
      console.error("Refresh balances error:", e);
    }
  };

  const calculateSwap = async () => {
    if (!contract || !amountIn || parseFloat(amountIn) <= 0) { setAmountOut("0.00"); setPriceImpact(0); setGasEstimate(null); return; }
    try {
      const fromInfo = TOKEN_LIST[fromToken];
      const toInfo = TOKEN_LIST[toToken];
      const amountInWei = ethers.parseUnits(amountIn, fromInfo.decimals);
      const amountOutWei = await contract.getAmountOut(fromInfo.address, toInfo.address, amountInWei);
      const out = parseFloat(ethers.formatUnits(amountOutWei, toInfo.decimals));
      setAmountOut(out.toFixed(4));
      const reserveA = poolReserves.reserveA || 1;
      const reserveB = poolReserves.reserveB || 1;
      const priceBefore = reserveB / reserveA;
      const priceAfter = (reserveB - out) / (reserveA + parseFloat(amountIn));
      const impact = Math.abs((priceAfter - priceBefore) / priceBefore) * 100;
      setPriceImpact(impact);
      setGasEstimate({ eth: "0.0021", usd: "0.16" });
    } catch (e) {
      console.error("Calculate swap error:", e);
    }
  };

  useEffect(() => { calculateSwap(); }, [amountIn, fromToken, toToken, contract]);

  const handleSwap = async () => {
    if (!contract || !account) { showToast("Connect wallet first!", "⚠️"); return; }
    if (!amountIn || parseFloat(amountIn) <= 0) { showToast("Enter amount!", "⚠️"); return; }
    if (priceImpact > 3) { showToast("Price impact too high!", "⚠️"); return; }
    try {
      const fromInfo = TOKEN_LIST[fromToken];
      const toInfo = TOKEN_LIST[toToken];
      const amountInWei = ethers.parseUnits(amountIn, fromInfo.decimals);
      const minOut = ethers.parseUnits((parseFloat(amountOut) * (1 - slippage / 100)).toFixed(6), toInfo.decimals);
      const tx = await contract.swap(fromInfo.address, toInfo.address, amountInWei, minOut);
      showToast("Swap submitted...", "⏳");
      await tx.wait();
      const outAmt = parseFloat(amountOut).toFixed(4);
      setLastSwap({ fromSym: fromToken, toSym: toToken, amountIn, outAmt });
      setTxHistory(prev => [{ type: "Swap", detail: `${amountIn} ${fromToken} → ${outAmt} ${toToken}`, time: new Date().toLocaleTimeString() }, ...prev]);
      setSwapCount(c => c + 1);
      setTotalVolume(v => v + parseFloat(amountIn));
      showToast(`Swapped ${amountIn} ${fromToken} → ${outAmt} ${toToken}!`, "✅");
      await refreshBalances(contract, account);
      setAmountIn("");
      setAmountOut("0.00");
    } catch (e) {
      showToast("Swap failed!", "❌");
      console.error(e);
    }
  };

  const handleMint = async (sym) => {
    if (!contract || !account) { showToast("Connect wallet first!", "⚠️"); return; }
    try {
      const info = TOKEN_LIST[sym];
      const amount = sym === "USDC" ? "10000" : "1000";
      const amountWei = ethers.parseUnits(amount, info.decimals);
      const tx = await contract.mint(info.address, amountWei);
      showToast(`Minting ${amount} ${sym}...`, "⏳");
      await tx.wait();
      setTxHistory(prev => [{ type: "Mint", detail: `${amount} ${sym}`, time: new Date().toLocaleTimeString() }, ...prev]);
      showToast(`Minted ${amount} ${sym}!`, "✅");
      await refreshBalances(contract, account);
    } catch (e) {
      showToast("Mint failed!", "❌");
      console.error(e);
    }
  };

  const handleAddLiquidity = async () => {
    if (!contract || !account) { showToast("Connect wallet first!", "⚠️"); return; }
    if (!amountAInput || !amountBInput || parseFloat(amountAInput) <= 0 || parseFloat(amountBInput) <= 0) { showToast("Enter both amounts!", "⚠️"); return; }
    try {
      const [symA, symB] = selectedPool.split("-");
      const infoA = TOKEN_LIST[symA];
      const infoB = TOKEN_LIST[symB];
      const amountAWei = ethers.parseUnits(amountAInput, infoA.decimals);
      const amountBWei = ethers.parseUnits(amountBInput, infoB.decimals);
      const tx = await contract.addLiquidity(infoA.address, infoB.address, amountAWei, amountBWei);
      showToast("Adding liquidity...", "⏳");
      await tx.wait();
      setTxHistory(prev => [{ type: "Add Liquidity", detail: `${amountAInput} ${symA} + ${amountBInput} ${symB}`, time: new Date().toLocaleTimeString() }, ...prev]);
      setPoolCount(c => c + 1);
      showToast("Liquidity added!", "✅");
      await refreshBalances(contract, account);
      setAmountAInput(""); setAmountBInput("");
    } catch (e) {
      showToast("Add liquidity failed!", "❌");
      console.error(e);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!contract || !account) { showToast("Connect wallet first!", "⚠️"); return; }
    if (!removeLPAmount || parseFloat(removeLPAmount) <= 0) { showToast("Enter LP amount!", "⚠️"); return; }
    try {
      const lpWei = ethers.parseEther(removeLPAmount);
      const tx = await contract.removeLiquidity(lpWei);
      showToast("Removing liquidity...", "⏳");
      await tx.wait();
      setTxHistory(prev => [{ type: "Remove Liquidity", detail: `${removeLPAmount} LP`, time: new Date().toLocaleTimeString() }, ...prev]);
      showToast("Liquidity removed!", "✅");
      setShowRemoveLPModal(false);
      setRemoveLPAmount("");
      await refreshBalances(contract, account);
    } catch (e) {
      showToast("Remove liquidity failed!", "❌");
      console.error(e);
    }
  };

  const handleStake = async () => {
    if (!contract || !account) { showToast("Connect wallet first!", "⚠️"); return; }
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) { showToast("Enter stake amount!", "⚠️"); return; }
    try {
      const stakeWei = ethers.parseEther(stakeAmount);
      const tx = await contract.stakeLP(stakeWei);
      showToast("Staking LP...", "⏳");
      await tx.wait();
      setTxHistory(prev => [{ type: "Stake", detail: `${stakeAmount} LP`, time: new Date().toLocaleTimeString() }, ...prev]);
      showToast("Staked successfully!", "✅");
      setStakeAmount("");
      await refreshBalances(contract, account);
    } catch (e) {
      showToast("Stake failed!", "❌");
      console.error(e);
    }
  };

  const handleUnstake = async () => {
    if (!contract || !account) { showToast("Connect wallet first!", "⚠️"); return; }
    try {
      const tx = await contract.unstakeLP(ethers.parseEther(myStakedValue.toString()));
      showToast("Unstaking...", "⏳");
      await tx.wait();
      setTxHistory(prev => [{ type: "Unstake", detail: `${myStakedValue.toFixed(4)} LP`, time: new Date().toLocaleTimeString() }, ...prev]);
      showToast("Unstaked successfully!", "✅");
      await refreshBalances(contract, account);
    } catch (e) {
      showToast("Unstake failed!", "❌");
      console.error(e);
    }
  };

  const handleClaimMBG = async () => {
    if (!contract || !account) { showToast("Connect wallet first!", "⚠️"); return; }
    try {
      const tx = await contract.claimMBG();
      showToast("Claiming MBG...", "⏳");
      await tx.wait();
      setTxHistory(prev => [{ type: "Claim", detail: "MBG Rewards", time: new Date().toLocaleTimeString() }, ...prev]);
      showToast("MBG claimed!", "✅");
      await refreshBalances(contract, account);
    } catch (e) {
      showToast("Claim failed!", "❌");
      console.error(e);
    }
  };

  const handleShare = () => {
    if (!lastSwap) return;
    const text = `Just swapped ${lastSwap.amountIn} ${lastSwap.fromSym} → ${lastSwap.outAmt} ${lastSwap.toSym} on Freesia DEX <FreesiaLogo size={20} />\\nBuilt on LitVM Testnet ⚡\\n@0xzackbh #FreesiaDEX`;
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!", "📋");
    setShowShareModal(false);
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setOnCorrectNetwork(true);
    showToast("Wallet disconnected", "👋");
  };

const fromBalance = mintBalances[fromToken] || "0.00";
  const toBalance = mintBalances[toToken] || "0.00";

  const setMax = () => setAmountIn(fromBalance);

  const switchTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setAmountIn("");
    setAmountOut("0.00");
  };

  const features = FEATURES;
  const steps = STEPS;
  const badges = BADGES;
  const tabs = TABS;

  if (showLanding) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "Inter, -apple-system, sans-serif", transition: "background 0.3s, color 0.3s" }}>
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, background: T.bg, zIndex: 100, backdropFilter: "blur(12px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "20px", fontWeight: "800", color: T.accent, letterSpacing: "-0.5px" }}>
            <FreesiaLogo size={24} /> Freesia DEX
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {!isMobile && (
              <div style={{ display: "flex", gap: "24px", marginRight: "16px" }}>
                <a href="#features" style={{ color: T.sub, textDecoration: "none", fontSize: "14px", fontWeight: "600" }}>Features</a>
                <a href="#how" style={{ color: T.sub, textDecoration: "none", fontSize: "14px", fontWeight: "600" }}>How It Works</a>
                <a href="#stats" style={{ color: T.sub, textDecoration: "none", fontSize: "14px", fontWeight: "600" }}>Stats</a>
              </div>
            )}
            <button onClick={() => setDarkMode(!darkMode)} style={{ background: "none", border: "none", color: T.sub, cursor: "pointer", padding: "8px", borderRadius: "8px" }}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {isMobile && (
              <button onClick={() => setShowMobileMenu(!showMobileMenu)} style={{ background: "none", border: "none", color: T.text, cursor: "pointer", padding: "8px" }}>
                {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}
          </div>
        </nav>

        {isMobile && showMobileMenu && (
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.border}`, background: T.card, display: "flex", flexDirection: "column", gap: "8px" }}>
            <a href="#features" onClick={() => setShowMobileMenu(false)} style={{ color: T.text, textDecoration: "none", fontSize: "16px", fontWeight: "600", padding: "8px 0" }}>Features</a>
            <a href="#how" onClick={() => setShowMobileMenu(false)} style={{ color: T.text, textDecoration: "none", fontSize: "16px", fontWeight: "600", padding: "8px 0" }}>How It Works</a>
            <a href="#stats" onClick={() => setShowMobileMenu(false)} style={{ color: T.text, textDecoration: "none", fontSize: "16px", fontWeight: "600", padding: "8px 0" }}>Stats</a>
          </div>
        )}

        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(124, 58, 237, 0.1)", border: `1px solid ${T.accent}`, color: T.accent, padding: "8px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: "700", marginBottom: "32px" }}>
            <Zap size={14} /> Live on LitVM Testnet
          </div>
          <h1 style={{ fontSize: isMobile ? "36px" : "64px", fontWeight: "800", lineHeight: 1.1, marginBottom: "24px", letterSpacing: "-2px" }}>
            The First DEX on <br /><span style={{ color: T.accent }}>LitVM Network</span>
          </h1>
          <p style={{ fontSize: isMobile ? "16px" : "20px", color: T.sub, maxWidth: "600px", margin: "0 auto 40px", lineHeight: 1.6 }}>
            Swap, pool, and stake with the only DEX featuring an integrated Impermanent Loss Risk Simulator.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => setShowLanding(false)} className="btn-primary" style={{ padding: "16px 32px", borderRadius: "12px", fontSize: "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
              Launch App <ArrowRight size={18} />
            </button>
            <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: "16px 32px", borderRadius: "12px", fontSize: "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: T.text }}>
              <TwitterIcon size={18} /> Follow on X
            </a>
          </div>
        </div>

        <div id="stats" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 80px" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: "16px" }}>
            {[
              { label: "Total Value Locked", value: `$${animatedStats.tvl.toLocaleString()}`, icon: Layers },
              { label: "Total Volume", value: `$${animatedStats.volume.toLocaleString()}`, icon: TrendingUp },
              { label: "Active Users", value: animatedStats.users.toLocaleString(), icon: Users },
              { label: "Transactions", value: animatedStats.tx.toLocaleString(), icon: Activity },
            ].map((s, i) => (
              <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "24px", textAlign: "center" }}>
                <div style={{ color: T.accent, marginBottom: "8px" }}><s.icon size={20} /></div>
                <div style={{ fontSize: "24px", fontWeight: "800", marginBottom: "4px" }}>{s.value}</div>
                <div style={{ fontSize: "12px", color: T.sub, fontWeight: "600" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div id="features" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 80px" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>Features</h2>
            <p style={{ color: T.sub, fontSize: "16px" }}>Everything You Need</p>
            <p style={{ color: T.sub, fontSize: "14px", maxWidth: "500px", margin: "8px auto 0" }}>Freesia DEX menyediakan semua tools untuk trading DeFi di jaringan LitVM.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "16px" }}>
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "24px", display: "flex", alignItems: "flex-start", gap: "16px" }}>
                  <div style={{ background: "rgba(124, 58, 237, 0.1)", color: T.accent, padding: "12px", borderRadius: "12px" }}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "4px" }}>{f.title}</h3>
                    <p style={{ color: T.sub, fontSize: "14px", lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div id="how" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 80px" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>Getting Started</h2>
            <p style={{ color: T.sub, fontSize: "16px" }}>How It Works</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "16px" }}>
            {steps.map((step, i) => (
              <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "24px", position: "relative" }}>
                <div style={{ position: "absolute", top: "-16px", left: "24px", background: T.accent, color: "#fff", width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "800" }}>
                  {step.num}
                </div>
                <div style={{ color: T.accent, marginTop: "16px", marginBottom: "12px" }}>
                  {i === 0 ? <Wallet size={28} /> : i === 1 ? <Coins size={28} /> : <ArrowUpDown size={28} />}
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>{step.title}</h3>
                <p style={{ color: T.sub, fontSize: "14px", lineHeight: 1.5, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 80px", textAlign: "center" }}>
          <div style={{ background: `linear-gradient(135deg, ${T.accent}20, ${T.accent}05)`, border: `1px solid ${T.accent}`, borderRadius: "24px", padding: isMobile ? "40px 24px" : "60px", position: "relative", overflow: "hidden" }}>
            <h2 style={{ fontSize: isMobile ? "28px" : "40px", fontWeight: "800", marginBottom: "16px" }}>Ready to Start Trading?</h2>
            <p style={{ color: T.sub, fontSize: "16px", maxWidth: "500px", margin: "0 auto 32px" }}>Bergabung dengan ribuan user yang sudah trading di Freesia DEX.</p>
            <button onClick={() => setShowLanding(false)} className="btn-primary" style={{ padding: "16px 32px", borderRadius: "12px", fontSize: "16px", fontWeight: "700" }}>
              Launch App <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <footer style={{ borderTop: `1px solid ${T.border}`, padding: "48px 24px", background: T.card }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap: "32px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "18px", fontWeight: "800", color: T.accent, marginBottom: "16px" }}>
                <FreesiaLogo size={22} /> Freesia DEX
              </div>
              <p style={{ color: T.sub, fontSize: "14px", lineHeight: 1.6, margin: 0 }}>The first decentralized exchange on LitVM Testnet with integrated IL simulator.</p>
            </div>
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "16px" }}>Product</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <a href="#" onClick={() => setShowLanding(false)} style={{ color: T.sub, textDecoration: "none", fontSize: "14px" }}>Swap</a>
                <a href="#" onClick={() => setShowLanding(false)} style={{ color: T.sub, textDecoration: "none", fontSize: "14px" }}>Pool</a>
                <a href="#" onClick={() => setShowLanding(false)} style={{ color: T.sub, textDecoration: "none", fontSize: "14px" }}>Staking</a>
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "16px" }}>Developers</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <a href="https://github.com/Muhammadzack" target="_blank" rel="noreferrer" className="footer-link" style={{ display: "flex", alignItems: "center", gap: "4px", color: T.sub, textDecoration: "none", fontSize: "14px" }}><GitHubIcon size={12} /> GitHub</a>
                <a href="#" className="footer-link" style={{ display: "flex", alignItems: "center", gap: "4px", color: T.sub, textDecoration: "none", fontSize: "14px" }}><FileText size={12} /> Docs</a>
                <a href="https://liteforge.explorer.caldera.xyz/" target="_blank" rel="noreferrer" className="footer-link" style={{ display: "flex", alignItems: "center", gap: "4px", color: T.sub, textDecoration: "none", fontSize: "14px" }}><ExternalLink size={12} /> Explorer</a>
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "16px" }}>Community</h4>
              <div style={{ display: "flex", gap: "12px" }}>
                <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: "8px", borderRadius: "10px" }}><TwitterIcon size={16} /></a>
                <a href="https://github.com/Muhammadzack" target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: "8px", borderRadius: "10px" }}><GitHubIcon size={16} /></a>
                <a href="#" className="btn-secondary" style={{ padding: "8px", borderRadius: "10px" }}><MessageCircle size={16} /></a>
              </div>
            </div>
          </div>
          <div style={{ textAlign: "center", paddingTop: "24px", borderTop: `1px solid ${T.border}`, marginTop: "32px" }}>
            <p style={{ fontSize: "12px", color: T.sub, margin: 0 }}>© 2026 Freesia DEX. Built by <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: T.accent, textDecoration: "none", fontWeight: "600" }}>@0xzackbh</a> on LitVM Testnet.</p>
          </div>
        </footer>
      </div>
    );
  }

  

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "Inter, -apple-system, sans-serif", transition: "background 0.3s, color 0.3s" }}>
      <style>{`
        .btn-primary { background: ${T.accent}; color: #fff; border: none; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .btn-primary:hover { background: ${T.accentHover}; transform: translateY(-1px); }
        .btn-secondary { background: ${T.input}; color: ${T.text}; border: 1px solid ${T.border}; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .btn-secondary:hover { border-color: ${T.accent}; color: ${T.accent}; }
        .footer-link:hover { color: ${T.accent} !important; }
        .token-btn:hover { border-color: ${T.accent} !important; }
        .tab-btn { background: none; border: none; color: ${T.sub}; cursor: pointer; padding: 8px 16px; border-radius: 8px; font-family: inherit; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
        .tab-btn.active { background: ${T.accent}20; color: ${T.accent}; }
        .tab-btn:hover:not(.active) { color: ${T.text}; background: ${T.input}; }
        input[type=range] { -webkit-appearance: none; width: 100%; height: 6px; border-radius: 3px; background: ${T.border}; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: ${T.accent}; cursor: pointer; border: 2px solid ${T.bg}; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); z-index: 200; display: flex; alignItems: center; justifyContent: center; padding: 16px; }
        .modal-content { background: ${T.card}; border: 1px solid ${T.border}; border-radius: 20px; padding: 24px; width: 100%; max-width: 420px; max-height: 90vh; overflow-y: auto; }
        .ticker { animation: ticker 30s linear infinite; white-space: nowrap; }
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>

      {/* Remove LP Modal */}
      {showRemoveLPModal && (
        <div className="modal-overlay" onClick={() => setShowRemoveLPModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "400px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Remove Liquidity</h3>
              <button onClick={() => setShowRemoveLPModal(false)} style={{ background: "none", border: "none", color: T.sub, cursor: "pointer" }}><X size={20} /></button>
            </div>
            <p style={{ color: T.sub, fontSize: "14px", marginBottom: "16px" }}>Your LP Balance: <strong>{userLPBalance.toFixed(4)}</strong> LP</p>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", color: T.sub, fontWeight: "600", marginBottom: "6px", display: "block" }}>LP Amount to Remove</label>
              <input value={removeLPAmount} onChange={e => setRemoveLPAmount(e.target.value)} style={{ width: "100%", background: "transparent", border: "none", color: T.text, fontSize: "22px", outline: "none", fontWeight: "700", fontFamily: "monospace" }} placeholder="0.0" />
            </div>
            <button onClick={handleRemoveLiquidity} className="btn-primary" style={{ width: "100%", padding: "14px", borderRadius: "12px", fontSize: "16px", fontWeight: "700" }}>
              Remove Liquidity
            </button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && lastSwap && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "400px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Share Swap</h3>
              <button onClick={() => setShowShareModal(false)} style={{ background: "none", border: "none", color: T.sub, cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div style={{ background: T.input, borderRadius: "12px", padding: "16px", marginBottom: "20px", fontSize: "14px", lineHeight: 1.6 }}>
              Just swapped <strong>{lastSwap.amountIn} {lastSwap.fromSym}</strong> → <strong>{lastSwap.outAmt} {lastSwap.toSym}</strong> on <strong>Freesia DEX</strong> <FreesiaLogo size={20} /><br/>
              Built on <strong>LitVM Testnet</strong> ⚡<br/>
              @0xzackbh #FreesiaDEX
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleShare} className="btn-primary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", borderRadius: "10px", fontSize: "14px", fontWeight: "700" }}>
                <TwitterIcon size={16} /> Post ke X
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Token Selector */}
      {showTokenSelector && (
        <div className="modal-overlay" onClick={() => setShowTokenSelector(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "360px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Select Token</h3>
              <button onClick={() => setShowTokenSelector(null)} style={{ background: "none", border: "none", color: T.sub, cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {Object.entries(TOKEN_LIST).map(([sym, info]) => (
                <button key={sym} onClick={() => { if (showTokenSelector === "from") setFromToken(sym); else setToToken(sym); setShowTokenSelector(null); }} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "12px", textAlign: "left", fontSize: "16px", fontWeight: "600" }}>
                  <img src={info.logo} alt={sym} style={{width:24,height:24,borderRadius:"50%"}} />
                  <div>
                    <div>{sym}</div>
                    <div style={{ fontSize: "12px", color: T.sub, fontWeight: "400" }}>{info.name}</div>
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: "12px", color: T.sub }}>{mintBalances[sym] || "0.00"}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Slippage Modal */}
      {showSlippageModal && (
        <div className="modal-overlay" onClick={() => setShowSlippageModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "360px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Slippage Tolerance</h3>
              <button onClick={() => setShowSlippageModal(false)} style={{ background: "none", border: "none", color: T.sub, cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              {[0.1, 0.5, 1.0].map(v => (
                <button key={v} onClick={() => setSlippage(v)} className={slippage === v ? "btn-primary" : "btn-secondary"} style={{ flex: 1, padding: "10px", borderRadius: "10px", fontSize: "14px", fontWeight: "700" }}>
                  {v}%
                </button>
              ))}
            </div>
            <input type="number" placeholder="Custom %" value={customSlippage} onChange={e => { setCustomSlippage(e.target.value); if (e.target.value) setSlippage(parseFloat(e.target.value) || 0.5); }} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: `1px solid ${T.border}`, marginBottom: "12px", boxSizing: "border-box", background: T.input, color: T.text, fontSize: "14px" }} />
            {slippage > 5 && <div style={{ color: T.red, fontSize: "12px", fontWeight: "600" }}>⚠️ Slippage terlalu tinggi!</div>}
            <button onClick={() => setShowSlippageModal(false)} className="btn-primary" style={{ width: "100%", padding: "14px", borderRadius: "12px", fontSize: "16px", fontWeight: "700", marginTop: "8px" }}>
              Save
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: "24px", right: "24px", background: T.card, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "12px 20px", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "600", zIndex: 300, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", animation: "slideIn 0.3s ease" }}>
          <span>{toast.icon}</span> {toast.msg}
        </div>
      )}

      {/* Ticker */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, overflow: "hidden", padding: "8px 0" }}>
        <div className="ticker" style={{ display: "flex", gap: "32px", fontSize: "12px", fontWeight: "600", color: T.sub }}>
          <span>LTC/USD = <span style={{ color: parseFloat(ltcData.change) >= 0 ? T.green : T.red, fontWeight: "700" }}>${ltcData.price}</span></span>
          <span>24h <span style={{ color: parseFloat(ltcData.change) >= 0 ? T.green : T.red, fontWeight: "700" }}>{parseFloat(ltcData.change) >= 0 ? "+" : ""}{ltcData.change}%</span></span>
          <span>Gas 9 sat/byte</span>
          {poolReserves.reserveA > 0 && <span>Pool TVL ${(poolReserves.reserveA + poolReserves.reserveB).toFixed(0)}</span>}
          <span>LTC/USD = <span style={{ color: parseFloat(ltcData.change) >= 0 ? T.green : T.red, fontWeight: "700" }}>${ltcData.price}</span></span>
          <span>24h <span style={{ color: parseFloat(ltcData.change) >= 0 ? T.green : T.red, fontWeight: "700" }}>{parseFloat(ltcData.change) >= 0 ? "+" : ""}{ltcData.change}%</span></span>
          <span>Gas 9 sat/byte</span>
          {poolReserves.reserveA > 0 && <span>Pool TVL ${(poolReserves.reserveA + poolReserves.reserveB).toFixed(0)}</span>}
        </div>
      </div>

      {/* Banner */}
      <div style={{ background: `linear-gradient(90deg, ${T.accent}20, ${T.accent}05)`, borderBottom: `1px solid ${T.accent}30`, padding: "10px 24px", textAlign: "center", fontSize: "13px", fontWeight: "600", color: T.accent }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><Info size={14} /> The First DEX on LitVM Network with Integrated Impermanent Loss Risk Simulator.</span>
        <span style={{ marginLeft: "8px", opacity: 0.8 }}></span>
      </div>

      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", borderBottom: `1px solid ${T.border}`, background: T.bg, position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "18px", fontWeight: "800", color: T.accent, cursor: "pointer" }} onClick={() => setShowLanding(true)}>
          <FreesiaLogo size={22} /> Freesia DEX
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "700", color: T.green, background: "rgba(16, 185, 129, 0.1)", padding: "4px 10px", borderRadius: "999px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: T.green, animation: "pulse 2s infinite" }} /> LitVM Live
          </div>
          {account && !onCorrectNetwork && (
            <button onClick={switchNetwork} style={{ background: T.red, color: "#fff", border: "none", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              ⚠️ Network Salah
            </button>
          )}
          <button onClick={() => setDarkMode(!darkMode)} style={{ background: "none", border: "none", color: T.sub, cursor: "pointer", padding: "8px", borderRadius: "8px" }}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={() => setShowChart(!showChart)} className="btn-secondary" style={{ padding: "8px 12px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
            <BarChart3 size={16} /> Chart
          </button>
          {account ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button className="btn-primary" style={{ padding: "10px 18px", borderRadius: "10px", fontSize: "14px", fontWeight: "700" }}>
                {account.slice(0, 6)}...{account.slice(-4)}
              </button>
              <button onClick={disconnectWallet} className="btn-secondary" style={{ padding: "8px", borderRadius: "10px", display: "flex", alignItems: "center" }}>
                <X size={16} />
              </button>
            </div>
          ) : (
            <button onClick={connectWallet} className="btn-primary" style={{ padding: "10px 18px", borderRadius: "10px", fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
              <Wallet size={16} /> Connect
            </button>
          )}
        </div>
      </header>

      {/* TradingView Chart */}
      {showChart && (
        <div style={{ borderBottom: `1px solid ${T.border}`, padding: "16px", background: T.card }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Market Chart</h3>
            <button onClick={() => setShowChart(false)} style={{ background: "none", border: "none", color: T.sub, cursor: "pointer" }}><X size={18} /></button>
          </div>
          <div style={{ background: T.bg, borderRadius: "12px", height: "300px", display: "flex", alignItems: "center", justifyContent: "center", color: T.sub, fontSize: "14px" }}>
            <div style={{ textAlign: "center" }}>
              <CandlestickChart size={40} style={{ marginBottom: "12px", opacity: 0.5 }} />
              <p>Real-time via TradingView</p>
              <p style={{ fontSize: "12px", marginTop: "4px" }}>Coming soon</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "12px", justifyContent: "center" }}>
            {["LTCUSD", "BTCUSD", "ETHUSD"].map(s => (
              <button key={s} className="btn-secondary" style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "600" }}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", padding: "12px 24px", borderBottom: `1px solid ${T.border}`, overflowX: "auto" }}>
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`tab-btn ${activeTab === t.id ? "active" : ""}`}>
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: "480px", margin: "0 auto", padding: "24px" }}>
        {/* Swap */}
        {activeTab === "swap" && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: "700" }}>Tukar Token</h2>
                <p style={{ margin: 0, fontSize: "13px", color: T.sub }}>Swap dengan slippage terkontrol</p>
              </div>
              <button onClick={() => setShowSlippageModal(true)} className="btn-secondary" style={{ padding: "8px", borderRadius: "10px" }}>
                <Settings size={16} />
              </button>
            </div>

            <div style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "16px", marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: T.sub, fontWeight: "600" }}>Anda Membayar</span>
                <span style={{ fontSize: "12px", color: T.sub }}>Saldo: <strong>{fromBalance}</strong></span>
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <input value={amountIn} onChange={e => setAmountIn(e.target.value)} style={{ background: "transparent", border: "none", color: T.text, fontSize: "28px", width: "100%", outline: "none", fontWeight: "700", fontFamily: "monospace" }} placeholder="0.0" />
                <button onClick={() => setShowTokenSelector("from")} className="btn-secondary token-btn" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", borderRadius: "10px", fontSize: "14px", fontWeight: "700", whiteSpace: "nowrap" }}>
                  <img src={TOKEN_LIST[fromToken].logo} alt={fromToken} style={{width:20,height:20,borderRadius:"50%"}} /> {fromToken} <ChevronDown size={14} />
                </button>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                <button onClick={setMax} style={{ background: "none", border: "none", color: T.accent, fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>MAX</button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", margin: "-4px 0" }}>
              <button onClick={switchTokens} className="btn-secondary" style={{ padding: "8px", borderRadius: "50%", zIndex: 2 }}>
                <ArrowUpDown size={16} />
              </button>
            </div>

            <div style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "16px", marginTop: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: T.sub, fontWeight: "600" }}>Menerima (Estimasi)</span>
                <span style={{ fontSize: "12px", color: T.sub }}>Saldo: <strong>{toBalance}</strong></span>
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ fontSize: "28px", fontWeight: "700", fontFamily: "monospace", color: T.text, flex: 1 }}>{amountOut}</div>
                <button onClick={() => setShowTokenSelector("to")} className="btn-secondary token-btn" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", borderRadius: "10px", fontSize: "14px", fontWeight: "700", whiteSpace: "nowrap" }}>
                  <img src={TOKEN_LIST[toToken].logo} alt={toToken} style={{width:20,height:20,borderRadius:"50%"}} /> {toToken} <ChevronDown size={14} />
                </button>
              </div>
            </div>

            {amountIn && parseFloat(amountIn) > 0 && (
              <div style={{ marginTop: "16px", padding: "12px", background: T.input, borderRadius: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                  <span style={{ color: T.sub }}>Rate</span>
                  <span style={{ fontWeight: "600" }}>1 {fromToken} ≈ {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)} {toToken}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                  <span style={{ color: T.sub }}>Price Impact</span>
                  <span style={{ color: priceImpact > 3 ? T.red : priceImpact > 1 ? T.accent : T.green, fontWeight: "700" }}>{priceImpact.toFixed(2)}%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: T.sub }}>Slippage</span>
                  <span style={{ fontWeight: "600" }}>{slippage}%</span>
                </div>
                {gasEstimate && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "12px", color: T.sub }}>
                    <span>Estimasi Gas</span>
                    <span>{gasEstimate.eth} zkLTC {gasEstimate.usd !== "0.0000" && `(~$${gasEstimate.usd})`}</span>
                  </div>
                )}
                {priceImpact > 3 && <div style={{ color: T.red, fontSize: "12px", fontWeight: "600", marginTop: "8px" }}>⚠️ Price impact tinggi!</div>}
              </div>
            )}

            <button onClick={handleSwap} className="btn-primary" style={{ width: "100%", padding: "16px", borderRadius: "12px", fontSize: "16px", fontWeight: "700", marginTop: "20px" }}>
              {account ? "Swap" : "Connect Wallet"}
            </button>
          </div>
        )}

        {/* Mint */}
        {activeTab === "mint" && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "24px" }}>
            <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: "700" }}>Wallet Faucet Hub</h2>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: T.sub }}>Isi saldo wallet tesmu langsung ke LitVM Node.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {Object.entries(TOKEN_LIST).map(([sym, info]) => (
                <div key={sym} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: T.input, borderRadius: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <img src={info.logo} alt={sym} style={{width:28,height:28,borderRadius:"50%"}} />
                    <div>
                      <div style={{ fontWeight: "700" }}>{sym}</div>
                      <div style={{ fontSize: "12px", color: T.sub }}>Saldo: {mintBalances[sym] || "0.00"} {sym}</div>
                    </div>
                  </div>
                  <button onClick={() => handleMint(sym)} className="btn-primary" style={{ padding: "10px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "700" }}>
                    Mint
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pool */}
        {activeTab === "pool" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "24px" }}>
              <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: "700" }}>Active Liquidity Pools</h2>
              <p style={{ margin: "0 0 20px", fontSize: "13px", color: T.sub }}>Suntikkan likuiditas dan dapatkan fee dari setiap swap.</p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: T.input, borderRadius: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>💵</span><span>🔷</span>
                    <span style={{ fontWeight: "700" }}>USDC / DAI</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "12px", color: T.sub }}>TVL</div>
                    <div style={{ fontWeight: "700" }}>${communityLiquidity.usdcDaiTVL.toLocaleString()}</div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: T.input, borderRadius: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <img src={TOKEN_LIST.zkLTC.logo} alt="zkLTC" style={{width:20,height:20,borderRadius:"50%"}} /><span>💵</span>
                    <span style={{ fontWeight: "700" }}>zkLTC / USDC</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "12px", color: T.sub }}>TVL</div>
                    <div style={{ fontWeight: "700" }}>${communityLiquidity.zkLtcUsdcTVL.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {account && userLPBalance > 0 && (
                <div style={{ background: T.input, borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: "700" }}>Your LP Position</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
                    <div>
                      <div style={{ color: T.sub, fontSize: "12px" }}>LP Balance</div>
                      <div style={{ fontWeight: "700" }}>{userLPBalance.toFixed(4)} LP</div>
                    </div>
                    <div>
                      <div style={{ color: T.sub, fontSize: "12px" }}>Pool Share</div>
                      <div style={{ fontWeight: "700" }}>{totalLPSupply > 0 ? ((userLPBalance / totalLPSupply) * 100).toFixed(4) : "0"}%</div>
                    </div>
                    <div>
                      <div style={{ color: T.sub, fontSize: "12px" }}>Fee Earned</div>
                      <div style={{ fontWeight: "700", color: T.green }}>${feeEarned.toFixed(4)}</div>
                    </div>
                  </div>
                  <button onClick={() => setShowRemoveLPModal(true)} className="btn-secondary" style={{ width: "100%", marginTop: "12px", padding: "10px", borderRadius: "10px", fontSize: "13px", fontWeight: "700" }}>
                    Remove Liquidity
                  </button>
                </div>
              )}

              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", color: T.sub, fontWeight: "600", marginBottom: "6px", display: "block" }}>Pilih Pool</label>
                <select value={selectedPool} onChange={e => setSelectedPool(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: `1px solid ${T.border}`, background: T.input, color: T.text, fontSize: "14px", fontWeight: "600" }}>
                  <option value="zkLTC-USDC">zkLTC / USDC</option>
                  <option value="USDC-DAI">USDC / DAI</option>
                </select>
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", color: T.sub, fontWeight: "600", marginBottom: "6px", display: "block" }}>Jumlah {selectedPool.split("-")[0]}</label>
                <input value={amountAInput} onChange={e => setAmountAInput(e.target.value)} style={{ width: "100%", background: "transparent", border: "none", color: T.text, fontSize: "22px", outline: "none", fontWeight: "700", fontFamily: "monospace" }} placeholder="0.0" />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", color: T.sub, fontWeight: "600", marginBottom: "6px", display: "block" }}>Jumlah {selectedPool.split("-")[1]}</label>
                <input value={amountBInput} onChange={e => setAmountBInput(e.target.value)} style={{ width: "100%", background: "transparent", border: "none", color: T.text, fontSize: "22px", outline: "none", fontWeight: "700", fontFamily: "monospace" }} placeholder="0.0" />
              </div>
              <button onClick={handleAddLiquidity} className="btn-primary" style={{ width: "100%", padding: "14px", borderRadius: "12px", fontSize: "16px", fontWeight: "700" }}>
                Add Liquidity
              </button>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "24px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                <Shield size={18} color={T.accent} /> Impermanent Loss Simulator
              </h3>
              <p style={{ margin: "0 0 16px", fontSize: "13px", color: T.sub }}>Simulasikan kerugian impermanent berdasarkan perubahan harga relatif.</p>

              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: T.sub, fontWeight: "600" }}>Perubahan Harga</span>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: priceChange > 0 ? T.green : T.red }}>{priceChange > 0 ? "+" : ""}{priceChange}%</span>
                </div>
                <input type="range" min="-90" max="200" value={priceChange} onChange={e => setPriceChange(Number(e.target.value))} style={{ width: "100%", accentColor: T.accent, height: "6px" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: T.sub, marginTop: "4px" }}>
                  <span>-90%</span><span>0%</span><span>+200%</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ background: T.input, borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: T.sub, marginBottom: "4px" }}>IL Percentage</div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: ilResult.ilPercent > 5 ? T.red : T.accent }}>{ilResult.ilPercent.toFixed(2)}%</div>
                </div>
                <div style={{ background: T.input, borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: T.sub, marginBottom: "4px" }}>Est. Loss (per $1k)</div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: ilResult.lossAmount > 50 ? T.red : T.accent }}>${ilResult.lossAmount.toFixed(2)}</div>
                </div>
              </div>
              <p style={{ margin: "12px 0 0", fontSize: "12px", color: T.sub, lineHeight: 1.5 }}>IL terjadi saat harga token dalam pool berubah relatif. Semakin besar perubahan, semakin besar IL.</p>
            </div>
          </div>
        )}

        {/* Staking */}
        {activeTab === "staking" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "24px" }}>
              <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: "700" }}>MBG Staking Engine</h2>
              <p style={{ margin: "0 0 20px", fontSize: "13px", color: T.sub }}>Stake LP token & earn MBG rewards</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div style={{ background: T.input, borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: T.sub }}>Pool TVL</div>
                  <div style={{ fontSize: "18px", fontWeight: "800" }}>$250,400</div>
                </div>
                <div style={{ background: T.input, borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: T.sub }}>APR</div>
                  <div style={{ fontSize: "18px", fontWeight: "800", color: T.green }}>32.50%</div>
                </div>
              </div>

              <div style={{ background: `linear-gradient(135deg, ${T.accent}20, ${T.accent}05)`, border: `1px solid ${T.accent}`, borderRadius: "12px", padding: "16px", marginBottom: "20px", textAlign: "center" }}>
                <div style={{ fontSize: "12px", color: T.sub, marginBottom: "4px" }}>MBG Live Dynamic Yield</div>
                <div style={{ fontSize: "24px", fontWeight: "800", color: T.accent }}>{mbgRewards.toFixed(6)}</div>
              </div>

              {myStakedValue > 0 && (
                <div style={{ background: T.input, borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
                    <div>
                      <div style={{ color: T.sub, fontSize: "12px" }}>Daily Yield (est)</div>
                      <div style={{ fontWeight: "700" }}>{(myStakedValue * 0.00089).toFixed(4)} MBG</div>
                    </div>
                    <div>
                      <div style={{ color: T.sub, fontSize: "12px" }}>Monthly Yield (est)</div>
                      <div style={{ fontWeight: "700" }}>{(myStakedValue * 0.0267).toFixed(4)} MBG</div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", color: T.sub, fontWeight: "600", marginBottom: "6px", display: "block" }}>My Staked LP <strong>{myStakedValue.toFixed(2)} LP</strong></label>
                <input value={stakeAmount} onChange={e => setStakeAmount(e.target.value)} style={{ padding: "16px", background: T.input, border: `1px solid ${T.border}`, borderRadius: "12px", color: T.text, fontWeight: "700", fontSize: "16px", fontFamily: "monospace", width: "100%", boxSizing: "border-box" }} placeholder="0.0" />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={handleStake} className="btn-primary" style={{ flex: 1, padding: "14px", borderRadius: "12px", fontSize: "14px", fontWeight: "700" }}>
                  Stake
                </button>
                <button onClick={handleUnstake} className="btn-secondary" style={{ flex: 1, padding: "14px", borderRadius: "12px", fontSize: "14px", fontWeight: "700" }}>
                  Unstake All
                </button>
              </div>
              <button onClick={handleClaimMBG} className="btn-primary" style={{ width: "100%", marginTop: "12px", padding: "14px", borderRadius: "12px", fontSize: "14px", fontWeight: "700" }}>
                Claim MBG
              </button>
            </div>
          </div>
        )}

        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "24px" }}>
              <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: "700" }}>User Dashboard</h2>
              <p style={{ margin: "0 0 20px", fontSize: "13px", color: T.sub }}>Ringkasan aktivitas dan pencapaian Anda di Freesia DEX.</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
                <div style={{ background: T.input, borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: T.sub }}>Total Swaps</div>
                  <div style={{ fontSize: "20px", fontWeight: "800" }}>{swapCount}</div>
                </div>
                <div style={{ background: T.input, borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: T.sub }}>Total Volume</div>
                  <div style={{ fontSize: "20px", fontWeight: "800" }}>${totalVolume.toFixed(2)}</div>
                </div>
                <div style={{ background: T.input, borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: T.sub }}>LP Provided</div>
                  <div style={{ fontSize: "20px", fontWeight: "800" }}>{poolCount}x</div>
                </div>
                <div style={{ background: T.input, borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: T.sub }}>MBG Earned</div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: T.accent }}>{mbgRewards.toFixed(4)}</div>
                </div>
              </div>

              <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700" }}>Achievement Badges</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "24px" }}>
                {badges.map((badge, i) => {
                  const Icon = badge.icon;
                  return (
                    <div key={i} style={{ background: T.input, borderRadius: "12px", padding: "12px", display: "flex", alignItems: "center", gap: "10px", opacity: badge.unlocked ? 1 : 0.5 }}>
                      <div style={{ color: badge.unlocked ? T.accent : T.sub }}><Icon size={20} /></div>
                      <div style={{ fontSize: "13px", fontWeight: "700" }}>{badge.name}</div>
                      {badge.unlocked && <span style={{ marginLeft: "auto", fontSize: "10px", background: T.green, color: "#fff", padding: "2px 6px", borderRadius: "4px" }}>Unlocked</span>}
                    </div>
                  );
                })}
              </div>

              <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700" }}>Wallet Balances</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {Object.entries(TOKEN_LIST).map(([sym, info]) => (
                  <div key={sym} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: T.input, borderRadius: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <img src={info.logo} alt={sym} style={{width:24,height:24,borderRadius:"50%"}} />
                      <span style={{ fontWeight: "700" }}>{sym}</span>
                    </div>
                    <span style={{ fontWeight: "600", fontFamily: "monospace" }}>{mintBalances[sym] || "0.00"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {activeTab === "history" && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "24px" }}>
            <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: "700" }}>Riwayat Transaksi</h2>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: T.sub }}>Transaksi sesi ini. Data akan hilang saat refresh.</p>

            {txHistory.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: T.sub }}>
                <Clock size={40} style={{ marginBottom: "12px", opacity: 0.5 }} />
                <p>Belum ada transaksi. Mulai swap atau mint!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {txHistory.map((tx, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: T.input, borderRadius: "12px" }}>
                    <div style={{ color: T.accent }}>
                      {tx.type === "Swap" ? <ArrowUpDown size={18} /> : tx.type === "Mint" ? <Coins size={18} /> : tx.type === "Add Liquidity" ? <Plus size={18} /> : <Layers size={18} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: "700" }}>{tx.type}</div>
                      <div style={{ fontSize: "12px", color: T.sub }}>{tx.detail}</div>
                    </div>
                    <div style={{ fontSize: "11px", color: T.sub }}>{tx.time}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${T.border}`, padding: "32px 24px", marginTop: "40px" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "16px" }}>
            <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: "8px", borderRadius: "10px" }}><TwitterIcon size={16} /></a>
            <a href="https://github.com/Muhammadzack" target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: "8px", borderRadius: "10px" }}><GitHubIcon size={16} /></a>
            <a href="#" className="btn-secondary" style={{ padding: "8px", borderRadius: "10px" }}><MessageCircle size={16} /></a>
          </div>
          <p style={{ fontSize: "12px", color: T.sub, margin: 0 }}>© 2026 Freesia DEX. Built by <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: T.accent, textDecoration: "none", fontWeight: "600" }}>@0xzackbh</a> on LitVM Testnet.</p>
        </div>
      </footer>
    </div>
  );
}
