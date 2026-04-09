"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inviteClient } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, UserPlus, Loader2, CheckCircle, Copy, Check } from "lucide-react";
import Link from "next/link";

export default function InviteClientPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [goals, setGoals] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ tempPassword: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Något gick fel. Försök igen.");
    }

    setLoading(false);
  }

  function copyCredentials() {
    if (!result) return;
    navigator.clipboard.writeText(
      `E-post: ${result.email}\nLösenord: ${result.tempPassword}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
                Skicka dessa inloggningsuppgifter till din klient
              </p>
            </div>

            <div className="bg-surface rounded-xl p-4 space-y-2 mb-4">
              <div>
                <span className="text-xs text-text-muted">E-post</span>
                <p className="text-sm font-medium text-text-primary">{result.email}</p>
              </div>
              <div>
                <span className="text-xs text-text-muted">Tillfälligt lösenord</span>
                <p className="text-sm font-mono font-medium text-text-primary">
                  {result.tempPassword}
                </p>
              </div>
            </div>

            <Button onClick={copyCredentials} variant="secondary" className="w-full mb-3">
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Kopierat!" : "Kopiera uppgifter"}
            </Button>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setResult(null);
                  setFirstName("");
                  setLastName("");
                  setEmail("");
                  setPhone("");
                  setGoals("");
                  setNotes("");
                }}
              >
                Lägg till fler
              </Button>
              <Button
                className="flex-1"
                onClick={() => router.push("/clients")}
              >
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
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Tillbaka
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-6">Lägg till ny klient</h1>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="firstName"
                label="Förnamn"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="Anna"
              />
              <Input
                id="lastName"
                label="Efternamn"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="Andersson"
              />
            </div>

            <Input
              id="email"
              label="E-post"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="anna@exempel.se"
            />

            <Input
              id="phone"
              label="Telefon (valfritt)"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+46 70 123 45 67"
            />

            <div>
              <label className="text-sm font-medium text-text-primary block mb-1.5">
                Mål (valfritt)
              </label>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="Gå ner 5 kg, bygga muskler..."
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[80px] resize-none text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary block mb-1.5">
                Anteckningar (valfritt)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Privata anteckningar om klienten..."
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[80px] resize-none text-sm"
              />
            </div>

            {error && (
              <div className="bg-error/10 text-error text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
              {loading ? "Skapar konto..." : "Lägg till klient"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
