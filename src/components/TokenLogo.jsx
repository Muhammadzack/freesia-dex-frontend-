const logos = { zkLTC: "https://cryptologos.cc/logos/litecoin-ltc-logo.png", USDC: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png", DAI: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png", USDT: "https://cryptologos.cc/logos/tether-usdt-logo.png", MBG: null };
export default function TokenLogo({ symbol, size = 28 }) {
  const src = logos[symbol];
  if (!src) return <svg width={size} height={size} viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#f472b6" stroke="#fce7f3" strokeWidth="1"/><text x="16" y="21" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">M</text></svg>;
  return <img src={src} alt={symbol} width={size} height={size} style={{ borderRadius: "50%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />;
}
