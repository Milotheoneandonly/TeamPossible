"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Salad, Search, X, Plus } from "lucide-react";
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

interface Ingredient {
  foodId: string;
  name: string;
  amountG: number;
  caloriesPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  fatPer100: number;
}

export default function NewRecipePage() {
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("1");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();
  const router = useRouter();

  // Calculate totals from ingredients
  const totals = ingredients.reduce(
    (acc, ing) => {
      const factor = ing.amountG / 100;
      return {
        calories: acc.calories + ing.caloriesPer100 * factor,
        protein: acc.protein + ing.proteinPer100 * factor,
        carbs: acc.carbs + ing.carbsPer100 * factor,
        fat: acc.fat + ing.fatPer100 * factor,
        weight: acc.weight + ing.amountG,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, weight: 0 }
  );

  async function searchFoods(query: string) {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const sanitized = query.replace(/[%_\\(),."']/g, "");
    const { data } = await supabase
      .from("foods")
      .select("id, name, name_sv, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g")
      .or(`name.ilike.%${sanitized}%,name_sv.ilike.%${sanitized}%`)
      .limit(15);

    setSearchResults(data || []);
  }

  function addIngredient(food: any) {
    setIngredients([
      ...ingredients,
      {
        foodId: food.id,
        name: food.name_sv || food.name,
        amountG: 100,
        caloriesPer100: food.calories_per_100g || 0,
        proteinPer100: food.protein_per_100g || 0,
        carbsPer100: food.carbs_per_100g || 0,
        fatPer100: food.fat_per_100g || 0,
      },
    ]);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
  }

  function updateIngredientAmount(index: number, amount: number) {
    setIngredients(
      ingredients.map((ing, i) => (i === index ? { ...ing, amountG: amount } : ing))
    );
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Create recipe
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        coach_id: user.id,
        name,
        name_sv: name,
        instructions: instructions || null,
        instructions_sv: instructions || null,
        prep_time_minutes: prepTime ? parseInt(prepTime) : null,
        cook_time_minutes: cookTime ? parseInt(cookTime) : null,
        servings: servings ? parseInt(servings) : 1,
        tags: selectedTags.length > 0 ? selectedTags : null,
        total_calories: Math.round(totals.calories),
        total_protein: Math.round(totals.protein * 10) / 10,
        total_carbs: Math.round(totals.carbs * 10) / 10,
        total_fat: Math.round(totals.fat * 10) / 10,
      })
      .select()
      .single();

    if (recipeError) {
      setError(recipeError.message);
      setLoading(false);
      return;
    }

    // Add ingredients
    if (ingredients.length > 0 && recipe) {
      const recipeIngredients = ingredients.map((ing, idx) => ({
        recipe_id: recipe.id,
        food_id: ing.foodId,
        amount_g: ing.amountG,
        sort_order: idx,
      }));

      await supabase.from("recipe_ingredients").insert(recipeIngredients);
    }

    router.push("/foods");
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
        {/* Name + macro summary */}
        <Card>
          <CardContent>
            <Input
              id="name"
              label="Receptets namn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="T.ex. Ägg på majskakor"
            />
            <div className="flex gap-4 mt-3 text-sm">
              <span className="text-error font-medium">Protein {Math.round(totals.protein)}g</span>
              <span className="text-success font-medium">Kolhydrater {Math.round(totals.carbs)}g</span>
              <span className="text-accent font-medium">Fett {Math.round(totals.fat)}g</span>
            </div>
          </CardContent>
        </Card>

        {/* Ingredient search */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-text-primary">Ingredienser</h3>
              <div className="flex items-center gap-3 text-sm text-text-muted">
                <span>{Math.round(totals.weight)}g</span>
                <span>{Math.round(totals.calories)} kcal</span>
              </div>
            </div>

            {/* Ingredients list */}
            {ingredients.length > 0 && (
              <div className="space-y-2 mb-4">
                {ingredients.map((ing, idx) => {
                  const factor = ing.amountG / 100;
                  const kcal = Math.round(ing.caloriesPer100 * factor);
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-surface rounded-xl px-3 py-2"
                    >
                      <span className="text-sm font-medium text-text-primary flex-1 min-w-0 truncate">
                        {ing.name}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          value={ing.amountG}
                          onChange={(e) =>
                            updateIngredientAmount(idx, parseInt(e.target.value) || 0)
                          }
                          className="w-16 rounded-lg border border-border px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                        <span className="text-xs text-text-muted">g</span>
                      </div>
                      <span className="text-xs text-text-muted w-14 text-right shrink-0">
                        {kcal} kcal
                      </span>
                      <button
                        type="button"
                        onClick={() => removeIngredient(idx)}
                        className="text-text-muted hover:text-error p-1 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {ingredients.length === 0 && !showSearch && (
              <p className="text-sm text-text-muted mb-3">
                Ingredienser kommer att visas här
              </p>
            )}

            {/* Search input */}
            {showSearch ? (
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => searchFoods(e.target.value)}
                    placeholder="Sök ingredienser och livsmedel i svenska..."
                    autoFocus
                    className="w-full rounded-xl border border-border bg-white pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-2 bg-white border border-border rounded-xl max-h-48 overflow-y-auto divide-y divide-border-light">
                    {searchResults.map((food) => (
                      <button
                        key={food.id}
                        type="button"
                        onClick={() => addIngredient(food)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-hover transition-colors text-left"
                      >
                        <span className="text-sm text-text-primary">
                          {food.name_sv || food.name}
                        </span>
                        <span className="text-xs text-text-muted">
                          {food.calories_per_100g ? `${Math.round(food.calories_per_100g)} kcal/100g` : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery.length >= 2 && searchResults.length === 0 && (
                  <p className="text-xs text-text-muted mt-2 text-center">
                    Inget livsmedel hittades för &ldquo;{searchQuery}&rdquo;
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => { setShowSearch(false); setSearchQuery(""); setSearchResults([]); }}
                  className="text-xs text-text-muted hover:text-text-primary mt-2"
                >
                  Stäng sök
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                className="flex items-center gap-2 text-sm text-primary-darker hover:underline"
              >
                <Search className="w-4 h-4" />
                Sök ingredienser och livsmedel i svenska
              </button>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-text-primary mb-3">Instruktioner</h3>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="T.ex. 25g ris-/ majskakor = 1 skiva (41g) Levain, surdegsbröd..."
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[80px] resize-none text-sm"
            />
          </CardContent>
        </Card>

        {/* Time + servings */}
        <Card>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <Input
                id="prepTime"
                label="Förberedelsetid"
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="min"
              />
              <Input
                id="cookTime"
                label="Tillagningstid"
                type="number"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                placeholder="min"
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

        {error && (
          <div className="bg-error/10 text-error text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={loading || !name.trim()}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Salad className="w-5 h-5" />}
          {loading ? "Skapar..." : "Skicka in"}
        </Button>
      </form>
    </div>
  );
}
