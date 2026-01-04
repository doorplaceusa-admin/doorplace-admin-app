"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import PartnerMessages from "./dashboard/components/PartnerMessages";

import { supabase } from "@/lib/supabaseClient";
import {
  LayoutGrid,
  DollarSign,
  Package,
  BookOpen,
  Bell,
  User,
  UserPlus,
  LogOut,
  MoreHorizontal,
  UserPlus2Icon,
  UserCircle,
  UserRoundPenIcon,
} from "lucide-react";

/* ======================
   PARTNER DASHBOARD LAYOUT
====================== */

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [profilePartner, setProfilePartner] = useState<any>(null);
  const [viewProfileOpen, setViewProfileOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [viewItem, setViewItem] = useState<any>(null);
  const [chatOpen, setChatOpen] = useState(false);


useEffect(() => {
  let channel: any;

  const startPresence = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    channel = supabase.channel("tradepilot-presence", {
      config: {
        presence: { key: user.id },
      },
    });

    channel.subscribe(async (status: string) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user_id: user.id,
          role: "partner",
          online_at: new Date().toISOString(),
        });
      }
    });
  };

  startPresence();

  return () => {
    if (channel) supabase.removeChannel(channel);
  };
}, []);


  useEffect(() => {
  async function checkPartnerAccess() {

    if (pathname === "/pending") {
  setLoading(false);
  return;
}

    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      router.replace("/login");
      return;
    }

    const userId = sessionData.session.user.id;

    const { data: partner, error } = await supabase
  .from("partners")
  .select("*")
  .eq("email_address", sessionData.session.user.email)
  .single();


    if (error || !partner) {
      router.replace("/login");
      return;
    }

    if (partner.status === "pending") {
      router.replace("/pending");
      return;
    }



    setProfilePartner(partner);
    setLoading(false);
  }

  checkPartnerAccess();
}, [router]);


useEffect(() => {
  async function loadPartnerProfile() {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;

    const userId = sessionData.session.user.id;

    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setProfilePartner(data);
    }
  }

  loadPartnerProfile();
}, []);



  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden md:flex w-64 bg-white shadow flex-col p-6">
        <h1 className="text-2xl font-bold text-red-700 mb-6">
          TradePilot
          <span className="block text-sm font-normal text-gray-500">
            Powered by Doorplace USA
          </span>
        </h1>

        <nav className="flex flex-col gap-4 text-sm">
          <NavLink
            href="/partners/dashboard"
            icon={<LayoutGrid size={18} />}
            label="Dashboard"
          />
          <NavLink
            href="/partners/commissions"
            icon={<DollarSign size={18} />}
            label="Commissions"
          />
          <NavLink
            href="/partners/orders"
            icon={<Package size={18} />}
            label="My Orders"
          />
          <NavLink
            href="/partners/leads"
            icon={<Package size={18} />}
            label="My Leads"
          />
          <NavLink
            href="/partners/resources"
            icon={<BookOpen size={18} />}
            label="Resources"
          />
        </nav>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
<div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* ===== TOP BAR ===== */}
<header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white border-b md:px-6">
          {/* PROFILE */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <User size={22} />
            </button>

            {profileOpen && (
  <div className="absolute left-0 mt-2 w-48 bg-white border rounded shadow z-50">
    <button
  onClick={() => {
    router.push("/partners/dashboard?editProfile=1");
    setProfileOpen(false);
  }}
  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
>
  My Profile
</button>


    <button
      onClick={handleLogout}
      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
    >
      <LogOut size={14} />
      Log out
    </button>
  </div>
)}


          </div>

          <div className="flex flex-col text-center leading-tight">
           <span className="font-semibold text-base">
             Partner Dashboard
            </span>
           <span className="text-sm text-gray-500">
            Powered by Doorplace USA
           </span>
           </div>


          

          <div className="flex flex-col items-center">
  <button
    onClick={() => {}}
    className="p-1 rounded hover:bg-gray-100"
  >
    <Bell size={22} />
  </button>

  <button
    onClick={() => setChatOpen(true)}
    className="text-[11px] text-red-700 font-semibold leading-none mt-1"
  >
    Live Chat
  </button>
</div>

        </header>

{chatOpen && profilePartner?.partner_id && (
  <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
    <div className="w-full max-w-md h-[92dvh] bg-white shadow-xl flex flex-col">
      
      {/* CHAT HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <strong className="text-sm">Live Chat</strong>
        <button
          onClick={() => setChatOpen(false)}
          className="text-gray-500 hover:text-black"
        >
          ✕
        </button>
      </div>

      {/* CHAT BODY */}
      <div className="flex-1 overflow-y-auto p-3">
        <PartnerMessages partnerId={profilePartner.partner_id} />
      </div>

    </div>
  </div>
)}


        {/* ===== PAGE CONTENT ===== */}
<main className="flex-1 overflow-y-auto overflow-x-hidden px-1 pb-24 md:px-6 md:pb-6">
          {children}
        </main>

        {/* ===== MOBILE BOTTOM NAV ===== */}
        <PartnerBottomNav />
      </div>
    </div>
  );
}

/* ======================
   MOBILE BOTTOM NAV
====================== */

function PartnerBottomNav() {
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 z-50">
        <MobileNavItem
          href="/partners/dashboard"
          icon={<LayoutGrid size={20} />}
          label="Home"
        />
        <MobileNavItem
          href="/partners/commissions"
          icon={<DollarSign size={20} />}
          label="Pay"
        />
        <MobileNavItem
          href="/partners/orders"
          icon={<Package size={20} />}
          label="Orders"
        />
        <MobileNavItem
          href="/partners/leads"
          icon={<UserRoundPenIcon size={20} />}
          label="leads"
        />

        <button
          onClick={() => setShowMore(true)}
          className="flex flex-col items-center text-xs text-gray-600"
        >
          <MoreHorizontal size={20} />
          <span>More</span>
        </button>
      </nav>

      {showMore && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-50"
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-16 left-2 right-2 bg-white rounded-lg shadow-lg p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <MobileNavItem
              href="/partners/resources"
              icon={<BookOpen size={20} />}
              label="Resources"
              onClick={() => setShowMore(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}

/* ===== NAV HELPERS ===== */

function NavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 text-gray-700 hover:text-red-700"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function MobileNavItem({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();

  const isActive =
    href === "/partners"
      ? pathname === "/partners"
      : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex flex-col items-center text-xs px-2 py-1 rounded ${
        isActive ? "text-red-700 bg-red-50" : "text-gray-700"
      }`}
    >
      {icon}
      <span className="mt-1">{label}</span>
    </Link>
  );
}
