import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getClientStats } from "@/actions/clients";
import Link from "next/link";
import { Users, ClipboardCheck, MessageSquare, Plus, ArrowRight } from "lucide-react";

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

  // Get recent check-ins
  const { data: recentCheckIns } = await supabase
    .from("check_ins")
    .select(`
      id, status, submitted_at,
      client:clients (
        id,
        profile:profiles!clients_profile_id_fkey (first_name, last_name)
      )
    `)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(5);

  // Get recent clients
  const { data: recentClients } = await supabase
    .from("clients")
    .select(`
      id, status, created_at,
      profile:profiles!clients_profile_id_fkey (first_name, last_name, email)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(5);

  const greeting = getGreeting();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">
          {greeting}, {profile?.first_name || "Coach"}!
        </h1>
        <p className="text-text-secondary mt-1">
          Här är en översikt av din coaching
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/clients">
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Aktiva klienter</p>
                <p className="text-3xl font-bold text-text-primary mt-2">
                  {stats.activeClients}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary-lighter flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-darker" />
              </div>
            </div>
          </div>
        </Link>

        <Link href="/check-ins">
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Väntande check-ins</p>
                <p className="text-3xl font-bold text-text-primary mt-2">
                  {stats.pendingCheckIns}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                stats.pendingCheckIns > 0 ? "bg-warning/10" : "bg-surface"
              }`}>
                <ClipboardCheck className={`w-6 h-6 ${
                  stats.pendingCheckIns > 0 ? "text-warning" : "text-text-muted"
                }`} />
              </div>
            </div>
          </div>
        </Link>

        <Link href="/messages">
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Olästa meddelanden</p>
                <p className="text-3xl font-bold text-text-primary mt-2">
                  {stats.unreadMessages}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                stats.unreadMessages > 0 ? "bg-accent/10" : "bg-surface"
              }`}>
                <MessageSquare className={`w-6 h-6 ${
                  stats.unreadMessages > 0 ? "text-accent" : "text-text-muted"
                }`} />
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent check-ins */}
        <div className="bg-white rounded-2xl border border-border shadow-sm">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-text-primary">Senaste check-ins</h2>
            <Link href="/check-ins" className="text-sm text-primary-darker hover:underline">
              Visa alla →
            </Link>
          </div>
          <div className="divide-y divide-border-light">
            {(!recentCheckIns || recentCheckIns.length === 0) ? (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-text-muted">Inga väntande check-ins</p>
              </div>
            ) : (
              recentCheckIns.map((ci: any) => (
                <div key={ci.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {ci.client?.profile?.first_name} {ci.client?.profile?.last_name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {ci.submitted_at
                        ? new Date(ci.submitted_at).toLocaleDateString("sv-SE", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </p>
                  </div>
                  <span className="text-xs font-medium bg-warning/10 text-warning px-2.5 py-1 rounded-full">
                    Att granska
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent clients */}
        <div className="bg-white rounded-2xl border border-border shadow-sm">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-text-primary">Dina klienter</h2>
            <Link href="/clients/invite" className="text-sm text-primary-darker hover:underline flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              Ny klient
            </Link>
          </div>
          <div className="divide-y divide-border-light">
            {(!recentClients || recentClients.length === 0) ? (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-text-muted">Inga klienter tillagda än</p>
                <Link href="/clients/invite" className="text-sm text-primary-darker hover:underline mt-2 inline-block">
                  Lägg till din första klient →
                </Link>
              </div>
            ) : (
              recentClients.map((client: any) => {
                const initials = `${client.profile?.first_name?.[0] || ""}${client.profile?.last_name?.[0] || ""}`.toUpperCase();
                return (
                  <Link key={client.id} href={`/clients/${client.id}`}>
                    <div className="px-6 py-3 flex items-center gap-3 hover:bg-surface-hover transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary-lighter flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary-darker">{initials}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {client.profile?.first_name} {client.profile?.last_name}
                        </p>
                        <p className="text-xs text-text-muted truncate">{client.profile?.email}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-text-muted ml-auto shrink-0" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 10) return "God morgon";
  if (hour < 18) return "Hej";
  return "God kväll";
}
