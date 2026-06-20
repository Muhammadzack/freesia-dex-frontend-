import React, { useState } from "react";
import { ethers } from "ethers";
import { ArrowUpDown, Wallet, RefreshCw, PlusCircle, Coins } from "lucide-react";

import SimpleERC20 from "./contracts/SimpleERC20.json";
import SimpleFactory from "./contracts/SimpleFactory.json";
import SimpleLiquidityPool from "./contracts/SimpleLiquidityPool.json";

const CONTRACTS = {
  tokenA: "0xD554E773Ef2207b690e60559b7F64CEB3dc529C7c",
  tokenB: "0xb83E23B9f389CB7bf0c43810427825c961f8f222",
  factory: "0xd07EEa4D50d751D1746A2586bB97108827C70167",
  pool: "0xf38c209d6212B1da5c7F6035aD0FD19DE97AFd04"
};

export default function App() {
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("swap");
  const [amountIn, setAmountIn] = useState("");
  const [poolAmountA, setPoolAmountA] = useState("");
  const [poolAmountB, setPoolAmountB] = useState("");

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Silakan instal MetaMask!");
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async (e) => {
    e.preventDefault();
    if (!account) return alert("Connect dompet dulu!");
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(CONTRACTS.tokenA, SimpleERC20.abi, signer);
      const parsedAmount = ethers.parseEther(amountIn);
      const approveTx = await tokenContract.approve(CONTRACTS.pool, parsedAmount);
      await approveTx.wait();
      const poolContract = new ethers.Contract(CONTRACTS.pool, SimpleLiquidityPool.abi, signer);
      const swapTx = await poolContract.swap(CONTRACTS.tokenA, parsedAmount);
      await swapTx.wait();
      alert("Swap Berhasil!");
      setAmountIn("");
    } catch (err) {
      console.error(err);
      alert("Transaksi Gagal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#0f172a", color: "#f8fafc", minHeight: "100vh", fontFamily: "sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "24px" }}>
      {/* HEADER */}
      <header style={{ width: "100%", maxWidth: "480px", display: "flex", justifyContent: "between", alignItems: "center", paddingBottom: "16px", borderBottom: "1px solid #334155", marginBottom: "40px", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", fontSize: "20px", color: "#fde047" }}>
          <Coins style={{ width: "24px", height: "24px", color: "#2563eb" }} /> 
          <span>FREESIA <span style={{ color: "#2563eb" }}>DEX</span></span>
        </div>
        <button onClick={connectWallet} style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#2563eb", color: "#ffffff", padding: "8px 16px", borderRadius: "12px", fontWeight: "600", border: "none", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.4)" }}>
          <Wallet style={{ width: "16px", height: "16px", color: "#fde047" }} />
          {account ? `${account.substring(0, 6)}...` : "Connect"}
        </button>
      </header>

      {/* KARTU UTAMA */}
      <main style={{ width: "100%", maxWidth: "420px", backgroundColor: "#1e293b", border: "2px solid #2563eb", borderRadius: "24px", padding: "24px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)" }}>
        {/* NAVIGASI TAB */}
        <div style={{ display: "flex", backgroundColor: "#0f172a", padding: "4px", borderRadius: "16px", marginBottom: "24px" }}>
          <button onClick={() => setActiveTab("swap")} style={{ flex: 1, padding: "12px", textAlign: "center", borderRadius: "12px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "bold", backgroundColor: activeTab === "swap" ? "#fde047" : "transparent", color: activeTab === "swap" ? "#0f172a" : "#94a3b8" }}>
            Swap
          </button>
          <button onClick={() => setActiveTab("pool")} style={{ flex: 1, padding: "12px", textAlign: "center", borderRadius: "12px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "bold", backgroundColor: activeTab === "pool" ? "#fde047" : "transparent", color: activeTab === "pool" ? "#0f172a" : "#94a3b8" }}>
            Pool (Minion)
          </button>
        </div>

        {/* KONTEN SWAP */}
        {activeTab === "swap" ? (
          <form onSubmit={handleSwap} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ backgroundColor: "#0f172a", padding: "16px", borderRadius: "16px", border: "1px solid #334155" }}>
              <label style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600" }}>Bayar (USDC)</label>
              <input type="number" placeholder="0.0" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} style={{ width: "100%", backgroundColor: "transparent", border: "none", color: "#ffffff", fontSize: "24px", fontWeight: "bold", outline: "none", marginTop: "8px" }} required />
            </div>
            
            <div style={{ display: "flex", justifyContent: "center", margin: "-8px 0" }}>
              <div style={{ backgroundColor: "#2563eb", padding: "8px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 10px #2563eb" }}>
                <ArrowUpDown style={{ width: "20px", height: "20px", color: "#fde047" }} />
              </div>
            </div>

            <div style={{ backgroundColor: "#0f172a", padding: "16px", borderRadius: "16px", border: "1px solid #334155" }}>
              <label style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600" }}>Terima (DAI)</label>
              <div style={{ color: "#fde047", fontSize: "24px", fontWeight: "bold", marginTop: "8px" }}>
                {amountIn ? (amountIn * 0.99).toFixed(2) : "0.0"}
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ width: "100%", backgroundColor: "#fde047", color: "#0f172a", padding: "16px", borderRadius: "16px", fontWeight: "bold", fontSize: "16px", border: "none", cursor: "pointer", marginTop: "12px", transition: "0.2s", boxShadow: "0 4px 14px rgba(253, 224, 71, 0.4)" }}>
              {loading ? "Banana Processing..." : "Tukar Token (Swap)"}
            </button>
          </form>
        ) : (
          /* KONTEN POOL */
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ backgroundColor: "#0f172a", padding: "16px", borderRadius: "16px", border: "1px solid #334155", display: "flex", flexDirection: "column", gap: "12px" }}>
              <input type="number" placeholder="Jumlah USDC" value={poolAmountA} onChange={(e) => setPoolAmountA(e.target.value)} style={{ width: "100%", backgroundColor: "transparent", border: "none", color: "#ffffff", fontSize: "16px", outline: "none" }} />
              <hr style={{ border: "0", borderTop: "1px solid #334155" }} />
              <input type="number" placeholder="Jumlah DAI" value={poolAmountB} onChange={(e) => setPoolAmountB(e.target.value)} style={{ width: "100%", backgroundColor: "transparent", border: "none", color: "#ffffff", fontSize: "16px", outline: "none" }} />
            </div>
            <button onClick={() => alert("Bello! Fitur Liquidity Minion dalam Pengembangan 🍌")} style={{ width: "100%", backgroundColor: "#2563eb", color: "#ffffff", padding: "16px", borderRadius: "16px", fontWeight: "bold", fontSize: "16px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <PlusCircle style={{ width: "20px", height: "20px", color: "#fde047" }} /> Tambah Likuiditas
            </button>
          </div>
        )}
      </main>

      {/* FOOTER LUCU */}
      <footer style={{ marginTop: "40px", fontSize: "12px", color: "#64748b" }}>
        Freesia DEX v2.0 • Powered by <span style={{ color: "#fde047", fontWeight: "bold" }}>Banana 🍌</span> Environment
      </footer>
    </div>
  );
}
