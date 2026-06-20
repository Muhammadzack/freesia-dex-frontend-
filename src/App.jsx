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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-6">
      <header className="w-full max-w-4xl flex justify-between items-center py-4 border-b border-slate-800 mb-12">
        <div className="flex items-center gap-2 font-bold text-xl text-indigo-400">
          <Coins className="w-6 h-6" /> FREESIA DEX
        </div>
        <button onClick={connectWallet} className="flex items-center gap-2 bg-indigo-600 px-5 py-2 rounded-xl font-medium">
          <Wallet className="w-4 h-4" />
          {account ? `${account.substring(0, 6)}...` : "Connect Wallet"}
        </button>
      </header>

      <main className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <div className="flex bg-slate-950 p-1 rounded-2xl mb-6">
          <button onClick={() => setActiveTab("swap")} className={`flex-1 py-3 text-center rounded-xl ${activeTab === "swap" ? "bg-slate-800" : "text-slate-400"}`}>Swap</button>
          <button onClick={() => setActiveTab("pool")} className={`flex-1 py-3 text-center rounded-xl ${activeTab === "pool" ? "bg-slate-800" : "text-slate-400"}`}>Pool</button>
        </div>

        {activeTab === "swap" ? (
          <form onSubmit={handleSwap} className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-2xl">
              <label className="text-xs text-slate-400">Bayar (USDC)</label>
              <input type="number" placeholder="0.0" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} className="w-full bg-transparent text-xl outline-none mt-1" required />
            </div>
            <div className="flex justify-center"><ArrowUpDown className="w-5 h-5 text-indigo-400" /></div>
            <div className="bg-slate-950 p-4 rounded-2xl">
              <label className="text-xs text-slate-400">Terima (DAI)</label>
              <div className="w-full text-xl mt-1 text-slate-400">{amountIn ? (amountIn * 0.99).toFixed(2) : "0.0"}</div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 py-4 rounded-2xl font-bold">
              {loading ? "Processing..." : "Tukar Token (Swap)"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-2xl space-y-2">
              <input type="number" placeholder="Jumlah USDC" value={poolAmountA} onChange={(e) => setPoolAmountA(e.target.value)} className="w-full bg-transparent outline-none" />
              <input type="number" placeholder="Jumlah DAI" value={poolAmountB} onChange={(e) => setPoolAmountB(e.target.value)} className="w-full bg-transparent outline-none" />
            </div>
            <button onClick={() => alert("Fitur Liquidity dalam Pengembangan")} className="w-full bg-slate-800 py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
              <PlusCircle className="w-5 h-5" /> Tambah Likuiditas
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
