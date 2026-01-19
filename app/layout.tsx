import "./globals.css";
import type { Metadata, Viewport } from "next";
import ClientRoot from "./ClientRoot";

/* ============================
   Viewport (FIXES WARNING)
============================ */
export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#0b0b0b",
};

/* ============================
   Metadata
============================ */
export const metadata: Metadata = {
  title: "TradePilot – Doorplace USA",
  description: "Partner & Operations Control Panel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={{ colorScheme: "light" }} // ✅ prevents iOS dark-mode override
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>

      <body className="bg-gray-100" suppressHydrationWarning>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
