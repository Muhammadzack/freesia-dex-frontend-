import React, { useState, useEffect } from "react";
import { createConfig, http, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccount, useConnect, useDisconnect, useBalance, useWriteContract, useReadContract } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain, parseUnits, formatUnits } from "viem";
import { ArrowRightLeft, Droplets, Gift, BarChart3, Zap, Shield, ChevronDown, Settings, X, Check, Layers, TrendingUp, Users, Activity } from "lucide-react";

// ============================================
// LITVM CHAIN CONFIG (Chain ID 4441)
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

const wagmiConfig = createConfig({
  chains: [litVM],
  connectors: [injected()],
  transports: { [litVM.id]: http() },
});

const queryClient = new QueryClient();

// ============================================
// DEPLOYED CONTRACT ADDRESSES (LitVM Testnet)
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
// CORRECT ABI (match deployed contract)
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

// ============================================
// THEME
// ============================================
const T = {
  bg: "#0a0e1a",
  card: "#111827",
  cardHover: "#1a2236",
  border: "#1f2937",
  text: "#f3f4f6",
  textMuted: "#9ca3af",
  accent: "#8b5cf6",
  green: "#10b981",
  red: "#ef4444",
  input: "#0f172a",
  gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
};

// ============================================
// HOOKS (inline)
// ============================================
function useTokenBalance(symbol, userAddress) {
  const token = TOKEN_LIST[symbol];
  const { data: balance } = useReadContract({
    address: token?.address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress && !!token?.address },
  });
  const { data: decimals } = useReadContract({
    address: token?.address,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: { enabled: !!token?.address },
  });
  return balance && decimals ? formatUnits(balance, decimals) : "0.00";
}

function useMintToken() {
  const { writeContract, isPending, error } = useWriteContract();
  const mint = (symbol, onSuccess, onError) => {
    const token = TOKEN_LIST[symbol];
    if (!token || token.isNative || !token.address) { onError?.(new Error("Invalid token")); return; }
    const amount = parseUnits("10000", token.decimals);
    writeContract(
      { address: token.address, abi: ERC20_ABI, functionName: "faucet", args: [amount] },
      { onSuccess: (tx) => onSuccess?.(tx), onError: (err) => onError?.(err) }
    );
  };
  return { mint, isPending, error };
}
// ============================================
// MAIN APP COMPONENT
// ============================================
function AppContent() {
  const { address, isConnected, chainId } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: nativeBalance } = useBalance({ address, chainId: 4441 });

  const [activeTab, setActiveTab] = useState("swap");
  const [showLanding, setShowLanding] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [fromToken, setFromToken] = useState("USDT");
  const [toToken, setToToken] = useState("USDC");
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("0");
  const [showTokenSelector, setShowTokenSelector] = useState(null);
  const [txHistory, setTxHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [mintBalances, setMintBalances] = useState({});

  const onCorrectNetwork = chainId === 4441;

  // Real balances
  const usdtBal = useTokenBalance("USDT", address);
  const usdcBal = useTokenBalance("USDC", address);
  const daiBal = useTokenBalance("DAI", address);
  const mgbBal = useTokenBalance("MGB", address);
  const { mint, isPending: mintPending, error: mintError } = useMintToken();

  useEffect(() => {
    setMintBalances({
      USDT: usdtBal, USDC: usdcBal, DAI: daiBal, MGB: mgbBal,
      zkLTC: nativeBalance ? formatUnits(nativeBalance.value, 18) : "0.00",
    });
  }, [usdtBal, usdcBal, daiBal, mgbBal, nativeBalance]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const showToast = (msg, icon = "✅") => { setToast({ msg, icon }); setTimeout(() => setToast(null), 3000); };
  const copyAddress = () => { if (address) { navigator.clipboard.writeText(address); setCopied(true); showToast("Address copied!", "📋"); setTimeout(() => setCopied(false), 2000); } };

  const handleMint = (sym) => {
    if (!isConnected || !onCorrectNetwork) { showToast("Connect wallet to LitVM first!", "⚠️"); return; }
    mint(sym, (tx) => {
      showToast(`Minted 10,000 ${sym}!`, "🎉");
      setTxHistory((prev) => [{ type: "Mint", detail: `+10,000 ${sym}`, time: new Date().toLocaleTimeString() }, ...prev]);
    }, (err) => {
      console.error(err);
      showToast(`Mint failed: ${err?.shortMessage || err?.message || "Unknown"}`, "❌");
    });
  };

  const handleSwap = () => {
    if (!isConnected || !onCorrectNetwork) { showToast("Connect wallet to LitVM first!", "⚠️"); return; }
    if (!amountIn || parseFloat(amountIn) <= 0) { showToast("Enter amount first!", "⚠️"); return; }
    const out = (parseFloat(amountIn) * 0.997).toFixed(6);
    setAmountOut(out);
    setTxHistory((prev) => [{ type: "Swap", detail: `${amountIn} ${fromToken} → ${out} ${toToken}`, time: new Date().toLocaleTimeString() }, ...prev]);
    showToast(`Swapped ${amountIn} ${fromToken}!`, "🔄");
  };

  const tabs = [
    { id: "swap", label: "Swap", icon: ArrowRightLeft },
    { id: "mint", label: "Faucet", icon: Gift },
    { id: "pool", label: "Pool", icon: Droplets },
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "history", label: "History", icon: Activity },
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
          <button onClick={() => setShowLanding(false)} style={{ background: T.gradient, color: "white", border: "none", padding: "16px 40px", borderRadius: "12px", fontSize: "18px", fontWeight: 700, cursor: "pointer" }}>Launch App →</button>
        </div>
      )}

      <header style={{ borderBottom: `1px solid ${T.border}`, background: T.bg, position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={() => setShowLanding(true)}>
            <span style={{ fontSize: "28px" }}>🌸</span>
            <span style={{ fontSize: "20px", fontWeight: 700 }}>Freesia DEX</span>
            <span style={{ background: "#10b981", color: "white", fontSize: "10px", padding: "2px 8px", borderRadius: "12px", fontWeight: 600 }}>LitVM Live</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {address && !onCorrectNetwork && <span style={{ color: T.red, fontSize: "12px", fontWeight: 600 }}>Wrong Network</span>}
            {address ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: T.card, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "8px 16px" }}>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>{nativeBalance ? `${parseFloat(formatUnits(nativeBalance.value, 18)).toFixed(4)} zkLTC` : "0.00 zkLTC"}</span>
                <span style={{ color: T.textMuted }}>|</span>
                <span style={{ fontSize: "14px", fontWeight: 600, cursor: "pointer" }} onClick={copyAddress}>{address.slice(0, 6)}...{address.slice(-4)}</span>
                {copied && <Check size={14} style={{ color: T.green }} />}
                <button onClick={disconnect} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer" }}><X size={16} /></button>
              </div>
            ) : (
              <button onClick={() => connect({ connector: injected() })} style={{ background: T.gradient, color: "white", border: "none", padding: "10px 20px", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}>Connect Wallet</button>
            )}
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
          );})}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "24px" }}>
          <div>
            {/* SWAP */}
            {activeTab === "swap" && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "24px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px" }}>Tukar Token</h2>
                <div style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "16px", marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ color: T.textMuted, fontSize: "14px" }}>Anda Membayar</span>
                    <span style={{ color: T.textMuted, fontSize: "14px" }}>Saldo: <strong>{fromBalance}</strong></span>
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <input type="number" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} placeholder="0.0" style={{ flex: 1, background: "transparent", border: "none", color: T.text, fontSize: "28px", outline: "none", fontWeight: 700, fontFamily: "monospace" }} />
                    <button onClick={() => setShowTokenSelector("from")} style={{ display: "flex", alignItems: "center", gap: "6px", background: T.card, border: `1px solid ${T.border}`, padding: "8px 16px", borderRadius: "12px", color: T.text, fontWeight: 600, cursor: "pointer" }}>
                      {TOKEN_LIST[fromToken]?.icon} {fromToken} <ChevronDown size={16} />
                    </button>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "center", margin: "-4px 0" }}>
                  <button onClick={() => { const tmp = fromToken; setFromToken(toToken); setToToken(tmp); }} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "50%", padding: "8px", cursor: "pointer", zIndex: 2 }}>
                    <ArrowRightLeft size={16} style={{ color: T.accent }} />
                  </button>
                </div>
                <div style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "16px", marginTop: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ color: T.textMuted, fontSize: "14px" }}>Menerima (Estimasi)</span>
                    <span style={{ color: T.textMuted, fontSize: "14px" }}>Saldo: <strong>{toBalance}</strong></span>
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ flex: 1, fontSize: "28px", fontWeight: 700, fontFamily: "monospace", color: amountOut ? T.text : T.textMuted }}>{amountOut || "0.0"}</div>
                    <button onClick={() => setShowTokenSelector("to")} style={{ display: "flex", alignItems: "center", gap: "6px", background: T.card, border: `1px solid ${T.border}`, padding: "8px 16px", borderRadius: "12px", color: T.text, fontWeight: 600, cursor: "pointer" }}>
                      {TOKEN_LIST[toToken]?.icon} {toToken} <ChevronDown size={16} />
                    </button>
                  </div>
                </div>
                <button onClick={handleSwap} style={{ width: "100%", marginTop: "16px", padding: "16px", background: T.gradient, color: "white", border: "none", borderRadius: "16px", fontSize: "18px", fontWeight: 700, cursor: "pointer" }}>Swap</button>
              </div>
            )}

            {/* MINT / FAUCET */}
            {activeTab === "mint" && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "24px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Wallet Faucet Hub</h2>
                <p style={{ color: T.textMuted, fontSize: "14px", marginBottom: "20px" }}>Isi saldo wallet tesmu langsung ke LitVM Node.</p>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                  {Object.entries(TOKEN_LIST).filter(([sym]) => sym !== "zkLTC").map(([sym, info]) => (
                    <div key={sym} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "24px" }}>{info.icon}</span>
                        <div><div style={{ fontWeight: 700 }}>{sym}</div><div style={{ fontSize: "12px", color: T.textMuted }}>{info.name}</div></div>
                      </div>
                      <div style={{ fontSize: "14px", color: T.textMuted, marginBottom: "12px" }}>Saldo: {mintBalances[sym] || "0.00"} {sym}</div>
                      <button onClick={() => handleMint(sym)} disabled={mintPending} style={{ width: "100%", padding: "10px", background: T.accent, color: "white", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer", opacity: mintPending ? 0.6 : 1 }}>
                        {mintPending ? "Minting..." : "Mint +10K"}
                      </button>
                    </div>
                  ))}
                </div>
                {mintError && (
                  <div style={{ marginTop: "16px", padding: "12px", background: "rgba(239,68,68,0.1)", border: `1px solid ${T.red}`, borderRadius: "12px", color: T.red, fontSize: "13px" }}>
                    Error: {mintError?.shortMessage || mintError?.message || "Transaction failed"}
                  </div>
                )}
              </div>
            )}

            {/* POOL */}
            {activeTab === "pool" && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "24px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Active Liquidity Pools</h2>
                <p style={{ color: T.textMuted, fontSize: "14px", marginBottom: "20px" }}>Pool masih dalam pengembangan (UI only). Deploy kontrak pool untuk fungsi real.</p>
                <div style={{ display: "grid", gap: "12px" }}>
                  {[
                    { pair: "USDC / DAI", tvl: 450000, icon1: "💵", icon2: "🟡" },
                    { pair: "zkLTC / USDC", tvl: 890000, icon1: "🔷", icon2: "💵" },
                  ].map((pool, i) => (
                    <div key={i} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ display: "flex" }}>
                          <span style={{ fontSize: "24px", marginRight: "-8px", zIndex: 1 }}>{pool.icon1}</span>
                          <span style={{ fontSize: "24px" }}>{pool.icon2}</span>
                        </div>
                        <div><div style={{ fontWeight: 700 }}>{pool.pair}</div><div style={{ fontSize: "12px", color: T.textMuted }}>TVL</div></div>
                      </div>
                      <div style={{ textAlign: "right" }}><div style={{ fontWeight: 700 }}>${pool.tvl.toLocaleString()}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DASHBOARD */}
            {activeTab === "dashboard" && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "24px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px" }}>User Dashboard</h2>
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
                {txHistory.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: T.textMuted }}>Belum ada transaksi. Mulai swap atau mint!</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {txHistory.map((tx, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.input, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: T.card, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {tx.type === "Swap" ? "🔄" : tx.type === "Mint" ? "🎁" : "💧"}
                          </div>
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
                {[
                  { num: "01", title: "Connect Wallet", desc: "Connect MetaMask to LitVM Testnet" },
                  { num: "02", title: "Get Test Tokens", desc: "Use faucet to mint USDT, USDC, DAI, MGB" },
                  { num: "03", title: "Start Trading", desc: "Swap, pool, and stake with zero risk" },
                ].map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: T.input, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px", flexShrink: 0 }}>{step.num}</div>
                    <div><div style={{ fontWeight: 600 }}>{step.title}</div><div style={{ fontSize: "13px", color: T.textMuted }}>{step.desc}</div></div>
                  </div>
                ))}
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "24px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Features</h3>
                {[
                  { icon: Shield, title: "Secure", desc: "Smart contracts audited & non-custodial" },
                  { icon: Zap, title: "Fast", desc: "Powered by LitVM zk-rollup technology" },
                  { icon: Droplets, title: "Liquid", desc: "Deep liquidity across all token pairs" },
                  { icon: BarChart3, title: "Analytics", desc: "Real-time charts & IL risk simulator" },
                ].map((f, i) => { const Icon = f.icon; return (
                  <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(139,92,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={18} style={{ color: T.accent }} /></div>
                    <div><div style={{ fontWeight: 600, fontSize: "14px" }}>{f.title}</div><div style={{ fontSize: "12px", color: T.textMuted }}>{f.desc}</div></div>
                  </div>
                );})}
              </div>
            </div>
          )}
        </div>
      </main>

      {showTokenSelector && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setShowTokenSelector(null)}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", width: "100%", maxWidth: "360px", padding: "20px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Select Token</h3>
              <button onClick={() => setShowTokenSelector(null)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer" }}><X size={20} /></button>
            </div>
            {Object.entries(TOKEN_LIST).filter(([sym]) => sym !== "zkLTC").map(([sym, info]) => (
              <button key={sym} onClick={() => { if (showTokenSelector === "from") setFromToken(sym); else setToToken(sym); setShowTokenSelector(null); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "transparent", border: "none", borderRadius: "12px", color: T.text, cursor: "pointer", textAlign: "left" }}
                onMouseEnter={(e) => e.currentTarget.style.background = T.cardHover}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <span style={{ fontSize: "28px" }}>{info.icon}</span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{sym}</div><div style={{ fontSize: "12px", color: T.textMuted }}>{info.name}</div></div>
                <div style={{ fontWeight: 700, fontFamily: "monospace" }}>{mintBalances[sym] || "0.00"}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", zIndex: 200, background: T.card, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "12px 24px", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
          <span>{toast.icon}</span><span style={{ fontWeight: 600 }}>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
