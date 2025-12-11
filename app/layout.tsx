"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { useState } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex min-h-screen bg-gray-100">

          {/* ✅ MOBILE TOP BAR */}
          <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white shadow flex items-center px-4 z-50">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-2xl">
              ☰
            </button>
            <span className="ml-4 font-bold text-blue-600">TradePilot</span>
          </div>

          {/* ✅ SIDEBAR */}
          <div
            className={`fixed md:static top-0 left-0 h-full w-64 bg-white shadow-md p-6 flex flex-col z-40
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
            md:translate-x-0 transition-transform duration-300`}
          >
            <h1 className="text-2xl font-bold mb-8 text-blue-600 hidden md:block">
              TradePilot
            </h1>

            <nav className="flex flex-col gap-4">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/dashboard/companies">Companies</Link>
              <Link href="/dashboard/leads">Leads</Link>
              <Link href="/dashboard/partners">Partners</Link>
              <Link href="/dashboard/orders">Orders</Link>
              <Link href="/dashboard/commissions">Commissions</Link>
              <Link href="/dashboard/settings">Settings</Link>
            </nav>

            <button className="mt-auto bg-red-500 text-white py-2 rounded">
              Log out
            </button>
          </div>

          {/* ✅ MAIN CONTENT */}
          <div className="flex-1 pt-16 md:pt-0 p-6 overflow-auto">
            {children}
          </div>

        </div>
      </body>
    </html>
  );
}
