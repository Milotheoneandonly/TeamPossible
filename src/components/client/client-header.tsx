"use client";

import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";

export function ClientHeader({
  name,
  initialAvatarUrl,
}: {
  name: string;
  initialAvatarUrl?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl || null);
  const [initials, setInitials] = useState(name.slice(0, 1).toUpperCase());

  async function refreshProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url, first_name, last_name")
      .eq("id", user.id)
      .single();
    if (data) {
      setAvatarUrl(data.avatar_url || null);
      const f = data.first_name?.[0] || "";
      const l = data.last_name?.[0] || "";
      setInitials(`${f}${l}`.toUpperCase() || name.slice(0, 1).toUpperCase());
    }
  }

  useEffect(() => {
    refreshProfile();
    function handler() { refreshProfile(); }
    window.addEventListener("profile-updated", handler);
    return () => window.removeEventListener("profile-updated", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs">P</span>
          </div>
          <span className="font-semibold text-text-primary text-sm">
            {APP_NAME}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href="/portal/settings"
            aria-label="Mitt konto"
            className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-primary/30 transition-all bg-primary-lighter flex items-center justify-center"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-primary-darker">{initials || "?"}</span>
            )}
          </Link>
          <button
            onClick={handleLogout}
            aria-label="Logga ut"
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
