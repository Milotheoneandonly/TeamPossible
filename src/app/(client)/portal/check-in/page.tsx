"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2, Sparkles } from "lucide-react";

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

export default function CheckInPage() {
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [chest, setChest] = useState("");
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

  const router = useRouter();
  const supabase = createClient();

  // Preload previous values so clients don't have to re-enter unchanged measurements
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
        .select("weight_kg, waist_cm, chest_cm, arm_left_cm, arm_right_cm, thigh_left_cm, thigh_right_cm, steps_avg, sleep_hours_avg")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (last) {
        if (last.weight_kg != null) setWeight(String(last.weight_kg));
        if (last.waist_cm != null) setWaist(String(last.waist_cm));
        if (last.chest_cm != null) setChest(String(last.chest_cm));
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

  // Auto-redirect to dashboard after success celebration
  useEffect(() => {
    if (!submitted) return;
    const t = setTimeout(() => router.push("/portal"), 3500);
    return () => clearTimeout(t);
  }, [submitted, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("profile_id", user.id)
      .single();
    if (!client) return;

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

    // 2. Create progress entry
    const answersClean = Object.fromEntries(
      Object.entries(answers).filter(([, v]) => v.trim().length > 0)
    );

    const { error } = await supabase.from("progress_entries").insert({
      client_id: client.id,
      check_in_id: checkInId,
      weight_kg: weight ? parseFloat(weight) : null,
      waist_cm: waist ? parseFloat(waist) : null,
      chest_cm: chest ? parseFloat(chest) : null,
      arm_left_cm: armLeft ? parseFloat(armLeft) : null,
      arm_right_cm: armRight ? parseFloat(armRight) : null,
      thigh_left_cm: thighLeft ? parseFloat(thighLeft) : null,
      thigh_right_cm: thighRight ? parseFloat(thighRight) : null,
      steps_avg: steps ? parseInt(steps) : null,
      energy_level: energy ? parseInt(energy) : null,
      sleep_hours_avg: sleep ? parseFloat(sleep) : null,
      stress_level: stress ? parseInt(stress) : null,
      check_in_answers: Object.keys(answersClean).length > 0 ? answersClean : null,
    });

    // 3. Mark the check-in as submitted
    if (checkInId) {
      await supabase
        .from("check_ins")
        .update({ status: "submitted", submitted_at: new Date().toISOString() })
        .eq("id", checkInId);
    }

    setLoading(false);
    if (!error) {
      setSubmitted(true);
    }
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

        {/* Measurements — new order: Bröst, Midja, Höger Lår, Vänster Lår, Höger Arm, Vänster Arm */}
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
            </div>
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
