"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ===============================
   TYPES
================================ */
type UploadItem = {
  id: string;
  name: string;
  updated_at: string;
  fullPath: string;
  partnerId: string;
};

/* ===============================
   PAGE
================================ */
export default function PartnerUploadsAdminPage() {
  const [files, setFiles] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  async function loadFiles() {
    setLoading(true);
    setErrorMessage(null);

    const collected: UploadItem[] = [];

    // 1️⃣ Get partner folders (root level)
    const { data: rootItems, error } = await supabase.storage
      .from("partner-uploads")
      .list("", { limit: 200 });

    if (error) {
      console.error(error);
      setErrorMessage("Failed to load partner folders.");
      setLoading(false);
      return;
    }

    const partnerFolders =
      rootItems?.filter((item) => item.metadata === null) || [];

    // 2️⃣ Get uploads inside each partner folder
    for (const folder of partnerFolders) {
      const partnerId = folder.name;

      const { data: uploads } = await supabase.storage
        .from("partner-uploads")
        .list(`${partnerId}/uploads`, {
          limit: 200,
          sortBy: { column: "updated_at", order: "desc" },
        });

      uploads?.forEach((file) => {
        collected.push({
          id: file.id,
          name: file.name,
          updated_at: file.updated_at,
          partnerId,
          fullPath: `${partnerId}/uploads/${file.name}`,
        });
      });
    }

    setFiles(collected);
    setLoading(false);
  }

  async function openFile(path: string) {
    const { data, error } = await supabase.storage
      .from("partner-uploads")
      .createSignedUrl(path, 60);

    if (error) {
      alert("Failed to open file.");
      return;
    }

    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  }

  if (loading) return <div className="p-6">Loading uploads…</div>;

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto pb-6 space-y-4 max-w-[1500px] w-full mx-auto">
      {/* HEADER */}
      <div className="sticky top-0 bg-white z-30 border-b pb-4">
        <h1 className="text-3xl font-bold text-red-700">
          Partner File Uploads
        </h1>
        <p className="text-sm text-gray-500">
          Review photos, videos, and documents uploaded by partners.
        </p>
      </div>

      {errorMessage && (
        <p className="text-red-600 text-sm">{errorMessage}</p>
      )}

      {files.length === 0 && (
        <p className="text-gray-500">No uploads found.</p>
      )}

      {/* RECORDS */}
      <div className="space-y-3">
        {files.map((file) => (
          <div
            key={file.id}
            className="bg-white border rounded-lg p-4 space-y-2"
          >
            <div className="flex justify-between items-center">
              <strong className="text-sm">
                Partner:{" "}
                <span className="font-mono">{file.partnerId}</span>
              </strong>

              <button
                onClick={() => openFile(file.fullPath)}
                className="bg-black text-white px-3 py-1 rounded text-xs"
              >
                View File
              </button>
            </div>

            <div className="text-sm break-all">
              File: <span className="font-mono">{file.name}</span>
            </div>

            <div className="text-xs text-gray-600">
              Uploaded:{" "}
              {new Date(file.updated_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
