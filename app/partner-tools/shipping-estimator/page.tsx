"use client";

import { useState } from "react";

export default function ShippingEstimator() {
  const [swingSize, setSwingSize] = useState("crib");
  const [distanceTier, setDistanceTier] = useState("regional");
  const [whiteGlove, setWhiteGlove] = useState(false);

  const baseShipping: Record<string, Record<string, number>> = {
    crib: {
      local: 150,
      regional: 250,
      national: 400,
    },
    twin: {
      local: 200,
      regional: 325,
      national: 475,
    },
    full: {
      local: 250,
      regional: 375,
      national: 550,
    },
    queen: {
      local: 300,
      regional: 450,
      national: 650,
    },
  };

  const whiteGloveFee = 150;

  const calculateShipping = () => {
    let cost = baseShipping[swingSize][distanceTier];
    if (whiteGlove) cost += whiteGloveFee;
    return cost;
  };

  const shippingCost = calculateShipping();

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>
        TradePilot Shipping Estimator
      </h1>

      <div style={{ marginBottom: 15 }}>
        <label>Swing Size</label>
        <select
          value={swingSize}
          onChange={(e) => setSwingSize(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 5 }}
        >
          <option value="crib">Crib</option>
          <option value="twin">Twin</option>
          <option value="full">Full</option>
          <option value="queen">Queen</option>
        </select>
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Delivery Distance</label>
        <select
          value={distanceTier}
          onChange={(e) => setDistanceTier(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 5 }}
        >
          <option value="local">Local (Under 150 miles)</option>
          <option value="regional">Regional (150–800 miles)</option>
          <option value="national">National (800+ miles)</option>
        </select>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>
          <input
            type="checkbox"
            checked={whiteGlove}
            onChange={() => setWhiteGlove(!whiteGlove)}
          />
          Add White Glove Delivery (+$150)
        </label>
      </div>

      <hr />

      <div style={{ marginTop: 20 }}>
        <h2>Estimated Shipping: ${shippingCost.toFixed(2)}</h2>
        <p style={{ marginTop: 10, fontSize: 14 }}>
          *Estimate only. Final freight cost confirmed after address review.
        </p>
      </div>
    </div>
  );
}