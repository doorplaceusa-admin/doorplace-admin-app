// app/dashboard/chat/[partnerID]/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/* ======================
   TYPES
====================== */

type MessageRow = {
  id: string;
  partner_id: string;
  sender: "partner" | "admin" | "system";
  message: string | null;
  image_url?: string | null;
  created_at: string;
};

type PartnerRow = {
  first_name: string | null;
  last_name: string | null;
  partner_id: string | null;
};

const LS_KEY = "tp_admin_pinned_message_ids_v1";

/* ======================
   HELPERS
====================== */

function isUrl(token: string) {
  return /^https?:\/\/\S+$/i.test(token);
}
function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp)$/i.test(url.split("?")[0] || "");
}

/* ======================
   SUPPORT STATUS
====================== */

function SupportStatus() {
  const now = new Date();
  const cst = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Chicago" })
  );
  const hour = cst.getHours();
  const isOnline = hour >= 9 && hour < 17;

  return (
    <div className="px-4 pt-3">
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <span
          className={`h-2 w-2 rounded-full ${
            isOnline ? "bg-green-500" : "bg-gray-400"
          }`}
        />
        <span>
          {isOnline
            ? "Support is online • Typical response within minutes"
            : "After hours • You may still message us"}
        </span>
      </div>
      <div className="text-[11px] text-gray-400 mt-1">
        Live chat hours: 9:00 AM – 5:00 PM CST
      </div>
    </div>
  );
}

/* ======================
   MAIN PAGE
====================== */

export default function AdminChatThreadPage() {
  const params = useParams();
  const partnerId = (params?.partnerID as string) || "";

  const [partner, setPartner] = useState<PartnerRow | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [composer, setComposer] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const [sendStatus, setSendStatus] = useState<
  "idle" | "uploading" | "sending"
>("idle");






  /* ======================
     PIN STATE
  ====================== */

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setPinnedIds(new Set(arr));
      }
    } catch {}
  }, []);

  function persistPinned(next: Set<string>) {
    setPinnedIds(next);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(Array.from(next)));
    } catch {}
  }

  function togglePinMessage(messageId: string) {
    const next = new Set(pinnedIds);
    next.has(messageId) ? next.delete(messageId) : next.add(messageId);
    persistPinned(next);
  }

  /* ======================
     DATA LOAD
  ====================== */

  async function markThreadRead() {
  if (!partnerId) return;

  await supabase
    .from("partner_messages")
    .update({ is_read: true })
    .eq("partner_id", partnerId)
    .eq("sender", "partner");
}


  async function loadPartner() {
    const { data } = await supabase
      .from("partners")
      .select("first_name,last_name,partner_id")
      .eq("partner_id", partnerId)
      .single();

    setPartner((data as PartnerRow) || null);
  }

  async function loadMessages() {
    const { data } = await supabase
      .from("partner_messages")
      .select("id, partner_id, sender, message, image_url, created_at")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: true });

    setMessages((data as MessageRow[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    if (!partnerId) return;

    setLoading(true);
    loadPartner();
    loadMessages();
    markThreadRead();

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(loadMessages, 2500);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [partnerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  /* ======================
     EDIT / DELETE
  ====================== */

  async function startEdit(m: MessageRow) {
    setEditingId(m.id);
    setComposer(m.message || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setComposer("");
  }

  async function saveEdit() {
    if (!editingId || !composer.trim()) return;

    setSending(true);
    await supabase
      .from("partner_messages")
      .update({ message: composer.trim() })
      .eq("id", editingId);

    setSending(false);
    setEditingId(null);
    setComposer("");
    loadMessages();
  }

  async function deleteMessage(messageId: string) {
    await supabase.from("partner_messages").delete().eq("id", messageId);

    if (pinnedIds.has(messageId)) {
      const next = new Set(pinnedIds);
      next.delete(messageId);
      persistPinned(next);
    }

    loadMessages();
  }

  /* ======================
     SEND MESSAGE
  ====================== */

  async function sendMessage() {
  if (sending) return;
  if (!composer.trim() && !pendingImage) return;

  setSending(true);
  setSendStatus(pendingImage ? "uploading" : "sending");

  let imageUrl: string | null = null;


    if (pendingImage) {
      const ext = pendingImage.name.split(".").pop();
      const path = `admin/${partnerId}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("chat-uploads")
        .upload(path, pendingImage);

      if (!error) {
        const { data } = await supabase.storage
  .from("chat-uploads")
  .createSignedUrl(path, 60 * 60 * 24 * 30); // 30 days

imageUrl = data?.signedUrl || null;

      }
    }

    await supabase.from("partner_messages").insert({
      partner_id: partnerId,
      sender: "admin",
      message: composer.trim() || null,
      image_url: imageUrl,
    });

    setComposer("");
    setPendingImage(null);
    setPreviewUrl(null);
    setSendStatus("idle")
    setSending(false);

    loadMessages();
  }

  /* ======================
     RENDER MESSAGE CONTENT
  ====================== */

  function renderMessageContent(m: MessageRow) {
  return (
    <div className="space-y-2">
      {m.image_url && (
        <img
          src={m.image_url}
          className="max-w-[260px] max-h-[320px] object-contain rounded border"
          alt="upload"
        />
      )}

      {m.message && (
        <div className="break-words">
          {m.message.split(/\s+/).map((t, i) =>
            isUrl(t) ? (
              <a
                key={i}
                href={t}
                target="_blank"
                rel="noreferrer"
                className="underline break-all"
              >
                {t}{" "}
              </a>
            ) : (
              <span key={i}>{t} </span>
            )
          )}
        </div>
      )}
    </div>
  );
}


  /* ======================
     SORT PINNED
  ====================== */

  const sortedMessages = useMemo(() => {
    const pinned: MessageRow[] = [];
    const normal: MessageRow[] = [];

    for (const m of messages) {
      pinnedIds.has(m.id) ? pinned.push(m) : normal.push(m);
    }

    return [...pinned, ...normal];
  }, [messages, pinnedIds]);

  const partnerDisplayName = useMemo(() => {
    const fn = partner?.first_name?.trim() || "";
    const ln = partner?.last_name?.trim() || "";
    return `${fn} ${ln}`.trim() || "Partner";
  }, [partner]);

  if (!partnerId) return <div className="p-6">Invalid partner</div>;

  /* ======================
     RENDER
  ====================== */

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-white overflow-hidden max-w-[100vw]">
      {/* HEADER */}
      <div className="p-4 border-b">
        <div className="text-lg font-bold">{partnerDisplayName}</div>
        <div className="text-xs text-gray-500">Partner ID: {partnerId}</div>
      </div>

      <SupportStatus />

      {/* WELCOME */}
      <div className="mx-4 mt-3 mb-2 border rounded bg-gray-100 p-4 text-sm">
        <strong>👋 Welcome!</strong>
        <div className="text-gray-700 mt-1">
          This is your direct line to Doorplace USA support.
          <br />
          Use this chat for sales help, closing deals, order questions,
          commissions, resources, or anything you need to succeed fast.
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {loading && (
          <div className="text-xs text-gray-500">Loading messages…</div>
        )}

        {sortedMessages.map((m) => {
          const isAdmin = m.sender === "admin";
          const isPinned = pinnedIds.has(m.id);

          return (
            <div
              key={m.id}
              className={`rounded border p-3 text-sm max-w-[85%] ${
                isAdmin
                  ? "ml-auto bg-gray-100 text-black border-black"
                  : "bg-white"
              }`}
            >
              {isPinned && (
                <div className="text-[10px] mb-1 opacity-80">📌 Pinned</div>
              )}

              {renderMessageContent(m)}

              <div className="text-[10px] mt-2 opacity-70">
                {new Date(m.created_at).toLocaleString()}
              </div>

              <div className="flex gap-3 mt-2 text-xs underline">
                <button onClick={() => togglePinMessage(m.id)}>
                  {isPinned ? "Unpin" : "Pin"}
                </button>
                <button onClick={() => startEdit(m)}>Edit</button>
                <button onClick={() => deleteMessage(m.id)}>Delete</button>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* COMPOSER */}
      <div className="border-t p-3 bg-white">
        {editingId && (
          <div className="mb-2 text-xs flex justify-between">
            <span>Editing message…</span>
            <button onClick={cancelEdit} className="underline">
              Cancel
            </button>
          </div>
        )}

        {previewUrl && (
          <div className="mb-2 relative w-fit">
            <img
  src={previewUrl}
  className="max-w-[260px] max-h-[50px] object-contain rounded border"
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

{sendStatus !== "idle" && (
  <div className="mb-2 text-xs flex items-center gap-2 text-gray-600">
    <span className="animate-spin">⏳</span>
    {sendStatus === "uploading"
      ? "Uploading image…"
      : "Sending message…"}
  </div>
)}


        <div className="flex gap-2 items-end">
          <textarea
            className="flex-1 border rounded px-3 py-2"
            placeholder="Type your message…"
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                editingId ? saveEdit() : sendMessage();
              }
            }}
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
  onClick={() => (editingId ? saveEdit() : sendMessage())}
  className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
  disabled={sending}
>
  {sendStatus === "uploading"
    ? "Uploading…"
    : sendStatus === "sending"
    ? "Sending…"
    : editingId
    ? "Save"
    : "Send"}
</button>

        </div>

        <div className="text-[11px] text-gray-400 mt-2">
          Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
