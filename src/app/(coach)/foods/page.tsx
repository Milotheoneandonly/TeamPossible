import { createClient } from "@/lib/supabase/server";
import { Utensils } from "lucide-react";

export default async function FoodsPage() {
  const supabase = await createClient();

  const { data: foods, count } = await supabase
    .from("foods")
    .select("*", { count: "exact" })
    .order("name")
    .limit(100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Livsmedelsdatabas</h1>
          <p className="text-text-secondary mt-1">
            {count || 0} livsmedel totalt
          </p>
        </div>
      </div>

      {(!foods || foods.length === 0) ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-sm">
          <Utensils className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary">Inga livsmedel än</h3>
          <p className="text-text-secondary mt-2">
            Livsmedel läggs till när du skapar kostplaner. Du kan också lägga till egna livsmedel.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm">
          {/* Table header */}
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
                className="px-5 py-3 grid grid-cols-[1fr_80px_80px_80px_80px] gap-4 items-center hover:bg-surface-hover transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {food.name_sv || food.name}
                  </p>
                  {food.brand && (
                    <p className="text-xs text-text-muted">{food.brand}</p>
                  )}
                </div>
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
  );
}
