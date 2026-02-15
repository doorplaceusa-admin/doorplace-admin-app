"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Sender = "partner" | "admin" | "system";

type Message = {
  id: string;
  partner_id: string;
  company_id: string | null;
  sender: Sender | null;
  message: string | null;
  image_url: string | null;
  created_at: string | null;
};

type PartnerRecord = {
  partner_id: string | null;
  first_name: string | null;
  last_name: string | null;
  company_id: string | null;
};

function getDisplayName(p: PartnerRecord | null) {
  const name = `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim();
  return name || "Partner";
}

export default function PartnerMessages({
  partnerId,
  isAdmin = false,
  showHeader = false,
  headerName,
  allowDelete = true,
  allowEdit = true,
}: {
  partnerId: string;
  isAdmin?: boolean;
  showHeader?: boolean;
  headerName?: string;
  allowDelete?: boolean;
  allowEdit?: boolean;
}) {
  const [partner, setPartner] = useState<PartnerRecord | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit UI
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sender: Sender = isAdmin ? "admin" : "partner";

  async function loadPartner() {
    const { data, error } = await supabase
      .from("partners")
      .select("partner_id,first_name,last_name,company_id")
      .eq("partner_id", partnerId)
      .single();

    if (!error && data) setPartner(data as PartnerRecord);
  }

  async function loadMessages() {
    const { data, error } = await supabase
      .from("partner_messages")
      .select("id,partner_id,company_id,sender,message,image_url,created_at")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: true });

    if (!error && data) setMessages(data as Message[]);
    setLoading(false);
  }

  // IMPORTANT: show upload/insert errors so you can SEE why pictures fail
  function setErr(e: unknown) {
    const msg =
      typeof e === "string"
        ? e
        : (e as any)?.message || (e as any)?.error_description || "Unknown error";
    setErrorMsg(msg);
  }

  async function sendMessage() {
    setErrorMsg(null);

    const hasText = !!text.trim();
    const hasImage = !!pendingImage;

    if ((!hasText && !hasImage) || sending) return;

    setSending(true);

    try {
      // Must have partner company_id (you confirmed all partners do)
      let companyId = partner?.company_id ?? null;

      if (!companyId) {
        const { data: p2, error: pErr } = await supabase
          .from("partners")
          .select("company_id,first_name,last_name,partner_id")
          .eq("partner_id", partnerId)
          .single();

        if (pErr) throw pErr;
        setPartner(p2 as PartnerRecord);
        companyId = (p2 as any)?.company_id ?? null;
      }

      if (!companyId) {
        throw new Error("Partner is not linked to a company_id.");
      }

      // 1) Upload image (optional)
      let imagePath: string | null = null;

      if (pendingImage) {
        const ext = pendingImage.name.split(".").pop() || "jpg";
        const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, "");
        const objectName = `partner/${partnerId}/${crypto.randomUUID()}.${safeExt}`;

        const uploadRes = await supabase.storage
          .from("chat-uploads")
          .upload(objectName, pendingImage, {
            cacheControl: "3600",
            upsert: false,
            contentType: pendingImage.type || "image/jpeg",
          });

        if (uploadRes.error) throw uploadRes.error;

        imagePath = objectName;
      }

      // 2) Insert message row
      const insertRes = await supabase
        .from("partner_messages")
        .insert({
          partner_id: partnerId,
          company_id: companyId,
          sender,
          message: hasText ? text.trim() : null,
          image_url: imagePath,
          // keep your existing column usage compatible:
          is_read: false,
        })
        .select("id,partner_id,company_id,sender,message,image_url,created_at")
        .single();

      if (insertRes.error) throw insertRes.error;

      // Reset UI
      setText("");
      setPendingImage(null);
      setPreviewUrl(null);

      // Update list (append)
      const newRow = insertRes.data as Message;
      setMessages((prev) => [...prev, newRow]);
    } catch (e) {
      setErr(e);
    } finally {
      setSending(false);
    }
  }

  async function deleteMessage(messageId: string) {
    setErrorMsg(null);
    try {
      const { error } = await supabase
        .from("partner_messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (e) {
      setErr(e);
    }
  }

  async function startEdit(m: Message) {
    setEditingId(m.id);
    setEditingText(m.message ?? "");
  }

  async function cancelEdit() {
    setEditingId(null);
    setEditingText("");
  }

  async function saveEdit(messageId: string) {
    setErrorMsg(null);
    try {
      const newVal = editingText.trim();
      if (!newVal) return;

      // NOTE: Requires an UPDATE policy in Supabase.
      const { data, error } = await supabase
        .from("partner_messages")
        .update({ message: newVal })
        .eq("id", messageId)
        .select("id,partner_id,company_id,sender,message,image_url,created_at")
        .single();

      if (error) throw error;

      setMessages((prev) => prev.map((m) => (m.id === messageId ? (data as any) : m)));
      await cancelEdit();
    } catch (e) {
      setErr(e);
    }
  }

  // Realtime (so it works reliably without polling)
  useEffect(() => {
    if (!partnerId) return;

    loadPartner();
    loadMessages();

    const channel = supabase
      .channel(`partner-messages-${partnerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "partner_messages",
          filter: `partner_id=eq.${partnerId}`,
        },
        (payload) => {
          const row = payload.new as any as Message;
          setMessages((prev) => {
            // de-dupe
            if (prev.some((x) => x.id === row.id)) return prev;
            return [...prev, row];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "partner_messages",
          filter: `partner_id=eq.${partnerId}`,
        },
        (payload) => {
          const oldRow = payload.old as any;
          setMessages((prev) => prev.filter((m) => m.id !== oldRow.id));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "partner_messages",
          filter: `partner_id=eq.${partnerId}`,
        },
        (payload) => {
          const row = payload.new as any as Message;
          setMessages((prev) => prev.map((m) => (m.id === row.id ? row : m)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const displayName = useMemo(() => headerName || getDisplayName(partner), [headerName, partner]);

  return (
    <div className="flex flex-col h-full">
      {showHeader && (
        <div className="border-b pb-3 mb-3">
          <div className="text-lg font-semibold">{displayName}</div>
          <div className="text-xs text-gray-500">{partnerId}</div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-2 text-sm border border-red-300 bg-red-50 text-red-800 p-2 rounded">
          {errorMsg}
        </div>
      )}

      <div className="flex-1 overflow-y-auto border rounded bg-gray-50 p-3 space-y-2">
        {loading && <div className="text-xs text-gray-500">Loading messages…</div>}

        {!loading && messages.length === 0 && (
          <div className="text-xs text-gray-500">No messages yet. Start the conversation.</div>
        )}

        {messages.map((m) => {
          const mine = (m.sender ?? "system") === sender;
          const isSystem = (m.sender ?? "system") === "system";

          return (
            <div
              key={m.id}
              className={`max-w-[82%] p-2 rounded text-sm overflow-hidden ${
                isSystem
                  ? "mx-auto bg-gray-200 text-gray-700 text-xs"
                  : mine
                  ? "ml-auto bg-gray-300"
                  : "bg-white border"
              }`}
            >
              {m.image_url && <ChatImage path={m.image_url} />}

              {editingId === m.id ? (
                <div className="space-y-2">
                  <textarea
                    className="w-full border rounded px-2 py-1 text-sm"
                    rows={3}
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 rounded bg-black text-white text-xs"
                      onClick={() => saveEdit(m.id)}
                    >
                      Save
                    </button>
                    <button className="px-3 py-1 rounded border text-xs" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                m.message && (
                  <div
                    className="whitespace-pre-wrap wrap-break-word max-w-full"
                    style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
                  >
                    {m.message}
                  </div>
                )
              )}

              <div className="text-[10px] opacity-70 mt-1 flex items-center justify-between gap-2">
                <span>{m.created_at ? new Date(m.created_at).toLocaleString() : ""}</span>

                {!isSystem && (allowDelete || allowEdit) && (
                  <div className="flex gap-2">
                    {allowEdit && mine && editingId !== m.id && (
                      <button
                        className="underline text-[10px]"
                        onClick={() => startEdit(m)}
                        type="button"
                      >
                        Edit
                      </button>
                    )}
                    {allowDelete && (
                      <button
                        className="underline text-[10px]"
                        onClick={() => deleteMessage(m.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* IMAGE PREVIEW */}
      {previewUrl && (
        <div className="mt-2 relative w-fit">
          <img src={previewUrl} className="max-w-55 max-h-55 object-contain rounded border" />
          <button
            onClick={() => {
              setPendingImage(null);
              setPreviewUrl(null);
            }}
            className="absolute top-1 right-1 bg-black text-white text-xs rounded-full px-2"
            type="button"
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
          value={text}
          onChange={(e) => setText(e.target.value)}
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
          type="button"
        >
          📷
        </button>

        <button
          onClick={sendMessage}
          disabled={sending}
          className="bg-black text-white px-4 rounded text-sm disabled:opacity-50"
          type="button"
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

    (async () => {
      const { data, error } = await supabase.storage
        .from("chat-uploads")
        .createSignedUrl(path, 60 * 10);

      if (!active) return;
      if (error) {
        setUrl(null);
        return;
      }
      setUrl(data?.signedUrl ?? null);
    })();

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
