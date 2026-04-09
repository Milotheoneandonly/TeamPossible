import { getWorkoutPlanTemplates, getExercises, getExerciseCategories } from "@/actions/workouts";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Dumbbell, UserPlus, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExerciseList } from "@/components/coach/exercise-list";
import { DeleteWorkoutPlanButton } from "@/components/coach/delete-button";

export default async function WorkoutPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ assign?: string; tab?: string }>;
}) {
  const { assign: assignClientId, tab } = await searchParams;
  const activeTab = tab || "mallar";
  const supabase = await createClient();

  let clientName = "";
  if (assignClientId) {
    const { data } = await supabase
      .from("clients")
      .select("profile:profiles!clients_profile_id_fkey(first_name, last_name)")
      .eq("id", assignClientId)
      .single();
    if (data?.profile) {
      clientName = `${(data.profile as any).first_name} ${(data.profile as any).last_name}`;
    }
  }

  const templates = await getWorkoutPlanTemplates();
  const exercises = activeTab === "ovningar" ? await getExercises() : [];
  const categories = activeTab === "ovningar" ? await getExerciseCategories() : [];

  const { data: assignedPlans } = await supabase
    .from("workout_plans")
    .select(`
      id, title, is_active, created_at,
      workout_days (id),
      client:clients (id, profile:profiles!clients_profile_id_fkey (first_name, last_name))
    `)
    .eq("is_template", false)
    .order("created_at", { ascending: false });

  function planLink(planId: string) {
    return assignClientId ? `/workouts/${planId}?assign=${assignClientId}` : `/workouts/${planId}`;
  }

  const categoryMap = new Map((categories || []).map((c: any) => [c.id, c.name_sv || c.name]));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Assign banner */}
      {assignClientId && (
        <div className="bg-primary-lighter border border-primary/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <UserPlus className="w-5 h-5 text-primary-darker shrink-0" />
          <div>
            <p className="text-sm font-medium text-primary-darker">Välj ett program att tilldela till {clientName}</p>
            <p className="text-xs text-primary-darker/70">Klicka på en mall nedan för att tilldela den</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-text-primary">Träning</h1>
        <div className="flex gap-2">
          {activeTab === "mallar" && !assignClientId && (
            <Link href="/workouts/new"><Button><Plus className="w-4 h-4" /> Nytt program</Button></Link>
          )}
          {activeTab === "ovningar" && (
            <Link href="/workouts/new-exercise"><Button><Plus className="w-4 h-4" /> Lägg till övning</Button></Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      {!assignClientId && (
        <div className="flex gap-6 mb-8 border-b border-border">
          <Link href="/workouts?tab=mallar" className={`text-sm font-medium pb-3 border-b-2 transition-colors ${activeTab === "mallar" ? "text-primary-darker border-primary-darker" : "text-text-muted border-transparent hover:text-text-primary"}`}>
            Mallar
          </Link>
          <Link href="/workouts?tab=ovningar" className={`text-sm font-medium pb-3 border-b-2 transition-colors ${activeTab === "ovningar" ? "text-primary-darker border-primary-darker" : "text-text-muted border-transparent hover:text-text-primary"}`}>
            Övningar
          </Link>
        </div>
      )}

      {/* MALLAR TAB */}
      {(activeTab === "mallar" || assignClientId) && (
        <>
          {(!templates || templates.length === 0) ? (
            <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
              <Dumbbell className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted">Inga mallar skapade än</p>
              <Link href="/workouts/new" className="text-sm text-primary-darker hover:underline mt-2 inline-block">Skapa din första mall →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {templates.map((plan: any) => (
                <Link key={plan.id} href={planLink(plan.id)}>
                  <div className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all ${assignClientId ? "border-primary/30 hover:border-primary" : "border-border hover:border-primary/30"}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-lighter flex items-center justify-center shrink-0">
                        <Dumbbell className="w-5 h-5 text-primary-darker" />
                      </div>
                      <h3 className="font-semibold text-text-primary truncate flex-1">{plan.title}</h3>
                      {!assignClientId && <DeleteWorkoutPlanButton planId={plan.id} planTitle={plan.title} />}
                    </div>
                    <p className="text-xs text-text-muted">{plan.workout_days?.length || 0} träningsdagar</p>
                    {assignClientId && <p className="text-xs text-primary-darker font-medium mt-3">Klicka för att tilldela →</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Assigned plans */}
          {!assignClientId && assignedPlans && assignedPlans.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-4">Tilldelade program</h2>
              <div className="bg-white rounded-2xl border border-border shadow-sm divide-y divide-border-light">
                {assignedPlans.map((plan: any) => (
                  <Link key={plan.id} href={`/workouts/${plan.id}`}>
                    <div className="px-5 py-4 flex items-center justify-between hover:bg-surface-hover transition-colors">
                      <div>
                        <p className="font-medium text-text-primary">{plan.title}</p>
                        <p className="text-sm text-text-muted">
                          {plan.client?.profile?.first_name} {plan.client?.profile?.last_name} — {plan.workout_days?.length || 0} dagar
                        </p>
                      </div>
                      {plan.is_active && <span className="text-xs font-medium bg-success/10 text-success px-2.5 py-1 rounded-full">Aktiv</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ÖVNINGAR TAB */}
      {activeTab === "ovningar" && !assignClientId && (
        <>
          <p className="text-sm text-text-secondary mb-4">
            Visar {exercises?.length || 0} övningar
          </p>

          {(!exercises || exercises.length === 0) ? (
            <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
              <Library className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted">Inga övningar tillagda än</p>
              <Link href="/workouts/new-exercise" className="text-sm text-primary-darker hover:underline mt-2 inline-block">Lägg till din första övning →</Link>
            </div>
          ) : (
            <ExerciseList exercises={exercises as any} />
          )}
        </>
      )}
    </div>
  );
}
