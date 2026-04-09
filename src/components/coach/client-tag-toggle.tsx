"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function ClientTagToggle({ clientId, currentTags }: { clientId: string; currentTags: string[] }) {
  const [tags, setTags] = useState<string[]>(currentTags || []);
  const supabase = createClient();
  const router = useRouter();

  const hasComp = tags.includes("COMP");

  async function toggleComp() {
    const newTags = hasComp
      ? tags.filter((t) => t !== "COMP")
      : [...tags, "COMP"];

    setTags(newTags);

    await supabase
      .from("clients")
      .update({ tags: newTags })
      .eq("id", clientId);

    router.refresh();
  }

  return (
    <button
      onClick={toggleComp}
      className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
        hasComp
          ? "bg-accent text-white"
          : "bg-surface text-text-muted border border-border hover:border-primary/50"
      }`}
      title={hasComp ? "Ta bort COMP" : "Lägg till COMP"}
    >
      {hasComp ? "COMP" : "—"}
    </button>
  );
}
