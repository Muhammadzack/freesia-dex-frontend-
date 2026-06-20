import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { ArrowUpDown, Wallet, RefreshCw, Coins, Droplets, Copy, Check } from "lucide-react";

import SimpleERC20 from "./contracts/SimpleERC20.json";
import SimpleLiquidityPool from "./contracts/SimpleLiquidityPool.json";

// ══════════════════════════════════════════════════════════════
// KONFIGURASI KONTRAK — alamat yang sudah di-deploy ke LitVM Testnet
// ══════════════════════════════════════════════════════════════
const CONTRACTS = {
  tokenA: "0x6c18239A767d19dd6d274B94442f09eE6b9b6701", // USDC
  tokenB: "0x9013443A3E0Dd775152678a76fceDcA54e1E1710", // DAI
  factory: "0x2f2B9cAf38C28c7859E587432ecF2D0117d41356",
  pool: "0xbdA6416a9420fD9fC012A217930c803dA7F3f0f9",
};

// ── Konfigurasi Network: LitVM Testnet (LiteForge), chain ID 4441 ──
const LITVM_CHAIN_ID_HEX = "0x1159"; // 4441 dalam hex
const LITVM_CHAIN_ID_DEC = 4441n;
const LITVM_PARAMS = {
  chainId: LITVM_CHAIN_ID_HEX,
  chainName: "LitVM Testnet",
  nativeCurrency: { name: "zkLTC", symbol: "zkLTC", decimals: 18 },
  rpcUrls: ["https://liteforge.rpc.caldera.xyz/http"],
  blockExplorerUrls: ["https://liteforge.explorer.caldera.xyz"],
};

// Daftar token yang tampil di UI
const TOKEN_LIST = {
  USDC: { address: CONTRACTS.tokenA, name: "USD Coin", logo: "💵", deployed: true },
  DAI: { address: CONTRACTS.tokenB, name: "Dai Stablecoin", logo: "◈", deployed: true },
  USDT: { address: null, name: "Tether USD", logo: "💲", deployed: false },
  WETH: { address: null, name: "Wrapped Ether", logo: "⟠", deployed: false },
};

const POOL_TOKEN_A_SYMBOL = "USDC";
const POOL_TOKEN_B_SYMBOL = "DAI";

export default function App() {
  // ── Wallet state ──
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [connecting, setConnecting] = useState(false);

  // ── UI state ──
  const [activeTab, setActiveTab] = useState("swap");
  const [toast, setToast] = useState(null);

  // ── Swap state ──
  const [fromSym, setFromSym] = useState("USDC");
  const [toSym, setToSym] = useState("DAI");
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");
  const [fromBalance, setFromBalance] = useState("—");
  const [toBalance, setToBalance] = useState("—");
  const [swapLoading, setSwapLoading] = useState(false);

  // ── Pool state ──
  const [reserveA, setReserveA] = useState("—");
  const [reserveB, setReserveB] = useState("—");
  const [rateText, setRateText] = useState("—");

  // ── Mint state ──
  const [mintBalances, setMintBalances] = useState({});
  const [mintingSym, setMintingSym] = useState(null);

  // ── Copy state ──
  const [copiedAddr, setCopiedAddr] = useState(null);

  const showToast = useCallback((icon, msg) => {
    setToast({ icon, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── 1. OTOMATISASI DETEKSI JARINGAN (CHAIN ID 4441) ──
  const checkNetworkAndSetup = useCallback(async (web3Provider) => {
    try {
      const network = await web3Provider.getNetwork();
      if (network.chainId !== LITVM_CHAIN_ID_DEC) {
        showToast("⚠️", "Jaringan salah! Mencoba beralih ke LitVM Testnet...");
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: LITVM_CHAIN_ID_HEX }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [LITVM_PARAMS],
            });
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [showToast]);

  // ── 2. FUNGSI CONNECT WALLET ──
  const connectWallet = async () => {
    if (!window.ethereum) return showToast("❌", "MetaMask tidak ditemukan!");
    setConnecting(true);
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      const web3Signer = await web3Provider.getSigner();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(accounts[0]);

      await checkNetworkAndSetup(web3Provider);
      showToast("🚀", "Dompet Berhasil Terhubung!");
    } catch (err) {
      console.error(err);
      showToast("❌", "Gagal menghubungkan dompet.");
    } finally {
      setConnecting(false);
    }
  };

  // ── 3. MEMBACA SALDO & RESERVE POOL ──
  const updateBalancesAndReserves = useCallback(async () => {
    if (!provider || !account) return;
    try {
      // Saldo Token From
      const fromTokenInfo = TOKEN_LIST[fromSym];
      if (fromTokenInfo && fromTokenInfo.address) {
        const contractFrom = new ethers.Contract(fromTokenInfo.address, SimpleERC20.abi, provider);
        const balFrom = await contractFrom.balanceOf(account);
        setFromBalance(ethers.formatUnits(balFrom, 18));
      } else {
        setFromBalance("0");
      }

      // Saldo Token To
      const toTokenInfo = TOKEN_LIST[toSym];
      if (toTokenInfo && toTokenInfo.address) {
        const contractTo = new ethers.Contract(toTokenInfo.address, SimpleERC20.abi, provider);
        const balTo = await contractTo.balanceOf(account);
        setToBalance(ethers.formatUnits(balTo, 18));
      } else {
        setToBalance("0");
      }

      // Saldo Tab Mint Faucet
      const currentBalances = {};
      for (const [sym, info] of Object.entries(TOKEN_LIST)) {
        if (info.address) {
          const contract = new ethers.Contract(info.address, SimpleERC20.abi, provider);
          const bal = await contract.balanceOf(account);
          currentBalances[sym] = ethers.formatUnits(bal, 18);
        } else {
          currentBalances[sym] = "0";
        }
      }
      setMintBalances(currentBalances);

      // Membaca Data Likuiditas Pool
      const poolContract = new ethers.Contract(CONTRACTS.pool, SimpleLiquidityPool.abi, provider);
      const [resA, resB] = await poolContract.getReserves();
      const formattedA = ethers.formatUnits(resA, 18);
      const formattedB = ethers.formatUnits(resB, 18);
      setReserveA(formattedA);
      setReserveB(formattedB);

      if (parseFloat(formattedA) > 0) {
        const rate = parseFloat(formattedB) / parseFloat(formattedA);
        setRateText(`1 ${POOL_TOKEN_A_SYMBOL} = ${rate.toFixed(4)} ${POOL_TOKEN_B_SYMBOL}`);
      } else {
        setRateText("Pool Kosong");
      }
    } catch (err) {
      console.error("Gagal mengambil data blockchain:", err);
    }
  }, [provider, account, fromSym, toSym]);

  useEffect(() => {
    if (provider && account) {
      updateBalancesAndReserves();
      const interval = setInterval(updateBalancesAndReserves, 10000);
      return () => clearInterval(interval);
    }
  }, [provider, account, updateBalancesAndReserves]);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("chainChanged", () => window.location.reload());
      window.ethereum.on("accountsChanged", () => window.location.reload());
    }
  }, []);

  // ── 4. FUNGSI MINT FAUCET TOKEN ──
  const handleMintToken = async (sym) => {
    if (!signer) return showToast("⚠️", "Hubungkan dompet terlebih dahulu!");
    const tokenInfo = TOKEN_LIST[sym];
    if (!tokenInfo || !tokenInfo.address) return showToast("❌", "Token belum dideploy!");

    setMintingSym(sym);
    try {
      const contract = new ethers.Contract(tokenInfo.address, ["function mint(address to, uint256 amount) public"], signer);
      const tx = await contract.mint(account, ethers.parseUnits("10000", 18));
      showToast("⏳", "Memproses transaksi mint...");
      await tx.wait();
      showToast("✅", `Sukses Mint 10,000 ${sym}!`);
      updateBalancesAndReserves();
    } catch (err) {
      console.error(err);
      showToast("❌", "Transaksi mint dibatalkan/gagal.");
    } finally {
      setMintingSym(null);
    }
  };

  // ── 5. FUNGSI SWAP TOKEN ──
  const handleSwap = async () => {
    if (!signer || !amountIn) return;
    setSwapLoading(true);
    try {
      const poolContract = new ethers.Contract(CONTRACTS.pool, SimpleLiquidityPool.abi, signer);
      const parsedAmountIn = ethers.parseUnits(amountIn, 18);

      const fromTokenAddress = TOKEN_LIST[fromSym].address;
      const erc20Contract = new ethers.Contract(fromTokenAddress, SimpleERC20.abi, signer);

      showToast("⏳", "Menyetujui (Approve) penggunaan token...");
      const approveTx = await erc20Contract.approve(CONTRACTS.pool, parsedAmountIn);
      await approveTx.wait();

      showToast("⏳", "Mengeksekusi Swap di LitVM...");
      const tx = await poolContract.swap(fromTokenAddress, parsedAmountIn);
      await tx.wait();

      showToast("🎉", "Swap Berhasil!");
      setAmountIn("");
      setAmountOut("");
      updateBalancesAndReserves();
    } catch (err) {
      console.error(err);
      showToast("❌", "Swap gagal atau dibatalkan.");
    } finally {
      setSwapLoading(false);
    }
  };

  const handleCopyAddress = (addr) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddr(addr);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  // ── 6. STRUKTUR TAMPILAN ANTARMUKA UI (DARK MODE DEX) ──
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0b0f19", color: "#f3f4f6", fontFamily: "sans-serif", padding: "20px" }}>
      {/* Toast Alert */}
      {toast && (
        <div style={{ position: "fixed", top: "20px", right: "20px", backgroundColor: "#1e293b", padding: "12px 20px", borderRadius: "10px", display: "flex", gap: "10px", border: "1px solid #334155", zIndex: 1000 }}>
          <span>{toast.icon}</span><span>{toast.msg}</span>
        </div>
      )}

      {/* Navbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "1200px", margin: "0 auto 40px auto", borderBottom: "1px solid #1e293b", paddingBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ backgroundColor: "#fbbf24", width: "35px", height: "35px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: "bold" }}>F</div>
          <span style={{ fontSize: "20px", fontWeight: "bold", letterSpacing: "1px" }}>Freesia DEX</span>
          <span style={{ fontSize: "12px", color: "#10b981", backgroundColor: "rgba(16,185,129,0.1)", padding: "4px 8px", borderRadius: "20px", border: "1px solid rgba(16,185,129,0.2)" }}>● LitVM Testnet</span>
        </div>

        <button onClick={connectWallet} disabled={connecting} style={{ backgroundColor: account ? "#1e293b" : "#fbbf24", color: account ? "#fbbf24" : "#0f172a", border: "none", padding: "10px 18px", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          <Wallet size={16} />
          {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : connecting ? "Connecting..." : "Connect Wallet"}
        </button>
      </div>

      {/* Main Container */}
      <div style={{ maxWidth: "480px", margin: "0 auto", backgroundColor: "#111827", borderRadius: "24px", padding: "24px", border: "1px solid #1e293b", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)" }}>
        {/* Tab Switcher */}
        <div style={{ display: "flex", backgroundColor: "#0f172a", padding: "4px", borderRadius: "14px", marginBottom: "24px" }}>
          {["swap", "mint", "pool"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: activeTab === tab ? "#1e293b" : "transparent", color: activeTab === tab ? "#fff" : "#9ca3af", fontWeight: "bold", cursor: "pointer", textTransform: "capitalize" }}>
              {tab}
            </button>
          ))}
        </div>

        {/* TAB 1: SWAP INTERFACE */}
        {activeTab === "swap" && (
          <div>
            {/* Input From */}
            <div style={{ backgroundColor: "#0f172a", padding: "16px", borderRadius: "16px", marginBottom: "8px", border: "1px solid #1e293b" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af", fontSize: "12px", marginBottom: "8px" }}>
                <span>Bayar</span>
                <span>Saldo: {fromBalance}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <input type="number" placeholder="0.0" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} style={{ background: "transparent", border: "none", color: "#fff", fontSize: "24px", width: "60%", outline: "none" }} />
                
                {/* INTERAKTIF DROPDOWN (FROM) */}
                <button onClick={() => setFromSym(fromSym === "USDC" ? "DAI" : "USDC")} style={{ backgroundColor: "#1e293b", color: "#fff", border: "none", padding: "8px 12px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" }}>
                  {TOKEN_LIST[fromSym].logo} {fromSym} ▾
                </button>
              </div>
            </div>

            {/* Icon Switcher */}
            <div style={{ display: "flex", justifyContent: "center", margin: "-12px 0", position: "relative", zIndex: 2 }}>
              <div onClick={() => { setFromSym(toSym); setToSym(fromSym); }} style={{ backgroundColor: "#1e293b", border: "4px solid #111827", width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fbbf24" }}>
                <ArrowUpDown size={16} />
              </div>
            </div>

            {/* Input To */}
            <div style={{ backgroundColor: "#0f172a", padding: "16px", borderRadius: "16px", marginTop: "8px", marginBottom: "16px", border: "1px solid #1e293b" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af", fontSize: "12px", marginBottom: "8px" }}>
                <span>Terima (Estimasi)</span>
                <span>Saldo: {toBalance}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <input type="number" placeholder="0.0" value={amountIn ? (parseFloat(amountIn) * 0.99).toFixed(4) : ""} readOnly style={{ background: "transparent", border: "none", color: "#9ca3af", fontSize: "24px", width: "60%", outline: "none" }} />
                
                {/* INTERAKTIF DROPDOWN (TO) */}
                <button onClick={() => setToSym(toSym === "DAI" ? "USDC" : "DAI")} style={{ backgroundColor: "#1e293b", color: "#fff", border: "none", padding: "8px 12px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" }}>
                  {TOKEN_LIST[toSym].logo} {toSym} ▾
                </button>
              </div>
            </div>

            <button onClick={handleSwap} disabled={swapLoading || !amountIn} style={{ width: "100%", backgroundColor: "#fbbf24", color: "#0f172a", border: "none", padding: "14px", borderRadius: "16px", fontWeight: "bold", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {swapLoading ? <RefreshCw className="animate-spin" size={18} /> : "Tukar Token"}
            </button>
          </div>
        )}

        {/* TAB 2: MINT FAUCET INTERFACE */}
        {activeTab === "mint" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ fontSize: "13px", color: "#9ca3af", textAlign: "center", marginBottom: "10px" }}>Ambil 10,000 token testnet gratis langsung ke dompetmu untuk mencoba Swap.</p>
            {Object.keys(TOKEN_LIST).map((sym) => (
              <div key={sym} style={{ backgroundColor: "#0f172a", padding: "14px 16px", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #1e293b" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "20px" }}>{TOKEN_LIST[sym].logo}</span>
                  <div>
                    <div style={{ fontWeight: "bold" }}>{sym}</div>
                    <div style={{ fontSize: "11px", color: "#6b7280" }}>Saldo: {mintBalances[sym] || "0"}</div>
                  </div>
                </div>
                <button onClick={() => handleMintToken(sym)} disabled={mintingSym === sym} style={{ backgroundColor: "#1e293b", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)", padding: "8px 14px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}>
                  {mintingSym === sym ? "Minting..." : "Mint 10k"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: POOL INFO INTERFACE */}
        {activeTab === "pool" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ textAlign: "center", backgroundColor: "#0f172a", padding: "16px", borderRadius: "16px", border: "1px solid #1e293b" }}>
              <Droplets style={{ color: "#fbbf24", margin: "0 auto 8px auto" }} size={28} />
              <div style={{ fontSize: "14px", color: "#9ca3af" }}>Total Likuiditas Terunci</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: "#fff", marginTop: "4px" }}>{rateText}</div>
            </div>

            <div style={{ backgroundColor: "#0f172a", padding: "16px", borderRadius: "16px", border: "1px solid #1e293b", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <span style={{ color: "#9ca3af" }}>Cadangan {POOL_TOKEN_A_SYMBOL}</span>
                <span style={{ fontWeight: "bold" }}>{reserveA}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <span style={{ color: "#9ca3af" }}>Cadangan {POOL_TOKEN_B_SYMBOL}</span>
                <span style={{ fontWeight: "bold" }}>{reserveB}</span>
              </div>
            </div>

            {/* Smart Contract Addresses */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px", color: "#6b7280", backgroundColor: "rgba(15,23,42,0.5)", padding: "12px", borderRadius: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Pool Contract:</span>
                <div style={{ display: "flex", gap: "4px", alignItems: "center", color: "#9ca3af" }}>
                  <span>{CONTRACTS.pool.substring(0, 10)}...</span>
                  <button onClick={() => handleCopyAddress(CONTRACTS.pool)} style={{ background: "transparent", border: "none", color: "#fbbf24", cursor: "pointer" }}>
                    {copiedAddr === CONTRACTS.pool ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

