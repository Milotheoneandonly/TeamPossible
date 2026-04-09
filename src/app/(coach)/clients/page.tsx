import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Users, Search, MoreVertical } from "lucide-react";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { Button } from "@/components/ui/button";

export default async function ClientsPage() {
  const supabase = await createClient();

  // Get all clients with profile data
  const { data: clients } = await supabase
    .from("clients")
    .select(`
      id, status, start_date, notes, goals, created_at,
      profile:profiles!clients_profile_id_fkey (
        id, first_name, last_name, email, phone, avatar_url
      )
    `)
    .order("created_at", { ascending: false });

  // Get check-in data for each client
  const enrichedClients = await Promise.all(
    (clients || []).map(async (client: any) => {
      // Latest check-in
      const { data: latestCheckIn } = await supabase
        .from("check_ins")
        .select("status, submitted_at, created_at")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Active meal plan
      const { data: mealPlan } = await supabase
        .from("meal_plans")
        .select("id")
        .eq("client_id", client.id)
        .eq("is_active", true)
        .limit(1)
        .single();

      // Active workout plan
      const { data: workoutPlan } = await supabase
        .from("workout_plans")
        .select("id")
        .eq("client_id", client.id)
        .eq("is_active", true)
        .limit(1)
        .single();

      // Unread messages count
      const { count: unreadMessages } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("client_id", client.id)
        .eq("is_read", false);

      // Calculate week number (weeks since start_date)
      const startDate = client.start_date ? new Date(client.start_date) : new Date(client.created_at);
      const now = new Date();
      const weekNumber = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)));

      // Check-in timing
      let checkInText = "—";
      if (latestCheckIn?.submitted_at) {
        const diff = now.getTime() - new Date(latestCheckIn.submitted_at).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        if (hours < 1) checkInText = "Just nu";
        else if (hours < 24) checkInText = `${hours} timmar sedan`;
        else if (days === 1) checkInText = "En dag";
        else if (days < 7) checkInText = `${days} dagar`;
        else checkInText = `${Math.floor(days / 7)} veckor`;
      } else if (latestCheckIn?.status === "pending") {
        checkInText = "Väntande";
      }

      return {
        ...client,
        weekNumber,
        checkInText,
        checkInStatus: latestCheckIn?.status || null,
        hasMealPlan: !!mealPlan,
        hasWorkoutPlan: !!workoutPlan,
        unreadMessages: unreadMessages || 0,
      };
    })
  );

  const activeClients = enrichedClients.filter((c) => c.status === "active");
  const allClients = enrichedClients;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Klienter / <span>Aktiva</span>
          </h1>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-4 mb-6 border-b border-border overflow-x-auto">
        <span className="text-sm font-medium text-primary-darker border-b-2 border-primary-darker pb-3 px-1 whitespace-nowrap">
          Alla Aktiva <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full ml-1">{activeClients.length}</span>
        </span>
        <span className="text-sm text-text-muted pb-3 px-1 whitespace-nowrap">Nyligen Startat</span>
        <span className="text-sm text-text-muted pb-3 px-1 whitespace-nowrap">Ny Check-In</span>
        <span className="text-sm text-text-muted pb-3 px-1 whitespace-nowrap">Missad Check-In</span>
      </div>

      {/* Search + actions */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-secondary">
          Visar {activeClients.length} av {allClients.length} klienter
        </p>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Sök"
              className="rounded-xl border border-border bg-white pl-9 pr-4 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <Link href="/clients/invite">
            <Button>Lägg till klient</Button>
          </Link>
        </div>
      </div>

      {/* Client table */}
      {activeClients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-sm">
          <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary">Inga klienter än</h3>
          <p className="text-text-secondary mt-2">Lägg till din första klient för att komma igång.</p>
          <Link href="/clients/invite" className="inline-block mt-4">
            <Button><Plus className="w-4 h-4" /> Lägg till klient</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_80px_120px_80px_80px] gap-4 px-5 py-3 border-b border-border text-xs font-semibold text-text-muted uppercase tracking-wide">
            <span>Namn</span>
            <span className="text-center">Vecka</span>
            <span>Check-in</span>
            <span className="text-center">Scheman</span>
            <span className="text-center">Meddelanden</span>
          </div>

          {/* Client rows */}
          <div className="divide-y divide-border-light">
            {activeClients.map((client: any) => {
              const profile = client.profile;
              const initials = `${profile?.first_name?.[0] || ""}${profile?.last_name?.[0] || ""}`.toUpperCase();

              return (
                <Link key={client.id} href={`/clients/${client.id}`}>
                  <div className="grid grid-cols-[1fr_80px_120px_80px_80px] gap-4 px-5 py-3.5 items-center hover:bg-surface-hover transition-colors">
                    {/* Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <AvatarCircle src={profile?.avatar_url} initials={initials} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {profile?.first_name} {profile?.last_name}
                        </p>
                      </div>
                    </div>

                    {/* Week */}
                    <p className="text-sm text-text-primary text-center font-medium">
                      {client.weekNumber}
                    </p>

                    {/* Check-in */}
                    <div>
                      <p className="text-sm text-text-secondary">{client.checkInText}</p>
                      {client.checkInStatus === "submitted" && (
                        <span className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded-full">Ny</span>
                      )}
                    </div>

                    {/* Plans */}
                    <div className="flex items-center justify-center gap-1.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                        client.hasMealPlan ? "bg-success/10 text-success" : "bg-surface text-text-muted"
                      }`}>
                        {client.hasMealPlan ? "✓" : "—"}
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                        client.hasWorkoutPlan ? "bg-success/10 text-success" : "bg-surface text-text-muted"
                      }`}>
                        {client.hasWorkoutPlan ? "✓" : "—"}
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="text-center">
                      {client.unreadMessages > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-error text-white text-xs font-bold rounded-full">
                          {client.unreadMessages}
                        </span>
                      ) : (
                        <span className="text-sm text-text-muted">—</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
