"use client";

import { useState } from "react";

export default function SmsAlertsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/sms-alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone }),
    });

    setLoading(false);

    if (res.ok) {
      setSuccess(true);
      setName("");
      setEmail("");
      setPhone("");
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-2">
          You're Subscribed 🎉
        </h1>
        <p className="text-gray-600">
          You'll now receive important Doorplace USA partner text alerts.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-3xl font-bold text-red-700 mb-4">
        Partner SMS Alerts
      </h1>

      <p className="text-sm text-gray-600 mb-6">
        Subscribe to receive important partner updates, reminders, and alerts
        by text message.
      </p>

      <form onSubmit={submit} className="space-y-4">
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Phone Number"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded font-bold"
        >
          {loading ? "Submitting..." : "Subscribe to SMS Alerts"}
        </button>
      </form>
    </div>
  );
}
