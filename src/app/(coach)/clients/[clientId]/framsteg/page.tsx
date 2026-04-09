import { createClient } from "@/lib/supabase/server";
import { getClient } from "@/actions/clients";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Scale, Ruler, Zap, Moon, Heart, TrendingUp, TrendingDown, Minus, Image as ImageIcon } from "lucide-react";
import { AvatarCircle } from "@/components/ui/avatar-circle";

export default async function ClientFramstegPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  let client: any;
  try { client = await getClient(clientId); } catch { notFound(); }

  const supabase = await createClient();
  const profile = client.profile;
  const initials = `${profile?.first_name?.[0] || ""}${profile?.last_name?.[0] || ""}`.toUpperCase();

  // Get all progress entries
  const { data: progressEntries } = await supabase
    .from("progress_entries")
    .select("*")
    .eq("client_id", clientId)
    .order("date", { ascending: false });

  // Get all check-ins
  const { data: checkIns } = await supabase
    .from("check_ins")
    .select("id, status, submitted_at, reviewed_at, coach_notes, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(20);

  // Get progress photos
  const { data: photos } = await supabase
    .from("progress_photos")
    .select("id, storage_path, photo_type, created_at, progress_entry_id")
    .eq("progress_entry_id", progressEntries?.[0]?.id || "00000000-0000-0000-0000-000000000000")
    .order("created_at", { ascending: false });

  const latest = progressEntries?.[0];
  const previous = progressEntries?.[1];
  const oldest = progressEntries?.[progressEntries.length - 1];

  const weightDiff = latest?.weight_kg && previous?.weight_kg
    ? (latest.weight_kg - previous.weight_kg).toFixed(1) : null;
  const totalWeightChange = latest?.weight_kg && oldest?.weight_kg && progressEntries!.length > 1
    ? (latest.weight_kg - oldest.weight_kg).toFixed(1) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href={`/clients/${clientId}`} className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Alla klienter
      </Link>

      {/* Client header */}
      <div className="flex items-center gap-5 mb-8">
        <AvatarCircle src={profile?.avatar_url} initials={initials} size="lg" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{profile?.first_name} {profile?.last_name}</h1>
          <div className="flex gap-6 mt-3 text-sm">
            <Link href={`/clients/${clientId}`} className="text-text-muted hover:text-text-primary pb-1">Översikt</Link>
            <Link href={`/clients/${clientId}/naring`} className="text-text-muted hover:text-text-primary pb-1">Näring</Link>
            <Link href={`/clients/${clientId}/traning`} className="text-text-muted hover:text-text-primary pb-1">Träning</Link>
            <span className="font-medium text-primary-darker border-b-2 border-primary-darker pb-1">Framsteg</span>
          </div>
        </div>
      </div>

      {/* Check-in section */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <span>🏁</span> Check-in
        </h2>

        {latest ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Latest check-in summary */}
            <div className="space-y-4">
              {/* Wellness ratings */}
              <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {latest.energy_level && (
                    <div className="bg-surface rounded-xl p-3 text-center">
                      <p className="text-xs text-text-muted">Energinivå</p>
                      <p className="text-2xl font-bold text-text-primary">{latest.energy_level}<span className="text-sm font-normal text-text-muted">/10</span></p>
                    </div>
                  )}
                  {latest.stress_level && (
                    <div className="bg-surface rounded-xl p-3 text-center">
                      <p className="text-xs text-text-muted">Stressnivå</p>
                      <p className="text-2xl font-bold text-text-primary">{latest.stress_level}<span className="text-sm font-normal text-text-muted">/10</span></p>
                    </div>
                  )}
                  {latest.sleep_hours_avg && (
                    <div className="bg-surface rounded-xl p-3 text-center">
                      <p className="text-xs text-text-muted">Sömn</p>
                      <p className="text-2xl font-bold text-text-primary">{latest.sleep_hours_avg}<span className="text-sm font-normal text-text-muted">h</span></p>
                    </div>
                  )}
                </div>
                {latest.notes && (
                  <div className="mt-4 pt-4 border-t border-border-light">
                    <p className="text-xs text-text-muted mb-1">Kommentar</p>
                    <p className="text-sm text-text-secondary">{latest.notes}</p>
                  </div>
                )}
                <p className="text-xs text-text-muted mt-3">
                  {new Date(latest.date).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>

              {/* Client goals */}
              {client.goals && (
                <div className="bg-primary-lighter/50 rounded-2xl border border-primary/10 p-5">
                  <p className="text-xs text-primary-darker font-medium mb-1">Klientens mål</p>
                  <p className="text-sm font-semibold text-primary-darker">{client.goals}</p>
                </div>
              )}
            </div>

            {/* Quick stats cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Weight */}
              <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-text-muted">Vikt</p>
                  <Scale className="w-4 h-4 text-text-muted" />
                </div>
                <p className="text-3xl font-bold text-text-primary">
                  {latest.weight_kg || "—"}<span className="text-sm font-normal text-text-muted ml-1">kg</span>
                </p>
                {client.target_weight_kg && (
                  <p className="text-xs text-text-muted mt-1">Mål: {client.target_weight_kg} kg</p>
                )}
              </div>

              {/* Weight change */}
              <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-text-muted">Sedan förra</p>
                  {weightDiff && Number(weightDiff) < 0 ? (
                    <TrendingDown className="w-4 h-4 text-success" />
                  ) : weightDiff && Number(weightDiff) > 0 ? (
                    <TrendingUp className="w-4 h-4 text-error" />
                  ) : (
                    <Minus className="w-4 h-4 text-text-muted" />
                  )}
                </div>
                <p className={`text-3xl font-bold ${
                  weightDiff && Number(weightDiff) < 0 ? "text-success" : weightDiff && Number(weightDiff) > 0 ? "text-error" : "text-text-primary"
                }`}>
                  {weightDiff ? `${Number(weightDiff) > 0 ? "+" : ""}${weightDiff}` : "—"}<span className="text-sm font-normal text-text-muted ml-1">kg</span>
                </p>
              </div>

              {/* Omkrets */}
              <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-text-muted">Midja</p>
                  <Ruler className="w-4 h-4 text-text-muted" />
                </div>
                <p className="text-3xl font-bold text-text-primary">
                  {latest.waist_cm || "—"}<span className="text-sm font-normal text-text-muted ml-1">cm</span>
                </p>
              </div>

              {/* Steps */}
              <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-text-muted">Steg (snitt)</p>
                  <Heart className="w-4 h-4 text-text-muted" />
                </div>
                <p className="text-3xl font-bold text-text-primary">
                  {latest.steps_avg ? latest.steps_avg.toLocaleString("sv-SE") : "—"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
            <p className="text-text-muted">Inga check-ins registrerade än</p>
          </div>
        )}
      </section>

      {/* Kroppsstatistik - Weight history */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <span>📊</span> Kroppsstatistik
        </h2>

        {progressEntries && progressEntries.length > 0 ? (
          <div className="space-y-4">
            {/* Weight card */}
            <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-text-primary">Vikt</p>
                  {totalWeightChange && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      Number(totalWeightChange) < 0 ? "bg-success/10 text-success" : "bg-error/10 text-error"
                    }`}>
                      {Number(totalWeightChange) > 0 ? "+" : ""}{totalWeightChange} kg sedan start
                    </span>
                  )}
                </div>
              </div>

              {/* Weight history table */}
              <div className="space-y-1.5">
                {progressEntries.slice(0, 12).map((entry: any, idx: number) => {
                  const prev = progressEntries[idx + 1];
                  const diff = prev?.weight_kg && entry.weight_kg ? (entry.weight_kg - prev.weight_kg).toFixed(1) : null;
                  return (
                    <div key={entry.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-surface-hover">
                      <span className="text-sm text-text-secondary w-28">
                        {new Date(entry.date).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}
                      </span>
                      <span className="text-sm font-semibold text-text-primary w-20 text-right">
                        {entry.weight_kg ? `${entry.weight_kg} kg` : "—"}
                      </span>
                      <span className={`text-xs w-16 text-right ${
                        diff && Number(diff) < 0 ? "text-success" : diff && Number(diff) > 0 ? "text-error" : "text-text-muted"
                      }`}>
                        {diff ? `${Number(diff) > 0 ? "+" : ""}${diff}` : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Body measurements */}
            {(latest?.waist_cm || latest?.chest_cm || latest?.hips_cm || latest?.arm_left_cm || latest?.thigh_left_cm) && (
              <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
                <p className="font-semibold text-text-primary mb-4">Omkrets</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Midja", value: latest.waist_cm, prev: previous?.waist_cm },
                    { label: "Bröst", value: latest.chest_cm, prev: previous?.chest_cm },
                    { label: "Höfter", value: latest.hips_cm, prev: previous?.hips_cm },
                    { label: "Arm (V)", value: latest.arm_left_cm, prev: previous?.arm_left_cm },
                    { label: "Arm (H)", value: latest.arm_right_cm, prev: previous?.arm_right_cm },
                    { label: "Lår (V)", value: latest.thigh_left_cm, prev: previous?.thigh_left_cm },
                    { label: "Lår (H)", value: latest.thigh_right_cm, prev: previous?.thigh_right_cm },
                  ].filter(m => m.value).map((m) => {
                    const diff = m.prev ? (m.value - m.prev).toFixed(1) : null;
                    return (
                      <div key={m.label} className="bg-surface rounded-xl p-3">
                        <p className="text-xs text-text-muted">{m.label}</p>
                        <p className="text-xl font-bold text-text-primary">{m.value} <span className="text-xs font-normal">cm</span></p>
                        {diff && (
                          <p className={`text-xs mt-0.5 ${Number(diff) < 0 ? "text-success" : Number(diff) > 0 ? "text-error" : "text-text-muted"}`}>
                            {Number(diff) > 0 ? "+" : ""}{diff} cm
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
            <p className="text-text-muted">Inga mätningar registrerade</p>
          </div>
        )}
      </section>

      {/* Check-in history */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <span>📋</span> Check-in historik
        </h2>

        {checkIns && checkIns.length > 0 ? (
          <div className="bg-white rounded-2xl border border-border shadow-sm divide-y divide-border-light">
            {checkIns.map((ci: any) => {
              const entry = progressEntries?.find((pe: any) => pe.check_in_id === ci.id);
              return (
                <div key={ci.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-text-primary">
                      {ci.submitted_at
                        ? new Date(ci.submitted_at).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" })
                        : new Date(ci.created_at).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      ci.status === "reviewed" ? "bg-success/10 text-success"
                        : ci.status === "submitted" ? "bg-warning/10 text-warning"
                        : "bg-surface text-text-muted"
                    }`}>
                      {ci.status === "reviewed" ? "Granskad" : ci.status === "submitted" ? "Inskickad" : "Väntande"}
                    </span>
                  </div>
                  {entry && (
                    <div className="flex gap-4 text-sm text-text-secondary">
                      {entry.weight_kg && <span>Vikt: {entry.weight_kg} kg</span>}
                      {entry.energy_level && <span>Energi: {entry.energy_level}/10</span>}
                      {entry.sleep_hours_avg && <span>Sömn: {entry.sleep_hours_avg}h</span>}
                    </div>
                  )}
                  {entry?.notes && (
                    <p className="text-sm text-text-muted mt-2 line-clamp-2">{entry.notes}</p>
                  )}
                  {ci.coach_notes && (
                    <div className="mt-2 bg-primary-lighter/30 rounded-lg px-3 py-2">
                      <p className="text-xs text-primary-darker font-medium">Coach-kommentar:</p>
                      <p className="text-sm text-primary-darker">{ci.coach_notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
            <p className="text-text-muted">Inga check-ins registrerade</p>
          </div>
        )}
      </section>

      {/* Framstegsbilder */}
      <section>
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <span>📸</span> Framstegsbilder
        </h2>
        <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
          <ImageIcon className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">Framstegsbilder visas här när klienten laddar upp via check-in</p>
          <p className="text-sm text-text-muted mt-1">Bilder laddas upp av klienten i deras portal</p>
        </div>
      </section>
    </div>
  );
}
