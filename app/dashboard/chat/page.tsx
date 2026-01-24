"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ======================
   TYPES
====================== */

type InboxRow = {
  partner_id: string; // ✅ PRIMARY KEY
  first_name: string;
  last_name: string;
  email_address: string;
  last_message: string | null;
  last_message_at: string;
  unread_count: number;
  pinned?: boolean;
};


type SortMode = "unread" | "latest" | "name";

/* ======================
   COMPONENT
====================== */

export default function AdminChatInboxPage() {
  const [rows, setRows] = useState<InboxRow[]>([]);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("unread");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [busyPin, setBusyPin] = useState<string | null>(null);

  // swipe state
  const startX = useRef(0);
  const startY = useRef(0);
  const swiping = useRef(false);
  const swipedPartnerUuid = useRef<string | null>(null);

  /* ======================
     LOAD INBOX
  ====================== */

  async function loadInbox() {
    const { data, error } = await supabase
      .from("admin_chat_inbox")
      .select("*")
      .order("last_message_at", { ascending: false });

    if (!error && data) {
      setRows(data as InboxRow[]);
    }
  }

  useEffect(() => {
    loadInbox();

    const channel = supabase
      .channel("admin-chat-inbox")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_chat_inbox" },
        loadInbox
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ======================
     PIN / UNPIN
  ====================== */

  type InboxRow = {
  partner_id: string; // ✅ PRIMARY KEY
  first_name: string;
  last_name: string;
  email_address: string;
  last_message: string | null;
  last_message_at: string;
  unread_count: number;
  pinned?: boolean;
};async function togglePin(partner_id: string, pinned?: boolean) {
  setBusyPin(partner_id);

  if (pinned) {
    await supabase
      .from("admin_chat_pins")
      .delete()
      .eq("partner_id", partner_id);
  } else {
    await supabase
      .from("admin_chat_pins")
      .insert({ partner_id });
  }

  await loadInbox();
  setBusyPin(null);
}


  /* ======================
     MARK READ
  ====================== */

  async function markRead(partner_id: string) {
  await supabase
    .from("partner_messages")
    .update({ is_read: true })
    .eq("partner_id", partner_id)
    .eq("sender", "partner")
    .eq("is_read", false);

  await loadInbox();
}


  /* ======================
     FILTER + SORT
  ====================== */

  const filteredRows = useMemo(() => {
    let data = [...rows];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) ||
          r.partner_id.toLowerCase().includes(q) ||
          r.email_address.toLowerCase().includes(q)
      );
    }

    if (showUnreadOnly) {
      data = data.filter((r) => r.unread_count > 0);
    }

    data.sort((a, b) => {
      // pinned always first
      if ((a.pinned ?? false) !== (b.pinned ?? false)) {
        return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
      }

      if (sortMode === "unread") {
        return b.unread_count - a.unread_count;
      }

      if (sortMode === "latest") {
        return (
          new Date(b.last_message_at).getTime() -
          new Date(a.last_message_at).getTime()
        );
      }

      return `${a.first_name} ${a.last_name}`.localeCompare(
        `${b.first_name} ${b.last_name}`
      );
    });

    return data;
  }, [rows, search, sortMode, showUnreadOnly]);

  /* ======================
     SWIPE HANDLERS
  ====================== */

  function onTouchStartRow(e: React.TouchEvent, partner_uuid: string) {
    const t = e.touches[0];
    startX.current = t.clientX;
    startY.current = t.clientY;
    swiping.current = false;
    swipedPartnerUuid.current = partner_uuid;
  }

  function onTouchMoveRow(e: React.TouchEvent) {
    const t = e.touches[0];
    const dx = t.clientX - startX.current;
    const dy = t.clientY - startY.current;

    if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) {
      swiping.current = false;
      return;
    }

    if (Math.abs(dx) > 24 && Math.abs(dx) > Math.abs(dy)) {
      swiping.current = true;
      e.preventDefault();
    }
  }

  async function onTouchEndRow(
    e: React.TouchEvent,
    partner_uuid: string,
    pinned?: boolean
  ) {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - startX.current;
    const dy = endY - startY.current;

    const isHorizontalSwipe =
      Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5;

    if (isHorizontalSwipe && swipedPartnerUuid.current === partner_uuid) {
      e.preventDefault();
      e.stopPropagation();
      await togglePin(partner_uuid, pinned);
    }

    swiping.current = false;
    swipedPartnerUuid.current = null;
  }

  function onClickRow(partner_id: string) {
  if (swiping.current) return;

  markRead(partner_id);
  window.location.href = `/dashboard/chat/${partner_id}`;
}


  /* ======================
     RENDER
  ====================== */

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50 overflow-x-hidden max-w-[1500px] w-full mx-auto">
      {/* HEADER */}
      <div className="sticky top-0 bg-white z-30 border-b pb-4">
        <h1 className="text-xl font-bold text-red-700">Partner Live Chat</h1>

        <input
          className="border rounded px-3 py-2 text-sm w-full"
          placeholder="Search name, email, or partner ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex gap-2 text-sm">
          <select
            className="border rounded px-2 py-1"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
          >
            <option value="unread">Unread</option>
            <option value="latest">Latest</option>
            <option value="name">Name</option>
          </select>

          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
            />
            Unread only
          </label>
        </div>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredRows.map((r) => (
          <div
            key={r.partner_id}
            className={`bg-white border rounded p-3 flex justify-between items-center ${
              r.unread_count > 0 ? "border-red-500" : ""
            }`}
            onTouchStart={(e) => onTouchStartRow(e, r.partner_id)}
            onTouchMove={onTouchMoveRow}
            onTouchEnd={(e) => onTouchEndRow(e, r.partner_id, r.pinned)}
            onClick={() => onClickRow(r.partner_id)}
          >
            {/* LEFT */}
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate flex items-center gap-1">
                {r.pinned && <span>📌</span>}
                <span>
                  {r.first_name} {r.last_name}
                </span>
              </div>
              <div className="text-xs text-gray-500 truncate">
                {r.last_message || "No messages yet"}
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex flex-col items-end text-xs gap-1">
              <div>{new Date(r.last_message_at).toLocaleDateString()}</div>

              {r.unread_count > 0 && (
                <span className="bg-red-600 text-white px-2 rounded-full">
                  {r.unread_count}
                </span>
              )}

              <button
                type="button"
                className="text-[11px] underline text-gray-500"
                disabled={busyPin === r.partner_id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  togglePin(r.partner_id, r.pinned);
                }}
              >
                {busyPin === r.partner_id
                  ? "Saving..."
                  : r.pinned
                  ? "Unpin"
                  : "Pin"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
