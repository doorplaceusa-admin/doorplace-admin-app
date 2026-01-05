"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Message = {
  id: string;
  sender: "partner" | "admin" | "system";
  message: string;
  created_at: string;
};

/* ===============================
   SUPPORT STATUS (CST)
=============================== */
function getSupportStatus() {
  const now = new Date();
  const cst = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Chicago" })
  );

  const hour = cst.getHours();
  const isOnline = hour >= 9 && hour < 17; // 9am–5pm CST

  return {
    isOnline,
    label: isOnline
      ? "Support is online • Typical response within minutes"
      : "After hours • You may still message us",
    hoursNote: "Live chat hours: 9:00 AM – 5:00 PM CST",
  };
}

export default function PartnerMessages({
  partnerId,
  isAdmin = false,
  onNewMessage,
}: {
  partnerId: string;
  isAdmin?: boolean;
  onNewMessage?: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const lastCountRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);


  const supportStatus = getSupportStatus();

  /* ===============================
     LOAD MESSAGES
  =============================== */
  async function loadMessages() {
    const { data, error } = await supabase
      .from("partner_messages")
      .select("id, sender, message, created_at")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      const latest = data[data.length - 1];

if (
  latest &&
  latest.id !== lastMessageIdRef.current &&
  latest.sender === "admin"
) {
  onNewMessage?.();
}

lastMessageIdRef.current = latest?.id ?? null;
lastCountRef.current = data.length;
setMessages(data as Message[]);

    }

    setLoading(false);
  }

  /* ===============================
     SEND MESSAGE
  =============================== */
  async function sendMessage() {
    if (!newMessage.trim() || sending) return;

    setSending(true);

    const { error } = await supabase.from("partner_messages").insert({
      partner_id: partnerId,
      message: newMessage.trim(),
      sender: isAdmin ? "admin" : "partner",
    });

    if (!error) {
      setNewMessage("");
      loadMessages();
    }

    setSending(false);
  }

  /* ===============================
     POLLING
  =============================== */
  useEffect(() => {
    if (!partnerId) return;

    loadMessages();

    pollRef.current = setInterval(loadMessages, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [partnerId]);

  /* ===============================
     AUTO SCROLL
  =============================== */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ===============================
     UI
  =============================== */
  return (
    <div className="flex flex-col h-full">

      {/* ===== SUPPORT STATUS ===== */}
      <div className="flex items-center gap-2 text-xs mb-2 text-gray-600">
        <span
          className={`h-2 w-2 rounded-full ${
            supportStatus.isOnline ? "bg-green-500" : "bg-gray-400"
          }`}
        />
        <span>{supportStatus.label}</span>
      </div>

      <div className="text-[11px] text-gray-400 mb-3">
        {supportStatus.hoursNote}
      </div>

      {/* ===== WELCOME MESSAGE ===== */}
      <div className="border rounded bg-gray-100 p-3 text-sm mb-3">
        <strong>👋 Welcome!</strong>
        <p className="text-gray-700 mt-1">
          This is your direct line to Doorplace USA support.
          <br />
          Ask us anything — placing orders, answering customer questions, commission 
          details, lead support, or help closing a sale.


        </p>
      </div>

      {/* ===== MESSAGES ===== */}
      <div className="flex-1 overflow-y-auto border rounded bg-gray-50 p-3 space-y-2">
        {loading && (
          <p className="text-xs text-gray-500">Loading messages…</p>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-xs text-gray-500 space-y-2">
            <p>No messages yet. Start the conversation.</p>
            <ul className="list-disc ml-4">
              <li>Commission & payouts</li>
              <li>Order status or issues</li>
              <li>Lead tracking questions</li>
              <li>General partner support</li>
            </ul>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] p-2 rounded text-sm ${
              m.sender === "partner"
                ? "ml-auto bg-red-600 text-white"
                : m.sender === "system"
                ? "mx-auto bg-gray-200 text-gray-700 text-xs"
                : "bg-white border"
            }`}
          >
            <div>{m.message}</div>
            <div className="text-[10px] opacity-70 mt-1">
              {new Date(m.created_at).toLocaleString()}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* ===== INPUT ===== */}
      <div className="flex gap-2 pt-3">
        <input
          className="flex-1 border rounded px-3 py-2 text-base"
          placeholder="Type your message…"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button
          onClick={sendMessage}
          disabled={sending}
          className="bg-black text-white px-4 rounded text-sm disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
