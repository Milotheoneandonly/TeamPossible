import { getMealPlanTemplates } from "@/actions/meal-plans";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Salad, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function MealPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ assign?: string }>;
}) {
  const { assign: assignClientId } = await searchParams;
  const supabase = await createClient();

  const templates = await getMealPlanTemplates();

  // Get client name if assigning
  let clientName = "";
  if (assignClientId) {
    const { data } = await supabase
      .from("clients")
      .select("profile:profiles!clients_profile_id_fkey(first_name, last_name)")
      .eq("id", assignClientId)
      .single();
    if (data?.profile) {
      clientName = `${(data.profile as any).first_name} ${(data.profile as any).last_name}`;
    }
  }

  const { data: assignedPlans } = await supabase
    .from("meal_plans")
    .select(`
      id, title, target_calories, is_active, created_at,
      client:clients (
        id,
        profile:profiles!clients_profile_id_fkey (first_name, last_name)
      )
    `)
    .eq("is_template", false)
    .order("created_at", { ascending: false });

  // Build link with assign param preserved
  function planLink(planId: string) {
    return assignClientId
      ? `/meal-plans/${planId}?assign=${assignClientId}`
      : `/meal-plans/${planId}`;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Assign banner */}
      {assignClientId && (
        <div className="bg-primary-lighter border border-primary/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <UserPlus className="w-5 h-5 text-primary-darker shrink-0" />
          <div>
            <p className="text-sm font-medium text-primary-darker">
              Välj en kostplan att tilldela till {clientName}
            </p>
            <p className="text-xs text-primary-darker/70">
              Klicka på en mall nedan för att tilldela den
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Kostplaner</h1>
          <p className="text-text-secondary mt-1">
            {assignClientId ? `Välj en plan för ${clientName}` : "Skapa och hantera kostplaner för dina klienter"}
          </p>
        </div>
        {!assignClientId && (
          <Link href="/meal-plans/new">
            <Button><Plus className="w-4 h-4" /> Ny kostplan</Button>
          </Link>
        )}
      </div>

      {/* Templates */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Mallar</h2>
        {(!templates || templates.length === 0) ? (
          <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
            <Salad className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">Inga mallar skapade än</p>
            <Link href="/meal-plans/new" className="text-sm text-primary-darker hover:underline mt-2 inline-block">
              Skapa din första mall →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((plan: any) => (
              <Link key={plan.id} href={planLink(plan.id)}>
                <div className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all ${
                  assignClientId ? "border-primary/30 hover:border-primary" : "border-border hover:border-primary/30"
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    {plan.image_url ? (
                      <img src={plan.image_url} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                        <Salad className="w-5 h-5 text-success" />
                      </div>
                    )}
                    <h3 className="font-semibold text-text-primary truncate">{plan.title}</h3>
                  </div>
                  {plan.target_calories && (
                    <div className="flex gap-3 text-xs text-text-muted">
                      <span>{plan.target_calories} kcal</span>
                      <span>P: {plan.target_protein_g}g</span>
                      <span>K: {plan.target_carbs_g}g</span>
                      <span>F: {plan.target_fat_g}g</span>
                    </div>
                  )}
                  {assignClientId && (
                    <p className="text-xs text-primary-darker font-medium mt-3">
                      Klicka för att tilldela →
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Assigned plans - only show when not in assign mode */}
      {!assignClientId && assignedPlans && assignedPlans.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Tilldelade planer</h2>
          <div className="bg-white rounded-2xl border border-border shadow-sm divide-y divide-border-light">
            {assignedPlans.map((plan: any) => (
              <Link key={plan.id} href={`/meal-plans/${plan.id}`}>
                <div className="px-5 py-4 flex items-center justify-between hover:bg-surface-hover transition-colors">
                  <div>
                    <p className="font-medium text-text-primary">{plan.title}</p>
                    <p className="text-sm text-text-muted">
                      {plan.client?.profile?.first_name} {plan.client?.profile?.last_name}
                      {plan.target_calories && ` — ${plan.target_calories} kcal`}
                    </p>
                  </div>
                  {plan.is_active && (
                    <span className="text-xs font-medium bg-success/10 text-success px-2.5 py-1 rounded-full">Aktiv</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
