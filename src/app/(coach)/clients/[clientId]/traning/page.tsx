import { createClient } from "@/lib/supabase/server";
import { getClient } from "@/actions/clients";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Dumbbell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteWorkoutPlanButton } from "@/components/coach/delete-button";

export default async function ClientTraningPage({
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

  // Get all workout plans for this client
  const { data: workoutPlans } = await supabase
    .from("workout_plans")
    .select(`
      id, title, description, is_active, created_at,
      workout_days (id)
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
            <Link href={`/clients/${clientId}/naring`} className="text-text-muted hover:text-text-primary pb-1">Näring</Link>
            <span className="font-medium text-primary-darker border-b-2 border-primary-darker pb-1">Träning</span>
            <Link href={`/clients/${clientId}/framsteg`} className="text-text-muted hover:text-text-primary pb-1">Framsteg</Link>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-text-secondary">
          Visar {workoutPlans?.length || 0} träningsschema{(workoutPlans?.length || 0) !== 1 ? "n" : ""}
        </p>
        <Link href={`/workouts?assign=${clientId}`}>
          <Button><Plus className="w-4 h-4" /> Lägg till träningsschema</Button>
        </Link>
      </div>

      {/* Plans list - table matching zenfit */}
      {(!workoutPlans || workoutPlans.length === 0) ? (
        <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
          <Dumbbell className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">Inga träningsscheman tilldelade</p>
          <Link href={`/workouts?assign=${clientId}`} className="text-sm text-primary-darker hover:underline mt-2 inline-block">
            Tilldela ett träningsschema →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="grid grid-cols-[1fr_200px_100px_60px_40px] gap-4 px-5 py-3 border-b border-border text-xs font-semibold text-text-muted uppercase tracking-wide">
            <span>Namn</span>
            <span>Introduktion</span>
            <span>Status</span>
            <span className="text-right">Pass</span>
            <span></span>
          </div>
          <div className="divide-y divide-border-light">
            {workoutPlans.map((plan: any) => (
              <div key={plan.id} className="grid grid-cols-[1fr_200px_100px_60px_40px] gap-4 px-5 py-4 items-center hover:bg-surface-hover transition-colors">
                <Link href={`/workouts/${plan.id}`}>
                  <p className="font-medium text-text-primary">{plan.title}</p>
                </Link>
                <p className="text-sm text-text-muted truncate">{plan.description || "—"}</p>
                {plan.is_active ? (
                  <span className="text-xs font-medium bg-success/10 text-success px-2.5 py-1 rounded-full w-fit">Publicerad</span>
                ) : (
                  <span className="text-xs text-text-muted">Inaktiv</span>
                )}
                <p className="text-sm font-medium text-text-primary text-right">{plan.workout_days?.length || 0}</p>
                <DeleteWorkoutPlanButton planId={plan.id} planTitle={plan.title} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
