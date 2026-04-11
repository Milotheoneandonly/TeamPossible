import { createClient } from "@/lib/supabase/server";
import { getClient } from "@/actions/clients";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Salad, Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteMealPlanButton } from "@/components/coach/delete-button";
import { PlanStatusToggle } from "@/components/coach/plan-status-toggle";

export default async function ClientNaringPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  let client: any;
  try { client = await getClient(clientId); } catch { notFound(); }

  const supabase = await createClient();
  const profile = client.profile;
  const initials = `${profile?.first_name?.[0] || ""}${profile?.last_name?.[0] || ""}`.toUpperCase();

  // Get all meal plans for this client
  const { data: mealPlans } = await supabase
    .from("meal_plans")
    .select(`
      id, title, target_calories, target_protein_g, target_carbs_g, target_fat_g,
      is_active, created_at,
      meal_plan_days (id, meals (id))
    `)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href={`/clients/${clientId}`} className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Alla klienter
      </Link>

      {/* Client header */}
      <div className="flex items-center gap-5 mb-8">
        <div className="w-16 h-16 rounded-full bg-primary-lighter flex items-center justify-center shrink-0">
          <span className="text-xl font-bold text-primary-darker">{initials}</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{profile?.first_name} {profile?.last_name}</h1>
          <div className="flex gap-6 mt-3 text-sm">
            <Link href={`/clients/${clientId}`} className="text-text-muted hover:text-text-primary pb-1">Översikt</Link>
            <span className="font-medium text-primary-darker border-b-2 border-primary-darker pb-1">Näring</span>
            <Link href={`/clients/${clientId}/traning`} className="text-text-muted hover:text-text-primary pb-1">Träning</Link>
            <Link href={`/clients/${clientId}/framsteg`} className="text-text-muted hover:text-text-primary pb-1">Framsteg</Link>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-text-secondary">
          Visar {mealPlans?.length || 0} kostschema{(mealPlans?.length || 0) !== 1 ? "n" : ""}
        </p>
        <Link href={`/foods?tab=mallar&assign=${clientId}`}>
          <Button><Plus className="w-4 h-4" /> Lägg till kostschema</Button>
        </Link>
      </div>

      {/* Plans list */}
      {(!mealPlans || mealPlans.length === 0) ? (
        <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
          <Salad className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">Inga kostscheman tilldelade</p>
          <Link href={`/foods?tab=mallar&assign=${clientId}`} className="text-sm text-primary-darker hover:underline mt-2 inline-block">
            Tilldela ett kostschema →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="grid grid-cols-[1fr_100px_80px_40px] gap-4 px-5 py-3 border-b border-border text-xs font-semibold text-text-muted uppercase tracking-wide">
            <span>Namn</span>
            <span>Kalorier</span>
            <span>Status</span>
            <span></span>
          </div>
          <div className="divide-y divide-border-light">
            {mealPlans.map((plan: any) => {
              const mealCount = (plan.meal_plan_days || []).reduce((acc: number, d: any) => acc + (d.meals?.length || 0), 0);
              return (
                <div key={plan.id} className="grid grid-cols-[1fr_100px_80px_40px] gap-4 px-5 py-4 items-center hover:bg-surface-hover transition-colors">
                  <Link href={`/meal-plans/${plan.id}`}>
                    <div>
                      <p className="font-medium text-text-primary">{plan.title}</p>
                      <p className="text-xs text-text-muted">{mealCount} måltider</p>
                    </div>
                  </Link>
                  <p className="text-sm text-text-secondary">{plan.target_calories || "—"} kcal</p>
                  <PlanStatusToggle planId={plan.id} isActive={plan.is_active} table="meal_plans" />
                  <DeleteMealPlanButton planId={plan.id} planTitle={plan.title} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
