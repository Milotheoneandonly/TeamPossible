"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteMealPlan(planId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("meal_plans").delete().eq("id", planId);
  if (error) throw error;
  revalidatePath("/foods");
  revalidatePath("/meal-plans");
}

export async function deleteWorkoutPlan(planId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("workout_plans").delete().eq("id", planId);
  if (error) throw error;
  revalidatePath("/workouts");
}
