"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/* ======================
   TYPES
====================== */

type MessageRow = {
  id: string;
  partner_uuid: string;
  sender: "partner" | "admin" | "system";
  message: string | null;
  image_url?: string | null;
  created_at: string;
};

type PartnerRow = {
  first_name: string | null;
  last_name: string | null;
};

/* ======================
   COMPONENT
====================== */

export default function AdminChatThreadPage() {
  const params = useParams();
  const partner_uuid = params?.partnerID as string;

  const [partner, setPartner] = useState<PartnerRow | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [composer, setComposer] = useState("");
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  /* ======================
     LOAD DATA
  ====================== */

  async function loadPartner() {
    const { data } = await supabase
      .from("partners")
      .select("first_name,last_name")
      .eq("partner_uuid", partner_uuid)
      .single();

    setPartner(data || null);
  }

  async function loadMessages() {
    const { data } = await supabase
      .from("partner_messages")
      .select("id,partner_uuid,sender,message,image_url,created_at")
      .eq("partner_uuid", partner_uuid)
      .order("created_at", { ascending: true });

    setMessages((data as MessageRow[]) || []);
    setLoading(false);
  }

  async function markThreadRead() {
    await supabase
      .from("partner_messages")
      .update({ is_read: true })
      .eq("partner_uuid", partner_uuid)
      .eq("sender", "partner")
      .eq("is_read", false);
  }

  useEffect(() => {
    if (!partner_uuid) return;

    setLoading(true);
    loadPartner();
    loadMessages();
    markThreadRead();

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(loadMessages, 2500);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [partner_uuid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  /* ======================
     SEND MESSAGE
  ====================== */

  async function sendMessage() {
    if (!composer.trim() || sending) return;

    setSending(true);

    await supabase.from("partner_messages").insert({
      partner_uuid,
      sender: "admin",
      message: composer.trim(),
    });

    setComposer("");
    setSending(false);
    loadMessages();
  }

  const partnerName = useMemo(() => {
    if (!partner) return "Partner";
    return `${partner.first_name || ""} ${partner.last_name || ""}`.trim();
  }, [partner]);

  if (!partner_uuid) return <div className="p-6">Invalid chat</div>;

  /* ======================
     RENDER
  ====================== */

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-white">
      {/* HEADER */}
      <div className="p-4 border-b">
        <div className="text-lg font-bold">{partnerName}</div>
        <div className="text-xs text-gray-500">{partner_uuid}</div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading && <div className="text-xs text-gray-500">Loading…</div>}

        {messages.map((m) => {
          const isAdmin = m.sender === "admin";
          return (
            <div
              key={m.id}
              className={`max-w-[80%] rounded border p-3 text-sm ${
                isAdmin
                  ? "ml-auto bg-gray-100 border-black"
                  : "bg-white"
              }`}
            >
              {m.message && <div>{m.message}</div>}
              <div className="text-[10px] mt-1 opacity-60">
                {new Date(m.created_at).toLocaleString()}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* COMPOSER */}
      <div className="border-t p-3 flex gap-2">
        <textarea
          className="flex-1 border rounded px-3 py-2"
          placeholder="Type message…"
          value={composer}
          rows={1}
          onChange={(e) => setComposer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        <button
          onClick={sendMessage}
          disabled={sending}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
