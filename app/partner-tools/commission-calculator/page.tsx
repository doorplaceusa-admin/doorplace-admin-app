"use client";

import { useState } from "react";

export default function CommissionCalculator() {
  const [size, setSize] = useState("crib");
  const [markupPercent, setMarkupPercent] = useState(60);
  const [blackCupHolder, setBlackCupHolder] = useState(false);
  const [rope, setRope] = useState(false);
  const [paint, setPaint] = useState(false);
  const [cedarUpgrade, setCedarUpgrade] = useState(false);
  const [freight, setFreight] = useState(false);

  const COMMISSION_RATE = 0.12;
  const MIN_COMMISSION = 100;
  const MAX_MARKUP = 60;

  const basePrices: Record<string, number> = {
    crib: 700,
    twin: 800,
    full: 900,
  };

  const accessories = {
    blackCupHolder: 15,
    rope: 85,
  };

  const upgrades = {
    paint: 225,
    cedarUpgrade: 500,
  };

  const freightCost = 200;

  const basePrice = basePrices[size];

  const accessoryTotal =
    (blackCupHolder ? accessories.blackCupHolder : 0) +
    (rope ? accessories.rope : 0);

  const upgradeTotal =
    (paint ? upgrades.paint : 0) +
    (cedarUpgrade ? upgrades.cedarUpgrade : 0);

  const commissionableTotal = basePrice + accessoryTotal + upgradeTotal;

  const cappedMarkup = Math.min(markupPercent, MAX_MARKUP);

  const salePrice = commissionableTotal * (1 + cappedMarkup / 100);

  const freightTotal = freight ? freightCost : 0;

  const finalCustomerPrice = salePrice + freightTotal;

  const rawCommission = salePrice * COMMISSION_RATE;
  const commission = Math.max(rawCommission, MIN_COMMISSION);

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto", padding: 20 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 30 }}>
        Commission Calculator
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>

        {/* LEFT SIDE */}
        <div style={cardStyle}>
          <h3>Product Selection</h3>

          <label>Swing Size</label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            style={inputStyle}
          >
            <option value="crib">Crib – $700</option>
            <option value="twin">Twin – $800</option>
            <option value="full">Full – $900</option>
          </select>

          <div style={{ marginTop: 25 }}>
            <label>Markup Percentage (Max 60%)</label>
            <input
              type="range"
              min="0"
              max="60"
              value={cappedMarkup}
              onChange={(e) => setMarkupPercent(Number(e.target.value))}
              style={{ width: "100%" }}
            />
            <div style={{ fontWeight: 700, marginTop: 5 }}>
              {cappedMarkup}% Markup
            </div>
          </div>

          <div style={{ marginTop: 25 }}>
            <h4>Accessories</h4>
            <Checkbox label="Black Cup Holder – $15" value={blackCupHolder} setValue={setBlackCupHolder} />
            <Checkbox label={`Rope ¾" x 50' – $85`} value={rope} setValue={setRope} />
          </div>

          <div style={{ marginTop: 20 }}>
            <h4>Upgrades</h4>
            <Checkbox label="Paint – $225" value={paint} setValue={setPaint} />
            <Checkbox label="Cedar Upgrade – $500" value={cedarUpgrade} setValue={setCedarUpgrade} />
          </div>

          <div style={{ marginTop: 20 }}>
            <h4>Freight</h4>
            <Checkbox
              label="Freight Shipping – $200 (No Commission)"
              value={freight}
              setValue={setFreight}
            />
          </div>
        </div>

        {/* RIGHT SIDE RESULTS */}
        <div style={cardStyle}>
          <h3>Financial Breakdown</h3>

          <ResultBox title="Sale Price (Before Freight)" value={`$${salePrice.toFixed(2)}`} />

          <ResultBox title="Freight" value={`$${freightTotal.toFixed(2)}`} />

          <ResultBox
            title="Final Customer Price"
            value={`$${finalCustomerPrice.toFixed(2)}`}
            highlight
          />

          <ResultBox
            title="Your Commission"
            value={`$${commission.toFixed(2)}`}
            big
            green
          />

          <div style={{ fontSize: 13, marginTop: 20, color: "#555" }}>
            Commission is 12% or $100 minimum, whichever is greater.
            Freight is excluded from commission.
          </div>
        </div>

      </div>
    </div>
  );
}

/* ---------- COMPONENTS ---------- */

function Checkbox({ label, value, setValue }: any) {
  return (
    <label style={{ display: "block", marginBottom: 8 }}>
      <input
        type="checkbox"
        checked={value}
        onChange={() => setValue(!value)}
        style={{ marginRight: 8 }}
      />
      {label}
    </label>
  );
}

function ResultBox({ title, value, highlight, big, green }: any) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 12,
        background: highlight
          ? "#111"
          : green
          ? "#e7f9ee"
          : "#f4f4f4",
        marginBottom: 15,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ fontSize: 14, color: highlight ? "#aaa" : "#555" }}>
        {title}
      </div>
      <div
        style={{
          fontSize: big ? 32 : 22,
          fontWeight: 800,
          color: highlight ? "#fff" : green ? "#15803d" : "#111",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#fff",
  padding: 25,
  borderRadius: 16,
  boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
};

const inputStyle = {
  width: "100%",
  padding: 10,
  marginTop: 6,
  borderRadius: 8,
  border: "1px solid #ddd",
};