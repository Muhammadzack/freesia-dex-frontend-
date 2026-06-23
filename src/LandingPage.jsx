import React, { useState, useEffect } from "react";
import {
  ArrowRight, Shield, Zap, BarChart3, Layers, Coins,
  TrendingUp, ExternalLink, Menu, X, Wallet
} from "lucide-react";

export default function LandingPage({ onLaunchApp }) {
  const [darkMode, setDarkMode] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({ tvl: 0, volume: 0, users: 0 });

  const T = {
    bg: darkMode ? "#0a0e1a" : "#f8fafc",
    text: darkMode ? "#f8fafc" : "#0f172a",
    sub: darkMode ? "#94a3b8" : "#64748b",
    accent: "#f59e0b",
    card: darkMode ? "rgba(30, 41, 59, 0.6)" : "rgba(255, 255, 255, 0.8)",
    border: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    green: "#10b981",
    purple: "#8b5cf6",
    blue: "#3b82f6",
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const targets = { tvl: 565000, volume: 1280000, users: 3420 };
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
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, []);

  const features = [
    { icon: Zap, title: "Lightning Swaps", desc: "Tukar token USDC/DAI/zkLTC dengan kecepatan tinggi di jaringan LitVM Testnet.", color: T.accent },
    { icon: Layers, title: "Liquidity Pools", desc: "Suntikkan likuiditas dan dapatkan fee dari setiap transaksi swap.", color: T.green },
    { icon: BarChart3, title: "IL Simulator", desc: "Simulator risiko impermanent loss pertama yang terintegrasi langsung di DEX.", color: T.purple },
    { icon: Coins, title: "MBG Staking", desc: "Stake LP token dan dapatkan reward MBG dengan APY kompetitif.", color: T.blue },
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

      {/* NAV */}
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

      {/* HERO */}
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
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr", gap:"16px", maxWidth:"700px", margin:"60px auto 0" }}>
            <div className="glass-card" style={{ padding:"24px", textAlign:"center" }}>
              <div style={{ fontSize:"28px", fontWeight:"800", color:T.accent" }}>${animatedStats.tvl.toLocaleString()}</div>
              <div style={{ fontSize:"13px", color:T.sub, marginTop:"4px" }}>Total Value Locked</div>
            </div>
            <div className="glass-card" style={{ padding:"24px", textAlign:"center" }}>
              <div style={{ fontSize:"28px", fontWeight:"800", color:T.green" }}>${animatedStats.volume.toLocaleString()}</div>
              <div style={{ fontSize:"13px", color:T.sub, marginTop:"4px" }}>Total Volume</div>
            </div>
            <div className="glass-card" style={{ padding:"24px", textAlign:"center" }}>
              <div style={{ fontSize:"28px", fontWeight:"800", color:T.purple" }}>{animatedStats.users.toLocaleString()}</div>
              <div style={{ fontSize:"13px", color:T.sub, marginTop:"4px" }}>Active Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
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

      {/* HOW IT WORKS */}
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

      {/* CTA */}
      <section style={{ padding:"100px 24px", position:"relative" }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(139,92,246,0.05) 100%)" }} />
        <div className="glass-card" style={{ maxWidth:"800px", margin:"0 auto", padding:isMobile?"40px 24px":"60px", textAlign:"center", position:"relative", zIndex:1 }}>
          <h2 style={{ fontSize:isMobile?"24px":"36px", fontWeight:"800", margin:"0 0 16px" }}>Ready to Start Trading?</h2>
          <p style={{ fontSize:"16px", color:T.sub, maxWidth:"500px", margin:"0 auto 32px", lineHeight:"1.6" }}>Bergabung dengan ribuan user yang sudah trading di Freesia DEX.</p>
          <button onClick={onLaunchApp} className="btn-primary" style={{ fontSize:"16px", padding:"18px 40px" }}>Launch App Now <ArrowRight size={18} /></button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding:"60px 24px 30px", borderTop:`1px solid ${T.border}` }}>
        <div style={{ maxWidth:"1200px", margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"2fr 1fr 1fr 1fr", gap:"40px", marginBottom:"40px" }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"16px" }}>
                <FreesiaLogo size={28} />
                <span style={{ fontWeight:"800", fontSize:"18px", color:T.text }}>Freesia DEX</span>
              </div>
              <p style={{ fontSize:"13px", color:T.sub, lineHeight:"1.7", margin:0 }}>DEX terintegrasi pertama di jaringan LitVM Testnet. Built by @0xzackbh.</p>
            </div>
            <div>
              <h4 style={{ fontSize:"14px", fontWeight:"700", color:T.text, marginBottom:"16px" }}>Products</h4>
              <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                <span className="footer-link" style={{ cursor:"pointer" }} onClick={onLaunchApp}>Swap</span>
                <span className="footer-link" style={{ cursor:"pointer" }} onClick={onLaunchApp}>Pool</span>
                <span className="footer-link" style={{ cursor:"pointer" }} onClick={onLaunchApp}>Staking</span>
              </div>
            </div>
            <div>
              <h4 style={{ fontSize:"14px", fontWeight:"700", color:T.text, marginBottom:"16px" }}>Developers</h4>
              <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                <a href="https://liteforge.explorer.caldera.xyz" target="_blank" rel="noreferrer" className="footer-link">Explorer</a>
                <span className="footer-link">Documentation</span>
              </div>
            </div>
            <div>
              <h4 style={{ fontSize:"14px", fontWeight:"700", color:T.text, marginBottom:"16px" }}>Support</h4>
              <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                <span className="footer-link">Community</span>
                <span className="footer-link">Terms</span>
                <span className="footer-link">Privacy</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign:"center", paddingTop:"24px", borderTop:`1px solid ${T.border}` }}>
            <p style={{ fontSize:"12px", color:T.sub, margin:0 }}>© 2026 Freesia DEX. Built by <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color:T.accent, textDecoration:"none", fontWeight:"600" }}>@0xzackbh</a> on LitVM Testnet.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FreesiaLogo({ size = 32 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 20 C 65 10, 80 30, 50 50 C 20 30, 35 10, 50 20 Z" fill="#fbcfe8" opacity="0.8"/>
        <path d="M80 50 C 90 65, 70 80, 50 50 C 70 20, 90 35, 80 50 Z" fill="#f9a8d4" opacity="0.8"/>
        <path d="M50 80 C 35 90, 20 70, 50 50 C 80 70, 65 90, 50 80 Z" fill="#f472b6" opacity="0.8"/>
        <path d="M20 50 C 10 35, 30 20, 50 50 C 30 80, 10 65, 20 50 Z" fill="#ec4899" opacity="0.8"/>
        <text x="50" y="65" fontSize="42" fill="#111827" fontWeight="bold" fontFamily="serif" textAnchor="middle">f</text>
      </svg>
    </div>
  );
}
