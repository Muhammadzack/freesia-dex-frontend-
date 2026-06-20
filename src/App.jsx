import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { ArrowUpDown, Wallet, RefreshCw, Droplets, Copy, Check } from "lucide-react";

import SimpleERC20 from "./contracts/SimpleERC20.json";
import SimpleLiquidityPool from "./contracts/SimpleLiquidityPool.json";

// ALAMAT KONTRAK YANG SUDAH DEPLOY DI LITVM
const CONTRACTS = {
  tokenA: "0x6c18239A767d19dd6d274B94442f09eE6b9b6701", // USDC
  tokenB: "0x9013443A3E0Dd775152678a76fceDcA54e1E1710", // DAI
  pool: "0xbdA6416a9420fD9fC012A217930c803dA7F3f0f9",
};

const LITVM_CHAIN_ID_HEX = "0x1159"; // 4441
const LITVM_CHAIN_ID_DEC = 4441n;

const TOKEN_LIST = {
  USDC: { address: CONTRACTS.tokenA, name: "USD Coin", logo: "💵" },
  DAI: { address: CONTRACTS.tokenB, name: "Dai Stablecoin", logo: "◈" }
};

export default function App() {
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState("swap");
  const [toast, setToast] = useState(null);

  // Swap State
  const [fromSym, setFromSym] = useState("USDC");
  const [toSym, setToSym] = useState("DAI");
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");
  const [fromBalance, setFromBalance] = useState("—");
  const [toBalance, setToBalance] = useState("—");
  const [swapLoading, setSwapLoading] = useState(false);

  // Pool State
  const [reserveA, setReserveA] = useState("—");
  const [reserveB, setReserveB] = useState("—");
  const [rateText, setRateText] = useState("—");

  // Faucet State
  const [mintBalances, setMintBalances] = useState({});
  const [mintingSym, setMintingSym] = useState(null);
  const [copiedAddr, setCopiedAddr] = useState(null);

  const showToast = useCallback((icon, msg) => {
    setToast({ icon, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const checkNetworkAndSetup = useCallback(async (web3Provider) => {
    try {
      const network = await web3Provider.getNetwork();
      if (network.chainId !== LITVM_CHAIN_ID_DEC) {
        showToast("⚠️", "Mengalihkan jaringan ke LitVM Testnet...");
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: LITVM_CHAIN_ID_HEX }],
          });
        } catch (err) {
          if (err.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: LITVM_CHAIN_ID_HEX,
                chainName: "LitVM Testnet",
                nativeCurrency: { name: "zkLTC", symbol: "zkLTC", decimals: 18 },
                rpcUrls: ["https://liteforge.rpc.caldera.xyz/http"],
                blockExplorerUrls: ["https://liteforge.explorer.caldera.xyz"],
              }],
            });
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [showToast]);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Instal MetaMask!");
    setConnecting(true);
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      const web3Signer = await web3Provider.getSigner();
      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(accounts[0]);
      await checkNetworkAndSetup(web3Provider);
    } catch (err) {
      console.error(err);
    } finally {
      setConnecting(false);
    }
  };

  const updateData = useCallback(async () => {
    if (!provider || !account) return;
    try {
      // Load Balances
      const balA = await new ethers.Contract(CONTRACTS.tokenA, SimpleERC20.abi, provider).balanceOf(account);
      const balB = await new ethers.Contract(CONTRACTS.tokenB, SimpleERC20.abi, provider).balanceOf(account);
      
      setMintBalances({
        USDC: ethers.formatUnits(balA, 18),
        DAI: ethers.formatUnits(balB, 18)
      });

      if (fromSym === "USDC") {
        setFromBalance(ethers.formatUnits(balA, 18));
        setToBalance(ethers.formatUnits(balB, 18));
      } else {
        setFromBalance(ethers.formatUnits(balB, 18));
        setToBalance(ethers.formatUnits(balA, 18));
      }

      // Load Reserves
      const pool = new ethers.Contract(CONTRACTS.pool, SimpleLiquidityPool.abi, provider);
      const [resA, resB] = await pool.getReserves();
      setReserveA(ethers.formatUnits(resA, 18));
      setReserveB(ethers.formatUnits(resB, 18));
      
      if (resA > 0n) {
        const rate = Number(resB) / Number(resA);
        setRateText(`1 USDC = ${rate.toFixed(4)} DAI`);
      } else {
        setRateText("Pool Kosong");
      }
    } catch (err) {
      console.error(err);
    }
  }, [provider, account, fromSym]);

  useEffect(() => {
    if (provider && account) {
      updateData();
      const interval = setInterval(updateData, 8000);
      return () => clearInterval(interval);
    }
  }, [provider, account, updateData]);

  // FUNGSI UTAMA MINT FAUCET (DIPERBAIKI)
  const handleMintToken = async (sym) => {
    if (!signer || !account) return alert("Hubungkan dompet dahulu!");
    const tokenAddress = TOKEN_LIST[sym]?.address;
    if (!tokenAddress) return;

    setMintingSym(sym);
    try {
      // Menggunakan ABI eksplisit untuk fungsi mint bawaan SimpleERC20
      const tokenContract = new ethers.Contract(
        tokenAddress, 
        ["function mint(address to, uint256 amount) public external"], 
        signer
      );
      
      // Mint sebanyak 10,000 token
      const tx = await tokenContract.mint(account, ethers.parseUnits("10000", 18));
      showToast("⏳", `Memproses Mint 10,000 ${sym}...`);
      await tx.wait();
      showToast("✅", `Berhasil Mint 10,000 ${sym}!`);
      updateData();
    } catch (err) {
      console.error(err);
      alert(`Gagal mint ${sym}. Pastikan MetaMask sudah berada di jaringan LitVM Testnet.`);
    } finally {
      setMintingSym(null);
    }
  };

  const handleSwap = async () => {
    if (!signer || !amountIn) return;
    setSwapLoading(true);
    try {
      const fromAddr = TOKEN_LIST[fromSym].address;
      const parsedIn = ethers.parseUnits(amountIn, 18);
      
      const erc20 = new ethers.Contract(fromAddr, SimpleERC20.abi, signer);
      showToast("⏳", "Approve token...");
      const appTx = await erc20.approve(CONTRACTS.pool, parsedIn);
      await appTx.wait();

      const pool = new ethers.Contract(CONTRACTS.pool, SimpleLiquidityPool.abi, signer);
      showToast("⏳", "Eksekusi Swap...");
      const swapTx = await pool.swap(fromAddr, parsedIn);
      await swapTx.wait();

      showToast("🎉", "Swap Berhasil!");
      setAmountIn("");
      updateData();
    } catch (err) {
      console.error(err);
      showToast("❌", "Swap Gagal.");
    } finally {
      setSwapLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0b0f19", color: "#f3f4f6", fontFamily: "sans-serif", padding: "20px" }}>
      {toast && (
        <div style={{ position: "fixed", top: "20px", right: "20px", backgroundColor: "#1e293b", padding: "12px 20px", borderRadius: "10px", border: "1px solid #334155", zIndex: 1000 }}>
          {toast.icon} {toast.msg}
        </div>
      )}

      {/* Navbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "600px", margin: "0 auto 30px auto", borderBottom: "1px solid #1e293b", paddingBottom: "15px" }}>
        <div>
          <span style={{ fontSize: "18px", fontWeight: "bold" }}>Freesia DEX</span>
          <span style={{ fontSize: "11px", color: "#10b981", marginLeft: "10px" }}>● LitVM Testnet</span>
        </div>
        <button onClick={connectWallet} style={{ backgroundColor: "#fbbf24", color: "#000", border: "none", padding: "8px 16px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>
          {account ? `${account.substring(0,6)}...${account.substring(account.length-4)}` : "Connect Wallet"}
        </button>
      </div>

      {/* Main Card */}
      <div style={{ maxWidth: "450px", margin: "0 auto", backgroundColor: "#111827", borderRadius: "20px", padding: "20px", border: "1px solid #1e293b" }}>
        <div style={{ display: "flex", backgroundColor: "#0f172a", padding: "4px", borderRadius: "10px", marginBottom: "20px" }}>
          {["swap", "mint", "pool"].map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, padding: "8px", border: "none", borderRadius: "8px", backgroundColor: activeTab === t ? "#1e293b" : "transparent", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {activeTab === "swap" && (
          <div>
            <div style={{ backgroundColor: "#0f172a", padding: "12px", borderRadius: "12px", marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9ca3af" }}><span>Bayar ({fromSym})</span><span>Saldo: {fromBalance}</span></div>
              <input type="number" placeholder="0.0" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} style={{ background: "transparent", border: "none", color: "#fff", fontSize: "20px", width: "100%", outline: "none", marginTop: "5px" }} />
            </div>
            <button onClick={() => { setFromSym(toSym); setToSym(fromSym); }} style={{ display: "block", margin: "10px auto", backgroundColor: "#1e293b", border: "none", color: "#fbbf24", padding: "6px", borderRadius: "8px", cursor: "pointer" }}><ArrowUpDown size={16} /></button>
            <div style={{ backgroundColor: "#0f172a", padding: "12px", borderRadius: "12px", marginBottom: "15px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9ca3af" }}><span>Terima ({toSym})</span><span>Saldo: {toBalance}</span></div>
              <input type="number" placeholder="0.0" value={amountIn ? (parseFloat(amountIn) * 0.99).toFixed(4) : ""} readOnly style={{ background: "transparent", border: "none", color: "#9ca3af", fontSize: "20px", width: "100%", outline: "none", marginTop: "5px" }} />
            </div>
            <button onClick={handleSwap} disabled={swapLoading || !amountIn} style={{ width: "100%", backgroundColor: "#fbbf24", color: "#000", border: "none", padding: "12px", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" }}>
              {swapLoading ? "Memproses..." : "Tukar Token"}
            </button>
          </div>
        )}

        {activeTab === "mint" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {Object.keys(TOKEN_LIST).map((sym) => (
              <div key={sym} style={{ backgroundColor: "#0f172a", padding: "12px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><strong>{sym}</strong><div style={{ fontSize: "12px", color: "#6b7280" }}>Saldo: {mintBalances[sym] || "0"}</div></div>
                <button onClick={() => handleMintToken(sym)} disabled={mintingSym === sym} style={{ backgroundColor: "#1e293b", color: "#fbbf24", border: "1px solid #fbbf24", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
                  {mintingSym === sym ? "Minting..." : `Mint 10,000 ${sym}`}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "pool" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ textAlign: "center", backgroundColor: "#0f172a", padding: "15px", borderRadius: "12px" }}>
              <Droplets style={{ color: "#fbbf24", margin: "0 auto 5px auto" }} />
              <div style={{ fontSize: "12px", color: "#9ca3af" }}>Kurs Pool</div>
              <div style={{ fontSize: "16px", fontWeight: "bold" }}>{rateText}</div>
            </div>
            <div style={{ backgroundColor: "#0f172a", padding: "12px", borderRadius: "12px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}><span>Cadangan USDC:</span><strong>{reserveA}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Cadangan DAI:</span><strong>{reserveB}</strong></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

