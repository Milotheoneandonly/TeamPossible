import { getClient } from "@/actions/clients";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Salad,
  Dumbbell,
  TrendingUp,
  ClipboardCheck,
  MessageSquare,
  User,
  Calendar,
  Target,
} from "lucide-react";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  let client: any;

  try {
    client = await getClient(clientId);
  } catch {
    notFound();
  }

  const supabase = await createClient();
  const profile = client.profile;

  // Get active plans
  const { data: activeMealPlan } = await supabase
    .from("meal_plans")
    .select("id, title, target_calories")
    .eq("client_id", clientId)
    .eq("is_active", true)
    .single();

  const { data: activeWorkoutPlan } = await supabase
    .from("workout_plans")
    .select("id, title")
    .eq("client_id", clientId)
    .eq("is_active", true)
    .single();

  // Get latest progress
  const { data: latestProgress } = await supabase
    .from("progress_entries")
    .select("weight_kg, date, energy_level")
    .eq("client_id", clientId)
    .order("date", { ascending: false })
    .limit(1)
    .single();

  // Get pending check-ins count
  const { count: pendingCheckIns } = await supabase
    .from("check_ins")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("status", "submitted");

  // Get unread messages
  const { count: unreadMessages } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("is_read", false);

  const initials = `${profile?.first_name?.[0] || ""}${profile?.last_name?.[0] || ""}`.toUpperCase();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Alla klienter
      </Link>

      {/* Client header */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-lighter flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-primary-darker">{initials}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {profile?.first_name} {profile?.last_name}
            </h1>
            <p className="text-text-secondary">{profile?.email}</p>
            {profile?.phone && (
              <p className="text-sm text-text-muted">{profile.phone}</p>
            )}
          </div>
          <div className="ml-auto">
            <span
              className={`text-sm font-medium px-3 py-1.5 rounded-full ${
                client.status === "active"
                  ? "bg-success/10 text-success"
                  : client.status === "paused"
                  ? "bg-warning/10 text-warning"
                  : "bg-surface text-text-muted"
              }`}
            >
              {client.status === "active" ? "Aktiv" : client.status === "paused" ? "Pausad" : "Inaktiv"}
            </span>
          </div>
        </div>

        {/* Client details */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {client.goals && (
            <div className="flex items-start gap-2">
              <Target className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-text-muted">Mål</p>
                <p className="text-sm text-text-primary">{client.goals}</p>
              </div>
            </div>
          )}
          {client.start_date && (
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-text-muted">Startdatum</p>
                <p className="text-sm text-text-primary">
                  {new Date(client.start_date).toLocaleDateString("sv-SE")}
                </p>
              </div>
            </div>
          )}
          {latestProgress?.weight_kg && (
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-text-muted">Senaste vikt</p>
                <p className="text-sm text-text-primary">{latestProgress.weight_kg} kg</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Meal plan */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <Salad className="w-5 h-5 text-success" />
            </div>
            <h3 className="font-semibold text-text-primary">Kostplan</h3>
          </div>
          {activeMealPlan ? (
            <p className="text-sm text-text-secondary">
              {activeMealPlan.title}
              {activeMealPlan.target_calories && ` — ${activeMealPlan.target_calories} kcal`}
            </p>
          ) : (
            <p className="text-sm text-text-muted">Ingen kostplan tilldelad</p>
          )}
          <Link
            href="/meal-plans"
            className="text-sm font-medium text-primary-darker hover:underline mt-3 inline-block"
          >
            {activeMealPlan ? "Ändra plan" : "Tilldela plan"} →
          </Link>
        </div>

        {/* Workout plan */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-lighter flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-darker" />
            </div>
            <h3 className="font-semibold text-text-primary">Träningsprogram</h3>
          </div>
          {activeWorkoutPlan ? (
            <p className="text-sm text-text-secondary">{activeWorkoutPlan.title}</p>
          ) : (
            <p className="text-sm text-text-muted">Inget program tilldelat</p>
          )}
          <Link
            href="/workouts"
            className="text-sm font-medium text-primary-darker hover:underline mt-3 inline-block"
          >
            {activeWorkoutPlan ? "Ändra program" : "Tilldela program"} →
          </Link>
        </div>

        {/* Check-ins */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-warning" />
            </div>
            <h3 className="font-semibold text-text-primary">Check-ins</h3>
          </div>
          <p className="text-sm text-text-secondary">
            {pendingCheckIns
              ? `${pendingCheckIns} väntande check-in${pendingCheckIns > 1 ? "s" : ""}`
              : "Inga väntande check-ins"}
          </p>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-semibold text-text-primary">Meddelanden</h3>
          </div>
          <p className="text-sm text-text-secondary">
            {unreadMessages
              ? `${unreadMessages} oläst${unreadMessages > 1 ? "a" : ""} meddelande${unreadMessages > 1 ? "n" : ""}`
              : "Inga olästa meddelanden"}
          </p>
        </div>
      </div>

      {/* Coach notes */}
      {client.notes && (
        <div className="mt-6 bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold text-text-primary mb-2">Anteckningar</h3>
          <p className="text-sm text-text-secondary whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}
    </div>
  );
}
