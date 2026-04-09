import { createClient } from "@/lib/supabase/server";
import { getRecipes } from "@/actions/recipes";
import { getMealPlanTemplates } from "@/actions/meal-plans";
import Link from "next/link";
import { Plus, Salad, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteMealPlanButton } from "@/components/coach/delete-button";

const MEAL_TAG_LABELS: Record<string, string> = {
  breakfast: "Frukost", lunch: "Lunch", dinner: "Middag", snack: "Mellanmål",
  high_protein: "Proteinrik", quick: "Snabb", vegan: "Vegansk", vegetarian: "Vegetarisk",
};

export default async function NutritionPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; assign?: string }>;
}) {
  const { tab, assign: assignClientId } = await searchParams;
  const activeTab = tab || "mallar";
  const supabase = await createClient();

  let clientName = "";
  if (assignClientId) {
    const { data } = await supabase.from("clients").select("profile:profiles!clients_profile_id_fkey(first_name, last_name)").eq("id", assignClientId).single();
    if (data?.profile) clientName = `${(data.profile as any).first_name} ${(data.profile as any).last_name}`;
  }

  const templates = activeTab === "mallar" ? await getMealPlanTemplates() : [];
  const recipes = activeTab === "recept" ? await getRecipes() : [];

  const { data: foods, count: foodCount } = activeTab === "livsmedel"
    ? await supabase.from("foods").select("*", { count: "exact" }).order("name_sv").limit(200)
    : { data: [], count: 0 };

  // Get assigned plans for mallar tab
  const { data: assignedPlans } = activeTab === "mallar"
    ? await supabase
        .from("meal_plans")
        .select(`id, title, target_calories, is_active, client:clients(id, profile:profiles!clients_profile_id_fkey(first_name, last_name))`)
        .eq("is_template", false)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-text-primary">Näring</h1>
        <div className="flex gap-2">
          {activeTab === "mallar" && !assignClientId && (
            <Link href="/meal-plans/new"><Button><Plus className="w-4 h-4" /> Ny kostplan</Button></Link>
          )}
          {activeTab === "recept" && (
            <Link href="/foods/new-recipe"><Button><Plus className="w-4 h-4" /> Skapa recept</Button></Link>
          )}
          {activeTab === "livsmedel" && (
            <Link href="/foods/new-food"><Button><Plus className="w-4 h-4" /> Lägg till ingrediens</Button></Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-8 border-b border-border">
        <Link href="/foods?tab=mallar" className={`text-sm font-medium pb-3 border-b-2 transition-colors ${activeTab === "mallar" ? "text-primary-darker border-primary-darker" : "text-text-muted border-transparent hover:text-text-primary"}`}>
          Mallar
        </Link>
        <Link href="/foods?tab=recept" className={`text-sm font-medium pb-3 border-b-2 transition-colors ${activeTab === "recept" ? "text-primary-darker border-primary-darker" : "text-text-muted border-transparent hover:text-text-primary"}`}>
          Recept
        </Link>
        <Link href="/foods?tab=livsmedel" className={`text-sm font-medium pb-3 border-b-2 transition-colors ${activeTab === "livsmedel" ? "text-primary-darker border-primary-darker" : "text-text-muted border-transparent hover:text-text-primary"}`}>
          Livsmedel
        </Link>
      </div>

      {/* Assign banner */}
      {assignClientId && (
        <div className="bg-primary-lighter border border-primary/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <Salad className="w-5 h-5 text-primary-darker shrink-0" />
          <div>
            <p className="text-sm font-medium text-primary-darker">Välj en kostplan att tilldela till {clientName}</p>
            <p className="text-xs text-primary-darker/70">Klicka på en mall nedan</p>
          </div>
        </div>
      )}

      {/* MALLAR TAB */}
      {(activeTab === "mallar" || assignClientId) && (
        <>
          {(!templates || templates.length === 0) ? (
            <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
              <Salad className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted">Inga kostplansmallar skapade än</p>
              <Link href="/meal-plans/new" className="text-sm text-primary-darker hover:underline mt-2 inline-block">Skapa din första mall →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {templates.map((plan: any) => (
                <Link key={plan.id} href={assignClientId ? `/meal-plans/${plan.id}?assign=${assignClientId}` : `/meal-plans/${plan.id}`}>
                  <div className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all ${assignClientId ? "border-primary/30 hover:border-primary" : "border-border hover:border-primary/30"}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                        <Salad className="w-5 h-5 text-success" />
                      </div>
                      <h3 className="font-semibold text-text-primary truncate flex-1">{plan.title}</h3>
                      {!assignClientId && <DeleteMealPlanButton planId={plan.id} planTitle={plan.title} />}
                    </div>
                    {plan.target_calories && (
                      <div className="flex gap-3 text-xs text-text-muted">
                        <span>{plan.target_calories} kcal</span>
                        <span>P: {plan.target_protein_g}g</span>
                        <span>K: {plan.target_carbs_g}g</span>
                        <span>F: {plan.target_fat_g}g</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Assigned plans */}
          {assignedPlans && assignedPlans.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-4">Tilldelade planer</h2>
              <div className="bg-white rounded-2xl border border-border shadow-sm divide-y divide-border-light">
                {assignedPlans.map((plan: any) => (
                  <div key={plan.id} className="px-5 py-4 flex items-center justify-between hover:bg-surface-hover transition-colors">
                    <Link href={`/meal-plans/${plan.id}`} className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary">{plan.title}</p>
                      <p className="text-sm text-text-muted">{plan.client?.profile?.first_name} {plan.client?.profile?.last_name}{plan.target_calories && ` — ${plan.target_calories} kcal`}</p>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      {plan.is_active && <span className="text-xs font-medium bg-success/10 text-success px-2.5 py-1 rounded-full">Aktiv</span>}
                      <DeleteMealPlanButton planId={plan.id} planTitle={plan.title} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* RECEPT TAB */}
      {activeTab === "recept" && (
        <>
          {(!recipes || recipes.length === 0) ? (
            <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
              <Salad className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted">Inga recept skapade än</p>
              <Link href="/foods/new-recipe" className="text-sm text-primary-darker hover:underline mt-2 inline-block">Skapa ditt första recept →</Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border shadow-sm">
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
                          <img src={recipe.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                            <Salad className="w-5 h-5 text-success" />
                          </div>
                        )}
                        <p className="text-sm font-medium text-text-primary truncate">{recipe.name_sv || recipe.name}</p>
                      </div>
                      <p className="text-xs text-text-secondary">
                        {recipe.total_protein ? `${Math.round(recipe.total_protein)}P` : "—"}/
                        {recipe.total_carbs ? `${Math.round(recipe.total_carbs)}K` : "—"}/
                        {recipe.total_fat ? `${Math.round(recipe.total_fat)}F` : "—"}
                      </p>
                      <p className="text-sm text-text-secondary text-right">{recipe.total_calories ? Math.round(recipe.total_calories) : "—"}</p>
                      <p className="text-sm text-text-secondary text-right">{recipe.prep_time_minutes ? `${recipe.prep_time_minutes} min` : "—"}</p>
                      <div className="flex gap-1 flex-wrap">
                        {(recipe.tags || []).slice(0, 2).map((tag: string) => (
                          <span key={tag} className="text-[10px] bg-primary-lighter text-primary-darker px-2 py-0.5 rounded-full">{MEAL_TAG_LABELS[tag] || tag}</span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* LIVSMEDEL TAB */}
      {activeTab === "livsmedel" && (
        <>
          <p className="text-sm text-text-secondary mb-4">Visar {foodCount || 0} livsmedel</p>
          {(!foods || foods.length === 0) ? (
            <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
              <Utensils className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted">Inga livsmedel tillagda än</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border shadow-sm">
              <div className="px-5 py-3 border-b border-border grid grid-cols-[1fr_70px_80px_80px_80px_80px] gap-3 text-xs font-semibold text-text-muted uppercase tracking-wide">
                <span>Livsmedel</span>
                <span>Kategori</span>
                <span className="text-right">Kcal</span>
                <span className="text-right">Protein</span>
                <span className="text-right">Kolhydrat</span>
                <span className="text-right">Fett</span>
              </div>
              <div className="divide-y divide-border-light">
                {foods.map((food: any) => (
                  <div key={food.id} className="px-5 py-2.5 grid grid-cols-[1fr_70px_80px_80px_80px_80px] gap-3 items-center text-sm">
                    <p className="font-medium text-text-primary truncate">{food.name_sv || food.name}</p>
                    <span className="text-[10px] text-text-muted truncate">{food.category || "—"}</span>
                    <p className="text-text-secondary text-right">{food.calories_per_100g ? Math.round(food.calories_per_100g) : "—"}</p>
                    <p className="text-text-secondary text-right">{food.protein_per_100g ? `${food.protein_per_100g}g` : "—"}</p>
                    <p className="text-text-secondary text-right">{food.carbs_per_100g ? `${food.carbs_per_100g}g` : "—"}</p>
                    <p className="text-text-secondary text-right">{food.fat_per_100g ? `${food.fat_per_100g}g` : "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
