import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingCart } from "lucide-react";

interface ShoppingItem {
  name: string;
  totalAmount: number;
  unit: string;
  category: string;
}

export default async function ShoppingListPage() {
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

  // Get active meal plan with all items
  const { data: mealPlan } = await supabase
    .from("meal_plans")
    .select(`
      id, title,
      meal_plan_days (
        meals (
          meal_items (
            amount_g, servings,
            food:foods (name, name_sv, category),
            recipe:recipes (
              name, name_sv,
              recipe_ingredients (
                amount_g,
                food:foods (name, name_sv, category)
              )
            )
          )
        )
      )
    `)
    .eq("client_id", client.id)
    .eq("is_active", true)
    .single();

  // Aggregate all food items
  const itemMap = new Map<string, ShoppingItem>();

  if (mealPlan) {
    for (const day of mealPlan.meal_plan_days || []) {
      for (const meal of (day as any).meals || []) {
        for (const item of (meal as any).meal_items || []) {
          if (item.food) {
            const name = item.food.name_sv || item.food.name;
            const existing = itemMap.get(name);
            const amount = item.amount_g || 100;
            if (existing) {
              existing.totalAmount += amount;
            } else {
              itemMap.set(name, {
                name,
                totalAmount: amount,
                unit: "g",
                category: item.food.category || "Övrigt",
              });
            }
          }
          if (item.recipe) {
            for (const ing of (item.recipe as any).recipe_ingredients || []) {
              if (ing.food) {
                const name = ing.food.name_sv || ing.food.name;
                const existing = itemMap.get(name);
                const servings = item.servings || 1;
                const amount = (ing.amount_g || 0) * servings;
                if (existing) {
                  existing.totalAmount += amount;
                } else {
                  itemMap.set(name, {
                    name,
                    totalAmount: amount,
                    unit: "g",
                    category: ing.food.category || "Övrigt",
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  // Group by category
  const items = Array.from(itemMap.values());
  const grouped = items.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/portal/meals" className="p-2 -ml-2 text-text-secondary hover:text-text-primary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Inköpslista</h1>
          {mealPlan && (
            <p className="text-sm text-text-secondary">{mealPlan.title}</p>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
          <ShoppingCart className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">Ingen inköpslista att visa.</p>
          <p className="text-sm text-text-muted mt-1">
            Inköpslistan genereras automatiskt från din kostplan.
          </p>
        </div>
      ) : (
        categories.map((category) => (
          <div key={category}>
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">
              {category}
            </h2>
            <div className="bg-white rounded-2xl border border-border shadow-sm divide-y divide-border-light">
              {grouped[category].map((item) => (
                <label
                  key={item.name}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-hover transition-colors"
                >
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded-md border-border text-primary focus:ring-primary/50 accent-primary"
                  />
                  <span className="flex-1 text-sm text-text-primary">{item.name}</span>
                  <span className="text-sm text-text-muted">
                    {item.totalAmount >= 1000
                      ? `${(item.totalAmount / 1000).toFixed(1)} kg`
                      : `${Math.round(item.totalAmount)} g`}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
