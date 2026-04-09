"use client";

import { useState } from "react";
import { Dumbbell, Play } from "lucide-react";
import { ExerciseEditModal } from "./exercise-edit-modal";
import { VideoModal } from "./video-modal";

interface Exercise {
  id: string;
  name: string;
  name_sv: string | null;
  muscle_groups: string[] | null;
  equipment: string[] | null;
  difficulty: string | null;
  video_url: string | null;
  description?: string | null;
  description_sv?: string | null;
}

export function ExerciseList({ exercises }: { exercises: Exercise[] }) {
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  function handleSaved() {
    setEditingExercise(null);
    window.location.reload();
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1fr_150px_150px_100px] gap-4 px-5 py-3 border-b border-border text-xs font-semibold text-text-muted uppercase tracking-wide">
          <span>Namn</span>
          <span>Muskelgrupper</span>
          <span>Utrustning</span>
          <span>Nivå</span>
        </div>

        <div className="divide-y divide-border-light">
          {exercises.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setEditingExercise(ex)}
              className="w-full grid grid-cols-[1fr_150px_150px_100px] gap-4 px-5 py-3 items-center hover:bg-surface-hover transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  ex.video_url ? "bg-primary-lighter" : "bg-surface"
                }`}>
                  {ex.video_url ? (
                    <Play className="w-5 h-5 text-primary-darker" />
                  ) : (
                    <Dumbbell className="w-5 h-5 text-text-muted" />
                  )}
                </div>
                <p className="text-sm font-medium text-text-primary truncate">{ex.name_sv || ex.name}</p>
              </div>
              <p className="text-sm text-text-secondary truncate">{ex.muscle_groups?.join(", ") || "—"}</p>
              <p className="text-sm text-text-secondary truncate">{ex.equipment?.join(", ") || "—"}</p>
              <span className={`text-xs px-2 py-1 rounded-full inline-block w-fit ${
                ex.difficulty === "beginner" ? "bg-success/10 text-success"
                  : ex.difficulty === "intermediate" ? "bg-warning/10 text-warning"
                  : ex.difficulty === "advanced" ? "bg-error/10 text-error"
                  : "bg-surface text-text-muted"
              }`}>
                {ex.difficulty === "beginner" ? "Nybörjare" : ex.difficulty === "intermediate" ? "Medel" : ex.difficulty === "advanced" ? "Avancerad" : "—"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {editingExercise && (
        <ExerciseEditModal
          exercise={editingExercise}
          onClose={() => setEditingExercise(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
