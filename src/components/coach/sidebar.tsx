"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import {
  LayoutDashboard,
  Users,
  Target,
  Salad,
  Dumbbell,
  MessageSquare,
  FolderOpen,
  LogOut,
  Menu,
  X,
  Settings,
  ChevronUp,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Klienter", icon: Users },
  { href: "/leads", label: "Leads", icon: Target },
  { href: "/foods", label: "Näring", icon: Salad },
  { href: "/workouts", label: "Träning", icon: Dumbbell },
  { href: "/content", label: "Innehåll", icon: FolderOpen },
  { href: "/messages", label: "Meddelanden", icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name, email, avatar_url")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data);
    }
    loadProfile();
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    function close(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [profileOpen]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = profile
    ? `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase()
    : "?";

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-border h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs">P</span>
          </div>
          <span className="font-bold text-text-primary">{APP_NAME}</span>
        </div>
        <button onClick={() => setOpen(!open)} className="p-2">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-64 bg-white border-r border-border flex flex-col transition-transform duration-200",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-6 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="text-xl font-bold text-text-primary">{APP_NAME}</span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-lighter text-primary-darker"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Profile card */}
        <div ref={profileRef} className="relative p-3 border-t border-border">
          {/* Dropdown menu (opens upward) */}
          {profileOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-border rounded-xl shadow-lg overflow-hidden z-50">
              {/* Profile info */}
              <div className="px-4 py-3 border-b border-border-light">
                <p className="text-sm font-semibold text-text-primary">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-xs text-text-muted truncate">{profile?.email}</p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <Link
                  href="/settings"
                  onClick={() => { setProfileOpen(false); setOpen(false); }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-hover transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Inställningar
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-hover transition-colors w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Logga ut
                </button>
              </div>
            </div>
          )}

          {/* Profile button */}
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-surface-hover transition-colors"
          >
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full overflow-hidden bg-primary-lighter flex items-center justify-center shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-primary-darker">{initials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-text-primary truncate">
                {profile ? `${profile.first_name} ${profile.last_name}` : "Laddar..."}
              </p>
              <p className="text-[10px] text-text-muted truncate">{profile?.email || ""}</p>
            </div>
            <ChevronUp className={cn(
              "w-4 h-4 text-text-muted shrink-0 transition-transform",
              profileOpen ? "rotate-0" : "rotate-180"
            )} />
          </button>
        </div>
      </aside>
    </>
  );
}
