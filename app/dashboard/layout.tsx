

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AdminPresenceProvider } from "@/app/components/presence/AdminPresenceContext";
import { useAppViewTracker } from "@/lib/useAppViewTracker";
import { getLiveSessionCount } from "@/lib/getLiveSessionCount";



import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  LayoutGrid,
  ClipboardList,
  Package,
  Handshake,
  MoreHorizontal,
  DollarSign,
  Building2,
  Settings,
  Mail,
  Bell,
  User,
  LogOut,
  PersonStanding,
  Receipt,
  UploadCloud,
  FileText,
  Phone,
  BookOpen,
  MessageSquare,
  FishingHookIcon,
  DatabaseIcon,
  Database,
} from "lucide-react";



/* ======================
   DASHBOARD LAYOUT (ADMIN ONLY)
====================== */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  useAppViewTracker({
  role: "admin",
  companyId: null,
});

  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
const [userId, setUserId] = useState<string | null>(null);
const [companyId, setCompanyId] = useState<string | null>(null);


  const [onlineStats, setOnlineStats] = useState({
  partners: 0,
  admins: 0,
  others: 0,
  total: 0,
});


  const profileRef = useRef<HTMLDivElement>(null);


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

    channel.on("presence", { event: "sync" }, async () => {
  const state = channel.presenceState();
  const users = Object.values(state).flat() as any[];

  const partners = users.filter((u) => u.role === "partner").length;
  const admins = users.filter((u) => u.role === "admin").length;

  const liveTotal = await getLiveSessionCount();
  const others = Math.max(liveTotal - (partners + admins), 0);

  setOnlineStats({
    partners,
    admins,
    others,
    total: liveTotal,
  });
});


    channel.subscribe(async (status: string) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user_id: user.id,
          role: "admin",
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
  console.log("ONLINE STATS:", onlineStats);
}, [onlineStats]);


  



useEffect(() => {
  const checkAccess = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      router.replace("/login");
      return;
    }

    const user = sessionData.session.user;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, active_company_id")
      .eq("id", user.id)
      .single();

    if (error || !profile || profile.role !== "admin") {
      router.replace("/partners/dashboard");
      return;
    }

    setUserId(user.id);
    setCompanyId(profile.active_company_id);
    setReady(true);
    setLoading(false);
  };

  checkAccess();
}, [router]);






  // close profile dropdown when clicking outside
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

  async function loadNotifications() {
  if (!userId || !companyId) return;

  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, type, created_at, is_read")
    .eq("recipient_user_id", userId)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!error && data) {
    setNotifications(data);
    setUnreadCount(data.filter(n => !n.is_read).length);
  }
}



useEffect(() => {
  if (!ready || !userId || !companyId) return;

  loadNotifications();

 const channel = supabase
  .channel(`notifications-${userId}`)
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "notifications",
      filter: `recipient_user_id=eq.${userId}`,
    },
    payload => {
      if (payload.new.company_id !== companyId) return;

      setNotifications(prev => {
        const next = [payload.new, ...prev].slice(0, 10);
        setUnreadCount(next.filter(n => !n.is_read).length);
        return next;
      });
    }
  )
  .subscribe();



  return () => {
    supabase.removeChannel(channel);
  };
}, [ready, userId, companyId]);

useEffect(() => {
  if (open) {
    loadNotifications();
  }
}, [open]);






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
  {/* CORE */}
  <NavLink href="/dashboard" icon={<LayoutGrid size={18} />} label="Dashboard" />
  <NavLink href="/dashboard/leads" icon={<ClipboardList size={18} />} label="Leads" />
  <NavLink href="/dashboard/orders" icon={<Package size={18} />} label="Orders" />

  {/* PEOPLE */}
  <NavLink href="/dashboard/partners" icon={<Handshake size={18} />} label="Partners" />
  <NavLink href="/dashboard/companies" icon={<Building2 size={18} />} label="Companies" />

  {/* MONEY */}
  <NavLink href="/dashboard/commissions" icon={<DollarSign size={18} />} label="Commissions" />
  <NavLink href="/dashboard/invoices" icon={<FileText size={18} />} label="Invoices" />
  <NavLink href="/dashboard/receipts" icon={<Receipt size={18} />} label="Receipts" />

  {/* COMMUNICATION */}
  <NavLink href="/dashboard/chat" icon={<MessageSquare size={18} />} label="Chat" />
  <NavLink href="/dashboard/email" icon={<Mail size={18} />} label="Email" />
  <NavLink href="/dashboard/iplum" icon={<Phone size={18} />} label="iPlum" />

  {/* RESOURCES */}
  <NavLink
    href="/dashboard/partner-uploads"
    icon={<UploadCloud size={18} />}
    label="Partner Uploads"
  />
  <NavLink
    href="/dashboard/admin-partner-resources"
    icon={<BookOpen size={18} />}
    label="Partner Resource Panel"
  />
<NavLink
    href="/dashboard/analytics"
    icon={<DatabaseIcon size={18} />}
    label="Analytics"
  />
  <NavLink
    href="/dashboard/page-generator"
    icon={<FishingHookIcon size={18} />}
    label="Fishing Hooks"
  />



  {/* SYSTEM */}
  <NavLink href="/dashboard/settings" icon={<Settings size={18} />} label="Settings" />
</nav>

      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col">
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
              <div className="absolute left-0 mt-2 w-44 bg-white border rounded shadow z-50">
                <Link
                  href="/dashboard/settings"
                  className="block px-4 py-2 text-sm hover:bg-gray-100"
                  onClick={() => setProfileOpen(false)}
                >
                  Account Settings
                </Link>

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

          <span className="font-semibold">Admin Dashboard</span>


<div className="relative">
  <button
    onClick={() => setOpen(o => !o)}
    className="relative p-2"
  >
    <Bell className="h-5 w-5 text-gray-700" />

    {unreadCount > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1">
        {unreadCount}
      </span>
    )}
  </button>

  {open && (
    <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow z-50">
      <div className="p-2 text-sm font-semibold border-b">
        Notifications
      </div>

      {notifications.length === 0 && (
        <div className="p-3 text-xs text-gray-500">
          No notifications
        </div>
      )}

      {notifications.map(n => (
  <button
    key={n.id}
    onClick={async () => {
      // 1️⃣ Update DB
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", n.id);

      // 2️⃣ Optimistically update UI
      setNotifications(prev =>
        prev.map(item =>
          item.id === n.id ? { ...item, is_read: true } : item
        )
      );

      // 3️⃣ Update unread badge
      setUnreadCount(prev => Math.max(prev - 1, 0));

      // (optional) navigate here later if needed
      // router.push(...)
    }}
    className={`w-full text-left px-3 py-2 text-sm border-b hover:bg-gray-50 ${
      !n.is_read ? "bg-red-50" : ""
    }`}
  >

          <div className="font-medium">{n.title}</div>
          <div className="text-xs text-gray-500">
            {new Date(n.created_at).toLocaleString()}
          </div>
        </button>
      ))}
    </div>
  )}
</div>

        </header>

        {/* ===== PAGE CONTENT ===== */}
       <AdminPresenceProvider value={onlineStats}>
  <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 md:pb-6">
  <div className="max-w-[100vw] w-full px-2 md:px-3 overflow-x-hidden">
    {children}
  </div>
</main>

</AdminPresenceProvider>




        {/* ===== MOBILE BOTTOM NAV ===== */}
        <MobileBottomNav />
      </div>
    </div>
  );
}


/* ======================
   MOBILE BOTTOM NAV
====================== */

function MobileBottomNav() {
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {/* ===== MAIN BOTTOM NAV ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 z-50">
        <MobileNavItem
          href="/dashboard"
          icon={<LayoutGrid size={20} />}
          label="Dashboard"
        />
        <MobileNavItem
          href="/dashboard/leads"
          icon={<ClipboardList size={20} />}
          label="Leads"
        />
        <MobileNavItem
          href="/dashboard/orders"
          icon={<Package size={20} />}
          label="Orders"
        />
        <MobileNavItem
          href="/dashboard/partners"
          icon={<Handshake size={20} />}
          label="Partners"
        />
        <MobileNavItem
          href="/dashboard/chat"
          icon={<MessageSquare size={20} />}
          label="Chat"
        />

        <button
          onClick={() => setShowMore(true)}
          className="flex flex-col items-center text-xs text-gray-600"
        >
          <MoreHorizontal size={20} />
          <span>More</span>
        </button>
      </nav>

      {/* ===== MORE OVERLAY ===== */}
      {showMore && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-50"
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-16 left-2 right-2 bg-white rounded-2xl shadow-xl border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-semibold text-sm">More</span>
              <button
                onClick={() => setShowMore(false)}
                className="text-xs px-3 py-1 rounded-full border"
              >
                Close
              </button>
            </div>

            {/* Icon Grid */}
            <div className="p-3 grid grid-cols-3 gap-3">
              <MoreTile
                href="/dashboard/analytics"
                icon={<Database size={20} />}
                label="Analytics"
                onClick={() => setShowMore(false)}
              />
              <MoreTile
                href="/dashboard/page-generator"
                icon={<FishingHookIcon size={20} />}
                label="Fishing Hooks"
                onClick={() => setShowMore(false)}
              />
              <MoreTile
                href="/dashboard/email"
                icon={<Mail size={20} />}
                label="Email"
                onClick={() => setShowMore(false)}
              />
              <MoreTile
                href="/dashboard/commissions"
                icon={<DollarSign size={20} />}
                label="Commissions"
                onClick={() => setShowMore(false)}
              />
              <MoreTile
                href="/dashboard/receipts"
                icon={<Receipt size={20} />}
                label="Receipts"
                onClick={() => setShowMore(false)}
              />
              <MoreTile
                href="/dashboard/partner-uploads"
                icon={<UploadCloud size={20} />}
                label="Uploads"
                onClick={() => setShowMore(false)}
              />
              <MoreTile
                href="/dashboard/invoices"
                icon={<FileText size={20} />}
                label="Invoices"
                onClick={() => setShowMore(false)}
              />
              <MoreTile
                href="/dashboard/companies"
                icon={<Building2 size={20} />}
                label="Companies"
                onClick={() => setShowMore(false)}
              />
              <MoreTile
                href="/dashboard/iplum"
                icon={<Phone size={20} />}
                label="iPlum"
                onClick={() => setShowMore(false)}
              />
              <MoreTile
                href="/dashboard/admin-partner-resources"
                icon={<BookOpen size={20} />}
                label="Resources"
                onClick={() => setShowMore(false)}
              />
              <MoreTile
                href="/dashboard/settings"
                icon={<Settings size={20} />}
                label="Settings"
                onClick={() => setShowMore(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MoreTile({
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
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-xl border p-3 flex flex-col items-center justify-center gap-2 text-xs font-medium
        ${
          isActive
            ? "bg-red-50 text-red-700 border-red-200"
            : "bg-white text-gray-700 hover:bg-gray-50"
        }`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isActive ? "bg-red-100" : "bg-gray-100"
        }`}
      >
        {icon}
      </div>
      <span>{label}</span>
    </Link>
  );
}


/* ===== DESKTOP NAV LINK ===== */
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

/* ===== MOBILE NAV ITEM ===== */
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
  href === "/dashboard"
    ? pathname === "/dashboard"
    : pathname === href || pathname.startsWith(href + "/");


  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex flex-col items-center text-xs px-2 py-1 rounded ${
  isActive
    ? "text-red-700 bg-red-50"
    : "text-gray-700"
}`}

    >
      {icon}
      <span className="mt-1">{label}</span>
    </Link>
  );
}

