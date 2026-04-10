"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getClients() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select(`
      id, status, goals, start_date, notes, created_at,
      profile:profiles!clients_profile_id_fkey (
        id, first_name, last_name, email, phone, avatar_url
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getClient(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select(`
      *,
      profile:profiles!clients_profile_id_fkey (
        id, first_name, last_name, email, phone, avatar_url, locale
      )
    `)
    .eq("id", clientId)
    .single();

  if (error) throw error;
  return data;
}

export async function inviteClient(formData: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  goals?: string;
  notes?: string;
  check_in_day?: number; // 0=Mon..6=Sun, undefined=no reminder
}) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Get the coach's profile ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Ej inloggad");

  // Create the user account via admin API
  const tempPassword = generateTempPassword();
  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email: formData.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      role: "client",
      first_name: formData.firstName,
      last_name: formData.lastName,
    },
  });

  if (createError) {
    if (createError.message?.includes("already been registered")) {
      throw new Error("Denna e-postadress är redan registrerad.");
    }
    throw createError;
  }

  if (!newUser.user) throw new Error("Kunde inte skapa användare");

  // Update phone if provided
  if (formData.phone) {
    await supabase
      .from("profiles")
      .update({ phone: formData.phone })
      .eq("id", newUser.user.id);
  }

  // Create the client record
  const { error: clientError } = await supabase.from("clients").insert({
    profile_id: newUser.user.id,
    coach_id: user.id,
    goals: formData.goals || null,
    notes: formData.notes || null,
    check_in_day: formData.check_in_day ?? null,
  });

  if (clientError) throw clientError;

  revalidatePath("/clients");
  revalidatePath("/dashboard");

  return { tempPassword, email: formData.email };
}

export async function updateClient(
  clientId: string,
  data: {
    status?: string;
    goals?: string;
    notes?: string;
    dietary_preferences?: string[];
    allergies?: string[];
    height_cm?: number;
    target_weight_kg?: number;
    activity_level?: string;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update(data)
    .eq("id", clientId);

  if (error) throw error;
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
}

export async function getClientStats() {
  const supabase = await createClient();

  const { count: activeClients } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { count: pendingCheckIns } = await supabase
    .from("check_ins")
    .select("*", { count: "exact", head: true })
    .eq("status", "submitted");

  const { count: unreadMessages } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false);

  return {
    activeClients: activeClients || 0,
    pendingCheckIns: pendingCheckIns || 0,
    unreadMessages: unreadMessages || 0,
  };
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
