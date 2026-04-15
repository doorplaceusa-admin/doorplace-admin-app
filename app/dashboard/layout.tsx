

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AdminPresenceProvider } from "@/app/components/presence/AdminPresenceContext";
import { useAppViewTracker } from "@/lib/useAppViewTracker";
import { getLiveSessionCount } from "@/lib/getLiveSessionCount";
import { useRealtimeAdminVoice } from "@/lib/ai/useRealtimeAdminVoice";



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
  MapIcon,
  ScanLine,
  ScanLineIcon,
  DatabaseBackup,
} from "lucide-react";
import { subscribe } from "diagnostics_channel";



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
});

  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
const [userId, setUserId] = useState<string | null>(null);
const [aiOpen, setAiOpen] = useState(false);
const [aiQuestion, setAiQuestion] = useState("");
const [aiAnswer, setAiAnswer] = useState("");
const [aiLoading, setAiLoading] = useState(false);
const aiTextareaRef = useRef<HTMLTextAreaElement>(null);
const [customerPanel, setCustomerPanel] = useState<any>(null);



const [aiTone, setAiTone] = useState<
  "neutral" | "direct" | "technical" | "sales"
>("neutral");
const realtimeVoice = useRealtimeAdminVoice(aiTone);



  const [onlineStats, setOnlineStats] = useState({
  partners: 0,
  admins: 0,
  others: 0,
  total: 0,
});


  const profileRef = useRef<HTMLDivElement>(null);
const loadNotificationsRef = useRef<() => void>(() => {});
  

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
.select("role")      .eq("id", user.id)
      .single();

    if (error || !profile || profile.role !== "admin") {
      router.replace("/partners/dashboard");
      return;
    }

    setUserId(user.id);
console.log("🟢 USER SET:", user.id);
    setReady(true);
setLoading(false);


  };

  checkAccess();
}, [router]);

useEffect(() => {
  if (!userId || typeof userId !== "string") {
  console.log("⛔ userId not ready:", userId);
  return;
}

  loadNotifications();
}, [userId]);



useEffect(() => {
  function onKey(e: KeyboardEvent) {
    if (!aiOpen) return;
    if (e.code === "KeyV") {
      e.preventDefault();
      realtimeVoice.connected
        ? realtimeVoice.stop()
        : realtimeVoice.start();
    }
  }

  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [aiOpen, realtimeVoice]);


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
  console.log("🚀 loadNotifications CALLED");
  console.log("USER ID:", userId);

  if (!userId || typeof userId !== "string") {
  console.log("⛔ userId not ready:", userId);
  return;
}

// ✅ ADD THIS RIGHT HERE
console.log("🔥 QUERYING WITH USER ID:", userId);

const { data, error } = await supabase
  .from("notifications")
  .select(`
    id,
    type,
    title,
    body,
    entity_type,
    entity_id,
    is_read,
    created_at,
    user_id
  `)
  .eq("user_id", userId)
  .order("created_at", { ascending: false })
  .limit(10);

  if (!error && data) {
  console.log("✅ DATA FROM SUPABASE:", data);

  setNotifications(data);
  setUnreadCount(data.filter(n => !n.is_read).length);
} else {
  console.log("❌ ERROR:", error);
}
}
loadNotificationsRef.current = loadNotifications;

useEffect(() => {
  if (!realtimeVoice.finalTranscript) return;

  setAiQuestion(realtimeVoice.finalTranscript);
}, [realtimeVoice.finalTranscript]);




useEffect(() => {
  if (open) {
    loadNotifications();
  }
}, [open]);


async function askAdminAI() {
  if (!aiQuestion.trim()) return;

  aiTextareaRef.current?.blur();

  setAiLoading(true);
  setAiAnswer("");

  try {
    const res = await fetch("/api/admin/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: aiQuestion,
        tone: aiTone,
        tables: [
          "generated_pages",
          "page_view_events",
          "us_locations",
          "leads",
          "orders",
          "existing_shopify_pages",
          "partners",
          "commissions",
        ],
      }),
    });

    const data = await res.json();
    setAiAnswer(data.answer || "No response");
  } catch {
    setAiAnswer("AI error — check server logs.");
  } finally {
    setAiLoading(false);
  }
}


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
  <NavLink href="/dashboard/contractors" icon={<Building2 size={18} />} label="Contractors" />

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
   <NavLink
    href="/dashboard/sitemap"
    icon={<MapIcon size={18} />}
    label="Sitemap"
  />
  <NavLink
    href="/dashboard/google-search-console"
    icon={<DatabaseIcon size={18} />}
    label="Google Analytics"
  />
  <NavLink
    href="/dashboard/page-request"
    icon={<DatabaseIcon size={18} />}
    label="Page Requests leads"
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

<button
  onClick={() => setAiOpen(true)}
  className="ml-2 px-3 py-1.5 text-sm font-semibold rounded bg-black text-white hover:bg-gray-800"
>
  AI
</button>

<button
  onClick={() => window.location.reload()}
  className="text-sm text-gray-500 hover:text-black"
>
  ↻ Refresh
</button>

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

      // 🔥 ADD THIS LINE RIGHT HERE
      console.log("CLICKED NOTIFICATION:", n);

      // 1️⃣ mark as read
      if (!n.id || typeof n.id !== "string") {
        console.warn("❌ Invalid notification ID:", n);
        return;
      }

     console.log("UPDATING NOTIFICATION:", {
  id: n.id,
  user_id: userId,
});

const { data, error } = await supabase
  .from("notifications")
  .update({ is_read: true })
  .eq("id", n.id)
  .eq("user_id", userId);

if (error) {
  console.error("❌ UPDATE ERROR:", error);
} else {
  console.log("✅ UPDATE SUCCESS:", data);
}

  // 2️⃣ update UI
  setNotifications(prev =>
    prev.map(item =>
      item.id === n.id ? { ...item, is_read: true } : item
    )
  );

  setUnreadCount(prev => Math.max(prev - 1, 0));

  setOpen(false); // close dropdown
// 🔥 3️⃣ UNIFIED CUSTOMER PANEL

// 🔥 ALWAYS EXTRACT PHONE FROM TEXT

const phoneMatch = (n.title + " " + n.body).match(/\d{10}/);

if (phoneMatch) {
  const phone = phoneMatch[0];

  console.log("📞 EXTRACTED PHONE:", phone);

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("phone_clean", phone);

  const { data: partners } = await supabase
    .from("partners")
    .select("*")
    .eq("phone_clean", phone);

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("phone_clean", phone);

  console.log("🔥 PANEL DATA:", { leads, partners, invoices });

  setCustomerPanel({
    phone,
    leads: leads || [],
    partners: partners || [],
    invoices: invoices || [],
  });

  return; // 🚨 STOPS routing
}

// fallback if no phone
if (n.entity_type === "invoice" && n.entity_id) {
  router.push(`/dashboard/invoices?id=${n.entity_id}`);
  return;
}

if (n.entity_type === "partner" && n.entity_id) {
  router.push(`/dashboard/partners?id=${n.entity_id}`);
  return;
}
 // 🔥 3️⃣ NAVIGATION

}}
    className={`w-full text-left px-3 py-2 text-sm border-b hover:bg-gray-50 ${
      !n.is_read ? "bg-red-50" : ""
    }`}
  >

          <div className="font-medium flex items-center gap-2">
  {n.type === "SMS" && "📩"}
  {n.type === "MISSED_CALL" && "📞"}
  {n.type === "CALL" && "📲"}

  {n.title}
</div>
          <div className="text-xs text-gray-600">{n.body}</div>
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


{aiOpen && (

  
  <div className="fixed inset-0 z-50 flex">

    
  


   {/* Overlay */}
<div
  className="flex-1 bg-black/40"
  onClick={() => setAiOpen(false)}
/>

{/* Panel */}
<div className="w-full max-w-md bg-white shadow-xl flex flex-col">

  <div className="p-4 border-b flex items-center justify-between">
    <span className="font-semibold">Admin AI</span>

    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          realtimeVoice.connected
            ? realtimeVoice.stop()
            : realtimeVoice.start();
        }}
        className={`px-2 py-1 text-xs rounded text-white ${
          realtimeVoice.connected ? "bg-red-700" : "bg-black"
        }`}
      >
        {realtimeVoice.connected ? "■" : "🎙"}
      </button>

      <button
        onClick={() => setAiOpen(false)}
        className="text-sm px-2 py-1 border rounded"
      >
        Close
      </button>
    </div>
  </div>

  <select
    value={aiTone}
    onChange={(e) => setAiTone(e.target.value as any)}
    className="w-full border rounded p-1 text-xs mb-2"
  >
    <option value="neutral">Neutral</option>
    <option value="direct">Direct / Blunt</option>
    <option value="technical">Technical</option>
    <option value="sales">Sales / Persuasive</option>
  </select>



      <div className="relative">
  <textarea
    ref={aiTextareaRef}
    value={aiQuestion}
    onChange={(e) => setAiQuestion(e.target.value)}
    placeholder={
      realtimeVoice.connected
        ? "Listening… speak now"
        : "Ask anything about the system, data, pages, or performance…"
    }
    className="w-full h-28 border rounded p-2 text-base pr-12 focus:outline-none"
    inputMode="text"
    autoCorrect="off"
    autoCapitalize="off"
    spellCheck={false}
  />

  <button
    onClick={() => {
      if (!realtimeVoice.supported) {
        alert("Live voice is not supported on this browser.");
        return;
      }

      realtimeVoice.connected
        ? realtimeVoice.stop()
        : realtimeVoice.start();
    }}
    className={`absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center text-white
      ${realtimeVoice.connected ? "bg-red-700" : "bg-gray-900"}`}
  >
    🎙
  </button>
</div>




        <button
          onClick={askAdminAI}
          disabled={aiLoading}
          className="bg-red-700 text-white py-2 rounded text-sm font-semibold hover:bg-red-800 disabled:opacity-60"
        >
          {aiLoading ? "Thinking..." : "Ask AI"}
        </button>

        <div
  className="bg-gray-900 text-green-400 text-xs rounded p-3 whitespace-pre-wrap overflow-y-auto"
  style={{
    maxHeight: "45vh",
  }}
>
  {aiAnswer || "AI ready."}
</div>

      </div>
    </div>
  
)}

{customerPanel && (
  <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
    <div className="w-full max-w-md bg-white h-full shadow-xl overflow-y-auto">

      <div className="p-4 border-b flex justify-between items-center">
        <strong>Customer</strong>
        <button onClick={() => setCustomerPanel(null)}>✕</button>
      </div>

      <div className="p-4 space-y-6">

        {/* PHONE */}
        <div>
          <h3 className="font-bold text-sm text-gray-500">Phone</h3>
          <p className="text-base">{customerPanel.phone}</p>
        </div>

        {/* LEADS */}
        <div>
          <h3 className="font-bold">Leads</h3>
          {customerPanel.leads?.length === 0 && (
            <p className="text-sm text-gray-500">No leads found</p>
          )}
          {customerPanel.leads?.map((l: any) => (
            <div key={l.id} className="border p-3 rounded mb-2">
              <p className="font-medium">
                {l.name || `${l.first_name || ""} ${l.last_name || ""}`}
              </p>
              <p className="text-xs text-gray-500">{l.email}</p>
            </div>
          ))}
        </div>

        {/* PARTNERS */}
        <div>
          <h3 className="font-bold">Partners</h3>
          {customerPanel.partners?.length === 0 && (
            <p className="text-sm text-gray-500">No partners found</p>
          )}
          {customerPanel.partners?.map((p: any) => (
            <div key={p.id} className="border p-3 rounded mb-2">
              <p className="font-medium">
                {p.first_name} {p.last_name}
              </p>
              <p className="text-xs text-gray-500">
                {p.email_address}
              </p>
            </div>
          ))}
        </div>

        {/* INVOICES */}
        <div>
          <h3 className="font-bold">Invoices</h3>
          {customerPanel.invoices?.length === 0 && (
            <p className="text-sm text-gray-500">No invoices found</p>
          )}
          {customerPanel.invoices?.map((i: any) => (
            <div key={i.id} className="border p-3 rounded mb-2">
              <p className="font-medium">
                Invoice #{i.invoice_number}
              </p>
              <p className="text-xs text-gray-500">
                ${i.amount}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  </div>
)}
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
                href="/dashboard/sitemap"
                icon={<MapIcon size={20} />}
                label="Sitemap"
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
                href="/dashboard/contractors"
                icon={<Building2 size={20} />}
                label="Contractors"
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
                href="/dashboard/google-search-console"
                icon={<DatabaseIcon size={20} />}
                label="GSC Analytics"
                onClick={() => setShowMore(false)}
              />
              <MoreTile
                href="/dashboard/page-request" 
                icon={<DatabaseIcon size={20} />}
                label="Page Requests Leads"
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

