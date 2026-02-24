"use client";

import { useState } from "react";

export default function IncomeGoalCalculator() {
  const [monthlyGoal, setMonthlyGoal] = useState(5000);
  const [avgSwingPrice, setAvgSwingPrice] = useState(1200);
  const [commissionRate, setCommissionRate] = useState(12);

  const commissionDecimal = commissionRate / 100;

  const commissionPerSwing = avgSwingPrice * commissionDecimal;

  const swingsNeeded =
    commissionPerSwing > 0
      ? Math.ceil(monthlyGoal / commissionPerSwing)
      : 0;

  const swingsPerWeek = Math.ceil(swingsNeeded / 4);
  const swingsPerDay = Math.ceil(swingsNeeded / 30);

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>
        TradePilot Income Goal Calculator
      </h1>

      <div style={{ marginBottom: 15 }}>
        <label>Monthly Income Goal ($)</label>
        <input
          type="number"
          value={monthlyGoal}
          onChange={(e) => setMonthlyGoal(Number(e.target.value))}
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
        <h2>Commission Per Swing: ${commissionPerSwing.toFixed(2)}</h2>
        <h2>Swings Needed This Month: {swingsNeeded}</h2>
        <h3>≈ {swingsPerWeek} per week</h3>
        <h3>≈ {swingsPerDay} per day</h3>
      </div>
    </div>
  );
}