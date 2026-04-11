import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getClientStats } from "@/actions/clients";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import Link from "next/link";
import {
  Users, ClipboardCheck, MessageSquare, Plus, ArrowRight,
  Target, Clock, CheckCircle,
} from "lucide-react";

export default async function CoachDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "coach") redirect("/portal");

  const stats = await getClientStats();

  // Get pending check-ins (att granska)
  const { data: pendingCheckIns } = await supabase
    .from("check_ins")
    .select(`
      id, status, submitted_at,
      client:clients (
        id,
        profile:profiles!clients_profile_id_fkey (first_name, last_name, avatar_url)
      )
    `)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(5);

  // Get recently reviewed check-ins
  const { data: reviewedCheckIns } = await supabase
    .from("check_ins")
    .select(`
      id, status, reviewed_at,
      client:clients (
        id,
        profile:profiles!clients_profile_id_fkey (first_name, last_name)
      )
    `)
    .eq("status", "reviewed")
    .order("reviewed_at", { ascending: false })
    .limit(5);

  // Get recent clients
  const { data: recentClients } = await supabase
    .from("clients")
    .select(`
      id, status, created_at,
      profile:profiles!clients_profile_id_fkey (first_name, last_name, email, avatar_url)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(5);

  // Get new leads (status = 'ny')
  const { data: newLeads, count: newLeadsCount } = await supabase
    .from("leads")
    .select("id, first_name, last_name, email, phone, status, created_at", { count: "exact" })
    .eq("status", "ny")
    .order("created_at", { ascending: false })
    .limit(5);

  // Get total leads count
  const { count: totalLeadsCount } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true });

  // Get contacted leads
  const { count: contactedLeadsCount } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("status", "kontaktad");

  const { greeting, emoji } = getGreeting();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">
          {greeting}, <span className="text-primary-darker">{profile?.first_name || "Coach"}</span> {emoji}
        </h1>
        <p className="text-text-secondary mt-1 font-medium">En överblick</p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Leads card */}
        <Link href="/leads">
          <div className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all ${
            (newLeadsCount || 0) > 0 ? "border-primary/30 hover:border-primary" : "border-border hover:border-primary/30"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Nya leads</p>
                {(newLeadsCount || 0) > 0 ? (
                  <p className="text-2xl font-bold text-text-primary mt-1">
                    {newLeadsCount} <span className="text-sm font-normal text-text-muted">att kontakta</span>
                  </p>
                ) : (
                  <p className="text-lg font-semibold text-text-primary mt-1">Alla uppdaterade</p>
                )}
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                (newLeadsCount || 0) > 0 ? "bg-primary-lighter" : "bg-surface"
              }`}>
                <Target className={`w-5 h-5 ${(newLeadsCount || 0) > 0 ? "text-primary-darker" : "text-text-muted"}`} />
              </div>
            </div>
          </div>
        </Link>

        {/* Check-ins card */}
        <Link href="/check-ins">
          <div className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all ${
            stats.pendingCheckIns > 0 ? "border-warning/30 hover:border-warning" : "border-border hover:border-primary/30"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Väntande check-ins</p>
                {stats.pendingCheckIns > 0 ? (
                  <p className="text-2xl font-bold text-text-primary mt-1">
                    {stats.pendingCheckIns} <span className="text-sm font-normal text-text-muted">att granska</span>
                  </p>
                ) : (
                  <p className="text-lg font-semibold text-text-primary mt-1">Inga</p>
                )}
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                stats.pendingCheckIns > 0 ? "bg-warning/10" : "bg-surface"
              }`}>
                <ClipboardCheck className={`w-5 h-5 ${stats.pendingCheckIns > 0 ? "text-warning" : "text-text-muted"}`} />
              </div>
            </div>
          </div>
        </Link>

        {/* Messages card */}
        <Link href="/messages">
          <div className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all ${
            stats.unreadMessages > 0 ? "border-accent/30 hover:border-accent" : "border-border hover:border-primary/30"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Meddelanden</p>
                {stats.unreadMessages > 0 ? (
                  <p className="text-2xl font-bold text-text-primary mt-1">
                    {stats.unreadMessages} <span className="text-sm font-normal text-text-muted">olästa</span>
                  </p>
                ) : (
                  <p className="text-lg font-semibold text-text-primary mt-1">Inga olästa</p>
                )}
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                stats.unreadMessages > 0 ? "bg-accent/10" : "bg-surface"
              }`}>
                <MessageSquare className={`w-5 h-5 ${stats.unreadMessages > 0 ? "text-accent" : "text-text-muted"}`} />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Overview stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm text-center">
          <p className="text-3xl font-bold text-text-primary">{newLeadsCount || 0}</p>
          <p className="text-sm text-text-muted mt-1">Nya leads</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm text-center">
          <p className="text-3xl font-bold text-text-primary">{contactedLeadsCount || 0}</p>
          <p className="text-sm text-text-muted mt-1">Kontaktade</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm text-center">
          <p className="text-3xl font-bold text-text-primary">{stats.activeClients}</p>
          <p className="text-sm text-text-muted mt-1">Aktiva klienter</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm text-center">
          <p className="text-3xl font-bold text-text-primary">{stats.pendingCheckIns}</p>
          <p className="text-sm text-text-muted mt-1">Att granska</p>
        </div>
      </div>

      {/* Main content - 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Check-ins att granska */}
        <div className="bg-white rounded-2xl border border-border shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" />
              <h2 className="font-semibold text-text-primary">Att granska</h2>
            </div>
            <Link href="/check-ins" className="text-xs text-primary-darker hover:underline">
              Visa alla →
            </Link>
          </div>
          <div className="divide-y divide-border-light">
            {(!pendingCheckIns || pendingCheckIns.length === 0) ? (
              <div className="px-5 py-6 text-center">
                <CheckCircle className="w-8 h-8 text-success/50 mx-auto mb-2" />
                <p className="text-sm text-text-muted">Alla check-ins granskade</p>
              </div>
            ) : (
              pendingCheckIns.map((ci: any) => (
                <Link key={ci.id} href={`/clients/${ci.client?.id}/framsteg`}>
                  <div className="px-5 py-3 flex items-center justify-between hover:bg-surface-hover transition-colors">
                    <div className="flex items-center gap-3">
                      <AvatarCircle
                        src={ci.client?.profile?.avatar_url}
                        initials={`${ci.client?.profile?.first_name?.[0] || ""}${ci.client?.profile?.last_name?.[0] || ""}`.toUpperCase()}
                        size="xs"
                      />
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {ci.client?.profile?.first_name} {ci.client?.profile?.last_name}
                        </p>
                        <p className="text-[10px] text-text-muted">
                          {ci.submitted_at
                            ? new Date(ci.submitted_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })
                            : "—"}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium bg-warning/10 text-warning px-2 py-0.5 rounded-full">
                      Ny
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Dina klienter */}
        <div className="bg-white rounded-2xl border border-border shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-text-primary">Dina klienter</h2>
            <Link href="/clients/invite" className="text-xs text-primary-darker hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> Ny klient
            </Link>
          </div>
          <div className="divide-y divide-border-light">
            {(!recentClients || recentClients.length === 0) ? (
              <div className="px-5 py-6 text-center">
                <p className="text-sm text-text-muted">Inga klienter tillagda</p>
                <Link href="/clients/invite" className="text-xs text-primary-darker hover:underline mt-1 inline-block">
                  Lägg till din första klient →
                </Link>
              </div>
            ) : (
              recentClients.map((client: any) => {
                const initials = `${client.profile?.first_name?.[0] || ""}${client.profile?.last_name?.[0] || ""}`.toUpperCase();
                return (
                  <Link key={client.id} href={`/clients/${client.id}`}>
                    <div className="px-5 py-3 flex items-center gap-3 hover:bg-surface-hover transition-colors">
                      <AvatarCircle src={client.profile?.avatar_url} initials={initials} size="xs" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {client.profile?.first_name} {client.profile?.last_name}
                        </p>
                        <p className="text-[10px] text-text-muted truncate">{client.profile?.email}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Leads */}
        <div className="bg-white rounded-2xl border border-border shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary-darker" />
              <h2 className="font-semibold text-text-primary">Leads</h2>
              {(totalLeadsCount || 0) > 0 && (
                <span className="text-[10px] text-text-muted bg-surface px-1.5 py-0.5 rounded-full">{totalLeadsCount}</span>
              )}
            </div>
            <Link href="/leads" className="text-xs text-primary-darker hover:underline">
              Visa alla →
            </Link>
          </div>
          <div className="divide-y divide-border-light">
            {(!newLeads || newLeads.length === 0) ? (
              <div className="px-5 py-6 text-center">
                <Target className="w-8 h-8 text-text-muted/30 mx-auto mb-2" />
                <p className="text-sm text-text-muted">Inga nya leads</p>
                <Link href="/leads" className="text-xs text-primary-darker hover:underline mt-1 inline-block">
                  Se alla leads →
                </Link>
              </div>
            ) : (
              newLeads.map((lead: any) => (
                <Link key={lead.id} href="/leads">
                  <div className="px-5 py-3 flex items-center justify-between hover:bg-surface-hover transition-colors">
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {lead.first_name} {lead.last_name}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {lead.email || lead.phone || "Ingen kontaktinfo"}
                      </p>
                    </div>
                    <span className="text-[10px] font-medium bg-primary-lighter text-primary-darker px-2 py-0.5 rounded-full">
                      Ny
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting(): { greeting: string; emoji: string } {
  const hour = new Date().getUTCHours();
  if (hour < 10) return { greeting: "God morgon", emoji: "\u2600\uFE0F" };
  if (hour < 17) return { greeting: "God dag", emoji: "\uD83C\uDF24\uFE0F" };
  return { greeting: "God kv\u00e4ll", emoji: "\uD83C\uDF19" };
}
