"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

export async function deleteClient(clientId: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Get the client's profile_id first
  const { data: client } = await supabase
    .from("clients")
    .select("profile_id")
    .eq("id", clientId)
    .single();

  if (!client) throw new Error("Klient hittades inte");

  // Delete the client record (cascades to related data via FK)
  const { error: clientError } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId);

  if (clientError) throw clientError;

  // Delete the auth user via admin API
  const { error: authError } = await adminClient.auth.admin.deleteUser(client.profile_id);
  if (authError) {
    console.error("Could not delete auth user:", authError);
  }

  revalidatePath("/clients");
  revalidatePath("/dashboard");
}
