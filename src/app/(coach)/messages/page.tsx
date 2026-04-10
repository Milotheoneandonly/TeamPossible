"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { Send, Loader2, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CoachMessagesPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [userId, setUserId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadClients() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: clientList } = await supabase
      .from("clients")
      .select(`
        id, status,
        profile:profiles!clients_profile_id_fkey (id, first_name, last_name, email, avatar_url)
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    // Get unread counts + latest message for each client
    const enriched = await Promise.all(
      (clientList || []).map(async (client: any) => {
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("client_id", client.id)
          .eq("is_read", false)
          .neq("sender_id", user.id);

        const { data: latest } = await supabase
          .from("messages")
          .select("content, created_at, sender_id")
          .eq("client_id", client.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        return { ...client, unreadCount: count || 0, latestMessage: latest };
      })
    );

    // Sort: unread first, then by latest
    enriched.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      return (b.latestMessage?.created_at || "").localeCompare(a.latestMessage?.created_at || "");
    });

    setClients(enriched);
    setLoading(false);
  }

  async function selectClient(clientId: string) {
    setActiveClientId(clientId);
    setLoadingMessages(true);

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true });

    setMessages(data || []);

    // Mark unread as read
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("client_id", clientId)
      .neq("sender_id", userId)
      .eq("is_read", false);

    // Update unread count in client list
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, unreadCount: 0 } : c))
    );

    setLoadingMessages(false);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !activeClientId) return;

    setSending(true);
    const { data } = await supabase
      .from("messages")
      .insert({
        client_id: activeClientId,
        sender_id: userId,
        content: newMessage.trim(),
      })
      .select()
      .single();

    if (data) {
      setMessages((prev) => [...prev, data]);
      setNewMessage("");

      // Update latest message in client list
      setClients((prev) =>
        prev.map((c) =>
          c.id === activeClientId
            ? { ...c, latestMessage: { content: data.content, created_at: data.created_at, sender_id: data.sender_id } }
            : c
        )
      );
    }
    setSending(false);
  }

  const activeClient = clients.find((c) => c.id === activeClientId);

  const filteredClients = clients.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = `${c.profile?.first_name || ""} ${c.profile?.last_name || ""}`.toLowerCase();
    return name.includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] lg:h-screen flex">
      {/* Left: Client list */}
      <div className="w-80 bg-white border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-bold text-text-primary mb-3">Meddelanden</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sök klient..."
              className="w-full rounded-lg border border-border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredClients.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-muted">Inga klienter</p>
            </div>
          ) : (
            filteredClients.map((client: any) => {
              const initials = `${client.profile?.first_name?.[0] || ""}${client.profile?.last_name?.[0] || ""}`.toUpperCase();
              const isActive = client.id === activeClientId;
              const hasUnread = client.unreadCount > 0;

              return (
                <button
                  key={client.id}
                  onClick={() => selectClient(client.id)}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors border-b border-border-light ${
                    isActive ? "bg-primary-lighter/50" : hasUnread ? "bg-primary-lighter/20" : "hover:bg-surface-hover"
                  }`}
                >
                  <div className="relative shrink-0">
                    <AvatarCircle src={client.profile?.avatar_url} initials={initials} size="md" />
                    {hasUnread && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {client.unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${hasUnread ? "font-bold" : "font-medium"} text-text-primary`}>
                        {client.profile?.first_name} {client.profile?.last_name}
                      </p>
                      {client.latestMessage?.created_at && (
                        <span className="text-[10px] text-text-muted shrink-0 ml-2">
                          {new Date(client.latestMessage.created_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${hasUnread ? "text-text-primary" : "text-text-muted"}`}>
                      {client.latestMessage?.content || "Inga meddelanden än"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Conversation */}
      <div className="flex-1 flex flex-col bg-surface">
        {!activeClientId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-text-primary">Välj en klient</h3>
              <p className="text-sm text-text-muted mt-1">Klicka på en klient till vänster för att chatta</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="bg-white border-b border-border px-6 py-3 flex items-center gap-3 shrink-0">
              <AvatarCircle
                src={activeClient?.profile?.avatar_url}
                initials={`${activeClient?.profile?.first_name?.[0] || ""}${activeClient?.profile?.last_name?.[0] || ""}`.toUpperCase()}
                size="sm"
              />
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {activeClient?.profile?.first_name} {activeClient?.profile?.last_name}
                </p>
                <p className="text-xs text-text-muted">{activeClient?.profile?.email}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-text-muted">
                    Inga meddelanden med {activeClient?.profile?.first_name} än. Skriv nedan.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isCoach = msg.sender_id === userId;
                  return (
                    <div key={msg.id} className={`flex ${isCoach ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                          isCoach
                            ? "bg-primary text-white rounded-br-md"
                            : "bg-white border border-border text-text-primary rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isCoach ? "text-white/60" : "text-text-muted"}`}>
                          {new Date(msg.created_at).toLocaleString("sv-SE", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-border px-6 py-3 shrink-0">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Skriv ett meddelande..."
                  className="flex-1 rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
                <Button type="submit" disabled={sending || !newMessage.trim()} className="shrink-0">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
