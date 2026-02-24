"use client";

import { useState } from "react";

export default function AdROICalculator() {
  const [adSpend, setAdSpend] = useState(500);
  const [costPerLead, setCostPerLead] = useState(25);
  const [closeRate, setCloseRate] = useState(25);
  const [avgSwingPrice, setAvgSwingPrice] = useState(1200);
  const [commissionRate, setCommissionRate] = useState(12);

  const commissionDecimal = commissionRate / 100;
  const closeDecimal = closeRate / 100;

  const leadsGenerated =
    costPerLead > 0 ? Math.floor(adSpend / costPerLead) : 0;

  const salesExpected = Math.floor(leadsGenerated * closeDecimal);

  const totalRevenue = salesExpected * avgSwingPrice;

  const commissionEarned = totalRevenue * commissionDecimal;

  const profitAfterAds = commissionEarned - adSpend;

  const roiPercent =
    adSpend > 0
      ? (((commissionEarned - adSpend) / adSpend) * 100).toFixed(2)
      : "0";

  let roiStatus = "Negative ROI 🔴";
  if (Number(roiPercent) > 100) roiStatus = "Strong ROI 🟢";
  else if (Number(roiPercent) > 0) roiStatus = "Profitable 🟡";

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>
        TradePilot Ad ROI Calculator
      </h1>

      <div style={{ marginBottom: 15 }}>
        <label>Ad Spend ($)</label>
        <input
          type="number"
          value={adSpend}
          onChange={(e) => setAdSpend(Number(e.target.value))}
          style={{ width: "100%", padding: 8, marginTop: 5 }}
        />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Cost Per Lead ($)</label>
        <input
          type="number"
          value={costPerLead}
          onChange={(e) => setCostPerLead(Number(e.target.value))}
          style={{ width: "100%", padding: 8, marginTop: 5 }}
        />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Close Rate (%)</label>
        <input
          type="number"
          value={closeRate}
          onChange={(e) => setCloseRate(Number(e.target.value))}
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
        <h2>Estimated Leads: {leadsGenerated}</h2>
        <h2>Expected Sales: {salesExpected}</h2>
        <h2>Total Revenue: ${totalRevenue.toFixed(2)}</h2>
        <h2>Commission Earned: ${commissionEarned.toFixed(2)}</h2>
        <h2>Profit After Ads: ${profitAfterAds.toFixed(2)}</h2>
        <h2>ROI: {roiPercent}%</h2>
        <h3>Status: {roiStatus}</h3>
      </div>
    </div>
  );
}