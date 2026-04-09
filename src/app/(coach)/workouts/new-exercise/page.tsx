"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Dumbbell } from "lucide-react";
import Link from "next/link";

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

const DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "Nybörjare" },
  { value: "intermediate", label: "Medel" },
  { value: "advanced", label: "Avancerad" },
];

export default function NewExercisePage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("intermediate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();
  const router = useRouter();

  function toggleMuscle(muscle: string) {
    setSelectedMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    );
  }

  function toggleEquipment(eq: string) {
    setSelectedEquipment((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setLoading(true);

    const { error: insertError } = await supabase.from("exercises").insert({
      name,
      name_sv: name,
      description: description || null,
      description_sv: description || null,
      video_url: videoUrl || null,
      muscle_groups: selectedMuscles.length > 0 ? selectedMuscles : null,
      equipment: selectedEquipment.length > 0 ? selectedEquipment : null,
      difficulty: difficulty || null,
      is_custom: true,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push("/workouts?tab=ovningar");
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link
        href="/workouts?tab=ovningar"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Tillbaka till övningar
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-6">Lägg till övning</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <Card>
          <CardContent>
            <Input
              id="name"
              label="Namn *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="T.ex. Backwards treadmill walk"
            />
          </CardContent>
        </Card>

        {/* Muscle groups */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-text-primary mb-3">Fokusmuskler</h3>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUPS.map((muscle) => (
                <button
                  key={muscle}
                  type="button"
                  onClick={() => toggleMuscle(muscle)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    selectedMuscles.includes(muscle)
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-text-secondary border-border hover:border-primary/50"
                  }`}
                >
                  {muscle}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Equipment */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-text-primary mb-3">Utrustning</h3>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button
                  key={eq}
                  type="button"
                  onClick={() => toggleEquipment(eq)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    selectedEquipment.includes(eq)
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-text-secondary border-border hover:border-primary/50"
                  }`}
                >
                  {eq}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Difficulty */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-text-primary mb-3">Erfarenhetsnivå</h3>
            <div className="flex gap-3">
              {DIFFICULTY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDifficulty(opt.value)}
                  className={`text-sm px-4 py-2 rounded-xl border transition-colors flex-1 ${
                    difficulty === opt.value
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-text-secondary border-border hover:border-primary/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Description / Notes */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-text-primary mb-3">Standardanteckning</h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="T.ex. 5min i tempot ca 2.5 km/h&#10;Övningen kan hjälpa mot knä- och ryggsmärta..."
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[100px] resize-none text-sm"
            />
          </CardContent>
        </Card>

        {/* Video URL */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-text-primary mb-3">Lägg till media</h3>
            <Input
              id="videoUrl"
              label="Länk till YouTube- eller Vimeo-video"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-xs text-text-muted mt-2">
              Klistrar in länken till övningsvideon. Visas för klienterna i deras träningsprogram.
            </p>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-error/10 text-error text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={loading || !name.trim()}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Dumbbell className="w-5 h-5" />}
          {loading ? "Sparar..." : "Spara övning"}
        </Button>
      </form>
    </div>
  );
}
