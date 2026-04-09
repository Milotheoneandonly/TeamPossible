"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2, Trash2 } from "lucide-react";

const MUSCLE_GROUPS = [
  "Bröst", "Rygg", "Axlar", "Biceps", "Triceps",
  "Lår", "Rumpa", "Vadmusklerna", "Buk", "Deltamuskeln",
  "Trapezius", "Underarm", "Lärmuskeln",
];

const EQUIPMENT_OPTIONS = [
  "Kroppsvikt", "Skivstång", "Hantel", "Kettlebell",
  "Maskin", "Kabel", "Band", "Låda", "Bänk",
  "TRX", "Medicinboll", "Gymmet", "Hemma",
];

interface ExerciseEditModalProps {
  exercise: any;
  onClose: () => void;
  onSaved: () => void;
}

export function ExerciseEditModal({ exercise, onClose, onSaved }: ExerciseEditModalProps) {
  const [name, setName] = useState(exercise.name_sv || exercise.name || "");
  const [description, setDescription] = useState(exercise.description_sv || exercise.description || "");
  const [videoUrl, setVideoUrl] = useState(exercise.video_url || "");
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>(exercise.muscle_groups || []);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(exercise.equipment || []);
  const [difficulty, setDifficulty] = useState(exercise.difficulty || "intermediate");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const supabase = createClient();

  function toggleMuscle(muscle: string) {
    setSelectedMuscles((prev) => prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]);
  }

  function toggleEquipment(eq: string) {
    setSelectedEquipment((prev) => prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]);
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from("exercises").update({
      name, name_sv: name,
      description, description_sv: description,
      video_url: videoUrl || null,
      muscle_groups: selectedMuscles.length > 0 ? selectedMuscles : null,
      equipment: selectedEquipment.length > 0 ? selectedEquipment : null,
      difficulty,
    }).eq("id", exercise.id);
    setSaving(false);
    onSaved();
  }

  async function handleDelete() {
    if (!confirm("Är du säker på att du vill ta bort denna övning?")) return;
    setDeleting(true);
    await supabase.from("exercises").delete().eq("id", exercise.id);
    setDeleting(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-text-primary">Redigera din övning</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          <Input id="name" label="Namn *" value={name} onChange={(e) => setName(e.target.value)} required />

          {/* Muscle groups */}
          <div>
            <label className="text-sm font-medium text-text-primary block mb-2">Fokusmuskler</label>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_GROUPS.map((m) => (
                <button key={m} type="button" onClick={() => toggleMuscle(m)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selectedMuscles.includes(m) ? "bg-primary text-white border-primary" : "bg-white text-text-secondary border-border"
                  }`}>{m}</button>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="text-sm font-medium text-text-primary block mb-2">Utrustning</label>
            <div className="flex flex-wrap gap-1.5">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button key={eq} type="button" onClick={() => toggleEquipment(eq)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selectedEquipment.includes(eq) ? "bg-primary text-white border-primary" : "bg-white text-text-secondary border-border"
                  }`}>{eq}</button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-sm font-medium text-text-primary block mb-2">Erfarenhetsnivå</label>
            <div className="flex gap-2">
              {[{ v: "beginner", l: "Nybörjare" }, { v: "intermediate", l: "Medel" }, { v: "advanced", l: "Avancerad" }].map((opt) => (
                <button key={opt.v} type="button" onClick={() => setDifficulty(opt.v)}
                  className={`text-sm px-3 py-1.5 rounded-xl border flex-1 transition-colors ${
                    difficulty === opt.v ? "bg-primary text-white border-primary" : "bg-white text-text-secondary border-border"
                  }`}>{opt.l}</button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">Standardanteckning</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Instruktioner eller anteckningar..."
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px] resize-none" />
          </div>

          {/* Video URL */}
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">Länk till YouTube- eller Vimeo-video</label>
            <Input id="videoUrl" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-border px-6 py-4 flex items-center justify-between rounded-b-2xl">
          <button onClick={handleDelete} disabled={deleting} className="text-sm text-error hover:underline flex items-center gap-1">
            <Trash2 className="w-4 h-4" />
            {deleting ? "Tar bort..." : "Ta bort"}
          </button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Avbryt</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? "Sparar..." : "Uppdatera övning"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
