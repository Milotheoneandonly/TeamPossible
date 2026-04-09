import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ClipboardCheck, CheckCircle, Clock } from "lucide-react";

export default async function CoachCheckInsPage() {
  const supabase = await createClient();

  // Get submitted (pending review) check-ins
  const { data: submitted } = await supabase
    .from("check_ins")
    .select(`
      id, status, submitted_at, coach_notes,
      client:clients (
        id,
        profile:profiles!clients_profile_id_fkey (first_name, last_name)
      )
    `)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false });

  // Get recently reviewed check-ins
  const { data: reviewed } = await supabase
    .from("check_ins")
    .select(`
      id, status, submitted_at, reviewed_at, coach_notes,
      client:clients (
        id,
        profile:profiles!clients_profile_id_fkey (first_name, last_name)
      )
    `)
    .eq("status", "reviewed")
    .order("reviewed_at", { ascending: false })
    .limit(10);

  // Get progress entries for submitted check-ins
  const progressMap = new Map();
  if (submitted && submitted.length > 0) {
    for (const ci of submitted) {
      const { data: progress } = await supabase
        .from("progress_entries")
        .select("weight_kg, energy_level, notes")
        .eq("client_id", (ci.client as any)?.id)
        .order("date", { ascending: false })
        .limit(1)
        .single();
      if (progress) progressMap.set(ci.id, progress);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-8">Check-ins</h1>

      {/* Pending review */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-warning" />
          <h2 className="text-lg font-semibold text-text-primary">
            Att granska ({submitted?.length || 0})
          </h2>
        </div>

        {(!submitted || submitted.length === 0) ? (
          <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
            <ClipboardCheck className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">Inga check-ins att granska just nu</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submitted.map((ci: any) => {
              const progress = progressMap.get(ci.id);
              return (
                <Link key={ci.id} href={`/clients/${ci.client?.id}`}>
                  <div className="bg-white rounded-2xl border border-warning/30 p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-text-primary">
                        {ci.client?.profile?.first_name} {ci.client?.profile?.last_name}
                      </h3>
                      <span className="text-xs text-text-muted">
                        {ci.submitted_at
                          ? new Date(ci.submitted_at).toLocaleDateString("sv-SE", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </span>
                    </div>

                    {progress && (
                      <div className="flex gap-4 text-sm">
                        {progress.weight_kg && (
                          <span className="text-text-secondary">
                            Vikt: <strong>{progress.weight_kg} kg</strong>
                          </span>
                        )}
                        {progress.energy_level && (
                          <span className="text-text-secondary">
                            Energi: <strong>{progress.energy_level}/10</strong>
                          </span>
                        )}
                      </div>
                    )}
                    {progress?.notes && (
                      <p className="text-sm text-text-muted mt-2 line-clamp-2">{progress.notes}</p>
                    )}

                    <span className="inline-block mt-3 text-xs font-medium bg-warning/10 text-warning px-2.5 py-1 rounded-full">
                      Väntar på granskning
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recently reviewed */}
      {reviewed && reviewed.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-success" />
            <h2 className="text-lg font-semibold text-text-primary">Senast granskade</h2>
          </div>
          <div className="bg-white rounded-2xl border border-border shadow-sm divide-y divide-border-light">
            {reviewed.map((ci: any) => (
              <div key={ci.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {ci.client?.profile?.first_name} {ci.client?.profile?.last_name}
                  </p>
                  <p className="text-xs text-text-muted">
                    Granskad {ci.reviewed_at
                      ? new Date(ci.reviewed_at).toLocaleDateString("sv-SE", {
                          day: "numeric",
                          month: "short",
                        })
                      : "—"}
                  </p>
                </div>
                <span className="text-xs font-medium bg-success/10 text-success px-2.5 py-1 rounded-full">
                  Granskad
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
