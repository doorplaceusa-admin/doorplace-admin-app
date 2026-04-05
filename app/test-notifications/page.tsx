"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Notification = {
  id: string;
  title: string | null;
  body: string | null;
  created_at: string;
  is_read: boolean | null;
};

export default function TestNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [status, setStatus] = useState("Loading...");
  const [userId, setUserId] = useState<string | null>(null);

  /* ============================
     LOAD USER + NOTIFICATIONS
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

      // ✅ NO FILTER HERE — RLS HANDLES IT
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, body, created_at, is_read")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("❌ Fetch error:", error);
        setStatus("Fetch error — check RLS");
        return;
      }

      console.log("✅ Notifications:", data);

      setNotifications(data || []);
      setStatus(`Loaded ${data?.length || 0} notifications`);
    };

    load();
  }, []);

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
            background: n.is_read ? "#f9f9f9" : "#fff",
          }}
        >
          <strong>{n.title || "No title"}</strong>
          <p>{n.body || "No message"}</p>
          <small>
            {new Date(n.created_at).toLocaleString()}
          </small>
        </div>
      ))}
    </div>
  );
}