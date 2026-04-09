"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteMealPlan, deleteWorkoutPlan } from "@/actions/delete";
import { useRouter } from "next/navigation";

export function DeleteMealPlanButton({ planId, planTitle }: { planId: string; planTitle: string }) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Är du säker på att du vill ta bort "${planTitle}"?`)) return;
    setDeleting(true);
    await deleteMealPlan(planId);
    router.refresh();
  }

  return (
    <button onClick={handleDelete} disabled={deleting}
      className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors"
      title="Ta bort">
      {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  );
}

export function DeleteWorkoutPlanButton({ planId, planTitle }: { planId: string; planTitle: string }) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Är du säker på att du vill ta bort "${planTitle}"?`)) return;
    setDeleting(true);
    await deleteWorkoutPlan(planId);
    router.refresh();
  }

  return (
    <button onClick={handleDelete} disabled={deleting}
      className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors"
      title="Ta bort">
      {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  );
}
