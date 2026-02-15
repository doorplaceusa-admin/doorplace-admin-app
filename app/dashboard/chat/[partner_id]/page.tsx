"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import PartnerMessages from "app/partners/dashboard/components/PartnerMessages";

type PartnerInfo = {
  first_name: string | null;
  last_name: string | null;
};

export default function AdminChatThreadPage() {
  const { partner_id } = useParams<{ partner_id: string }>();
  const [partner, setPartner] = useState<PartnerInfo | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("partners")
        .select("first_name,last_name")
        .eq("partner_id", partner_id)
        .single();

      if (data) setPartner(data as PartnerInfo);
    })();
  }, [partner_id]);

  const partnerName =
    partner && (partner.first_name || partner.last_name)
      ? `${partner.first_name ?? ""} ${partner.last_name ?? ""}`.trim()
      : "Partner";

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-white max-w-300 mx-auto p-4">
      <PartnerMessages
        partnerId={partner_id}
        isAdmin
        showHeader
        headerName={partnerName}
        allowDelete
        allowEdit
      />
    </div>
  );
}
