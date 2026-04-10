"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Target, Plus, Search, Pencil, Trash2, Loader2, X } from "lucide-react";

const STATUS_LABELS: Record<string, string> = { ny: "Ny", kontaktad: "Kontaktad", vunnen: "Vunnen" };
const STATUS_COLORS: Record<string, string> = {
  ny: "bg-blue-100 text-blue-700",
  kontaktad: "bg-orange-100 text-orange-700",
  vunnen: "bg-green-100 text-green-700",
};
const TABS = [
  { key: "alla", label: "Alla" },
  { key: "ny", label: "Ny" },
  { key: "kontaktad", label: "Kontaktad" },
  { key: "vunnen", label: "Vunnen" },
];

function relativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMins < 1) return "just nu";
  if (diffMins < 60) return `${diffMins} minuter sedan`;
  if (diffHours < 24) return `${diffHours} timmar sedan`;
  if (diffDays === 1) return "igår";
  if (diffDays < 7) return `${diffDays} dagar sedan`;
  if (diffWeeks < 5) return `${diffWeeks} ${diffWeeks === 1 ? "vecka" : "veckor"} sedan`;
  if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? "månad" : "månader"} sedan`;
  return date.toLocaleDateString("sv-SE");
}

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  status: string;
  tags: string[];
  notes: string;
  created_at: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("alla");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState("");

  // Form state
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCountry, setFormCountry] = useState("Sverige");
  const [formNotes, setFormNotes] = useState("");
  const [formStatus, setFormStatus] = useState("ny");

  const supabase = createClient();

  useEffect(() => { loadLeads(); }, []);

  async function loadLeads() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("coach_id", user.id)
      .order("created_at", { ascending: false });

    setLeads((data as Lead[]) || []);
    setLoading(false);
  }

  function openCreateModal() {
    setEditingLead(null);
    setFormFirstName(""); setFormLastName(""); setFormEmail("");
    setFormPhone(""); setFormCountry("Sverige"); setFormNotes(""); setFormStatus("ny");
    setShowModal(true);
  }

  function openEditModal(lead: Lead) {
    setEditingLead(lead);
    setFormFirstName(lead.first_name); setFormLastName(lead.last_name);
    setFormEmail(lead.email || ""); setFormPhone(lead.phone || "");
    setFormCountry(lead.country || "Sverige"); setFormNotes(lead.notes || "");
    setFormStatus(lead.status);
    setShowModal(true);
  }

  async function handleSave() {
    if (!formFirstName.trim() || !formLastName.trim()) return;
    setSaving(true);

    if (editingLead) {
      await supabase.from("leads").update({
        first_name: formFirstName, last_name: formLastName,
        email: formEmail || null, phone: formPhone || null,
        country: formCountry, notes: formNotes || null, status: formStatus,
        updated_at: new Date().toISOString(),
      }).eq("id", editingLead.id);
    } else {
      await supabase.from("leads").insert({
        coach_id: userId,
        first_name: formFirstName, last_name: formLastName,
        email: formEmail || null, phone: formPhone || null,
        country: formCountry, notes: formNotes || null, status: formStatus,
      });
    }

    setSaving(false);
    setShowModal(false);
    loadLeads();
  }

  async function deleteLead(id: string) {
    if (!confirm("Är du säker att du vill ta bort detta lead?")) return;
    await supabase.from("leads").delete().eq("id", id);
    loadLeads();
  }

  // Filter & search
  const filtered = leads.filter((l) => {
    if (activeTab !== "alla" && l.status !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = `${l.first_name} ${l.last_name}`.toLowerCase();
      const phone = (l.phone || "").toLowerCase();
      const email = (l.email || "").toLowerCase();
      return name.includes(q) || phone.includes(q) || email.includes(q);
    }
    return true;
  });

  // Tab counts
  const counts: Record<string, number> = {
    alla: leads.length,
    ny: leads.filter((l) => l.status === "ny").length,
    kontaktad: leads.filter((l) => l.status === "kontaktad").length,
    vunnen: leads.filter((l) => l.status === "vunnen").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-2">Leads</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`text-sm font-medium pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === tab.key
                ? "text-primary-darker border-primary-darker"
                : "text-text-muted border-transparent hover:text-text-primary"
            }`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === tab.key ? "bg-primary text-white" : "bg-surface text-text-muted"
              }`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-secondary">
          Visar <span className="font-semibold text-text-primary">{filtered.length}</span> leads
        </p>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sök"
              className="w-40 rounded-lg border border-border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4" /> Lägg till lead
          </Button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-sm">
          <Target className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary">Inga leads</h3>
          <p className="text-text-secondary mt-2">
            {activeTab !== "alla" ? `Inga leads med status "${STATUS_LABELS[activeTab]}"` : "Lägg till ditt första lead för att komma igång"}
          </p>
          {activeTab === "alla" && (
            <Button className="mt-4" onClick={openCreateModal}><Plus className="w-4 h-4" /> Lägg till lead</Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm">
          {/* Header */}
          <div className="px-5 py-3 border-b border-border grid grid-cols-[1fr_150px_120px_150px_80px] gap-4 text-xs font-semibold text-text-muted uppercase tracking-wide">
            <span>Namn</span>
            <span>Telefon</span>
            <span>Status</span>
            <span>Skapad den</span>
            <span></span>
          </div>
          {/* Rows */}
          <div className="divide-y divide-border-light">
            {filtered.map((lead) => (
              <div key={lead.id} className="px-5 py-3 grid grid-cols-[1fr_150px_120px_150px_80px] gap-4 items-center hover:bg-surface-hover transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {lead.first_name} {lead.last_name}
                  </p>
                  {lead.tags?.includes("COMP") && (
                    <span className="text-[10px] font-bold bg-accent text-white px-1.5 py-0.5 rounded shrink-0">COMP</span>
                  )}
                </div>
                <p className="text-sm text-text-secondary truncate">{lead.phone || "—"}</p>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${STATUS_COLORS[lead.status]}`}>
                  {STATUS_LABELS[lead.status]}
                </span>
                <p className="text-sm text-text-muted">{relativeTime(lead.created_at)}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditModal(lead)} className="text-text-muted hover:text-text-primary p-1.5 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteLead(lead.id)} className="text-text-muted hover:text-error p-1.5 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* Create/Edit Modal */}
    {showModal && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-text-primary">
              {editingLead ? "Redigera lead" : "Skapa ett nytt lead"}
            </h2>
            <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text-primary">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted block mb-1">Förnamn <span className="text-error">*</span></label>
                <input value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs text-text-muted block mb-1">Efternamn <span className="text-error">*</span></label>
                <input value={formLastName} onChange={(e) => setFormLastName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>

            <div>
              <label className="text-xs text-text-muted block mb-1">Land</label>
              <input value={formCountry} onChange={(e) => setFormCountry(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>

            <div>
              <label className="text-xs text-text-muted block mb-1">E-post</label>
              <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>

            <div>
              <label className="text-xs text-text-muted block mb-1">Telefon</label>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 bg-surface border border-border rounded-xl px-3 py-3 text-sm text-text-secondary shrink-0">
                  <span>🇸🇪</span><span>+46</span>
                </div>
                <input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="70 123 45 67"
                  className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>

            {editingLead && (
              <div>
                <label className="text-xs text-text-muted block mb-1">Status</label>
                <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="ny">Ny</option>
                  <option value="kontaktad">Kontaktad</option>
                  <option value="vunnen">Vunnen</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-xs text-text-muted block mb-1">Intern anteckning</label>
              <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Avbryt</Button>
            <Button onClick={handleSave} disabled={saving || !formFirstName.trim() || !formLastName.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingLead ? "Uppdatera lead" : "Lägg till lead"}
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
