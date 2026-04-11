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

  // Active meal plans (multiple allowed)
  const { data: activeMealPlans } = await supabase
    .from("meal_plans")
    .select("id, title, target_calories")
    .eq("client_id", clientId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Active workout plans (multiple allowed)
  const { data: activeWorkoutPlans } = await supabase
    .from("workout_plans")
    .select("id, title, workout_days(id)")
    .eq("client_id", clientId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Unread messages
  const { count: unreadMessages } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("is_read", false);

  // Recent messages (last 3)
  const { data: recentMessages } = await supabase
    .from("messages")
    .select("id, content, sender_id, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(3);

  // Assigned documents
  const { data: clientDocs } = await supabase
    .from("client_documents")
    .select("id, content_file:content_files(id, title, file_type, file_url), lesson:lessons(id, title)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(5);

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
          {activeMealPlans && activeMealPlans.length > 0 ? (
            <div className="space-y-1.5">
              {activeMealPlans.map((plan: any) => (
                <Link key={plan.id} href={`/meal-plans/${plan.id}`} className="block hover:opacity-80 transition-opacity">
                  <p className="text-sm font-semibold text-text-primary">{plan.title}</p>
                  {plan.target_calories && <p className="text-xs text-text-muted">{plan.target_calories} kcal</p>}
                </Link>
              ))}
            </div>
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
          {activeWorkoutPlans && activeWorkoutPlans.length > 0 ? (
            <div className="space-y-1.5">
              {activeWorkoutPlans.map((plan: any) => (
                <Link key={plan.id} href={`/workouts/${plan.id}`} className="block hover:opacity-80 transition-opacity">
                  <p className="text-sm font-semibold text-text-primary">{plan.title}</p>
                  <p className="text-xs text-text-muted">{(plan as any).workout_days?.length || 0} pass</p>
                </Link>
              ))}
            </div>
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
        {/* Messages card */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
          <Link href="/messages" className="flex items-center justify-between mb-3 hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-text-muted" />
              <span className="text-sm font-medium text-text-primary">{unreadMessages ? `${unreadMessages} olästa meddelanden` : "Meddelanden"}</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-text-muted" />
          </Link>
          {recentMessages && recentMessages.length > 0 ? (
            <div className="space-y-2">
              {recentMessages.map((msg: any) => {
                const isCoach = msg.sender_id !== client?.profile_id;
                return (
                  <div key={msg.id} className="flex gap-2">
                    <span className={`text-[10px] font-medium shrink-0 mt-0.5 ${isCoach ? "text-primary-darker" : "text-text-muted"}`}>
                      {isCoach ? "Du" : profile?.first_name}
                    </span>
                    <p className="text-xs text-text-secondary truncate flex-1">{msg.content}</p>
                    <span className="text-[10px] text-text-muted shrink-0">
                      {new Date(msg.created_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-text-muted">Inga meddelanden än</p>
          )}
        </div>

        {/* Documents card */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
          <Link href={`/clients/${clientId}/dokument`} className="flex items-center justify-between mb-3 hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-text-muted" />
              <span className="text-sm font-medium text-text-primary">Dokument</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-text-muted" />
          </Link>
          {clientDocs && clientDocs.length > 0 ? (
            <div className="space-y-1.5">
              {clientDocs.map((doc: any) => {
                const title = doc.content_file?.title || doc.lesson?.title || "Okänt";
                const type = doc.content_file ? doc.content_file.file_type : "Lektion";
                const fileUrl = doc.content_file?.file_url;
                return fileUrl ? (
                  <a key={doc.id} href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                    <FileText className="w-3 h-3 text-accent shrink-0" />
                    <p className="text-xs text-primary-darker truncate flex-1 underline underline-offset-2">{title}</p>
                    <span className="text-[10px] text-text-muted shrink-0 uppercase">{type}</span>
                  </a>
                ) : (
                  <Link key={doc.id} href={`/clients/${clientId}/dokument`} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                    <FileText className="w-3 h-3 text-primary-darker shrink-0" />
                    <p className="text-xs text-primary-darker truncate flex-1 underline underline-offset-2">{title}</p>
                    <span className="text-[10px] text-text-muted shrink-0 uppercase">{type}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-text-muted">Inga dokument tilldelade</p>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="mt-12 pt-6 border-t border-border">
        <DeleteClientButton clientId={clientId} clientName={`${profile?.first_name} ${profile?.last_name}`} />
      </div>
    </div>
  );
}
