import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Play, ChevronRight } from "lucide-react";

export default async function WorkoutsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">Inget klientkonto hittat.</p>
      </div>
    );
  }

  const { data: workoutPlan } = await supabase
    .from("workout_plans")
    .select(`
      id, title, description,
      workout_days (
        id, day_number, name, sort_order,
        workout_exercises (
          id, sets, reps, rest_seconds, tempo, notes, sort_order, superset_group,
          exercise:exercises (id, name, name_sv, muscle_groups, equipment, video_url, thumbnail_url)
        )
      )
    `)
    .eq("client_id", client.id)
    .eq("is_active", true)
    .single();

  if (!workoutPlan) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-text-primary">Träning</h1>
        <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
          <p className="text-text-muted">Inget aktivt träningsprogram tilldelat än.</p>
          <p className="text-sm text-text-muted mt-2">
            Din coach kommer att tilldela ett program åt dig.
          </p>
        </div>
      </div>
    );
  }

  const days = (workoutPlan.workout_days || []).sort(
    (a: any, b: any) => (a.sort_order ?? a.day_number) - (b.sort_order ?? b.day_number)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">{workoutPlan.title}</h1>
        {workoutPlan.description && (
          <p className="text-sm text-text-secondary mt-1">{workoutPlan.description}</p>
        )}
      </div>

      <div className="space-y-3">
        {days.map((day: any) => {
          const exercises = (day.workout_exercises || []).sort(
            (a: any, b: any) => a.sort_order - b.sort_order
          );

          return (
            <div key={day.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              {/* Day header */}
              <div className="px-4 py-3 bg-surface border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-text-primary">
                  {day.name || `Dag ${day.day_number}`}
                </h2>
                <span className="text-xs text-text-muted bg-white px-2 py-1 rounded-lg">
                  {exercises.length} övningar
                </span>
              </div>

              {/* Exercises */}
              <div className="divide-y divide-border-light">
                {exercises.map((we: any, idx: number) => {
                  const ex = we.exercise;
                  const name = ex?.name_sv || ex?.name || "Okänd övning";
                  const muscles = ex?.muscle_groups?.join(", ") || "";

                  return (
                    <div key={we.id} className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-lighter flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary-darker">
                            {idx + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary text-sm">
                            {name}
                          </p>
                          {muscles && (
                            <p className="text-xs text-text-muted mt-0.5">{muscles}</p>
                          )}
                          <div className="flex gap-3 mt-1.5 text-xs text-text-secondary">
                            <span>{we.sets} set × {we.reps} reps</span>
                            {we.rest_seconds && (
                              <span>Vila: {we.rest_seconds}s</span>
                            )}
                            {we.tempo && <span>Tempo: {we.tempo}</span>}
                          </div>
                          {we.notes && (
                            <p className="text-xs text-text-muted mt-1 italic">
                              {we.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Log workout button */}
              <div className="px-4 py-3 border-t border-border">
                <Link
                  href={`/portal/workouts/log?day=${day.id}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary-dark transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Logga träning
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
