export const CONTRACTS = {
  USDC: "0xCa2AC72dAC6d88a21765971f4A6AA917e12553Dd",
  DAI:  "0x961B942b0f7e44622584Cb001DEC642b01573Acf",
  USDT: "0x7B00A91DaDDA4124D5d1D4F10E6CAc338911700A",
  MBG:  "0x943a23d4ee276C2598D04C9e143b8b67b3829CFe",
  POOL: "0x49C738De9b7bED753bC25E91A58dC58EA889f585",
};
export const LITVM_RPC = "https://liteforge.rpc.caldera.xyz/http";
export const CHAIN_ID = 4441;
export const EXPLORER_URL = "https://liteforge.explorer.caldera.xyz";
export const FAUCET_AMOUNT = "1000";
export const TOKEN_LIST = {
  zkLTC: { name: "zkLTC", decimals: 18, address: "NATIVE", isNative: true },
  USDC:  { name: "USDC",  decimals: 6,  address: CONTRACTS.USDC },
  DAI:   { name: "DAI",   decimals: 18, address: CONTRACTS.DAI },
  USDT:  { name: "USDT",  decimals: 6,  address: CONTRACTS.USDT },
  MBG:   { name: "MBG",   decimals: 18, address: CONTRACTS.MBG },
};
export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function faucet(uint256 amount) external",
];
export const ERC20_INFO_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];
export const POOL_ABI = [
  "function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minOut) external",
  "function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB) external",
  "function removeLiquidity(address tokenA, address tokenB, uint256 lpAmount) external",
  "function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) view returns (uint256)",
  "function getReserves() view returns (uint256, uint256)",
  "function getUserLP(address user) view returns (uint256)",
];
