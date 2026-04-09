"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Search, X, Salad, Loader2, UserPlus, CheckCircle } from "lucide-react";

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "Frukost",
  snack_am: "Mellanmål (fm)",
  lunch: "Lunch",
  snack_pm: "Mellanmål (em)",
  dinner: "Middag",
  snack_evening: "Kvällsmellanmål",
};

const DAY_NAMES = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];

export default function MealPlanEditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const planId = params.planId as string;
  const assignClientId = searchParams.get("assign");

  const [plan, setPlan] = useState<any>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [clientName, setClientName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [addingToMeal, setAddingToMeal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [assigned, setAssigned] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadPlan();
    loadRecipes();
    if (assignClientId) loadClientName();
  }, []);

  async function loadPlan() {
    const { data } = await supabase
      .from("meal_plans")
      .select(`
        *,
        meal_plan_days (
          id, day_number, name, sort_order,
          meals (
            id, meal_type, name, sort_order,
            meal_items (
              id, amount_g, servings, sort_order,
              food:foods (id, name, name_sv, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g),
              recipe:recipes (id, name, name_sv, total_calories, total_protein, total_carbs, total_fat)
            )
          )
        )
      `)
      .eq("id", planId)
      .single();

    setPlan(data);
    setLoading(false);
  }

  async function loadRecipes() {
    const { data } = await supabase
      .from("recipes")
      .select("id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags")
      .order("name");
    setRecipes(data || []);
  }

  async function loadClientName() {
    if (!assignClientId) return;
    const { data } = await supabase
      .from("clients")
      .select("profile:profiles!clients_profile_id_fkey(first_name, last_name)")
      .eq("id", assignClientId)
      .single();
    if (data?.profile) {
      setClientName(`${(data.profile as any).first_name} ${(data.profile as any).last_name}`);
    }
  }

  async function handleAssignToClient() {
    if (!assignClientId) return;
    setSaving(true);

    // Deactivate current active plan for this client
    await supabase
      .from("meal_plans")
      .update({ is_active: false })
      .eq("client_id", assignClientId)
      .eq("is_active", true);

    // If this is a template, duplicate it for the client
    if (plan.is_template) {
      // Create a copy for the client
      const { data: newPlan } = await supabase
        .from("meal_plans")
        .insert({
          coach_id: plan.coach_id,
          client_id: assignClientId,
          title: plan.title,
          description: plan.description,
          is_template: false,
          is_active: true,
          target_calories: plan.target_calories,
          target_protein_g: plan.target_protein_g,
          target_carbs_g: plan.target_carbs_g,
          target_fat_g: plan.target_fat_g,
        })
        .select()
        .single();

      if (newPlan) {
        // Copy days, meals, and items
        const days = plan.meal_plan_days || [];
        for (const day of days) {
          const { data: newDay } = await supabase
            .from("meal_plan_days")
            .insert({ plan_id: newPlan.id, day_number: day.day_number, name: day.name, sort_order: day.sort_order })
            .select()
            .single();

          if (newDay) {
            for (const meal of (day.meals || [])) {
              const { data: newMeal } = await supabase
                .from("meals")
                .insert({ day_id: newDay.id, meal_type: meal.meal_type, name: meal.name, sort_order: meal.sort_order })
                .select()
                .single();

              if (newMeal) {
                for (const item of (meal.meal_items || [])) {
                  await supabase.from("meal_items").insert({
                    meal_id: newMeal.id,
                    food_id: item.food?.id || null,
                    recipe_id: item.recipe?.id || null,
                    amount_g: item.amount_g,
                    servings: item.servings,
                    sort_order: item.sort_order,
                  });
                }
              }
            }
          }
        }
      }
    } else {
      // Just assign directly
      await supabase
        .from("meal_plans")
        .update({ client_id: assignClientId, is_active: true })
        .eq("id", planId);
    }

    setSaving(false);
    setAssigned(true);
  }

  async function addRecipeToMeal(mealId: string, recipe: any) {
    setSaving(true);
    const { data: existing } = await supabase
      .from("meal_items")
      .select("sort_order")
      .eq("meal_id", mealId)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextSort = (existing?.[0]?.sort_order ?? -1) + 1;

    await supabase.from("meal_items").insert({
      meal_id: mealId,
      recipe_id: recipe.id,
      servings: 1,
      sort_order: nextSort,
    });

    setAddingToMeal(null);
    setSaving(false);
    loadPlan();
  }

  async function removeItem(itemId: string) {
    await supabase.from("meal_items").delete().eq("id", itemId);
    loadPlan();
  }

  const filteredRecipes = recipes.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (r.name || "").toLowerCase().includes(q) || (r.name_sv || "").toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (assigned) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Kostplan tilldelad!</h2>
        <p className="text-text-secondary mt-2">
          {plan.title} har tilldelats till {clientName}
        </p>
        <Button className="mt-6" onClick={() => router.push(`/clients/${assignClientId}`)}>
          Tillbaka till klient
        </Button>
      </div>
    );
  }

  if (!plan) {
    return <div className="max-w-4xl mx-auto px-4 py-8 text-center"><p className="text-text-muted">Kostplan hittades inte.</p></div>;
  }

  const days = (plan.meal_plan_days || []).sort((a: any, b: any) => a.day_number - b.day_number);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href={assignClientId ? `/clients/${assignClientId}` : "/meal-plans"}
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {assignClientId ? "Tillbaka till klient" : "Alla kostplaner"}
      </Link>

      {/* Assign banner */}
      {assignClientId && (
        <div className="bg-primary-lighter border border-primary/20 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary-darker">
              Tilldela till {clientName}
            </p>
            <p className="text-xs text-primary-darker/70">
              Klicka knappen för att tilldela denna kostplan
            </p>
          </div>
          <Button onClick={handleAssignToClient} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {saving ? "Tilldelar..." : "Tilldela kostplan"}
          </Button>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{plan.title}</h1>
            {plan.description && <p className="text-text-secondary mt-1">{plan.description}</p>}
          </div>
          <div className="flex gap-2">
            {plan.is_template && <span className="text-xs font-medium bg-primary-lighter text-primary-darker px-3 py-1.5 rounded-full">Mall</span>}
            {plan.is_active && <span className="text-xs font-medium bg-success/10 text-success px-3 py-1.5 rounded-full">Aktiv</span>}
          </div>
        </div>
        {plan.target_calories && (
          <div className="flex gap-4 mt-3 text-sm text-text-secondary">
            <span>Mål: {plan.target_calories} kcal</span>
            <span>P: {plan.target_protein_g}g</span>
            <span>K: {plan.target_carbs_g}g</span>
            <span>F: {plan.target_fat_g}g</span>
          </div>
        )}
      </div>

      {/* Days and meals */}
      <div className="space-y-8">
        {days.map((day: any) => {
          const meals = (day.meals || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
          const dayLabel = day.name || DAY_NAMES[(day.day_number - 1) % 7] || `Dag ${day.day_number}`;

          return (
            <div key={day.id}>
              <h2 className="text-lg font-semibold text-text-primary mb-3">{dayLabel}</h2>
              <div className="space-y-3">
                {meals.map((meal: any) => {
                  const items = (meal.meal_items || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
                  let totalCal = 0;
                  items.forEach((item: any) => {
                    if (item.recipe) totalCal += (item.recipe.total_calories || 0) * (item.servings || 1);
                    if (item.food) totalCal += (item.food.calories_per_100g || 0) * ((item.amount_g || 100) / 100);
                  });

                  return (
                    <div key={meal.id} className="bg-white rounded-2xl border border-border p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-text-primary text-sm">
                          {MEAL_TYPE_LABELS[meal.meal_type] || meal.name || meal.meal_type}
                        </h3>
                        <div className="flex items-center gap-3">
                          {totalCal > 0 && <span className="text-xs text-text-muted">{Math.round(totalCal)} kcal</span>}
                          <button
                            onClick={() => setAddingToMeal(addingToMeal === meal.id ? null : meal.id)}
                            className="text-xs font-medium text-primary-darker hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Lägg till
                          </button>
                        </div>
                      </div>

                      {items.length > 0 && (
                        <div className="space-y-1.5 mb-2">
                          {items.map((item: any) => {
                            const itemName = item.recipe ? item.recipe.name_sv || item.recipe.name : item.food ? item.food.name_sv || item.food.name : "Okänt";
                            const itemKcal = item.recipe
                              ? Math.round((item.recipe.total_calories || 0) * (item.servings || 1))
                              : item.food ? Math.round((item.food.calories_per_100g || 0) * ((item.amount_g || 100) / 100)) : 0;

                            return (
                              <div key={item.id} className="flex items-center justify-between py-1 group">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded bg-success/10 flex items-center justify-center">
                                    <Salad className="w-3.5 h-3.5 text-success" />
                                  </div>
                                  <span className="text-sm text-text-primary">{itemName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-text-muted">{itemKcal} kcal</span>
                                  <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-error transition-all p-1">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {addingToMeal === meal.id && (
                        <div className="mt-3 pt-3 border-t border-border-light">
                          <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Sök recept..."
                              autoFocus
                              className="w-full rounded-lg border border-border bg-surface pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto space-y-1">
                            {filteredRecipes.length === 0 ? (
                              <p className="text-xs text-text-muted py-2 text-center">
                                {recipes.length === 0 ? "Inga recept. Gå till Näring → Skapa recept." : "Inga matchande recept"}
                              </p>
                            ) : (
                              filteredRecipes.map((recipe) => (
                                <button
                                  key={recipe.id}
                                  onClick={() => addRecipeToMeal(meal.id, recipe)}
                                  disabled={saving}
                                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-primary-lighter/50 transition-colors text-left"
                                >
                                  <span className="text-sm text-text-primary truncate">{recipe.name_sv || recipe.name}</span>
                                  <span className="text-xs text-text-muted shrink-0 ml-2">
                                    {recipe.total_calories ? `${Math.round(recipe.total_calories)} kcal` : "—"}
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
