"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  is_read: boolean;
  created_at: string;
}

export default function ClientMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");

  const supabase = createClient();

  useEffect(() => {
    async function loadMessages() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (!client) {
        setLoading(false);
        return;
      }
      setClientId(client.id);

      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("client_id", client.id)
        .order("created_at", { ascending: true });

      setMessages(data || []);

      // Mark unread messages as read
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("client_id", client.id)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      setLoading(false);
    }

    loadMessages();
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !clientId) return;

    setSending(true);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        client_id: clientId,
        sender_id: userId,
        content: newMessage.trim(),
      })
      .select()
      .single();

    if (data) {
      setMessages((prev) => [...prev, data]);
      setNewMessage("");
    }

    setSending(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <h1 className="text-xl font-bold text-text-primary mb-4">Meddelanden</h1>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-muted text-sm">
              Inga meddelanden än. Skriv till din coach nedan.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === userId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    isMe
                      ? "bg-primary text-white rounded-br-md"
                      : "bg-white border border-border text-text-primary rounded-bl-md"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      isMe ? "text-white/60" : "text-text-muted"
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleString("sv-SE", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Skriv ett meddelande..."
          className="flex-1 rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
        <Button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="shrink-0"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
