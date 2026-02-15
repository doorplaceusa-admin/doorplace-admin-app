"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type InboxRow = {
  partner_id: string;
  last_message: string | null;
  last_message_at: string;
  unread_count: number;
};

type PartnerMini = {
  partner_id: string | null;
  first_name: string | null;
  last_name: string | null;
};

type SortMode = "unread" | "latest";

export default function AdminChatInboxPage() {
  const [rows, setRows] = useState<InboxRow[]>([]);
  const [partnerMap, setPartnerMap] = useState<Record<string, PartnerMini>>({});
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("unread");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  async function loadInbox() {
    const { data } = await supabase
      .from("admin_partner_inbox")
      .select("*")
      .order("last_message_at", { ascending: false });

    const list = (data ?? []) as InboxRow[];
    setRows(list);

    // Fetch partner names for the visible partner_ids
    const partnerIds = Array.from(new Set(list.map((r) => r.partner_id))).filter(Boolean);

    if (partnerIds.length) {
      const { data: partners } = await supabase
        .from("partners")
        .select("partner_id,first_name,last_name")
        .in("partner_id", partnerIds);

      const map: Record<string, PartnerMini> = {};
      (partners ?? []).forEach((p) => {
        if (p.partner_id) map[p.partner_id] = p as PartnerMini;
      });
      setPartnerMap(map);
    }
  }

  useEffect(() => {
    loadInbox();

    const channel = supabase
      .channel("admin-partner-inbox")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "partner_messages" },
        loadInbox
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredRows = useMemo(() => {
    let data = [...rows];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((r) => {
        const p = partnerMap[r.partner_id];
        const name = `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim().toLowerCase();
        return r.partner_id.toLowerCase().includes(q) || name.includes(q);
      });
    }

    if (showUnreadOnly) {
      data = data.filter((r) => r.unread_count > 0);
    }

    data.sort((a, b) => {
      if (sortMode === "unread") return b.unread_count - a.unread_count;
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });

    return data;
  }, [rows, search, sortMode, showUnreadOnly, partnerMap]);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50 max-w-300 mx-auto">
      <div className="sticky top-0 bg-white border-b p-4 z-20">
        <h1 className="text-xl font-bold text-red-700">Partner Messages</h1>

        <input
          className="border rounded px-3 py-2 text-sm w-full mt-2"
          placeholder="Search partner name or partner ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex gap-3 text-sm mt-3">
          <select
            className="border rounded px-2 py-1"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
          >
            <option value="unread">Unread</option>
            <option value="latest">Latest</option>
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

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredRows.map((r) => {
          const p = partnerMap[r.partner_id];
          const partnerName = `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim() || "Partner";

          return (
            <div
              key={r.partner_id}
              className={`bg-white border rounded p-3 cursor-pointer flex justify-between ${
                r.unread_count > 0 ? "border-red-500" : ""
              }`}
              onClick={() => {
                window.location.href = `/dashboard/chat/${r.partner_id}`;
              }}
            >
              <div className="min-w-0">
                <div className="font-semibold truncate">{partnerName}</div>
                <div className="text-xs text-gray-500 truncate">{r.partner_id}</div>
                <div className="text-xs text-gray-500 truncate mt-1">
                  {r.last_message || "No message preview"}
                </div>
              </div>

              <div className="flex flex-col items-end text-xs gap-1">
                <div>{new Date(r.last_message_at).toLocaleDateString()}</div>

                {r.unread_count > 0 && (
                  <span className="bg-red-600 text-white px-2 rounded-full">
                    {r.unread_count}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
