import { getClient } from "@/actions/clients";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AvatarUpload } from "@/components/coach/avatar-upload";
import { DeleteClientButton } from "@/components/coach/delete-client-button";
import { ClientTagToggle } from "@/components/coach/client-tag-toggle";
import {
  ArrowLeft,
  ArrowUpRight,
  MessageSquare,
  Settings,
  FileText,
} from "lucide-react";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  let client: any;

  try {
    client = await getClient(clientId);
  } catch {
    notFound();
  }

  const supabase = await createClient();
  const profile = client.profile;
  const initials = `${profile?.first_name?.[0] || ""}${profile?.last_name?.[0] || ""}`.toUpperCase();

  // Calculate week number
  const startDate = client.start_date ? new Date(client.start_date) : new Date(client.created_at);
  const now = new Date();
  const weekNumber = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)));

  // Latest progress (weight)
  const { data: latestProgress } = await supabase
    .from("progress_entries")
    .select("weight_kg, date")
    .eq("client_id", clientId)
    .order("date", { ascending: false })
    .limit(2);

  const currentWeight = latestProgress?.[0]?.weight_kg;
  const previousWeight = latestProgress?.[1]?.weight_kg;
  const weightDiff = currentWeight && previousWeight
    ? (currentWeight - previousWeight).toFixed(1)
    : null;

  // Latest check-in
  const { data: latestCheckIn } = await supabase
    .from("check_ins")
    .select("id, status, submitted_at, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Calculate next check-in (assume weekly from last one)
  let nextCheckInText = "—";
  let hasNewCheckIn = false;
  if (latestCheckIn?.status === "submitted") {
    hasNewCheckIn = true;
    nextCheckInText = "Ny check-in!";
  } else if (latestCheckIn?.submitted_at || latestCheckIn?.created_at) {
    const lastDate = new Date(latestCheckIn.submitted_at || latestCheckIn.created_at);
    const nextDate = new Date(lastDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 0) nextCheckInText = "Idag";
    else if (daysUntil === 1) nextCheckInText = "Om 1 dag";
    else nextCheckInText = `Om ${daysUntil} dagar`;
  }

  // Active meal plan
  const { data: activeMealPlan } = await supabase
    .from("meal_plans")
    .select("id, title, target_calories")
    .eq("client_id", clientId)
    .eq("is_active", true)
    .single();

  // Count meals in active plan
  let mealCount = 0;
  if (activeMealPlan) {
    const { count } = await supabase
      .from("meal_plan_days")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", activeMealPlan.id);
    // Actually count meals, not days
    const { data: days } = await supabase
      .from("meal_plan_days")
      .select("meals(id)")
      .eq("plan_id", activeMealPlan.id);
    mealCount = (days || []).reduce((acc: number, d: any) => acc + (d.meals?.length || 0), 0);
  }

  // Active workout plan
  const { data: activeWorkoutPlan } = await supabase
    .from("workout_plans")
    .select("id, title, workout_days(id)")
    .eq("client_id", clientId)
    .eq("is_active", true)
    .single();

  // Unread messages
  const { count: unreadMessages } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("is_read", false);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Alla klienter
      </Link>

      {/* Client header */}
      <div className="flex items-center gap-5 mb-8">
        <AvatarUpload
          profileId={profile?.id}
          currentUrl={profile?.avatar_url}
          initials={initials}
          size="lg"
        />
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">
              {profile?.first_name} {profile?.last_name}
            </h1>
            <ClientTagToggle clientId={clientId} currentTags={client.tags || []} />
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              client.status === "active" ? "bg-success/10 text-success" : "bg-surface text-text-muted"
            }`}>
              {client.status === "active" ? "Aktiv" : client.status === "paused" ? "Pausad" : "Inaktiv"}
            </span>
          </div>
          {/* Sub-tabs */}
          <div className="flex gap-6 mt-3 text-sm">
            <span className="font-medium text-text-primary border-b-2 border-primary-darker pb-1">Översikt</span>
            <Link href={`/clients/${clientId}/naring`} className="text-text-muted hover:text-text-primary transition-colors pb-1">Näring</Link>
            <Link href={`/clients/${clientId}/traning`} className="text-text-muted hover:text-text-primary transition-colors pb-1">Träning</Link>
            <Link href={`/clients/${clientId}/framsteg`} className="text-text-muted hover:text-text-primary transition-colors pb-1">Framsteg</Link>
          </div>
        </div>
      </div>

      {/* Main grid — even 3×2 layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Notes / status */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm flex flex-col">
          <p className="text-xs text-text-muted mb-2">Klientinställningar</p>
          {hasNewCheckIn ? (
            <p className="text-sm font-semibold text-success">Snyggt! {profile?.first_name} har gjort en ny check-in</p>
          ) : client.notes ? (
            <p className="text-sm text-text-secondary leading-relaxed">{client.notes}</p>
          ) : (
            <p className="text-sm text-text-muted italic">Inga anteckningar</p>
          )}
        </div>

        {/* Vikt */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-text-muted">Vikt</p>
            <Link href={`/clients/${clientId}/framsteg`}><ArrowUpRight className="w-4 h-4 text-text-muted hover:text-text-primary" /></Link>
          </div>
          {weightDiff ? (
            <>
              <p className="text-3xl font-bold text-text-primary">{Number(weightDiff) > 0 ? "+" : ""}{weightDiff} <span className="text-sm font-normal text-text-muted">kg</span></p>
              <p className="text-xs text-text-muted mt-1">{currentWeight} kg totalt</p>
            </>
          ) : currentWeight ? (
            <p className="text-3xl font-bold text-text-primary">{currentWeight} <span className="text-sm font-normal text-text-muted">kg</span></p>
          ) : (
            <p className="text-sm text-text-muted">Ingen vikt registrerad</p>
          )}
        </div>

        {/* Check-in */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-text-muted">Check-in</p>
            <Link href={`/clients/${clientId}/framsteg`}><ArrowUpRight className="w-4 h-4 text-text-muted hover:text-text-primary" /></Link>
          </div>
          {hasNewCheckIn ? (
            <p className="text-2xl font-bold text-success">Ny check-in!</p>
          ) : (
            <>
              <p className="text-3xl font-bold text-text-primary">{nextCheckInText}</p>
              <p className="text-xs text-text-muted mt-1">Nästa check-in</p>
            </>
          )}
        </div>

        {/* Medlemskap */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm flex flex-col">
          <p className="text-xs text-text-muted mb-2">Pågående medlemskap</p>
          <p className="text-xl font-bold text-text-primary">Vecka {weekNumber}</p>
          <p className="text-xs text-text-muted mt-1">Start: {startDate.toLocaleDateString("sv-SE")}</p>
        </div>

        {/* Kostschema */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-text-muted">Kostschema</p>
            <Link href={`/clients/${clientId}/naring`}><ArrowUpRight className="w-4 h-4 text-text-muted hover:text-text-primary" /></Link>
          </div>
          {activeMealPlan ? (
            <>
              <p className="text-3xl font-bold text-text-primary">{activeMealPlan.target_calories || "—"} <span className="text-sm font-normal text-text-muted">kcal</span></p>
              <p className="text-xs text-text-muted mt-1">{mealCount} måltider/dag</p>
            </>
          ) : (
            <>
              <p className="text-sm text-text-muted mb-2">Inget kostschema tilldelat</p>
              <Link href={`/foods?tab=mallar&assign=${clientId}`} className="text-sm font-medium text-primary-darker hover:underline">Tilldela kostplan →</Link>
            </>
          )}
        </div>

        {/* Träning */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-text-muted">Träning</p>
            <Link href={`/clients/${clientId}/traning`}><ArrowUpRight className="w-4 h-4 text-text-muted hover:text-text-primary" /></Link>
          </div>
          {activeWorkoutPlan ? (
            <>
              <p className="text-3xl font-bold text-text-primary">{(activeWorkoutPlan as any).workout_days?.length || 0} <span className="text-sm font-normal text-text-muted">Pass</span></p>
              <p className="text-xs text-text-muted mt-1">{activeWorkoutPlan.title}</p>
            </>
          ) : (
            <>
              <p className="text-sm text-text-muted mb-2">Inget program tilldelat</p>
              <Link href={`/workouts?assign=${clientId}`} className="text-sm font-medium text-primary-darker hover:underline">Tilldela program →</Link>
            </>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-primary">{unreadMessages ? `${unreadMessages} olästa meddelanden` : "0 olästa meddelanden"}</span>
          </div>
          <ArrowUpRight className="w-4 h-4 text-text-muted" />
        </div>
        <Link href={`/clients/${clientId}/dokument`} className="bg-white rounded-2xl border border-border p-4 shadow-sm flex items-center justify-between hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-primary">Dokument</span>
          </div>
          <ArrowUpRight className="w-4 h-4 text-text-muted" />
        </Link>
      </div>

      {/* Danger zone */}
      <div className="mt-12 pt-6 border-t border-border">
        <DeleteClientButton clientId={clientId} clientName={`${profile?.first_name} ${profile?.last_name}`} />
      </div>
    </div>
  );
}
