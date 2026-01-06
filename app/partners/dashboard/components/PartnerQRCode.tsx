"use client";

import { useState } from "react";
import QRCode from "qrcode";

type Props = {
  trackingLink: string;
};

export default function PartnerQRCode({ trackingLink }: Props) {
  const [qrCode, setQrCode] = useState<string | null>(null);

  const generateQR = async () => {
    const url = await QRCode.toDataURL(trackingLink, {
      width: 300,
      margin: 2,
    });
    setQrCode(url);
  };

  return (
    <div className="border rounded p-4 bg-white space-y-3">
      {/* TITLE */}
      <h3 className="font-bold text-lg">Your QR Code</h3>

      {/* DESCRIPTION */}
      <p className="text-sm text-gray-600">
        Generate a QR code linked to your personal tracking link. This allows
        people to scan and instantly visit your partner page.
      </p>

      {/* INSTRUCTIONS */}
      <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
        <li>Use this QR code on car decals, magnets, flyers, yard signs, or business cards</li>
        <li>When someone scans it, they’re taken directly to your tracking link</li>
        <li>All leads and commissions are automatically credited to your Partner ID</li>
        <li>No app required — most phones scan QR codes using the camera</li>
      </ul>

      {/* ACTION BUTTON */}
      {!qrCode && (
        <button
          onClick={generateQR}
          className="mt-3 w-full bg-black text-white py-3 rounded font-bold"
        >
          Generate QR Code
        </button>
      )}

      {/* QR CODE OUTPUT */}
      {qrCode && (
        <div className="pt-4 space-y-3 text-center">
          <img
            src={qrCode}
            alt="Partner QR Code"
            className="mx-auto"
          />

          <a
            href={qrCode}
            download="doorplace-qr-code.png"
            className="inline-block w-full bg-gray-600 text-white py-3 rounded font-bold"
          >
            Download QR Code
          </a>

          <p className="text-xs text-gray-500">
            Tip: QR codes work best when placed where people can scan quickly.
          </p>
        </div>
      )}
    </div>
  );
}
