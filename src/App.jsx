cat << 'EOF' > src/App.jsx
import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { ArrowUpDown, RefreshCw, Droplets, Copy, Check } from "lucide-react";

import SimpleERC20 from "./contracts/SimpleERC20.json";
import SimpleLiquidityPool from "./contracts/SimpleLiquidityPool.json";

// ALAMAT KONTRAK YANG SUDAH DEPLOY DI LITVM
const CONTRACTS = {
  tokenA: "0x6c18239A767d19dd6d274B94442f09eE6b9b6701", // USDC
  tokenB: "0x9013443A3E0Dd775152678a76fceDcA54e1E1710", // DAI
  pool: "0xbdA6416a9420fD9fC012A217930c803dA7F3f0f9",
};

const LITVM_CHAIN_ID_HEX = "0x1159"; 
const LITVM_CHAIN_ID_DEC = 4441n;

const TOKEN_LIST = {
  USDC: { address: CONTRACTS.tokenA, name: "USD Coin", logo: "💵" },
  DAI: { address: CONTRACTS.tokenB, name: "Dai Stablecoin", logo: "◈" },
  USDT: { address: null, name: "Tether USD", logo: "💲" },
  WETH: { address: null, name: "Wrapped Ether", logo: "⟠" }
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
  const [fromBalance, setFromBalance] = useState("—");
  const [toBalance, setToBalance] = useState("—");
  const [swapLoading, setSwapLoading] = useState(false);

  // Pool State & Add Liquidity
  const [reserveA, setReserveA] = useState("—");
  const [reserveB, setReserveB] = useState("—");
  const [rateText, setRateText] = useState("—");
  const [amountAInput, setAmountAInput] = useState("");
  const [amountBInput, setAmountBInput] = useState("");
  const [poolLoading, setPoolLoading] = useState(false);

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
      const balA = await new ethers.Contract(CONTRACTS.tokenA, SimpleERC20.abi, provider).balanceOf(account);
      const balB = await new ethers.Contract(CONTRACTS.tokenB, SimpleERC20.abi, provider).balanceOf(account);
      
      const formattedA = ethers.formatUnits(balA, 18);
      const formattedB = ethers.formatUnits(balB, 18);

      setMintBalances({
        USDC: parseFloat(formattedA).toFixed(1),
        DAI: parseFloat(formattedB).toFixed(1),
        USDT: "0.0",
        WETH: "0.0"
      });

      if (fromSym === "USDC") {
        setFromBalance(parseFloat(formattedA).toFixed(1));
        setToBalance(parseFloat(formattedB).toFixed(1));
      } else {
        setFromBalance(parseFloat(formattedB).toFixed(1));
        setToBalance(parseFloat(formattedA).toFixed(1));
      }

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

  const handleMintToken = async (sym) => {
    if (!signer || !account) return alert("Hubungkan dompet dahulu!");
    const tokenAddress = TOKEN_LIST[sym]?.address;
    if (!tokenAddress) return alert(`Token ${sym} belum aktif di smart contract.`);

    setMintingSym(sym);
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ["function mint(address to, uint256 amount) public external"], signer);
      const tx = await tokenContract.mint(account, ethers.parseUnits("10000", 18));
      showToast("⏳", `Memproses Mint 10,000 ${sym}...`);
      await tx.wait();
      showToast("✅", `Berhasil Mint 10,000 ${sym}!`);
      updateData();
    } catch (err) {
      console.error(err);
      alert(`Gagal mint ${sym}.`);
    } finally {
      setMintingSym(null);
    }
  };

  const handleSwap = async () => {
    if (!signer || !amountIn) return;
    setSwapLoading(true);
    try {
      const fromAddr = TOKEN_LIST[fromSym].address;
      // Konversi aman ke string untuk menghindari masalah presisi floating-point JavaScript
      const parsedIn = ethers.parseUnits(String(amountIn), 18);
      
      const erc20 = new ethers.Contract(fromAddr, SimpleERC20.abi, signer);
      showToast("⏳", "Approve token...");
      const appTx = await erc20.approve(CONTRACTS.pool, parsedIn);
      await appTx.wait();

      const pool = new ethers.Contract(CONTRACTS.pool, SimpleLiquidityPool.abi, signer);
      showToast("⏳", "Eksekusi Swap...");
      // Menaikkan batas Gas Limit agar transaksi aman dan tidak out-of-gas di LitVM
      const swapTx = await pool.swap(fromAddr, parsedIn, { gasLimit: 500000 });
      await swapTx.wait();

      showToast("🎉", "Swap Berhasil!");
      setAmountIn("");
      updateData();
    } catch (err) {
      console.error(err);
      showToast("❌", "Swap Gagal. Pastikan dana cukup & input benar.");
    } finally {
      setSwapLoading(false);
    }
  };

  const handleAddLiquidity = async () => {
    if (!signer || !amountAInput || !amountBInput) return alert("Masukkan jumlah token!");
    setPoolLoading(true);
    try {
      const parsedA = ethers.parseUnits(String(amountAInput), 18);
      const parsedB = ethers.parseUnits(String(amountBInput), 18);

      const tokenAContract = new ethers.Contract(CONTRACTS.tokenA, SimpleERC20.abi, signer);
      const tokenBContract = new ethers.Contract(CONTRACTS.tokenB, SimpleERC20.abi, signer);
      const poolContract = new ethers.Contract(CONTRACTS.pool, SimpleLiquidityPool.abi, signer);

      showToast("⏳", "Approve USDC...");
      const txAppA = await tokenAContract.approve(CONTRACTS.pool, parsedA);
      await txAppA.wait();

      showToast("⏳", "Approve DAI...");
      const txAppB = await tokenBContract.approve(CONTRACTS.pool, parsedB);
      await txAppB.wait();

      showToast("⏳", "Menambahkan Likuiditas ke Pool...");
      const txAdd = await poolContract.addLiquidity(parsedA, parsedB, { gasLimit: 500000 });
      await txAdd.wait();

      showToast("🎉", "Likuiditas Berhasil Ditambahkan!");
      setAmountAInput("");
      setAmountBInput("");
      updateData();
    } catch (err) {
      console.error(err);
      showToast("❌", "Gagal menambah likuiditas.");
    } finally {
      setPoolLoading(false);
    }
  };

  const handleCopyAddress = (addr) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddr(addr);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0b0f19", color: "#f3f4f6", fontFamily: "sans-serif", padding: "20px" }}>
      {toast && (
        <div style={{ position: "fixed", top: "20px", right: "20px", backgroundColor: "#1e293b", padding: "12px 20px", borderRadius: "10px", border: "1px solid #334155", zIndex: 1000 }}>
          {toast.icon} {toast.msg}
        </div>
      )}

      {/* Navbar dengan Integrasi Akun X Zack */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "600px", margin: "0 auto 30px auto", borderBottom: "1px solid #1e293b", paddingBottom: "15px" }}>
        <div>
          <span style={{ fontSize: "18px", fontWeight: "bold" }}>Freesia DEX</span>
          <span style={{ fontSize: "11px", color: "#10b981", marginLeft: "10px" }}>● LitVM Testnet</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* TOMBOL LINK AKUN X LOGO SVG NATIVE (ANTI ERROR BUILD) */}
          <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ backgroundColor: "#1e293b", color: "#fff", border: "1px solid #334155", padding: "8px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", textDecoration: "none" }} title="Builder on X">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <button onClick={connectWallet} style={{ backgroundColor: "#fbbf24", color: "#000", border: "none", padding: "8px 16px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>
            {account ? `${account.substring(0,6)}...${account.substring(account.length-4)}` : "Connect Wallet"}
          </button>
        </div>
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
              <input type="text" placeholder="0.0" value={amountIn ? (parseFloat(amountIn) * 0.99).toFixed(1) : ""} readOnly style={{ background: "transparent", border: "none", color: "#9ca3af", fontSize: "20px", width: "100%", outline: "none", marginTop: "5px" }} />
            </div>
            <button onClick={handleSwap} disabled={swapLoading || !amountIn} style={{ width: "100%", backgroundColor: "#fbbf24", color: "#000", border: "none", padding: "12px", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" }}>
              {swapLoading ? "Memproses..." : "Tukar Token"}
            </button>
          </div>
        )}

        {activeTab === "mint" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <p style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", marginBottom: "5px" }}>Ambil 10,000 token testnet gratis langsung ke dompetmu untuk mencoba Swap.</p>
            {Object.keys(TOKEN_LIST).map((sym) => (
              <div key={sym} style={{ backgroundColor: "#0f172a", padding: "12px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "20px" }}>{TOKEN_LIST[sym].logo}</span>
                  <div>
                    <strong>{sym}</strong>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>Saldo: {mintBalances[sym] || "0.0"}</div>
                  </div>
                </div>
                <button onClick={() => handleMintToken(sym)} disabled={mintingSym === sym || !TOKEN_LIST[sym].address} style={{ backgroundColor: "#1e293b", color: TOKEN_LIST[sym].address ? "#fbbf24" : "#4b5563", border: `1px solid ${TOKEN_LIST[sym].address ? "#fbbf24" : "#4b5563"}`, padding: "6px 12px", borderRadius: "8px", cursor: TOKEN_LIST[sym].address ? "pointer" : "not-allowed", fontWeight: "bold" }}>
                  {mintingSym === sym ? "Minting..." : !TOKEN_LIST[sym].address ? "Soon" : "Mint 10k"}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "pool" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ textAlign: "center", backgroundColor: "#0f172a", padding: "12px", borderRadius: "12px" }}>
              <Droplets style={{ color: "#fbbf24", margin: "0 auto 5px auto" }} size={20} />
              <div style={{ fontSize: "12px", color: "#9ca3af" }}>Kurs Pool</div>
              <div style={{ fontSize: "16px", fontWeight: "bold" }}>{rateText}</div>
            </div>

            <div style={{ backgroundColor: "#0f172a", padding: "12px", borderRadius: "12px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}><span>Cadangan USDC:</span><strong>{reserveA}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Cadangan DAI:</span><strong>{reserveB}</strong></div>
            </div>

            {/* INTERFACE ADD LIQUIDITY */}
            <div style={{ borderTop: "1px solid #1e293b", paddingTop: "12px", marginTop: "4px" }}>
              <div style={{ fontSize: "13px", fontWeight: "bold", color: "#fbbf24", marginBottom: "8px" }}>Tambah Likuiditas</div>
              
              <div style={{ backgroundColor: "#0f172a", padding: "10px", borderRadius: "10px", marginBottom: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#9ca3af" }}><span>Jumlah USDC</span></div>
                <input type="number" placeholder="0.0" value={amountAInput} onChange={(e) => setAmountAInput(e.target.value)} style={{ background: "transparent", border: "none", color: "#fff", fontSize: "16px", width: "100%", outline: "none", marginTop: "3px" }} />
              </div>

              <div style={{ backgroundColor: "#0f172a", padding: "10px", borderRadius: "10px", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#9ca3af" }}><span>Jumlah DAI</span></div>
                <input type="number" placeholder="0.0" value={amountBInput} onChange={(e) => setAmountBInput(e.target.value)} style={{ background: "transparent", border: "none", color: "#fff", fontSize: "16px", width: "100%", outline: "none", marginTop: "3px" }} />
              </div>

              <button onClick={handleAddLiquidity} disabled={poolLoading || !amountAInput || !amountBInput} style={{ width: "100%", backgroundColor: "#10b981", color: "#000", border: "none", padding: "10px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                {poolLoading ? <RefreshCw className="animate-spin" size={16} /> : "Tambah Likuiditas"}
              </button>
            </div>

            {/* Info Contract */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>
              <span>Pool Contract:</span>
              <div style={{ display: "flex", gap: "4px", alignItems: "center", color: "#9ca3af" }}>
                <span>{CONTRACTS.pool.substring(0, 10)}...</span>
                <button onClick={() => handleCopyAddress(CONTRACTS.pool)} style={{ background: "transparent", border: "none", color: "#fbbf24", cursor: "pointer" }}>
                  {copiedAddr === CONTRACTS.pool ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
EOF

