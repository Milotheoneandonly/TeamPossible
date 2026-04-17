import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Dumbbell, Play } from "lucide-react";

// Friendly Swedish labels for muscle_groups / equipment slugs coming from exercise DB
const MUSCLE_LABELS: Record<string, string> = {
  glutes: "Sätesmuskler",
  hamstrings: "Baksida lår",
  quads: "Framsida lår",
  quadriceps: "Framsida lår",
  calves: "Vader",
  abductors: "Yttersida lår",
  adductors: "Insida lår",
  chest: "Bröst",
  back: "Rygg",
  lats: "Latissimus",
  traps: "Kappmuskel",
  shoulders: "Axlar",
  delts: "Delter",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Underarmar",
  core: "Bål",
  abs: "Magmuskler",
  obliques: "Sneda magmuskler",
  "lower back": "Nedre rygg",
  "upper back": "Övre rygg",
  hips: "Höfter",
  full_body: "Hela kroppen",
};

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: "Skivstång",
  dumbbell: "Hantel",
  dumbbells: "Hantel",
  cable: "Kabel",
  machine: "Maskin",
  bodyweight: "Kroppsvikt",
  kettlebell: "Kettlebell",
  band: "Gummiband",
  bench: "Bänk",
  "smith machine": "Smith-maskin",
  "ez-bar": "EZ-stång",
  plate: "Viktplatta",
  "medicine ball": "Medicinboll",
  "stability ball": "Pilatesboll",
};

function label(map: Record<string, string>, value: string) {
  const key = value.toLowerCase().trim();
  return map[key] || value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function WorkoutDayPage({
  params,
}: {
  params: Promise<{ dayId: string }>;
}) {
  const { dayId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: day } = await supabase
    .from("workout_days")
    .select(`
      id, day_number, name, plan_id,
      plan:workout_plans ( id, title, description ),
      workout_exercises (
        id, sets, reps, rest_seconds, tempo, notes, sort_order, superset_group,
        exercise:exercises (
          id, name, name_sv, muscle_groups, equipment, thumbnail_url, video_url
        )
      )
    `)
    .eq("id", dayId)
    .single();

  if (!day) notFound();

  const exercises = ((day.workout_exercises || []) as any[]).sort(
    (a, b) => a.sort_order - b.sort_order
  );

  const totalSets = exercises.reduce((s, we) => s + (we.sets || 0), 0);

  // Aggregate unique equipment + muscle groups across all exercises in the day
  const equipmentSet = new Set<string>();
  const muscleSet = new Set<string>();
  for (const we of exercises) {
    const ex = (we as any).exercise;
    (ex?.equipment || []).forEach((e: string) => e && equipmentSet.add(e));
    (ex?.muscle_groups || []).forEach((m: string) => m && muscleSet.add(m));
  }

  const planTitle = (day as any).plan?.title || "Träning";
  const dayName = day.name || `Dag ${day.day_number}`;

  return (
    <div className="-mx-4 -mt-6 pb-24 min-h-[calc(100vh-6rem)] bg-surface">
      {/* Back header */}
      <div className="sticky top-14 z-30 bg-surface/95 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
        <Link
          href="/portal/workouts"
          className="w-9 h-9 rounded-full bg-white border border-border shadow-sm flex items-center justify-center hover:bg-surface-hover transition-colors"
          aria-label="Tillbaka"
        >
          <ArrowLeft className="w-4 h-4 text-text-primary" />
        </Link>
        <p className="text-sm font-semibold text-text-primary truncate">{dayName}</p>
      </div>

      <div className="px-4 space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary leading-tight">{dayName}</h1>
          <p className="text-sm text-text-secondary mt-1">{planTitle}</p>
        </div>

        {/* Utrustning */}
        {equipmentSet.size > 0 && (
          <div>
            <p className="text-sm font-semibold text-text-primary mb-2">Utrustning:</p>
            <div className="flex flex-wrap gap-2">
              {[...equipmentSet].map((e) => (
                <span
                  key={e}
                  className="inline-flex items-center px-3 py-1.5 rounded-full bg-white border border-border text-xs font-medium text-text-primary"
                >
                  {label(EQUIPMENT_LABELS, e)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Målmuskler */}
        {muscleSet.size > 0 && (
          <div>
            <p className="text-sm font-semibold text-text-primary mb-2">Målmuskler:</p>
            <div className="flex flex-wrap gap-2">
              {[...muscleSet].map((m) => (
                <span
                  key={m}
                  className="inline-flex items-center px-3 py-1.5 rounded-full bg-white border border-border text-xs font-medium text-text-primary"
                >
                  {label(MUSCLE_LABELS, m)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Exercise count summary */}
        <div>
          <p className="text-lg font-bold text-text-primary">{exercises.length} övningar</p>
          <p className="text-sm text-text-muted">{totalSets} set</p>
        </div>

        {/* Exercise list */}
        <div className="space-y-4">
          {exercises.map((we: any) => {
            const ex = we.exercise;
            const name = ex?.name_sv || ex?.name || "Övning";
            const rest = we.rest_seconds ? `${Math.round(we.rest_seconds / 60)} m vila` : null;
            return (
              <div key={we.id}>
                <p className="font-bold text-text-primary text-sm mb-1.5">{name}</p>
                <div className="bg-white rounded-2xl border border-border p-3 shadow-sm flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface shrink-0 border border-border-light">
                    {ex?.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ex.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary text-sm truncate">{name}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {we.sets} set · {we.reps} reps{rest ? ` · ${rest}` : ""}
                    </p>
                  </div>
                </div>
                {rest && (
                  <p className="text-xs text-text-muted mt-1.5 flex items-center gap-1 pl-1">
                    <Clock className="w-3 h-3" />
                    {rest} efter övning
                  </p>
                )}
                {we.notes && (
                  <p className="text-xs text-text-muted mt-1 italic pl-1">{we.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Starta button */}
      <div className="fixed bottom-16 left-0 right-0 z-40 pointer-events-none">
        <div className="max-w-lg mx-auto px-4 pointer-events-auto">
          <Link
            href={`/portal/workouts/log?day=${dayId}`}
            className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white font-semibold rounded-2xl shadow-xl hover:bg-slate-800 transition-colors active:scale-[0.98]"
          >
            <Play className="w-5 h-5" fill="currentColor" />
            Starta träningspasset
          </Link>
        </div>
      </div>
    </div>
  );
}
