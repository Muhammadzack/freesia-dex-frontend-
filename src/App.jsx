import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { Wallet, Settings, Moon, Sun } from "lucide-react";
import { TOKEN_LIST, ERC20_ABI, LITVM_RPC, CHAIN_ID, CONTRACTS } from "./utils/constants";
import { fmtBal } from "./utils/formatters";
import TokenLogo from "./components/TokenLogo";
import SwapPanel from "./components/SwapPanel";
import FaucetPanel from "./components/FaucetPanel";
import PoolPanel from "./components/PoolPanel";
import ILSimulatorPanel from "./components/ILSimulatorPanel";
import LimitOrderPanel from "./components/LimitOrderPanel";
import ImportTokenPanel from "./components/ImportTokenPanel";
import PriceChartPanel from "./components/PriceChartPanel";
import StakingPanel from "./components/StakingPanel";
import DashboardPanel from "./components/DashboardPanel";
import HistoryPanel from "./components/HistoryPanel";
import LandingPage from "./components/LandingPage";

export default function App() {
  const [page, setPage] = useState(() => localStorage.getItem("freesia_page") || "landing");
  const [account, setAccount] = useState("");
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [balance, setBalance] = useState("0");
  const [tab, setTab] = useState(() => localStorage.getItem("freesia_tab") || "swap");
  const [dark, setDark] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [toast, setToast] = useState(null);
  const [balances, setBalances] = useState({});
  const [txHistory, setTxHistory] = useState(() => {
    try { const s = localStorage.getItem("freesia_tx_history"); return s ? JSON.parse(s) : []; } catch { return []; }
  });

  const D = dark;
  const theme = {
    bg: D ? "#0b1220" : "#f8fafc",
    card: D ? "#111827" : "#ffffff",
    cardSec: D ? "#1f2937" : "#f1f5f9",
    border: D ? "rgba(255,255,255,0.08)" : "#e2e8f0",
    text: D ? "#f8fafc" : "#0f172a",
    sub: D ? "#94a3b8" : "#64748b",
    accent: "#0d9488",
    accent2: "#2563eb",
    green: "#16a34a",
    red: "#dc2626",
    pink: "#ec4899",
    yellow: "#f59e0b",
    input: D ? "#1f2937" : "#f8fafc",
    hover: D ? "#1e293b" : "#f1f5f9",
  };

  const addHistory = (type, detail, hash = "") => {
    setTxHistory(prev => {
      const u = [{ id: Date.now(), type, detail, time: new Date().toLocaleTimeString("id-ID"), hash }, ...prev].slice(0, 50);
      localStorage.setItem("freesia_tx_history", JSON.stringify(u));
      return u;
    });
  };

  const showToast = (emoji, msg) => {
    setToast({ emoji, msg });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accs) => { if (accs.length === 0) disconnect(); else setAccount(accs[0]); });
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
    return () => { if (window.ethereum) { window.ethereum.removeAllListeners("accountsChanged"); window.ethereum.removeAllListeners("chainChanged"); } };
  }, []);

  useEffect(() => { localStorage.setItem("freesia_page", page); }, [page]);
  useEffect(() => { localStorage.setItem("freesia_tab", tab); }, [tab]);

  const readBalances = useCallback(async () => {
    if (!account || !provider) return;
    try {
      const bal = await provider.getBalance(account);
      setBalance(ethers.formatEther(bal));
      const b = {};
      for (const [sym, info] of Object.entries(TOKEN_LIST)) {
        if (info.isNative) { b[sym] = ethers.formatEther(bal); continue; }
        try { const c = new ethers.Contract(info.address, ERC20_ABI, provider); const v = await c.balanceOf(account); b[sym] = ethers.formatUnits(v, info.decimals); } catch { b[sym] = "0"; }
      }
      setBalances(b);
    } catch {}
  }, [account, provider]);

  useEffect(() => { readBalances(); }, [readBalances]);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) return showToast("❌", "Install MetaMask!");
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const prov = new ethers.BrowserProvider(window.ethereum);
      const net = await prov.getNetwork();
      if (Number(net.chainId) !== CHAIN_ID) {
        try {
          await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x" + CHAIN_ID.toString(16) }] });
        } catch {
          await window.ethereum.request({ method: "wallet_addEthereumChain", params: [{ chainId: "0x" + CHAIN_ID.toString(16), chainName: "LitVM Testnet", nativeCurrency: { name: "zkLTC", symbol: "zkLTC", decimals: 18 }, rpcUrls: [LITVM_RPC], blockExplorerUrls: ["https://liteforge.explorer.caldera.xyz"] }] });
          return;
        }
      }
      const freshProv = new ethers.BrowserProvider(window.ethereum);
const nw = await freshProv.getNetwork();
if (Number(nw.chainId) !== CHAIN_ID) {
  showToast("❌", "Gagal pindah ke jaringan LitVM Testnet.");
  return;
}
const sig = await freshProv.getSigner();

      const addr = await sig.getAddress();
      setAccount(addr);
      setSigner(sig);
      setProvider(freshProv);
      showToast("✅", "Wallet connected!");
    } catch (err) { showToast("❌", (err?.message || "").slice(0, 60)); }
  };

  const disconnect = () => { setAccount(""); setSigner(null); setProvider(null); setBalance("0"); setBalances({}); setShowWallet(false); };

  const tabs = [
    { id: "swap", label: "Swap", icon: "🔄" },
    { id: "faucet", label: "Faucet", icon: "🚰" },
    { id: "pool", label: "Pool", icon: "🏊" },
    { id: "il", label: "IL Sim", icon: "🛡️" },
    { id: "limit", label: "Orders", icon: "🎯" },
    { id: "chart", label: "Chart", icon: "📈" },
    { id: "staking", label: "Staking", icon: "💎" },
    { id: "import", label: "Tokens", icon: "🪙" },
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "history", label: "History", icon: "📋" },
  ];

  if (page === "landing") return <LandingPage onLaunch={() => setPage("dex")} />;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: theme.bg, fontFamily: "system-ui, sans-serif" }}>
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 1000, animation: "slideIn 0.3s ease", display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderRadius: 16, fontWeight: 700, fontSize: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", backgroundColor: theme.card, color: theme.text, border: `1px solid ${theme.border}` }}>
          <span style={{ fontSize: 20 }}>{toast.emoji}</span> {toast.msg}
        </div>
      )}

      <nav style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 40px", borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.card, position: "sticky", top: 0, zIndex: 50, flexWrap: "wrap" }}>
        <div onClick={() => setPage("landing")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontWeight: 900, fontSize: 22, color: theme.text }}>
          <img src="/logo.svg" width={36} height={36} alt="" style={{ borderRadius: 10, border: `2px solid ${theme.border}` }} />
          Freesia DEX
        </div>
        <span style={{ padding: "4px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: "#fef3c7", color: "#92400e" }}>LitVM Testnet</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => setDark(!dark)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", padding: 8, borderRadius: 10 }} title="Toggle Dark Mode">{dark ? "☀️" : "🌙"}</button>
        {account ? (
          <>
            <button onClick={() => setShowWallet(!showWallet)} style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: theme.cardSec, border: `1px solid ${theme.border}`, padding: "10px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", color: theme.text }}>
              <Wallet size={16} /> {fmtBal(balance)} zkLTC | {account.slice(0, 6)}...{account.slice(-4)}
            </button>
            <button onClick={disconnect} style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 12px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>✕</button>
          </>
        ) : (
          <button onClick={connectWallet} style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: theme.accent, color: "#fff", border: "none", padding: "12px 24px", borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: "pointer" }}><Wallet size={16} /> Connect Wallet</button>
        )}
      </nav>

      {showWallet && account && (
        <div style={{ position: "fixed", top: 60, right: 40, zIndex: 100, backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 20, width: 280, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <strong style={{ fontSize: 16, color: theme.text }}>Wallet</strong>
            <button onClick={() => setShowWallet(false)} style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: theme.sub }}>✕</button>
          </div>
          <div style={{ fontSize: 14, color: theme.sub, marginBottom: 8, wordBreak: "break-all" }}>{account}</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 16, color: theme.text }}>{fmtBal(balance)} <span style={{ color: theme.accent }}>zkLTC</span></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {Object.entries(balances).filter(([k]) => !TOKEN_LIST[k]?.isNative).slice(0, 4).map(([sym, val]) => (
              <div key={sym} style={{ backgroundColor: theme.cardSec, padding: "8px 12px", borderRadius: 10, fontSize: 13, fontWeight: 700 }}><TokenLogo symbol={sym} size={16} /> {fmtBal(val)} {sym}</div>
            ))}
          </div>
          <button onClick={() => { navigator.clipboard.writeText(account); showToast("📋", "Address copied!"); }} style={{ width: "100%", marginTop: 12, backgroundColor: theme.cardSec, border: `1px solid ${theme.border}`, padding: 10, borderRadius: 10, fontWeight: 700, cursor: "pointer", color: theme.text }}>Copy Address</button>
          <a href={`https://liteforge.explorer.caldera.xyz/address/${account}`} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: 8, textAlign: "center", color: theme.accent, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>View on Explorer →</a>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, padding: "16px 40px 0", overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "10px 18px", borderRadius: 12, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", backgroundColor: tab === t.id ? theme.accent : "transparent", color: tab === t.id ? "#fff" : theme.sub }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 900, margin: "20px auto", padding: "0 20px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
        {tab === "swap" && <SwapPanel account={account} signer={signer} provider={provider} balances={balances} showToast={showToast} theme={theme} addHistory={addHistory} />}
        {tab === "faucet" && <FaucetPanel account={account} signer={signer} provider={provider} showToast={showToast} theme={theme} addHistory={addHistory} />}
        {tab === "pool" && <PoolPanel account={account} signer={signer} provider={provider} showToast={showToast} theme={theme} addHistory={addHistory} />}
        {tab === "il" && <ILSimulatorPanel theme={theme} />}
        {tab === "limit" && <LimitOrderPanel account={account} signer={signer} provider={provider} balances={balances} showToast={showToast} theme={theme} />}
        {tab === "chart" && <PriceChartPanel theme={theme} />}
        {tab === "staking" && <StakingPanel account={account} theme={theme} showToast={showToast} provider={provider} />}
        {tab === "import" && <ImportTokenPanel provider={provider} account={account} theme={theme} />}
        {tab === "dashboard" && <DashboardPanel balances={balances} txHistory={txHistory} theme={theme} />}
        {tab === "history" && <HistoryPanel txHistory={txHistory} theme={theme} />}
      </div>

      <footer style={{ backgroundColor: theme.card, borderTop: `1px solid ${theme.border}`, padding: "20px 40px", textAlign: "center", color: theme.sub, fontSize: 13 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 10 }}>
          <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: theme.sub, textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> @0xzackbh
          </a>
          <a href="https://github.com/Muhammadzack/freesia-dex-frontend-" target="_blank" rel="noreferrer" style={{ color: theme.sub, textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg> GitHub
          </a>
        </div>
        © 2026 Freesia DEX. Built on LitVM Testnet.
      </footer>
    </div>
  );
}
