"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Notification = {
  id: string;
  title: string | null;
  message: string | null;
  type: string | null;
  created_at: string;
  read: boolean | null;
  recipient_user_id: string;
};

export default function TestNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [status, setStatus] = useState("Loading...");
  const [userId, setUserId] = useState<string | null>(null);

  /* ============================
     1️⃣ LOAD USER + NOTIFICATIONS
  ============================ */
  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("❌ Auth error:", userError);
        setStatus("No authenticated user");
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("❌ Fetch error:", error);
        setStatus("Fetch error — check RLS");
        return;
      }

      setNotifications(data || []);
      setStatus(`Loaded ${data?.length || 0} notifications`);
    };

    load();
  }, []);

  /* ============================
     2️⃣ REALTIME LISTENER
  ============================ */
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("test-notifications-live")
      .on(
  "postgres_changes",
  {
    event: "INSERT",
    schema: "public",
    table: "notifications",
  },
        (payload) => {
          console.log("🔥 REALTIME NOTIFICATION:", payload.new);
          setNotifications((prev) => [
            payload.new as Notification,
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  /* ============================
     UI
  ============================ */
  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <h1>🔔 Notification Test Page</h1>

      <p><strong>Status:</strong> {status}</p>
      <p><strong>User ID:</strong> {userId || "Not loaded"}</p>

      <hr />

      {notifications.length === 0 && (
        <p>No notifications found.</p>
      )}

      {notifications.map((n) => (
        <div
          key={n.id}
          style={{
            border: "1px solid #ddd",
            padding: 12,
            marginBottom: 10,
            borderRadius: 6,
            background: n.read ? "#f9f9f9" : "#fff",
          }}
        >
          <strong>{n.title || "No title"}</strong>
          <p>{n.message || "No message"}</p>
          <small>
            {new Date(n.created_at).toLocaleString()}
          </small>
        </div>
      ))}
    </div>
  );
}
