"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Message = {
  id: string;
  sender: "partner" | "admin";
  message: string;
  created_at: string;
};

export default function PartnerMessages({
  partnerId,
  isAdmin = false,
}: {
  partnerId: string;
  isAdmin?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  /* -----------------------------
     LOAD MESSAGES
  ------------------------------*/
  async function loadMessages() {
    const { data, error } = await supabase
      .from("partner_messages")
      .select("id, sender, message, created_at")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data as Message[]);
    }

    setLoading(false);
  }

  /* -----------------------------
     SEND MESSAGE (FIXED)
  ------------------------------*/
  async function sendMessage() {
  if (!newMessage.trim() || sending) return;

  setSending(true);

  const { error } = await supabase
    .from("partner_messages")
    .insert({
      partner_id: partnerId,
      message: newMessage.trim(),
      sender: isAdmin ? "admin" : "partner",
    });

  if (error) {
    console.error("Send failed:", error);
  } else {
    setNewMessage("");
    loadMessages();
  }

  setSending(false);
}


  /* -----------------------------
     POLLING (SIMPLE + STABLE)
  ------------------------------*/
  useEffect(() => {
    if (!partnerId) return;

    loadMessages();

    pollRef.current = setInterval(() => {
      loadMessages();
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [partnerId]);

  /* -----------------------------
     UI
  ------------------------------*/
  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto border rounded bg-gray-50 p-3 space-y-2">
        {loading && (
          <p className="text-xs text-gray-500">Loading…</p>
        )}

        {!loading && messages.length === 0 && (
          <p className="text-xs text-gray-500">
            No messages yet. Start the conversation.
          </p>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] p-2 rounded text-sm ${
              m.sender === "partner"
                ? "ml-auto bg-red-600 text-white"
                : "bg-white border"
            }`}
          >
            <div>{m.message}</div>
            <div className="text-[10px] opacity-70 mt-1">
              {new Date(m.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-3">
        <input
          className="flex-1 border rounded px-3 py-2 text-sm"
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
