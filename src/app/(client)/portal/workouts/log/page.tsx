"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Check, Loader2, X, Play, StickyNote, Clock, Dumbbell,
} from "lucide-react";
import { getYouTubeThumbnail } from "@/lib/youtube";

interface SetRow { weight: string; reps: string; completed: boolean; }
interface ExerciseState {
  weId: string;
  exerciseId: string;
  name: string;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  muscleGroups: string[];
  equipment: string[];
  targetSets: number;
  targetReps: string;
  restSeconds: number | null;
  coachNotes: string | null;
  sets: SetRow[];
}

export default function WorkoutSessionPage() {
  const searchParams = useSearchParams();
  const dayId = searchParams.get("day");
  const supabase = createClient();
  const router = useRouter();

  const [dayName, setDayName] = useState("");
  const [exercises, setExercises] = useState<ExerciseState[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [modalExerciseIdx, setModalExerciseIdx] = useState<number | null>(null);
  const [modalNote, setModalNote] = useState("");
  const [modalNoteLoading, setModalNoteLoading] = useState(false);
  const [modalNoteSaved, setModalNoteSaved] = useState(false);

  useEffect(() => {
    (async () => {
      if (!dayId) { setLoading(false); return; }

      // Load day + exercises
      const { data: day } = await supabase
        .from("workout_days")
        .select(`
          id, name, day_number,
          workout_exercises (
            id, sets, reps, rest_seconds, notes, sort_order,
            exercise:exercises (
              id, name, name_sv, muscle_groups, equipment, thumbnail_url, video_url
            )
          )
        `)
        .eq("id", dayId)
        .single();

      if (!day) { setLoading(false); return; }
      setDayName(day.name || `Dag ${day.day_number}`);

      const sortedWe = ((day as any).workout_exercises || []).sort(
        (a: any, b: any) => a.sort_order - b.sort_order
      );

      // Prefill last session's weights/reps so client doesn't start blank
      const { data: { user } } = await supabase.auth.getUser();
      let lastSetsByExercise: Record<string, { weight_kg: number | null; reps: number | null }[]> = {};

      if (user) {
        const { data: client } = await supabase
          .from("clients")
          .select("id")
          .eq("profile_id", user.id)
          .single();

        if (client) {
          const { data: lastLog } = await supabase
            .from("workout_logs")
            .select("id")
            .eq("client_id", client.id)
            .eq("workout_day_id", dayId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (lastLog) {
            const { data: lastSets } = await supabase
              .from("workout_log_sets")
              .select("exercise_id, set_number, weight_kg, reps")
              .eq("log_id", lastLog.id)
              .order("set_number", { ascending: true });
            if (lastSets) {
              for (const s of lastSets) {
                if (!lastSetsByExercise[s.exercise_id]) lastSetsByExercise[s.exercise_id] = [];
                lastSetsByExercise[s.exercise_id][s.set_number - 1] = { weight_kg: s.weight_kg, reps: s.reps };
              }
            }
          }
        }
      }

      setExercises(
        sortedWe.map((we: any) => {
          const ex = we.exercise;
          const last = lastSetsByExercise[ex?.id] || [];
          const targetSets = we.sets || 3;
          const thumb = ex?.thumbnail_url || (ex?.video_url ? getYouTubeThumbnail(ex.video_url) : null);
          return {
            weId: we.id,
            exerciseId: ex?.id || "",
            name: ex?.name_sv || ex?.name || "Övning",
            thumbnailUrl: thumb,
            videoUrl: ex?.video_url || null,
            muscleGroups: ex?.muscle_groups || [],
            equipment: ex?.equipment || [],
            targetSets,
            targetReps: we.reps || "10",
            restSeconds: we.rest_seconds || null,
            coachNotes: we.notes || null,
            sets: Array.from({ length: targetSets }, (_, i) => ({
              weight: last[i]?.weight_kg != null ? String(last[i].weight_kg) : "",
              reps: last[i]?.reps != null ? String(last[i].reps) : "",
              completed: false,
            })),
          };
        })
      );
      setLoading(false);
    })();
  }, [dayId]);

  function updateSet(exIdx: number, setIdx: number, field: keyof SetRow, value: string | boolean) {
    setExercises((prev) => {
      const next = [...prev];
      const sets = [...next[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], [field]: value } as SetRow;
      next[exIdx] = { ...next[exIdx], sets };
      return next;
    });
  }

  function toggleSetCompleted(exIdx: number, setIdx: number) {
    setExercises((prev) => {
      const next = [...prev];
      const sets = [...next[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], completed: !sets[setIdx].completed };
      next[exIdx] = { ...next[exIdx], sets };
      return next;
    });
  }

  const totalSets = exercises.reduce((s, e) => s + e.sets.length, 0);
  const completedSets = exercises.reduce(
    (s, e) => s + e.sets.filter((x) => x.completed).length,
    0
  );
  const progressPct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  async function openExerciseModal(idx: number) {
    setModalExerciseIdx(idx);
    setModalNoteLoading(true);
    setModalNoteSaved(false);
    setModalNote("");

    const ex = exercises[idx];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setModalNoteLoading(false); return; }
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("profile_id", user.id)
      .single();
    if (!client) { setModalNoteLoading(false); return; }

    const { data: note } = await supabase
      .from("client_exercise_notes")
      .select("note")
      .eq("client_id", client.id)
      .eq("exercise_id", ex.exerciseId)
      .maybeSingle();

    if (note?.note) setModalNote(note.note);
    setModalNoteLoading(false);
  }

  async function saveModalNote() {
    if (modalExerciseIdx == null) return;
    const ex = exercises[modalExerciseIdx];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("profile_id", user.id)
      .single();
    if (!client) return;

    await supabase
      .from("client_exercise_notes")
      .upsert(
        { client_id: client.id, exercise_id: ex.exerciseId, note: modalNote.trim() || null },
        { onConflict: "client_id,exercise_id" }
      );

    setModalNoteSaved(true);
    setTimeout(() => setModalNoteSaved(false), 1800);
  }

  async function handleFinish() {
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("profile_id", user.id)
      .single();
    if (!client) { setSaving(false); return; }

    // Create workout_log
    const { data: log } = await supabase
      .from("workout_logs")
      .insert({
        client_id: client.id,
        workout_day_id: dayId,
        completed: completedSets > 0,
      })
      .select("id")
      .single();

    // Insert sets
    if (log) {
      const rows: any[] = [];
      for (const ex of exercises) {
        ex.sets.forEach((s, i) => {
          if (!s.completed && !s.weight && !s.reps) return; // skip empty
          rows.push({
            log_id: log.id,
            exercise_id: ex.exerciseId,
            set_number: i + 1,
            weight_kg: s.weight ? parseFloat(s.weight) : null,
            reps: s.reps ? parseInt(s.reps) : null,
            completed: s.completed,
          });
        });
      }
      if (rows.length > 0) {
        await supabase.from("workout_log_sets").insert(rows);
      }
    }

    setSaving(false);
    router.push("/portal/workouts");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!exercises.length) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-text-muted">Inga övningar hittades.</p>
        <Link href="/portal/workouts" className="text-sm text-primary-darker hover:underline">
          &larr; Tillbaka till Träning
        </Link>
      </div>
    );
  }

  const activeEx = modalExerciseIdx != null ? exercises[modalExerciseIdx] : null;

  return (
    <div className="-mx-4 -mt-6 pb-28">
      {/* Sticky header with progress */}
      <div className="sticky top-14 z-30 bg-surface/95 backdrop-blur-sm px-4 py-3 border-b border-border-light">
        <div className="flex items-center gap-3">
          <Link
            href="/portal/workouts"
            className="w-9 h-9 rounded-full bg-white border border-border shadow-sm flex items-center justify-center"
            aria-label="Tillbaka"
          >
            <ArrowLeft className="w-4 h-4 text-text-primary" />
          </Link>
          <p className="text-base font-bold text-text-primary flex-1 truncate">{dayName}</p>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-text-primary">{progressPct}%</span>
            <span className="text-text-muted">Genomförda sets</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Exercise cards */}
      <div className="px-4 pt-4 space-y-5">
        {exercises.map((ex, exIdx) => {
          const completedForEx = ex.sets.filter((s) => s.completed).length;
          return (
            <div key={ex.weId}>
              {/* Exercise header: name + thumbnail */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-text-primary text-base leading-snug">{ex.name}</p>
                  <p className="text-xs text-text-muted mt-0.5">Tilldelad: {ex.targetReps} reps</p>
                </div>
                <button
                  type="button"
                  onClick={() => openExerciseModal(exIdx)}
                  className="w-12 h-12 rounded-xl overflow-hidden bg-surface border border-border-light shrink-0 relative group active:scale-95 transition-transform"
                  aria-label="Se video & anteckning"
                >
                  {ex.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ex.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                      <Dumbbell className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play className="w-4 h-4 text-white" fill="white" />
                  </div>
                </button>
              </div>

              {/* Set logging card */}
              <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 flex items-center justify-between border-b border-border-light">
                  <p className="text-sm font-medium text-text-primary">{ex.name}</p>
                  <span className={`text-xs font-semibold ${completedForEx === ex.sets.length ? "text-success" : "text-emerald-600"}`}>
                    {completedForEx} / {ex.sets.length}
                  </span>
                </div>
                {ex.sets.map((s, setIdx) => (
                  <div
                    key={setIdx}
                    className="flex items-center gap-3 px-4 py-3 border-b border-border-light last:border-b-0"
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-sm font-semibold text-text-primary shrink-0">
                      {setIdx + 1}
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={s.reps}
                        onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value)}
                        placeholder={ex.targetReps}
                        className="w-16 text-center rounded-lg border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <span className="text-xs text-text-muted">reps</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.25"
                        value={s.weight}
                        onChange={(e) => updateSet(exIdx, setIdx, "weight", e.target.value)}
                        placeholder="—"
                        className="w-16 text-center rounded-lg border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <span className="text-xs text-text-muted">kg</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSetCompleted(exIdx, setIdx)}
                      className={`w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                        s.completed
                          ? "bg-emerald-500 border-emerald-500"
                          : "bg-white border-border hover:border-primary/50"
                      }`}
                      aria-label={s.completed ? "Markera som ej klar" : "Markera som klar"}
                    >
                      {s.completed && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                    </button>
                  </div>
                ))}
              </div>

              {ex.restSeconds && (
                <p className="text-xs text-text-muted mt-2 flex items-center gap-1.5 pl-1">
                  <Clock className="w-3 h-3" />
                  {Math.round(ex.restSeconds / 60)} m vila efter övning
                </p>
              )}
              {ex.coachNotes && (
                <p className="text-sm font-bold text-text-primary mt-1.5 pl-1">
                  Coach: {ex.coachNotes}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky Slutför */}
      <div className="fixed bottom-16 left-0 right-0 z-40 pointer-events-none">
        <div className="max-w-lg mx-auto px-4 pointer-events-auto">
          <button
            type="button"
            onClick={handleFinish}
            disabled={saving}
            className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white font-semibold rounded-2xl shadow-xl hover:bg-slate-800 transition-colors active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            {saving ? "Sparar..." : "Slutför"}
          </button>
        </div>
      </div>

      {/* Exercise video + note modal */}
      {activeEx && (
        <ExerciseModal
          exercise={activeEx}
          note={modalNote}
          onNoteChange={setModalNote}
          onSaveNote={saveModalNote}
          noteLoading={modalNoteLoading}
          noteSaved={modalNoteSaved}
          onClose={() => setModalExerciseIdx(null)}
        />
      )}
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────
function ExerciseModal({
  exercise, note, onNoteChange, onSaveNote, noteLoading, noteSaved, onClose,
}: {
  exercise: ExerciseState;
  note: string;
  onNoteChange: (v: string) => void;
  onSaveNote: () => void;
  noteLoading: boolean;
  noteSaved: boolean;
  onClose: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while modal open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const embedUrl = toEmbedUrl(exercise.videoUrl);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        ref={scrollRef}
        className="w-full sm:max-w-md bg-white sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200"
      >
        <div className="sticky top-0 bg-white flex items-center justify-between px-4 py-3 border-b border-border-light z-10">
          <p className="font-semibold text-text-primary truncate">{exercise.name}</p>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-hover flex items-center justify-center"
            aria-label="Stäng"
          >
            <X className="w-4 h-4 text-text-primary" />
          </button>
        </div>

        {/* Video */}
        <div className="aspect-video bg-black">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : exercise.videoUrl ? (
            <video src={exercise.videoUrl} controls className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/60 text-sm">
              Ingen video tillgänglig
            </div>
          )}
        </div>

        {/* Details */}
        <div className="px-4 py-4 space-y-4">
          {(exercise.muscleGroups.length > 0 || exercise.equipment.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {exercise.muscleGroups.map((m) => (
                <span key={m} className="text-[11px] font-medium bg-primary-lighter/30 text-primary-darker px-2 py-0.5 rounded-full">
                  {m}
                </span>
              ))}
              {exercise.equipment.map((e) => (
                <span key={e} className="text-[11px] font-medium bg-surface text-text-secondary px-2 py-0.5 rounded-full">
                  {e}
                </span>
              ))}
            </div>
          )}

          {/* Add a note */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <StickyNote className="w-4 h-4 text-primary-darker" />
              <p className="text-sm font-semibold text-text-primary">Min anteckning</p>
            </div>
            <p className="text-xs text-text-muted mb-2">
              Din privata anteckning för denna övning – syns även för din coach.
            </p>
            {noteLoading ? (
              <div className="py-4 text-center">
                <Loader2 className="w-4 h-4 animate-spin text-primary mx-auto" />
              </div>
            ) : (
              <textarea
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="Ex: Fokusera på att känna stussen aktiveras, öka vikten nästa vecka..."
                className="w-full min-h-[100px] rounded-xl border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            )}
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onSaveNote}
                disabled={noteLoading}
                className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-darker transition-colors disabled:opacity-60"
              >
                Spara anteckning
              </button>
              {noteSaved && (
                <span className="text-xs text-success font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Sparad
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────
function toEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  } catch { /* ignore */ }
  return null;
}
