"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import PartnerMessages from "@/app/partners/dashboard/components/PartnerMessages";
import { supabase } from "@/lib/supabaseClient";

export default function AdminChatThread() {
  const params = useParams();

  // ✅ MUST MATCH FOLDER NAME EXACTLY
  const partnerId = params.partnerID as string;

  if (!partnerId) {
    return <div className="p-4">Invalid partner</div>;
  }

  useEffect(() => {
    supabase
      .from("partner_messages")
      .update({ is_read: true })
      .eq("partner_id", partnerId)
      .eq("sender", "partner");
  }, [partnerId]);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <div className="p-4 border-b font-semibold">
        Chat — Partner {partnerId}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <PartnerMessages partnerId={partnerId} isAdmin />
      </div>
    </div>
  );
}
