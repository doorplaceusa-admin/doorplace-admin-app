import "./globals.css";
import type { Metadata } from "next";
import ClientRoot from "./ClientRoot";

export const metadata: Metadata = {
  title: "TradePilot – Doorplace USA",
  description: "Partner & Operations Control Panel",
  colorScheme: "light", // ✅ force light mode globally
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
      style={{ colorScheme: "light" }} // ✅ stop iOS dark-mode override
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0b0b0b" />
      </head>

      <body className="bg-gray-100" suppressHydrationWarning>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
