"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMealPlan } from "@/actions/meal-plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Salad } from "lucide-react";
import Link from "next/link";

export default function NewMealPlanPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isTemplate, setIsTemplate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const plan = await createMealPlan({
        title,
        description: description || undefined,
        is_template: isTemplate,
      });
      router.push(`/meal-plans/${plan.id}`);
    } catch (err: any) {
      setError(err.message || "Något gick fel");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link
        href="/meal-plans"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Tillbaka
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-6">Ny kostplan</h1>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="title"
              label="Namn på planen"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="T.ex. Fettförbränning 1800 kcal"
            />

            <div>
              <label className="text-sm font-medium text-text-primary block mb-1.5">
                Beskrivning (valfritt)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kort beskrivning av planen..."
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[80px] resize-none text-sm"
              />
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
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Salad className="w-5 h-5" />}
              {loading ? "Skapar..." : "Skapa kostplan"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
