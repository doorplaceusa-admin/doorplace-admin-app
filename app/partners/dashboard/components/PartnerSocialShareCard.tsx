"use client";

import { Facebook, Instagram, Share2, Copy } from "lucide-react";
import { useState } from "react";

export default function PartnerSocialShareCard({
  partnerId,
}: {
  partnerId: string;
}) {
  const link = `https://doorplaceusa.com/pages/swing-partner-lead?partner_id=${partnerId}`;

  const defaultCaption = `Handcrafted porch swings shipped nationwide.

Take a look here 👇
${link}`;

  const [caption, setCaption] = useState(defaultCaption);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  }

  function copyToClipboard(text: string, message: string) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      showToast(message);
    } catch {
      alert("Copy failed. Please copy manually.");
    }
  }

  function handleSocialShare(url: string) {
    copyToClipboard(caption, "Caption & link copied");
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      {/* CARD */}
      <div className="bg-white rounded-xl shadow p-5 mb-6 border">
        <h2 className="text-xl font-semibold mb-1" style={{ color: "#b80d0d" }}>
          Share Your Swing Tracking Link
        </h2>

        <p className="text-sm font-semibold text-red-600 mb-4">
          Earn $100 commission + $50 bonus for every lead that becomes an order
        </p>

        {/* LINK */}
        <div className="mb-3">
          <label className="text-xs text-gray-500">Your Swing Tracking Link</label>
          <input
            value={link}
            readOnly
            className="w-full border rounded px-3 py-2 text-sm mt-1"
          />
        </div>

        {/* COPY LINK ONLY */}
        <button
          onClick={() =>
            copyToClipboard(link, "Tracking link copied")
          }
          className="w-full bg-black text-white py-2 rounded text-sm flex items-center justify-center gap-2 mb-4"
        >
          <Copy size={16} />
          Copy Link Only
        </button>

        {/* HOW IT WORKS */}
        <div className="bg-gray-50 border rounded-lg p-3 mb-4 text-sm text-gray-700">
          <strong>How social sharing works:</strong>
          <ul className="list-disc ml-5 mt-1 space-y-1">
            <li>Clicking Facebook, Instagram, or TikTok copies your caption and link</li>
            <li>The platform opens so you can paste and post</li>
          </ul>
        </div>

        {/* CAPTION */}
        <div className="mb-4">
          <label className="text-xs text-gray-500">Caption (editable)</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={4}
            className="w-full border rounded px-3 py-2 text-sm mt-1"
          />
        </div>

        {/* SOCIAL BUTTONS */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              handleSocialShare(
                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  link
                )}`
              )
            }
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
          >
            <Facebook size={16} />
            Facebook
          </button>

          <button
            onClick={() => handleSocialShare("https://www.instagram.com/")}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
          >
            <Instagram size={16} />
            Instagram
          </button>

          <button
            onClick={() => handleSocialShare("https://www.tiktok.com/upload")}
            className="bg-black text-white px-4 py-2 rounded text-sm flex items-center gap-2"
          >
            <Share2 size={16} />
            TikTok
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Instagram & TikTok require pasting the caption manually after opening.
        </p>
      </div>

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg text-sm shadow-lg z-50">
          {toast}
        </div>
      )}
    </>
  );
}
