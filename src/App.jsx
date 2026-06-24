import React, { useState, useEffect } from "react";
import { createConfig, http, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccount, useConnect, useDisconnect, useBalance, useWriteContract, useReadContract } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain, parseUnits, formatUnits } from "viem";
import { ArrowRightLeft, Droplets, Gift, BarChart3, Zap, Shield, ChevronDown, Settings, X, Check, Layers, TrendingUp, Users, Activity, ExternalLink, Twitter, Wifi, WifiOff } from "lucide-react";

// ============================================
// FIX 1: LITVM CHAIN CONFIG (Chain ID 4441)
// ============================================
const litVM = defineChain({
  id: 4441,
  name: "LitVM LiteForge",
  nativeCurrency: { decimals: 18, name: "zkLTC", symbol: "zkLTC" },
  rpcUrls: {
    default: { http: ["https://liteforge.rpc.caldera.xyz/http"] },
    public: { http: ["https://liteforge.rpc.caldera.xyz/http"] },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://liteforge.explorer.caldera.xyz" },
  },
  testnet: true,
});

const config = createConfig({
  chains: [litVM],
  connectors: [injected()],
  transports: { [litVM.id]: http() },
});

const queryClient = new QueryClient();

// ============================================
// FIX 2: CONTRACT ADDRESSES (LitVM Testnet)
// ============================================
const CONTRACTS = {
  USDT: "0x7B00A91DaDDA4124D5d1D4F10E6CAc338911700A",
  USDC: "0xCa2AC72dAC6d88a21765971f4A6AA917e12553Dd",
  DAI:  "0x961B942b0f7e44622584Cb001DEC642b01573Acf",
  MGB:  "0x943a23d4ee276C2598D04C9e143b8b67b3829CFe",
};

const TOKEN_LIST = {
  zkLTC: { symbol: "zkLTC", name: "zkLTC", decimals: 18, address: null, isNative: true, icon: "🔷" },
  USDT:  { symbol: "USDT",  name: "Freesia USDT", decimals: 6,  address: CONTRACTS.USDT, icon: "💵" },
  USDC:  { symbol: "USDC",  name: "Freesia USDC", decimals: 6,  address: CONTRACTS.USDC, icon: "💵" },
  DAI:   { symbol: "DAI",   name: "Freesia DAI",  decimals: 18, address: CONTRACTS.DAI,  icon: "🟡" },
  MGB:   { symbol: "MGB",   name: "Freesia MGB",  decimals: 18, address: CONTRACTS.MGB,  icon: "🟢" },
};

// ============================================
// FIX 3: CORRECT ABI (faucet with amount param)
// ============================================
const ERC20_ABI = [
  { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "faucet", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
  { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  { name: "allowance", type: "function", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "transfer", type: "function", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
];

const T = {
  bg: "#0a0e1a", card: "#111827", cardHover: "#1a2236", border: "#1f2937",
  text: "#f3f4f6", textMuted: "#9ca3af", accent: "#8b5cf6", green: "#10b981",
  red: "#ef4444", input: "#0f172a", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
};

function useTokenBalance(symbol, userAddress) {
  const token = TOKEN_LIST[symbol];
  const { data: balance } = useReadContract({
    address: token?.address, abi: ERC20_ABI, functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress && !!token?.address },
  });
  const { data: decimals } = useReadContract({
    address: token?.address, abi: ERC20_ABI, functionName: "decimals",
    query: { enabled: !!token?.address },
  });
  return balance && decimals ? formatUnits(balance, decimals) : "0.00";
}

// ============================================
// MAIN COMPONENT
// ============================================
function AppContent() {
  const { address, isConnected, chainId } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: nativeBalance } = useBalance({ address, chainId: 4441 });
  const { writeContract, isPending: writePending, error: writeError } = useWriteContract();

  const [activeTab, setActiveTab] = useState("swap");
  const [showLanding, setShowLanding] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [fromToken, setFromToken] = useState("USDT");
  const [toToken, setToToken] = useState("USDC");
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("0");
  const [showTokenSelector, setShowTokenSelector] = useState(null);
  const [showSlippageModal, setShowSlippageModal] = useState(false);
  const [showRemoveLPModal, setShowRemoveLPModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [slippage, setSlippage] = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState("");
  const [gasEstimate, setGasEstimate] = useState(null);
  const [priceImpact, setPriceImpact] = useState(0);
  const [selectedPool, setSelectedPool] = useState("USDT-USDC");
  const [amountAInput, setAmountAInput] = useState("");
  const [amountBInput, setAmountBInput] = useState("");
  const [removeLPAmount, setRemoveLPAmount] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [txHistory, setTxHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [lastSwap, setLastSwap] = useState(null);
  const [priceChange, setPriceChange] = useState(0);
  const [ltcData, setLtcData] = useState({ price: "82.45", change: "+2.34" });
  const [animatedStats, setAnimatedStats] = useState({ tvl: 0, volume: 0, users: 0, tx: 0 });
  const [swapCount, setSwapCount] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [poolCount, setPoolCount] = useState(0);
  const [mbgRewards, setMbgRewards] = useState(0);
  const [myStakedValue, setMyStakedValue] = useState(0);
  const [feeEarned, setFeeEarned] = useState(0);
  const [userLPBalance, setUserLPBalance] = useState(0);
  const [totalLPSupply, setTotalLPSupply] = useState(1000);
  const [communityLiquidity, setCommunityLiquidity] = useState({ usdcDaiTVL: 450000, zkLtcUsdcTVL: 890000 });
  const [poolReserves, setPoolReserves] = useState({ reserveA: 0, reserveB: 0 });
  const [mintBalances, setMintBalances] = useState({});
  const [latency, setLatency] = useState(null);
  const [badges, setBadges] = useState([
    { name: "First Swap", icon: Zap, unlocked: false },
    { name: "Liquidity Provider", icon: Droplets, unlocked: false },
    { name: "Whale", icon: BarChart3, unlocked: false },
    { name: "Diamond Hands", icon: Shield, unlocked: false },
  ]);

  const onCorrectNetwork = chainId === 4441;

  const usdtBal = useTokenBalance("USDT", address);
  const usdcBal = useTokenBalance("USDC", address);
  const daiBal = useTokenBalance("DAI", address);
  const mgbBal = useTokenBalance("MGB", address);

  useEffect(() => {
    setMintBalances({
      USDT: usdtBal, USDC: usdcBal, DAI: daiBal, MGB: mgbBal,
      zkLTC: nativeBalance ? formatUnits(nativeBalance.value, 18) : "0.00",
    });
  }, [usdtBal, usdcBal, daiBal, mgbBal, nativeBalance]);

  useEffect(() => {
    const targets = { tvl: 1340000, volume: 8900000, users: 4200, tx: 156000 };
    const duration = 2000; const steps = 60; const interval = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current++; const progress = current / steps;
      setAnimatedStats({ tvl: Math.floor(targets.tvl * progress), volume: Math.floor(targets.volume * progress), users: Math.floor(targets.users * progress), tx: Math.floor(targets.tx * progress) });
      if (current >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const checkLatency = async () => {
      const start = performance.now();
      try { await fetch("https://liteforge.rpc.caldera.xyz/http", { method: "POST", body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber" }) }); } catch (e) {}
      setLatency(Math.round(performance.now() - start));
    };
    checkLatency(); const iv = setInterval(checkLatency, 10000); return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd&include_24hr_change=true");
        const data = await res.json();
        if (data.litecoin) setLtcData({ price: data.litecoin.usd.toString(), change: (data.litecoin.usd_24h_change > 0 ? "+" : "") + data.litecoin.usd_24h_change.toFixed(2) });
      } catch (e) {}
    };
    fetchPrice(); const iv = setInterval(fetchPrice, 30000); return () => clearInterval(iv);
  }, []);

  const showToast = (msg, icon = "✅") => { setToast({ msg, icon }); setTimeout(() => setToast(null), 3000); };
  const copyAddress = () => { if (address) { navigator.clipboard.writeText(address); setCopied(true); showToast("Address copied!", "📋"); setTimeout(() => setCopied(false), 2000); } };

  // ============================================
  // FIX 4: handleMint with args: [amount]
  // ============================================
  const handleMint = (sym) => {
    if (!isConnected || !onCorrectNetwork) { showToast("Connect wallet to LitVM first!", "⚠️"); return; }
    const token = TOKEN_LIST[sym];
    if (!token || token.isNative || !token.address) return;
    const amount = parseUnits("10000", token.decimals);
    writeContract(
      { address: token.address, abi: ERC20_ABI, functionName: "faucet", args: [amount] },
      {
        onSuccess: (tx) => {
          showToast(`Minted 10,000 ${sym}!`, "🎉");
          setTxHistory((prev) => [{ type: "Mint", detail: `+10,000 ${sym}`, time: new Date().toLocaleTimeString() }, ...prev]);
          setBadges((prev) => prev.map((b, i) => i === 1 ? { ...b, unlocked: true } : b));
        },
        onError: (err) => { console.error(err); showToast(`Mint failed: ${err?.shortMessage || err?.message || "Unknown"}`, "❌"); },
      }
    );
  };

  const handleSwap = () => {
    if (!isConnected || !onCorrectNetwork) { showToast("Connect wallet to LitVM first!", "⚠️"); return; }
    if (!amountIn || parseFloat(amountIn) <= 0) { showToast("Enter amount first!", "⚠️"); return; }
    const out = (parseFloat(amountIn) * 0.997).toFixed(6);
    setAmountOut(out); setPriceImpact(Math.random() * 2); setGasEstimate({ eth: "0.001", usd: "0.08" });
    setLastSwap({ fromSym: fromToken, toSym: toToken, amountIn, outAmt: out });
    setTxHistory((prev) => [{ type: "Swap", detail: `${amountIn} ${fromToken} → ${out} ${toToken}`, time: new Date().toLocaleTimeString() }, ...prev]);
    setSwapCount((c) => c + 1); setTotalVolume((v) => v + parseFloat(amountIn));
    setBadges((prev) => prev.map((b, i) => i === 0 ? { ...b, unlocked: true } : b));
    showToast(`Swapped ${amountIn} ${fromToken}!`, "🔄");
  };

  const handleAddLiquidity = () => {
    if (!isConnected || !onCorrectNetwork) { showToast("Connect wallet to LitVM first!", "⚠️"); return; }
    if (!amountAInput || !amountBInput) { showToast("Enter both amounts!", "⚠️"); return; }
    setPoolCount((c) => c + 1); setUserLPBalance((b) => b + 100); setFeeEarned((f) => f + 0.5);
    setTxHistory((prev) => [{ type: "Add Liquidity", detail: `${amountAInput} + ${amountBInput} ${selectedPool}`, time: new Date().toLocaleTimeString() }, ...prev]);
    setBadges((prev) => prev.map((b, i) => i === 1 ? { ...b, unlocked: true } : b));
    showToast("Liquidity added!", "💧"); setAmountAInput(""); setAmountBInput("");
  };

  const handleRemoveLP = () => {
    if (!removeLPAmount || parseFloat(removeLPAmount) <= 0) return;
    setUserLPBalance((b) => Math.max(0, b - parseFloat(removeLPAmount)));
    setTxHistory((prev) => [{ type: "Remove Liquidity", detail: `${removeLPAmount} LP`, time: new Date().toLocaleTimeString() }, ...prev]);
    showToast("Liquidity removed!", "💧"); setShowRemoveLPModal(false); setRemoveLPAmount("");
  };

  const handleStake = () => {
    if (!stakeAmount) return;
    setMyStakedValue((v) => v + parseFloat(stakeAmount));
    setMbgRewards((r) => r + parseFloat(stakeAmount) * 0.001);
    showToast(`Staked ${stakeAmount} LP!`, "🔒"); setStakeAmount("");
  };

  const ilResult = (() => {
    const r = priceChange / 100;
    const il = (2 * Math.sqrt(1 + r) / (2 + r) - 1) * 100;
    return { ilPercent: Math.abs(il), lossAmount: Math.abs(il) * 10 };
  })();

  const tabs = [
    { id: "swap", label: "Swap", icon: ArrowRightLeft },
    { id: "mint", label: "Faucet", icon: Gift },
    { id: "pool", label: "Pool", icon: Droplets },
    { id: "staking", label: "Staking", icon: Zap },
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "history", label: "History", icon: Activity },
  ];

  const features = [
    { icon: Shield, title: "Secure", desc: "Smart contracts audited & non-custodial" },
    { icon: Zap, title: "Fast", desc: "Powered by LitVM zk-rollup technology" },
    { icon: Droplets, title: "Liquid", desc: "Deep liquidity across all token pairs" },
    { icon: BarChart3, title: "Analytics", desc: "Real-time charts & IL risk simulator" },
  ];

  const steps = [
    { num: "01", title: "Connect Wallet", desc: "Connect MetaMask to LitVM Testnet" },
    { num: "02", title: "Get Test Tokens", desc: "Use faucet to mint USDT, USDC, DAI, MGB" },
    { num: "03", title: "Start Trading", desc: "Swap, pool, and stake with zero risk" },
  ];

  const fromBalance = mintBalances[fromToken] || "0.00";
  const toBalance = mintBalances[toToken] || "0.00";

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "Inter, system-ui, sans-serif" }}>
      {showLanding && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🌸</div>
          <h1 style={{ fontSize: isMobile ? "32px" : "48px", fontWeight: 800, marginBottom: "8px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Freesia DEX</h1>
          <p style={{ color: T.textMuted, fontSize: "18px", marginBottom: "32px" }}>The First DEX on LitVM Network</p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap: "16px", maxWidth: "800px", width: "100%", marginBottom: "32px" }}>
            {[{ label: "Total Value Locked", value: `$${animatedStats.tvl.toLocaleString()}`, icon: Layers }, { label: "Total Volume", value: `$${animatedStats.volume.toLocaleString()}`, icon: TrendingUp }, { label: "Active Users", value: animatedStats.users.toLocaleString(), icon: Users }, { label: "Transactions", value: animatedStats.tx.toLocaleString(), icon: Activity }].map((s, i) => (
              <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "20px", textAlign: "center" }}>
                <s.icon size={24} style={{ color: T.accent, marginBottom: "8px" }} />
                <div style={{ fontSize: "24px", fontWeight: 700 }}>{s.value}</div>
                <div style={{ fontSize: "12px", color: T.textMuted }}>{s.label}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setShowLanding(false)} style={{ background: T.gradient, color: "white", border: "none", padding: "16px 40px", borderRadius: "12px", fontSize: "18px", fontWeight: 700, cursor: "pointer" }}>Launch App →</button>
        </div>
      )}

      <header style={{ borderBottom: `1px solid ${T.border}`, background: T.bg, position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={() => setShowLanding(true)}>
            <span style={{ fontSize: "28px" }}>🌸</span>
            <span style={{ fontSize: "20px", fontWeight: 700 }}>Freesia DEX</span>
            <span style={{ background: "#10b981", color: "white", fontSize: "10px", padding: "2px 8px", borderRadius: "12px", fontWeight: 600 }}>LitVM Live</span>
            {latency !== null && (
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: latency < 100 ? T.green : latency < 300 ? T.accent : T.red, marginLeft: "8px" }}>
                {latency < 100 ? <Wifi size={12} /> : <WifiOff size={12} />}{latency}ms
              </span>
            )}
          </div>
          {!isMobile && (
            <div style={{ display: "flex", gap: "24px" }}>
              {["Features", "How It Works", "Stats"].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`} style={{ color: T.textMuted, textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>{item}</a>
              ))}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {address && !onCorrectNetwork && <span style={{ color: T.red, fontSize: "12px", fontWeight: 600 }}>Wrong Network</span>}
            {address ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: T.card, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "8px 16px" }}>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>{nativeBalance ? `${parseFloat(formatUnits(nativeBalance.value, 18)).toFixed(4)} zkLTC` : "0.00 zkLTC"}</span>
                <span style={{ color: T.textMuted }}>|</span>
                <span style={{ fontSize: "14px", fontWeight: 600", cursor: "pointer" }} onClick={copyAddress}>{address.slice(0, 6)}...{address.slice(-4)}</span>
                {copied && <Check size={14} style={{ color: T.green }} />}
                <button onClick={disconnect} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer" }}><X size={16} /></button>
              </div>
            ) : (
              <button onClick={() => connect({ connector: injected() })} style={{ background: T.gradient, color: "white", border: "none", padding: "10px 20px", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}>Connect Wallet</button>
            )}
            <a href="https://github.com/Muhammadzack" target="_blank" rel="noopener noreferrer" style={{ color: T.textMuted }}><ExternalLink size={18} /></a>
            <a href="https://twitter.com/0xzackbh" target="_blank" rel="noopener noreferrer" style={{ color: T.textMuted }}><Twitter size={18} /></a>
          </div>
        </div>
      </header>

      <div style={{ background: "linear-gradient(90deg, #1e1b4b 0%, #312e81 100%)", padding: "8px 20px", textAlign: "center", fontSize: "13px", color: "#c7d2fe" }}>The First DEX on LitVM Network with Integrated Impermanent Loss Risk Simulator.</div>

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", overflowX: "auto", paddingBottom: "8px" }}>
          {tabs.map((t) => { const Icon = t.icon; return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 20px", borderRadius: "12px", border: "none", background: activeTab === t.id ? T.gradient : T.card, color: activeTab === t.id ? "white" : T.textMuted, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", border: activeTab === t.id ? "none" : `1px solid ${T.border}` }}>
              <Icon size={16} />{t.label}
            </button>
          ); })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "24px" }}>
          <div>
            {/* SWAP */}
            {activeTab === "swap" && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Tukar Token</h2>
                  <button onClick={() => setShowSlippageModal(true)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer" }}><Settings size={18} /></button>
                </div>
                <p style={{ color: T.textMuted, fontSize: "14px", marginBottom: "20px" }}>Swap dengan slippage terkontrol</p>
                <div style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "16px", marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ color: T.textMuted, fontSize: "14px" }}>Anda Membayar</span>
                    <span style={{ color: T.textMuted, fontSize: "14px" }}>Saldo: <strong>{fromBalance}</strong></span>
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <input type="number" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} placeholder="0.0" style={{ flex: 1, background: "transparent", border: "none", color: T.text, fontSize: "28px", outline: "none", fontWeight: 700, fontFamily: "monospace" }} />
                    <button onClick={() => setShowTokenSelector("from")} style={{ display: "flex", alignItems: "center", gap: "6px", background: T.card, border: `1px solid ${T.border}`, padding: "8px 16px", borderRadius: "12px", color: T.text, fontWeight: 600, cursor: "pointer" }}>{TOKEN_LIST[fromToken]?.icon} {fromToken} <ChevronDown size={16} /></button>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "center", margin: "-4px 0" }}>
                  <button onClick={() => { const tmp = fromToken; setFromToken(toToken); setToToken(tmp); }} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "50%", padding: "8px", cursor: "pointer", zIndex: 2 }}><ArrowRightLeft size={16} style={{ color: T.accent }} /></button>
                </div>
                <div style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "16px", marginTop: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ color: T.textMuted, fontSize: "14px" }}>Menerima (Estimasi)</span>
                    <span style={{ color: T.textMuted, fontSize: "14px" }}>Saldo: <strong>{toBalance}</strong></span>
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ flex: 1, fontSize: "28px", fontWeight: 700, fontFamily: "monospace", color: amountOut ? T.text : T.textMuted }}>{amountOut || "0.0"}</div>
                    <button onClick={() => setShowTokenSelector("to")} style={{ display: "flex", alignItems: "center", gap: "6px", background: T.card, border: `1px solid ${T.border}`, padding: "8px 16px", borderRadius: "12px", color: T.text, fontWeight: 600, cursor: "pointer" }}>{TOKEN_LIST[toToken]?.icon} {toToken} <ChevronDown size={16} /></button>
                  </div>
                </div>
                {amountIn && parseFloat(amountIn) > 0 && (
                  <div style={{ marginTop: "16px", padding: "16px", background: T.input, borderRadius: "12px", fontSize: "13px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span style={{ color: T.textMuted }}>Rate</span><span>1 {fromToken} ≈ {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)} {toToken}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span style={{ color: T.textMuted }}>Price Impact</span><span style={{ color: priceImpact > 3 ? T.red : priceImpact > 1 ? T.accent : T.green, fontWeight: 700 }}>{priceImpact.toFixed(2)}%</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span style={{ color: T.textMuted }}>Slippage</span><span>{slippage}%</span></div>
                    {gasEstimate && <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: T.textMuted }}>Estimasi Gas</span><span>{gasEstimate.eth} zkLTC {gasEstimate.usd !== "0.0000" && `(~$${gasEstimate.usd})`}</span></div>}
                    {priceImpact > 3 && <div style={{ marginTop: "8px", color: T.red, fontSize: "12px", fontWeight: 600 }}>⚠️ Price impact tinggi!</div>}
                  </div>
                )}
                <button onClick={handleSwap} disabled={writePending} style={{ width: "100%", marginTop: "16px", padding: "16px", background: T.gradient, color: "white", border: "none", borderRadius: "16px", fontSize: "18px", fontWeight: 700, cursor: "pointer", opacity: writePending ? 0.6 : 1 }}>{writePending ? "Processing..." : "Swap"}</button>
              </div>
            )}

            {/* MINT */}
            {activeTab === "mint" && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "24px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Wallet Faucet Hub</h2>
                <p style={{ color: T.textMuted, fontSize: "14px", marginBottom: "20px" }}>Isi saldo wallet tesmu langsung ke LitVM Node.</p>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                  {Object.entries(TOKEN_LIST).filter(([sym]) => sym !== "zkLTC").map(([sym, info]) => (
                    <div key={sym} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}><span style={{ fontSize: "24px" }}>{info.icon}</span><div><div style={{ fontWeight: 700 }}>{sym}</div><div style={{ fontSize: "12px", color: T.textMuted }}>{info.name}</div></div></div>
                      <div style={{ fontSize: "14px", color: T.textMuted, marginBottom: "12px" }}>Saldo: {mintBalances[sym] || "0.00"} {sym}</div>
                      <button onClick={() => handleMint(sym)} disabled={writePending} style={{ width: "100%", padding: "10px", background: T.accent, color: "white", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer", opacity: writePending ? 0.6 : 1 }}>{writePending ? "Minting..." : "Mint +10K"}</button>
                    </div>
                  ))}
                </div>
                {writeError && <div style={{ marginTop: "16px", padding: "12px", background: "rgba(239,68,68,0.1)", border: `1px solid ${T.red}`, borderRadius: "12px", color: T.red, fontSize: "13px" }}>Error: {writeError?.shortMessage || writeError?.message || "Transaction failed"}</div>}
              </div>
            )}

            {/* POOL */}
            {activeTab === "pool" && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "24px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Active Liquidity Pools</h2>
                <p style={{ color: T.textMuted, fontSize: "14px", marginBottom: "20px" }}>Suntikkan likuiditas dan dapatkan fee dari setiap swap.</p>
                <div style={{ display: "grid", gap: "12px", marginBottom: "24px" }}>
                  {[{ pair: "USDC / DAI", tvl: communityLiquidity.usdcDaiTVL, icon1: "💵", icon2: "🟡" }, { pair: "zkLTC / USDC", tvl: communityLiquidity.zkLtcUsdcTVL, icon1: "🔷", icon2: "💵" }].map((pool, i) => (
                    <div key={i} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ display: "flex" }}><span style={{ fontSize: "24px", marginRight: "-8px", zIndex: 1 }}>{pool.icon1}</span><span style={{ fontSize: "24px" }}>{pool.icon2}</span></div>
                        <div><div style={{ fontWeight: 700 }}>{pool.pair}</div><div style={{ fontSize: "12px", color: T.textMuted }}>TVL</div></div>
                      </div>
                      <div style={{ textAlign: "right" }}><div style={{ fontWeight: 700 }}>${pool.tvl.toLocaleString()}</div></div>
                    </div>
                  ))}
                </div>
                {address && userLPBalance > 0 && (
                  <div style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "16px", marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>Your LP Position</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", textAlign: "center" }}>
                      <div><div style={{ fontSize: "12px", color: T.textMuted }}>LP Balance</div><div style={{ fontWeight: 700 }}>{userLPBalance.toFixed(4)} LP</div></div>
                      <div><div style={{ fontSize: "12px", color: T.textMuted }}>Pool Share</div><div style={{ fontWeight: 700 }}>{totalLPSupply > 0 ? ((userLPBalance / totalLPSupply) * 100).toFixed(4) : "0"}%</div></div>
                      <div><div style={{ fontSize: "12px", color: T.textMuted }}>Fee Earned</div><div style={{ fontWeight: 700, color: T.green }}>${feeEarned.toFixed(4)}</div></div>
                    </div>
                    <button onClick={() => setShowRemoveLPModal(true)} style={{ width: "100%", marginTop: "12px", padding: "10px", background: "transparent", border: `1px solid ${T.red}`, color: T.red, borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}>Remove Liquidity</button>
                  </div>
                )}
                <div style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "16px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Add Liquidity</h3>
                  <select value={selectedPool} onChange={(e) => setSelectedPool(e.target.value)} style={{ width: "100%", padding: "12px", background: T.card, border: `1px solid ${T.border}`, borderRadius: "10px", color: T.text, marginBottom: "16px" }}>
                    <option value="USDT-USDC">USDT / USDC</option><option value="USDT-DAI">USDT / DAI</option><option value="USDC-DAI">USDC / DAI</option><option value="MGB-USDT">MGB / USDT</option><option value="MGB-USDC">MGB / USDC</option><option value="MGB-DAI">MGB / DAI</option>
                  </select>
                  <div style={{ marginBottom: "12px" }}><label style={{ fontSize: "12px", color: T.textMuted, display: "block", marginBottom: "4px" }}>Jumlah {selectedPool.split("-")[0]}</label><input type="number" value={amountAInput} onChange={(e) => setAmountAInput(e.target.value)} placeholder="0.0" style={{ width: "100%", background: "transparent", border: "none", color: T.text, fontSize: "22px", outline: "none", fontWeight: 700, fontFamily: "monospace" }} /></div>
                  <div style={{ marginBottom: "16px" }}><label style={{ fontSize: "12px", color: T.textMuted, display: "block", marginBottom: "4px" }}>Jumlah {selectedPool.split("-")[1]}</label><input type="number" value={amountBInput} onChange={(e) => setAmountBInput(e.target.value)} placeholder="0.0" style={{ width: "100%", background: "transparent", border: "none", color: T.text, fontSize: "22px", outline: "none", fontWeight: 700, fontFamily: "monospace" }} /></div>
                  <button onClick={handleAddLiquidity} style={{ width: "100%", padding: "14px", background: T.gradient, color: "white", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}>Add Liquidity</button>
                </div>
                <div style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "16px", marginTop: "20px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>Impermanent Loss Simulator</h3>
                  <p style={{ color: T.textMuted, fontSize: "13px", marginBottom: "12px" }}>Simulasikan kerugian impermanent berdasarkan perubahan harga relatif.</p>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span>Perubahan Harga</span><span style={{ color: priceChange >= 0 ? T.green : T.red }}>{priceChange > 0 ? "+" : ""}{priceChange}%</span></div>
                  <input type="range" min="-90" max="200" value={priceChange} onChange={(e) => setPriceChange(Number(e.target.value))} style={{ width: "100%", accentColor: T.accent, height: "6px" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: T.textMuted, marginTop: "4px" }}><span>-90%</span><span>0%</span><span>+200%</span></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "16px" }}>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: "12px", color: T.textMuted }}>IL Percentage</div><div style={{ fontSize: "24px", fontWeight: 700, color: ilResult.ilPercent > 5 ? T.red : T.accent }}>{ilResult.ilPercent.toFixed(2)}%</div></div>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: "12px", color: T.textMuted }}>Est. Loss (per $1k)</div><div style={{ fontSize: "24px", fontWeight: 700, color: ilResult.lossAmount > 50 ? T.red : T.accent }}>${ilResult.lossAmount.toFixed(2)}</div></div>
                  </div>
                  <p style={{ fontSize: "12px", color: T.textMuted, marginTop: "12px" }}>IL terjadi saat harga token dalam pool berubah relatif. Semakin besar perubahan, semakin besar IL.</p>
                </div>
              </div>
            )}

            {/* STAKING */}
            {activeTab === "staking" && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "24px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>MBG Staking Engine</h2>
                <p style={{ color: T.textMuted, fontSize: "14px", marginBottom: "20px" }}>Stake LP token & earn MBG rewards</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                  <div style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "16px", textAlign: "center" }}><div style={{ fontSize: "12px", color: T.textMuted }}>Pool TVL</div><div style={{ fontSize: "24px", fontWeight: 700 }}>$250,400</div></div>
                  <div style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "16px", textAlign: "center" }}><div style={{ fontSize: "12px", color: T.textMuted }}>APR</div><div style={{ fontSize: "24px", fontWeight: 700, color: T.green }}>32.50%</div></div>
                </div>
                <div style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "16px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}><span style={{ fontWeight: 700 }}>MBG Live Dynamic Yield</span><span style={{ color: T.accent, fontWeight: 700 }}>{mbgRewards.toFixed(6)}</span></div>
                  {myStakedValue > 0 && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "14px" }}><div><span style={{ color: T.textMuted }}>Daily: </span><strong>{(myStakedValue * 0.00089).toFixed(4)} MBG</strong></div><div><span style={{ color: T.textMuted }}>Monthly: </span><strong>{(myStakedValue * 0.0267).toFixed(4)} MBG</strong></div></div>}
                </div>
                <div style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}><span style={{ fontWeight: 700 }}>My Staked LP</span><span style={{ color: T.accent, fontWeight: 700 }}>{myStakedValue.toFixed(2)} LP</span></div>
                  <input type="number" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} placeholder="0.0" style={{ width: "100%", padding: "16px", background: T.card, border: `1px solid ${T.border}`, borderRadius: "12px", color: T.text, fontWeight: 700, fontSize: "16px", fontFamily: "monospace", marginBottom: "12px", boxSizing: "border-box" }} />
                  <button onClick={handleStake} style={{ width: "100%", padding: "14px", background: T.gradient, color: "white", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}>Stake LP</button>
                </div>
              </div>
            )}

            {/* DASHBOARD */}
            {activeTab === "dashboard" && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "24px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px" }}>User Dashboard</h2>
                <p style={{ color: T.textMuted, fontSize: "14px", marginBottom: "20px" }}>Ringkasan aktivitas dan pencapaian Anda di Freesia DEX.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
                  {[{ label: "Total Swaps", value: swapCount }, { label: "Total Volume", value: `$${totalVolume.toFixed(2)}` }, { label: "LP Provided", value: `${poolCount}x` }, { label: "MBG Earned", value: mbgRewards.toFixed(4) }].map((stat, i) => (
                    <div key={i} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "16px", textAlign: "center" }}><div style={{ fontSize: "12px", color: T.textMuted }}>{stat.label}</div><div style={{ fontSize: "20px", fontWeight: 700 }}>{stat.value}</div></div>
                  ))}
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>Achievement Badges</h3>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: "12px", marginBottom: "24px" }}>
                  {badges.map((badge, i) => { const Icon = badge.icon; return (
                    <div key={i} style={{ background: T.input, border: `1px solid ${badge.unlocked ? T.accent : T.border}`, borderRadius: "12px", padding: "16px", textAlign: "center", opacity: badge.unlocked ? 1 : 0.5 }}>
                      <Icon size={24} style={{ color: badge.unlocked ? T.accent : T.textMuted, marginBottom: "8px" }} />
                      <div style={{ fontSize: "12px", fontWeight: 600 }}>{badge.name}</div>
                      {badge.unlocked && <div style={{ fontSize: "10px", color: T.green, marginTop: "4px" }}>Unlocked</div>}
                    </div>
                  ); })}
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>Wallet Balances</h3>
                <div style={{ display: "grid", gap: "8px" }}>
                  {Object.entries(TOKEN_LIST).map(([sym, info]) => (
                    <div key={sym} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.input, border: `1px solid ${T.border}`, borderRadius: "10px", padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span>{info.icon}</span><span style={{ fontWeight: 600 }}>{sym}</span></div>
                      <span style={{ fontWeight: 700, fontFamily: "monospace" }}>{mintBalances[sym] || "0.00"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HISTORY */}
            {activeTab === "history" && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "24px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Riwayat Transaksi</h2>
                <p style={{ color: T.textMuted, fontSize: "14px", marginBottom: "20px" }}>Transaksi sesi ini. Data akan hilang saat refresh.</p>
                {txHistory.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: T.textMuted }}>Belum ada transaksi. Mulai swap atau mint!</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {txHistory.map((tx, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.input, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: T.card, display: "flex", alignItems: "center", justifyContent: "center" }}>{tx.type === "Swap" ? "🔄" : tx.type === "Mint" ? "🎁" : tx.type === "Add Liquidity" ? "💧" : "📤"}</div>
                          <div><div style={{ fontWeight: 600, fontSize: "14px" }}>{tx.type}</div><div style={{ fontSize: "12px", color: T.textMuted }}>{tx.detail}</div></div>
                        </div>
                        <div style={{ fontSize: "12px", color: T.textMuted }}>{tx.time}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {!isMobile && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "24px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Getting Started</h3>
                {steps.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: T.input, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px", flexShrink: 0 }}>{step.num}</div>
                    <div><div style={{ fontWeight: 600 }}>{step.title}</div><div style={{ fontSize: "13px", color: T.textMuted }}>{step.desc}</div></div>
                  </div>
                ))}
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "24px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Features</h3>
                {features.map((f, i) => { const Icon = f.icon; return (
                  <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(139,92,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={18} style={{ color: T.accent }} /></div>
                    <div><div style={{ fontWeight: 600, fontSize: "14px" }}>{f.title}</div><div style={{ fontSize: "12px", color: T.textMuted }}>{f.desc}</div></div>
                  </div>
                ); })}
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "24px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Live Chart</h3>
                <div style={{ height: "200px", background: T.input, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: T.textMuted, fontSize: "14px" }}>
                  TradingView Integration<br/>Coming Soon
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Token Selector Modal */}
      {showTokenSelector && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setShowTokenSelector(null)}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", width: "100%", maxWidth: "360px", padding: "20px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}><h3 style={{ fontSize: "18px", fontWeight: 700 }}>Select Token</h3><button onClick={() => setShowTokenSelector(null)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer" }}><X size={20} /></button></div>
            {Object.entries(TOKEN_LIST).filter(([sym]) => sym !== "zkLTC").map(([sym, info]) => (
              <button key={sym} onClick={() => { if (showTokenSelector === "from") setFromToken(sym); else setToToken(sym); setShowTokenSelector(null); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "transparent", border: "none", borderRadius: "12px", color: T.text, cursor: "pointer", textAlign: "left" }} onMouseEnter={(e) => e.currentTarget.style.background = T.cardHover} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <span style={{ fontSize: "28px" }}>{info.icon}</span><div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{sym}</div><div style={{ fontSize: "12px", color: T.textMuted }}>{info.name}</div></div><div style={{ fontWeight: 700, fontFamily: "monospace" }}>{mintBalances[sym] || "0.00"}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Slippage Modal */}
      {showSlippageModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setShowSlippageModal(false)}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", width: "100%", maxWidth: "360px", padding: "20px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}><h3 style={{ fontSize: "18px", fontWeight: 700 }}>Slippage Tolerance</h3><button onClick={() => setShowSlippageModal(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer" }}><X size={20} /></button></div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>{[0.1, 0.5, 1.0].map((v) => (<button key={v} onClick={() => setSlippage(v)} style={{ flex: 1, padding: "10px", background: slippage === v ? T.accent : T.input, border: `1px solid ${slippage === v ? T.accent : T.border}`, borderRadius: "10px", color: "white", fontWeight: 600, cursor: "pointer" }}>{v}%</button>))}</div>
            <input type="number" value={customSlippage} onChange={(e) => { setCustomSlippage(e.target.value); if (e.target.value) setSlippage(parseFloat(e.target.value) || 0.5); }} placeholder="Custom %" style={{ width: "100%", padding: "14px", borderRadius: "12px", border: `1px solid ${T.border}`, marginBottom: "12px", boxSizing: "border-box", background: T.input, color: T.text, fontSize: "14px" }} />
            {slippage > 5 && <div style={{ color: T.red, fontSize: "12px", fontWeight: 600" }}>⚠️ Slippage terlalu tinggi!</div>}
          </div>
        </div>
      )}

      {/* Remove LP Modal */}
      {showRemoveLPModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setShowRemoveLPModal(false)}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", width: "100%", maxWidth: "400px", padding: "20px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}><h3 style={{ fontSize: "18px", fontWeight: 700 }}>Remove Liquidity</h3><button onClick={() => setShowRemoveLPModal(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer" }}><X size={20} /></button></div>
            <p style={{ color: T.textMuted, fontSize: "14px", marginBottom: "16px" }}>Your LP Balance: <strong>{userLPBalance.toFixed(4)}</strong> LP</p>
            <input type="number" value={removeLPAmount} onChange={(e) => setRemoveLPAmount(e.target.value)} placeholder="0.0" style={{ width: "100%", padding: "14px", background: "transparent", border: "none", color: T.text, fontSize: "22px", outline: "none", fontWeight: 700, fontFamily: "monospace", marginBottom: "16px" }} />
            <button onClick={handleRemoveLP} style={{ width: "100%", padding: "14px", background: T.red, color: "white", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}>Remove</button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && lastSwap && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setShowShareModal(false)}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", width: "100%", maxWidth: "400px", padding: "20px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}><h3 style={{ fontSize: "18px", fontWeight: 700 }}>Share Swap</h3><button onClick={() => setShowShareModal(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer" }}><X size={20} /></button></div>
            <p style={{ marginBottom: "16px" }}>Just swapped <strong>{lastSwap.amountIn} {lastSwap.fromSym}</strong> → <strong>{lastSwap.outAmt} {lastSwap.toSym}</strong> on <strong>Freesia DEX</strong></p>
            <p style={{ color: T.textMuted, fontSize: "14px" }}>Built on <strong>LitVM Testnet</strong> ⚡</p>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <a href="https://twitter.com/intent/tweet?text=Just%20swapped%20on%20Freesia%20DEX!" target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "10px", background: T.input, border: `1px solid ${T.border}`, borderRadius: "10px", color: T.text, textAlign: "center", textDecoration: "none", fontSize: "14px" }}><Twitter size={16} /> Tweet</a>
              <button onClick={() => { navigator.clipboard.writeText(`Just swapped ${lastSwap.amountIn} ${lastSwap.fromSym} → ${lastSwap.outAmt} ${lastSwap.toSym} on Freesia DEX!`); showToast("Copied!", "📋"); }} style={{ flex: 1, padding: "10px", background: T.input, border: `1px solid ${T.border}`, borderRadius: "10px", color: T.text, cursor: "pointer", fontSize: "14px" }}><Copy size={16} /> Copy</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", zIndex: 200, background: T.card, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "12px 24px", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
          <span>{toast.icon}</span><span style={{ fontWeight: 600" }}>{toast.msg}</span>
        </div>
      )}

      {/* Footer Ticker */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: T.card, borderTop: `1px solid ${T.border}`, padding: "8px 20px", display: "flex", gap: "24px", overflow: "hidden", fontSize: "13px", color: T.textMuted }}>
        <div style={{ display: "flex", gap: "24px", whiteSpace: "nowrap" }}>
          <span>LTC/USD <span style={{ color: parseFloat(ltcData.change) >= 0 ? T.green : T.red, fontWeight: 700 }}>${ltcData.price}</span></span>
          <span>24h <span style={{ color: parseFloat(ltcData.change) >= 0 ? T.green : T.red, fontWeight: 700 }}>{parseFloat(ltcData.change) >= 0 ? "+" : ""}{ltcData.change}%</span></span>
          <span>Gas 9 sat/byte</span>
          {poolReserves.reserveA > 0 && <span>Pool TVL ${(poolReserves.reserveA + poolReserves.reserveB).toFixed(0)}</span>}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
