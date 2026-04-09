"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Dumbbell, Loader2, UserPlus, CheckCircle,
  Plus, Search, X, GripVertical, Play, MoreHorizontal,
} from "lucide-react";
import { VideoModal } from "@/components/coach/video-modal";
import { getYouTubeThumbnail } from "@/lib/youtube";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function DraggableSidebarExercise({ exercise, onClick }: { exercise: any; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `sidebar-${exercise.id}`,
    data: { exerciseId: exercise.id },
  });

  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.4 : 1,
  };

  const thumb = exercise.video_url ? getYouTubeThumbnail(exercise.video_url) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-hover transition-colors text-left border-b border-border-light cursor-grab active:cursor-grabbing"
    >
      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
        {thumb ? (
          <img src={thumb} alt="" className="w-10 h-10 object-cover" />
        ) : exercise.video_url ? (
          <div className="w-10 h-10 bg-primary-lighter flex items-center justify-center">
            <Play className="w-4 h-4 text-primary-darker" />
          </div>
        ) : (
          <div className="w-10 h-10 bg-surface flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-text-muted" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{exercise.name_sv || exercise.name}</p>
        <p className="text-[10px] text-text-muted truncate">
          {exercise.muscle_groups?.join(", ") || ""}{exercise.equipment?.length ? ` · ${exercise.equipment[0]}` : ""}
        </p>
      </div>
    </div>
  );
}

function SortableExerciseRow({ we, onRemove, onUpdate, onVideoClick }: {
  we: any;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: string, value: any) => void;
  onVideoClick: (title: string, url: string) => void;
}) {
  const ex = we.exercise;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: we.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-xl border border-border shadow-sm flex items-center gap-0">
      {/* Drag handle */}
      <button {...attributes} {...listeners} className="px-2 py-4 cursor-grab active:cursor-grabbing text-text-muted hover:text-text-primary shrink-0">
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Thumbnail - clickable for video */}
      <button
        onClick={() => ex?.video_url && onVideoClick(ex.name_sv || ex.name, ex.video_url)}
        className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${
          ex?.video_url ? "cursor-pointer" : "bg-surface cursor-default"
        }`}
      >
        {ex?.video_url ? (
          (() => {
            const thumb = getYouTubeThumbnail(ex.video_url);
            return thumb ? (
              <img src={thumb} alt="" className="w-12 h-12 object-cover rounded-lg" />
            ) : (
              <div className="w-12 h-12 bg-primary-lighter flex items-center justify-center rounded-lg">
                <Play className="w-5 h-5 text-primary-darker" />
              </div>
            );
          })()
        ) : (
          <Dumbbell className="w-5 h-5 text-text-muted" />
        )}
      </button>

      {/* Name + notes */}
      <div className="flex-1 min-w-0 px-3 py-2">
        <p className="text-sm font-semibold text-text-primary truncate">{ex?.name_sv || ex?.name || "Övning"}</p>
        <input type="text" defaultValue={we.notes || ""} placeholder="Lägg till anteckning"
          onBlur={(e) => onUpdate(we.id, "notes", e.target.value)}
          className="text-xs text-text-muted w-full bg-transparent focus:outline-none placeholder:text-text-muted/50 mt-0.5" />
      </div>

      {/* Set */}
      <div className="text-center px-2 shrink-0 w-16">
        <p className="text-[10px] text-text-muted">Set</p>
        <input type="number" defaultValue={we.sets}
          onBlur={(e) => onUpdate(we.id, "sets", parseInt(e.target.value) || 3)}
          className="w-12 text-center text-sm font-semibold border border-border rounded-lg px-1 py-1 focus:outline-none focus:ring-1 focus:ring-primary/50" />
      </div>

      {/* Vikt */}
      <div className="text-center px-2 shrink-0 w-20">
        <p className="text-[10px] text-text-muted">Vikt</p>
        <div className="flex items-center justify-center gap-0.5">
          <input type="number" defaultValue={10} className="w-10 text-center text-sm font-semibold border border-border rounded-lg px-1 py-1 focus:outline-none focus:ring-1 focus:ring-primary/50" />
          <span className="text-[10px] text-text-muted">kg</span>
        </div>
      </div>

      {/* Repetitioner */}
      <div className="text-center px-2 shrink-0 w-24">
        <p className="text-[10px] text-text-muted">Repetitioner</p>
        <input type="text" defaultValue={we.reps}
          onBlur={(e) => onUpdate(we.id, "reps", e.target.value || "10")}
          className="w-16 text-center text-sm font-semibold border border-border rounded-lg px-1 py-1 focus:outline-none focus:ring-1 focus:ring-primary/50" />
      </div>

      {/* Vila */}
      <div className="text-center px-2 shrink-0 w-16">
        <p className="text-[10px] text-text-muted">Vila</p>
        <input type="number" defaultValue={we.rest_seconds}
          onBlur={(e) => onUpdate(we.id, "rest_seconds", parseInt(e.target.value) || 60)}
          className="w-12 text-center text-sm font-semibold border border-border rounded-lg px-1 py-1 focus:outline-none focus:ring-1 focus:ring-primary/50" />
      </div>

      {/* Remove */}
      <button onClick={() => onRemove(we.id)} className="text-text-muted hover:text-error p-2 shrink-0">
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function WorkoutPlanDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const planId = params.planId as string;
  const assignClientId = searchParams.get("assign");

  const [plan, setPlan] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assigned, setAssigned] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [addingDayName, setAddingDayName] = useState("");
  const [showAddDay, setShowAddDay] = useState(false);
  const [videoModal, setVideoModal] = useState<{ title: string; url: string } | null>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadPlan();
    loadExercises();
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
    if (data?.workout_days?.length > 0 && !activeDay) {
      const sorted = [...data.workout_days].sort((a: any, b: any) => (a.sort_order ?? a.day_number) - (b.sort_order ?? b.day_number));
      setActiveDay(sorted[0].id);
    }
    setLoading(false);
  }

  async function loadExercises() {
    const { data } = await supabase
      .from("exercises")
      .select("id, name, name_sv, muscle_groups, equipment, video_url")
      .order("name");
    setExercises(data || []);
  }

  async function loadClientName() {
    if (!assignClientId) return;
    const { data } = await supabase
      .from("clients")
      .select("profile:profiles!clients_profile_id_fkey(first_name, last_name)")
      .eq("id", assignClientId)
      .single();
    if (data?.profile) setClientName(`${(data.profile as any).first_name} ${(data.profile as any).last_name}`);
  }

  async function handleAssignToClient() {
    if (!assignClientId || !plan) return;
    setSaving(true);
    await supabase.from("workout_plans").update({ is_active: false }).eq("client_id", assignClientId).eq("is_active", true);

    if (plan.is_template) {
      const { data: newPlan } = await supabase.from("workout_plans").insert({
        coach_id: plan.coach_id, client_id: assignClientId, title: plan.title, description: plan.description, is_template: false, is_active: true,
      }).select().single();

      if (newPlan) {
        for (const day of (plan.workout_days || [])) {
          const { data: newDay } = await supabase.from("workout_days").insert({
            plan_id: newPlan.id, day_number: day.day_number, name: day.name, sort_order: day.sort_order,
          }).select().single();
          if (newDay) {
            for (const we of (day.workout_exercises || [])) {
              await supabase.from("workout_exercises").insert({
                workout_day_id: newDay.id, exercise_id: we.exercise?.id, sort_order: we.sort_order,
                sets: we.sets, reps: we.reps, rest_seconds: we.rest_seconds, tempo: we.tempo, notes: we.notes, superset_group: we.superset_group,
              });
            }
          }
        }
      }
    } else {
      await supabase.from("workout_plans").update({ client_id: assignClientId, is_active: true }).eq("id", planId);
    }
    setSaving(false);
    setAssigned(true);
  }

  async function addExerciseToDay(exerciseId: string) {
    if (!activeDay) return;
    const day = (plan?.workout_days || []).find((d: any) => d.id === activeDay);
    const maxSort = (day?.workout_exercises || []).reduce((max: number, we: any) => Math.max(max, we.sort_order || 0), -1);

    await supabase.from("workout_exercises").insert({
      workout_day_id: activeDay, exercise_id: exerciseId, sort_order: maxSort + 1, sets: 3, reps: "10", rest_seconds: 60,
    });
    loadPlan();
  }

  async function removeExercise(weId: string) {
    await supabase.from("workout_exercises").delete().eq("id", weId);
    loadPlan();
  }

  async function updateExercise(weId: string, field: string, value: any) {
    await supabase.from("workout_exercises").update({ [field]: value }).eq("id", weId);
  }

  async function addNewDay() {
    if (!addingDayName.trim()) return;
    const maxSort = (plan?.workout_days || []).reduce((max: number, d: any) => Math.max(max, d.sort_order ?? d.day_number ?? 0), 0);
    const { data: newDay } = await supabase.from("workout_days").insert({
      plan_id: planId, day_number: maxSort + 1, name: addingDayName, sort_order: maxSort + 1,
    }).select().single();
    setAddingDayName("");
    setShowAddDay(false);
    loadPlan();
    if (newDay) setActiveDay(newDay.id);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    // Check if it's a sidebar exercise being dropped into the workout area
    const activeId = String(active.id);
    if (activeId.startsWith("sidebar-")) {
      const exerciseId = activeId.replace("sidebar-", "");
      if (activeDay) {
        await addExerciseToDay(exerciseId);
      }
      return;
    }

    // Otherwise it's a reorder within the day
    if (!over || active.id === over.id) return;

    const oldIndex = currentExercises.findIndex((e: any) => e.id === active.id);
    const newIndex = currentExercises.findIndex((e: any) => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove([...currentExercises], oldIndex, newIndex) as any[];

    for (let i = 0; i < reordered.length; i++) {
      if (reordered[i].sort_order !== i) {
        await supabase.from("workout_exercises").update({ sort_order: i }).eq("id", reordered[i].id);
      }
    }

    loadPlan();
  }

  const filteredExercises = exercises.filter((ex) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (ex.name || "").toLowerCase().includes(q) || (ex.name_sv || "").toLowerCase().includes(q) || (ex.muscle_groups || []).some((mg: string) => mg.toLowerCase().includes(q));
  });

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (assigned) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-success" /></div>
        <h2 className="text-xl font-bold text-text-primary">Program tilldelat!</h2>
        <p className="text-text-secondary mt-2">{plan?.title} har tilldelats till {clientName}</p>
        <Button className="mt-6" onClick={() => router.push(`/clients/${assignClientId}`)}>Tillbaka till klient</Button>
      </div>
    );
  }

  if (!plan) return <div className="max-w-4xl mx-auto px-4 py-8 text-center"><p className="text-text-muted">Program hittades inte.</p></div>;

  const days = (plan.workout_days || []).sort((a: any, b: any) => (a.sort_order ?? a.day_number) - (b.sort_order ?? b.day_number));
  const currentDay = days.find((d: any) => d.id === activeDay);
  const currentExercises = currentDay ? (currentDay.workout_exercises || []).sort((a: any, b: any) => a.sort_order - b.sort_order) : [];

  return (
    <>
    <div className="h-[calc(100vh-64px)] lg:h-screen flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href={assignClientId ? `/clients/${assignClientId}` : "/workouts"} className="text-text-secondary hover:text-text-primary">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-bold text-text-primary">{plan.title}</h1>
              {plan.is_template && <span className="text-xs text-primary-darker">Mall</span>}
            </div>
          </div>
          {assignClientId && (
            <Button onClick={handleAssignToClient} disabled={saving} size="sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {saving ? "Tilldelar..." : `Tilldela till ${clientName}`}
            </Button>
          )}
        </div>
      </div>

      {/* Day tabs */}
      <div className="bg-white border-b border-border px-4 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1 max-w-7xl mx-auto">
          {days.map((day: any) => (
            <button
              key={day.id}
              onClick={() => setActiveDay(day.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeDay === day.id
                  ? "text-primary-darker border-primary-darker"
                  : "text-text-muted border-transparent hover:text-text-primary"
              }`}
            >
              {day.name || `Dag ${day.day_number}`}
            </button>
          ))}
          <button
            onClick={() => setShowAddDay(true)}
            className="px-3 py-3 text-text-muted hover:text-text-primary"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add day modal */}
      {showAddDay && (
        <div className="bg-surface border-b border-border px-4 py-3 shrink-0">
          <div className="flex items-center gap-2 max-w-7xl mx-auto">
            <input
              value={addingDayName}
              onChange={(e) => setAddingDayName(e.target.value)}
              placeholder="Passnamn, t.ex. Lower 🦵"
              autoFocus
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              onKeyDown={(e) => e.key === "Enter" && addNewDay()}
            />
            <Button size="sm" onClick={addNewDay} disabled={!addingDayName.trim()}>Skapa</Button>
            <button onClick={() => setShowAddDay(false)} className="text-text-muted hover:text-text-primary p-1"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Main content */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex-1 flex overflow-hidden">
        {/* Exercise library (left sidebar) */}
        <div className="w-72 bg-white border-r border-border flex flex-col shrink-0 hidden lg:flex">
          <div className="p-3 space-y-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Sök"
                className="w-full rounded-lg border border-border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredExercises.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-text-muted">Inga övningar hittades</p>
                <Link href="/workouts/new-exercise" className="text-xs text-primary-darker hover:underline mt-1 inline-block">Lägg till övning →</Link>
              </div>
            ) : (
              filteredExercises.map((ex) => (
                <DraggableSidebarExercise
                  key={ex.id}
                  exercise={ex}
                  onClick={() => addExerciseToDay(ex.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Day exercises (main area) */}
        <div className="flex-1 overflow-y-auto bg-surface p-4 lg:p-6">
          {!activeDay ? (
            <div className="text-center py-16">
              <Dumbbell className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary">Inga pass</h3>
              <p className="text-text-secondary mt-1">Skapa ett pass för att börja</p>
              <Button className="mt-4" onClick={() => setShowAddDay(true)}><Plus className="w-4 h-4" /> Skapa pass</Button>
            </div>
          ) : currentExercises.length === 0 ? (
            <div className="text-center py-16">
              <Dumbbell className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary">Inga pass</h3>
              <p className="text-text-secondary mt-1">Välj övningar från listan till vänster</p>
              {/* Mobile: show add button */}
              <div className="lg:hidden mt-4">
                <Link href="/workouts/new-exercise"><Button variant="outline"><Plus className="w-4 h-4" /> Lägg till övning</Button></Link>
              </div>
            </div>
          ) : (
            <SortableContext items={currentExercises.map((e: any) => e.id)} strategy={verticalListSortingStrategy}>
            <div className="max-w-3xl space-y-2">
              {currentExercises.map((we: any) => (
                <SortableExerciseRow
                  key={we.id}
                  we={we}
                  onRemove={removeExercise}
                  onUpdate={updateExercise}
                  onVideoClick={(title, url) => setVideoModal({ title, url })}
                />
              ))}
            </div>
            </SortableContext>
          )}
        </div>
      </div>
      </DndContext>
    </div>

    {/* Video modal */}
    {videoModal && (
      <VideoModal
        title={videoModal.title}
        videoUrl={videoModal.url}
        onClose={() => setVideoModal(null)}
      />
    )}
    </>
  );
}
