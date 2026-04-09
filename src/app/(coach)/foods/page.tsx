import { createClient } from "@/lib/supabase/server";
import { getRecipes } from "@/actions/recipes";
import Link from "next/link";
import { Utensils, Plus, Salad } from "lucide-react";
import { Button } from "@/components/ui/button";

const MEAL_TAG_LABELS: Record<string, string> = {
  breakfast: "Frukost",
  lunch: "Lunch",
  dinner: "Middag",
  snack: "Mellanmål",
  high_protein: "Proteinrik",
  quick: "Snabb",
  vegan: "Vegansk",
  vegetarian: "Vegetarisk",
};

export default async function NutritionPage() {
  const supabase = await createClient();
  const recipes = await getRecipes();

  const { data: foods, count: foodCount } = await supabase
    .from("foods")
    .select("*", { count: "exact" })
    .order("name")
    .limit(50);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Näring</h1>
          <p className="text-text-secondary mt-1">
            Hantera recept och livsmedel
          </p>
        </div>
        <Link href="/foods/new-recipe">
          <Button>
            <Plus className="w-4 h-4" />
            Skapa recept
          </Button>
        </Link>
      </div>

      {/* Recipes section */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">
            Recept ({recipes?.length || 0})
          </h2>
        </div>

        {(!recipes || recipes.length === 0) ? (
          <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
            <Salad className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">Inga recept skapade än</p>
            <p className="text-sm text-text-muted mt-1">
              Skapa recept som du sedan kan använda i kostplaner.
            </p>
            <Link href="/foods/new-recipe" className="text-sm text-primary-darker hover:underline mt-3 inline-block">
              Skapa ditt första recept →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border shadow-sm">
            {/* Table header */}
            <div className="px-5 py-3 border-b border-border grid grid-cols-[1fr_120px_80px_80px_120px] gap-4 text-xs font-semibold text-text-muted uppercase tracking-wide">
              <span>Namn</span>
              <span>Makron (P/K/F)</span>
              <span className="text-right">Kcal</span>
              <span className="text-right">Tid</span>
              <span>Måltidstyp</span>
            </div>

            <div className="divide-y divide-border-light">
              {recipes.map((recipe: any) => (
                <Link key={recipe.id} href={`/foods/recipe/${recipe.id}`}>
                  <div className="px-5 py-3 grid grid-cols-[1fr_120px_80px_80px_120px] gap-4 items-center hover:bg-surface-hover transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      {recipe.image_url ? (
                        <img
                          src={recipe.image_url}
                          alt={recipe.name}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                          <Salad className="w-5 h-5 text-success" />
                        </div>
                      )}
                      <p className="text-sm font-medium text-text-primary truncate">
                        {recipe.name_sv || recipe.name}
                      </p>
                    </div>
                    <p className="text-xs text-text-secondary">
                      {recipe.total_protein ? `${Math.round(recipe.total_protein)}P` : "—"}/
                      {recipe.total_carbs ? `${Math.round(recipe.total_carbs)}K` : "—"}/
                      {recipe.total_fat ? `${Math.round(recipe.total_fat)}F` : "—"}
                    </p>
                    <p className="text-sm text-text-secondary text-right">
                      {recipe.total_calories ? `${Math.round(recipe.total_calories)}` : "—"}
                    </p>
                    <p className="text-sm text-text-secondary text-right">
                      {recipe.prep_time_minutes ? `${recipe.prep_time_minutes} min` : "—"}
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      {(recipe.tags || []).slice(0, 2).map((tag: string) => (
                        <span
                          key={tag}
                          className="text-[10px] bg-primary-lighter text-primary-darker px-2 py-0.5 rounded-full"
                        >
                          {MEAL_TAG_LABELS[tag] || tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ingredients/Foods section */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Livsmedel ({foodCount || 0})
        </h2>

        {(!foods || foods.length === 0) ? (
          <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
            <Utensils className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">Inga livsmedel tillagda än</p>
            <p className="text-sm text-text-muted mt-1">
              Livsmedel läggs till automatiskt när du skapar recept.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border shadow-sm">
            <div className="px-5 py-3 border-b border-border grid grid-cols-[1fr_80px_80px_80px_80px] gap-4 text-xs font-semibold text-text-muted uppercase tracking-wide">
              <span>Livsmedel</span>
              <span className="text-right">Kcal</span>
              <span className="text-right">Protein</span>
              <span className="text-right">Kolhydrat</span>
              <span className="text-right">Fett</span>
            </div>
            <div className="divide-y divide-border-light">
              {foods.map((food: any) => (
                <div
                  key={food.id}
                  className="px-5 py-3 grid grid-cols-[1fr_80px_80px_80px_80px] gap-4 items-center"
                >
                  <p className="text-sm font-medium text-text-primary truncate">
                    {food.name_sv || food.name}
                  </p>
                  <p className="text-sm text-text-secondary text-right">
                    {food.calories_per_100g ? Math.round(food.calories_per_100g) : "—"}
                  </p>
                  <p className="text-sm text-text-secondary text-right">
                    {food.protein_per_100g ? `${food.protein_per_100g}g` : "—"}
                  </p>
                  <p className="text-sm text-text-secondary text-right">
                    {food.carbs_per_100g ? `${food.carbs_per_100g}g` : "—"}
                  </p>
                  <p className="text-sm text-text-secondary text-right">
                    {food.fat_per_100g ? `${food.fat_per_100g}g` : "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
