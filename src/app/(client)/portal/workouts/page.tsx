import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Dumbbell, ChevronRight } from "lucide-react";

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

  // Fetch ALL active plans (multiple allowed). No .single() — fixes the old silent null bug.
  const { data: plans } = await supabase
    .from("workout_plans")
    .select(`
      id, title, description, image_url,
      workout_days (
        id, day_number, name, sort_order,
        workout_exercises ( id, sets )
      )
    `)
    .eq("client_id", client.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (!plans || plans.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-text-primary">Träning</h1>
        <div className="bg-white rounded-2xl border border-border p-10 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-primary-lighter/40 flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-6 h-6 text-primary-darker" />
          </div>
          <p className="font-semibold text-text-primary">Inget aktivt träningsprogram</p>
          <p className="text-sm text-text-muted mt-1">Din coach kommer att tilldela ett program till dig.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 -mx-4 -mt-6">
      {plans.map((plan: any) => {
        const days = (plan.workout_days || []).sort(
          (a: any, b: any) => (a.sort_order ?? a.day_number) - (b.sort_order ?? b.day_number)
        );

        return (
          <section key={plan.id}>
            {/* Hero image — compact */}
            <div className="relative w-full h-36 overflow-hidden bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">
              {plan.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={plan.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-20">
                  <Dumbbell className="w-12 h-12 text-white" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
            </div>

            {/* Plan title + description */}
            <div className="px-4 pt-5">
              <h1 className="text-2xl font-bold text-text-primary leading-tight">{plan.title}</h1>
              {plan.description && (
                <p className="text-sm text-text-secondary mt-1.5">{plan.description}</p>
              )}
              <p className="text-sm font-semibold text-text-primary mt-5">Plan översikt</p>
            </div>

            {/* Days list */}
            <div className="mt-3 px-4 space-y-2.5">
              {days.map((day: any) => {
                const exerciseCount = day.workout_exercises?.length || 0;
                const setCount = (day.workout_exercises || []).reduce(
                  (sum: number, we: any) => sum + (we.sets || 0),
                  0
                );

                return (
                  <Link
                    key={day.id}
                    href={`/portal/workouts/day/${day.id}`}
                    className="flex items-center gap-3 bg-white rounded-2xl border border-border p-4 shadow-sm hover:border-primary/40 hover:shadow-md transition-all active:scale-[0.99]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary text-sm leading-snug truncate">
                        {day.name || `Dag ${day.day_number}`}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {exerciseCount} övningar
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-text-secondary">{setCount} set</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
