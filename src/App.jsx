import React, { useState } from "react";
import { ethers } from "ethers";
import { ArrowUpDown, Droplet, Droplets, RefreshCw } from "lucide-react";

import SimpleERC20 from "./contracts/SimpleERC20.json";
import SimpleLiquidityPool from "./contracts/SimpleLiquidityPool.json";

const CONTRACTS = {
  USDC: "0xD554E773Ef2207b690e60559b7F64CEB3dc529C7c",
  DAI: "0xb83E23B9f389CB7bf0c43810427825c961f8f222",
  USDT: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
  pool: "0xf38c209d6212B1da5c7F6035aD0FD19DE97AFd04"
};

export default function App() {
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("swap");
  const [amountIn, setAmountIn] = useState("");

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Install MetaMask!");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
    } catch (err) { console.error(err); }
  };

  const handleMintToken = async (tokenAddress, tokenName) => {
    if (!account) return alert("Connect dompet dulu!");
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(tokenAddress, SimpleERC20.abi, signer);
      const mintAmount = ethers.parseEther("10000");
      alert(`Minting 10,000 ${tokenName}...`);
      const tx = await tokenContract.mint(account, mintAmount);
      await tx.wait();
      alert(`Sukses mint 10,000 ${tokenName}! 🍌`);
    } catch (err) {
      console.error(err);
      alert(`Gagal mint ${tokenName}.`);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", color: "#ffffff", fontFamily: "sans-serif", display: "flex", flexDirection: "column", alignItems: "center" }}>
      
      {/* NAVBAR ATAS (Hitam Penuh Sesuai Gambar) */}
      <nav style={{ width: "100%", backgroundColor: "#0f172a", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Logo Pisang Kotak Kuning */}
          <div style={{ backgroundColor: "#fde047", width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", boxShadow: "0 2px 8px rgba(253,224,71,0.3)" }}>
            🍌
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: "bold", fontSize: "18px", letterSpacing: "0.5px" }}>Freesia</span>
            <span style={{ color: "#fde047", fontWeight: "bold", fontSize: "14px", marginTop: "-2px" }}>DEX</span>
          </div>
          {/* Status Sepolia Network */}
          <div style={{ border: "1px solid #1e293b", backgroundColor: "#151f32", padding: "6px 14px", borderRadius: "10px", fontSize: "12px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px", marginLeft: "8px" }}>
            <span style={{ width: "6px", height: "6px", backgroundColor: "#10b981", borderRadius: "50%" }}></span>
            Sepolia
          </div>
        </div>

        {/* Tombol Connect Wallet Pas Dipojok Kanan */}
        <button onClick={connectWallet} style={{ backgroundColor: "#fde047", color: "#0f172a", border: "none", padding: "10px 16px", borderRadius: "12px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}>
          {account ? `${account.substring(0, 6)}...${account.substring(38)}` : "Connect Wallet"}
        </button>
      </nav>

      {/* CONTAINER UNTUK MENYAMAKAN LEBAR TAB DAN KARTU */}
      <div style={{ width: "100%", maxWidth: "440px", padding: "16px", boxSizing: "border-box", marginTop: "12px" }}>
        
        {/* TIGA TAB MENU SEJAJAR (Persis Seperti Gambar) */}
        <div style={{ display: "flex", backgroundColor: "#151f32", padding: "6px", borderRadius: "16px", marginBottom: "16px", border: "1px solid #1e293b" }}>
          <button onClick={() => setActiveTab("swap")} style={{ flex: 1, padding: "12px 0", borderRadius: "12px", border: "none", fontWeight: "bold", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", backgroundColor: activeTab === "swap" ? "#fde047" : "transparent", color: activeTab === "swap" ? "#0f172a" : "#94a3b8" }}>
            <span style={{ fontSize: "14px" }}>⇄</span> Swap
          </button>
          <button onClick={() => setActiveTab("faucet")} style={{ flex: 1, padding: "12px 0", borderRadius: "12px", border: "none", fontWeight: "bold", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", backgroundColor: activeTab === "faucet" ? "#fde047" : "transparent", color: activeTab === "faucet" ? "#0f172a" : "#94a3b8" }}>
            <span style={{ fontSize: "14px" }}>🪙</span> Mint
          </button>
          <button onClick={() => setActiveTab("pool")} style={{ flex: 1, padding: "12px 0", borderRadius: "12px", border: "none", fontWeight: "bold", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", backgroundColor: activeTab === "pool" ? "#fde047" : "transparent", color: activeTab === "pool" ? "#0f172a" : "#94a3b8" }}>
            <span style={{ color: "#38bdf8" }}>💧</span> Pool
          </button>
        </div>

        {/* KARTU UTAMA DAPP (Gaya Box Bulat Elegan) */}
        <div style={{ backgroundColor: "#151f32", borderRadius: "24px", padding: "20px", border: "1px solid #1e293b", boxShadow: "0 10px 25px rgba(0,0,0,0.08)" }}>
          
          {/* JIKA ACTIVE TAB === SWAP */}
          {activeTab === "swap" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <span style={{ fontWeight: "bold", fontSize: "16px", color: "#f8fafc" }}>Tukar Token</span>
                <button style={{ backgroundColor: "#1e293b", border: "none", color: "#94a3b8", padding: "6px 10px", borderRadius: "8px", cursor: "pointer" }}><RefreshCw size={14} /></button>
              </div>

              {/* INPUT FORM BAYAR */}
              <div style={{ marginBottom: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>
                  <span>Bayar</span>
                  <span>Saldo: —</span>
                </div>
                <div style={{ backgroundColor: "#0f172a", borderRadius: "16px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #1e293b" }}>
                  <div style={{ backgroundColor: "#1e293b", padding: "8px 12px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "bold" }}>
                    💵 USDC <span style={{ fontSize: "10px", color: "#64748b" }}>▼</span>
                  </div>
                  <input type="number" placeholder="0.00" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} style={{ width: "50%", background: "transparent", border: "none", color: "#ffffff", fontSize: "22px", fontWeight: "bold", textAlign: "right", outline: "none" }} />
                </div>
              </div>

              {/* TOMBOL SWAP PANAH TENGAH */}
              <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}>
                <div style={{ backgroundColor: "#fde047", padding: "10px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#0f172a" }}>
                  <ArrowUpDown size={16} />
                </div>
              </div>

              {/* INPUT FORM TERIMA */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>
                  <span>Terima</span>
                  <span>Saldo: —</span>
                </div>
                <div style={{ backgroundColor: "#0f172a", borderRadius: "16px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #1e293b" }}>
                  <div style={{ backgroundColor: "#1e293b", padding: "8px 12px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "bold" }}>
                    🔶 DAI <span style={{ fontSize: "10px", color: "#64748b" }}>▼</span>
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: "22px", fontWeight: "bold" }}>{amountIn ? (amountIn * 0.99).toFixed(2) : "0.00"}</div>
                </div>
              </div>

              {/* RATE FOOTER */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginBottom: "16px", padding: "0 4px" }}>
                <span>Rate</span>
                <span>—</span>
              </div>

              {/* ACTION BUTTON UTAMA */}
              <button style={{ width: "100%", backgroundColor: "#1e293b", color: "#94a3b8", padding: "16px", borderRadius: "16px", fontWeight: "bold", fontSize: "15px", border: "none", cursor: "not-allowed" }}>
                {account ? "Tukar Token (Swap)" : "Connect Wallet Dulu"}
              </button>
            </div>
          )}

          {/* JIKA ACTIVE TAB === MINT (FAUCET) */}
          {activeTab === "faucet" && (
            <div>
              <span style={{ fontWeight: "bold", fontSize: "16px", color: "#f8fafc", display: "block", marginBottom: "6px" }}>Mint Testnet Token</span>
              <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>Klaim token testing gratis ke alamat Sepolia milikmu</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button onClick={() => handleMintToken(CONTRACTS.USDC, "USDC")} style={{ width: "100%", backgroundColor: "#0f172a", color: "#fde047", padding: "14px", borderRadius: "12px", border: "1px solid #1e293b", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <Droplet size={14} /> Mint 10,000 USDC
                </button>
                <button onClick={() => handleMintToken(CONTRACTS.USDT, "USDT")} style={{ width: "100%", backgroundColor: "#0f172a", color: "#fde047", padding: "14px", borderRadius: "12px", border: "1px solid #1e293b", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <Droplet size={14} /> Mint 10,000 USDT
                </button>
                <button onClick={() => handleMintToken(CONTRACTS.DAI, "DAI")} style={{ width: "100%", backgroundColor: "#0f172a", color: "#fde047", padding: "14px", borderRadius: "12px", border: "1px solid #1e293b", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <Droplet size={14} /> Mint 10,000 DAI
                </button>
              </div>
            </div>
          )}

          {/* JIKA ACTIVE TAB === POOL */}
          {activeTab === "pool" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <Droplets style={{ color: "#38bdf8", marginBottom: "10px" }} size={32} />
              <span style={{ fontWeight: "bold", fontSize: "16px", color: "#f8fafc", display: "block" }}>Liquidity Pool</span>
              <p style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>Fitur penambahan likuiditas segera rilis di Freesia UI.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
