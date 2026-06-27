
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';

const CONTRACT_ADDRESSES = {
  ROUTER: '0x49C738De9b7bED753bC25E91A58dC58EA889f585',
  FACTORY: '0x...',
};

const TOKEN_LIST = {
  zkLTC: { address: '0x943a23d4ee276C2598D04C9e143b8b67b3829CFe', logo: 'zkLTC', decimals: 18, symbol: 'zkLTC', color: '#38bdf8' },
  USDC:  { address: '0x961B942b0f7e44622584Cb001DEC642b01573Acf', logo: 'USDC',  decimals: 6,  symbol: 'USDC',  color: '#4ade80' },
  DAI:   { address: '0xCa2AC72dAC6d88a21765971f4A6AA917e12553Dd', logo: 'DAI',   decimals: 18, symbol: 'DAI',   color: '#facc15' },
  MBG:   { address: '0x7B00A91DaDDA4124D5d1D4F10E6CAc338911700A', logo: 'MBG',   decimals: 18, symbol: 'MBG',   color: '#a78bfa' }
};

const ABIS = {
  ERC20: [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)",
    "function name() external view returns (string)",
    "function claim() external",
    "function lastClaimTime(address user) external view returns (uint256)",
    "function claimCooldown() external view returns (uint256)"
  ],
  ROUTER: [
    "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
    "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)"
  ]
};

const T = {
  bg: '#0b1120',
  bgGradient: 'linear-gradient(135deg, #0b1120 0%, #1e293b 50%, #0f172a 100%)',
  card: 'rgba(30, 41, 59, 0.7)',
  cardBorder: 'rgba(148, 163, 184, 0.1)',
  input: 'rgba(15, 23, 42, 0.6)',
  border: 'rgba(71, 85, 105, 0.4)',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  accent: '#38bdf8',
  accentGlow: 'rgba(56, 189, 248, 0.3)',
  green: '#4ade80',
  red: '#f87171',
  yellow: '#facc15',
  purple: '#a78bfa',
  glass: 'backdrop-filter: blur(12px)'
};

const FreesiaLogo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="petalGrad1" x1="50" y1="10" x2="50" y2="50" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#5eead4" />
        <stop offset="100%" stopColor="#0d9488" />
      </linearGradient>
      <linearGradient id="petalGrad2" x1="90" y1="30" x2="50" y2="50" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2dd4bf" />
        <stop offset="100%" stopColor="#0f766e" />
      </linearGradient>
      <linearGradient id="petalGrad3" x1="80" y1="80" x2="50" y2="50" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#14b8a6" />
        <stop offset="100%" stopColor="#115e59" />
      </linearGradient>
      <linearGradient id="petalGrad4" x1="20" y1="80" x2="50" y2="50" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0d9488" />
        <stop offset="100%" stopColor="#134e4a" />
      </linearGradient>
      <linearGradient id="petalGrad5" x1="10" y1="30" x2="50" y2="50" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2dd4bf" />
        <stop offset="100%" stopColor="#0f766e" />
      </linearGradient>
      <radialGradient id="centerGrad" cx="50" cy="50" r="10">
        <stop offset="0%" stopColor="#ccfbf1" />
        <stop offset="100%" stopColor="#5eead4" />
      </radialGradient>
    </defs>
    <path d="M50 50 C50 50 35 20 50 10 C65 20 50 50 50 50Z" fill="url(#petalGrad1)" opacity="0.95"/>
    <path d="M50 50 C50 50 80 25 90 30 C85 45 50 50 50 50Z" fill="url(#petalGrad2)" opacity="0.9"/>
    <path d="M50 50 C50 50 75 75 80 85 C65 80 50 50 50 50Z" fill="url(#petalGrad3)" opacity="0.85"/>
    <path d="M50 50 C50 50 25 75 20 85 C35 80 50 50 50 50Z" fill="url(#petalGrad4)" opacity="0.85"/>
    <path d="M50 50 C50 50 20 25 10 30 C15 45 50 50 50 50Z" fill="url(#petalGrad5)" opacity="0.9"/>
    <circle cx="50" cy="50" r="8" fill="url(#centerGrad)" />
    <circle cx="50" cy="50" r="45" stroke="rgba(94,234,212,0.15)" strokeWidth="1" fill="none"/>
  </svg>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('swap');
  const [showLanding, setShowLanding] = useState(true);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState({});
  const [pendingTx, setPendingTx] = useState(false);
  
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const [fromSym, setFromSym] = useState('zkLTC');
  const [toSym, setToSym] = useState('USDC');
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [showSlippage, setShowSlippage] = useState(false);

  const [poolTokenA, setPoolTokenA] = useState('zkLTC');
  const [poolTokenB, setPoolTokenB] = useState('USDC');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [poolInfo, setPoolInfo] = useState({ reserveA: 0, reserveB: 0, totalLP: 0 });
  const [userLP, setUserLP] = useState({});

  const [faucetCooldowns, setFaucetCooldowns] = useState({});

  const [stakeAmt, setStakeAmt] = useState('');
  const [mbgEarned, setMbgEarned] = useState(0);

  const [txHistory, setTxHistory] = useState([]);
  const [ltcPrice, setLtcPrice] = useState({ price: 85.42, change: 2.34 });

  const [showILCalc, setShowILCalc] = useState(false);
  const [ilInputs, setIlInputs] = useState({ initialPrice: 85, futurePrice: 100, depositA: 1000, depositB: 85000, feeApr: 0.3 });
  const [ilResult, setIlResult] = useState(null);

  const [showApprovalManager, setShowApprovalManager] = useState(false);
  const [tokenApprovals, setTokenApprovals] = useState([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);

  const showToast = useCallback((msg, icon = 'ℹ️', type = 'info') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, icon, type });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        showToast('MetaMask tidak terdeteksi! Install MetaMask terlebih dahulu.', '⚠️', 'error');
        return;
      }
      setIsConnecting(true);
      
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const web3Signer = await web3Provider.getSigner();
      const userAddress = await web3Signer.getAddress();
      const network = await web3Provider.getNetwork();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(userAddress);
      
      showToast(`Wallet terhubung: ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`, '✅', 'success');
      
      await loadAllBalances(userAddress, web3Provider);
      await loadFaucetCooldowns(userAddress, web3Provider);
      await loadPoolInfo(web3Provider);
      await loadTokenApprovals(userAddress, web3Provider);
      
    } catch (err) {
      console.error('Connect error:', err);
      showToast(err.message || 'Gagal menghubungkan wallet', '❌', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setBalances({});
    showToast('Wallet disconnected', '👋', 'info');
  };

  const loadAllBalances = async (userAddr, prov) => {
    if (!userAddr || !prov) return;
    const newBalances = {};
    const erc20Abi = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];
    
    for (const [sym, info] of Object.entries(TOKEN_LIST)) {
      try {
        const contract = new ethers.Contract(info.address, erc20Abi, prov);
        const bal = await contract.balanceOf(userAddr);
        const dec = await contract.decimals();
        newBalances[sym] = ethers.formatUnits(bal, dec);
      } catch (e) { newBalances[sym] = '0.00'; }
    }
    try {
      const nativeBal = await prov.getBalance(userAddr);
      newBalances['LTC'] = ethers.formatEther(nativeBal);
    } catch (e) { newBalances['LTC'] = '0.00'; }
    setBalances(newBalances);
  };

  const loadFaucetCooldowns = async (userAddr, prov) => {
    if (!userAddr || !prov) return;
    const cooldowns = {};
    for (const [sym, info] of Object.entries(TOKEN_LIST)) {
      try {
        const contract = new ethers.Contract(info.address, ABIS.ERC20, prov);
        let lastClaim = 0, coolPeriod = 0;
        try { lastClaim = await contract.lastClaimTime(userAddr); } catch(e){}
        try { coolPeriod = await contract.claimCooldown(); } catch(e){}
        const now = Math.floor(Date.now() / 1000);
        const remaining = Number(lastClaim) + Number(coolPeriod) - now;
        cooldowns[sym] = remaining > 0 ? remaining : 0;
      } catch (e) { cooldowns[sym] = 0; }
    }
    setFaucetCooldowns(cooldowns);
  };

  const claimFaucet = async (symbol) => {
    if (!signer || !account) {
      showToast('Hubungkan wallet terlebih dahulu!', '⚠️', 'error');
      return;
    }
    if (faucetCooldowns[symbol] > 0) {
      const mins = Math.ceil(faucetCooldowns[symbol] / 60);
      showToast(`Cooldown aktif. Tunggu ${mins} menit lagi.`, '⏳', 'warning');
      return;
    }
    try {
      setLoading(prev => ({ ...prev, [`faucet_${symbol}`]: true }));
      setPendingTx(true);
      
      const tokenInfo = TOKEN_LIST[symbol];
      const tokenContract = new ethers.Contract(tokenInfo.address, ABIS.ERC20, signer);
      
      showToast(`Mengklaim ${symbol}...`, '⏳', 'info');
      
      const tx = await tokenContract.claim();
      const receipt = await tx.wait();
      
      await loadAllBalances(account, provider);
      await loadFaucetCooldowns(account, provider);
      
      addToHistory('Faucet', `Claimed ${symbol} successfully`, 'success');
      showToast(`Berhasil klaim ${symbol}!`, '✅', 'success');
    } catch (err) {
      console.error('Claim error:', err);
      let msg = 'Gagal klaim faucet';
      if (err.reason) msg = err.reason;
      else if (err.data?.message) msg = err.data.message;
      else if (err.message) msg = err.message;
      showToast(msg, '❌', 'error');
      addToHistory('Faucet', `Failed to claim ${symbol}`, 'failed');
    } finally {
      setLoading(prev => ({ ...prev, [`faucet_${symbol}`]: false }));
      setPendingTx(false);
    }
  };

  const getAmountsOut = async (amount, from, to) => {
    if (!amount || !provider || parseFloat(amount) <= 0) return '0';
    try {
      const router = new ethers.Contract(CONTRACT_ADDRESSES.ROUTER, ABIS.ROUTER, provider);
      const fromInfo = TOKEN_LIST[from];
      const toInfo = TOKEN_LIST[to];
      const amountInWei = ethers.parseUnits(amount, fromInfo.decimals);
      const path = [fromInfo.address, toInfo.address];
      const amounts = await router.getAmountsOut(amountInWei, path);
      return ethers.formatUnits(amounts[1], toInfo.decimals);
    } catch (e) { return '0'; }
  };

  const handleAmountInChange = async (val) => {
    setAmountIn(val);
    if (val && parseFloat(val) > 0) {
      const out = await getAmountsOut(val, fromSym, toSym);
      setAmountOut(out);
    } else { setAmountOut(''); }
  };

  const executeSwap = async () => {
    if (!signer || !account) { showToast('Hubungkan wallet terlebih dahulu!', '⚠️', 'error'); return; }
    if (!amountIn || parseFloat(amountIn) <= 0) { showToast('Masukkan jumlah yang valid!', '⚠️', 'error'); return; }
    if (parseFloat(balances[fromSym] || 0) < parseFloat(amountIn)) { showToast('Saldo tidak cukup!', '⚠️', 'error'); return; }

    try {
      setLoading(prev => ({ ...prev, swap: true }));
      setPendingTx(true);
      
      const router = new ethers.Contract(CONTRACT_ADDRESSES.ROUTER, ABIS.ROUTER, signer);
      const fromInfo = TOKEN_LIST[fromSym];
      const toInfo = TOKEN_LIST[toSym];
      
      const amountInWei = ethers.parseUnits(amountIn, fromInfo.decimals);
      const amountOutWei = ethers.parseUnits(amountOut, toInfo.decimals);
      const slippageFactor = 1000 - Math.floor(slippage * 10);
      const amountOutMin = (amountOutWei * BigInt(slippageFactor)) / BigInt(1000);
      
      const tokenContract = new ethers.Contract(fromInfo.address, ABIS.ERC20, signer);
      const allowance = await tokenContract.allowance(account, CONTRACT_ADDRESSES.ROUTER);
      
      if (allowance < amountInWei) {
        showToast('Menyetujui token...', '⏳', 'info');
        const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.ROUTER, ethers.MaxUint256);
        await approveTx.wait();
      }
      
      showToast('Menjalankan swap...', '⏳', 'info');
      const deadline = Math.floor(Date.now() / 1000) + 300;
      
      const tx = await router.swapExactTokensForTokens(amountInWei, amountOutMin, [fromInfo.address, toInfo.address], account, deadline);
      await tx.wait();
      
      await loadAllBalances(account, provider);
      addToHistory('Swap', `${amountIn} ${fromSym} → ${amountOut} ${toSym}`, 'success');
      showToast('Swap berhasil!', '✅', 'success');
      setAmountIn(''); setAmountOut('');
    } catch (err) {
      showToast(err.reason || 'Swap gagal', '❌', 'error');
      addToHistory('Swap', `Failed ${amountIn} ${fromSym} → ${toSym}`, 'failed');
    } finally {
      setLoading(prev => ({ ...prev, swap: false }));
      setPendingTx(false);
    }
  };

  const loadPoolInfo = async (prov) => {
    if (!prov) return;
    setPoolInfo({ reserveA: 50000, reserveB: 4250000, totalLP: 150000 });
  };

  const calculatePairAmount = async (val, token) => {
    if (!val || parseFloat(val) <= 0) {
      if (token === 'A') setAmountB(''); else setAmountA('');
      return;
    }
    const rate = 85;
    if (token === 'A') setAmountB((parseFloat(val) * rate).toFixed(6));
    else setAmountA((parseFloat(val) / rate).toFixed(6));
  };

  const addLiquidity = async () => {
    if (!signer || !account) { showToast('Hubungkan wallet terlebih dahulu!', '⚠️', 'error'); return; }
    if (!amountA || !amountB || parseFloat(amountA) <= 0 || parseFloat(amountB) <= 0) {
      showToast('Masukkan jumlah kedua token!', '⚠️', 'error'); return;
    }
    if (parseFloat(balances[poolTokenA] || 0) < parseFloat(amountA)) {
      showToast(`Saldo ${poolTokenA} tidak cukup!`, '⚠️', 'error'); return;
    }
    if (parseFloat(balances[poolTokenB] || 0) < parseFloat(amountB)) {
      showToast(`Saldo ${poolTokenB} tidak cukup!`, '⚠️', 'error'); return;
    }

    try {
      setLoading(prev => ({ ...prev, addLiquidity: true }));
      setPendingTx(true);
      
      const router = new ethers.Contract(CONTRACT_ADDRESSES.ROUTER, ABIS.ROUTER, signer);
      const tokenA = TOKEN_LIST[poolTokenA];
      const tokenB = TOKEN_LIST[poolTokenB];
      
      const amountAWei = ethers.parseUnits(amountA, tokenA.decimals);
      const amountBWei = ethers.parseUnits(amountB, tokenB.decimals);
      const slippageFactor = 1000 - Math.floor(slippage * 10);
      
      const amountAMin = (amountAWei * BigInt(slippageFactor)) / BigInt(1000);
      const amountBMin = (amountBWei * BigInt(slippageFactor)) / BigInt(1000);
      
      for (const [sym, amt, info] of [[poolTokenA, amountAWei, tokenA], [poolTokenB, amountBWei, tokenB]]) {
        const tokenContract = new ethers.Contract(info.address, ABIS.ERC20, signer);
        const allowance = await tokenContract.allowance(account, CONTRACT_ADDRESSES.ROUTER);
        if (allowance < amt) {
          showToast(`Menyetujui ${sym}...`, '⏳', 'info');
          const tx = await tokenContract.approve(CONTRACT_ADDRESSES.ROUTER, ethers.MaxUint256);
          await tx.wait();
        }
      }
      
      showToast('Menambahkan likuiditas...', '⏳', 'info');
      const deadline = Math.floor(Date.now() / 1000) + 300;
      
      const tx = await router.addLiquidity(
        tokenA.address, tokenB.address,
        amountAWei, amountBWei,
        amountAMin, amountBMin,
        account, deadline
      );
      await tx.wait();
      
      await loadAllBalances(account, provider);
      await loadPoolInfo(provider);
      addToHistory('Liquidity', `Added ${amountA} ${poolTokenA} + ${amountB} ${poolTokenB}`, 'success');
      showToast('Likuiditas berhasil ditambahkan!', '✅', 'success');
      setAmountA(''); setAmountB('');
    } catch (err) {
      showToast(err.reason || 'Gagal menambahkan likuiditas', '❌', 'error');
      addToHistory('Liquidity', `Failed to add ${poolTokenA}/${poolTokenB}`, 'failed');
    } finally {
      setLoading(prev => ({ ...prev, addLiquidity: false }));
      setPendingTx(false);
    }
  };

  const calculateIL = useCallback(() => {
    const { initialPrice, futurePrice, depositA, depositB, feeApr } = ilInputs;
    const P0 = parseFloat(initialPrice), P1 = parseFloat(futurePrice);
    const ratio = P1 / P0;
    const ilPercent = (2 * Math.sqrt(ratio) / (1 + ratio) - 1) * 100;
    const ilAbsolute = ((parseFloat(depositA) + parseFloat(depositB)) * (ilPercent / 100));
    const hodlValue = parseFloat(depositA) * P1 + parseFloat(depositB);
    const totalDeposit = parseFloat(depositA) + parseFloat(depositB);
    const lpValue = totalDeposit * (2 * Math.sqrt(ratio) / (1 + ratio));
    const days = 30;
    const feeEarnings = totalDeposit * (feeApr / 100) * (days / 365);
    const netIl = ilAbsolute + feeEarnings;
    const netIlPercent = (netIl / totalDeposit) * 100;
    
    setIlResult({
      ilPercent: ilPercent.toFixed(4), ilAbsolute: Math.abs(ilAbsolute).toFixed(2),
      hodlValue: hodlValue.toFixed(2), lpValue: lpValue.toFixed(2),
      feeEarnings: feeEarnings.toFixed(2), netIlPercent: netIlPercent.toFixed(4),
      isProfit: netIl > 0, ratio: ratio.toFixed(4)
    });
  }, [ilInputs]);

  const loadTokenApprovals = async (userAddr, prov) => {
    if (!userAddr || !prov) return;
    setLoadingApprovals(true);
    const approvals = [];
    const erc20Abi = ["function allowance(address owner, address spender) view returns (uint256)", "function symbol() view returns (string)", "function decimals() view returns (uint8)"];
    const spenders = [{ address: CONTRACT_ADDRESSES.ROUTER, name: 'Router' }];
    
    for (const [sym, info] of Object.entries(TOKEN_LIST)) {
      for (const spender of spenders) {
        try {
          const contract = new ethers.Contract(info.address, erc20Abi, prov);
          const allowance = await contract.allowance(userAddr, spender.address);
          if (allowance > 0) {
            const decimals = await contract.decimals();
            const formatted = ethers.formatUnits(allowance, decimals);
            const isUnlimited = allowance >= ethers.MaxUint256 / BigInt(2);
            approvals.push({ id: `${sym}-${spender.name}`, token: sym, tokenAddress: info.address, tokenLogo: info.logo, spender: spender.name, spenderAddress: spender.address, allowance: formatted, isUnlimited, rawAllowance: allowance });
          }
        } catch (e) {}
      }
    }
    setTokenApprovals(approvals);
    setLoadingApprovals(false);
  };

  const revokeApproval = async (approval) => {
    if (!signer) { showToast('Hubungkan wallet terlebih dahulu!', '⚠️', 'error'); return; }
    try {
      setLoading(prev => ({ ...prev, [`revoke_${approval.id}`]: true }));
      setPendingTx(true);
      const tokenContract = new ethers.Contract(approval.tokenAddress, ABIS.ERC20, signer);
      showToast(`Mencabut approval ${approval.token}...`, '⏳', 'info');
      const tx = await tokenContract.approve(approval.spenderAddress, 0);
      await tx.wait();
      await loadTokenApprovals(account, provider);
      addToHistory('Revoke', `Revoked ${approval.token} approval`, 'success');
      showToast(`Berhasil mencabut approval!`, '✅', 'success');
    } catch (err) {
      showToast(err.reason || 'Gagal mencabut approval', '❌', 'error');
    } finally {
      setLoading(prev => ({ ...prev, [`revoke_${approval.id}`]: false }));
      setPendingTx(false);
    }
  };

  const revokeAllApprovals = async () => {
    if (!signer || tokenApprovals.length === 0) return;
    if (!window.confirm(`Cabut SEMUA approval (${tokenApprovals.length})?`)) return;
    try {
      setLoading(prev => ({ ...prev, revokeAll: true }));
      for (const approval of tokenApprovals) {
        const tokenContract = new ethers.Contract(approval.tokenAddress, ABIS.ERC20, signer);
        const tx = await tokenContract.approve(approval.spenderAddress, 0);
        await tx.wait();
      }
      await loadTokenApprovals(account, provider);
      showToast('Semua approval dicabut!', '✅', 'success');
    } catch (err) { showToast('Gagal mencabut beberapa approval', '❌', 'error'); }
    finally { setLoading(prev => ({ ...prev, revokeAll: false })); }
  };

  const stakeMBG = async () => {
    if (!signer || !account) { showToast('Hubungkan wallet!', '⚠️', 'error'); return; }
    showToast('Fitur staking dalam pengembangan', '🔧', 'info');
  };
  const harvestMBG = async () => {
    if (!signer) return;
    showToast('Harvest dalam pengembangan', '🔧', 'info');
  };

  const addToHistory = (type, detail, status) => {
    const newTx = { type, detail, status, time: new Date().toLocaleString('id-ID'), hash: Math.random().toString(36).substring(7) };
    setTxHistory(prev => [newTx, ...prev].slice(0, 50));
    localStorage.setItem('freesia_history', JSON.stringify([newTx, ...txHistory].slice(0, 50)));
  };

  useEffect(() => {
    const saved = localStorage.getItem('freesia_history');
    if (saved) setTxHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (!account || !provider) return;
    const interval = setInterval(() => {
      loadAllBalances(account, provider);
      loadFaucetCooldowns(account, provider);
    }, 15000);
    return () => clearInterval(interval);
  }, [account, provider]);

  const GlassCard = ({ children, style = {} }) => (
    <div style={{
      background: 'rgba(30, 41, 59, 0.6)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRadius: 20,
      border: '1px solid rgba(148, 163, 184, 0.1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      ...style
    }}>{children}</div>
  );

  const GradientButton = ({ onClick, disabled, children, variant = 'primary', style = {} }) => {
    const variants = {
      primary: { background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)', color: '#fff' },
      secondary: { background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)', color: '#fff' },
      danger: { background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)', color: '#fff' },
      outline: { background: 'transparent', color: T.text, border: `1px solid ${T.border}` }
    };
    const v = variants[variant] || variants.primary;
    return (
      <button onClick={onClick} disabled={disabled} style={{
        padding: '14px 24px', borderRadius: 14, border: 'none',
        fontWeight: 700, fontSize: 16, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, transition: 'all 0.2s', width: '100%',
        boxShadow: variant === 'primary' ? '0 4px 20px rgba(13, 148, 136, 0.3)' : 'none',
        ...v, ...style
      }}>{children}</button>
    );
  };

  const ModalOverlay = ({ children, onClose }) => (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      animation: 'fadeIn 0.3s ease'
    }} onClick={onClose}>
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)', borderRadius: 24,
        border: '1px solid rgba(148, 163, 184, 0.15)',
        maxWidth: 560, width: '100%', maxHeight: '90vh', overflow: 'auto',
        padding: 32, boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        animation: 'slideUp 0.3s ease'
      }} onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );

  const ILCalculatorModal = () => {
    if (!showILCalc) return null;
    return (
      <ModalOverlay onClose={() => setShowILCalc(false)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, fontSize: 22 }}>
            <FreesiaLogo size={32} /> Impermanent Loss Simulator
          </h2>
          <button onClick={() => setShowILCalc(false)} style={{ background: 'transparent', border: 'none', color: T.text, fontSize: 24, cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ opacity: 0.7, fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
          Simulasikan risiko impermanent loss sebelum menambahkan likuiditas. Masukkan harga awal dan perkiraan harga masa depan.
        </p>
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Harga Awal (Token A/B)', key: 'initialPrice' },
              { label: 'Harga Masa Depan', key: 'futurePrice' }
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 12, opacity: 0.7, display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input type="number" value={ilInputs[f.key]} onChange={e => setIlInputs(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: 12, background: T.input, border: `1px solid ${T.border}`, borderRadius: 12, color: T.text, fontWeight: 700, boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Deposit Token A', key: 'depositA' },
              { label: 'Deposit Token B', key: 'depositB' }
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 12, opacity: 0.7, display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input type="number" value={ilInputs[f.key]} onChange={e => setIlInputs(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: 12, background: T.input, border: `1px solid ${T.border}`, borderRadius: 12, color: T.text, fontWeight: 700, boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          <div>
            <label style={{ fontSize: 12, opacity: 0.7, display: 'block', marginBottom: 6 }}>Fee APR Pool (%)</label>
            <input type="number" step="0.1" value={ilInputs.feeApr} onChange={e => setIlInputs(p => ({ ...p, feeApr: e.target.value }))}
              style={{ width: '100%', padding: 12, background: T.input, border: `1px solid ${T.border}`, borderRadius: 12, color: T.text, fontWeight: 700, boxSizing: 'border-box' }} />
          </div>
          <GradientButton onClick={calculateIL} variant="secondary">🧮 Hitung Impermanent Loss</GradientButton>

          {ilResult && (
            <div style={{ marginTop: 8, padding: 20, background: 'rgba(15, 23, 42, 0.8)', borderRadius: 16, border: `2px solid ${ilResult.isProfit ? T.green : T.red}` }}>
              <h4 style={{ margin: '0 0 16px 0', textAlign: 'center' }}>📊 Hasil Simulasi</h4>
              {[
                { l: 'Perubahan Harga', v: `${ilResult.ratio}x` },
                { l: 'Value Jika HODL', v: `$${ilResult.hodlValue}` },
                { l: 'Value Sebagai LP', v: `$${ilResult.lpValue}` },
                { l: 'Impermanent Loss', v: `${ilResult.ilPercent}%`, c: T.red },
                { l: 'Estimasi Fee (30 hari)', v: `+$${ilResult.feeEarnings}`, c: T.green }
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 4 ? `1px solid ${T.border}` : 'none' }}>
                  <span style={{ opacity: 0.7 }}>{r.l}</span>
                  <span style={{ fontWeight: 700, color: r.c || T.text }}>{r.v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', marginTop: 8, background: ilResult.isProfit ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', borderRadius: 10 }}>
                <span style={{ fontWeight: 700 }}>Net P&L (dengan fee)</span>
                <span style={{ fontWeight: 800, color: ilResult.isProfit ? T.green : T.red, fontSize: 18 }}>{ilResult.isProfit ? '+' : ''}{ilResult.netIlPercent}%</span>
              </div>
            </div>
          )}
        </div>
      </ModalOverlay>
    );
  };

  const ApprovalManagerModal = () => {
    if (!showApprovalManager) return null;
    return (
      <ModalOverlay onClose={() => setShowApprovalManager(false)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, fontSize: 22 }}>
            <FreesiaLogo size={32} /> Token Approval Manager
          </h2>
          <button onClick={() => setShowApprovalManager(false)} style={{ background: 'transparent', border: 'none', color: T.text, fontSize: 24, cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ opacity: 0.7, fontSize: 14, marginBottom: 20 }}>Kelola approval token untuk keamanan wallet Anda.</p>
        <div style={{ background: 'rgba(248,113,113,0.1)', border: `1px solid ${T.red}`, borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 13 }}>
          <strong style={{ color: T.red }}>⚠️ Peringatan:</strong> Unlimited approval memungkinkan kontrak mengakses SELURUH saldo token Anda.
        </div>
        {tokenApprovals.length > 0 && (
          <GradientButton onClick={revokeAllApprovals} disabled={loading.revokeAll} variant="danger" style={{ marginBottom: 16 }}>
            {loading.revokeAll ? '⏳ Memproses...' : `🚫 Cabut Semua Approval (${tokenApprovals.length})`}
          </GradientButton>
        )}
        {loadingApprovals ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div style={{ fontSize: 32, animation: 'spin 1s linear infinite' }}>⏳</div><p>Memuat...</p></div>
        ) : tokenApprovals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, opacity: 0.6 }}><div style={{ fontSize: 48 }}>🔒</div><p>Wallet Anda aman!</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tokenApprovals.map(a => (
              <div key={a.id} style={{ background: T.input, padding: 14, borderRadius: 12, border: `1px solid ${a.isUnlimited ? T.red : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {a.token} {a.isUnlimited && <span style={{ background: 'rgba(248,113,113,0.2)', color: T.red, padding: '2px 8px', borderRadius: 6, fontSize: 11, marginLeft: 6 }}>⚠️ UNLIMITED</span>}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>For: {a.spender} | {a.isUnlimited ? 'Unlimited' : parseFloat(a.allowance).toFixed(4)}</div>
                </div>
                <button onClick={() => revokeApproval(a)} disabled={loading[`revoke_${a.id}`]}
                  style={{ padding: '8px 16px', background: T.red, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 13, opacity: loading[`revoke_${a.id}`] ? 0.7 : 1 }}>
                  {loading[`revoke_${a.id}`] ? '⏳' : '🚫 Revoke'}
                </button>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => loadTokenApprovals(account, provider)} style={{ width: '100%', marginTop: 16, padding: 12, background: 'transparent', border: `1px solid ${T.border}`, color: T.text, borderRadius: 12, fontWeight: 600, cursor: 'pointer' }}>🔄 Refresh</button>
      </ModalOverlay>
    );
  };

  return (
    <div style={{ background: T.bgGradient, minHeight: '100vh', color: T.text, fontFamily: 'system-ui, -apple-system, sans-serif', overflowX: 'hidden' }}>
      <ILCalculatorModal />
      <ApprovalManagerModal />
      
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'error' ? T.red : toast.type === 'success' ? T.green : T.yellow,
          color: '#000', padding: '16px 24px', borderRadius: 14,
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 10, animation: 'slideIn 0.3s ease',
          maxWidth: 400, wordBreak: 'break-word'
        }}>
          <span style={{ fontSize: 20 }}>{toast.icon}</span> {toast.msg}
        </div>
      )}

      {pendingTx && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'
        }}>
          <div style={{ width: 60, height: 60, border: '4px solid rgba(56,189,248,0.2)', borderTop: '4px solid #38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 20, fontWeight: 600, fontSize: 18 }}>Transaksi sedang diproses...</p>
          <p style={{ fontSize: 14, opacity: 0.6, marginTop: 8 }}>Mohon tunggu, jangan tutup browser</p>
        </div>
      )}

      {showLanding ? (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
          <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 80, flexWrap: 'wrap', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FreesiaLogo size={48} />
              <span style={{ fontWeight: 800, fontSize: 28, letterSpacing: '-0.5px' }}>Freesia DEX</span>
            </div>
            <button onClick={() => setShowLanding(false)} style={{
              background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)', color: '#fff',
              padding: '12px 28px', borderRadius: 24, border: 'none', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(13, 148, 136, 0.3)'
            }}>Launch App 🚀</button>
          </nav>

          <div style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto 80px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(56,189,248,0.1)', color: T.accent, padding: '8px 18px', borderRadius: 20, fontSize: 14, fontWeight: 600, marginBottom: 28, border: '1px solid rgba(56,189,248,0.2)' }}>
              <span style={{ width: 8, height: 8, background: '#4ade80', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} /> ⚡ Live on LitVM Testnet
            </div>
            <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', margin: '0 0 24px', lineHeight: 1.1, fontWeight: 800 }}>
              The First DEX on <span style={{ background: 'linear-gradient(135deg, #5eead4 0%, #0d9488 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LitVM Network</span>
            </h1>
            <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', opacity: 0.7, lineHeight: 1.7, marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
              Swap, pool, and stake with the only DEX featuring an integrated <strong>Impermanent Loss Risk Simulator</strong> and <strong>AI-powered insights</strong>.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setShowLanding(false)} style={{
                background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)', color: '#fff',
                padding: '18px 40px', borderRadius: 16, border: 'none', fontSize: 18, fontWeight: 800,
                cursor: 'pointer', boxShadow: '0 8px 30px rgba(13, 148, 136, 0.4)'
              }}>🚀 Launch App</button>
              <button onClick={() => { setShowLanding(false); setActiveTab('pool'); }} style={{
                background: 'transparent', color: T.text, padding: '18px 40px',
                borderRadius: 16, border: `1px solid ${T.border}`, fontSize: 18, fontWeight: 700, cursor: 'pointer'
              }}>🛡️ IL Simulator</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 80 }}>
            {[
              { label: "Total Value Locked", value: "$1.245.000", icon: "💎" },
              { label: "Total Volume", value: "$8.900.000", icon: "📈" },
              { label: "Active Users", value: "4.200", icon: "👥" },
              { label: "Transactions", value: "156.000", icon: "⚡" },
            ].map((s, i) => (
              <GlassCard key={i} style={{ padding: 28, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{s.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 28, marginBottom: 6, background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
                <div style={{ fontSize: 14, opacity: 0.6 }}>{s.label}</div>
              </GlassCard>
            ))}
          </div>

          <h2 style={{ textAlign: 'center', marginBottom: 40, fontSize: 32 }}>Key Features</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 80 }}>
            {[
              { icon: "⚡", title: "Lightning Swaps", desc: "Execute trades in under 2 seconds with zk-rollup settlement.", stat: "20+", statLabel: "Assets", color: "#5eead4" },
              { icon: "🛡️", title: "IL Simulator", desc: "Preview impermanent loss risk before adding liquidity.", stat: "5M+", statLabel: "Liquidity", color: "#38bdf8" },
              { icon: "🤖", title: "AI Integration", desc: "Leverage AI agents for market analysis and insights.", stat: "Smart", statLabel: "Assistant", color: "#a78bfa" },
            ].map((f, i) => (
              <GlassCard key={i} style={{ padding: 36 }}>
                <div style={{ fontSize: 44, marginBottom: 20 }}>{f.icon}</div>
                <h3 style={{ margin: '0 0 12px', fontSize: 22 }}>{f.title}</h3>
                <p style={{ opacity: 0.6, lineHeight: 1.6, marginBottom: 24, fontSize: 15 }}>{f.desc}</p>
                <div style={{ background: 'rgba(255,255,255,0.05)', color: f.color, padding: '10px 18px', borderRadius: 10, display: 'inline-block', fontWeight: 700, border: `1px solid ${f.color}30` }}>
                  {f.stat} <span style={{ opacity: 0.6, fontSize: 12, fontWeight: 500 }}>{f.statLabel}</span>
                </div>
              </GlassCard>
            ))}
          </div>

          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 24, border: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <h2 style={{ marginBottom: 16 }}>Ready to Start Trading?</h2>
            <p style={{ opacity: 0.6, marginBottom: 28 }}>Join thousands of users trading on Freesia DEX.</p>
            <button onClick={() => setShowLanding(false)} style={{
              background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)', color: '#fff',
              padding: '16px 36px', borderRadius: 16, border: 'none', fontSize: 18, fontWeight: 800, cursor: 'pointer'
            }}>Launch App Now 🚀</button>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px' }}>
          
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setShowLanding(true)}>
              <FreesiaLogo size={36} />
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Freesia DEX</h1>
            </div>
            
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {account && (
                <>
                  <button onClick={() => setShowILCalc(true)} style={{
                    background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)',
                    color: T.accent, padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                  }}>🛡️ IL Calc</button>
                  <button onClick={() => { setShowApprovalManager(true); loadTokenApprovals(account, provider); }} style={{
                    background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
                    color: T.red, padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                  }}>🔐 Approvals</button>
                </>
              )}
              <span style={{ fontSize: 12, opacity: 0.5, background: T.input, padding: '6px 12px', borderRadius: 12 }}>⛽ 9 sat/byte</span>
              {account ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ background: 'rgba(30,41,59,0.8)', padding: '8px 16px', borderRadius: 20, border: `1px solid ${T.border}`, fontSize: 14, fontWeight: 600 }}>
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </div>
                  <button onClick={disconnectWallet} style={{ background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: 18 }} title="Disconnect">🔌</button>
                </div>
              ) : (
                <button onClick={connectWallet} disabled={isConnecting} style={{
                  background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)', color: '#fff',
                  padding: '10px 22px', borderRadius: 20, border: 'none', fontWeight: 700,
                  cursor: isConnecting ? 'wait' : 'pointer', opacity: isConnecting ? 0.7 : 1
                }}>{isConnecting ? 'Connecting...' : '🔗 Connect'}</button>
              )}
            </div>
          </header>

          <nav style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 24, padding: '5px', background: 'rgba(30,41,59,0.5)', borderRadius: 16, border: `1px solid ${T.border}`, backdropFilter: 'blur(10px)' }}>
            {[
              { id: 'swap', label: 'Swap', icon: '🔄' },
              { id: 'faucet', label: 'Faucet', icon: '🚰' },
              { id: 'pool', label: 'Pool', icon: '🏊' },
              { id: 'staking', label: 'Staking', icon: '💎' },
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'history', label: 'History', icon: '📋' }
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                flex: 1, padding: '12px 16px', borderRadius: 12, border: 'none',
                background: activeTab === t.id ? 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)' : 'transparent',
                color: activeTab === t.id ? '#fff' : T.textMuted,
                fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                boxShadow: activeTab === t.id ? '0 4px 15px rgba(13,148,136,0.3)' : 'none'
              }}>{t.icon} {t.label}</button>
            ))}
          </nav>

          {activeTab === 'swap' && (
            <GlassCard style={{ padding: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>🔄 Swap Token</h3>
                <button onClick={() => setShowSlippage(!showSlippage)} style={{ background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: 20 }}>⚙️</button>
              </div>
              {showSlippage && (
                <div style={{ background: T.input, padding: 16, borderRadius: 12, marginBottom: 16 }}>
                  <label style={{ fontSize: 13, opacity: 0.7, display: 'block', marginBottom: 8 }}>Slippage Tolerance</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[0.1, 0.5, 1.0, 2.0].map(v => (
                      <button key={v} onClick={() => setSlippage(v)} style={{
                        flex: 1, padding: 10, borderRadius: 10,
                        border: `1px solid ${slippage === v ? '#0d9488' : T.border}`,
                        background: slippage === v ? 'rgba(13,148,136,0.2)' : 'transparent',
                        color: slippage === v ? '#5eead4' : T.text, fontWeight: 700, cursor: 'pointer'
                      }}>{v}%</button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ background: T.input, padding: 18, borderRadius: 16, marginBottom: 12, border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13, opacity: 0.6 }}>
                  <span>Anda Membayar</span>
                  <span>Saldo: {parseFloat(balances[fromSym] || 0).toFixed(4)} {fromSym}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input type="number" value={amountIn} onChange={e => handleAmountInChange(e.target.value)} placeholder="0.0"
                    style={{ flex: 1, background: 'transparent', border: 'none', color: T.text, fontSize: 32, outline: 'none', fontWeight: 700 }} />
                  <select value={fromSym} onChange={e => { setFromSym(e.target.value); setAmountIn(''); setAmountOut(''); }}
                    style={{ background: 'rgba(30,41,59,0.8)', border: `1px solid ${T.border}`, color: T.text, padding: '10px 14px', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>
                    {Object.keys(TOKEN_LIST).map(sym => <option key={sym} value={sym}>{sym}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ textAlign: 'center', margin: '-8px 0', position: 'relative', zIndex: 2 }}>
                <button onClick={() => { setFromSym(toSym); setToSym(fromSym); setAmountIn(amountOut); setAmountOut(amountIn); }}
                  style={{ background: 'rgba(30,41,59,0.9)', border: `2px solid ${T.border}`, borderRadius: '50%', width: 44, height: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>⬇️</button>
              </div>
              <div style={{ background: T.input, padding: 18, borderRadius: 16, marginTop: 12, border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13, opacity: 0.6 }}>
                  <span>Menerima (Estimasi)</span>
                  <span>Saldo: {parseFloat(balances[toSym] || 0).toFixed(4)} {toSym}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input type="text" value={amountOut ? parseFloat(amountOut).toFixed(6) : ''} readOnly placeholder="0.0"
                    style={{ flex: 1, background: 'transparent', border: 'none', color: T.text, fontSize: 32, outline: 'none', fontWeight: 700 }} />
                  <select value={toSym} onChange={e => { setToSym(e.target.value); handleAmountInChange(amountIn); }}
                    style={{ background: 'rgba(30,41,59,0.8)', border: `1px solid ${T.border}`, color: T.text, padding: '10px 14px', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>
                    {Object.keys(TOKEN_LIST).filter(s => s !== fromSym).map(sym => <option key={sym} value={sym}>{sym}</option>)}
                  </select>
                </div>
              </div>
              <GradientButton onClick={executeSwap} disabled={!account || loading.swap || !amountIn || parseFloat(amountIn) <= 0} variant="primary" style={{ marginTop: 24 }}>
                {!account ? 'Hubungkan Wallet' : loading.swap ? '⏳ Memproses...' : '🔥 Swap Sekarang'}
              </GradientButton>
            </GlassCard>
          )}

          {activeTab === 'faucet' && (
            <GlassCard style={{ padding: 28 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <FreesiaLogo size={28} /> Wallet Faucet Hub
              </h3>
              <p style={{ opacity: 0.6, marginBottom: 24, fontSize: 14 }}>Claim free test tokens untuk LitVM Testnet</p>
              <div style={{ display: 'grid', gap: 12 }}>
                {Object.entries(TOKEN_LIST).map(([sym, info]) => {
                  const isCooldown = faucetCooldowns[sym] > 0;
                  const isLoading = loading[`faucet_${sym}`];
                  return (
                    <div key={sym} style={{ background: T.input, padding: 18, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1px solid ${T.border}`, transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${info.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: info.color, fontSize: 13 }}>{sym.slice(0,2)}</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 17 }}>{sym}</div>
                          <div style={{ fontSize: 13, opacity: 0.5, marginTop: 2 }}>Saldo: {parseFloat(balances[sym] || 0).toFixed(4)}</div>
                        </div>
                      </div>
                      <button onClick={() => claimFaucet(sym)} disabled={!account || isLoading || isCooldown}
                        style={{
                          padding: '10px 24px', borderRadius: 12, border: 'none',
                          background: isCooldown ? T.border : isLoading ? T.yellow : 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
                          color: '#000', fontWeight: 700, cursor: !account || isLoading || isCooldown ? 'not-allowed' : 'pointer',
                          opacity: !account || isCooldown ? 0.5 : 1, minWidth: 120, boxShadow: !isCooldown && !isLoading ? '0 4px 15px rgba(13,148,136,0.3)' : 'none'
                        }}>
                        {isLoading ? '⏳' : isCooldown ? `⏳ ${Math.ceil(faucetCooldowns[sym] / 60)}m` : '💧 Claim'}
                      </button>
                    </div>
                  );
                })}
              </div>
              {!account && <div style={{ textAlign: 'center', marginTop: 24, padding: 24, opacity: 0.5, background: 'rgba(15,23,42,0.4)', borderRadius: 12 }}>Hubungkan wallet untuk mengklaim token testnet</div>}
            </GlassCard>
          )}

          {activeTab === 'pool' && (
            <GlassCard style={{ padding: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <h3 style={{ margin: 0, fontSize: 20, display: 'flex', alignItems: 'center', gap: 10 }}>🏊 Liquidity Pools</h3>
                <button onClick={() => setShowILCalc(true)} style={{
                  background: 'rgba(167,139,250,0.1)', color: T.purple, border: `1px solid ${T.purple}40`,
                  padding: '8px 16px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: 13
                }}>🛡️ IL Risk Simulator</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'Pool TVL', value: `$${poolInfo.reserveA > 0 ? (parseFloat(poolInfo.reserveA) + parseFloat(poolInfo.reserveB)).toFixed(2) : "—"}`, color: T.accent },
                  { label: 'Total LP', value: poolInfo.totalLP || "—" }
                ].map((s, i) => (
                  <div key={i} style={{ background: T.input, padding: 18, borderRadius: 14, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontWeight: 800, fontSize: 24, color: s.color || T.text }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8 }}>
                <h4 style={{ marginBottom: 18, fontSize: 16, opacity: 0.8 }}>➕ Tambah Likuiditas</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, opacity: 0.5, display: 'block', marginBottom: 6 }}>Token A</label>
                    <select value={poolTokenA} onChange={e => setPoolTokenA(e.target.value)}
                      style={{ width: '100%', padding: 12, background: T.input, border: `1px solid ${T.border}`, borderRadius: 12, color: T.text, fontWeight: 700 }}>
                      {Object.keys(TOKEN_LIST).map(sym => <option key={sym} value={sym}>{sym}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, opacity: 0.5, display: 'block', marginBottom: 6 }}>Token B</label>
                    <select value={poolTokenB} onChange={e => setPoolTokenB(e.target.value)}
                      style={{ width: '100%', padding: 12, background: T.input, border: `1px solid ${T.border}`, borderRadius: 12, color: T.text, fontWeight: 700 }}>
                      {Object.keys(TOKEN_LIST).filter(s => s !== poolTokenA).map(sym => <option key={sym} value={sym}>{sym}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.5, marginBottom: 6 }}>
                    <span>Jumlah {poolTokenA}</span><span>Saldo: {parseFloat(balances[poolTokenA] || 0).toFixed(4)}</span>
                  </div>
                  <input type="number" value={amountA} onChange={e => { setAmountA(e.target.value); calculatePairAmount(e.target.value, 'A'); }} placeholder="0.0"
                    style={{ width: '100%', padding: 14, background: T.input, border: `1px solid ${T.border}`, borderRadius: 12, color: T.text, fontWeight: 700, fontSize: 16, boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.5, marginBottom: 6 }}>
                    <span>Jumlah {poolTokenB}</span><span>Saldo: {parseFloat(balances[poolTokenB] || 0).toFixed(4)}</span>
                  </div>
                  <input type="number" value={amountB} onChange={e => { setAmountB(e.target.value); calculatePairAmount(e.target.value, 'B'); }} placeholder="0.0"
                    style={{ width: '100%', padding: 14, background: T.input, border: `1px solid ${T.border}`, borderRadius: 12, color: T.text, fontWeight: 700, fontSize: 16, boxSizing: 'border-box' }} />
                </div>
                <GradientButton onClick={addLiquidity} disabled={!account || loading.addLiquidity || !amountA || !amountB} variant="primary">
                  {!account ? 'Hubungkan Wallet' : loading.addLiquidity ? '⏳ Memproses...' : '💧 Tambah Likuiditas'}
                </GradientButton>
                <div style={{ marginTop: 16, padding: 14, background: 'rgba(56,189,248,0.05)', borderRadius: 12, fontSize: 13, border: '1px solid rgba(56,189,248,0.1)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 6, color: T.accent }}>ℹ️ Informasi Pool</div>
                  <div style={{ opacity: 0.7, lineHeight: 1.6 }}>• Rasio: 1 {poolTokenA} ≈ 85 {poolTokenB}<br/>• Fee: 0.3% per transaksi<br/>• Slippage tolerance: {slippage}%</div>
                </div>
              </div>
            </GlassCard>
          )}

          {activeTab === 'staking' && (
            <GlassCard style={{ padding: 28 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>💎 MBG Staking Engine</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, margin: '24px 0' }}>
                {[
                  { label: 'Pool TVL', value: '$250,400' },
                  { label: 'APY', value: '32.50%', color: T.green },
                  { label: 'MBG Earned', value: mbgEarned.toFixed(6) }
                ].map((s, i) => (
                  <div key={i} style={{ background: T.input, padding: 18, borderRadius: 14, textAlign: 'center', border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 12, opacity: 0.5 }}>{s.label}</div>
                    <div style={{ fontWeight: 800, fontSize: 22, color: s.color || T.text, marginTop: 6 }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: T.input, padding: 22, borderRadius: 16, border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontWeight: 700 }}>Stake MBG</span>
                  <span style={{ fontSize: 13, opacity: 0.5 }}>Saldo: {parseFloat(balances['MBG'] || 0).toFixed(4)} MBG</span>
                </div>
                <input type="number" value={stakeAmt} onChange={e => setStakeAmt(e.target.value)} placeholder="0.0"
                  style={{ width: '100%', padding: 14, background: 'rgba(15,23,42,0.4)', border: `1px solid ${T.border}`, borderRadius: 12, color: T.text, fontWeight: 700, fontSize: 16, marginBottom: 14, boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: 12 }}>
                  <GradientButton onClick={stakeMBG} disabled={!account || !stakeAmt} variant="primary" style={{ flex: 1 }}>🔒 Stake</GradientButton>
                  <GradientButton onClick={harvestMBG} disabled={!account || mbgEarned <= 0} variant="secondary" style={{ flex: 1 }}>🌾 Harvest</GradientButton>
                </div>
              </div>
            </GlassCard>
          )}

          {activeTab === 'dashboard' && (
            <GlassCard style={{ padding: 28 }}>
              <h3 style={{ margin: '0 0 24px', fontSize: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <FreesiaLogo size={28} /> Dashboard
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
                {[
                  { label: 'Total Swaps', value: txHistory.filter(t => t.type === 'Swap').length },
                  { label: 'Total Volume', value: '$' + (txHistory.filter(t => t.type === 'Swap').length * 100) },
                  { label: 'LP Provided', value: userLP.total ? `$${userLP.total}` : '$0' },
                  { label: 'MBG Earned', value: mbgEarned.toFixed(4) }
                ].map((s, i) => (
                  <div key={i} style={{ background: T.input, padding: 18, borderRadius: 14, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 12, opacity: 0.5 }}>{s.label}</div>
                    <div style={{ fontWeight: 800, fontSize: 26, marginTop: 6 }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ marginBottom: 12, fontSize: 15, opacity: 0.8 }}>🔐 Keamanan Wallet</h4>
                <button onClick={() => { setShowApprovalManager(true); if (account && provider) loadTokenApprovals(account, provider); }}
                  style={{ width: '100%', padding: 16, background: 'rgba(248,113,113,0.08)', border: `1px solid ${T.red}40`, borderRadius: 14, color: T.text, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>🚫 Kelola Token Approvals</span>
                  <span style={{ fontSize: 12, opacity: 0.6 }}>{tokenApprovals.length > 0 ? `${tokenApprovals.length} active` : 'Aman'}</span>
                </button>
              </div>
              <h4 style={{ marginBottom: 14, fontSize: 15, opacity: 0.8 }}>💰 Wallet Balances</h4>
              <div style={{ display: 'grid', gap: 8 }}>
                {Object.entries(TOKEN_LIST).map(([sym, info]) => (
                  <div key={sym} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, background: T.input, borderRadius: 12, border: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${info.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: info.color, fontSize: 12 }}>{sym.slice(0,2)}</div>
                      <span style={{ fontWeight: 600 }}>{sym}</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 18 }}>{parseFloat(balances[sym] || 0).toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {activeTab === 'history' && (
            <GlassCard style={{ padding: 28 }}>
              <h3 style={{ margin: '0 0 24px', fontSize: 20 }}>📋 Transaction History</h3>
              {txHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 50, opacity: 0.5 }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
                  <p>Belum ada transaksi. Mulai trading!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {txHistory.map((tx, idx) => (
                    <div key={idx} style={{ padding: 16, background: T.input, borderRadius: 12, borderLeft: `4px solid ${tx.status === 'success' ? T.green : tx.status === 'failed' ? T.red : T.yellow}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <span style={{ background: tx.status === 'success' ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)', color: tx.status === 'success' ? T.green : T.red, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>{tx.type}</span>
                          <div style={{ marginTop: 8, fontWeight: 600, fontSize: 15 }}>{tx.detail}</div>
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.5 }}>{tx.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(71, 85, 105, 0.5); border-radius: 4px; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}
