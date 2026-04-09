"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Salad, Dumbbell, TrendingUp, MessageSquare } from "lucide-react";

const navItems = [
  { href: "/portal", label: "Hem", icon: Home },
  { href: "/portal/meals", label: "Kost", icon: Salad },
  { href: "/portal/workouts", label: "Träning", icon: Dumbbell },
  { href: "/portal/progress", label: "Framsteg", icon: TrendingUp },
  { href: "/portal/messages", label: "Meddelanden", icon: MessageSquare },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/portal"
              ? pathname === "/portal"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[60px]",
                isActive
                  ? "text-primary-darker"
                  : "text-text-muted"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5",
                  isActive && "stroke-[2.5]"
                )}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
