import { createClient } from "@/lib/supabase/server";
import { getClient } from "@/actions/clients";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Dumbbell, Plus, Activity, StickyNote, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteWorkoutPlanButton } from "@/components/coach/delete-button";
import { PlanStatusToggle } from "@/components/coach/plan-status-toggle";

export default async function ClientTraningPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  let client: any;
  try { client = await getClient(clientId); } catch { notFound(); }

  const supabase = await createClient();
  const profile = client.profile;
  const initials = `${profile?.first_name?.[0] || ""}${profile?.last_name?.[0] || ""}`.toUpperCase();

  // Plans
  const { data: workoutPlans } = await supabase
    .from("workout_plans")
    .select(`
      id, title, description, is_active, created_at,
      workout_days (id)
    `)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  // Recent workout sessions with sets
  const { data: recentLogs } = await supabase
    .from("workout_logs")
    .select(`
      id, date, duration_minutes, completed, created_at, notes,
      workout_day:workout_days ( id, name, day_number, plan:workout_plans(title) ),
      workout_log_sets (
        id, set_number, weight_kg, reps, completed,
        exercise:exercises ( id, name, name_sv )
      )
    `)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(10);

  // Client's saved per-exercise notes
  const { data: exerciseNotes } = await supabase
    .from("client_exercise_notes")
    .select(`
      id, note, updated_at,
      exercise:exercises ( id, name, name_sv )
    `)
    .eq("client_id", clientId)
    .not("note", "is", null)
    .order("updated_at", { ascending: false });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href={`/clients/${clientId}`} className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Alla klienter
      </Link>

      {/* Client header */}
      <div className="flex items-center gap-5 mb-8">
        <div className="w-16 h-16 rounded-full bg-primary-lighter flex items-center justify-center shrink-0">
          <span className="text-xl font-bold text-primary-darker">{initials}</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{profile?.first_name} {profile?.last_name}</h1>
          <div className="flex gap-6 mt-3 text-sm">
            <Link href={`/clients/${clientId}`} className="text-text-muted hover:text-text-primary pb-1">Översikt</Link>
            <Link href={`/clients/${clientId}/naring`} className="text-text-muted hover:text-text-primary pb-1">Näring</Link>
            <span className="font-medium text-primary-darker border-b-2 border-primary-darker pb-1">Träning</span>
            <Link href={`/clients/${clientId}/framsteg`} className="text-text-muted hover:text-text-primary pb-1">Framsteg</Link>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-text-secondary">
          Visar {workoutPlans?.length || 0} träningsschema{(workoutPlans?.length || 0) !== 1 ? "n" : ""}
        </p>
        <Link href={`/workouts?assign=${clientId}`}>
          <Button><Plus className="w-4 h-4" /> Lägg till träningsschema</Button>
        </Link>
      </div>

      {/* Plans list */}
      {(!workoutPlans || workoutPlans.length === 0) ? (
        <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
          <Dumbbell className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">Inga träningsscheman tilldelade</p>
          <Link href={`/workouts?assign=${clientId}`} className="text-sm text-primary-darker hover:underline mt-2 inline-block">
            Tilldela ett träningsschema →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="grid grid-cols-[1fr_200px_100px_60px_40px] gap-4 px-5 py-3 border-b border-border text-xs font-semibold text-text-muted uppercase tracking-wide">
            <span>Namn</span>
            <span>Introduktion</span>
            <span>Status</span>
            <span className="text-right">Pass</span>
            <span></span>
          </div>
          <div className="divide-y divide-border-light">
            {workoutPlans.map((plan: any) => (
              <div key={plan.id} className="grid grid-cols-[1fr_200px_100px_60px_40px] gap-4 px-5 py-4 items-center hover:bg-surface-hover transition-colors">
                <Link href={`/workouts/${plan.id}`}>
                  <p className="font-medium text-text-primary">{plan.title}</p>
                </Link>
                <p className="text-sm text-text-muted truncate">{plan.description || "—"}</p>
                <PlanStatusToggle planId={plan.id} isActive={plan.is_active} table="workout_plans" />
                <p className="text-sm font-medium text-text-primary text-right">{plan.workout_days?.length || 0}</p>
                <DeleteWorkoutPlanButton planId={plan.id} planTitle={plan.title} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent sessions */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-darker" />
          Senaste träningspass
        </h2>
        {recentLogs && recentLogs.length > 0 ? (
          <div className="bg-white rounded-2xl border border-border shadow-sm divide-y divide-border-light">
            {recentLogs.map((log: any) => {
              const dayName = log.workout_day?.name || `Dag ${log.workout_day?.day_number || "?"}`;
              const planTitle = log.workout_day?.plan?.title;
              const sets = (log.workout_log_sets || []) as any[];
              const completedSets = sets.filter((s) => s.completed).length;

              // Group sets by exercise
              const byExercise: Record<string, { name: string; rows: any[] }> = {};
              for (const s of sets) {
                const name = s.exercise?.name_sv || s.exercise?.name || "Övning";
                const key = s.exercise?.id || name;
                if (!byExercise[key]) byExercise[key] = { name, rows: [] };
                byExercise[key].rows.push(s);
              }

              return (
                <details key={log.id} className="group">
                  <summary className="px-5 py-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-hover transition-colors list-none">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-text-primary truncate">{dayName}</p>
                        {planTitle && <span className="text-xs text-text-muted truncate">· {planTitle}</span>}
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {new Date(log.created_at).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" })}
                        {" · "}
                        {completedSets}/{sets.length} set klara
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-text-muted shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-4 space-y-3">
                    {Object.values(byExercise).map((ex, i) => (
                      <div key={i} className="rounded-xl bg-surface p-3">
                        <p className="text-sm font-semibold text-text-primary mb-2">{ex.name}</p>
                        <div className="space-y-1">
                          {ex.rows
                            .slice()
                            .sort((a, b) => (a.set_number || 0) - (b.set_number || 0))
                            .map((r) => (
                              <div key={r.id} className="flex items-center justify-between text-sm">
                                <span className="text-text-muted w-10">Set {r.set_number}</span>
                                <span className="font-medium text-text-primary w-16 text-right">
                                  {r.reps ?? "—"} reps
                                </span>
                                <span className="font-medium text-text-primary w-20 text-right">
                                  {r.weight_kg != null ? `${r.weight_kg} kg` : "—"}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${r.completed ? "bg-success/10 text-success" : "bg-surface-hover text-text-muted"}`}>
                                  {r.completed ? "Klar" : "Ej"}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                    {log.notes && (
                      <div className="rounded-xl bg-primary-lighter/30 p-3">
                        <p className="text-xs font-semibold text-primary-darker mb-0.5">Kommentar från klient</p>
                        <p className="text-sm text-primary-darker">{log.notes}</p>
                      </div>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
            <p className="text-sm text-text-muted">Inga loggade pass än.</p>
          </div>
        )}
      </section>

      {/* Client's exercise notes */}
      {exerciseNotes && exerciseNotes.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-primary-darker" />
            Klientens övningsanteckningar
          </h2>
          <div className="bg-white rounded-2xl border border-border shadow-sm divide-y divide-border-light">
            {exerciseNotes.map((n: any) => {
              const name = n.exercise?.name_sv || n.exercise?.name || "Övning";
              return (
                <div key={n.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <p className="text-sm font-semibold text-text-primary">{name}</p>
                    <span className="text-[11px] text-text-muted">
                      {new Date(n.updated_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">{n.note}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
