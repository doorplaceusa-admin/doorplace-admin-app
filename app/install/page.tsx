"use client";

import { useEffect, useState } from "react";

export default function InstallPage() {
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform("ios");
    } else if (/android/.test(ua)) {
      setPlatform("android");
    }

    // Android PWA install support
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installAndroid = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-6">
      
      {/* INSTALL CARD */}
      <div className="w-full max-w-md bg-white border rounded-lg p-6 text-center shadow-sm">
        
        {/* LOGO */}
        <div className="flex justify-center mb-4">
          <img
            src="https://cdn.shopify.com/s/files/1/0549/2896/5713/files/161945ED-CD28-4DF8-A054-344B43F09E83.png?v=1768519505"
            alt="TradePilot"
            className="h-28 object-contain"
          />
        </div>

        <h1 className="text-xl font-semibold mb-2">Install TradePilot</h1>
        <p className="text-sm text-zinc-600 mb-6">
          Install TradePilot on your phone for fast, app-like access.
        </p>

        {/* iPhone option */}
        <div className="mb-6">
          <button className="w-full py-2 rounded bg-black text-white mb-2">
            Install on iPhone
          </button>

          {platform === "ios" && (
            <p className="text-xs text-zinc-600">
              Open in <strong>Safari</strong>, tap the <strong>Share</strong> icon,
              then choose <strong>Add to Home Screen</strong>.
            </p>
          )}
        </div>

        {/* Android option */}
        <div>
          <button
            onClick={installAndroid}
            disabled={!deferredPrompt}
            className="w-full py-2 rounded border border-zinc-300 hover:bg-zinc-100 transition disabled:opacity-50"
          >
            Install on Android
          </button>

          {platform === "android" && !deferredPrompt && (
            <p className="text-xs text-zinc-600 mt-2">
              Open this page in <strong>Chrome</strong> to install TradePilot.
            </p>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="mt-10 text-center text-xs text-zinc-400">
        <p>© {new Date().getFullYear()} TradePilot</p>
        <p className="mt-1">Powered by Doorplace USA</p>
      </footer>

    </div>
  );
}
