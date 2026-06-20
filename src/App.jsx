  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0b0f19", color: "#f3f4f6", fontFamily: "'Inter', sans-serif", paddingBottom: "50px" }}>
      {toast && <div style={{ position: "fixed", top: "20px", right: "20px", backgroundColor: "#1e293b", padding: "12px 20px", borderRadius: "12px", border: "1px solid #fbbf24", zIndex: 1000, boxShadow: "0px 4px 20px rgba(25fbbf24,0.15)" }}>{toast.icon} {toast.msg}</div>}
      
      {/* BANNER LITVM TESTNET */}
      <div style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#fbbf24", textAlign: "center", padding: "10px 16px", fontSize: "13px", borderBottom: "1px solid rgba(245, 158, 11, 0.2)", lineHeight: "1.4" }}>
        ⚠️ Berjalan di <strong>LitVM Testnet</strong> (Chain ID 4441). Token tidak bernilai asli — gunakan untuk testing saja.
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#111827", padding: "14px 24px", borderBottom: "1px solid #1f2937" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ backgroundColor: "#ffe4e6", padding: "6px", borderRadius: "50%" }}>
            <Flower size={20} color="#f472b6" fill="#f472b6" />
          </div>
          <div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#ffffff", letterSpacing: "0.5px" }}>Freesia</div>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: "#fbbf24", marginTop: "-3px" }}>ANALYTICS DEX</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* LOGO X (TWITTER) */}
          <a href="https://x.com" target="_blank" rel="noreferrer" style={{ color: "#f3f4f6", textDecoration: "none", fontSize: "20px", fontWeight: "800", transition: "0.2s" }}>𝕏</a>
          
          <button onClick={connectWallet} style={{ backgroundColor: "#fbbf24", color: "#0b0f19", border: "none", padding: "10px 18px", borderRadius: "12px", fontWeight: "800", cursor: "pointer", transition: "0.2s" }}>
            {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : "🔌 Connect Wallet"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "480px", margin: "30px auto 0 auto", padding: "0 16px" }}>
        
        {/* LIVE PRICE CHART SECTION */}
        <div style={{ backgroundColor: "#111827", borderRadius: "24px", padding: "20px", marginBottom: "20px", border: "1px solid #1f2937" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <LineChart size={18} color="#fbbf24" />
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#9ca3af" }}>Live Price Stream (Testnet Feed)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "rgba(16,185,129,0.1)", padding: "4px 8px", borderRadius: "6px" }}>
              <TrendingUp size={12} color="#10b981" />
              <span style={{ fontSize: "11px", color: "#10b981", fontWeight: "bold" }}>+0.24%</span>
            </div>
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#ffffff", marginBottom: "14px" }}>{rateText.replace("1 USDC = ", "")} <span style={{ fontSize: "12px", color: "#9ca3af" }}>USDC/DAI</span></div>
          
          {/* Visual Mini Chart Bars */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "60px", padding: "5px 0", borderBottom: "1px dashed #374151" }}>
            {mockChartData.map((val, idx) => {
              const heightPercent = Math.min(Math.max((val - 0.95) * 600, 15), 100);
              return (
                <div key={idx} style={{ flex: 1, backgroundColor: idx === mockChartData.length - 1 ? "#fbbf24" : "#1f2937", height: `${heightPercent}%`, borderRadius: "4px", transition: "all 0.5s ease" }} />
              );
            })}
          </div>
        </div>

        {/* NAVIGATION TAB */}
        <div style={{ display: "flex", backgroundColor: "#111827", padding: "6px", borderRadius: "16px", marginBottom: "20px", border: "1px solid #1f2937" }}>
          {["swap", "mint", "pool", "portfolio"].map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: "12px", backgroundColor: activeTab === t ? "#fbbf24" : "transparent", color: activeTab === t ? "#0b0f19" : "#9ca3af", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}>
              {t === "swap" ? "⇄ Swap" : t === "mint" ? "🪙 Faucet" : t === "pool" ? "💧 Pool" : "👤 Account"}
            </button>
          ))}
        </div>

        {/* TAB CORE PANEL */}
        <div style={{ backgroundColor: "#111827", borderRadius: "24px", padding: "24px", border: "1px solid #1f2937" }}>
          {activeTab === "swap" && (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Tukar Token</h3>
              
              <div style={{ backgroundColor: "#1f2937", padding: "16px", borderRadius: "16px", marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9ca3af", marginBottom: "8px" }}><span>Bayar</span><span>Saldo: {balances[fromSym] || "0.00"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <input type="number" placeholder="0.00" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} style={{ background: "transparent", border: "none", color: "#fff", fontSize: "24px", width: "55%", outline: "none" }} />
                  <select value={fromSym} onChange={(e) => { setFromSym(e.target.value); if(e.target.value === toSym) setToSym(e.target.value === "USDC" ? "DAI" : "USDC"); }} style={{ backgroundColor: "#111827", color: "#fff", border: "1px solid #374151", padding: "8px 12px", borderRadius: "10px" }}>
                    <option value="USDC">💵 USDC</option>
                    <option value="DAI">◈ DAI</option>
                    <option value="zkLTC">🪙 zkLTC</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center", margin: "-12px 0" }}>
                <button onClick={() => { const old = fromSym; setFromSym(toSym); setToSym(old); }} style={{ backgroundColor: "#fbbf24", border: "none", padding: "10px", borderRadius: "50%", cursor: "pointer", zIndex: 2 }}><ArrowUpDown size={16} color="#0b0f19" /></button>
              </div>

              <div style={{ backgroundColor: "#1f2937", padding: "16px", borderRadius: "16px", marginTop: "8px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9ca3af", marginBottom: "8px" }}><span>Terima (Estimasi)</span><span>Saldo: {balances[toSym] || "0.00"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <input type="text" placeholder="0.00" value={amountIn ? (parseFloat(amountIn) * (fromSym === "zkLTC" ? 1.25 : 0.993)).toFixed(2) : ""} readOnly style={{ background: "transparent", border: "none", color: "#9ca3af", fontSize: "24px", width: "55%" }} />
                  <select value={toSym} onChange={(e) => { setToSym(e.target.value); if(e.target.value === fromSym) setFromSym(e.target.value === "USDC" ? "DAI" : "USDC"); }} style={{ backgroundColor: "#111827", color: "#fff", border: "1px solid #374151", padding: "8px 12px", borderRadius: "10px" }}>
                    <option value="DAI">◈ DAI</option>
                    <option value="USDC">💵 USDC</option>
                  </select>
                </div>
              </div>

              <button onClick={handleSwap} disabled={swapLoading || !amountIn} style={{ width: "100%", backgroundColor: "#fbbf24", color: "#0b0f19", border: "none", padding: "14px", borderRadius: "16px", fontWeight: "800", cursor: "pointer" }}>
                {swapLoading ? "Memproses Swap..." : `Tukar ${fromSym}`}
              </button>
            </div>
          )}

          {activeTab === "mint" && (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Faucet Testnet Token</h3>
              {Object.keys(TOKEN_LIST).filter(k => k !== "zkLTC").map((sym) => (
                <div key={sym} style={{ backgroundColor: "#1f2937", padding: "16px", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div><span style={{ fontWeight: "bold" }}>{TOKEN_LIST[sym].logo} {sym}</span><div style={{ fontSize: "12px", color: "#9ca3af" }}>Saldo: {balances[sym]}</div></div>
                  <button onClick={() => handleMintToken(sym)} disabled={mintingSym === sym} style={{ backgroundColor: "#fbbf24", color: "#0b0f19", border: "none", padding: "8px 16px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>
                    {mintingSym === sym ? "Minting..." : "CLAIM 10K"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === "pool" && (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Liquidity Reserves Pool</h3>
              <div style={{ backgroundColor: "#1f2937", padding: "14px", borderRadius: "12px", marginBottom: "16px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}><span>Pool USDC Reserve:</span><span style={{ color: "#fbbf24", fontWeight: "bold" }}>{reserveA}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Pool DAI Reserve:</span><span style={{ color: "#fbbf24", fontWeight: "bold" }}>{reserveB}</span></div>
              </div>
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <input type="number" placeholder="Jumlah USDC" value={amountAInput} onChange={(e) => setAmountAInput(e.target.value)} style={{ background: "#1f2937", border: "1px solid #374151", color: "#fff", padding: "12px", borderRadius: "12px", width: "100%", outline: "none" }} />
                <input type="number" placeholder="Jumlah DAI" value={amountBInput} onChange={(e) => setAmountBInput(e.target.value)} style={{ background: "#1f2937", border: "1px solid #374151", color: "#fff", padding: "12px", borderRadius: "12px", width: "100%", outline: "none" }} />
              </div>
              <button onClick={handleAddLiquidity} disabled={poolLoading} style={{ width: "100%", backgroundColor: "#10b981", color: "#0b0f19", border: "none", padding: "12px", borderRadius: "12px", fontWeight: "bold" }}>Deposit Liquidity</button>
            </div>
          )}

          {activeTab === "portfolio" && (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Akun & Poin</h3>
              <div style={{ backgroundColor: "#1f2937", padding: "20px", borderRadius: "16px", textAlign: "center" }}>
                <User style={{ color: "#fbbf24", margin: "0 auto 8px auto" }} size={24} />
                <div style={{ fontSize: "13px", color: "#9ca3af" }}>Gas Utama (zkLTC): {balances.zkLTC}</div>
                <div style={{ fontSize: "26px", fontWeight: "800", color: "#10b981", marginTop: "6px" }}>{activityPoints} XP Pts</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
