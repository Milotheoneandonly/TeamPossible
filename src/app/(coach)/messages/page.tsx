import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

export default async function CoachMessagesPage() {
  const supabase = await createClient();

  // Get all clients with their latest message and unread count
  const { data: clients } = await supabase
    .from("clients")
    .select(`
      id, status,
      profile:profiles!clients_profile_id_fkey (first_name, last_name, email)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // Get unread counts and latest messages per client
  const clientMessages = await Promise.all(
    (clients || []).map(async (client: any) => {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("client_id", client.id)
        .eq("is_read", false)
        .neq("sender_id", (await supabase.auth.getUser()).data.user?.id || "");

      const { data: latest } = await supabase
        .from("messages")
        .select("content, created_at, sender_id")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      return {
        ...client,
        unreadCount: count || 0,
        latestMessage: latest,
      };
    })
  );

  // Sort: unread first, then by latest message
  const sorted = clientMessages.sort((a, b) => {
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
    const aTime = a.latestMessage?.created_at || "";
    const bTime = b.latestMessage?.created_at || "";
    return bTime.localeCompare(aTime);
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Meddelanden</h1>

      {sorted.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-sm">
          <MessageSquare className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary">Inga meddelanden</h3>
          <p className="text-text-secondary mt-2">
            Meddelanden från dina klienter visas här.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm divide-y divide-border-light">
          {sorted.map((client: any) => {
            const initials = `${client.profile?.first_name?.[0] || ""}${client.profile?.last_name?.[0] || ""}`.toUpperCase();
            const hasUnread = client.unreadCount > 0;

            return (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <div className={`px-5 py-4 flex items-center gap-4 hover:bg-surface-hover transition-colors ${hasUnread ? "bg-primary-lighter/30" : ""}`}>
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full bg-primary-lighter flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary-darker">{initials}</span>
                    </div>
                    {hasUnread && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {client.unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${hasUnread ? "font-bold text-text-primary" : "font-medium text-text-primary"}`}>
                        {client.profile?.first_name} {client.profile?.last_name}
                      </p>
                      {client.latestMessage?.created_at && (
                        <span className="text-xs text-text-muted shrink-0 ml-2">
                          {new Date(client.latestMessage.created_at).toLocaleDateString("sv-SE", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      )}
                    </div>
                    {client.latestMessage ? (
                      <p className={`text-sm truncate mt-0.5 ${hasUnread ? "text-text-primary" : "text-text-muted"}`}>
                        {client.latestMessage.content}
                      </p>
                    ) : (
                      <p className="text-sm text-text-muted mt-0.5">Inga meddelanden än</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
