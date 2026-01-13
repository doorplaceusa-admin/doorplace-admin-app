"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import PartnerMessages from "./dashboard/components/PartnerMessages";
import { useAppViewTracker } from "@/lib/useAppViewTracker";


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
  useAppViewTracker({
  role: "partner",
  companyId: null,
});

  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [profilePartner, setProfilePartner] = useState<any>(null);
  const [viewProfileOpen, setViewProfileOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [viewItem, setViewItem] = useState<any>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const isLegalPage = pathname.includes("/legal");
  const lastAdminMessageRef = useRef<string | null>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [passwordLoading, setPasswordLoading] = useState(false);
const [passwordMessage, setPasswordMessage] = useState<string | null>(null);




  


useEffect(() => {
  if (!profilePartner?.partner_id) return;

  const interval = setInterval(async () => {
    const { data } = await supabase
      .from("partner_messages")
      .select("id, sender")
      .eq("partner_id", profilePartner.partner_id)
      .order("created_at", { ascending: false })
      .limit(1);

    const latest = data?.[0];

    if (
      latest &&
      latest.sender === "admin" &&
      latest.id !== lastAdminMessageRef.current &&
      !chatOpen
    ) {
      setHasUnread(true);
      lastAdminMessageRef.current = latest.id;
    }
  }, 3000);

  return () => clearInterval(interval);
}, [profilePartner?.partner_id, chatOpen]);




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
<div className="h-[100dvh] bg-gray-100 flex max-w-full overflow-hidden">



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
<div
  className={`flex-1 flex flex-col max-w-full overflow-x-hidden ${
    isLegalPage ? "h-auto overflow-y-auto" : "h-full overflow-hidden"

  }`}
>

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
    setViewProfileOpen(true);

    setProfileOpen(false);
  }}
  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
>
  My Profile
</button>

<button
  onClick={() => {
    setProfileOpen(false);
    setChangePasswordOpen(true);
  }}
  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
>
  Reset Password
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
  onClick={() => {
    setChatOpen(true);
    setHasUnread(false); // clear unread when opening
  }}
  className="relative text-[11px] text-red-700 font-semibold leading-none mt-1"
>
  Live Chat

  {hasUnread && (
    <span className="absolute -top-1 -right-2 h-2 w-2 bg-red-600 rounded-full" />
  )}
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
        <PartnerMessages
  partnerId={profilePartner.partner_id}
  onNewMessage={() => {
    if (!chatOpen) {
      setHasUnread(true);
    }
  }}
/>

      </div>

    </div>
  </div>
)}


        {/* ===== PAGE CONTENT ===== */}
<main
  className={`flex-1 overflow-x-hidden px-1 md:px-6 ${
    isLegalPage ? "pb-[1500px]" : "pb-1 md:pb-1"
  }`}
>

  <div className="min-h-[400dvh] overflow-y-auto space-y-4 max-w-[1300px] w-full mx-auto">
    {children}
    {/* ===== TINY LEGAL FOOTER ===== */}
<footer className="w-full text-center text-[50x] opacity-60 py-2">
  <Link href="/legal/terms" className="mx-1 hover:underline">
    Terms
  </Link>
  •
  <Link href="/legal/privacy" className="mx-1 hover:underline">
    Privacy
  </Link>
  •
  <Link href="/legal/commissions" className="mx-1 hover:underline">
    Commission Terms
  </Link>
</footer>


  </div>
</main>


        {/* ===== MOBILE BOTTOM NAV ===== */}
        {!isLegalPage && <PartnerBottomNav />}

      {/* ===============================
   GLOBAL PARTNER PROFILE MODAL
================================ */}
{viewProfileOpen && profilePartner && (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded max-w-2xl w-full max-h-[75vh] flex flex-col shadow-lg">

      {/* HEADER */}
      <div className="sticky top-0 bg-white z-10 border-b p-5">
        <h2 className="text-xl font-bold">My Profile</h2>
        <p className="text-sm text-gray-500">
          Partner ID:{" "}
          <span className="font-mono">{profilePartner.partner_id}</span>
        </p>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-5 text-sm space-y-6">

  {/* BASIC INFORMATION */}
  <section>
    <h3 className="font-bold text-base mb-3">Basic Information</h3>

    <p><b>Name:</b> {profilePartner.first_name} {profilePartner.last_name}</p>
    <p><b>Email:</b> {profilePartner.email_address}</p>
    <p><b>Phone:</b> {profilePartner.phone}</p>
    <p><b>Partner ID:</b> {profilePartner.partner_id}</p>
    <p>
      <b>Joined Date:</b>{" "}
      {profilePartner.created_at
        ? new Date(profilePartner.created_at).toLocaleDateString()
        : "—"}
    </p>
  </section>

  {/* BUSINESS INFORMATION */}
  <section>
    <h3 className="font-bold text-base mb-3">Business Information</h3>

    <p><b>Business Name:</b> {profilePartner.business_name || "—"}</p>
    <p><b>Coverage Area:</b> {profilePartner.coverage_area || "—"}</p>
    <p><b>Preferred Contact:</b> {profilePartner.preferred_contact_method || "—"}</p>
    <p><b>Sales Experience:</b> {profilePartner.sales_experience || "—"}</p>
  </section>

  {/* ADDRESS */}
  <section>
    <h3 className="font-bold text-base mb-3">Address</h3>

    <p><b>Street:</b> {profilePartner.street_address || "—"}</p>
    <p><b>City:</b> {profilePartner.city || "—"}</p>
    <p><b>State:</b> {profilePartner.state || "—"}</p>
    <p><b>Zip:</b> {profilePartner.zip || "—"}</p>
  </section>

</div>


      {/* FOOTER */}
      <div className="border-t p-4 flex gap-3 flex-wrap">

        <button
  className="bg-gray-800 text-white px-4 py-2 rounded flex-1"
  onClick={() => {
    setViewProfileOpen(false);
    setChangePasswordOpen(true);
  }}
>
  Change Password
</button>


        <button
          className="bg-black text-white px-4 py-2 rounded flex-1"
          onClick={() => setViewProfileOpen(false)}
        >
          Close
        </button>

        <button
          className="bg-red-700 text-white px-4 py-2 rounded flex-1"
          onClick={() => {
            setViewProfileOpen(false);
            setEditProfileOpen(true);
          }}
        >
          Edit Profile
        </button>
      </div>
      

    </div>
  </div>
)}

{editProfileOpen && profilePartner && (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded w-full max-w-[92vw] sm:max-w-2xl max-h-[75vh] flex flex-col shadow-lg">


      {/* HEADER */}
      <div className="sticky top-0 bg-white z-10 border-b p-5">
        <h2 className="text-xl font-bold">Edit Profile</h2>
        <p className="text-sm text-gray-500">
          Partner ID: <span className="font-mono">{profilePartner.partner_id}</span>
        </p>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-5 text-sm space-y-6">

        {/* BASIC INFORMATION */}
        <section>
          <h3 className="font-bold text-base mb-3">Basic Information</h3>

          <Input
            label="First Name"
            value={profilePartner.first_name}
            onChange={(v) =>
              setProfilePartner({ ...profilePartner, first_name: v })
            }
          />

          <Input
            label="Last Name"
            value={profilePartner.last_name}
            onChange={(v) =>
              setProfilePartner({ ...profilePartner, last_name: v })
            }
          />

          <Input
            label="Email"
            value={profilePartner.email_address}
            disabled
          />

          <Input
            label="Phone"
            value={profilePartner.phone}
            onChange={(v) =>
              setProfilePartner({ ...profilePartner, phone: v })
            }
          />
        </section>

        {/* BUSINESS INFORMATION */}
        <section>
          <h3 className="font-bold text-base mb-3">Business Information</h3>

          <Input
            label="Business Name"
            value={profilePartner.business_name}
            onChange={(v) =>
              setProfilePartner({ ...profilePartner, business_name: v })
            }
          />

          <Input
            label="Coverage Area"
            value={profilePartner.coverage_area}
            onChange={(v) =>
              setProfilePartner({ ...profilePartner, coverage_area: v })
            }
          />

          <Input
            label="Preferred Contact"
            value={profilePartner.preferred_contact_method}
            onChange={(v) =>
              setProfilePartner({
                ...profilePartner,
                preferred_contact_method: v,
              })
            }
          />

          <Input
            label="Sales Experience"
            value={profilePartner.sales_experience}
            onChange={(v) =>
              setProfilePartner({
                ...profilePartner,
                sales_experience: v,
              })
            }
          />
        </section>

        {/* ADDRESS */}
        <section>
          <h3 className="font-bold text-base mb-3">Address</h3>

          <Input
            label="Street"
            value={profilePartner.street_address}
            onChange={(v) =>
              setProfilePartner({ ...profilePartner, street_address: v })
            }
          />

          <Input
            label="City"
            value={profilePartner.city}
            onChange={(v) =>
              setProfilePartner({ ...profilePartner, city: v })
            }
          />

          <Input
            label="State"
            value={profilePartner.state}
            onChange={(v) =>
              setProfilePartner({ ...profilePartner, state: v })
            }
          />

          <Input
            label="Zip"
            value={profilePartner.zip}
            onChange={(v) =>
              setProfilePartner({ ...profilePartner, zip: v })
            }
          />
        </section>

      </div>

      {/* FOOTER */}
      <div className="border-t p-4 flex gap-3">
        <button
          className="bg-gray-300 px-4 py-2 rounded flex-1"
          onClick={() => setEditProfileOpen(false)}
        >
          Cancel
        </button>

        <button
          className="bg-red-700 text-white px-4 py-2 rounded flex-1"
          onClick={async () => {
            await supabase
              .from("partners")
              .update({
                first_name: profilePartner.first_name,
                last_name: profilePartner.last_name,
                phone: profilePartner.phone,
                business_name: profilePartner.business_name,
                coverage_area: profilePartner.coverage_area,
                preferred_contact_method: profilePartner.preferred_contact_method,
                sales_experience: profilePartner.sales_experience,
                street_address: profilePartner.street_address,
                city: profilePartner.city,
                state: profilePartner.state,
                zip: profilePartner.zip,
              })
              .eq("id", profilePartner.id);

            setEditProfileOpen(false);
          }}
        >
          Save Changes
        </button>

        
      </div>
      
    </div>
    
  </div>
)}

{changePasswordOpen && (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded max-w-md w-full p-6 space-y-4 shadow-lg">
      <h2 className="text-lg font-bold">Reset Password</h2>

      <Input
        label="New Password"
        value={newPassword}
        onChange={setNewPassword}
      />

      <Input
        label="Confirm Password"
        value={confirmPassword}
        onChange={setConfirmPassword}
      />

      {passwordMessage && (
        <p className="text-sm text-red-600">{passwordMessage}</p>
      )}

      <div className="flex gap-3 pt-3">
        <button
          className="bg-gray-300 px-4 py-2 rounded flex-1"
          onClick={() => {
            setChangePasswordOpen(false);
            setPasswordMessage(null);
            setNewPassword("");
            setConfirmPassword("");
          }}
        >
          Cancel
        </button>

        <button
          className="bg-red-700 text-white px-4 py-2 rounded flex-1"
          disabled={passwordLoading}
          onClick={async () => {
            if (newPassword.length < 6) {
              setPasswordMessage("Password must be at least 6 characters");
              return;
            }

            if (newPassword !== confirmPassword) {
              setPasswordMessage("Passwords do not match");
              return;
            }

            setPasswordLoading(true);
            setPasswordMessage(null);

            const { error } = await supabase.auth.updateUser({
              password: newPassword,
            });

            if (error) {
              setPasswordMessage(error.message);
            } else {
              setPasswordMessage("Password updated successfully");
              setTimeout(() => {
                setChangePasswordOpen(false);
                setNewPassword("");
                setConfirmPassword("");
              }, 1200);
            }

            setPasswordLoading(false);
          }}
        >
          {passwordLoading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  </div>
)}



      </div>
    </div>
  );
}






/* ======================
   MOBILE BOTTOM NAV
====================== */

function PartnerBottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  // 🚫 HARD STOP: never render on legal pages
  if (pathname.includes("/legal")) {
    return null;
  }

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
          label="Comm"
        />
        <MobileNavItem
          href="/partners/orders"
          icon={<Package size={20} />}
          label="Orders"
        />
        <MobileNavItem
          href="/partners/leads"
          icon={<UserRoundPenIcon size={20} />}
          label="Leads"
        />
        <MobileNavItem
          href="/partners/resources"
          icon={<BookOpen size={20} />}
          label="Resources"
        />

    
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

function Input({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value?: string | null;
  onChange?: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <input
        className={`border w-full px-3 py-2 rounded ${
          disabled ? "bg-gray-100 text-gray-600 cursor-not-allowed" : ""
        }`}
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}

