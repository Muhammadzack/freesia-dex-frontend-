Import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';

const FreesiaLogo = () => (
  <svg width="45" height="45" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 50 C50 20, 35 25, 50 10 C65 25, 50 20, 50 50" fill="#FFA6C9" />
    <path d="M50 50 C50 80, 65 75, 50 90 C35 75, 50 80, 50 50" fill="#FFA6C9" />
    <path d="M50 50 C20 50, 25 35, 10 50 C25 65, 20 50, 50 50" fill="#FFA6C9" />
    <path d="M50 50 C80 50, 75 65, 90 50 C75 35, 80 50, 50 50" fill="#FFA6C9" />
    <path d="M50 50 C30 30, 20 45, 22 22 C45 20, 30 30, 50 50" fill="#FFB6D9" />
    <path d="M50 50 C70 70, 80 55, 78 78 C55 80, 70 70, 50 50" fill="#FFB6D9" />
    <path d="M50 50 C70 30, 55 20, 78 22 C80 45, 70 30, 50 50" fill="#FFB6D9" />
    <path d="M50 50 C30 70, 45 80, 22 78 C20 55, 30 70, 50 50" fill="#FFB6D9" />
    <path d="M60 25 C52 22, 44 30, 44 42 L44 78 M34 45 L56 45" stroke="#0F172A" strokeWidth="8" strokeLinecap="round" fill="none" />
  </svg>
);

const CONTRACTS = { pool: "0xbdA6416a9420fD9fC012A217930c803dA7F3f0f9" };

const LITVM_CHAIN_ID_HEX = "0x1159";
const LITVM_CHAIN_ID_DEC = 4441n;
const LITVM_PARAMS = {
  chainId: LITVM_CHAIN_ID_HEX,
  chainName: "LitVM Testnet",
  nativeCurrency: { name: "zkLTC", symbol: "zkLTC", decimals: 18 },
  rpcUrls: ["https://liteforge.rpc.caldera.xyz/http"],
  blockExplorerUrls: ["https://liteforge.explorer.caldera.xyz"],
};

const SimpleERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function mint(address to, uint256 amount) external",
  "function symbol() view returns (string)"
];

const SimpleLiquidityPool_ABI = [
  "function swap(address tokenIn, uint256 amountIn, uint256 minAmountOut) external returns (uint256 amountOut)",
  "function addLiquidity(uint256 amountA, uint256 amountB) external returns (uint256 lpTokens)",
  "function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256 amountOut)",
  "function reserveA() view returns (uint256)",
  "function reserveB() view returns (uint256)",
  "function tokenA() view returns (address)",
  "function tokenB() view returns (address)"
];

const styles = {
  layout: { backgroundColor: "#F9F8F6", color: "#0F172A", minHeight: "100vh", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", backgroundColor: "#FFFFFF", borderBottom: "1px solid #E2E8F0" },
  navContainer: { display: "flex", gap: "10px", padding: "20px 24px", overflowX: "auto" },
  navTab: (isActive) => ({ padding: "10px 20px", borderRadius: "12px", border: "none", fontWeight: "bold", cursor: "pointer", backgroundColor: isActive ? "#FDC500" : "#F1F5F9", color: isActive ? "#000" : "#64748B", transition: "0.2s", whiteSpace: "nowrap" }),
  mainContent: { padding: "0 24px 40px 24px", maxWidth: "1000px", margin: "0 auto", flexGrow: 1, width: "100%", boxSizing: "border-box" },
  card: { backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "24px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px rgba(0,0,0,0.02)", marginBottom: "20px" },
  button: { backgroundColor: "#FDC500", color: "#000", border: "none", padding: "16px", borderRadius: "12px", fontWeight: "900", cursor: "pointer", width: "100%", fontSize: "16px", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" },
  inputBox: { backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", padding: "16px", borderRadius: "12px", marginBottom: "16px" },
  input: { width: "100%", border: "none", backgroundColor: "transparent", fontSize: "24px", fontWeight: "bold", color: "#0F172A", outline: "none", marginTop: "8px" },
  footer: { textAlign: "center", padding: "40px 20px", color: "#64748B", marginTop: "auto", borderTop: "1px solid #E2E8F0" },
  networkBadge: (ok) => ({ fontSize: "11px", fontWeight: "bold", color: ok ? "#10B981" : "#DC2626", backgroundColor: ok ? "#ECFDF5" : "#FEF2F2", padding: "2px 8px", borderRadius: "6px", marginLeft: "8px" }),
  iconBtn: { background: "#F1F5F9", border: "none", padding: "6px 10px", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", fontSize: "13px", fontWeight: "bold" },
};

const shortAddr = (addr) => addr ? addr.slice(0, 6) + "..." + addr.slice(-4) : "";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [onCorrectNetwork, setOnCorrectNetwork] = useState(false);

  const [tokens, setTokens] = useState({
    zkLTC: { address: "NATIVE", isNative: true },
    USDC: { address: "0x6c18239A767d19dd6d274B94442f09eE6b9b6701", isNative: false },
    DAI: { address: "0x9013443A3E0Dd775152678a76fceDcA54e1E1710", isNative: false }
  });

  const [balances, setBalances] = useState({ zkLTC: "0.0000", USDC: "0.00", DAI: "0.00" });
  const [fromSym, setFromSym] = useState("USDC");
  const [toSym, setToSym] = useState("DAI");
  const [amountIn, setAmountIn] = useState("");
  const [amountOutPreview, setAmountOutPreview] = useState("");
  const [poolTokenA, setPoolTokenA] = useState("USDC");
  const [poolTokenB, setPoolTokenB] = useState("DAI");
  const [amountAInput, setAmountAInput] = useState("");
  const [amountBInput, setAmountBInput] = useState("");
  const [customAddress, setCustomAddress] = useState("");
  const [customSymbol, setCustomSymbol] = useState("");

  const [loading, setLoading] = useState(false);
  const [txCount, setTxCount] = useState(0);

  const [slippage, setSlippage] = useState(0.5);
  const [showSlippageModal, setShowSlippageModal] = useState(false);
  const [customSlippage, setCustomSlippage] = useState("");

  const [poolReserves, setPoolReserves] = useState({ reserveA: 0, reserveB: 0 });
  const [priceImpact, setPriceImpact] = useState(0);

  const [chartData, setChartData] = useState([]);
  const chartIntervalRef = useRef(null);

  const [txHistory, setTxHistory] = useState([]);

  const [toast, setToast] = useState(null);
  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      showToast("error", "Ekstensi/Dompet Web3 tidak terdeteksi!");
      return;
    }
    try {
      setConnecting(true);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        showToast("error", "Tidak ada akun yang dipilih di wallet.");
        setConnecting(false);
        return;
      }

      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const network = await web3Provider.getNetwork();

      if (network.chainId !== LITVM_CHAIN_ID_DEC) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: LITVM_CHAIN_ID_HEX }],
          });
        } catch (switchErr) {
          if (switchErr.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [LITVM_PARAMS],
              });
            } catch (addErr) {
              console.error(addErr);
              showToast("error", "Gagal menambahkan network LitVM Testnet.");
              setConnecting(false);
              return;
            }
          } else {
            showToast("error", "Silakan ganti network ke LitVM Testnet manual.");
            setConnecting(false);
            return;
          }
        }
      }

      const finalProvider = new ethers.BrowserProvider(window.ethereum);
      const finalNetwork = await finalProvider.getNetwork();
      const web3Signer = await finalProvider.getSigner();

      setProvider(finalProvider);
      setSigner(web3Signer);
      setAccount(accounts[0]);
      setOnCorrectNetwork(finalNetwork.chainId === LITVM_CHAIN_ID_DEC);
      showToast("success", "Wallet terhubung!");

    } catch (err) {
      console.error("Koneksi gagal:", err);
      showToast("error", "Gagal terhubung: " + (err.message || "Unknown error").slice(0, 80));
    } finally {
      setConnecting(false);
    }
  };

  useEffect(() => {
    if (!window.ethereum) return;
    const handleChainChanged = () => window.location.reload();
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) { setAccount(""); setSigner(null); }
      else window.location.reload();
    };
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    return () => {
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  const updateData = useCallback(async () => {
    if (!provider || !account) return;
    try {
      let newBalances = {};
      for (const [sym, data] of Object.entries(tokens)) {
        if (data.isNative) {
          const bal = await provider.getBalance(account);
          newBalances[sym] = parseFloat(ethers.formatEther(bal)).toFixed(4);
        } else {
          const contract = new ethers.Contract(data.address, SimpleERC20_ABI, provider);
          const bal = await contract.balanceOf(account).catch(() => 0n);
          newBalances[sym] = parseFloat(ethers.formatUnits(bal, 18)).toFixed(2);
        }
      }
      setBalances(prev => ({ ...prev, ...newBalances }));
    } catch (err) { console.error("Balance fetch error", err); }
  }, [provider, account, tokens]);

  useEffect(() => {
    if (provider && account) {
      updateData();
      const interval = setInterval(updateData, 4000);
      return () => clearInterval(interval);
    }
  }, [provider, account, tokens, updateData]);

  const loadPoolReserves = useCallback(async () => {
    try {
      const readProvider = provider || new ethers.JsonRpcProvider(LITVM_PARAMS.rpcUrls[0]);
      const poolContract = new ethers.Contract(CONTRACTS.pool, SimpleLiquidityPool_ABI, readProvider);
      const [resA, resB] = await Promise.all([poolContract.reserveA(), poolContract.reserveB()]);
      const a = parseFloat(ethers.formatUnits(resA, 18));
      const b = parseFloat(ethers.formatUnits(resB, 18));
      setPoolReserves({ reserveA: a, reserveB: b });

      if (a > 0 && b > 0) {
        const rate = b / a;
        setChartData(prev => {
          const next = [...prev, { t: Date.now(), rate }];
          return next.slice(-30);
        });
      }
    } catch (err) {
      console.error("Gagal load pool reserves:", err);
    }
  }, [provider]);

  useEffect(() => {
    loadPoolReserves();
    chartIntervalRef.current = setInterval(loadPoolReserves, 6000);
    return () => clearInterval(chartIntervalRef.current);
  }, [loadPoolReserves]);

  useEffect(() => {
    const calc = async () => {
      if (!amountIn || parseFloat(amountIn) <= 0) {
        setAmountOutPreview("");
        setPriceImpact(0);
        return;
      }
      const isStablePair = (fromSym === "USDC" && toSym === "DAI") || (fromSym === "DAI" && toSym === "USDC");
      if (!isStablePair) {
        setAmountOutPreview("");
        setPriceImpact(0);
        return;
      }
      try {
        const readProvider = provider || new ethers.JsonRpcProvider(LITVM_PARAMS.rpcUrls[0]);
        const poolContract = new ethers.Contract(CONTRACTS.pool, SimpleLiquidityPool_ABI, readProvider);
        const amountInWei = ethers.parseUnits(String(amountIn), 18);
        const fromAddr = tokens[fromSym].address;
        const out = await poolContract.getAmountOut(fromAddr, amountInWei);
        const outFormatted = parseFloat(ethers.formatUnits(out, 18));
        setAmountOutPreview(outFormatted.toFixed(6));

        const { reserveA, reserveB } = poolReserves;
        if (reserveA > 0 && reserveB > 0) {
          const spotRate = fromSym === "USDC" ? reserveB / reserveA : reserveA / reserveB;
          const effectiveRate = outFormatted / parseFloat(amountIn);
          const impact = Math.abs((spotRate - effectiveRate) / spotRate) * 100;
          setPriceImpact(impact);
        }
      } catch (err) {
        console.error("Gagal hitung preview:", err);
        setAmountOutPreview("");
      }
    };
    calc();
  }, [amountIn, fromSym, toSym, provider, tokens, poolReserves]);

  const handleAddToken = () => {
    if (!customAddress || !customSymbol) return showToast("error", "Isi alamat dan simbol token!");
    const symUpper = customSymbol.toUpperCase();
    setTokens(prev => ({ ...prev, [symUpper]: { address: customAddress, isNative: false } }));
    setBalances(prev => ({ ...prev, [symUpper]: "0.00" }));
    showToast("success", `${symUpper} berhasil ditambahkan!`);
    setCustomAddress(""); setCustomSymbol("");
    updateData();
  };

  const ensureCorrectNetwork = async () => {
    if (!signer) { showToast("error", "Hubungkan wallet dulu!"); return false; }
    if (!onCorrectNetwork) { showToast("error", "Wallet belum di LitVM Testnet. Connect ulang."); return false; }
    return true;
  };

  const addToHistory = (type, detail) => {
    setTxHistory(prev => [{ id: Date.now(), type, detail, time: new Date().toLocaleTimeString('id-ID') }, ...prev].slice(0, 15));
  };

  const handleSwap = async () => {
    if (!(await ensureCorrectNetwork())) return;
    if (!amountIn) return showToast("error", "Masukkan jumlah!");

    const isStablePair = (fromSym === "USDC" && toSym === "DAI") || (fromSym === "DAI" && toSym === "USDC");
    if (!isStablePair) {
      showToast("error", "Pool ini hanya mendukung pasangan USDC/DAI saat ini.");
      return;
    }

    setLoading(true);
    try {
      const parsedIn = ethers.parseUnits(String(amountIn), 18);
      const fromAddr = tokens[fromSym].address;

      const tokenContract = new ethers.Contract(fromAddr, SimpleERC20_ABI, signer);
      const poolContract = new ethers.Contract(CONTRACTS.pool, SimpleLiquidityPool_ABI, signer);

      const allowance = await tokenContract.allowance(account, CONTRACTS.pool);
      if (allowance < parsedIn) {
        showToast("info", "Konfirmasi approve di wallet...");
        const approveTx = await tokenContract.approve(CONTRACTS.pool, parsedIn);
        await approveTx.wait();
      }

      const expectedOut = await poolContract.getAmountOut(fromAddr, parsedIn);
      const slippageBps = BigInt(Math.floor(slippage * 100));
      const minAmountOut = expectedOut - (expectedOut * slippageBps / 10000n);

      showToast("info", "Konfirmasi swap di wallet...");
      const tx = await poolContract.swap(fromAddr, parsedIn, minAmountOut, { gasLimit: 400000 });
      await tx.wait();

      showToast("success", `Swap Berhasil! ${amountIn} ${fromSym} ke ${toSym}`);
      addToHistory("Swap", `${amountIn} ${fromSym} -> ${toSym}`);
      setTxCount(prev => prev + 1);
      setAmountIn("");
      updateData();
      loadPoolReserves();
    } catch (err) {
      console.error(err);
      const reason = err.reason || err.shortMessage || err.message || "Pastikan gas fee & slippage cukup.";
      showToast("error", "Swap Gagal: " + reason.slice(0, 100));
    } finally { setLoading(false); }
  };

  const handleMint = async (sym) => {
    if (!(await ensureCorrectNetwork())) return;
    setLoading(true);
    try {
      const contract = new ethers.Contract(tokens[sym].address, SimpleERC20_ABI, signer);
      const tx = await contract.mint(account, ethers.parseUnits("10000", 18));
      await tx.wait();
      showToast("success", `Mint 10,000 ${sym} Berhasil!`);
      addToHistory("Mint", `10,000 ${sym}`);
      setTxCount(prev => prev + 1);
      updateData();
    } catch (err) {
      console.error(err);
      showToast("error", "Mint Gagal: " + (err.reason || err.message || "Unknown error").slice(0, 80));
    }
    setLoading(false);
  };

  const handleAddLiquidity = async () => {
    if (!(await ensureCorrectNetwork())) return;
    if (!amountAInput || !amountBInput) return showToast("error", "Isi nominal!");
    setLoading(true);
    try {
      const pA = ethers.parseUnits(String(amountAInput), 18);
      const pB = ethers.parseUnits(String(amountBInput), 18);
      const tokenAContract = new ethers.Contract(tokens[poolTokenA].address, SimpleERC20_ABI, signer);
      const tokenBContract = new ethers.Contract(tokens[poolTokenB].address, SimpleERC20_ABI, signer);

      const allowA = await tokenAContract.allowance(account, CONTRACTS.pool);
      if (allowA < pA) await (await tokenAContract.approve(CONTRACTS.pool, pA)).wait();
      const allowB = await tokenBContract.allowance(account, CONTRACTS.pool);
      if (allowB < pB) await (await tokenBContract.approve(CONTRACTS.pool, pB)).wait();

      const poolContract = new ethers.Contract(CONTRACTS.pool, SimpleLiquidityPool_ABI, signer);
      const tx = await poolContract.addLiquidity(pA, pB, { gasLimit: 500000 });
      await tx.wait();

      showToast("success", "Likuiditas Berhasil Ditambahkan!");
      addToHistory("Add Liquidity", `${amountAInput} ${poolTokenA} + ${amountBInput} ${poolTokenB}`);
      setTxCount(prev => prev + 1);
      setAmountAInput(""); setAmountBInput("");
      updateData();
      loadPoolReserves();
    } catch (err) {
      console.error(err);
      showToast("error", "Gagal tambah likuiditas: " + (err.reason || err.message || "Unknown error").slice(0, 100));
    }
    setLoading(false);
  };

  const renderChart = () => {
    if (chartData.length < 2) {
      return <div style={{ height: "120px", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: "13px" }}>Mengumpulkan data harga...</div>;
    }
    const rates = chartData.map(d => d.rate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const range = max - min || 0.0001;
    const W = 600, H = 120, pad = 8;
    const pts = chartData.map((d, i) => [
      (i / (chartData.length - 1)) * W,
      H - pad - ((d.rate - min) / range) * (H - 2 * pad)
    ]);
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = line + ` L${W} ${H} L0 ${H} Z`;
    const latestRate = rates[rates.length - 1];
    const firstRate = rates[0];
    const change = ((latestRate - firstRate) / firstRate) * 100;

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
          <div>
            <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "bold" }}>USDC/DAI RATE</span>
            <div style={{ fontSize: "22px", fontWeight: "900" }}>{latestRate.toFixed(4)}</div>
          </div>
          <span style={{ fontSize: "13px", fontWeight: "bold", color: change >= 0 ? "#10B981" : "#DC2626" }}>
            {change >= 0 ? "+" : ""}{change.toFixed(2)}%
          </span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "120px" }} preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FDC500" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FDC500" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#chartGrad)" />
          <path d={line} fill="none" stroke="#D97706" strokeWidth="2" />
        </svg>
      </div>
    );
  };

  return (
    <div style={styles.layout}>

      {toast && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 1000,
          backgroundColor: toast.type === "success" ? "#10B981" : toast.type === "error" ? "#DC2626" : "#3B82F6",
          color: "#fff", padding: "14px 20px", borderRadius: "12px", fontSize: "14px", fontWeight: "600",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)", maxWidth: "320px"
        }}>
          {toast.msg}
        </div>
      )}

      {showSlippageModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setShowSlippageModal(false)}>
          <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "360px" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: "16px" }}>Slippage Tolerance</h3>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              {[0.1, 0.5, 1.0].map(val => (
                <button key={val} onClick={() => { setSlippage(val); setCustomSlippage(""); }}
                  style={{ flex: 1, padding: "10px", borderRadius: "10px", border: slippage === val && !customSlippage ? "2px solid #FDC500" : "1px solid #E2E8F0", backgroundColor: slippage === val && !customSlippage ? "#FFFBEB" : "#fff", fontWeight: "bold", cursor: "pointer" }}>
                  {val}%
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="Custom %"
              value={customSlippage}
              onChange={(e) => { setCustomSlippage(e.target.value); if (e.target.value) setSlippage(parseFloat(e.target.value) || 0.5); }}
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #E2E8F0", marginBottom: "12px", boxSizing: "border-box" }}
            />
            {slippage > 5 && <p style={{ fontSize: "12px", color: "#DC2626", margin: "0 0 12px 0" }}>Slippage tinggi dapat menyebabkan kerugian transaksi.</p>}
            <button onClick={() => setShowSlippageModal(false)} style={styles.button}>Simpan</button>
          </div>
        </div>
      )}

      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FreesiaLogo />
          <div>
            <h1 style={{ fontSize: "20px", margin: 0, fontWeight: "900", color: "#0F172A" }}>Freesia DEX</h1>
            <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "bold" }}>
              LitVM Testnet
              {account && (
                <span style={styles.networkBadge(onCorrectNetwork)}>
                  {onCorrectNetwork ? "Network Benar" : "Network Salah"}
                </span>
              )}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: "#0F172A", textDecoration: "none", fontSize: "22px", fontWeight: "bold" }}>𝕏</a>
          <button onClick={connectWallet} disabled={connecting} style={{ backgroundColor: "#FDC500", border: "none", padding: "10px 16px", borderRadius: "10px", fontWeight: "bold", color: "#000", cursor: connecting ? "wait" : "pointer", opacity: connecting ? 0.7 : 1 }}>
            {connecting ? "Menghubungkan..." : account ? `Connected: ${shortAddr(account)}` : "Connect Wallet"}
          </button>
        </div>
      </header>

      <div style={styles.navContainer}>
        {["dashboard", "swap", "mint", "pool", "history", "import"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={styles.navTab(activeTab === tab)}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <main style={styles.mainContent}>

        {activeTab === "dashboard" && (
          <div>
            <h2 style={{ fontSize: "14px", color: "#64748B", marginTop: 0 }}>HARGA & AKTIVITAS</h2>

            <div style={styles.card}>
              {renderChart()}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "20px" }}>
              <div style={styles.card}>
                <span style={{ color: "#64748B", fontSize: "12px", fontWeight: "bold" }}>AKTIVITAS ON-CHAIN (TXNS)</span>
                <h2 style={{ margin: "8px 0 0 0", fontSize: "28px" }}>{txCount}</h2>
                <span style={{ color: "#10B981", fontSize: "12px" }}>Reputasi: {txCount * 15} XP Pts</span>
              </div>
              <div style={styles.card}>
                <span style={{ color: "#64748B", fontSize: "12px", fontWeight: "bold" }}>TOTAL LIKUIDITAS POOL</span>
                <h2 style={{ margin: "8px 0 0 0", fontSize: "22px" }}>{poolReserves.reserveA.toLocaleString()} USDC</h2>
                <span style={{ color: "#64748B", fontSize: "12px" }}>{poolReserves.reserveB.toLocaleString()} DAI</span>
              </div>
            </div>

            <div style={{ ...styles.card, padding: "0" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between" }}>
                <span>0x71C...392b</span><strong>240 XP</strong>
              </div>
              <div style={{ padding: "16px 24px", backgroundColor: "#FFFBEB", display: "flex", justifyContent: "space-between", borderBottomLeftRadius: "16px", borderBottomRightRadius: "16px" }}>
                <span>Anda ({account ? shortAddr(account) : "Anon"})</span><strong style={{ color: "#D97706" }}>{txCount * 15} XP</strong>
              </div>
            </div>
          </div>
        )}

        {activeTab === "swap" && (
          <div style={{ maxWidth: "480px", margin: "0 auto" }}>
            <div style={styles.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ margin: 0, fontSize: "16px" }}>Tukar Token</h3>
                <button onClick={() => setShowSlippageModal(true)} style={styles.iconBtn} title="Slippage Settings">
                  Slippage {slippage}%
                </button>
              </div>

              <div style={styles.inputBox}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B", fontSize: "13px" }}>
                  <span>Anda Membayar</span>
                  <span>Saldo: {balances[fromSym] || "0.00"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <input style={styles.input} type="number" placeholder="0.00" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} />
                  <select value={fromSym} onChange={(e) => setFromSym(e.target.value)} style={{ padding: "8px", borderRadius: "8px", border: "1px solid #E2E8F0", fontWeight: "bold", background: "#fff", outline: "none" }}>
                    {Object.keys(tokens).map(sym => <option key={sym} value={sym}>{sym}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ textAlign: "center", margin: "-20px 0 10px 0", zIndex: 2, position: "relative" }}>
                <button
                  onClick={() => { const t = fromSym; setFromSym(toSym); setToSym(t); }}
                  style={{ backgroundColor: "#FFF", border: "1px solid #E2E8F0", padding: "6px 12px", borderRadius: "50%", cursor: "pointer" }}
                >swap</button>
              </div>

              <div style={styles.inputBox}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B", fontSize: "13px" }}>
                  <span>Menerima (Estimasi)</span>
                  <span>Saldo: {balances[toSym] || "0.00"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <input style={styles.input} type="number" placeholder="0.00" value={amountOutPreview} readOnly />
                  <select value={toSym} onChange={(e) => setToSym(e.target.value)} style={{ padding: "8px", borderRadius: "8px", border: "1px solid #E2E8F0", fontWeight: "bold", background: "#fff", outline: "none" }}>
                    {Object.keys(tokens).map(sym => <option key={sym} value={sym}>{sym}</option>)}
                  </select>
                </div>
              </div>

              {amountIn && parseFloat(amountIn) > 0 && (
                <div style={{ fontSize: "12px", color: priceImpact > 3 ? "#DC2626" : "#64748B", marginBottom: "12px", display: "flex", justifyContent: "space-between" }}>
                  <span>Price Impact</span>
                  <span style={{ fontWeight: "bold" }}>{priceImpact > 0 ? priceImpact.toFixed(2) : "0.00"}%</span>
                </div>
              )}
              {priceImpact > 3 && (
                <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", padding: "10px 14px", fontSize: "12px", color: "#DC2626", marginBottom: "16px" }}>
                  Price impact tinggi! Transaksi ini akan mempengaruhi harga secara signifikan.
                </div>
              )}

              <button style={styles.button} onClick={handleSwap} disabled={loading || !amountIn}>
                {loading ? "Memproses..." : "Tukar Token"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "mint" && (
          <div style={{ maxWidth: "480px", margin: "0 auto" }}>
            <div style={styles.card}>
              <h3 style={{ marginTop: 0 }}>Klaim Faucet Testnet</h3>
              {Object.entries(tokens).filter(([_, data]) => !data.isNative).map(([sym, _]) => (
                <div key={sym} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", border: "1px solid #E2E8F0", borderRadius: "12px", marginBottom: "12px" }}>
                  <div><strong>{sym}</strong><div style={{ fontSize: "12px", color: "#64748B" }}>Saldo: {balances[sym] || "0.00"}</div></div>
                  <button onClick={() => handleMint(sym)} disabled={loading} style={{ backgroundColor: "#FDC500", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "bold", cursor: loading ? "wait" : "pointer" }}>Mint 10k</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "pool" && (
           <div style={{ maxWidth: "480px", margin: "0 auto" }}>
            <div style={styles.card}>
              <h3 style={{ marginTop: 0 }}>Suntik Likuiditas (Pool)</h3>
              <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "bold" }}>Token A</span>
                  <select value={poolTokenA} onChange={(e) => setPoolTokenA(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0", marginTop: "6px" }}>
                    {Object.keys(tokens).filter(t => !tokens[t].isNative).map(sym => <option key={sym} value={sym}>{sym}</option>)}
                  </select>
                  <input type="number" placeholder="Jumlah" value={amountAInput} onChange={(e) => setAmountAInput(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0", marginTop: "10px", boxSizing: "border-box" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "bold" }}>Token B</span>
                  <select value={poolTokenB} onChange={(e) => setPoolTokenB(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0", marginTop: "6px" }}>
                    {Object.keys(tokens).filter(t => !tokens[t].isNative).map(sym => <option key={sym} value={sym}>{sym}</option>)}
                  </select>
                  <input type="number" placeholder="Jumlah" value={amountBInput} onChange={(e) => setAmountBInput(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0", marginTop: "10px", boxSizing: "border-box" }} />
                </div>
              </div>
              <button style={styles.button} onClick={handleAddLiquidity} disabled={loading}>
                {loading ? "Memproses..." : "Tambah Likuiditas"}
              </button>
            </div>
           </div>
        )}

        {activeTab === "history" && (
          <div style={{ maxWidth: "560px", margin: "0 auto" }}>
            <div style={styles.card}>
              <h3 style={{ marginTop: 0 }}>Riwayat Transaksi Sesi Ini</h3>
              {txHistory.length === 0 ? (
                <p style={{ color: "#94A3B8", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>Belum ada transaksi. Mulai swap atau mint untuk melihat riwayat di sini.</p>
              ) : (
                txHistory.map(tx => (
                  <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F1F5F9" }}>
                    <div>
                      <span style={{ fontWeight: "bold", fontSize: "13px" }}>{tx.type}</span>
                      <div style={{ fontSize: "12px", color: "#64748B" }}>{tx.detail}</div>
                    </div>
                    <span style={{ fontSize: "11px", color: "#94A3B8" }}>{tx.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "import" && (
          <div style={{ maxWidth: "480px", margin: "0 auto" }}>
            <div style={styles.card}>
              <h3 style={{ marginTop: 0 }}>Import Token Kustom</h3>
              <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "20px" }}>Masukkan smart contract token ERC20 untuk menambahkannya ke dalam DEX.</p>
              <div style={styles.inputBox}>
                <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "bold" }}>Alamat Kontrak (0x...)</span>
                <input style={{ ...styles.input, fontSize: "16px" }} type="text" placeholder="0x123..." value={customAddress} onChange={(e) => setCustomAddress(e.target.value)} />
              </div>
              <div style={styles.inputBox}>
                <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "bold" }}>Simbol Token (cth: PEPE)</span>
                <input style={{ ...styles.input, fontSize: "16px" }} type="text" placeholder="PEPE" value={customSymbol} onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())} />
              </div>
              <button style={styles.button} onClick={handleAddToken}>+ Tambahkan Token</button>
            </div>
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", animation: "pulse 3s infinite ease-in-out" }}>
          <FreesiaLogo />
        </div>
        <p style={{ fontSize: "12px", fontWeight: "bold", color: "#94A3B8", letterSpacing: "1px", margin: 0 }}>
          POWERED BY FREESIA NETWORK
        </p>
        <p style={{ fontSize: "11px", color: "#CBD5E1", margin: "6px 0 0 0" }}>
          Dibangun oleh <a href="https://x.com/0xzackbh" target="_blank" rel="noreferrer" style={{ color: "#94A3B8", fontWeight: "bold" }}>@0xzackbh</a>
        </p>
      </footer>

      <style>{`
        @keyframes pulse { 
          0%, 100% { transform: scale(1); opacity: 0.85; } 
          50% { transform: scale(1.06); opacity: 1; } 
        }
      `}</style>
    </div>
  );
}