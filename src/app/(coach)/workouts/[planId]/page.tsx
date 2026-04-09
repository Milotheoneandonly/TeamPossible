import { getWorkoutPlan } from "@/actions/workouts";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Dumbbell } from "lucide-react";

export default async function WorkoutPlanDetailPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  let plan: any;

  try {
    plan = await getWorkoutPlan(planId);
  } catch {
    notFound();
  }

  const days = (plan.workout_days || []).sort(
    (a: any, b: any) => (a.sort_order ?? a.day_number) - (b.sort_order ?? b.day_number)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/workouts"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Alla program
      </Link>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{plan.title}</h1>
            {plan.description && (
              <p className="text-text-secondary mt-1">{plan.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            {plan.is_template && (
              <span className="text-xs font-medium bg-primary-lighter text-primary-darker px-3 py-1.5 rounded-full">Mall</span>
            )}
            {plan.is_active && (
              <span className="text-xs font-medium bg-success/10 text-success px-3 py-1.5 rounded-full">Aktiv</span>
            )}
          </div>
        </div>
      </div>

      {/* Days */}
      <div className="space-y-6">
        {days.map((day: any) => {
          const exercises = (day.workout_exercises || []).sort(
            (a: any, b: any) => a.sort_order - b.sort_order
          );

          return (
            <div key={day.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-surface border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-text-primary">
                  {day.name || `Dag ${day.day_number}`}
                </h2>
                <span className="text-xs text-text-muted">{exercises.length} övningar</span>
              </div>

              {exercises.length === 0 ? (
                <div className="p-5 text-center">
                  <p className="text-sm text-text-muted italic">Inga övningar tillagda än</p>
                </div>
              ) : (
                <div className="divide-y divide-border-light">
                  {exercises.map((we: any, idx: number) => {
                    const ex = we.exercise;
                    return (
                      <div key={we.id} className="px-5 py-3 flex items-center gap-4">
                        <div className="w-9 h-9 rounded-lg bg-primary-lighter flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary-darker">{idx + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary text-sm">
                            {ex?.name_sv || ex?.name || "Övning"}
                          </p>
                          <div className="flex gap-3 mt-0.5 text-xs text-text-muted">
                            {ex?.muscle_groups?.map((mg: string) => (
                              <span key={mg}>{mg}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-4 text-sm text-text-secondary shrink-0">
                          <div className="text-center">
                            <p className="text-xs text-text-muted">Set</p>
                            <p className="font-medium">{we.sets}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-text-muted">Reps</p>
                            <p className="font-medium">{we.reps}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-text-muted">Vila</p>
                            <p className="font-medium">{we.rest_seconds}s</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {days.length === 0 && (
        <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
          <Dumbbell className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">Programmet har skapats. Lägg till övningar för att börja bygga det.</p>
        </div>
      )}
    </div>
  );
}
