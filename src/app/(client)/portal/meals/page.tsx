import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, ChevronRight } from "lucide-react";

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "Frukost",
  snack_am: "Mellanmål (fm)",
  lunch: "Lunch",
  snack_pm: "Mellanmål (em)",
  dinner: "Middag",
  snack_evening: "Kvällsmellanmål",
};

const DAY_NAMES = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];

export default async function MealsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">Inget klientkonto hittat.</p>
      </div>
    );
  }

  const { data: mealPlan } = await supabase
    .from("meal_plans")
    .select(`
      id, title, description, target_calories, target_protein_g, target_carbs_g, target_fat_g,
      meal_plan_days (
        id, day_number, name,
        meals (
          id, meal_type, name, sort_order,
          meal_items (
            id, amount_g, servings, sort_order,
            food:foods (name, name_sv, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g),
            recipe:recipes (name, name_sv, total_calories, total_protein, total_carbs, total_fat, servings)
          )
        )
      )
    `)
    .eq("client_id", client.id)
    .eq("is_active", true)
    .single();

  if (!mealPlan) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-text-primary">Kostplan</h1>
        <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
          <p className="text-text-muted">Ingen aktiv kostplan tilldelad än.</p>
          <p className="text-sm text-text-muted mt-2">
            Din coach kommer att tilldela en kostplan åt dig.
          </p>
        </div>
      </div>
    );
  }

  const days = (mealPlan.meal_plan_days || []).sort(
    (a: any, b: any) => a.day_number - b.day_number
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">{mealPlan.title}</h1>
          {mealPlan.target_calories && (
            <p className="text-sm text-text-secondary mt-1">
              Mål: {mealPlan.target_calories} kcal | P: {mealPlan.target_protein_g}g | K: {mealPlan.target_carbs_g}g | F: {mealPlan.target_fat_g}g
            </p>
          )}
        </div>
        <Link
          href="/meals/shopping-list"
          className="flex items-center gap-1.5 text-sm font-medium text-primary-darker bg-primary-lighter px-3 py-2 rounded-xl hover:bg-primary-light transition-colors"
        >
          <ShoppingCart className="w-4 h-4" />
          Inköpslista
        </Link>
      </div>

      {/* Days */}
      {days.map((day: any) => {
        const meals = (day.meals || []).sort(
          (a: any, b: any) => a.sort_order - b.sort_order
        );
        const dayLabel = day.name || DAY_NAMES[(day.day_number - 1) % 7] || `Dag ${day.day_number}`;

        return (
          <div key={day.id} className="space-y-3">
            <h2 className="text-lg font-semibold text-text-primary">{dayLabel}</h2>

            {meals.map((meal: any) => {
              const items = meal.meal_items || [];
              let totalCal = 0, totalP = 0, totalC = 0, totalF = 0;

              items.forEach((item: any) => {
                if (item.food) {
                  const factor = (item.amount_g || 100) / 100;
                  totalCal += (item.food.calories_per_100g || 0) * factor;
                  totalP += (item.food.protein_per_100g || 0) * factor;
                  totalC += (item.food.carbs_per_100g || 0) * factor;
                  totalF += (item.food.fat_per_100g || 0) * factor;
                } else if (item.recipe) {
                  const s = item.servings || 1;
                  const rs = item.recipe.servings || 1;
                  totalCal += ((item.recipe.total_calories || 0) / rs) * s;
                  totalP += ((item.recipe.total_protein || 0) / rs) * s;
                  totalC += ((item.recipe.total_carbs || 0) / rs) * s;
                  totalF += ((item.recipe.total_fat || 0) / rs) * s;
                }
              });

              return (
                <div key={meal.id} className="bg-white rounded-2xl border border-border p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-text-primary text-sm">
                      {MEAL_TYPE_LABELS[meal.meal_type] || meal.name || meal.meal_type}
                    </h3>
                    <span className="text-xs text-text-muted bg-surface px-2 py-1 rounded-lg">
                      {Math.round(totalCal)} kcal
                    </span>
                  </div>

                  {items.length === 0 ? (
                    <p className="text-sm text-text-muted">Inga livsmedel tillagda</p>
                  ) : (
                    <div className="space-y-2">
                      {items.sort((a: any, b: any) => a.sort_order - b.sort_order).map((item: any) => {
                        const foodName = item.food
                          ? item.food.name_sv || item.food.name
                          : item.recipe
                          ? item.recipe.name_sv || item.recipe.name
                          : "Okänt";
                        const amount = item.food
                          ? `${item.amount_g || 100}g`
                          : `${item.servings || 1} portion${(item.servings || 1) > 1 ? "er" : ""}`;

                        return (
                          <div key={item.id} className="flex items-center justify-between py-1">
                            <div>
                              <p className="text-sm text-text-primary">{foodName}</p>
                              <p className="text-xs text-text-muted">{amount}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border-light flex gap-4 text-xs text-text-muted">
                      <span>P: {Math.round(totalP)}g</span>
                      <span>K: {Math.round(totalC)}g</span>
                      <span>F: {Math.round(totalF)}g</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
