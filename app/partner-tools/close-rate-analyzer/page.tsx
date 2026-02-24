"use client";

import { useState } from "react";

export default function CloseRateAnalyzer() {
  const [leads, setLeads] = useState(20);
  const [sales, setSales] = useState(4);
  const [avgSwingPrice, setAvgSwingPrice] = useState(1200);
  const [commissionRate, setCommissionRate] = useState(12);

  const commissionDecimal = commissionRate / 100;

  const closeRate =
    leads > 0 ? ((sales / leads) * 100).toFixed(2) : "0";

  const revenue = sales * avgSwingPrice;
  const commissionEarned = revenue * commissionDecimal;

  // Benchmark
  let performanceLevel = "Needs Improvement 🔴";
  if (Number(closeRate) >= 30) performanceLevel = "Elite Closer 🟢";
  else if (Number(closeRate) >= 20) performanceLevel = "Strong Performer 🟡";

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>
        TradePilot Close Rate Analyzer
      </h1>

      <div style={{ marginBottom: 15 }}>
        <label>Leads Received</label>
        <input
          type="number"
          value={leads}
          onChange={(e) => setLeads(Number(e.target.value))}
          style={{ width: "100%", padding: 8, marginTop: 5 }}
        />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Swings Sold</label>
        <input
          type="number"
          value={sales}
          onChange={(e) => setSales(Number(e.target.value))}
          style={{ width: "100%", padding: 8, marginTop: 5 }}
        />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Average Swing Price ($)</label>
        <input
          type="number"
          value={avgSwingPrice}
          onChange={(e) => setAvgSwingPrice(Number(e.target.value))}
          style={{ width: "100%", padding: 8, marginTop: 5 }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>Commission Rate (%)</label>
        <input
          type="number"
          value={commissionRate}
          onChange={(e) => setCommissionRate(Number(e.target.value))}
          style={{ width: "100%", padding: 8, marginTop: 5 }}
        />
      </div>

      <hr />

      <div style={{ marginTop: 20 }}>
        <h2>Close Rate: {closeRate}%</h2>
        <h3>Status: {performanceLevel}</h3>
        <h2>Total Revenue: ${revenue.toFixed(2)}</h2>
        <h2>Commission Earned: ${commissionEarned.toFixed(2)}</h2>
      </div>
    </div>
  );
}