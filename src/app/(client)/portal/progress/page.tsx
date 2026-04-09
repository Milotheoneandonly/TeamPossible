import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Scale, Ruler, Zap, Moon } from "lucide-react";

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  const { data: entries } = client
    ? await supabase
        .from("progress_entries")
        .select("*")
        .eq("client_id", client.id)
        .order("date", { ascending: false })
        .limit(20)
    : { data: [] };

  const latest = entries?.[0];
  const previous = entries?.[1];

  const weightDiff =
    latest?.weight_kg && previous?.weight_kg
      ? (latest.weight_kg - previous.weight_kg).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text-primary">Framsteg</h1>

      {!latest ? (
        <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
          <p className="text-text-muted">Inga framsteg registrerade än.</p>
          <p className="text-sm text-text-muted mt-2">
            Fyll i din första check-in för att börja spåra dina framsteg.
          </p>
        </div>
      ) : (
        <>
          {/* Weight card */}
          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-lighter flex items-center justify-center">
                <Scale className="w-5 h-5 text-primary-darker" />
              </div>
              <div>
                <p className="text-sm text-text-muted">Vikt</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-text-primary">
                    {latest.weight_kg} kg
                  </span>
                  {weightDiff && (
                    <span
                      className={`text-sm font-medium ${
                        Number(weightDiff) < 0 ? "text-success" : Number(weightDiff) > 0 ? "text-error" : "text-text-muted"
                      }`}
                    >
                      {Number(weightDiff) > 0 ? "+" : ""}
                      {weightDiff} kg
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Weight history */}
            {entries && entries.length > 1 && (
              <div className="space-y-2 mt-4 pt-4 border-t border-border-light">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Historik</p>
                {entries.slice(0, 8).map((entry: any) => (
                  <div key={entry.id} className="flex items-center justify-between py-1">
                    <span className="text-sm text-text-secondary">
                      {new Date(entry.date).toLocaleDateString("sv-SE", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span className="text-sm font-medium text-text-primary">
                      {entry.weight_kg} kg
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Measurements */}
          {(latest.waist_cm || latest.chest_cm || latest.hips_cm) && (
            <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Ruler className="w-5 h-5 text-accent" />
                </div>
                <p className="font-semibold text-text-primary">Mått</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {latest.waist_cm && (
                  <div className="bg-surface rounded-xl p-3">
                    <p className="text-xs text-text-muted">Midja</p>
                    <p className="text-lg font-semibold text-text-primary">{latest.waist_cm} cm</p>
                  </div>
                )}
                {latest.chest_cm && (
                  <div className="bg-surface rounded-xl p-3">
                    <p className="text-xs text-text-muted">Bröst</p>
                    <p className="text-lg font-semibold text-text-primary">{latest.chest_cm} cm</p>
                  </div>
                )}
                {latest.hips_cm && (
                  <div className="bg-surface rounded-xl p-3">
                    <p className="text-xs text-text-muted">Höfter</p>
                    <p className="text-lg font-semibold text-text-primary">{latest.hips_cm} cm</p>
                  </div>
                )}
                {latest.arm_left_cm && (
                  <div className="bg-surface rounded-xl p-3">
                    <p className="text-xs text-text-muted">Arm (V)</p>
                    <p className="text-lg font-semibold text-text-primary">{latest.arm_left_cm} cm</p>
                  </div>
                )}
                {latest.arm_right_cm && (
                  <div className="bg-surface rounded-xl p-3">
                    <p className="text-xs text-text-muted">Arm (H)</p>
                    <p className="text-lg font-semibold text-text-primary">{latest.arm_right_cm} cm</p>
                  </div>
                )}
                {latest.thigh_left_cm && (
                  <div className="bg-surface rounded-xl p-3">
                    <p className="text-xs text-text-muted">Lår (V)</p>
                    <p className="text-lg font-semibold text-text-primary">{latest.thigh_left_cm} cm</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Energy & sleep */}
          {(latest.energy_level || latest.sleep_hours_avg) && (
            <div className="grid grid-cols-2 gap-3">
              {latest.energy_level && (
                <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-warning" />
                    <span className="text-xs text-text-muted">Energi</span>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">
                    {latest.energy_level}/10
                  </p>
                </div>
              )}
              {latest.sleep_hours_avg && (
                <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Moon className="w-4 h-4 text-accent" />
                    <span className="text-xs text-text-muted">Sömn</span>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">
                    {latest.sleep_hours_avg}h
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
