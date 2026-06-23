
# Create ONE complete App.jsx file - everything in one file
# LandingPage + DEX + Dashboard + Staking + TradingView + Updated Logo

complete_app = r'''import React, { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import {
  ArrowUpDown, Settings, CheckCircle2, AlertCircle, X,
  Coins, Wallet, Moon, Sun, Share2, Zap, TrendingUp,
  ChevronDown, ExternalLink, Info, Clock, BarChart3, Shield,
  Github, Twitter, MessageCircle, FileText, Globe, HelpCircle,
  Search, Sliders, RefreshCw, ArrowRight, Layers, Percent,
  Activity, DollarSign, CandlestickChart, LayoutDashboard,
  Trophy, Award, Plus, Minus, Home, Menu
} from "lucide-react";

// ==================== CONFIG ====================
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function mint(address to, uint256 amount) external"
];
const POOL_ABI = [
  "function swap(address tokenIn, uint256 amountIn, uint256 minAmountOut) external returns (uint256 amountOut)",
  "function addLiquidity(uint256 amountA, uint256 amountB) external returns (uint256 lpTokens)",
  "function removeLiquidity(uint256 lpTokens) external returns (uint256 amountA, uint256 amountB)",
  "function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256 amountOut)",
  "function reserveA() view returns (uint256)",
  "function reserveB() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)"
];
const CONTRACTS = {
  tokenA: "0x6c18239A767d19dd6d274B94442f09eE6b9b6701",
  tokenB: "0x9013443A3E0Dd775152678a76fceDcA54e1E1710",
  pool: "0xbdA6416a9420fD9fC012A217930c803dA7F3f0f9",
};
const TOKEN_LIST = {
  USDC: { address: CONTRACTS.tokenA, logo: "💵", decimals: 18, symbol: "USDC", name: "USD Coin" },
  DAI: { address: CONTRACTS.tokenB, logo: "◈", decimals: 18, symbol: "DAI", name: "Dai Stablecoin" },
  zkLTC: { address: "NATIVE", logo: "⚡", decimals: 18, symbol: "zkLTC", name: "zkLitecoin" }
};
const LITVM_CHAIN_ID_HEX = "0x1159";
const LITVM_CHAIN_ID_DEC = 4441n;
const LITVM_PARAMS = {
  chainId: LITVM_CHAIN_ID_HEX, chainName: "LitVM Testnet",
  nativeCurrency: { name: "zkLTC", symbol: "zkLTC", decimals: 18 },
  rpcUrls: ["https://liteforge.rpc.caldera.xyz/http"],
  blockExplorerUrls: ["https://liteforge.explorer.caldera.xyz"],
};
const shortAddr = (addr) => addr ? `${addr.slice(0,6)}...${addr.slice(-4)}` : "";

// ==================== FREESIA LOGO (Updated) ====================
function FreesiaLogo({ size = 32 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="28" rx="12" ry="18" fill="#f9a8d4" opacity="0.9" transform="rotate(0 50 50)"/>
        <ellipse cx="50" cy="28" rx="12" ry="18" fill="#f9a8d4" opacity="0.9" transform="rotate(60 50 50)"/>
        <ellipse cx="50" cy="28" rx="12" ry="18" fill="#f9a8d4" opacity="0.9" transform="rotate(120 50 50)"/>
        <ellipse cx="50" cy="28" rx="12" ry="18" fill="#f9a8d4" opacity="0.9" transform="rotate(180 50 50)"/>
        <ellipse cx="50" cy="28" rx="12" ry="18" fill="#f9a8d4" opacity="0.9" transform="rotate(240 50 50)"/>
        <ellipse cx="50" cy="28" rx="12" ry="18" fill="#f9a8d4" opacity="0.9" transform="rotate(300 50 50)"/>
        <text x="50" y="68" fontSize="52" fill="#1e293b" fontWeight="bold" fontFamily="serif" fontStyle="italic" textAnchor="middle">f</text>
      </svg>
    </div>
  );
}

// ==================== TRADINGVIEW ====================
function TradingViewWidget({ symbol, darkMode }) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true, symbol: `COINBASE:${symbol}`, interval: "60", timezone: "Etc/UTC",
      theme: darkMode ? "dark" : "light", style: "1", locale: "en", enable_publishing: false,
      backgroundColor: darkMode ? "#0a0e1a" : "#ffffff", hide_top_toolbar: false,
      hide_legend: false, save_image: true, calendar: false, hide_volume: false,
      support_host: "https://www.tradingview.com"
    });
    container.appendChild(script);
    return () => { container.innerHTML = ""; };
  }, [symbol, darkMode]);
  return (
    <div style={{ width: "100%", height: "100%", minHeight: "400px", position: "relative" }}>
      <div className="tradingview-widget-container" ref={containerRef} style={{ width: "100%", height: "100%" }}>
        <div className="tradingview-widget-container__widget" style={{ width: "100%", height: "100%" }}></div>
      </div>
    </div>
  );
}

// ==================== LANDING PAGE ====================
function LandingPage({ onLaunchApp }) {
  const [darkMode, setDarkMode] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({ tvl: 0, volume: 0, users: 0, tx: 0 });

  const T = {
    bg: darkMode ? "#0a0e1a" : "#f8fafc",
    text: darkMode ? "#f8fafc" : "#0f172a",
    sub: darkMode ? "#94a3b8" : "#64748b",
    accent: "#f59e0b",
    card: darkMode ? "rgba(30, 41, 59, 0.6)" : "rgba(255, 255, 255, 0.8)",
    border: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    green: "#10b981", purple: "#8b5cf6", blue: "#3b82f6",
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const targets = { tvl: 565000, volume: 1280000, users: 3420, tx: 15600 };
    const duration = 2000, steps = 60, interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedStats({
        tvl: Math.floor(targets.tvl * easeOut),
        volume: Math.floor(targets.volume * easeOut),
        users: Math.floor(targets.users * easeOut),
        tx: Math.floor(targets.tx * easeOut),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, []);

  const features = [
    { icon: Zap, title: "Lightning Swaps", desc: "Tukar token USDC/DAI/zkLTC dengan kecepatan tinggi di jaringan LitVM Testnet.", color: T.accent },
    { icon: Layers, title: "Liquidity Pools", desc: "Suntikkan likuiditas, dapatkan LP token, dan terima fee dari setiap swap.", color: T.green },
    { icon: BarChart3, title: "IL Simulator", desc: "Simulator risiko impermanent loss pertama yang terintegrasi langsung di DEX.", color: T.purple },
    { icon: Coins, title: "MBG Staking", desc: "Stake LP token dan dapatkan reward MBG dengan APR hingga 32.5%.", color: T.blue },
    { icon: Shield, title: "Secure & Transparent", desc: "Semua transaksi tercatat di blockchain LitVM yang bisa diverifikasi.", color: "#ef4444" },
    { icon: TrendingUp, title: "Real-time Charts", desc: "Integrasi TradingView untuk analisis harga LTC, BTC, dan ETH real-time.", color: "#06b6d4" },
  ];

  const steps = [
    { num: "01", title: "Connect Wallet", desc: "Hubungkan MetaMask ke jaringan LitVM Testnet secara otomatis." },
    { num: "02", title: "Get Test Tokens", desc: "Gunakan faucet untuk mendapatkan USDC, DAI, dan zkLTC gratis." },
    { num: "03", title: "Start Trading", desc: "Swap, pool, atau stake langsung dari dashboard." },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: T.bg, color: T.text, fontFamily: "'Inter', sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .glass-card { background:${T.card}; backdrop-filter:blur(20px); border:1px solid ${T.border}; border-radius:24px; }
        .btn-primary { background:linear-gradient(135deg,#f59e0b,#d97706); color:#0f172a; border:none; padding:16px 32px; border-radius:16px; font-weight:700; font-size:15px; cursor:pointer; transition:all 0.2s; box-shadow:0 4px 14px rgba(245,158,11,0.3); display:inline-flex; align-items:center; gap:8px; text-decoration:none; }
        .btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 25px rgba(245,158,11,0.4); }
        .btn-secondary { background:transparent; color:${T.text}; border:1px solid ${T.border}; padding:14px 28px; border-radius:16px; font-weight:600; font-size:15px; cursor:pointer; transition:all 0.2s; display:inline-flex; align-items:center; gap:8px; text-decoration:none; }
        .btn-secondary:hover { border-color:#f59e0b; background:${darkMode?"rgba(245,158,11,0.05)":"rgba(245,158,11,0.03)"}; }
        .feature-card { background:${darkMode?"rgba(30,41,59,0.4)":"rgba(255,255,255,0.6)"}; border:1px solid ${T.border}; border-radius:20px; padding:32px; transition:all 0.3s; }
        .feature-card:hover { transform:translateY(-4px); border-color:${darkMode?"rgba(255,255,255,0.15)":"rgba(0,0,0,0.1)"}; box-shadow:0 20px 40px rgba(0,0,0,0.1); }
        .footer-link { color:${T.sub}; text-decoration:none; font-size:13px; transition:color 0.2s; }
        .footer-link:hover { color:#f59e0b; }
      `}</style>

      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, padding:"16px 24px", background:scrolled?(darkMode?"rgba(10,14,26,0.9)":"rgba(248,250,252,0.9)"):"transparent", backdropFilter:scrolled?"blur(20px)":"none", transition:"all 0.3s", borderBottom:scrolled?`1px solid ${T.border}`:"none" }}>
        <div style={{ maxWidth:"1200px", margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <FreesiaLogo size={28} />
            <span style={{ fontWeight:"800", fontSize:"18px", color:T.text }}>Freesia DEX</span>
          </div>
          {!isMobile && (
            <div style={{ display:"flex", alignItems:"center", gap:"32px" }}>
              <a href="#features" style={{ color:T.sub, textDecoration:"none", fontSize:"14px", fontWeight:"500" }}>Features</a>
              <a href="#how-it-works" style={{ color:T.sub, textDecoration:"none", fontSize:"14px", fontWeight:"500" }}>How It Works</a>
              <a href="#stats" style={{ color:T.sub, textDecoration:"none", fontSize:"14px", fontWeight:"500" }}>Stats</a>
              <button onClick={() => setDarkMode(!darkMode)} style={{ background:"none", border:"none", cursor:"pointer", color:T.sub }}>{darkMode?"☀️":"🌙"}</button>
              <button onClick={onLaunchApp} className="btn-primary" style={{ padding:"10px 24px", fontSize:"14px" }}>Launch App <ArrowRight size={16} /></button>
            </div>
          )}
          {isMobile && (
            <button onClick={() => setShowMobileMenu(!showMobileMenu)} style={{ background:"none", border:"none", cursor:"pointer", color:T.text }}>{showMobileMenu ? <X size={24} /> : <Menu size={24} />}</button>
          )}
        </div>
        {isMobile && showMobileMenu && (
          <div style={{ position:"absolute", top:"60px", left:"20px", right:"20px", background:T.card, border:`1px solid ${T.border}`, borderRadius:"16px", padding:"20px", display:"flex", flexDirection:"column", gap:"12px", boxShadow:"0 20px 40px rgba(0,0,0,0.2)", animation:"slideUp 0.2s ease" }}>
            <a href="#features" onClick={()=>setShowMobileMenu(false)} style={{ color:T.text, textDecoration:"none", fontSize:"16px", fontWeight:"600", padding:"8px 0" }}>Features</a>
            <a href="#how-it-works" onClick={()=>setShowMobileMenu(false)} style={{ color:T.text, textDecoration:"none", fontSize:"16px", fontWeight:"600", padding:"8px 0" }}>How It Works</a>
            <button onClick={()=>{onLaunchApp();setShowMobileMenu(false)}} className="btn-primary" style={{ width:"100%", justifyContent:"center", marginTop:"8px" }}>Launch App <ArrowRight size={16} /></button>
          </div>
        )}
      </nav>

      <section style={{ padding:"140px 24px 100px", position:"relative", overflow:"hidden", background:darkMode?"radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.15) 0%, transparent 50%), #0a0e1a":"radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.08) 0%, transparent 50%), #f8fafc" }}>
        <div style={{ position:"absolute", top:"10%", right:"10%", width:"400px", height:"400px", borderRadius:"50%", background:"radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)", filter:"blur(60px)", animation:"float 6s ease-in-out infinite" }} />
        <div style={{ maxWidth:"1000px", margin:"0 auto", textAlign:"center", position:"relative", zIndex:1 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"8px 16px", borderRadius:"20px", background:darkMode?"rgba(245,158,11,0.1)":"rgba(245,158,11,0.08)", border:`1px solid ${darkMode?"rgba(245,158,11,0.2)":"rgba(245,158,11,0.15)"}`, marginBottom:"32px" }}>
            <span style={{ width:"8px", height:"8px", borderRadius:"50%", background:T.green }} />
            <span style={{ fontSize:"13px", fontWeight:"600", color:darkMode?"#fbbf24":"#b45309" }}>Live on LitVM Testnet</span>
          </div>
          <h1 style={{ fontSize:isMobile?"36px":"56px", fontWeight:"900", lineHeight:"1.1", margin:"0 0 20px", letterSpacing:"-1.5px", background:"linear-gradient(135deg, #f8fafc 0%, #fbbf24 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            The First DEX on<br />LitVM Network
          </h1>
          <p style={{ fontSize:isMobile?"16px":"20px", color:T.sub, maxWidth:"600px", margin:"0 auto 40px", lineHeight:"1.6" }}>
            Swap, pool, and stake with the only DEX featuring an integrated Impermanent Loss Risk Simulator.
          </p>
          <div style={{ display:"flex", gap:"16px", justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={onLaunchApp} className="btn-primary" style={{ fontSize:"16px", padding:"18px 36px" }}>Launch App <ArrowRight size={18} /></button>
            <a href="https://liteforge.explorer.caldera.xyz" target="_blank" rel="noreferrer" className="btn-secondary">View Explorer <ExternalLink size={16} /></a>
          </div>
        </div>
      </section>

      <section id="stats" style={{ padding:"60px 24px", background:darkMode?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)" }}>
        <div style={{ maxWidth:"1200px", margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"1fr 1fr 1fr 1fr", gap:"16px" }}>
            <div className="glass-card" style={{ padding:"24px", textAlign:"center" }}>
              <div style={{ fontSize:"28px", fontWeight:"800", color:T.accent, fontFamily:"monospace" }}>${animatedStats.tvl.toLocaleString()}</div>
              <div style={{ fontSize:"13px", color:T.sub, marginTop:"4px" }}>Total Value Locked</div>
            </div>
            <div className="glass-card" style={{ padding:"24px", textAlign:"center" }}>
              <div style={{ fontSize:"28px", fontWeight:"800", color:T.green, fontFamily:"monospace" }}>${animatedStats.volume.toLocaleString()}</div>
              <div style={{ fontSize:"13px", color:T.sub, marginTop:"4px" }}>Total Volume</div>
            </div>
            <div className="glass-card" style={{ padding:"24px", textAlign:"center" }}>
              <div style={{ fontSize:"28px", fontWeight:"800", color:T.purple, fontFamily:"monospace" }}>{animatedStats.users.toLocaleString()}</div>
              <div style={{ fontSize:"13px", color:T.sub, marginTop:"4px" }}>Active Users</div>
            </div>
            <div className="glass-card" style={{ padding:"24px", textAlign:"center" }}>
              <div style={{ fontSize:"28px", fontWeight:"800", color:T.blue, fontFamily:"monospace" }}>{animatedStats.tx.toLocaleString()}</div>
              <div style={{ fontSize:"13px", color:T.sub, marginTop:"4px" }}>Transactions</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" style={{ padding:"100px 24px" }}>
        <div style={{ maxWidth:"1200px", margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:"60px" }}>
            <span style={{ fontSize:"13px", fontWeight:"700", color:T.accent, textTransform:"uppercase", letterSpacing:"2px" }}>Features</span>
            <h2 style={{ fontSize:isMobile?"28px":"40px", fontWeight:"800", margin:"12px 0 16px" }}>Everything You Need</h2>
            <p style={{ fontSize:"16px", color:T.sub, maxWidth:"500px", margin:"0 auto", lineHeight:"1.6" }}>Freesia DEX menyediakan semua tools untuk trading DeFi di jaringan LitVM.</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr", gap:"20px" }}>
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="feature-card" style={{ opacity:0, animation:`slideUp 0.5s ease ${i*0.1}s forwards` }}>
                  <div style={{ width:"48px", height:"48px", borderRadius:"14px", background:`${f.color}15`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"20px" }}>
                    <Icon size={24} color={f.color} />
                  </div>
                  <h3 style={{ fontSize:"18px", fontWeight:"700", margin:"0 0 10px", color:T.text }}>{f.title}</h3>
                  <p style={{ fontSize:"14px", color:T.sub, lineHeight:"1.6", margin:0 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" style={{ padding:"100px 24px", background:darkMode?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)" }}>
        <div style={{ maxWidth:"1000px", margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:"60px" }}>
            <span style={{ fontSize:"13px", fontWeight:"700", color:T.accent, textTransform:"uppercase", letterSpacing:"2px" }}>Getting Started</span>
            <h2 style={{ fontSize:isMobile?"28px":"40px", fontWeight:"800", margin:"12px 0 16px" }}>How It Works</h2>
          </div>
          <div style={{ display:"flex", flexDirection:isMobile?"column":"row", gap:"24px" }}>
            {steps.map((step, i) => (
              <div key={i} className="glass-card" style={{ flex:1, padding:"32px", position:"relative", opacity:0, animation:`slideUp 0.5s ease ${i*0.15}s forwards` }}>
                <div style={{ fontSize:"40px", fontWeight:"900", color:darkMode?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)", position:"absolute", top:"20px", right:"24px" }}>{step.num}</div>
                <div style={{ width:"48px", height:"48px", borderRadius:"14px", background:"rgba(245,158,11,0.1)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"20px" }}>
                  {i===0?<Wallet size={24} color={T.accent}/>:i===1?<Zap size={24} color={T.accent}/>:<ArrowRight size={24} color={T.accent}/>}
                </div>
                <h3 style={{ fontSize:"20px", fontWeight:"700", margin:"0 0 10px", color:T.text }}>{step.title}</h3>
                <p style={{ fontSize:"14px", color:T.sub, lineHeight:"1.6", margin:0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding:"100px 24px", position:"relative" }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(139,92,246,0.05) 100%)" }} />
        <div className="glass-card" style={{ maxWidth:"800px", margin:"0 auto", padding:isMobile?"40px 24px":"60px", textAlign:"center", position:"relative", zIndex:1 }}>
          <h2 style={{ fontSize:isMobile?"24px":"36px", fontWeight:"800", margin:"0 0 16px" }}>Ready to Start Trading?</h2>
          <p style={{ fontSize:"16px", color:T.sub, maxWidth:"500px", margin:"0 auto 32px", lineHeight:"1.6" }}>Bergabung dengan ribuan user yang sudah trading di Freesia DEX.</p>
          <button onClick={onLaunchApp} className="btn-primary" style={{ fontSize:"16px", padding:"18px 40px" }}>Launch App Now <ArrowRight size={18} /></button>
        </div>
      </section>

      <footer style={{ padding:"60px 24px 30px", borderTop:`1px solid ${T.border}` }}>
        <div style={{ maxWidth:"1200px", margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"2fr 1fr 1fr 1fr", gap:"40px", marginBottom:"40px" }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"16px" }}><FreesiaLogo size={28} /><span style={{ fontWeight:"800", fontSize:"18px", color:T.text }}>Freesia DEX</span></div>
              <p style={{ fontSize:"13px", color:T.sub, lineHeight:"1.7", margin:0 }}>DEX terintegrasi pertama di jaringan LitVM Testnet. Built by @0xzackbh.</p>
            </div>
            <div><h4 style={{ fontSize:"14px", fontWeight:"700", color:T.text, marginBottom:"16px" }}>Products</h4><div style={{ display:"flex", flexDirection:"column", gap:"10px" }}><span className="footer-link" style={{ cursor:"pointer" }} onClick={onLaunchApp}>Swap</span><span className="footer-link" style={{ cursor:"pointer" }} onClick={onLaunchApp}>Pool</span><span className="footer-link" style={{ cursor:"pointer" }} onClick={onLaunchApp}>Staking</span><span className="footer-link" style={{ cursor:"pointer" }} onClick={onLaunchApp}>Dashboard</span></div></div>
            <div><h4 style={{ fontSize:"14px", fontWeight:"700", color:T.text, marginBottom:"16px" }}>Developers</h4><div style={{ display:"flex", flexDirection:"column", gap:"10px" }}><a href="https://liteforge.explorer.caldera.xyz" target="_blank" rel="noreferrer" className="footer-link">Explorer</a><span className="footer-link">Documentation</span></div></div>
            <div><h4 style={{ fontSize:"14px", fontWeight:"700", color:T.text, marginBottom:"16px" }}>Support</h4><div style={{ display:"flex", flexDirection:"column", gap:"10px" }}><span className="footer-link">Community</span><span className="footer-link">Terms</span><span className="footer-link">Privacy</span></div></div>
          </div>
          <div style={{ textAlign:"center", paddingTop:"24px", borderTop:`1px solid ${T.border}` }}>
            <p style={{ fontSize:"12px", color:T.sub, margin:0 }}>© 2026 Freesia DEX. Built by <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color:T.accent, textDecoration:"none", fontWeight:"600" }}>@0xzackbh</a> on LitVM Testnet.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ==================== USER DASHBOARD ====================
function UserDashboard({ mintBalances, txHistory, myStakedValue, mbgRewards, darkMode, T }) {
  const totalVolume = txHistory.reduce((acc, tx) => {
    if (tx.type === "Swap") { const amt = parseFloat(tx.detail?.split(" ")?.[0]) || 0; return acc + amt; }
    return acc;
  }, 0);
  const swapCount = txHistory.filter(t => t.type === "Swap").length;
  const mintCount = txHistory.filter(t => t.type === "Mint").length;
  const poolCount = txHistory.filter(t => t.type === "Add Liquidity").length;
  const totalTx = txHistory.length;
  
  const badges = [
    { name: "First Swap", icon: Zap, unlocked: swapCount >= 1, color: "#f59e0b" },
    { name: "Trader Pro", icon: TrendingUp, unlocked: swapCount >= 5, color: "#3b82f6" },
    { name: "Liquidity Provider", icon: Layers, unlocked: poolCount >= 1, color: "#10b981" },
    { name: "Token Miner", icon: Coins, unlocked: mintCount >= 3, color: "#8b5cf6" },
    { name: "Staking King", icon: Trophy, unlocked: myStakedValue > 0, color: "#ef4444" },
    { name: "Diamond Hands", icon: Award, unlocked: totalTx >= 10, color: "#06b6d4" },
  ];

  return (
    <div className="glass-card" style={{ width: "100%", maxWidth: "800px", padding: "28px" }}>
      <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
        <LayoutDashboard size={20} color={T.accent} /> User Dashboard
      </h3>
      <p style={{ fontSize: "13px", color: T.sub, marginBottom: "24px" }}>Ringkasan aktivitas dan pencapaian Anda di Freesia DEX.</p>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
        <div className="stat-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: T.sub }}>Total Swaps</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: T.accent }}>{swapCount}</div>
        </div>
        <div className="stat-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: T.sub }}>Total Volume</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: T.green }}>${totalVolume.toFixed(2)}</div>
        </div>
        <div className="stat-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: T.sub }}>LP Provided</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: T.blue }}>{poolCount}x</div>
        </div>
        <div className="stat-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: T.sub }}>MBG Earned</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: T.purple }}>{mbgRewards.toFixed(4)}</div>
        </div>
      </div>

      <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
        <Trophy size={16} color={T.accent} /> Achievement Badges
      </h4>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "24px" }}>
        {badges.map((badge, i) => {
          const Icon = badge.icon;
          return (
            <div key={i} style={{ padding: "14px", borderRadius: "14px", textAlign: "center", border: `1px solid ${badge.unlocked ? badge.color + "40" : T.border}`, background: badge.unlocked ? badge.color + "10" : T.input, opacity: badge.unlocked ? 1 : 0.5 }}>
              <Icon size={20} color={badge.unlocked ? badge.color : T.sub} style={{ marginBottom: "6px" }} />
              <div style={{ fontSize: "11px", fontWeight: "700", color: badge.unlocked ? badge.color : T.sub }}>{badge.name}</div>
              {badge.unlocked && <div style={{ fontSize: "10px", color: T.green, marginTop: "2px" }}>Unlocked</div>}
            </div>
          );
        })}
      </div>

      <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px" }}>Wallet Balances</h4>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {Object.entries(TOKEN_LIST).map(([sym, info]) => (
          <div key={sym} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: "12px", background: T.input, border: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "24px" }}>{info.logo}</span>
              <span style={{ fontWeight: "600", fontSize: "14px" }}>{sym}</span>
            </div>
            <span style={{ fontWeight: "700", fontFamily: "monospace" }}>{mintBalances[sym] || "0.00"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== MAIN APP ====================
export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [onCorrectNetwork, setOnCorrectNetwork] = useState(false);
  const [activeTab, setActiveTab] = useState("swap");
  const [toast, setToast] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") { const s = localStorage.getItem("freesia_darkmode"); return s ? s === "true" : true; }
    return true;
  });
  const [ltcData, setLtcData] = useState({ price: "...", change: "..." });
  const [chartSymbol, setChartSymbol] = useState("LTCUSD");
  const [showChart, setShowChart] = useState(true);
  const [slippage, setSlippage] = useState(0.5);
  const [showSlippageModal, setShowSlippageModal] = useState(false);
  const [customSlippage, setCustomSlippage] = useState("");
  const [fromSym, setFromSym] = useState("USDC");
  const [toSym, setToSym] = useState("DAI");
  const [amountIn, setAmountIn] = useState("");
  const [amountOutPreview, setAmountOutPreview] = useState("");
  const [priceImpact, setPriceImpact] = useState(0);
  const [fromBalance, setFromBalance] = useState("0.00");
  const [toBalance, setToBalance] = useState("0.00");
  const [swapLoading, setSwapLoading] = useState(false);
  const [showTokenSelector, setShowTokenSelector] = useState(null);
  const [selectedPool, setSelectedPool] = useState("USDC-DAI");
  const [amountAInput, setAmountAInput] = useState("");
  const [amountBInput, setAmountBInput] = useState("");
  const [poolLoading, setPoolLoading] = useState(false);
  const [priceChange, setPriceChange] = useState(0);
  const [ilResult, setIlResult] = useState({ ilPercent: 0, lossAmount: 0 });
  const [mintBalances, setMintBalances] = useState({ USDC: "0.00", DAI: "0.00", zkLTC: "0.00" });
  const [mintingSym, setMintingSym] = useState(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [myStakedValue, setMyStakedValue] = useState(0);
  const [mbgRewards, setMbgRewards] = useState(0);
  const [txHistory, setTxHistory] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [lastSwap, setLastSwap] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [gasEstimate, setGasEstimate] = useState(null);
  const [poolReserves, setPoolReserves] = useState({ reserveA: 0, reserveB: 0 });
  const [communityLiquidity, setCommunityLiquidity] = useState({ usdcDaiTVL: 520400, zkLtcUsdcTVL: 45100 });
  const [userLPBalance, setUserLPBalance] = useState(0);
  const [totalLPSupply, setTotalLPSupply] = useState(0);
  const [feeEarned, setFeeEarned] = useState(0);
  const [showRemoveLPModal, setShowRemoveLPModal] = useState(false);
  const [removeLPAmount, setRemoveLPAmount] = useState("");

  const showToast = useCallback((icon, msg) => { setToast({ icon, msg }); setTimeout(() => setToast(null), 4000); }, []);
  const addToHistory = (type, detail) => { setTxHistory(prev => [{ id: Date.now(), type, detail, time: new Date().toLocaleTimeString("id-ID") }, ...prev].slice(0, 20)); };

  const T = {
    bg: darkMode ? "#0a0e1a" : "#f8fafc", card: darkMode ? "rgba(30,41,59,0.7)" : "rgba(255,255,255,0.85)",
    cardSolid: darkMode ? "#1e293b" : "#ffffff", input: darkMode ? "rgba(15,23,42,0.6)" : "rgba(248,250,252,0.8)",
    border: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", borderHover: darkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)",
    text: darkMode ? "#f8fafc" : "#0f172a", sub: darkMode ? "#94a3b8" : "#64748b",
    accent: "#f59e0b", accentGlow: darkMode ? "rgba(245,158,11,0.2)" : "rgba(245,158,11,0.1)",
    green: "#10b981", greenBg: darkMode ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.08)",
    red: "#ef4444", redBg: darkMode ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.08)",
    blue: "#3b82f6", purple: "#8b5cf6",
  };

  useEffect(() => { const check = () => setIsMobile(window.innerWidth < 768); check(); window.addEventListener("resize", check); return () => window.removeEventListener("resize", check); }, []);
  useEffect(() => { const h = () => setScrolled(window.scrollY > 20); window.addEventListener("scroll", h); return () => window.removeEventListener("scroll", h); }, []);
  useEffect(() => { localStorage.setItem("freesia_darkmode", darkMode.toString()); }, [darkMode]);

  useEffect(() => {
    const fetchLtc = async () => {
      try { const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd&include_24hr_change=true");
        const d = await r.json(); setLtcData({ price: d.litecoin.usd.toFixed(2), change: d.litecoin.usd_24h_change.toFixed(2) });
      } catch(e){}
    }; fetchLtc(); const iv = setInterval(fetchLtc, 30000); return () => clearInterval(iv);
  }, []);

  useEffect(() => { if (myStakedValue <= 0) return; const iv = setInterval(() => setMbgRewards(p => p + myStakedValue * (0.00001 + Math.random() * 0.000005)), 1000); return () => clearInterval(iv); }, [myStakedValue]);

  useEffect(() => {
    if (userLPBalance <= 0) return;
    const iv = setInterval(() => setFeeEarned(p => p + userLPBalance * 0.0001), 5000);
    return () => clearInterval(iv);
  }, [userLPBalance]);

  const updateData = useCallback(async () => {
    if (!window.ethereum || !account) return;
    try { const w3 = new ethers.BrowserProvider(window.ethereum); const nb = await w3.getBalance(account);
      const tA = new ethers.Contract(CONTRACTS.tokenA, ERC20_ABI, w3); const tB = new ethers.Contract(CONTRACTS.tokenB, ERC20_ABI, w3);
      const [bA, bB] = await Promise.all([tA.balanceOf(account).catch(()=>0n), tB.balanceOf(account).catch(()=>0n)]);
      const fb = { USDC: parseFloat(ethers.formatUnits(bA,18)).toFixed(2), DAI: parseFloat(ethers.formatUnits(bB,18)).toFixed(2), zkLTC: parseFloat(ethers.formatEther(nb)).toFixed(4) };
      setMintBalances(fb); setFromBalance(fb[fromSym]||"0.00"); setToBalance(fb[toSym]||"0.00");
      const poolContract = new ethers.Contract(CONTRACTS.pool, POOL_ABI, w3);
      const lpBal = await poolContract.balanceOf(account).catch(()=>0n);
      const lpSupply = await poolContract.totalSupply().catch(()=>0n);
      setUserLPBalance(parseFloat(ethers.formatUnits(lpBal, 18)));
      setTotalLPSupply(parseFloat(ethers.formatUnits(lpSupply, 18)));
    } catch(e){ console.error(e); }
  }, [account, fromSym, toSym]);
  useEffect(() => { if (account) { updateData(); const iv = setInterval(updateData, 8000); return () => clearInterval(iv); } }, [account, updateData]);

  const loadPoolReserves = useCallback(async () => {
    try { const rp = provider || new ethers.JsonRpcProvider(LITVM_PARAMS.rpcUrls[0]); const pc = new ethers.Contract(CONTRACTS.pool, POOL_ABI, rp);
      const [rA, rB] = await Promise.all([pc.reserveA().catch(()=>0n), pc.reserveB().catch(()=>0n)]);
      setPoolReserves({ reserveA: parseFloat(ethers.formatUnits(rA,18)), reserveB: parseFloat(ethers.formatUnits(rB,18)) });
    } catch(e){}
  }, [provider]);
  useEffect(() => { loadPoolReserves(); const iv = setInterval(loadPoolReserves, 10000); return () => clearInterval(iv); }, [loadPoolReserves]);

  useEffect(() => {
    const calc = async () => {
      if (!amountIn || parseFloat(amountIn) <= 0) { setAmountOutPreview(""); setPriceImpact(0); setGasEstimate(null); return; }
      const isStable = (fromSym === "USDC" && toSym === "DAI") || (fromSym === "DAI" && toSym === "USDC");
      if (!isStable) { setAmountOutPreview(""); setPriceImpact(0); setGasEstimate(null); return; }
      try { const rp = provider || new ethers.JsonRpcProvider(LITVM_PARAMS.rpcUrls[0]); const pc = new ethers.Contract(CONTRACTS.pool, POOL_ABI, rp);
        const fAddr = TOKEN_LIST[fromSym].address; const aIn = ethers.parseUnits(String(amountIn), 18);
        const out = await pc.getAmountOut(fAddr, aIn); const of = parseFloat(ethers.formatUnits(out, 18));
        setAmountOutPreview(of.toFixed(6));
        if (poolReserves.reserveA > 0 && poolReserves.reserveB > 0) { const spot = fromSym === "USDC" ? poolReserves.reserveB / poolReserves.reserveA : poolReserves.reserveA / poolReserves.reserveB; const eff = of / parseFloat(amountIn); setPriceImpact(Math.abs((spot - eff) / spot) * 100); }
        try { const fd = await rp.getFeeData(); const gp = fd.gasPrice || BigInt("1000000000"); const ec = parseFloat(ethers.formatEther(gp * BigInt(400000))); const up = parseFloat(ltcData.price) || 0; setGasEstimate({ eth: ec.toFixed(6), usd: (ec * up).toFixed(4) }); } catch(e){ setGasEstimate(null); }
      } catch(e){ setAmountOutPreview(""); }
    }; calc();
  }, [amountIn, fromSym, toSym, provider, poolReserves, ltcData.price]);

  useEffect(() => { const p = priceChange / 100; const il = 2 * Math.sqrt(p + 1) / (p + 2) - 1; setIlResult({ ilPercent: Math.abs(il * 100), lossAmount: 1000 * Math.abs(il) }); }, [priceChange]);

  const connectWallet = async () => {
    if (!window.ethereum) { showToast("❌", "MetaMask tidak terinstall!"); return; }
    setConnecting(true);
    try { const acc = await window.ethereum.request({ method: "eth_requestAccounts" }); const w3 = new ethers.BrowserProvider(window.ethereum); const net = await w3.getNetwork();
      if (net.chainId !== LITVM_CHAIN_ID_DEC) { try { await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: LITVM_CHAIN_ID_HEX }] }); } catch(sw){ if (sw.code === 4902) await window.ethereum.request({ method: "wallet_addEthereumChain", params: [LITVM_PARAMS] }); } }
      const fp = new ethers.BrowserProvider(window.ethereum); const fn = await fp.getNetwork(); const sg = await fp.getSigner();
      setProvider(fp); setSigner(sg); setAccount(acc[0]); setOnCorrectNetwork(fn.chainId === LITVM_CHAIN_ID_DEC); showToast("✅", "Dompet terhubung!");
    } catch(e){ showToast("❌", "Koneksi gagal"); } finally { setConnecting(false); }
  };

  const handleSwap = async () => {
    if (!signer || !account) return showToast("❌", "Hubungkan dompet!");
    const isStable = (fromSym === "USDC" && toSym === "DAI") || (fromSym === "DAI" && toSym === "USDC");
    if (!isStable) return showToast("❌", "Pool hanya support USDC/DAI"); if (!amountIn || parseFloat(amountIn) <= 0) return showToast("❌", "Masukkan jumlah!");
    setSwapLoading(true);
    try { const pIn = ethers.parseUnits(String(amountIn), 18); const fAddr = TOKEN_LIST[fromSym].address; const tc = new ethers.Contract(fAddr, ERC20_ABI, signer); const pc = new ethers.Contract(CONTRACTS.pool, POOL_ABI, signer);
      const al = await tc.allowance(account, CONTRACTS.pool); if (al < pIn) { showToast("⏳", "Approve..."); await (await tc.approve(CONTRACTS.pool, pIn)).wait(); }
      const eo = await pc.getAmountOut(fAddr, pIn); const sb = BigInt(Math.floor(slippage * 100)); const minOut = eo - (eo * sb / 10000n);
      showToast("⏳", "Konfirmasi swap..."); const tx = await pc.swap(fAddr, pIn, minOut, { gasLimit: 400000 }); await tx.wait();
      const oa = amountOutPreview || "?"; showToast("🎉", `Swap ${amountIn} ${fromSym} → ${oa} ${toSym}`); addToHistory("Swap", `${amountIn} ${fromSym} → ${toSym}`);
      setLastSwap({ amountIn, fromSym, toSym, outAmt: oa }); setShowShareModal(true); setAmountIn(""); updateData(); loadPoolReserves();
    } catch(e){ showToast("❌", "Swap Gagal!"); } finally { setSwapLoading(false); }
  };
  const handleShare = () => { if (!lastSwap) return; const t = encodeURIComponent(`Just swapped ${lastSwap.amountIn} ${lastSwap.fromSym} → ${lastSwap.outAmt} ${lastSwap.toSym} on Freesia DEX 🌸\nBuilt on LitVM Testnet ⚡\n@0xzackbh #FreesiaDEX`); window.open(`https://x.com/intent/tweet?text=${t}`, "_blank"); setShowShareModal(false); };
  const handleMintToken = async (sym) => { if (!signer || !account) { showToast("❌", "Hubungkan dompet!"); return; } setMintingSym(sym); try { if (sym === "zkLTC") { showToast("💡", "zkLTC dari faucet jaringan!"); return; } const ta = TOKEN_LIST[sym].address; const tc = new ethers.Contract(ta, ERC20_ABI, signer); showToast("⏳", `Mint ${sym}...`); const tx = await tc.mint(account, ethers.parseUnits("10000", 18)); await tx.wait(); showToast("✅", `Klaim 10k ${sym}!`); addToHistory("Mint", `10k ${sym}`); setCommunityLiquidity(p => ({ ...p, usdcDaiTVL: p.usdcDaiTVL + 500 })); updateData(); } catch(e){ showToast("❌", `Gagal mint ${sym}`); } finally { setMintingSym(null); } };
  const handleAddLiquidity = async () => { if (!signer || !account) return showToast("❌", "Hubungkan dompet!"); if (!amountAInput || !amountBInput) return showToast("❌", "Masukkan jumlah!"); setPoolLoading(true); try { const pA = ethers.parseUnits(String(amountAInput), 18); const pB = ethers.parseUnits(String(amountBInput), 18); const tA = new ethers.Contract(CONTRACTS.tokenA, ERC20_ABI, signer); const tB = new ethers.Contract(CONTRACTS.tokenB, ERC20_ABI, signer); const pc = new ethers.Contract(CONTRACTS.pool, POOL_ABI, signer); const [aA, aB] = await Promise.all([tA.allowance(account, CONTRACTS.pool), tB.allowance(account, CONTRACTS.pool)]); if (aA < pA) await (await tA.approve(CONTRACTS.pool, pA)).wait(); if (aB < pB) await (await tB.approve(CONTRACTS.pool, pB)).wait(); showToast("⏳", "Adding liquidity..."); const tx = await pc.addLiquidity(pA, pB, { gasLimit: 500000 }); await tx.wait(); const av = parseFloat(amountAInput) + parseFloat(amountBInput); setCommunityLiquidity(p => selectedPool === "USDC-DAI" ? { ...p, usdcDaiTVL: p.usdcDaiTVL + av } : { ...p, zkLtcUsdcTVL: p.zkLtcUsdcTVL + av }); showToast("🎉", "Liquidity added!"); addToHistory("Add Liquidity", `${amountAInput} + ${amountBInput}`); setAmountAInput(""); setAmountBInput(""); updateData(); loadPoolReserves(); } catch(e){ showToast("❌", "Gagal add LP"); } finally { setPoolLoading(false); } };
  
  const handleRemoveLiquidity = async () => {
    if (!signer || !account) return showToast("❌", "Hubungkan dompet!");
    if (!removeLPAmount || parseFloat(removeLPAmount) <= 0) return showToast("❌", "Masukkan jumlah LP!");
    setPoolLoading(true);
    try {
      const pc = new ethers.Contract(CONTRACTS.pool, POOL_ABI, signer);
      const lpWei = ethers.parseUnits(String(removeLPAmount), 18);
      showToast("⏳", "Removing liquidity...");
      const tx = await pc.removeLiquidity(lpWei, { gasLimit: 500000 });
      await tx.wait();
      showToast("🎉", "Liquidity removed!");
      addToHistory("Remove Liquidity", `${removeLPAmount} LP`);
      setRemoveLPAmount("");
      setShowRemoveLPModal(false);
      updateData(); loadPoolReserves();
    } catch(e) {
      showToast("❌", "Gagal remove LP");
    } finally {
      setPoolLoading(false);
    }
  };

  const swapTokens = () => { setFromSym(toSym); setToSym(fromSym); setAmountIn(""); setAmountOutPreview(""); };
  const selectToken = (sym, type) => { if (type === 'from') { if (sym === toSym) setToSym(fromSym); setFromSym(sym); } else { if (sym === fromSym) setFromSym(toSym); setToSym(sym); } setShowTokenSelector(null); setAmountIn(""); setAmountOutPreview(""); };
  const tabs = [{ id: "swap", label: "Swap", icon: ArrowUpDown }, { id: "mint", label: "Faucet", icon: Zap }, { id: "pool", label: "Pool", icon: Layers }, { id: "staking", label: "Staking", icon: Coins }, { id: "dashboard", label: "Dashboard", icon: LayoutDashboard }, { id: "history", label: "History", icon: Clock }];

  if (showLanding) return <LandingPage onLaunchApp={() => setShowLanding(false)} />;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: T.bg, color: T.text, fontFamily: "'Inter', sans-serif", transition: "all 0.3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { scrollbar-width: thin; scrollbar-color: ${darkMode ? "rgba(255,255,255,0.1) transparent" : "rgba(0,0,0,0.1) transparent"}; }
        *::-webkit-scrollbar { width: 6px; } *::-webkit-scrollbar-track { background: transparent; } *::-webkit-scrollbar-thumb { background: ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}; border-radius: 10px; }
        input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .glass-card { background: ${T.card}; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid ${T.border}; border-radius: 24px; }
        .glass-card:hover { border-color: ${T.borderHover}; }
        .btn-primary { background: linear-gradient(135deg, #f59e0b, #d97706); color: #0f172a; border: none; padding: 16px; border-radius: 16px; font-weight: 700; font-size: 15px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 14px rgba(245,158,11,0.3); }
        .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(245,158,11,0.4); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-secondary { background: ${T.input}; color: ${T.text}; border: 1px solid ${T.border}; padding: 10px 16px; border-radius: 12px; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
        .btn-secondary:hover { border-color: ${T.borderHover}; background: ${darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"}; }
        .input-box { background: ${T.input}; padding: 16px; border-radius: 16px; border: 1px solid ${T.border}; transition: all 0.2s; }
        .input-box:focus-within { border-color: ${T.accent}; box-shadow: 0 0 0 3px ${T.accentGlow}; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 999; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s ease; }
        .modal-content { background: ${T.cardSolid}; border-radius: 24px; padding: 28px; width: 100%; max-width: 420px; border: 1px solid ${T.border}; animation: slideUp 0.3s ease; max-height: 85vh; overflow-y: auto; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .token-row:hover { background: ${darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"}; }
        .tab-btn { padding: 10px 20px; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 13px; transition: all 0.2s; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
        .tab-btn.active { background: linear-gradient(135deg, #f59e0b, #d97706); color: #0f172a; box-shadow: 0 2px 10px rgba(245,158,11,0.3); }
        .tab-btn:not(.active) { background: transparent; color: ${T.sub}; }
        .tab-btn:not(.active):hover { background: ${darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}; color: ${T.text}; }
        .footer-link { color: ${T.sub}; text-decoration: none; font-size: 13px; transition: color 0.2s; }
        .footer-link:hover { color: ${T.accent}; }
        .stat-card { background: ${T.input}; border: 1px solid ${T.border}; border-radius: 16px; padding: 16px; transition: all 0.2s; }
        .stat-card:hover { border-color: ${T.borderHover}; }
        .chart-container { border-radius: 20px; overflow: hidden; border: 1px solid ${T.border}; background: ${darkMode ? "#0a0e1a" : "#ffffff"}; }
      `}</style>

      {/* REMOVE LP MODAL */}
      {showRemoveLPModal && (
        <div className="modal-overlay" onClick={() => setShowRemoveLPModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "400px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}><Minus size={20} color={T.red} /> Remove Liquidity</h3>
              <button onClick={() => setShowRemoveLPModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: T.sub }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: "13px", color: T.sub, marginBottom: "16px" }}>Your LP Balance: <strong style={{ color: T.text }}>{userLPBalance.toFixed(4)}</strong> LP</p>
            <div className="input-box" style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", color: T.sub, marginBottom: "6px", display: "block" }}>LP Amount to Remove</label>
              <input type="number" placeholder="0.00" value={removeLPAmount} onChange={e => setRemoveLPAmount(e.target.value)} style={{ width: "100%", background: "transparent", border: "none", color: T.text, fontSize: "22px", outline: "none", fontWeight: "700", fontFamily: "monospace" }} />
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <button onClick={() => setRemoveLPAmount((userLPBalance * 0.25).toFixed(4))} className="btn-secondary" style={{ flex: 1, justifyContent: "center", fontSize: "12px" }}>25%</button>
              <button onClick={() => setRemoveLPAmount((userLPBalance * 0.5).toFixed(4))} className="btn-secondary" style={{ flex: 1, justifyContent: "center", fontSize: "12px" }}>50%</button>
              <button onClick={() => setRemoveLPAmount((userLPBalance * 0.75).toFixed(4))} className="btn-secondary" style={{ flex: 1, justifyContent: "center", fontSize: "12px" }}>75%</button>
              <button onClick={() => setRemoveLPAmount(userLPBalance.toFixed(4))} className="btn-secondary" style={{ flex: 1, justifyContent: "center", fontSize: "12px" }}>MAX</button>
            </div>
            <button onClick={handleRemoveLiquidity} disabled={poolLoading} className="btn-primary" style={{ width: "100%", background: T.red, boxShadow: "none" }}>
              {poolLoading ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}><RefreshCw size={16} className="animate-pulse" /> Removing...</span> : "Remove Liquidity"}
            </button>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {showShareModal && lastSwap && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "400px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}><Share2 size={20} color={T.accent} /> Share Swap</h3>
              <button onClick={() => setShowShareModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: T.sub }}><X size={20} /></button>
            </div>
            <div style={{ background: darkMode ? "#0f172a" : "#f8fafc", borderRadius: "16px", padding: "20px", marginBottom: "20px", border: `1px solid ${T.border}` }}>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.7" }}>Just swapped <strong style={{ color: T.accent }}>{lastSwap.amountIn} {lastSwap.fromSym}</strong> → <strong style={{ color: T.accent }}>{lastSwap.outAmt} {lastSwap.toSym}</strong> on <strong>Freesia DEX</strong> 🌸<br /><br />Built on <strong>LitVM Testnet</strong> ⚡<br />@0xzackbh #FreesiaDEX</p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleShare} className="btn-primary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}><Twitter size={16} /> Post ke X</button>
              <button onClick={() => setShowShareModal(false)} className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Lewati</button>
            </div>
          </div>
        </div>
      )}

      {/* TOKEN SELECTOR */}
      {showTokenSelector && (
        <div className="modal-overlay" onClick={() => setShowTokenSelector(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px" }}>Pilih Token</h3>
              <button onClick={() => setShowTokenSelector(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.sub }}><X size={20} /></button>
            </div>
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: T.sub }} />
              <input placeholder="Cari token..." style={{ width: "100%", padding: "12px 12px 12px 40px", borderRadius: "12px", border: `1px solid ${T.border}`, background: T.input, color: T.text, fontSize: "14px", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {Object.entries(TOKEN_LIST).map(([sym, info]) => (
                <button key={sym} onClick={() => selectToken(sym, showTokenSelector)} className="token-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 12px", borderRadius: "12px", border: "none", background: "transparent", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "28px" }}>{info.logo}</span>
                    <div style={{ textAlign: "left" }}><div style={{ fontWeight: "700", fontSize: "15px", color: T.text }}>{info.symbol}</div><div style={{ fontSize: "12px", color: T.sub }}>{info.name}</div></div>
                  </div>
                  <div style={{ textAlign: "right" }}><div style={{ fontWeight: "600", fontSize: "14px", color: T.text }}>{mintBalances[sym] || "0.00"}</div><div style={{ fontSize: "11px", color: T.sub }}>Balance</div></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SLIPPAGE MODAL */}
      {showSlippageModal && (
        <div className="modal-overlay" onClick={() => setShowSlippageModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "360px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px" }}>Slippage Tolerance</h3>
              <button onClick={() => setShowSlippageModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: T.sub }}><X size={20} /></button>
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              {[0.1, 0.5, 1.0].map(v => <button key={v} onClick={() => { setSlippage(v); setCustomSlippage(""); }} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: slippage === v && !customSlippage ? `2px solid ${T.accent}` : `1px solid ${T.border}`, background: slippage === v && !customSlippage ? T.accentGlow : "transparent", fontWeight: "700", cursor: "pointer", color: T.text, fontSize: "14px" }}>{v}%</button>)}
            </div>
            <input type="number" placeholder="Custom %" value={customSlippage} onChange={e => { setCustomSlippage(e.target.value); if (e.target.value) setSlippage(parseFloat(e.target.value) || 0.5); }} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: `1px solid ${T.border}`, marginBottom: "12px", boxSizing: "border-box", background: T.input, color: T.text, fontSize: "14px" }} />
            {slippage > 5 && <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: T.red, marginBottom: "16px", padding: "10px 14px", borderRadius: "10px", background: T.redBg }}><AlertCircle size={14} /> Slippage terlalu tinggi!</div>}
            <button onClick={() => setShowSlippageModal(false)} className="btn-primary">Simpan</button>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ position: "fixed", top: "90px", right: "20px", background: T.cardSolid, padding: "14px 20px", borderRadius: "16px", border: `1px solid ${T.border}`, boxShadow: "0 8px 30px rgba(0,0,0,0.2)", zIndex: 1000, fontWeight: "600", fontSize: "14px", animation: "slideUp 0.3s ease", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>{toast.icon}</span> {toast.msg}
        </div>
      )}

      {/* TICKER */}
      <div style={{ display: "flex", gap: "24px", justifyContent: "center", padding: "10px 20px", background: darkMode ? "rgba(15,23,42,0.8)" : "rgba(255,255,255,0.8)", borderBottom: `1px solid ${T.border}`, fontSize: "12px", color: T.sub, backdropFilter: "blur(10px)", flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><DollarSign size={12} /> LTC/USD <span style={{ color: parseFloat(ltcData.change) >= 0 ? T.green : T.red, fontWeight: "700" }}>${ltcData.price}</span></span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Activity size={12} /> 24h <span style={{ color: parseFloat(ltcData.change) >= 0 ? T.green : T.red, fontWeight: "700" }}>{parseFloat(ltcData.change) >= 0 ? "+" : ""}{ltcData.change}%</span></span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Zap size={12} /> Gas <span style={{ color: T.text, fontWeight: "700" }}>9 sat/byte</span></span>
        {poolReserves.reserveA > 0 && <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><BarChart3 size={12} /> Pool TVL <span style={{ color: T.green, fontWeight: "700" }}>${(poolReserves.reserveA + poolReserves.reserveB).toFixed(0)}</span></span>}
      </div>

      {/* BANNER */}
      <div style={{ background: darkMode ? "rgba(245,158,11,0.08)" : "#fffbeb", borderBottom: `1px solid ${darkMode ? "rgba(245,158,11,0.15)" : "#fef3c7"}`, padding: "12px 20px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "4px", fontSize: "13px", color: darkMode ? "#fbbf24" : "#b45309", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600" }}><AlertCircle size={14} /> The First DEX on LitVM Network with Integrated Impermanent Loss Risk Simulator.</div>
        <span style={{ fontSize: "11px", opacity: 0.8, fontStyle: "italic" }}>DEX Pertama di Jaringan LitVM dengan Simulator Risiko Impermanent Loss Terintegrasi</span>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
        {/* HEADER */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", position: "sticky", top: 0, zIndex: 100, background: scrolled ? (darkMode ? "rgba(10,14,26,0.9)" : "rgba(248,250,252,0.9)") : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", transition: "all 0.3s", borderBottom: scrolled ? `1px solid ${T.border}` : "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <FreesiaLogo />
            <div>
              <h1 style={{ fontSize: "20px", margin: 0, fontWeight: "800", letterSpacing: "-0.5px" }}>Freesia DEX</h1>
              <span style={{ fontSize: "11px", color: T.green, display: "flex", alignItems: "center", gap: "4px", fontWeight: "600" }}><CheckCircle2 size={11} /> LitVM Live {account && !onCorrectNetwork && <span style={{ color: T.red, marginLeft: "8px" }}>⚠ Network Salah</span>}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={() => setShowChart(!showChart)} className="btn-secondary" style={{ color: showChart ? T.accent : T.sub }}><CandlestickChart size={15} /></button>
            <button onClick={() => setDarkMode(d => !d)} className="btn-secondary">{darkMode ? <Sun size={15} /> : <Moon size={15} />}</button>
            <button onClick={() => setShowLanding(true)} className="btn-secondary" style={{ fontSize: "12px" }}><Home size={15} /></button>
            <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: T.text, textDecoration: "none", fontSize: "18px", fontWeight: "bold", opacity: 0.7 }}>𝕏</a>
            <button onClick={connectWallet} disabled={connecting} className="btn-primary" style={{ padding: "10px 20px", fontSize: "13px" }}>
              {connecting ? "Menghubungkan..." : account ? <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Wallet size={14} /> {shortAddr(account)}</span> : "Hubungkan Dompet"}
            </button>
          </div>
        </header>

        {/* TRADINGVIEW CHART */}
        {showChart && (
          <div style={{ marginBottom: "24px", animation: "slideUp 0.4s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div><h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}><CandlestickChart size={20} color={T.accent} /> Market Chart</h2><span style={{ fontSize: "12px", color: T.sub }}>Real-time via TradingView</span></div>
              <div style={{ display: "flex", gap: "8px" }}>
                {["LTCUSD", "BTCUSD", "ETHUSD"].map(s => <button key={s} onClick={() => setChartSymbol(s)} className="btn-secondary" style={{ padding: "6px 14px", fontSize: "12px", background: chartSymbol === s ? T.accentGlow : T.input, borderColor: chartSymbol === s ? T.accent : T.border, color: chartSymbol === s ? T.accent : T.sub }}>{s.replace("USD", "/USD")}</button>)}
              </div>
            </div>
            <div className="chart-container" style={{ height: isMobile ? "300px" : "450px" }}><TradingViewWidget symbol={chartSymbol} darkMode={darkMode} /></div>
          </div>
        )}

        {/* TABS */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "32px", flexWrap: "wrap", justifyContent: isMobile ? "flex-start" : "center", overflowX: isMobile ? "auto" : "visible", paddingBottom: isMobile ? "8px" : "0" }}>
          {tabs.map(t => { const Icon = t.icon; return <button key={t.id} onClick={() => setActiveTab(t.id)} className={`tab-btn ${activeTab === t.id ? "active" : ""}`}><Icon size={14} /> {t.label}</button>; })}
        </div>

        <div style={{ display: "flex", justifyContent: "center", minHeight: "500px" }}>
          {/* SWAP */}
          {activeTab === "swap" && (
            <div className="glass-card" style={{ width: "100%", maxWidth: "480px", padding: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div><strong style={{ fontSize: "18px", display: "block" }}>Tukar Token</strong><span style={{ color: T.sub, fontSize: "12px" }}>Swap dengan slippage terkontrol</span></div>
                <button onClick={() => setShowSlippageModal(true)} className="btn-secondary"><Settings size={14} /> {slippage}%</button>
              </div>
              <div className="input-box">
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: T.sub, marginBottom: "10px" }}><span>Anda Membayar</span><span>Saldo: <strong style={{ color: T.text }}>{fromBalance}</strong></span></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <input type="number" placeholder="0.00" value={amountIn} onChange={e => setAmountIn(e.target.value)} style={{ background: "transparent", border: "none", color: T.text, fontSize: "28px", width: "100%", outline: "none", fontWeight: "700", fontFamily: "monospace" }} />
                  <button onClick={() => setShowTokenSelector('from')} className="btn-secondary" style={{ padding: "8px 14px", borderRadius: "12px", fontWeight: "700", fontSize: "14px", whiteSpace: "nowrap" }}><span style={{ fontSize: "18px", marginRight: "4px" }}>{TOKEN_LIST[fromSym].logo}</span>{fromSym} <ChevronDown size={14} /></button>
                </div>
              </div>
              <div style={{ textAlign: "center", margin: "-8px 0", position: "relative", zIndex: 2 }}>
                <button onClick={swapTokens} className="btn-secondary" style={{ borderRadius: "50%", padding: "10px", background: T.cardSolid, boxShadow: `0 0 0 4px ${T.bg}` }}><ArrowUpDown size={16} /></button>
              </div>
              <div className="input-box">
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: T.sub, marginBottom: "10px" }}><span>Menerima (Estimasi)</span><span>Saldo: <strong style={{ color: T.text }}>{toBalance}</strong></span></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <input type="text" placeholder="0.00" value={amountOutPreview} readOnly style={{ background: "transparent", border: "none", color: T.sub, fontSize: "28px", width: "100%", outline: "none", fontWeight: "700", fontFamily: "monospace" }} />
                  <button onClick={() => setShowTokenSelector('to')} className="btn-secondary" style={{ padding: "8px 14px", borderRadius: "12px", fontWeight: "700", fontSize: "14px", whiteSpace: "nowrap" }}><span style={{ fontSize: "18px", marginRight: "4px" }}>{TOKEN_LIST[toSym].logo}</span>{toSym} <ChevronDown size={14} /></button>
                </div>
              </div>
              {amountIn && parseFloat(amountIn) > 0 && (
                <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {gasEstimate && <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}><span style={{ color: T.sub, display: "flex", alignItems: "center", gap: "4px" }}><Zap size={12} /> Estimasi Gas</span><span style={{ fontWeight: "600" }}>{gasEstimate.eth} zkLTC {gasEstimate.usd !== "0.0000" && <span style={{ color: T.sub }}>(~${gasEstimate.usd})</span>}</span></div>}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}><span style={{ color: T.sub, display: "flex", alignItems: "center", gap: "4px" }}><Percent size={12} /> Price Impact</span><span style={{ fontWeight: "700", color: priceImpact > 3 ? T.red : priceImpact > 1 ? T.accent : T.green }}>{priceImpact.toFixed(2)}%</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}><span style={{ color: T.sub, display: "flex", alignItems: "center", gap: "4px" }}><Sliders size={12} /> Slippage</span><span style={{ fontWeight: "600" }}>{slippage}%</span></div>
                </div>
              )}
              {priceImpact > 3 && <div style={{ background: T.redBg, border: `1px solid ${T.red}30`, borderRadius: "12px", padding: "12px 14px", fontSize: "13px", color: T.red, marginTop: "16px", display: "flex", alignItems: "center", gap: "8px" }}><AlertCircle size={16} /> Price impact tinggi!</div>}
              <button onClick={handleSwap} disabled={swapLoading || !amountIn} className="btn-primary" style={{ marginTop: "20px", width: "100%" }}>{swapLoading ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}><RefreshCw size={16} className="animate-pulse" /> Swapping...</span> : !account ? "Hubungkan Dompet" : "Tukar Token"}</button>
            </div>
          )}

          {/* MINT */}
          {activeTab === "mint" && (
            <div className="glass-card" style={{ width: "100%", maxWidth: "480px", padding: "28px" }}>
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: T.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><Zap size={28} color={T.accent} /></div>
                <h3 style={{ margin: 0, fontSize: "20px" }}>Wallet Faucet Hub</h3>
                <p style={{ fontSize: "13px", color: T.sub, marginTop: "6px" }}>Isi saldo wallet tesmu langsung ke LitVM Node.</p>
              </div>
              {Object.entries(TOKEN_LIST).map(([sym, info]) => (
                <div key={sym} style={{ background: T.input, padding: "18px", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", border: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}><span style={{ fontSize: "32px" }}>{info.logo}</span><div><strong style={{ fontSize: "15px" }}>{sym}</strong><div style={{ fontSize: "12px", color: T.green, fontWeight: "600", marginTop: "2px" }}>Saldo: {mintBalances[sym] || "0.00"} {sym}</div></div></div>
                  <button onClick={() => handleMintToken(sym)} disabled={mintingSym === sym} className="btn-primary" style={{ padding: "10px 18px", fontSize: "13px" }}>{mintingSym === sym ? <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><RefreshCw size={14} className="animate-pulse" /> ...</span> : "Mint 10k"}</button>
                </div>
              ))}
            </div>
          )}

          {/* POOL */}
          {activeTab === "pool" && (
            <div className="glass-card" style={{ width: "100%", maxWidth: "560px", padding: "28px" }}>
              <h3 style={{ margin: "0 0 8px", fontSize: "20px", display: "flex", alignItems: "center", gap: "8px" }}><Layers size={20} color={T.accent} /> Active Liquidity Pools</h3>
              <p style={{ fontSize: "13px", color: T.sub, marginBottom: "24px" }}>Suntikkan likuiditas dan dapatkan fee dari setiap swap.</p>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
                <div className="stat-card"><div style={{ fontSize: "12px", color: T.sub, marginBottom: "4px" }}>USDC / DAI TVL</div><div style={{ fontSize: "20px", fontWeight: "800", color: T.green }}>${communityLiquidity.usdcDaiTVL.toLocaleString()}</div></div>
                <div className="stat-card"><div style={{ fontSize: "12px", color: T.sub, marginBottom: "4px" }}>zkLTC / USDC TVL</div><div style={{ fontSize: "20px", fontWeight: "800", color: T.green }}>${communityLiquidity.zkLtcUsdcTVL.toLocaleString()}</div></div>
              </div>
              {account && userLPBalance > 0 && (
                <div style={{ padding: "20px", borderRadius: "16px", border: `1px solid ${T.border}`, background: T.input, marginBottom: "20px" }}>
                  <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}><Layers size={16} color={T.blue} /> Your LP Position</h4>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span style={{ fontSize: "13px", color: T.sub }}>LP Balance</span><span style={{ fontWeight: "700" }}>{userLPBalance.toFixed(4)} LP</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span style={{ fontSize: "13px", color: T.sub }}>Pool Share</span><span style={{ fontWeight: "700" }}>{totalLPSupply > 0 ? ((userLPBalance / totalLPSupply) * 100).toFixed(4) : "0"}%</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}><span style={{ fontSize: "13px", color: T.sub }}>Fee Earned</span><span style={{ fontWeight: "700", color: T.green }}>${feeEarned.toFixed(4)}</span></div>
                  <button onClick={() => setShowRemoveLPModal(true)} className="btn-secondary" style={{ width: "100%", justifyContent: "center", color: T.red, borderColor: T.red }}><Minus size={14} /> Remove Liquidity</button>
                </div>
              )}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: T.sub, display: "block", marginBottom: "8px" }}>Pilih Pool</label>
                <select value={selectedPool} onChange={e => setSelectedPool(e.target.value)} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: `1px solid ${T.border}`, background: T.input, color: T.text, fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>
                  <option value="USDC-DAI">USDC + DAI Pool</option>
                  <option value="zkLTC-USDC">zkLTC + USDC Pool</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                <div className="input-box"><label style={{ fontSize: "12px", color: T.sub, marginBottom: "6px", display: "block" }}>Jumlah {selectedPool.split("-")[0]}</label><input type="number" placeholder="0.00" value={amountAInput} onChange={e => setAmountAInput(e.target.value)} style={{ width: "100%", background: "transparent", border: "none", color: T.text, fontSize: "22px", outline: "none", fontWeight: "700", fontFamily: "monospace" }} /></div>
                <div className="input-box"><label style={{ fontSize: "12px", color: T.sub, marginBottom: "6px", display: "block" }}>Jumlah {selectedPool.split("-")[1]}</label><input type="number" placeholder="0.00" value={amountBInput} onChange={e => setAmountBInput(e.target.value)} style={{ width: "100%", background: "transparent", border: "none", color: T.text, fontSize: "22px", outline: "none", fontWeight: "700", fontFamily: "monospace" }} /></div>
                <button onClick={handleAddLiquidity} disabled={poolLoading} className="btn-primary">{poolLoading ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}><RefreshCw size={16} className="animate-pulse" /> Injecting...</span> : "Add Active Liquidity"}</button>
              </div>
              <div style={{ padding: "20px", borderRadius: "16px", border: `1px solid ${T.border}`, background: T.input }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}><BarChart3 size={18} color={T.accent} /><strong style={{ fontSize: "16px" }}>Impermanent Loss Simulator</strong></div>
                <p style={{ fontSize: "12px", color: T.sub, marginBottom: "16px", lineHeight: "1.5" }}>Simulasikan kerugian impermanent berdasarkan perubahan harga relatif.</p>
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}><span style={{ color: T.sub }}>Perubahan Harga</span><span style={{ fontWeight: "700" }}>{priceChange > 0 ? "+" : ""}{priceChange}%</span></div>
                  <input type="range" min="-90" max="200" step="5" value={priceChange} onChange={e => setPriceChange(Number(e.target.value))} style={{ width: "100%", accentColor: T.accent, height: "6px" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: T.sub, marginTop: "4px" }}><span>-90%</span><span>0%</span><span>+200%</span></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="stat-card" style={{ textAlign: "center" }}><div style={{ fontSize: "11px", color: T.sub, marginBottom: "4px" }}>IL Percentage</div><div style={{ fontSize: "22px", fontWeight: "800", color: ilResult.ilPercent > 5 ? T.red : T.accent }}>{ilResult.ilPercent.toFixed(2)}%</div></div>
                  <div className="stat-card" style={{ textAlign: "center" }}><div style={{ fontSize: "11px", color: T.sub, marginBottom: "4px" }}>Est. Loss (per $1k)</div><div style={{ fontSize: "22px", fontWeight: "800", color: ilResult.lossAmount > 50 ? T.red : T.accent }}>${ilResult.lossAmount.toFixed(2)}</div></div>
                </div>
                <div style={{ marginTop: "16px", padding: "12px", borderRadius: "10px", background: darkMode ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.05)", border: `1px solid ${darkMode ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.1)"}`, fontSize: "12px", color: T.sub, lineHeight: "1.6" }}><Info size={14} style={{ marginRight: "6px", verticalAlign: "middle", color: T.blue }} />IL terjadi saat harga token dalam pool berubah relatif. Semakin besar perubahan, semakin besar IL.</div>
              </div>
            </div>
          )}

          {/* STAKING */}
          {activeTab === "staking" && (
            <div className="glass-card" style={{ width: "100%", maxWidth: "520px", padding: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: T.accentGlow, display: "flex", alignItems: "center", justifyContent: "center" }}><Coins size={24} color={T.accent} /></div>
                <div><h3 style={{ margin: 0, fontWeight: "800", fontSize: "20px" }}>MBG Staking Engine</h3><span style={{ fontSize: "12px", color: T.sub }}>Stake LP token & earn MBG rewards</span></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
                <div className="stat-card" style={{ textAlign: "center" }}><span style={{ fontSize: "12px", color: T.sub }}>Pool TVL</span><strong style={{ display: "block", fontSize: "20px", marginTop: "4px" }}>$250,400</strong></div>
                <div className="stat-card" style={{ textAlign: "center" }}><span style={{ fontSize: "12px", color: T.sub }}>APR</span><strong style={{ display: "block", fontSize: "20px", color: T.green, marginTop: "4px" }}>32.50%</strong></div>
              </div>
              <div style={{ padding: "20px", borderRadius: "16px", border: `1px solid ${darkMode ? "rgba(245,158,11,0.15)" : "#fef3c7"}`, background: darkMode ? "rgba(245,158,11,0.05)" : "#fffbeb", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><span style={{ fontSize: "12px", color: darkMode ? "#fbbf24" : "#b45309" }}>MBG Live Dynamic Yield</span><strong style={{ display: "block", fontSize: "28px", fontFamily: "monospace", marginTop: "4px" }}>{mbgRewards.toFixed(6)}</strong></div>
                  <button onClick={() => { if (mbgRewards > 0) { showToast("🎉", `Claimed ${mbgRewards.toFixed(6)} MBG!`); setMbgRewards(0); } }} disabled={mbgRewards <= 0} className="btn-primary" style={{ padding: "10px 20px", fontSize: "13px" }}>Claim</button>
                </div>
                {myStakedValue > 0 && (
                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${darkMode ? "rgba(245,158,11,0.1)" : "#fef3c7"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}><span style={{ color: T.sub }}>Daily Yield (est)</span><span style={{ color: T.green, fontWeight: "600" }}>{(myStakedValue * 0.00089).toFixed(4)} MBG</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}><span style={{ color: T.sub }}>Monthly Yield (est)</span><span style={{ color: T.green, fontWeight: "600" }}>{(myStakedValue * 0.0267).toFixed(4)} MBG</span></div>
                  </div>
                )}
              </div>
              <div style={{ padding: "14px 16px", background: T.input, borderRadius: "12px", border: `1px solid ${T.border}`, marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", color: T.sub, fontSize: "13px" }}><Wallet size={14} /> My Staked LP</span><strong style={{ fontSize: "16px" }}>{myStakedValue.toFixed(2)} LP</strong>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input type="number" placeholder="Jumlah LP Token" value={stakeAmount} onChange={e => setStakeAmount(e.target.value)} style={{ padding: "16px", background: T.input, border: `1px solid ${T.border}`, borderRadius: "12px", color: T.text, fontWeight: "700", fontSize: "16px", fontFamily: "monospace" }} />
                <button onClick={() => { if (!stakeAmount) return; setMyStakedValue(p => p + parseFloat(stakeAmount)); setStakeAmount(""); showToast("🔒", "LP staked successfully!"); }} className="btn-primary" style={{ background: "#111827", color: "#fff", boxShadow: "none" }}>Lock & Stake</button>
              </div>
            </div>
          )}

          {/* DASHBOARD */}
          {activeTab === "dashboard" && <UserDashboard mintBalances={mintBalances} txHistory={txHistory} myStakedValue={myStakedValue} mbgRewards={mbgRewards} darkMode={darkMode} T={T} />}

          {/* HISTORY */}
          {activeTab === "history" && (
            <div className="glass-card" style={{ width: "100%", maxWidth: "600px", padding: "28px" }}>
              <h3 style={{ margin: "0 0 8px", fontSize: "20px", display: "flex", alignItems: "center", gap: "8px" }}><Clock size={20} color={T.accent} /> Riwayat Transaksi</h3>
              <p style={{ fontSize: "13px", color: T.sub, marginBottom: "20px" }}>Transaksi sesi ini. Data akan hilang saat refresh.</p>
              {txHistory.length === 0 ? (
                <div style={{ textAlign: "center", padding: "50px 0", color: T.sub }}><TrendingUp size={40} style={{ marginBottom: "16px", opacity: 0.3 }} /><p style={{ fontSize: "14px" }}>Belum ada transaksi. Mulai swap atau mint!</p></div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {txHistory.map(tx => (
                    <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderRadius: "12px", background: T.input, border: `1px solid ${T.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: tx.type === "Swap" ? T.accentGlow : tx.type === "Mint" ? T.greenBg : tx.type === "Add Liquidity" ? T.input : T.redBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {tx.type === "Swap" ? <ArrowUpDown size={16} color={T.accent} /> : tx.type === "Mint" ? <Zap size={16} color={T.green} /> : tx.type === "Add Liquidity" ? <Plus size={16} color={T.blue} /> : <Minus size={16} color={T.red} />}
                        </div>
                        <div><span style={{ fontWeight: "700", fontSize: "14px" }}>{tx.type}</span><div style={{ fontSize: "12px", color: T.sub, marginTop: "2px" }}>{tx.detail}</div></div>
                      </div>
                      <span style={{ fontSize: "12px", color: T.sub, whiteSpace: "nowrap" }}>{tx.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer style={{ marginTop: "80px", padding: "50px 0 30px", borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "2fr 1fr 1fr 1fr", gap: "40px", marginBottom: "40px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}><FreesiaLogo size={28} /><span style={{ fontWeight: "800", fontSize: "18px" }}>Freesia DEX</span></div>
              <p style={{ fontSize: "13px", color: T.sub, lineHeight: "1.7", margin: 0 }}>DEX terintegrasi pertama di jaringan LitVM Testnet. Swap, pool, stake, dan simulasikan risiko impermanent loss dalam satu platform.</p>
              <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: "8px", borderRadius: "10px" }}><Twitter size={16} /></a>
                <a href="#" className="btn-secondary" style={{ padding: "8px", borderRadius: "10px" }}><MessageCircle size={16} /></a>
                <a href="#" className="btn-secondary" style={{ padding: "8px", borderRadius: "10px" }}><Github size={16} /></a>
                <a href="#" className="btn-secondary" style={{ padding: "8px", borderRadius: "10px" }}><Globe size={16} /></a>
              </div>
            </div>
            <div><h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "16px" }}>Products</h4><div style={{ display: "flex", flexDirection: "column", gap: "10px" }}><span className="footer-link" style={{ cursor: "pointer" }}>Swap</span><span className="footer-link" style={{ cursor: "pointer" }}>Pool</span><span className="footer-link" style={{ cursor: "pointer" }}>Staking</span><span className="footer-link" style={{ cursor: "pointer" }}>IL Simulator</span></div></div>
            <div><h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "16px" }}>Developers</h4><div style={{ display: "flex", flexDirection: "column", gap: "10px" }}><a href="#" className="footer-link" style={{ display: "flex", alignItems: "center", gap: "4px" }}><Github size={12} /> GitHub</a><a href="#" className="footer-link" style={{ display: "flex", alignItems: "center", gap: "4px" }}><FileText size={12} /> Docs</a><a href="#" className="footer-link" style={{ display: "flex", alignItems: "center", gap: "4px" }}><ExternalLink size={12} /> Explorer</a></div></div>
            <div><h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "16px" }}>Support</h4><div style={{ display: "flex", flexDirection: "column", gap: "10px" }}><a href="#" className="footer-link" style={{ display: "flex", alignItems: "center", gap: "4px" }}><HelpCircle size={12} /> Help</a><a href="#" className="footer-link" style={{ display: "flex", alignItems: "center", gap: "4px" }}><Shield size={12} /> Terms</a><a href="#" className="footer-link" style={{ display: "flex", alignItems: "center", gap: "4px" }}><FileText size={12} /> Privacy</a></div></div>
          </div>
          <div style={{ textAlign: "center", paddingTop: "24px", borderTop: `1px solid ${T.border}` }}>
            <p style={{ fontSize: "12px", color: T.sub, margin: 0 }}>© 2026 Freesia DEX. Built by <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: T.accent, textDecoration: "none", fontWeight: "600" }}>@0xzackbh</a> on LitVM Testnet.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
'''

with open('/mnt/agents/output/App_Complete.jsx', 'w', encoding='utf-8') as f:
    f.write(complete_app)

print("COMPLETE App.jsx saved!")
print(f"Size: {len(complete_app)} characters")
print(f"Lines: {complete_app.count(chr(10))}")
