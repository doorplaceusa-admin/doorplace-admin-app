"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Notification = {
  id: string;
  title: string | null;
  body: string | null;
  created_at: string;
  is_read: boolean | null;
  user_id?: string;
};

export default function TestNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [status, setStatus] = useState("Loading...");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      console.log("🚀 STARTING LOAD...");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("❌ Auth error:", userError);
        setStatus("No authenticated user");
        return;
      }

      console.log("🟢 USER:", user);

      setUserId(user.id);

      // 🔥 DEBUG: try BOTH versions
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, body, created_at, is_read, user_id")
        // 🔴 TEMP: FORCE FILTER (helps debug RLS issues)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("❌ FETCH ERROR:", error);
        setStatus("Fetch error — check console");
        return;
      }

      console.log("✅ RAW DATA:", data);

      if (!data || data.length === 0) {
        console.warn("⚠️ NO DATA RETURNED");
      }

      setNotifications(data || []);
      setStatus(`Loaded ${data?.length || 0} notifications`);
    };

    load();
  }, []);

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

          <div style={{ fontSize: 12, color: "#666" }}>
            <div>ID: {n.id}</div>
            <div>User: {n.user_id}</div>
            <div>
              {new Date(n.created_at).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}