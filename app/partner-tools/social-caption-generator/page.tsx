"use client";

import { useState } from "react";

export default function SocialCaptionGenerator() {
  const [city, setCity] = useState("Dallas");
  const [swingSize, setSwingSize] = useState("Full");
  const [material, setMaterial] = useState("Pine");
  const [tone, setTone] = useState("friendly");

  const generateCaption = () => {
    const friendly = `Looking to upgrade your outdoor space in ${city}? 🌿

Our handcrafted ${material} ${swingSize} porch swings are built for comfort, durability, and style. Perfect for relaxing evenings and family gatherings.

Message me today for details or a custom quote!`;

    const urgency = `🔥 ${city} homeowners — don’t miss this!

Our handcrafted ${material} ${swingSize} porch swings are now available. Built strong, built beautiful, and made to last.

Limited build slots available. Message now before they’re gone.`;

    const luxury = `Transform your ${city} home with a handcrafted ${material} ${swingSize} porch swing.

Premium craftsmanship. Timeless design. Built for comfort and elegance.

Send a message for availability and pricing.`;

    if (tone === "urgency") return urgency;
    if (tone === "luxury") return luxury;
    return friendly;
  };

  const generateHashtags = () => {
    return `#${city.replace(/\s/g, "")} #PorchSwing #OutdoorLiving #BackyardUpgrade #FrontPorchVibes #Handcrafted`;
  };

  const caption = generateCaption();
  const hashtags = generateHashtags();

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>
        TradePilot Social Caption Generator
      </h1>

      <div style={{ marginBottom: 15 }}>
        <label>City</label>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 5 }}
        />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Swing Size</label>
        <select
          value={swingSize}
          onChange={(e) => setSwingSize(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 5 }}
        >
          <option>Crib</option>
          <option>Twin</option>
          <option>Full</option>
          <option>Queen</option>
        </select>
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Material</label>
        <select
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 5 }}
        >
          <option>Pine</option>
          <option>Cedar</option>
          <option>Red Oak</option>
          <option>White Oak</option>
        </select>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>Post Tone</label>
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 5 }}
        >
          <option value="friendly">Friendly</option>
          <option value="urgency">Urgency</option>
          <option value="luxury">Luxury</option>
        </select>
      </div>

      <hr />

      <div style={{ marginTop: 20 }}>
        <h2>Generated Caption</h2>
        <textarea
          value={`${caption}\n\n${hashtags}`}
          readOnly
          style={{
            width: "100%",
            height: 200,
            padding: 10,
            marginTop: 10,
          }}
        />
      </div>
    </div>
  );
}