"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type InboxRow = {
  partner_id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
};

export default function AdminChatInboxPage() {
  const [rows, setRows] = useState<InboxRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadInbox() {
    const { data, error } = await supabase
      .from("admin_chat_inbox")
      .select("*")
      .order("last_message_at", { ascending: false });

    if (!error) setRows(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadInbox();
  }, []);

  if (loading) return <div className="p-6">Loading chats…</div>;

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold text-red-700">Live Chat Inbox</h1>

      {rows.map((r) => (
        <div
          key={r.partner_id}
          className="bg-white border rounded p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
          onClick={() =>
            window.location.href = `/dashboard/chat/${r.partner_id}`
          }
        >
          <div>
            <div className="font-semibold">
              {r.first_name} {r.last_name}
            </div>
            <div className="text-xs text-gray-500">
              {r.last_message || "No messages yet"}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-gray-500">
              {new Date(r.last_message_at).toLocaleString()}
            </div>

            {r.unread_count > 0 && (
              <span className="inline-block mt-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                {r.unread_count}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
