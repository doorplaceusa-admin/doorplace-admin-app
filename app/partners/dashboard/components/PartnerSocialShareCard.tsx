"use client";

import { Facebook, Instagram, Share2 } from "lucide-react";
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
  const [copied, setCopied] = useState(false);

  function copyToClipboard(text: string) {
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Copy failed. Please copy manually.");
    }
  }

  function handleShare(url: string) {
    copyToClipboard(caption);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="bg-white rounded-xl shadow p-5 mb-6 border">
      <h2 className="text-xl font-semibold mb-1" style={{ color: "#b80d0d" }}>
        Post This on Social Media
      </h2>

      <p className="text-sm text-gray-600 mb-4">
        Share your partner link anywhere. Leads and orders from your link are
        automatically credited to your Partner ID.
      </p>

      {/* PARTNER LINK */}
      <div className="mb-3">
        <label className="text-xs text-gray-500">Your Partner Link</label>
        <input
          value={link}
          readOnly
          onClick={() => copyToClipboard(link)}
          className="w-full border rounded px-3 py-2 text-sm mt-1 cursor-pointer"
        />
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

      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() =>
            handleShare(
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
          onClick={() => handleShare("https://www.instagram.com/")}
          className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
        >
          <Instagram size={16} />
          Instagram
        </button>

        <button
          onClick={() => handleShare("https://www.tiktok.com/upload")}
          className="bg-black text-white px-4 py-2 rounded text-sm flex items-center gap-2"
        >
          <Share2 size={16} />
          TikTok
        </button>
      </div>

      {copied && (
        <div className="mt-3 text-xs text-green-700 font-semibold">
          Caption copied — paste it into your post
        </div>
      )}

      <p className="text-xs text-gray-500 mt-2">
        Instagram & TikTok require pasting the caption manually after opening.
      </p>
    </div>
  );
}
