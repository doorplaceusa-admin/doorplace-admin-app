"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ===============================
   TYPES
=============================== */
type Message = {
  id: string;
  sender: "partner" | "admin" | "system";
  message: string | null;
  image_url?: string | null;
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
  const isOnline = hour >= 9 && hour < 17;

  return {
    isOnline,
    label: isOnline
      ? "Support is online"
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

  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  const supportStatus = getSupportStatus();

  /* ===============================
     LOAD MESSAGES
  =============================== */
  async function loadMessages() {
    const { data, error } = await supabase
      .from("partner_messages")
      .select("id, sender, message, image_url, created_at")
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
      setMessages(data as Message[]);
    }

    setLoading(false);
  }

  /* ===============================
     SEND MESSAGE (TEXT + IMAGE)
  =============================== */
  async function sendMessage() {
    if ((!newMessage.trim() && !pendingImage) || sending) return;

    setSending(true);

    let imageUrl: string | null = null;

    if (pendingImage) {
      const ext = pendingImage.name.split(".").pop();
      const path = `partner/${partnerId}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("chat-uploads")
        .upload(path, pendingImage);

      if (!error) {
        imageUrl = path; // STORE ONLY PATH

      }
    }

    const sender = isAdmin ? "admin" : "partner";

    const { data: partner } = await supabase
      .from("partners")
      .select("company_id")
      .eq("partner_id", partnerId)
      .single();

    if (!partner?.company_id) {
      alert("Partner is not linked to a company.");
      setSending(false);
      return;
    }

    const { data, error } = await supabase
      .from("partner_messages")
      .insert({
        partner_id: partnerId,
        company_id: partner.company_id,
        sender,
        message: newMessage.trim() || null,
        image_url: imageUrl,
      })
      .select()
      .single();

    if (!error && data) {
      setNewMessage("");
      setPendingImage(null);
      setPreviewUrl(null);
      loadMessages();

      /* ===============================
         🔔 NOTIFY ALL ADMINS (FIX)
      =============================== */
      if (sender === "partner") {
        const { data: admins } = await supabase
          .from("company_users")
          .select("user_id")
          .eq("company_id", partner.company_id)
          .eq("role", "admin");

        
      }
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  /* ===============================
     UI
  =============================== */
  return (
    <div className="flex flex-col h-full">
      {/* SUPPORT STATUS */}
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

      {/* WELCOME */}
      <div className="border rounded bg-gray-100 p-3 text-sm mb-3">
        <strong>👋 Welcome!</strong>
        <p className="text-gray-700 mt-1">
          This is your direct line to Doorplace USA support.
          <br />
          Ask us anything — orders, commissions, leads, or help closing a sale.
        </p>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto border rounded bg-gray-50 p-3 space-y-2">
        {loading && (
          <p className="text-xs text-gray-500">Loading messages…</p>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-xs text-gray-500">
            No messages yet. Start the conversation.
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] p-2 rounded text-sm overflow-hidden ${
              m.sender === "partner"
                ? "ml-auto bg-gray-300 black-white"
                : m.sender === "system"
                ? "mx-auto bg-gray-200 text-gray-700 text-xs"
                : "bg-white border"
            }`}
          >
            {m.image_url && <ChatImage path={m.image_url} />}


           {m.message && (





  <div
    className="whitespace-pre-wrap wrap-break-word max-w-full"
    style={{
      overflowWrap: "anywhere",
      wordBreak: "break-word",
    }}
  >
    {m.message}
  </div>
)}





            <div className="text-[10px] opacity-70 mt-1">
              {new Date(m.created_at).toLocaleString()}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* IMAGE PREVIEW */}
      {previewUrl && (
        <div className="mt-2 relative w-fit">
          <img
            src={previewUrl}
            className="max-w-50 max-h-50 object-contain rounded border"
          />
          <button
            onClick={() => {
              setPendingImage(null);
              setPreviewUrl(null);
            }}
            className="absolute top-1 right-1 bg-black text-white text-xs rounded-full px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* INPUT */}
      <div className="flex gap-2 pt-3">
        <input
          className="flex-1 border rounded px-3 py-2 text-base"
          placeholder="Type your message…"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setPendingImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            e.target.value = "";
          }}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="border rounded px-3 py-2"
          disabled={sending}
        >
          📷
        </button>

        <button
          onClick={sendMessage}
          disabled={sending}
          className="bg-black text-white px-4 rounded text-sm disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}

function ChatImage({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    supabase.storage
      .from("chat-uploads")
      .createSignedUrl(path, 60 * 10) // 10 minutes
      .then(({ data }) => {
        if (active) setUrl(data?.signedUrl ?? null);
      });

    return () => {
      active = false;
    };
  }, [path]);

  if (!url) return null;

  return (
    <img
      src={url}
      alt="upload"
      className="max-w-65 max-h-80 object-contain rounded border mb-1"
    />
  );
}
