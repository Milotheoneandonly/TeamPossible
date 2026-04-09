"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";

export default function CheckInPage() {
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [chest, setChest] = useState("");
  const [hips, setHips] = useState("");
  const [armLeft, setArmLeft] = useState("");
  const [armRight, setArmRight] = useState("");
  const [thighLeft, setThighLeft] = useState("");
  const [thighRight, setThighRight] = useState("");
  const [energy, setEnergy] = useState("7");
  const [sleep, setSleep] = useState("");
  const [stress, setStress] = useState("5");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const router = useRouter();
  const supabase = createClient();

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

    // Create progress entry
    const { error } = await supabase.from("progress_entries").insert({
      client_id: client.id,
      weight_kg: weight ? parseFloat(weight) : null,
      waist_cm: waist ? parseFloat(waist) : null,
      chest_cm: chest ? parseFloat(chest) : null,
      hips_cm: hips ? parseFloat(hips) : null,
      arm_left_cm: armLeft ? parseFloat(armLeft) : null,
      arm_right_cm: armRight ? parseFloat(armRight) : null,
      thigh_left_cm: thighLeft ? parseFloat(thighLeft) : null,
      thigh_right_cm: thighRight ? parseFloat(thighRight) : null,
      energy_level: energy ? parseInt(energy) : null,
      sleep_hours_avg: sleep ? parseFloat(sleep) : null,
      stress_level: stress ? parseInt(stress) : null,
      notes: notes || null,
    });

    // Mark any pending check-in as submitted
    await supabase
      .from("check_ins")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("client_id", client.id)
      .eq("status", "pending");

    setLoading(false);
    if (!error) {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Check-in inskickad!</h2>
        <p className="text-text-secondary mt-2">
          Bra jobbat! Din coach kommer att granska den.
        </p>
        <Button
          variant="primary"
          className="mt-6"
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

        {/* Measurements */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-text-primary mb-3">Mått (cm)</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="waist"
                type="number"
                step="0.1"
                placeholder="Midja"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                label="Midja"
              />
              <Input
                id="chest"
                type="number"
                step="0.1"
                placeholder="Bröst"
                value={chest}
                onChange={(e) => setChest(e.target.value)}
                label="Bröst"
              />
              <Input
                id="hips"
                type="number"
                step="0.1"
                placeholder="Höfter"
                value={hips}
                onChange={(e) => setHips(e.target.value)}
                label="Höfter"
              />
              <Input
                id="armLeft"
                type="number"
                step="0.1"
                placeholder="Arm V"
                value={armLeft}
                onChange={(e) => setArmLeft(e.target.value)}
                label="Arm (V)"
              />
              <Input
                id="armRight"
                type="number"
                step="0.1"
                placeholder="Arm H"
                value={armRight}
                onChange={(e) => setArmRight(e.target.value)}
                label="Arm (H)"
              />
              <Input
                id="thighLeft"
                type="number"
                step="0.1"
                placeholder="Lår V"
                value={thighLeft}
                onChange={(e) => setThighLeft(e.target.value)}
                label="Lår (V)"
              />
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
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={energy}
                  onChange={(e) => setEnergy(e.target.value)}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>Låg</span>
                  <span>Hög</span>
                </div>
              </div>

              <Input
                id="sleep"
                type="number"
                step="0.5"
                placeholder="Ex: 7.5"
                value={sleep}
                onChange={(e) => setSleep(e.target.value)}
                label="Genomsnittlig sömn (timmar)"
              />

              <div>
                <label className="text-sm font-medium text-text-primary block mb-2">
                  Stressnivå: {stress}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={stress}
                  onChange={(e) => setStress(e.target.value)}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>Låg</span>
                  <span>Hög</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-text-primary mb-3">Kommentar</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Hur har veckan gått? Något din coach bör veta?"
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[100px] resize-none"
            />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          {loading ? "Skickar..." : "Skicka check-in"}
        </Button>
      </form>
    </div>
  );
}
