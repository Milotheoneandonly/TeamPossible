"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkoutPlan } from "@/actions/workouts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Dumbbell, Plus, X } from "lucide-react";
import Link from "next/link";

export default function NewWorkoutPlanPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isTemplate, setIsTemplate] = useState(true);
  const [days, setDays] = useState([
    { name: "Dag 1: Lower" },
    { name: "Dag 2: Upper" },
    { name: "Dag 3: Lower" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function addDay() {
    setDays([...days, { name: `Dag ${days.length + 1}` }]);
  }

  function removeDay(index: number) {
    if (days.length <= 1) return;
    setDays(days.filter((_, i) => i !== index));
  }

  function updateDayName(index: number, name: string) {
    setDays(days.map((d, i) => (i === index ? { name } : d)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const plan = await createWorkoutPlan({
        title,
        description: description || undefined,
        is_template: isTemplate,
        days,
      });
      router.push(`/workouts/${plan.id}`);
    } catch (err: any) {
      setError(err.message || "Något gick fel");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link
        href="/workouts"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Tillbaka
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-6">Nytt träningsprogram</h1>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="title"
              label="Namn på programmet"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="T.ex. Wellness 3 Benpass"
            />

            <div>
              <label className="text-sm font-medium text-text-primary block mb-1.5">
                Beskrivning (valfritt)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kort beskrivning av programmet..."
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[80px] resize-none text-sm"
              />
            </div>

            {/* Training days */}
            <div>
              <label className="text-sm font-medium text-text-primary block mb-2">
                Träningsdagar
              </label>
              <div className="space-y-2">
                {days.map((day, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      value={day.name}
                      onChange={(e) => updateDayName(index, e.target.value)}
                      placeholder={`Dag ${index + 1}`}
                      className="flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                    {days.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDay(index)}
                        className="p-2 text-text-muted hover:text-error transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addDay}
                className="mt-2 flex items-center gap-1.5 text-sm text-primary-darker hover:underline"
              >
                <Plus className="w-4 h-4" />
                Lägg till dag
              </button>
            </div>

            <label className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                checked={isTemplate}
                onChange={(e) => setIsTemplate(e.target.checked)}
                className="w-5 h-5 rounded-md border-border text-primary accent-primary"
              />
              <div>
                <span className="text-sm font-medium text-text-primary">Spara som mall</span>
                <p className="text-xs text-text-muted">Kan återanvändas för flera klienter</p>
              </div>
            </label>

            {error && (
              <div className="bg-error/10 text-error text-sm rounded-xl px-4 py-3">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Dumbbell className="w-5 h-5" />}
              {loading ? "Skapar..." : "Skapa program"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
