"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Loader2, Plus, Minus } from "lucide-react";
import Link from "next/link";

interface ExerciseSet {
  weight: string;
  reps: string;
  completed: boolean;
}

interface ExerciseLog {
  exerciseId: string;
  name: string;
  targetSets: number;
  targetReps: string;
  sets: ExerciseSet[];
}

export default function WorkoutLogPage() {
  const searchParams = useSearchParams();
  const dayId = searchParams.get("day");
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dayName, setDayName] = useState("");

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadDay() {
      if (!dayId) return;

      const { data: day } = await supabase
        .from("workout_days")
        .select(`
          name, day_number,
          workout_exercises (
            id, sets, reps, sort_order,
            exercise:exercises (id, name, name_sv)
          )
        `)
        .eq("id", dayId)
        .single();

      if (day) {
        setDayName(day.name || `Dag ${day.day_number}`);
        const workoutExercises = ((day as any).workout_exercises || [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order);

        setExercises(
          workoutExercises.map((we: any) => ({
            exerciseId: we.exercise?.id || we.id,
            name: we.exercise?.name_sv || we.exercise?.name || "Övning",
            targetSets: we.sets || 3,
            targetReps: we.reps || "10",
            sets: Array.from({ length: we.sets || 3 }, () => ({
              weight: "",
              reps: "",
              completed: false,
            })),
          }))
        );
      }

      setLoading(false);
    }

    loadDay();
  }, [dayId]);

  function updateSet(exIdx: number, setIdx: number, field: "weight" | "reps", value: string) {
    setExercises((prev) => {
      const next = [...prev];
      next[exIdx] = {
        ...next[exIdx],
        sets: next[exIdx].sets.map((s, i) =>
          i === setIdx ? { ...s, [field]: value } : s
        ),
      };
      return next;
    });
  }

  function toggleSet(exIdx: number, setIdx: number) {
    setExercises((prev) => {
      const next = [...prev];
      next[exIdx] = {
        ...next[exIdx],
        sets: next[exIdx].sets.map((s, i) =>
          i === setIdx ? { ...s, completed: !s.completed } : s
        ),
      };
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (!client) return;

    // Create workout log
    const { data: log } = await supabase
      .from("workout_logs")
      .insert({
        client_id: client.id,
        workout_day_id: dayId,
        completed: true,
      })
      .select()
      .single();

    if (log) {
      // Create log sets
      const logSets = exercises.flatMap((ex) =>
        ex.sets
          .filter((s) => s.completed || s.weight || s.reps)
          .map((s, idx) => ({
            log_id: log.id,
            exercise_id: ex.exerciseId,
            set_number: idx + 1,
            weight_kg: s.weight ? parseFloat(s.weight) : null,
            reps: s.reps ? parseInt(s.reps) : null,
            completed: s.completed,
          }))
      );

      if (logSets.length > 0) {
        await supabase.from("workout_log_sets").insert(logSets);
      }
    }

    setSaving(false);
    setSaved(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Träning loggad!</h2>
        <p className="text-text-secondary mt-2">Bra jobbat! Fortsätt så.</p>
        <Button className="mt-6" onClick={() => router.push("/portal/workouts")}>
          Tillbaka till träning
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/portal/workouts" className="p-2 -ml-2 text-text-secondary hover:text-text-primary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Logga träning</h1>
          <p className="text-sm text-text-secondary">{dayName}</p>
        </div>
      </div>

      {exercises.map((ex, exIdx) => (
        <div key={exIdx} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-surface border-b border-border">
            <h3 className="font-semibold text-text-primary text-sm">{ex.name}</h3>
            <p className="text-xs text-text-muted">Mål: {ex.targetSets} set × {ex.targetReps} reps</p>
          </div>

          <div className="p-4">
            {/* Header row */}
            <div className="grid grid-cols-[40px_1fr_1fr_40px] gap-2 mb-2 text-xs text-text-muted font-medium">
              <span>Set</span>
              <span>Vikt (kg)</span>
              <span>Reps</span>
              <span></span>
            </div>

            {ex.sets.map((set, setIdx) => (
              <div
                key={setIdx}
                className={`grid grid-cols-[40px_1fr_1fr_40px] gap-2 items-center py-1.5 ${
                  set.completed ? "opacity-60" : ""
                }`}
              >
                <span className="text-sm font-medium text-text-muted text-center">
                  {setIdx + 1}
                </span>
                <input
                  type="number"
                  step="0.5"
                  value={set.weight}
                  onChange={(e) => updateSet(exIdx, setIdx, "weight", e.target.value)}
                  placeholder="—"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <input
                  type="number"
                  value={set.reps}
                  onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value)}
                  placeholder={ex.targetReps}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <button
                  onClick={() => toggleSet(exIdx, setIdx)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    set.completed
                      ? "bg-success text-white"
                      : "bg-surface text-text-muted hover:bg-success/20"
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Button onClick={handleSave} className="w-full" size="lg" disabled={saving}>
        {saving ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <CheckCircle className="w-5 h-5" />
        )}
        {saving ? "Sparar..." : "Spara träning"}
      </Button>
    </div>
  );
}
