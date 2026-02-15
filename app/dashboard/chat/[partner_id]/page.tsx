"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import PartnerMessages from "app/partners/dashboard/components/PartnerMessages";


type MessageRow = {
  id: string;
  sender: "partner" | "admin";
  message: string | null;
  created_at: string;
};

type PartnerInfo = {
  first_name: string | null;
  last_name: string | null;
};

export default function AdminChatThreadPage() {
  const { partner_id } = useParams<{ partner_id: string }>();

  const [partner, setPartner] = useState<PartnerInfo | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [composer, setComposer] = useState("");
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function loadPartner() {
    const { data } = await supabase
      .from("partners")
      .select("first_name,last_name")
      .eq("partner_id", partner_id)
      .single();

    if (data) setPartner(data);
  }

  async function loadMessages() {
    const { data } = await supabase
      .from("partner_messages")
      .select("id,sender,message,created_at")
      .eq("partner_id", partner_id)
      .order("created_at", { ascending: true });

    if (data) setMessages(data as MessageRow[]);
  }

  async function markRead() {
    await supabase
      .from("partner_messages")
      .update({ is_read: true })
      .eq("partner_id", partner_id)
      .eq("sender", "partner")
      .eq("is_read", false);
  }

  async function sendMessage() {
    if (!composer.trim() || sending) return;

    setSending(true);

    await supabase.from("partner_messages").insert({
      partner_id,
      sender: "admin",
      message: composer.trim(),
    });

    setComposer("");
    setSending(false);
    await loadMessages();
  }

  useEffect(() => {
    loadPartner();
    loadMessages();
    markRead();

    const channel = supabase
      .channel(`partner-thread-${partner_id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "partner_messages" },
        (payload) => {
          if (payload.new.partner_id === partner_id) {
            setMessages((prev) => [...prev, payload.new as MessageRow]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partner_id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const partnerName =
    partner && (partner.first_name || partner.last_name)
      ? `${partner.first_name ?? ""} ${partner.last_name ?? ""}`.trim()
      : "Partner";

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-white max-w-300 mx-auto">
      {/* HEADER */}
      <div className="border-b p-4">
        <div className="text-lg font-semibold">{partnerName}</div>
        <div className="text-xs text-gray-500">{partner_id}</div>
      </div>

      {/* CHAT (TEXT + IMAGES) */}
<div className="flex-1 p-4">
  <PartnerMessages partnerId={partner_id} isAdmin />
</div>


      {/* COMPOSER */}
      <div className="border-t p-3 flex gap-2">
        <textarea
          className="flex-1 border rounded px-3 py-2"
          rows={1}
          placeholder="Type reply…"
          value={composer}
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
