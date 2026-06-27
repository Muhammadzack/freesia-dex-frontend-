import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  ArrowUpDown, Settings, CheckCircle2,
  Zap, TrendingUp, Layers, Trophy, Award,
  Wallet, Coins, Sun, Moon
} from "lucide-react";

const CONTRACTS = {
  USDC: "0xCa2AC72dAC6d88a21765971f4A6AA917e12553Dd",
  DAI:  "0x961B942b0f7e44622584Cb001DEC642b01573Acf",
  USDT: "0x7B00A91DaDDA4124D5d1D4F10E6CAc338911700A",
  MBG:  "0x943a23d4ee276C2598D04C9e143b8b67b3829CFe",
  POOL: "0x49C738De9b7bED753bC25E91A58dC58EA889f585",
};

const TOKEN_LIST = {
  zkLTC: { name: "zkLTC", logo: "⚡", decimals: 18, address: "NATIVE" },
  USDC:  { name: "USDC",  logo: "💵", decimals: 6,  address: CONTRACTS.USDC },
  DAI:   { name: "DAI",   logo: "◈", decimals: 18, address: CONTRACTS.DAI },
  USDT:  { name: "USDT",  logo: "💲", decimals: 6,  address: CONTRACTS.USDT },
  MBG:   { name: "MBG",   logo: "🌸", decimals: 18, address: CONTRACTS.MBG },
};

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function faucet(uint256 amount) external"
];

const POOL_ABI = [
  "function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minOut) external",
  "function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB) external",
  "function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) view returns (uint256)",
  "function getReserves() view returns (uint256, uint256)"
];

const LITVM_RPC = "https://liteforge.rpc.caldera.xyz/http";
const CHAIN_ID = 4441;
const EXPLORER_URL = "https://liteforge.explorer.caldera.xyz";

const THEME = {
  bg: "#f0fdf4",
  card: "#ffffff",
  border: "#000000",
  text: "#1a1a1a",
  sub: "#525252",
  accent: "#22c55e",
  accent2: "#3b82f6",
  yellow: "#fbbf24",
  pink: "#f472b6",
  purple: "#8b5cf6",
  red: "#ef4444",
};

const neo = {
  box: {
    backgroundColor: THEME.card,
    border: "3px solid " + THEME.border,
    borderRadius: "16px",
    boxShadow: "6px 6px 0px " + THEME.border,
    padding: "24px",
  },
  btn: (color = THEME.accent) => ({
    backgroundColor: color,
    border: "3px solid " + THEME.border,
    borderRadius: "12px",
    padding: "14px 28px",
    fontWeight: "800",
    fontSize: "15px",
    cursor: "pointer",
    boxShadow: "4px 4px 0px " + THEME.border,
    color: "#000",
  }),
  btnSmall: (color = THEME.yellow) => ({
    backgroundColor: color,
    border: "2px solid " + THEME.border,
    borderRadius: "10px",
    padding: "8px 16px",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer",
    boxShadow: "3px 3px 0px " + THEME.border,
    color: "#000",
  }),
  card: {
    backgroundColor: THEME.card,
    border: "3px solid " + THEME.border,
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "5px 5px 0px " + THEME.border,
  },
  badge: (color) => ({
    backgroundColor: color,
    border: "2px solid " + THEME.border,
    borderRadius: "20px",
    padding: "4px 12px",
    fontSize: "11px",
    fontWeight: "800",
    boxShadow: "2px 2px 0px " + THEME.border,
  }),
};

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState("swap");
  const [toast, setToast] = useState(null);

  const [fromSym, setFromSym] = useState("USDC");
  const [toSym, setToSym] = useState("DAI");
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");
  const [swapLoading, setSwapLoading] = useState(false);
  const [slippage, setSlippage] = useState(0.5);
  const [showSlippage, setShowSlippage] = useState(false);

  const [balances, setBalances] = useState({});
  const [mintingSym, setMintingSym] = useState(null);

  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [poolLoading, setPoolLoading] = useState(false);
  const [poolInfo, setPoolInfo] = useState({ reserveA: 0, reserveB: 0, totalLP: 0 });

  const [stakeAmt, setStakeAmt] = useState("");
  const [staked, setStaked] = useState(0);
  const [mbgEarned, setMbgEarned] = useState(0);

  const [txHistory, setTxHistory] = useState([]);
  const [ltcPrice, setLtcPrice] = useState({ price: "...", change: "0" });

  const showToast = useCallback((icon, msg) => {
    setToast({ icon, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const addHistory = (type, detail) => {
    setTxHistory(prev => [{ id: Date.now(), type, detail, time: new Date().toLocaleTimeString("id-ID") }, ...prev].slice(0, 20));
  };

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd&include_24hr_change=true");
        const data = await res.json();
        setLtcPrice({ price: data.litecoin.usd.toFixed(2), change: data.litecoin.usd_24h_change.toFixed(2) });
      } catch (e) {}
    };
    fetchPrice();
    const iv = setInterval(fetchPrice, 60000);
    return () => clearInterval(iv);
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) { showToast("❌", "Install MetaMask!"); return; }
    setConnecting(true);
    try {
      const accs = await window.ethereum.request({ method: "eth_requestAccounts" });
      const prov = new ethers.BrowserProvider(window.ethereum);
      const net = await prov.getNetwork();
      if (Number(net.chainId) !== CHAIN_ID) {
        await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x" + CHAIN_ID.toString(16) }] });
      }
      const sig = await prov.getSigner();
      setProvider(prov);
      setSigner(sig);
      setAccount(accs[0]);
      showToast("✅", "Wallet Connected!");
      updateBalances(prov, accs[0]);
    } catch (err) {
      showToast("❌", "Connection Failed");
    } finally { setConnecting(false); }
  };

  const updateBalances = async (prov, addr) => {
    if (!prov || !addr) return;
    try {
      const native = await prov.getBalance(addr);
      const bals = { zkLTC: parseFloat(ethers.formatEther(native)).toFixed(4) };
      for (const [sym, info] of Object.entries(TOKEN_LIST)) {
        if (info.address === "NATIVE") continue;
        const contract = new ethers.Contract(info.address, ERC20_ABI, prov);
        const bal = await contract.balanceOf(addr);
        bals[sym] = parseFloat(ethers.formatUnits(bal, info.decimals)).toFixed(4);
      }
      setBalances(bals);
    } catch (e) {}
  };

  useEffect(() => {
    if (account && provider) {
      updateBalances(provider, account);
      const iv = setInterval(() => updateBalances(provider, account), 10000);
      return () => clearInterval(iv);
    }
  }, [account, provider]);

  useEffect(() => {
    const calc = async () => {
      if (!amountIn || parseFloat(amountIn) <= 0) { setAmountOut(""); return; }
      try {
        const readProv = provider || new ethers.JsonRpcProvider(LITVM_RPC);
        const pool = new ethers.Contract(CONTRACTS.POOL, POOL_ABI, readProv);
        const fromAddr = TOKEN_LIST[fromSym].address === "NATIVE" ? CONTRACTS.USDC : TOKEN_LIST[fromSym].address;
        const toAddr = TOKEN_LIST[toSym].address === "NATIVE" ? CONTRACTS.DAI : TOKEN_LIST[toSym].address;
        const amt = ethers.parseUnits(String(amountIn), TOKEN_LIST[fromSym].decimals);
        const out = await pool.getAmountOut(fromAddr, toAddr, amt);
        setAmountOut(parseFloat(ethers.formatUnits(out, TOKEN_LIST[toSym].decimals)).toFixed(6));
      } catch (e) { setAmountOut(""); }
    };
    calc();
  }, [amountIn, fromSym, toSym, provider]);

  const handleSwap = async () => {
    if (!signer || !account) return showToast("❌", "Connect wallet first!");
    setSwapLoading(true);
    try {
      const fromAddr = TOKEN_LIST[fromSym].address === "NATIVE" ? CONTRACTS.USDC : TOKEN_LIST[fromSym].address;
      const toAddr = TOKEN_LIST[toSym].address === "NATIVE" ? CONTRACTS.DAI : TOKEN_LIST[toSym].address;
      const amt = ethers.parseUnits(String(amountIn), TOKEN_LIST[fromSym].decimals);
      const pool = new ethers.Contract(CONTRACTS.POOL, POOL_ABI, signer);
      
      if (fromSym !== "zkLTC") {
        const token = new ethers.Contract(fromAddr, ERC20_ABI, signer);
        const allow = await token.allowance(account, CONTRACTS.POOL);
        if (allow < amt) {
          showToast("⏳", "Approving token...");
          await (await token.approve(CONTRACTS.POOL, amt)).wait();
        }
      }
      
      const minOut = ethers.parseUnits(String(parseFloat(amountOut) * (1 - slippage/100)), TOKEN_LIST[toSym].decimals);
      showToast("⏳", "Confirm swap in wallet...");
      const tx = await pool.swap(fromAddr, toAddr, amt, minOut, { gasLimit: 500000 });
      await tx.wait();
      showToast("🎉", `Swapped ${amountIn} ${fromSym} → ${amountOut} ${toSym}`);
      addHistory("Swap", `${amountIn} ${fromSym} → ${amountOut} ${toSym}`);
      setAmountIn(""); setAmountOut("");
      updateBalances(provider, account);
    } catch (err) {
      showToast("❌", "Swap failed: " + (err.reason || "").slice(0, 50));
    } finally { setSwapLoading(false); }
  };

  const handleFaucet = async (sym) => {
    if (!signer || !account) return showToast("❌", "Connect wallet!");
    if (sym === "zkLTC") return showToast("💡", "Get zkLTC from LitVM Faucet");
    setMintingSym(sym);
    try {
      const addr = TOKEN_LIST[sym].address;
      const token = new ethers.Contract(addr, ERC20_ABI, signer);
      showToast("⏳", `Claiming 10k ${sym}...`);
      const tx = await token.faucet(ethers.parseUnits("10000", TOKEN_LIST[sym].decimals));
      await tx.wait();
      showToast("✅", `Got 10,000 ${sym}!`);
      addHistory("Faucet", `10,000 ${sym}`);
      updateBalances(provider, account);
    } catch (err) {
      showToast("❌", `Faucet failed: ${(err.reason || "").slice(0, 50)}`);
    } finally { setMintingSym(null); }
  };

  const handleAddLiquidity = async () => {
    if (!signer || !account) return showToast("❌", "Connect wallet!");
    setPoolLoading(true);
    try {
      const amtA = ethers.parseUnits(String(amountA), 18);
      const amtB = ethers.parseUnits(String(amountB), 18);
      const pool = new ethers.Contract(CONTRACTS.POOL, POOL_ABI, signer);
      
      const tA = new ethers.Contract(CONTRACTS.USDC, ERC20_ABI, signer);
      const tB = new ethers.Contract(CONTRACTS.DAI, ERC20_ABI, signer);
      const [allA, allB] = await Promise.all([
        tA.allowance(account, CONTRACTS.POOL),
        tB.allowance(account, CONTRACTS.POOL)
      ]);
      if (allA < amtA) await (await tA.approve(CONTRACTS.POOL, amtA)).wait();
      if (allB < amtB) await (await tB.approve(CONTRACTS.POOL, amtB)).wait();
      
      showToast("⏳", "Adding liquidity...");
      const tx = await pool.addLiquidity(CONTRACTS.USDC, CONTRACTS.DAI, amtA, amtB, { gasLimit: 500000 });
      await tx.wait();
      showToast("🎉", "Liquidity added!");
      addHistory("Pool", `${amountA} USDC + ${amountB} DAI`);
      setAmountA(""); setAmountB("");
      updateBalances(provider, account);
    } catch (err) {
      showToast("❌", "Pool failed: " + (err.reason || "").slice(0, 50));
    } finally { setPoolLoading(false); }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const prov = provider || new ethers.JsonRpcProvider(LITVM_RPC);
        const pool = new ethers.Contract(CONTRACTS.POOL, POOL_ABI, prov);
        const [resA, resB] = await pool.getReserves();
        setPoolInfo({
          reserveA: parseFloat(ethers.formatUnits(resA, 18)).toFixed(2),
          reserveB: parseFloat(ethers.formatUnits(resB, 18)).toFixed(2),
          totalLP: "0",
        });
      } catch (e) {}
    };
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [provider]);

  if (showLanding) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: THEME.bg, fontFamily: "system-ui, sans-serif" }}>
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "40px", height: "40px", backgroundColor: THEME.accent, border: "3px solid #000", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "3px 3px 0 #000", fontSize: "20px" }}>🌸</div>
            <span style={{ fontWeight: "900", fontSize: "22px" }}>Freesia DEX</span>
          </div>
          <div style={{ display: "flex", gap: "30px", alignItems: "center" }}>
            <a href="#features" style={{ color: "#000", textDecoration: "none", fontWeight: "700" }}>Features</a>
            <a href="#how" style={{ color: "#000", textDecoration: "none", fontWeight: "700" }}>How It Works</a>
            <a href="#stats" style={{ color: "#000", textDecoration: "none", fontWeight: "700" }}>Stats</a>
            <button onClick={() => setShowLanding(false)} style={neo.btnSmall(THEME.accent2)}>Launch App →</button>
          </div>
        </nav>

        <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center" }}>
          <div>
            <div style={{ ...neo.badge(THEME.yellow), display: "inline-block", marginBottom: "20px" }}>⚡ Live on LitVM Testnet</div>
            <h1 style={{ fontSize: "52px", fontWeight: "900", lineHeight: "1.1", marginBottom: "20px", color: "#000" }}>
              The First DEX on<br />
              <span style={{ color: THEME.purple }}>LitVM Network</span>
            </h1>
            <p style={{ fontSize: "18px", color: THEME.sub, marginBottom: "30px", lineHeight: "1.6" }}>
              Swap, pool, and stake with the only DEX featuring an integrated Impermanent Loss Risk Simulator.
            </p>
            <div style={{ display: "flex", gap: "16px" }}>
              <button onClick={() => setShowLanding(false)} style={neo.btn(THEME.accent)}>Launch App →</button>
              <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ ...neo.btnSmall("#fff"), display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
                <span style={{ fontSize: "18px" }}>𝕏</span> Follow on X
              </a>
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ ...neo.box, backgroundColor: "#bbf7d0", padding: "40px", textAlign: "center" }}>
              <div style={{ fontSize: "80px", marginBottom: "20px" }}>📊</div>
              <div style={{ fontSize: "24px", fontWeight: "900" }}>TUKAR</div>
              <div style={{ fontSize: "14px", color: THEME.sub, marginTop: "10px" }}>Swap tokens instantly</div>
            </div>
            <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "60px", height: "60px", backgroundColor: THEME.yellow, border: "3px solid #000", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "3px 3px 0 #000", fontSize: "28px" }}>⭐</div>
            <div style={{ position: "absolute", bottom: "-15px", left: "-15px", width: "50px", height: "50px", backgroundColor: THEME.pink, border: "3px solid #000", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "3px 3px 0 #000", fontSize: "22px" }}>🚀</div>
          </div>
        </section>

        <section id="stats" style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
            {[
              { label: "Total Value Locked", value: "$1.245.000", icon: "💎" },
              { label: "Total Volume", value: "$8.900.000", icon: "📈" },
              { label: "Active Users", value: "4.200", icon: "👥" },
              { label: "Transactions", value: "156.000", icon: "⚡" },
            ].map((s, i) => (
              <div key={i} style={neo.card}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>{s.icon}</div>
                <div style={{ fontSize: "24px", fontWeight: "900" }}>{s.value}</div>
                <div style={{ fontSize: "13px", color: THEME.sub, fontWeight: "600" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="features" style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 40px" }}>
          <h2 style={{ fontSize: "36px", fontWeight: "900", textAlign: "center", marginBottom: "40px" }}>Key Features</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
            {[
              { icon: "⚡", title: "Lightning Swaps", desc: "Execute trades in under 2 seconds with zk-rollup settlement.", stat: "20+", statLabel: "Assets Supported", color: "#bbf7d0" },
              { icon: "🛡️", title: "IL Simulator", desc: "Preview impermanent loss risk before adding liquidity.", stat: "5M+", statLabel: "Liquidity Locked", color: "#bfdbfe" },
              { icon: "🤖", title: "AI Integration", desc: "Leverage AI agents for market analysis and insights.", stat: "Smart", statLabel: "Market Assistant", color: "#fbcfe8" },
            ].map((f, i) => (
              <div key={i} style={{ ...neo.card, backgroundColor: f.color }}>
                <div style={{ fontSize: "40px", marginBottom: "16px" }}>{f.icon}</div>
                <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "8px" }}>{f.title}</h3>
                <p style={{ fontSize: "14px", color: THEME.sub, marginBottom: "20px", lineHeight: "1.5" }}>{f.desc}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span style={{ fontSize: "28px", fontWeight: "900" }}>{f.stat}</span>
                  <span style={{ fontSize: "13px", color: THEME.sub, fontWeight: "600" }}>{f.statLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="how" style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 40px" }}>
          <h2 style={{ fontSize: "36px", fontWeight: "900", textAlign: "center", marginBottom: "40px" }}>How It Works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
            {[
              { num: "01", icon: "👛", title: "Connect Wallet", desc: "Link your MetaMask to LitVM Testnet." },
              { num: "02", icon: "🪙", title: "Get Test Tokens", desc: "Claim free zkLTC, USDC, DAI from faucet." },
              { num: "03", icon: "🔄", title: "Start Trading", desc: "Swap tokens or add liquidity to earn fees." },
            ].map((s, i) => (
              <div key={i} style={{ ...neo.card, textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: "800", color: THEME.purple, marginBottom: "12px" }}>STEP {s.num}</div>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>{s.icon}</div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "8px" }}>{s.title}</h3>
                <p style={{ fontSize: "14px", color: THEME.sub }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ maxWidth: "800px", margin: "60px auto", padding: "60px 40px", ...neo.box, backgroundColor: "#e0e7ff", textAlign: "center" }}>
          <h2 style={{ fontSize: "32px", fontWeight: "900", marginBottom: "16px" }}>Ready to Start Trading?</h2>
          <p style={{ fontSize: "16px", color: THEME.sub, marginBottom: "30px" }}>Join thousands of users trading on Freesia DEX.</p>
          <button onClick={() => setShowLanding(false)} style={neo.btn(THEME.accent)}>Launch App →</button>
        </section>

        <footer style={{ backgroundColor: "#1e3a5f", color: "#fff", padding: "60px 40px 30px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "40px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <span style={{ fontSize: "28px" }}>🌸</span>
                <span style={{ fontWeight: "900", fontSize: "20px", color: THEME.yellow }}>Freesia DEX</span>
              </div>
              <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: "1.6" }}>
                The first decentralized exchange on LitVM Testnet with integrated IL simulator.
              </p>
            </div>
            <div>
              <h4 style={{ fontWeight: "800", marginBottom: "16px" }}>Product</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <span onClick={() => setShowLanding(false)} style={{ color: "#94a3b8", cursor: "pointer" }}>Swap</span>
                <span onClick={() => setShowLanding(false)} style={{ color: "#94a3b8", cursor: "pointer" }}>Pool</span>
                <span onClick={() => setShowLanding(false)} style={{ color: "#94a3b8", cursor: "pointer" }}>Staking</span>
              </div>
            </div>
            <div>
              <h4 style={{ fontWeight: "800", marginBottom: "16px" }}>Developers</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <a href="https://github.com/Muhammadzack/freesia-dex-frontend-" target="_blank" rel="noreferrer" style={{ color: "#94a3b8", textDecoration: "none" }}>GitHub</a>
                <a href="#" style={{ color: "#94a3b8", textDecoration: "none" }}>Docs</a>
                <a href={EXPLORER_URL} target="_blank" rel="noreferrer" style={{ color: "#94a3b8", textDecoration: "none" }}>Explorer ↗</a>
              </div>
            </div>
            <div>
              <h4 style={{ fontWeight: "800", marginBottom: "16px" }}>Community</h4>
              <div style={{ display: "flex", gap: "16px" }}>
                <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: THEME.yellow, fontSize: "20px", textDecoration: "none" }}>𝕏</a>
              </div>
            </div>
          </div>
          <div style={{ maxWidth: "1200px", margin: "40px auto 0", paddingTop: "20px", borderTop: "1px solid #334155", textAlign: "center", fontSize: "13px", color: "#64748b" }}>
            © 2026 Freesia DEX. Built by <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: THEME.yellow, textDecoration: "none" }}>@0xzackbh</a> on LitVM Testnet.
          </div>
        </footer>
      </div>
    );
  }

  const T = {
    bg: darkMode ? "#0f0a1a" : "#f5f3ff",
    card: darkMode ? "#1a1033" : "#ffffff",
    input: darkMode ? "#130b26" : "#faf5ff",
    border: darkMode ? "#2d1b4e" : "#e9d5ff",
    text: darkMode ? "#f3e8ff" : "#1a1a2e",
    sub: darkMode ? "#a78bfa" : "#7c3aed",
    accent: "#8b5cf6",
    green: "#22c55e",
    red: "#ef4444",
    yellow: "#fbbf24",
  };

  const cardDex = {
    backgroundColor: T.card,
    borderRadius: "24px",
    padding: "24px",
    border: `1px solid ${T.border}`,
    boxShadow: darkMode ? "0 10px 40px rgba(139,92,246,0.1)" : "0 10px 40px rgba(139,92,246,0.08)"
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: T.bg, color: T.text, fontFamily: "system-ui, sans-serif" }}>
      {toast && (
        <div style={{ position: "fixed", top: "20px", right: "20px", backgroundColor: T.card, padding: "14px 24px", borderRadius: "16px", border: `2px solid ${T.border}`, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", zIndex: 1000, fontWeight: "700", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>{toast.icon}</span> {toast.msg}
        </div>
      )}

      <div style={{ display: "flex", gap: "24px", justifyContent: "center", padding: "10px", backgroundColor: T.card, borderBottom: `1px solid ${T.border}`, fontSize: "12px", color: T.sub }}>
        <span>LTC/USD <strong style={{ color: parseFloat(ltcPrice.change) >= 0 ? T.green : T.red }}>${ltcPrice.price}</strong></span>
        <span>24h <strong style={{ color: parseFloat(ltcPrice.change) >= 0 ? T.green : T.red }}>{ltcPrice.change}%</strong></span>
        <span>Gas <strong>9 sat/byte</strong></span>
        <span>Pool TVL <strong style={{ color: T.green }}>${poolInfo.reserveA > 0 ? (parseFloat(poolInfo.reserveA) + parseFloat(poolInfo.reserveB)).toFixed(0) : "—"}</strong></span>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", paddingBottom: "20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => setShowLanding(true)}>
            <span style={{ fontSize: "32px" }}>🌸</span>
            <div>
              <h1 style={{ fontSize: "22px", margin: 0, fontWeight: "900", color: T.text }}>Freesia DEX</h1>
              <span style={{ fontSize: "12px", color: T.green, display: "flex", alignItems: "center", gap: "4px" }}>
                <CheckCircle2 size={12} /> LitVM Live
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button onClick={() => setDarkMode(!darkMode)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: "10px", padding: "8px", cursor: "pointer", color: T.sub }}>
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a href={EXPLORER_URL} target="_blank" rel="noreferrer" style={{ color: T.sub, textDecoration: "none", fontSize: "13px", fontWeight: "600" }}>Explorer ↗</a>
            <button onClick={connectWallet} disabled={connecting} style={{ backgroundColor: T.accent, color: "#fff", border: "none", padding: "10px 20px", borderRadius: "12px", fontWeight: "700", cursor: "pointer" }}>
              {connecting ? "..." : account ? `${account.slice(0,6)}...${account.slice(-4)}` : "Connect Wallet"}
            </button>
          </div>
        </header>

        <div style={{ display: "flex", gap: "8px", marginBottom: "30px", flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { id: "swap", label: "Swap", icon: "🔄" },
            { id: "faucet", label: "Faucet", icon: "🚰" },
            { id: "pool", label: "Pool", icon: "🏊" },
            { id: "staking", label: "Staking", icon: "💎" },
            { id: "dashboard", label: "Dashboard", icon: "📊" },
            { id: "history", label: "History", icon: "📋" },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: "10px 20px", border: "none", borderRadius: "12px",
              backgroundColor: activeTab === t.id ? T.accent : T.input,
              color: activeTab === t.id ? "#fff" : T.sub,
              fontWeight: "700", cursor: "pointer", fontSize: "13px",
              display: "flex", alignItems: "center", gap: "6px"
            }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          {activeTab === "swap" && (
            <div style={{ ...cardDex, width: "100%", maxWidth: "460px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>Tukar Token</h3>
                <button onClick={() => setShowSlippage(!showSlippage)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: "8px", padding: "6px 10px", cursor: "pointer", color: T.sub, fontSize: "12px" }}>
                  <Settings size={14} style={{ verticalAlign: "middle" }} /> {slippage}%
                </button>
              </div>
              
              {showSlippage && (
                <div style={{ backgroundColor: T.input, padding: "12px", borderRadius: "12px", marginBottom: "16px", border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: "12px", color: T.sub, marginBottom: "8px" }}>Slippage Tolerance</div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[0.1, 0.5, 1.0].map(v => (
                      <button key={v} onClick={() => setSlippage(v)} style={{
                        flex: 1, padding: "8px", borderRadius: "8px", border: slippage === v ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
                        backgroundColor: slippage === v ? T.accent : "transparent", color: slippage === v ? "#fff" : T.sub,
                        fontWeight: "700", cursor: "pointer", fontSize: "13px"
                      }}>{v}%</button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ backgroundColor: T.input, padding: "16px", borderRadius: "16px", border: `1px solid ${T.border}`, marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: T.sub, marginBottom: "8px" }}>
                  <span>Anda Membayar</span>
                  <span>Saldo: {balances[fromSym] || "0.00"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <input type="number" placeholder="0.0" value={amountIn} onChange={e => setAmountIn(e.target.value)} style={{ background: "transparent", border: "none", color: T.text, fontSize: "28px", width: "55%", outline: "none", fontWeight: "700" }} />
                  <select value={fromSym} onChange={e => setFromSym(e.target.value)} style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "8px 14px", fontWeight: "700", color: T.text, outline: "none", cursor: "pointer" }}>
                    {Object.keys(TOKEN_LIST).map(s => <option key={s} value={s}>{TOKEN_LIST[s].logo} {s}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ textAlign: "center", margin: "-8px 0", position: "relative", zIndex: 2 }}>
                <button onClick={() => { setFromSym(toSym); setToSym(fromSym); }} style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", color: T.sub }}>
                  <ArrowUpDown size={16} />
                </button>
              </div>

              <div style={{ backgroundColor: T.input, padding: "16px", borderRadius: "16px", border: `1px solid ${T.border}`, marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: T.sub, marginBottom: "8px" }}>
                  <span>Menerima (Estimasi)</span>
                  <span>Saldo: {balances[toSym] || "0.00"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <input type="text" placeholder="0.0" value={amountOut} readOnly style={{ background: "transparent", border: "none", color: T.sub, fontSize: "28px", width: "55%", outline: "none", fontWeight: "700" }} />
                  <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "8px 14px", fontWeight: "700", color: T.text }}>
                    {TOKEN_LIST[toSym].logo} {toSym}
                  </div>
                </div>
              </div>

              <button onClick={handleSwap} disabled={!account || !amountIn || swapLoading} style={{
                width: "100%", backgroundColor: !account ? T.border : T.accent, color: "#fff", border: "none",
                padding: "16px", borderRadius: "16px", fontWeight: "800", fontSize: "16px",
                cursor: account && amountIn ? "pointer" : "not-allowed", opacity: account && amountIn ? 1 : 0.6
              }}>
                {!account ? "Connect Wallet" : swapLoading ? "⏳ Swapping..." : `Swap ${fromSym} → ${toSym}`}
              </button>
            </div>
          )}

          {activeTab === "faucet" && (
            <div style={{ ...cardDex, width: "100%", maxWidth: "460px" }}>
              <h3 style={{ margin: "0 0 8px 0", textAlign: "center", fontSize: "20px", fontWeight: "800" }}>🚰 Wallet Faucet Hub</h3>
              <p style={{ fontSize: "13px", color: T.sub, textAlign: "center", marginBottom: "24px" }}>Claim free test tokens for LitVM Testnet</p>
              {Object.entries(TOKEN_LIST).map(([sym, info]) => (
                <div key={sym} style={{ backgroundColor: T.input, padding: "16px", borderRadius: "16px", border: `1px solid ${T.border}`, marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "32px" }}>{info.logo}</span>
                    <div>
                      <div style={{ fontWeight: "800", fontSize: "16px" }}>{sym}</div>
                      <div style={{ fontSize: "12px", color: T.green, fontWeight: "600" }}>Saldo: {balances[sym] || "0.00"}</div>
                    </div>
                  </div>
                  <button onClick={() => handleFaucet(sym)} disabled={mintingSym === sym || sym === "zkLTC"} style={{
                    backgroundColor: sym === "zkLTC" ? T.border : T.accent, color: "#fff", border: "none",
                    padding: "10px 18px", borderRadius: "12px", fontWeight: "700", cursor: sym === "zkLTC" ? "not-allowed" : "pointer",
                    opacity: sym === "zkLTC" ? 0.5 : 1
                  }}>
                    {sym === "zkLTC" ? "External" : mintingSym === sym ? "⏳..." : "Faucet 10k"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === "pool" && (
            <div style={{ ...cardDex, width: "100%", maxWidth: "500px" }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: "800" }}>🏊 Active Liquidity Pools</h3>
              <div style={{ backgroundColor: T.input, padding: "16px", borderRadius: "16px", border: `1px solid ${T.border}`, marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "14px" }}>
                  <span style={{ color: T.sub }}>Pool TVL</span>
                  <strong style={{ color: T.green }}>${poolInfo.reserveA > 0 ? (parseFloat(poolInfo.reserveA) + parseFloat(poolInfo.reserveB)).toFixed(2) : "—"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                  <span style={{ color: T.sub }}>Total LP</span>
                  <strong>{poolInfo.totalLP}</strong>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                <input type="number" placeholder="USDC Amount" value={amountA} onChange={e => setAmountA(e.target.value)} style={{ padding: "14px", backgroundColor: T.input, border: `1px solid ${T.border}`, borderRadius: "12px", color: T.text, fontWeight: "700", fontSize: "16px" }} />
                <input type="number" placeholder="DAI Amount" value={amountB} onChange={e => setAmountB(e.target.value)} style={{ padding: "14px", backgroundColor: T.input, border: `1px solid ${T.border}`, borderRadius: "12px", color: T.text, fontWeight: "700", fontSize: "16px" }} />
                <button onClick={handleAddLiquidity} disabled={poolLoading} style={{
                  width: "100%", backgroundColor: T.accent, color: "#fff", border: "none",
                  padding: "16px", borderRadius: "16px", fontWeight: "800", fontSize: "16px", cursor: "pointer"
                }}>
                  {poolLoading ? "⏳ Adding..." : "Add Liquidity"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "staking" && (
            <div style={{ ...cardDex, width: "100%", maxWidth: "460px" }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: "800" }}>💎 MBG Staking Engine</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div style={{ backgroundColor: T.input, padding: "16px", borderRadius: "12px", border: `1px solid ${T.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: T.sub }}>Pool TVL</div>
                  <div style={{ fontSize: "20px", fontWeight: "800" }}>$250,400</div>
                </div>
                <div style={{ backgroundColor: T.input, padding: "16px", borderRadius: "12px", border: `1px solid ${T.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: T.sub }}>APY</div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: T.green }}>32.50%</div>
                </div>
              </div>
              <div style={{ backgroundColor: "#fef3c7", padding: "16px", borderRadius: "12px", border: "1px solid #fde68a", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "12px", color: "#92400e" }}>MBG Earned</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", fontFamily: "monospace" }}>{mbgEarned.toFixed(6)}</div>
                  </div>
                  <button onClick={() => setMbgEarned(0)} disabled={mbgEarned <= 0} style={{ backgroundColor: mbgEarned > 0 ? T.yellow : T.border, border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: "700", cursor: mbgEarned > 0 ? "pointer" : "not-allowed" }}>
                    Claim
                  </button>
                </div>
              </div>
              <input type="number" placeholder="LP Amount to Stake" value={stakeAmt} onChange={e => setStakeAmt(e.target.value)} style={{ padding: "14px", backgroundColor: T.input, border: `1px solid ${T.border}`, borderRadius: "12px", color: T.text, fontWeight: "700", fontSize: "16px", width: "100%", marginBottom: "12px", boxSizing: "border-box" }} />
              <button onClick={() => { if (stakeAmt) { setStaked(s => s + parseFloat(stakeAmt)); setStakeAmt(""); } }} style={{ width: "100%", backgroundColor: "#111827", color: "#fff", border: "none", padding: "16px", borderRadius: "12px", fontWeight: "800", cursor: "pointer" }}>
                Lock & Stake
              </button>
            </div>
          )}

          {activeTab === "dashboard" && (
            <div style={{ ...cardDex, width: "100%", maxWidth: "600px" }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: "800" }}>📊 Dashboard</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
                {[
                  { label: "Total Swaps", value: txHistory.filter(t => t.type === "Swap").length },
                  { label: "Total Volume", value: "$" + txHistory.filter(t => t.type === "Swap").length * 100 },
                  { label: "LP Provided", value: "0x" },
                  { label: "MBG Earned", value: mbgEarned.toFixed(4) },
                ].map((s, i) => (
                  <div key={i} style={{ backgroundColor: T.input, padding: "16px", borderRadius: "12px", border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: "12px", color: T.sub }}>{s.label}</div>
                    <div style={{ fontSize: "20px", fontWeight: "800" }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <h4 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "12px" }}>Wallet Balances</h4>
              {Object.entries(TOKEN_LIST).map(([sym, info]) => (
                <div key={sym} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span>{info.logo} {sym}</span>
                  <strong>{balances[sym] || "0.00"}</strong>
                </div>
              ))}
            </div>
          )}

          {activeTab === "history" && (
            <div style={{ ...cardDex, width: "100%", maxWidth: "600px" }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: "800" }}>📋 Transaction History</h3>
              {txHistory.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: T.sub }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
                  <p>No transactions yet. Start swapping!</p>
                </div>
              ) : (
                txHistory.map(tx => (
                  <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px", borderRadius: "10px", backgroundColor: T.input, border: `1px solid ${T.border}`, marginBottom: "8px" }}>
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "14px" }}>{tx.type}</div>
                      <div style={{ fontSize: "12px", color: T.sub }}>{tx.detail}</div>
                    </div>
                    <span style={{ fontSize: "11px", color: T.sub }}>{tx.time}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <footer style={{ textAlign: "center", marginTop: "60px", padding: "30px 0", borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "16px" }}>
            <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: T.sub, fontSize: "20px", textDecoration: "none" }}>𝕏</a>
            <a href="https://github.com/Muhammadzack/freesia-dex-frontend-" target="_blank" rel="noreferrer" style={{ color: T.sub, fontSize: "20px", textDecoration: "none" }}>🐙</a>
            <a href={EXPLORER_URL} target="_blank" rel="noreferrer" style={{ color: T.sub, fontSize: "20px", textDecoration: "none" }}>🔍</a>
          </div>
          <p style={{ fontSize: "12px", color: T.sub }}>
            © 2026 Freesia DEX. Built by <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: T.accent, textDecoration: "none" }}>@0xzackbh</a> on LitVM Testnet.
          </p>
        </footer>
      </div>
    </div>
  );
}
