import { createClient } from "@/lib/supabase/server";
import { getClient } from "@/actions/clients";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Scale, Ruler, Moon, Heart, TrendingUp, TrendingDown, Minus, Image as ImageIcon, ChevronDown } from "lucide-react";
import { AvatarCircle } from "@/components/ui/avatar-circle";

const QUESTION_LABELS: Record<string, string> = {
  training: "Träning",
  nutrition: "Kost",
  motivation: "Motivation & mental",
  hydration_steps: "Vätska & steg",
  injury: "Skador / hälsa",
  menstruation: "Menstruationscykel",
  wins: "Veckans framgångar",
  improvement: "Fokus nästa vecka",
  questions: "Frågor / önskemål",
};

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

  // Get all progress photos for this client (across all entries)
  const entryIds = (progressEntries || []).map((e: any) => e.id);
  const { data: photoRows } = entryIds.length > 0
    ? await supabase
        .from("progress_photos")
        .select("id, storage_path, photo_type, created_at, progress_entry_id")
        .in("progress_entry_id", entryIds)
        .order("created_at", { ascending: false })
    : { data: [] as any[] };

  // Generate signed URLs for all photos (private bucket)
  let signedPhotos: Array<{
    id: string;
    url: string;
    photo_type: string;
    progress_entry_id: string;
    created_at: string;
  }> = [];
  if (photoRows && photoRows.length > 0) {
    const paths = photoRows.map((p: any) => p.storage_path);
    const { data: signed } = await supabase.storage
      .from("progress-photos")
      .createSignedUrls(paths, 60 * 60); // 1 hour
    if (signed) {
      signedPhotos = photoRows
        .map((p: any, i: number) => ({
          id: p.id,
          url: signed[i]?.signedUrl || "",
          photo_type: p.photo_type,
          progress_entry_id: p.progress_entry_id,
          created_at: p.created_at,
        }))
        .filter((p) => p.url);
    }
  }

  // Group photos by entry (so we show one row per check-in)
  const photosByEntry: Record<string, typeof signedPhotos> = {};
  for (const p of signedPhotos) {
    if (!photosByEntry[p.progress_entry_id]) photosByEntry[p.progress_entry_id] = [];
    photosByEntry[p.progress_entry_id].push(p);
  }

  const latest = progressEntries?.[0];
  const previous = progressEntries?.[1];
  const oldest = progressEntries?.[progressEntries.length - 1];

  const weightDiff = latest?.weight_kg && previous?.weight_kg
    ? (latest.weight_kg - previous.weight_kg).toFixed(1) : null;
  const totalWeightChange = latest?.weight_kg && oldest?.weight_kg && progressEntries!.length > 1
    ? (latest.weight_kg - oldest.weight_kg).toFixed(1) : null;

  const photoTypeOrder: Record<string, number> = { front: 0, side: 1, back: 2, other: 3 };
  const photoTypeLabel: Record<string, string> = { front: "Framsida", side: "Sida", back: "Baksida", other: "Extra" };

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
                <p className="text-xs text-text-muted mt-3">
                  {new Date(latest.date).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>

              {client.goals && (
                <div className="bg-primary-lighter/50 rounded-2xl border border-primary/10 p-5">
                  <p className="text-xs text-primary-darker font-medium mb-1">Klientens mål</p>
                  <p className="text-sm font-semibold text-primary-darker">{client.goals}</p>
                </div>
              )}
            </div>

            {/* Quick stats cards */}
            <div className="grid grid-cols-2 gap-3">
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

              <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-text-muted">Midja</p>
                  <Ruler className="w-4 h-4 text-text-muted" />
                </div>
                <p className="text-3xl font-bold text-text-primary">
                  {latest.waist_cm || "—"}<span className="text-sm font-normal text-text-muted ml-1">cm</span>
                </p>
              </div>

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

      {/* Kroppsstatistik */}
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

            {/* Body measurements — new order matching client form */}
            {(latest?.chest_cm || latest?.waist_cm || latest?.thigh_left_cm || latest?.thigh_right_cm ||
              latest?.arm_left_cm || latest?.arm_right_cm || latest?.height_cm || latest?.glutes_cm) && (
              <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
                <p className="font-semibold text-text-primary mb-4">Omkrets</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Bröst", value: latest.chest_cm, prev: previous?.chest_cm },
                    { label: "Midja", value: latest.waist_cm, prev: previous?.waist_cm },
                    { label: "Stuss", value: latest.glutes_cm, prev: previous?.glutes_cm },
                    { label: "Höger Lår", value: latest.thigh_right_cm, prev: previous?.thigh_right_cm },
                    { label: "Vänster Lår", value: latest.thigh_left_cm, prev: previous?.thigh_left_cm },
                    { label: "Höger Arm", value: latest.arm_right_cm, prev: previous?.arm_right_cm },
                    { label: "Vänster Arm", value: latest.arm_left_cm, prev: previous?.arm_left_cm },
                    { label: "Längd", value: latest.height_cm, prev: previous?.height_cm },
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

      {/* Check-in historik with expandable answers */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <span>📋</span> Check-in historik
        </h2>

        {checkIns && checkIns.length > 0 ? (
          <div className="bg-white rounded-2xl border border-border shadow-sm divide-y divide-border-light">
            {checkIns.map((ci: any) => {
              let entry = progressEntries?.find((pe: any) => pe.check_in_id === ci.id);
              if (!entry) {
                const ciDate = ci.submitted_at || ci.created_at;
                if (ciDate) {
                  const ciTime = new Date(ciDate).getTime();
                  entry = progressEntries?.find((pe: any) => {
                    const peTime = new Date(pe.date || pe.created_at).getTime();
                    return Math.abs(ciTime - peTime) < 24 * 60 * 60 * 1000;
                  });
                }
              }
              const answers = entry?.check_in_answers as Record<string, string> | null;
              const hasAnswers = answers && Object.keys(answers).length > 0;
              const entryPhotos = entry?.id ? (photosByEntry[entry.id] || []) : [];

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
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary">
                      {entry.weight_kg && <span>Vikt: <strong>{entry.weight_kg} kg</strong></span>}
                      {entry.energy_level && <span>Energi: <strong>{entry.energy_level}/10</strong></span>}
                      {entry.stress_level && <span>Stress: <strong>{entry.stress_level}/10</strong></span>}
                      {entry.sleep_hours_avg && <span>Sömn: <strong>{entry.sleep_hours_avg}h</strong></span>}
                      {entry.steps_avg && <span>Steg: <strong>{entry.steps_avg.toLocaleString("sv-SE")}</strong></span>}
                      {entry.waist_cm && <span>Midja: <strong>{entry.waist_cm} cm</strong></span>}
                    </div>
                  )}

                  {entryPhotos.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {entryPhotos
                        .slice()
                        .sort((a, b) => (photoTypeOrder[a.photo_type] ?? 99) - (photoTypeOrder[b.photo_type] ?? 99))
                        .slice(0, 6)
                        .map((p) => (
                          <a
                            key={p.id}
                            href={p.url}
                            target="_blank"
                            rel="noreferrer"
                            className="relative w-16 h-20 rounded-lg overflow-hidden border border-border-light hover:ring-2 hover:ring-primary/40 transition"
                            title={photoTypeLabel[p.photo_type] || p.photo_type}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.url} alt={p.photo_type} className="w-full h-full object-cover" />
                          </a>
                        ))}
                      {entryPhotos.length > 6 && (
                        <div className="w-16 h-20 rounded-lg border border-border-light bg-surface flex items-center justify-center text-xs font-medium text-text-secondary">
                          +{entryPhotos.length - 6}
                        </div>
                      )}
                    </div>
                  )}

                  {hasAnswers && (
                    <details className="group mt-3">
                      <summary className="flex items-center gap-1 text-xs font-medium text-primary-darker cursor-pointer hover:underline list-none">
                        <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
                        Visa veckans reflektion ({Object.keys(answers!).length} svar)
                      </summary>
                      <div className="mt-3 space-y-3 bg-surface rounded-xl p-4">
                        {Object.entries(answers!).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-xs font-semibold text-text-primary mb-1">{QUESTION_LABELS[key] || key}</p>
                            <p className="text-sm text-text-secondary whitespace-pre-wrap">{value}</p>
                          </div>
                        ))}
                      </div>
                    </details>
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

      {/* Framstegsbilder — full gallery grouped by entry */}
      <section>
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <span>📸</span> Framstegsbilder
        </h2>

        {signedPhotos.length > 0 ? (
          <div className="space-y-4">
            {progressEntries
              ?.filter((e: any) => (photosByEntry[e.id] || []).length > 0)
              .map((entry: any) => {
                const entryPhotos = (photosByEntry[entry.id] || [])
                  .slice()
                  .sort((a, b) => (photoTypeOrder[a.photo_type] ?? 99) - (photoTypeOrder[b.photo_type] ?? 99));
                return (
                  <div key={entry.id} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
                    <p className="text-sm font-medium text-text-primary mb-3">
                      {new Date(entry.date).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                      {entryPhotos.map((p) => (
                        <a
                          key={p.id}
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-border-light hover:ring-2 hover:ring-primary/40 transition"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.url} alt={p.photo_type} className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
                            <p className="text-[10px] font-semibold text-white uppercase tracking-wide">
                              {photoTypeLabel[p.photo_type] || "Extra"}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
            <ImageIcon className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">Framstegsbilder visas här när klienten laddar upp via check-in</p>
            <p className="text-sm text-text-muted mt-1">Bilder laddas upp av klienten i deras portal</p>
          </div>
        )}
      </section>
    </div>
  );
}
