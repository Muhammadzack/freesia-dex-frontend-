// Wrapper retry dengan exponential backoff untuk semua panggilan RPC
export async function withRetry(fn, retries = 3, baseDelay = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err?.reason || err?.message || "";
      const isRateLimit = msg.includes("-32005") || msg.includes("rate limit");
      if (isRateLimit && i < retries - 1) {
        const delay = baseDelay * Math.pow(2, i); // 1.5s, 3s, 6s...
        await new Promise(res => setTimeout(res, delay));
        continue;
      }
      throw err;
    }
  }
}
