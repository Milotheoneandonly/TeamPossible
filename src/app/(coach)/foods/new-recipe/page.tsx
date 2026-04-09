"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRecipe } from "@/actions/recipes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Salad } from "lucide-react";
import Link from "next/link";

const MEAL_TAGS = [
  { value: "breakfast", label: "Frukost" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Middag" },
  { value: "snack", label: "Mellanmål" },
  { value: "high_protein", label: "Proteinrik" },
  { value: "quick", label: "Snabb (<15 min)" },
  { value: "vegan", label: "Vegansk" },
  { value: "vegetarian", label: "Vegetarisk" },
];

export default function NewRecipePage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [servings, setServings] = useState("1");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createRecipe({
        name,
        name_sv: name,
        description: description || undefined,
        instructions: instructions || undefined,
        instructions_sv: instructions || undefined,
        total_calories: calories ? parseFloat(calories) : undefined,
        total_protein: protein ? parseFloat(protein) : undefined,
        total_carbs: carbs ? parseFloat(carbs) : undefined,
        total_fat: fat ? parseFloat(fat) : undefined,
        prep_time_minutes: prepTime ? parseInt(prepTime) : undefined,
        servings: servings ? parseInt(servings) : 1,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      });
      router.push("/foods");
    } catch (err: any) {
      setError(err.message || "Något gick fel");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link
        href="/foods"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Tillbaka till näring
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-6">Skapa recept</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-text-primary mb-3">Grunduppgifter</h3>
            <div className="space-y-3">
              <Input
                id="name"
                label="Namn på receptet"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="T.ex. Ägg på majskakor"
              />
              <div>
                <label className="text-sm font-medium text-text-primary block mb-1.5">
                  Beskrivning (valfritt)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kort beskrivning..."
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[60px] resize-none text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="prepTime"
                  label="Tid (minuter)"
                  type="number"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  placeholder="15"
                />
                <Input
                  id="servings"
                  label="Portioner"
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  placeholder="1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Macros */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-text-primary mb-3">Makron (per portion)</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="calories"
                label="Kalorier (kcal)"
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="350"
              />
              <Input
                id="protein"
                label="Protein (g)"
                type="number"
                step="0.1"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="30"
              />
              <Input
                id="carbs"
                label="Kolhydrater (g)"
                type="number"
                step="0.1"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="25"
              />
              <Input
                id="fat"
                label="Fett (g)"
                type="number"
                step="0.1"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="15"
              />
            </div>
          </CardContent>
        </Card>

        {/* Meal type tags */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-text-primary mb-3">Måltidstyp</h3>
            <div className="flex flex-wrap gap-2">
              {MEAL_TAGS.map((tag) => (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => toggleTag(tag.value)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    selectedTags.includes(tag.value)
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-text-secondary border-border hover:border-primary/50"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-text-primary mb-3">Instruktioner (valfritt)</h3>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Steg-för-steg instruktioner för receptet..."
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[120px] resize-none text-sm"
            />
          </CardContent>
        </Card>

        {error && (
          <div className="bg-error/10 text-error text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Salad className="w-5 h-5" />}
          {loading ? "Skapar..." : "Skapa recept"}
        </Button>
      </form>
    </div>
  );
}
