"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

export default function CommissionCalculator() {
  const [size, setSize] = useState("twin");
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

  const basePrice = basePrices[size];

  const accessoryTotal =
    (blackCupHolder ? 15 : 0) +
    (rope ? 85 : 0);

  const upgradeTotal =
    (paint ? 225 : 0) +
    (cedarUpgrade ? 500 : 0);

  const commissionableTotal = basePrice + accessoryTotal + upgradeTotal;

  const cappedMarkup = Math.min(markupPercent, MAX_MARKUP);

  const salePrice = commissionableTotal * (1 + cappedMarkup / 100);

  const freightTotal = freight ? 200 : 0;

  const finalCustomerPrice = salePrice + freightTotal;

  const rawCommission = salePrice * COMMISSION_RATE;
  const commission = Math.max(rawCommission, MIN_COMMISSION);

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Commission Calculator</h1>

      <div style={gridStyle}>

        {/* LEFT PANEL */}
        <div style={cardStyle}>
          <SectionTitle text="Product Selection" />

          <label style={labelStyle}>Swing Size</label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            style={inputStyle}
          >
            <option value="crib">Crib – $700</option>
            <option value="twin">Twin – $800</option>
            <option value="full">Full – $900</option>
          </select>

          <div style={{ marginTop: 30 }}>
            <SectionTitle text="Markup Percentage" />
            <div style={badgeStyle}>MAX 60%</div>

            <input
              type="range"
              min="0"
              max="60"
              value={cappedMarkup}
              onChange={(e) => setMarkupPercent(Number(e.target.value))}
              style={{ width: "100%", marginTop: 10 }}
            />

            <div style={markupDisplayStyle}>
              {cappedMarkup}% Markup
            </div>
          </div>

          <div style={{ marginTop: 30 }}>
            <SectionTitle text="Accessories" />
            <Check label="Black Cup Holder – $15" value={blackCupHolder} setValue={setBlackCupHolder} />
            <Check label={'Rope ¾" x 50\' – $85'} value={rope} setValue={setRope} />
          </div>

          <div style={{ marginTop: 30 }}>
            <SectionTitle text="Upgrades" />
            <Check label="Paint – $225" value={paint} setValue={setPaint} />
            <Check label="Cedar Upgrade – $500" value={cedarUpgrade} setValue={setCedarUpgrade} />
          </div>

          <div style={{ marginTop: 30 }}>
            <SectionTitle text="Freight" />
            <Check label="Freight Shipping – $200 (No Commission)" value={freight} setValue={setFreight} />
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={cardStyle}>
          <SectionTitle text="Financial Breakdown" />

          <ResultCard title="Sale Price (Before Freight)" value={`$${salePrice.toFixed(2)}`} />
          <ResultCard title="Freight" value={`$${freightTotal.toFixed(2)}`} />
          <ResultCard
            title="Final Customer Price"
            value={`$${finalCustomerPrice.toFixed(2)}`}
            dark
          />
          <ResultCard
            title="Your Commission"
            value={`$${commission.toFixed(2)}`}
            highlight
            big
          />

          <div style={noteStyle}>
            Commission is 12% or $100 minimum (whichever is greater).
            Freight is excluded from commission.
          </div>
        </div>

      </div>
    </div>
  );
}

/* ---------- COMPONENTS ---------- */

function SectionTitle({ text }: { text: string }) {
  return (
    <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 16 }}>
      {text}
    </div>
  );
}

function Check({
  label,
  value,
  setValue,
}: {
  label: string;
  value: boolean;
  setValue: (v: boolean) => void;
}) {
  return (
    <label style={{ display: "flex", gap: 10, marginBottom: 10, cursor: "pointer" }}>
      <input type="checkbox" checked={value} onChange={() => setValue(!value)} />
      {label}
    </label>
  );
}

function ResultCard({
  title,
  value,
  dark,
  highlight,
  big,
}: {
  title: string;
  value: string;
  dark?: boolean;
  highlight?: boolean;
  big?: boolean;
}) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        background: highlight
          ? "#e6f6ec"
          : dark
          ? "#111"
          : "#f5f5f5",
        color: dark ? "#fff" : highlight ? "#15803d" : "#111",
        boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ fontSize: 14, opacity: 0.7 }}>{title}</div>
      <div style={{ fontSize: big ? 36 : 24, fontWeight: 800 }}>
        {value}
      </div>
    </div>
  );
}

/* ---------- STYLES ---------- */

const containerStyle: CSSProperties = {
  maxWidth: 1200,
  margin: "40px auto",
  padding: 20,
};

const titleStyle: CSSProperties = {
  fontSize: 36,
  fontWeight: 800,
  marginBottom: 30,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gap: 30,
  gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
};

const cardStyle: CSSProperties = {
  background: "#fff",
  padding: 30,
  borderRadius: 20,
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  border: "1px solid #ddd",
  marginTop: 6,
};

const labelStyle: CSSProperties = {
  fontWeight: 600,
  marginBottom: 6,
};

const badgeStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  background: "#111",
  color: "#fff",
  padding: "4px 10px",
  borderRadius: 999,
  display: "inline-block",
};

const markupDisplayStyle: CSSProperties = {
  marginTop: 10,
  fontWeight: 800,
  fontSize: 18,
};

const noteStyle: CSSProperties = {
  fontSize: 13,
  color: "#555",
  marginTop: 20,
};