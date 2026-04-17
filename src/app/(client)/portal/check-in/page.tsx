"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2, Sparkles, Camera, Plus, X } from "lucide-react";

const QUESTIONS: { key: string; label: string }[] = [
  {
    key: "training",
    label:
      "Hur har din prestation varit under träningspassen? Har du stött på några utmaningar eller svårigheter? Har du kunnat följa träningsplanen som planerat?",
  },
  {
    key: "nutrition",
    label:
      "Har du hållit dig till din kostplan? Har du upplevt några cravings eller gjort avsteg från planen? Hur har din energi- och hungernivå varit under dagarna och veckan?",
  },
  {
    key: "motivation",
    label:
      "Hur har din motivation varit den här veckan? Har du upplevt stress eller mentala utmaningar? Hur har du hanterat dem?",
  },
  {
    key: "hydration_steps",
    label:
      "Har du druckit tillräckligt med vatten under dagarna? Hur många steg har du i genomsnitt tagit per dag?",
  },
  {
    key: "injury",
    label: "Har du upplevt några skador, smärtor eller andra hälsoproblem?",
  },
  {
    key: "menstruation",
    label:
      "Om du har en menstruationscykel – var befinner du dig i den just nu? Vilken dag började din senaste menstruation?",
  },
  {
    key: "wins",
    label:
      "Nämn tre saker du gjort bra eller är nöjd med denna vecka – det kan vara inom kost, träning, jobb eller mentalt.",
  },
  {
    key: "improvement",
    label:
      "Vad vill du förbättra eller fokusera mer på nästa vecka? Det kan vara inom kost, träning, jobb eller mentalt.",
  },
  {
    key: "questions",
    label:
      "Har du några frågor eller funderingar? Finns det något specifikt du vill att vi lägger extra fokus på framöver?",
  },
];

type PhotoSlot = { type: "front" | "back" | "side" | "other"; label: string; file: File | null; previewUrl: string | null };

export default function CheckInPage() {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [waist, setWaist] = useState("");
  const [chest, setChest] = useState("");
  const [glutes, setGlutes] = useState("");
  const [armLeft, setArmLeft] = useState("");
  const [armRight, setArmRight] = useState("");
  const [thighLeft, setThighLeft] = useState("");
  const [thighRight, setThighRight] = useState("");
  const [energy, setEnergy] = useState("7");
  const [sleep, setSleep] = useState("");
  const [steps, setSteps] = useState("");
  const [stress, setStress] = useState("5");
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(QUESTIONS.map((q) => [q.key, ""]))
  );
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(false);
  const [prefilling, setPrefilling] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  // Photo slots
  const [photoFront, setPhotoFront] = useState<PhotoSlot>({ type: "front", label: "Framsida", file: null, previewUrl: null });
  const [photoBack, setPhotoBack] = useState<PhotoSlot>({ type: "back", label: "Baksida", file: null, previewUrl: null });
  const [photoSide, setPhotoSide] = useState<PhotoSlot>({ type: "side", label: "Sida", file: null, previewUrl: null });
  const [extraPhotos, setExtraPhotos] = useState<PhotoSlot[]>([]);

  const router = useRouter();
  const supabase = createClient();

  // Preload previous values so clients don't have to re-enter unchanged data
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setPrefilling(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", user.id)
        .single();
      if (profile?.first_name) setFirstName(profile.first_name);

      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("profile_id", user.id)
        .single();
      if (!client) { setPrefilling(false); return; }

      const { data: last } = await supabase
        .from("progress_entries")
        .select("weight_kg, height_cm, waist_cm, chest_cm, glutes_cm, arm_left_cm, arm_right_cm, thigh_left_cm, thigh_right_cm, steps_avg, sleep_hours_avg")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (last) {
        if (last.weight_kg != null) setWeight(String(last.weight_kg));
        if (last.height_cm != null) setHeight(String(last.height_cm));
        if (last.waist_cm != null) setWaist(String(last.waist_cm));
        if (last.chest_cm != null) setChest(String(last.chest_cm));
        if (last.glutes_cm != null) setGlutes(String(last.glutes_cm));
        if (last.arm_left_cm != null) setArmLeft(String(last.arm_left_cm));
        if (last.arm_right_cm != null) setArmRight(String(last.arm_right_cm));
        if (last.thigh_left_cm != null) setThighLeft(String(last.thigh_left_cm));
        if (last.thigh_right_cm != null) setThighRight(String(last.thigh_right_cm));
        if (last.steps_avg != null) setSteps(String(last.steps_avg));
        if (last.sleep_hours_avg != null) setSleep(String(last.sleep_hours_avg));
      }
      setPrefilling(false);
    })();
  }, []);

  // Cleanup preview object URLs on unmount
  useEffect(() => {
    return () => {
      [photoFront, photoBack, photoSide, ...extraPhotos].forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-redirect to dashboard after success celebration
  useEffect(() => {
    if (!submitted) return;
    const t = setTimeout(() => router.push("/portal"), 3500);
    return () => clearTimeout(t);
  }, [submitted, router]);

  function handlePhotoPick(slot: PhotoSlot, file: File | null, setSlot: (p: PhotoSlot) => void) {
    if (slot.previewUrl) URL.revokeObjectURL(slot.previewUrl);
    if (!file) { setSlot({ ...slot, file: null, previewUrl: null }); return; }
    setSlot({ ...slot, file, previewUrl: URL.createObjectURL(file) });
  }

  function handleExtraPick(index: number, file: File | null) {
    setExtraPhotos((prev) => {
      const next = [...prev];
      const slot = next[index];
      if (slot.previewUrl) URL.revokeObjectURL(slot.previewUrl);
      if (!file) { next[index] = { ...slot, file: null, previewUrl: null }; return next; }
      next[index] = { ...slot, file, previewUrl: URL.createObjectURL(file) };
      return next;
    });
  }

  function addExtraSlot() {
    setExtraPhotos((prev) => [...prev, { type: "other", label: `Extra ${prev.length + 1}`, file: null, previewUrl: null }]);
  }

  function removeExtraSlot(index: number) {
    setExtraPhotos((prev) => {
      const next = [...prev];
      const slot = next[index];
      if (slot.previewUrl) URL.revokeObjectURL(slot.previewUrl);
      next.splice(index, 1);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("profile_id", user.id)
      .single();
    if (!client) { setLoading(false); return; }

    // 1. Find or create a check-in record
    let checkInId: string | null = null;
    const { data: pendingCheckIn } = await supabase
      .from("check_ins")
      .select("id")
      .eq("client_id", client.id)
      .eq("status", "pending")
      .limit(1)
      .single();

    if (pendingCheckIn) {
      checkInId = pendingCheckIn.id;
    } else {
      const { data: newCheckIn } = await supabase
        .from("check_ins")
        .insert({ client_id: client.id, status: "pending" })
        .select("id")
        .single();
      if (newCheckIn) checkInId = newCheckIn.id;
    }

    // 2. Create progress entry (select back the id so we can link photos)
    const answersClean = Object.fromEntries(
      Object.entries(answers).filter(([, v]) => v.trim().length > 0)
    );

    const { data: entry, error } = await supabase
      .from("progress_entries")
      .insert({
        client_id: client.id,
        check_in_id: checkInId,
        weight_kg: weight ? parseFloat(weight) : null,
        height_cm: height ? parseFloat(height) : null,
        waist_cm: waist ? parseFloat(waist) : null,
        chest_cm: chest ? parseFloat(chest) : null,
        glutes_cm: glutes ? parseFloat(glutes) : null,
        arm_left_cm: armLeft ? parseFloat(armLeft) : null,
        arm_right_cm: armRight ? parseFloat(armRight) : null,
        thigh_left_cm: thighLeft ? parseFloat(thighLeft) : null,
        thigh_right_cm: thighRight ? parseFloat(thighRight) : null,
        steps_avg: steps ? parseInt(steps) : null,
        energy_level: energy ? parseInt(energy) : null,
        sleep_hours_avg: sleep ? parseFloat(sleep) : null,
        stress_level: stress ? parseInt(stress) : null,
        check_in_answers: Object.keys(answersClean).length > 0 ? answersClean : null,
      })
      .select("id")
      .single();

    // 3. Upload photos if any + create progress_photos rows
    if (!error && entry?.id) {
      const allPhotos: PhotoSlot[] = [
        photoFront,
        photoBack,
        photoSide,
        ...extraPhotos,
      ].filter((p) => p.file);

      for (const slot of allPhotos) {
        if (!slot.file) continue;
        const ext = (slot.file.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${client.id}/${entry.id}/${slot.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("progress-photos")
          .upload(path, slot.file, { upsert: false, contentType: slot.file.type });
        if (!uploadErr) {
          await supabase.from("progress_photos").insert({
            progress_entry_id: entry.id,
            storage_path: path,
            photo_type: slot.type,
          });
        }
      }
    }

    // 4. Mark the check-in as submitted
    if (checkInId) {
      await supabase
        .from("check_ins")
        .update({ status: "submitted", submitted_at: new Date().toISOString() })
        .eq("id", checkInId);
    }

    setLoading(false);
    if (!error) setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
            <CheckCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
          </div>
          <Sparkles className="w-6 h-6 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
          <Sparkles className="w-4 h-4 text-amber-300 absolute -bottom-1 -left-2 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary">
          Bra jobbat{firstName ? `, ${firstName}` : ""}!
        </h2>
        <p className="text-text-secondary mt-2 max-w-xs">
          Jag är så stolt över dig. Tack för att du checkade in denna vecka. 💚
        </p>
        <Button
          variant="primary"
          className="mt-8"
          onClick={() => router.push("/portal")}
        >
          Tillbaka till startsidan
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Vecko check-in</h1>
        <p className="text-sm text-text-secondary mt-1">
          Fyll i dina mått och berätta hur veckan har gått
        </p>
        {prefilling && (
          <p className="text-xs text-text-muted mt-2 flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" /> Laddar förra veckans värden...
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Weight */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-text-primary mb-3">Vikt</h3>
            <Input
              id="weight"
              type="number"
              step="0.1"
              placeholder="Ex: 72.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              label="Vikt (kg)"
            />
          </CardContent>
        </Card>

        {/* Measurements — new order + Längd + Stuss */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-text-primary mb-3">Mått (cm)</h3>
            <p className="text-xs text-text-muted mb-3">Dina senaste värden är ifyllda — ändra bara det som förändrats.</p>
            <div className="grid grid-cols-2 gap-3">
              <Input id="chest" type="number" step="0.1" placeholder="Bröst" value={chest} onChange={(e) => setChest(e.target.value)} label="Bröst" />
              <Input id="waist" type="number" step="0.1" placeholder="Midja" value={waist} onChange={(e) => setWaist(e.target.value)} label="Midja" />
              <Input id="thighRight" type="number" step="0.1" placeholder="Höger Lår" value={thighRight} onChange={(e) => setThighRight(e.target.value)} label="Höger Lår" />
              <Input id="thighLeft" type="number" step="0.1" placeholder="Vänster Lår" value={thighLeft} onChange={(e) => setThighLeft(e.target.value)} label="Vänster Lår" />
              <Input id="armRight" type="number" step="0.1" placeholder="Höger Arm" value={armRight} onChange={(e) => setArmRight(e.target.value)} label="Höger Arm" />
              <Input id="armLeft" type="number" step="0.1" placeholder="Vänster Arm" value={armLeft} onChange={(e) => setArmLeft(e.target.value)} label="Vänster Arm" />
              <Input id="height" type="number" step="0.1" placeholder="Längd" value={height} onChange={(e) => setHeight(e.target.value)} label="Längd" />
              <Input id="glutes" type="number" step="0.1" placeholder="Stuss" value={glutes} onChange={(e) => setGlutes(e.target.value)} label="Stuss" />
            </div>
          </CardContent>
        </Card>

        {/* Photo upload */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-text-primary mb-1">Ladda upp bilder</h3>
            <p className="text-xs text-text-muted mb-4">
              Ta bilderna på samma plats och i samma ljusförhållanden varje vecka. Strandbikini / underkläder ger bästa jämförelse.
            </p>

            <div className="grid grid-cols-3 gap-2.5">
              <PhotoCard slot={photoFront} onPick={(f) => handlePhotoPick(photoFront, f, setPhotoFront)} />
              <PhotoCard slot={photoBack} onPick={(f) => handlePhotoPick(photoBack, f, setPhotoBack)} />
              <PhotoCard slot={photoSide} onPick={(f) => handlePhotoPick(photoSide, f, setPhotoSide)} />
            </div>

            {extraPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 mt-2.5">
                {extraPhotos.map((slot, i) => (
                  <div key={i} className="relative">
                    <PhotoCard slot={slot} onPick={(f) => handleExtraPick(i, f)} />
                    <button
                      type="button"
                      onClick={() => removeExtraSlot(i)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-border shadow-sm flex items-center justify-center text-text-muted hover:text-error"
                      aria-label="Ta bort"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={addExtraSlot}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-sm font-medium text-text-secondary hover:border-primary/50 hover:text-primary-darker transition-colors"
            >
              <Plus className="w-4 h-4" />
              Lägg till ytterligare bilder
            </button>

            <p className="text-[11px] text-text-muted mt-3 leading-relaxed">
              Tips: gör en video av alla poser och ta skärmdumpar. Väg dig på morgonen efter toalettbesök.
            </p>
          </CardContent>
        </Card>

        {/* Wellness */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-text-primary mb-3">Välmående</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-primary block mb-2">
                  Energinivå: {energy}/10
                </label>
                <input type="range" min="1" max="10" value={energy} onChange={(e) => setEnergy(e.target.value)} className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-text-muted mt-1"><span>Låg</span><span>Hög</span></div>
              </div>

              <Input id="sleep" type="number" step="0.5" placeholder="Ex: 7.5" value={sleep} onChange={(e) => setSleep(e.target.value)} label="Genomsnittlig sömn (timmar)" />

              <div>
                <label className="text-sm font-medium text-text-primary block mb-1">
                  Antal Steg
                </label>
                <p className="text-xs text-text-muted mb-2">Ca. per dag</p>
                <Input
                  id="steps"
                  type="number"
                  placeholder="Ex: 8500"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary block mb-2">
                  Stressnivå: {stress}/10
                </label>
                <input type="range" min="1" max="10" value={stress} onChange={(e) => setStress(e.target.value)} className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-text-muted mt-1"><span>Låg</span><span>Hög</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly reflection questions */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-text-primary mb-1">Veckans reflektion</h3>
            <p className="text-xs text-text-muted mb-4">Ta din tid — ju mer du delar, desto bättre kan din coach hjälpa dig.</p>
            <div className="space-y-5">
              {QUESTIONS.map((q) => (
                <div key={q.key}>
                  <label
                    htmlFor={`q-${q.key}`}
                    className="text-sm font-medium text-text-primary block mb-2 leading-snug"
                  >
                    {q.label}
                  </label>
                  <textarea
                    id={`q-${q.key}`}
                    value={answers[q.key]}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
                    placeholder="Ditt svar..."
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[100px] resize-none"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
          {loading ? "Skickar..." : "Skicka check-in"}
        </Button>
      </form>
    </div>
  );
}

// ─── Photo card component ─────────────────────────────────
function PhotoCard({ slot, onPick }: { slot: PhotoSlot; onPick: (file: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`relative w-full aspect-[3/4] rounded-xl overflow-hidden transition-all ${
          slot.previewUrl
            ? "ring-2 ring-primary/30 shadow-sm"
            : "border-2 border-dashed border-border bg-surface hover:border-primary/50 hover:bg-primary-lighter/20"
        }`}
      >
        {slot.previewUrl ? (
          <>
            <img src={slot.previewUrl} alt={slot.label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-full">Byt bild</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-text-muted">
            <div className="w-10 h-10 rounded-full bg-primary-lighter/40 flex items-center justify-center">
              <Camera className="w-5 h-5 text-primary-darker" />
            </div>
            <span className="text-[11px] font-medium">Välj bild</span>
          </div>
        )}
      </button>
      <p className="text-xs text-center font-medium text-text-secondary">{slot.label}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => onPick(e.target.files?.[0] || null)}
        className="hidden"
      />
    </div>
  );
}
