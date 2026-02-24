"use client";

import { useState } from "react";

export default function CommissionCalculator() {
  const [size, setSize] = useState("crib");
  const [material, setMaterial] = useState("pine");
  const [cupHolders, setCupHolders] = useState(false);
  const [ropeKit, setRopeKit] = useState(false);
  const [stainUpgrade, setStainUpgrade] = useState(false);

  const COMMISSION_RATE = 0.12;
  const DEPOSIT_RATE = 0.30; // assuming 30% deposit

  const basePrices: Record<string, number> = {
    crib: 600,
    twin: 900,
    full: 1100,
    queen: 1400,
  };

  const materialUpcharge: Record<string, number> = {
    pine: 0,
    cedar: 200,
    red_oak: 350,
    white_oak: 450,
  };

  const addOns = {
    cupHolders: 15,
    ropeKit: 85,
    stainUpgrade: 150,
  };

  const calculateTotal = () => {
    let total = basePrices[size] + materialUpcharge[material];

    if (cupHolders) total += addOns.cupHolders;
    if (ropeKit) total += addOns.ropeKit;
    if (stainUpgrade) total += addOns.stainUpgrade;

    return total;
  };

  const totalPrice = calculateTotal();
  const commission = totalPrice * COMMISSION_RATE;
  const depositCommission = totalPrice * DEPOSIT_RATE * COMMISSION_RATE;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>
        TradePilot Commission Calculator
      </h1>

      <div style={{ marginBottom: 15 }}>
        <label>Swing Size:</label>
        <select
          value={size}
          onChange={(e) => setSize(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 5 }}
        >
          <option value="crib">Crib</option>
          <option value="twin">Twin</option>
          <option value="full">Full</option>
          <option value="queen">Queen</option>
        </select>
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Material:</label>
        <select
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 5 }}
        >
          <option value="pine">Pine</option>
          <option value="cedar">Cedar (+$200)</option>
          <option value="red_oak">Red Oak (+$350)</option>
          <option value="white_oak">White Oak (+$450)</option>
        </select>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          <input
            type="checkbox"
            checked={cupHolders}
            onChange={() => setCupHolders(!cupHolders)}
          />
          Add Cup Holders (+$15)
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          <input
            type="checkbox"
            checked={ropeKit}
            onChange={() => setRopeKit(!ropeKit)}
          />
          Add Rope Kit (+$85)
        </label>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>
          <input
            type="checkbox"
            checked={stainUpgrade}
            onChange={() => setStainUpgrade(!stainUpgrade)}
          />
          Stain Upgrade (+$150)
        </label>
      </div>

      <hr />

      <div style={{ marginTop: 20 }}>
        <h2>Total Retail Price: ${totalPrice.toFixed(2)}</h2>
        <h2>Your 12% Commission: ${commission.toFixed(2)}</h2>
        <h3>
          Commission Paid After Deposit (30%): $
          {depositCommission.toFixed(2)}
        </h3>
      </div>
    </div>
  );
}