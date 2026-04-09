"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Dumbbell, Loader2, UserPlus, CheckCircle } from "lucide-react";

export default function WorkoutPlanDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const planId = params.planId as string;
  const assignClientId = searchParams.get("assign");

  const [plan, setPlan] = useState<any>(null);
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assigned, setAssigned] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadPlan();
    if (assignClientId) loadClientName();
  }, []);

  async function loadPlan() {
    const { data } = await supabase
      .from("workout_plans")
      .select(`
        *,
        workout_days (
          id, day_number, name, sort_order,
          workout_exercises (
            id, sort_order, sets, reps, rest_seconds, tempo, notes, superset_group,
            exercise:exercises (id, name, name_sv, muscle_groups, equipment, video_url)
          )
        )
      `)
      .eq("id", planId)
      .single();

    setPlan(data);
    setLoading(false);
  }

  async function loadClientName() {
    if (!assignClientId) return;
    const { data } = await supabase
      .from("clients")
      .select("profile:profiles!clients_profile_id_fkey(first_name, last_name)")
      .eq("id", assignClientId)
      .single();
    if (data?.profile) {
      setClientName(`${(data.profile as any).first_name} ${(data.profile as any).last_name}`);
    }
  }

  async function handleAssignToClient() {
    if (!assignClientId || !plan) return;
    setSaving(true);

    // Deactivate current active plan
    await supabase
      .from("workout_plans")
      .update({ is_active: false })
      .eq("client_id", assignClientId)
      .eq("is_active", true);

    if (plan.is_template) {
      // Duplicate template for client
      const { data: newPlan } = await supabase
        .from("workout_plans")
        .insert({
          coach_id: plan.coach_id,
          client_id: assignClientId,
          title: plan.title,
          description: plan.description,
          is_template: false,
          is_active: true,
        })
        .select()
        .single();

      if (newPlan) {
        for (const day of (plan.workout_days || [])) {
          const { data: newDay } = await supabase
            .from("workout_days")
            .insert({ plan_id: newPlan.id, day_number: day.day_number, name: day.name, sort_order: day.sort_order })
            .select()
            .single();

          if (newDay) {
            for (const we of (day.workout_exercises || [])) {
              await supabase.from("workout_exercises").insert({
                workout_day_id: newDay.id,
                exercise_id: we.exercise?.id,
                sort_order: we.sort_order,
                sets: we.sets,
                reps: we.reps,
                rest_seconds: we.rest_seconds,
                tempo: we.tempo,
                notes: we.notes,
                superset_group: we.superset_group,
              });
            }
          }
        }
      }
    } else {
      await supabase
        .from("workout_plans")
        .update({ client_id: assignClientId, is_active: true })
        .eq("id", planId);
    }

    setSaving(false);
    setAssigned(true);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (assigned) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Program tilldelat!</h2>
        <p className="text-text-secondary mt-2">{plan?.title} har tilldelats till {clientName}</p>
        <Button className="mt-6" onClick={() => router.push(`/clients/${assignClientId}`)}>
          Tillbaka till klient
        </Button>
      </div>
    );
  }

  if (!plan) {
    return <div className="max-w-4xl mx-auto px-4 py-8 text-center"><p className="text-text-muted">Program hittades inte.</p></div>;
  }

  const days = (plan.workout_days || []).sort((a: any, b: any) => (a.sort_order ?? a.day_number) - (b.sort_order ?? b.day_number));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href={assignClientId ? `/clients/${assignClientId}` : "/workouts"}
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {assignClientId ? "Tillbaka till klient" : "Alla program"}
      </Link>

      {/* Assign banner */}
      {assignClientId && (
        <div className="bg-primary-lighter border border-primary/20 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary-darker">
              Tilldela till {clientName}
            </p>
            <p className="text-xs text-primary-darker/70">
              Klicka knappen för att tilldela detta program
            </p>
          </div>
          <Button onClick={handleAssignToClient} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {saving ? "Tilldelar..." : "Tilldela program"}
          </Button>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{plan.title}</h1>
            {plan.description && <p className="text-text-secondary mt-1">{plan.description}</p>}
          </div>
          <div className="flex gap-2">
            {plan.is_template && <span className="text-xs font-medium bg-primary-lighter text-primary-darker px-3 py-1.5 rounded-full">Mall</span>}
            {plan.is_active && <span className="text-xs font-medium bg-success/10 text-success px-3 py-1.5 rounded-full">Aktiv</span>}
          </div>
        </div>
      </div>

      {/* Days */}
      <div className="space-y-6">
        {days.map((day: any) => {
          const exercises = (day.workout_exercises || []).sort((a: any, b: any) => a.sort_order - b.sort_order);

          return (
            <div key={day.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-surface border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-text-primary">{day.name || `Dag ${day.day_number}`}</h2>
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
                          <p className="font-medium text-text-primary text-sm">{ex?.name_sv || ex?.name || "Övning"}</p>
                          <div className="flex gap-3 mt-0.5 text-xs text-text-muted">
                            {ex?.muscle_groups?.map((mg: string) => <span key={mg}>{mg}</span>)}
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
          <p className="text-text-muted">Inga övningar tillagda än.</p>
        </div>
      )}
    </div>
  );
}
