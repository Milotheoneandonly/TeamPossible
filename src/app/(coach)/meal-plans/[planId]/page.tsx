import { getMealPlan } from "@/actions/meal-plans";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "Frukost",
  snack_am: "Mellanmål (fm)",
  lunch: "Lunch",
  snack_pm: "Mellanmål (em)",
  dinner: "Middag",
  snack_evening: "Kvällsmellanmål",
};

const DAY_NAMES = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];

export default async function MealPlanDetailPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  let plan: any;

  try {
    plan = await getMealPlan(planId);
  } catch {
    notFound();
  }

  const days = (plan.meal_plan_days || []).sort(
    (a: any, b: any) => a.day_number - b.day_number
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/meal-plans"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Alla kostplaner
      </Link>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{plan.title}</h1>
            {plan.description && (
              <p className="text-text-secondary mt-1">{plan.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            {plan.is_template && (
              <span className="text-xs font-medium bg-primary-lighter text-primary-darker px-3 py-1.5 rounded-full">Mall</span>
            )}
            {plan.is_active && (
              <span className="text-xs font-medium bg-success/10 text-success px-3 py-1.5 rounded-full">Aktiv</span>
            )}
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

      {/* Days */}
      <div className="space-y-8">
        {days.map((day: any) => {
          const meals = (day.meals || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
          const dayLabel = day.name || DAY_NAMES[(day.day_number - 1) % 7] || `Dag ${day.day_number}`;

          return (
            <div key={day.id}>
              <h2 className="text-lg font-semibold text-text-primary mb-3">{dayLabel}</h2>
              <div className="grid gap-3">
                {meals.map((meal: any) => {
                  const items = meal.meal_items || [];
                  return (
                    <div key={meal.id} className="bg-white rounded-2xl border border-border p-4 shadow-sm">
                      <h3 className="font-medium text-text-primary text-sm mb-2">
                        {MEAL_TYPE_LABELS[meal.meal_type] || meal.name || meal.meal_type}
                      </h3>
                      {items.length === 0 ? (
                        <p className="text-sm text-text-muted italic">Inga livsmedel tillagda än</p>
                      ) : (
                        <div className="space-y-1.5">
                          {items.sort((a: any, b: any) => a.sort_order - b.sort_order).map((item: any) => {
                            const name = item.food
                              ? item.food.name_sv || item.food.name
                              : item.recipe
                              ? item.recipe.name_sv || item.recipe.name
                              : "Okänt";
                            const amount = item.food
                              ? `${item.amount_g || 100}g`
                              : `${item.servings || 1} portion`;

                            return (
                              <div key={item.id} className="flex items-center justify-between text-sm">
                                <span className="text-text-primary">{name}</span>
                                <span className="text-text-muted">{amount}</span>
                              </div>
                            );
                          })}
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

      {days.length === 0 && (
        <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
          <p className="text-text-muted">Kostplanen har skapats. Lägg till livsmedel för att börja bygga planen.</p>
        </div>
      )}
    </div>
  );
}
