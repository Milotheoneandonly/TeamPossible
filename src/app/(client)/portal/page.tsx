import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Salad,
  Dumbbell,
  ClipboardCheck,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

export default async function ClientPortal() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  // Get client record
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  // Get active meal plan
  const { data: activeMealPlan } = client
    ? await supabase
        .from("meal_plans")
        .select("id, title, target_calories, target_protein_g, target_carbs_g, target_fat_g")
        .eq("client_id", client.id)
        .eq("is_active", true)
        .single()
    : { data: null };

  // Get active workout plan
  const { data: activeWorkoutPlan } = client
    ? await supabase
        .from("workout_plans")
        .select("id, title, workout_days(id, name, day_number)")
        .eq("client_id", client.id)
        .eq("is_active", true)
        .single()
    : { data: null };

  // Get pending check-in
  const { data: pendingCheckIn } = client
    ? await supabase
        .from("check_ins")
        .select("id, created_at")
        .eq("client_id", client.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
    : { data: null };

  // Get latest progress entry
  const { data: latestProgress } = client
    ? await supabase
        .from("progress_entries")
        .select("weight_kg, date")
        .eq("client_id", client.id)
        .order("date", { ascending: false })
        .limit(1)
        .single()
    : { data: null };

  const greeting = getGreeting();

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          {greeting}, {profile?.first_name || "där"}! 👋
        </h1>
        <p className="text-text-secondary mt-1">
          Här är din översikt för idag
        </p>
      </div>

      {/* Quick stats */}
      {latestProgress && (
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wide">Senaste vikt</p>
              <p className="text-2xl font-bold text-text-primary mt-1">
                {latestProgress.weight_kg} kg
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary-lighter flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-darker" />
            </div>
          </div>
        </div>
      )}

      {/* Action cards */}
      <div className="space-y-3">
        {/* Meal plan card */}
        <Link href="/portal/meals">
          <div className="bg-white rounded-2xl border border-border p-4 shadow-sm flex items-center gap-4 hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
              <Salad className="w-6 h-6 text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-text-primary">Kostplan</h3>
              {activeMealPlan ? (
                <p className="text-sm text-text-secondary truncate">
                  {activeMealPlan.title} — {activeMealPlan.target_calories} kcal
                </p>
              ) : (
                <p className="text-sm text-text-muted">
                  Ingen kostplan tilldelad än
                </p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted shrink-0" />
          </div>
        </Link>

        {/* Workout card */}
        <Link href="/portal/workouts">
          <div className="bg-white rounded-2xl border border-border p-4 shadow-sm flex items-center gap-4 hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-primary-lighter flex items-center justify-center shrink-0">
              <Dumbbell className="w-6 h-6 text-primary-darker" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-text-primary">Träning</h3>
              {activeWorkoutPlan ? (
                <p className="text-sm text-text-secondary truncate">
                  {activeWorkoutPlan.title} — {(activeWorkoutPlan as any).workout_days?.length || 0} dagar
                </p>
              ) : (
                <p className="text-sm text-text-muted">
                  Inget träningsprogram tilldelat än
                </p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted shrink-0" />
          </div>
        </Link>

        {/* Check-in card */}
        <Link href="/portal/check-in">
          <div className={`bg-white rounded-2xl border p-4 shadow-sm flex items-center gap-4 hover:border-primary/30 transition-colors ${
            pendingCheckIn ? "border-warning/50 bg-warning/5" : "border-border"
          }`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              pendingCheckIn ? "bg-warning/10" : "bg-surface"
            }`}>
              <ClipboardCheck className={`w-6 h-6 ${
                pendingCheckIn ? "text-warning" : "text-text-muted"
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-text-primary">Check-in</h3>
              {pendingCheckIn ? (
                <p className="text-sm text-warning font-medium">
                  Du har en väntande check-in!
                </p>
              ) : (
                <p className="text-sm text-text-muted">
                  Ingen check-in att fylla i just nu
                </p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted shrink-0" />
          </div>
        </Link>

        {/* Progress card */}
        <Link href="/portal/progress">
          <div className="bg-white rounded-2xl border border-border p-4 shadow-sm flex items-center gap-4 hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-text-primary">Framsteg</h3>
              <p className="text-sm text-text-secondary">
                Se din utveckling över tid
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted shrink-0" />
          </div>
        </Link>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 10) return "God morgon";
  if (hour < 18) return "Hej";
  return "God kväll";
}
