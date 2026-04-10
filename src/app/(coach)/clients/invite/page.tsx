"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inviteClient } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, UserPlus, Loader2, CheckCircle, Copy, Check } from "lucide-react";
import Link from "next/link";

const DAYS = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];
const DAY_TO_INT: Record<string, number> = {
  "Måndag": 0, "Tisdag": 1, "Onsdag": 2, "Torsdag": 3,
  "Fredag": 4, "Lördag": 5, "Söndag": 6,
};

export default function InviteClientPage() {
  // Step 1: Client info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [goals, setGoals] = useState("");
  const [notes, setNotes] = useState("");

  // Step 2: Membership
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  // Step 3: Check-in settings
  const [checkInFrequency, setCheckInFrequency] = useState("1");
  const [checkInPeriod, setCheckInPeriod] = useState("weekly");
  const [checkInDay, setCheckInDay] = useState("Måndag");

  // UI state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ tempPassword: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    setError("");
    setLoading(true);

    try {
      const res = await inviteClient({
        email,
        firstName,
        lastName,
        phone: phone || undefined,
        goals: goals || undefined,
        notes: notes || undefined,
        check_in_day: DAY_TO_INT[checkInDay],
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Något gick fel. Försök igen.");
      setLoading(false);
    }
  }

  function copyCredentials() {
    if (!result) return;
    navigator.clipboard.writeText(
      `Hej ${firstName}!\n\nDitt konto hos Possible är redo.\n\nLogga in: https://team-possible.vercel.app/login\nE-post: ${result.email}\nLösenord: ${result.tempPassword}\n\nVälkommen!`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // SUCCESS SCREEN
  if (result) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <Card>
          <CardContent>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-success" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">Klient tillagd!</h2>
              <p className="text-sm text-text-secondary mt-1">
                Skicka dessa inloggningsuppgifter till {firstName}
              </p>
            </div>

            <div className="bg-surface rounded-xl p-4 space-y-2 mb-4">
              <div>
                <span className="text-xs text-text-muted">E-post</span>
                <p className="text-sm font-medium text-text-primary">{result.email}</p>
              </div>
              <div>
                <span className="text-xs text-text-muted">Tillfälligt lösenord</span>
                <p className="text-sm font-mono font-medium text-text-primary">{result.tempPassword}</p>
              </div>
            </div>

            <Button onClick={copyCredentials} variant="secondary" className="w-full mb-3">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Kopierat!" : "Kopiera meddelande med inloggning"}
            </Button>

            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => {
                setResult(null); setStep(1);
                setFirstName(""); setLastName(""); setEmail(""); setPhone(""); setGoals(""); setNotes("");
              }}>
                Lägg till fler
              </Button>
              <Button className="flex-1" onClick={() => router.push("/clients")}>
                Visa klienter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link href="/clients" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Tillbaka
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-6">Lägg till ny klient</h1>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= s ? "bg-primary text-white" : "bg-surface text-text-muted"
            }`}>{s}</div>
            <span className={`text-xs hidden sm:inline ${step >= s ? "text-text-primary" : "text-text-muted"}`}>
              {s === 1 ? "Klientinfo" : s === 2 ? "Medlemskap" : "Check-in"}
            </span>
            {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      {/* STEP 1: Klientinformation */}
      {step === 1 && (
        <Card>
          <CardContent>
            <h2 className="font-semibold text-text-primary mb-4">Klientinformation</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input id="firstName" label="Förnamn *" value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Anna" />
                <Input id="lastName" label="Efternamn *" value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Andersson" />
              </div>

              <Input id="email" label="E-post *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="anna@exempel.se" />

              <div>
                <label className="text-sm font-medium text-text-primary block mb-1.5">Telefon</label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 bg-surface border border-border rounded-xl px-3 py-3 text-sm text-text-secondary shrink-0">
                    <span>🇸🇪</span>
                    <span>+46</span>
                  </div>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="70 123 45 67"
                    className="flex-1 rounded-xl border border-border bg-white px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-text-primary block mb-1.5">Land</label>
                  <div className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary">
                    Sverige
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-primary block mb-1.5">Språk</label>
                  <div className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary">
                    🇸🇪 Svenska
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary block mb-1.5">Mål (valfritt)</label>
                <textarea value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="Gå ner 5 kg, bygga muskler..."
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[70px] resize-none text-sm" />
              </div>

              {error && <div className="bg-error/10 text-error text-sm rounded-xl px-4 py-3">{error}</div>}

              <Button className="w-full" onClick={() => {
                if (!firstName.trim() || !lastName.trim() || !email.trim()) {
                  setError("Förnamn, efternamn och e-post krävs");
                  return;
                }
                setError("");
                setStep(2);
              }}>
                Nästa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Medlemskap */}
      {step === 2 && (
        <Card>
          <CardContent>
            <h2 className="font-semibold text-text-primary mb-4">Medlemskap</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input id="startDate" label="Startdatum" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <div>
                  <label className="text-sm font-medium text-text-primary block mb-1.5">Varaktighet</label>
                  <div className="flex items-center bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary">
                    Pågående
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary block mb-1.5">Anteckningar (valfritt)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Privata anteckningar om klienten..."
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[70px] resize-none text-sm" />
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>Tillbaka</Button>
                <Button className="flex-1" onClick={() => setStep(3)}>Nästa</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Check-in */}
      {step === 3 && (
        <Card>
          <CardContent>
            <h2 className="font-semibold text-text-primary mb-4">Check-in</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-primary block mb-1.5">Check-in-formulär</label>
                <div className="flex items-center bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary">
                  🇸🇪 Din check-in
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-text-primary mb-3">Skicka påminnelse om check-in varje gång:</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Frekvens</label>
                    <select value={checkInFrequency} onChange={(e) => setCheckInFrequency(e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-3 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="4">4</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Check-in-period</label>
                    <select value={checkInPeriod} onChange={(e) => setCheckInPeriod(e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-3 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="weekly">Vecka</option>
                      <option value="biweekly">Varannan vecka</option>
                      <option value="monthly">Månad</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Dag</label>
                    <select value={checkInDay} onChange={(e) => setCheckInDay(e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-3 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50">
                      {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {error && <div className="bg-error/10 text-error text-sm rounded-xl px-4 py-3">{error}</div>}

              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(2)}>Tillbaka</Button>
                <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                  {loading ? "Skapar konto..." : "Lägg till klient"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
