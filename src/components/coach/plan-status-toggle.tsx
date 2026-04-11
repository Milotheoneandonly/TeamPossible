"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

export function PlanStatusToggle({
  planId,
  isActive,
  table,
}: {
  planId: string;
  isActive: boolean;
  table: "meal_plans" | "workout_plans";
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(isActive);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function toggle(newStatus: boolean) {
    setStatus(newStatus);
    setOpen(false);
    await supabase.from(table).update({ is_active: newStatus }).eq("id", planId);
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
          status
            ? "bg-success/10 text-success hover:bg-success/20"
            : "bg-surface text-text-muted hover:bg-surface-hover"
        }`}
      >
        {status ? "Aktiv" : "Inaktiv"}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg z-50 py-1 min-w-[120px]">
          <button
            onClick={() => toggle(true)}
            className={`w-full text-left px-3 py-2 text-sm transition-colors ${
              status ? "bg-success/5 text-success font-medium" : "hover:bg-surface"
            }`}
          >
            Aktiv
          </button>
          <button
            onClick={() => toggle(false)}
            className={`w-full text-left px-3 py-2 text-sm transition-colors ${
              !status ? "bg-surface text-text-primary font-medium" : "hover:bg-surface"
            }`}
          >
            Inaktiv
          </button>
        </div>
      )}
    </div>
  );
}
