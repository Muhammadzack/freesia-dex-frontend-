export function fmtBal(val, decimals = 4) {
  if (!val || val === "0" || val === "0.00") return "0";
  const n = Number(val);
  if (isNaN(n) || n === 0) return "0";
  // Handle very large numbers (like 2e+21)
  if (n >= 1e21) return n.toExponential(2);
  if (n >= 1e15) return n.toExponential(2);
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (n < 0.0001) return n.toExponential(2);
  return n.toFixed(decimals);
}

export function fmtUSD(val) {
  if (isNaN(val)) return "$0";
  if (val >= 1e9) return "$" + (val / 1e9).toFixed(2) + "B";
  if (val >= 1e6) return "$" + (val / 1e6).toFixed(2) + "M";
  if (val >= 1e3) return "$" + val.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return "$" + val.toFixed(2);
}
