"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Utensils } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  "Protein", "Mejeri", "Kolhydrater", "Fett", "Frukt",
  "Grönsaker", "Baljväxter", "Kryddor", "Kosttillskott", "Övrigt",
];

export default function NewFoodPage() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setLoading(true);

    const { error: insertError } = await supabase.from("foods").insert({
      name,
      name_sv: name,
      category: category || null,
      calories_per_100g: calories ? parseFloat(calories) : null,
      protein_per_100g: protein ? parseFloat(protein) : null,
      carbs_per_100g: carbs ? parseFloat(carbs) : null,
      fat_per_100g: fat ? parseFloat(fat) : null,
      is_custom: true,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push("/foods?tab=livsmedel");
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link href="/foods?tab=livsmedel" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Tillbaka
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-6">Lägg till ingrediens</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent>
            <div className="space-y-3">
              <Input id="name" label="Namn *" value={name} onChange={(e) => setName(e.target.value)} required placeholder="T.ex. Kvarg naturell 0.2%" />

              <div>
                <label className="text-sm font-medium text-text-primary block mb-1.5">Visa i kategorin inköpslista</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary">
                  <option value="">Välj kategori</option>
                  {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h3 className="font-semibold text-text-primary mb-1">Näringsvärde</h3>
            <p className="text-xs text-text-muted mb-4">Ange värden per 100g</p>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <Input id="protein" label="Protein/100g *" type="number" step="0.1" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="0" />
              <Input id="carbs" label="Kolhydrater/100g *" type="number" step="0.1" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="0" />
              <Input id="fat" label="Fett/100g *" type="number" step="0.1" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="0" />
            </div>
            <Input id="calories" label="Kalorier per 100g *" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="0" />
          </CardContent>
        </Card>

        {error && <div className="bg-error/10 text-error text-sm rounded-xl px-4 py-3">{error}</div>}

        <Button type="submit" className="w-full" size="lg" disabled={loading || !name.trim()}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Utensils className="w-5 h-5" />}
          {loading ? "Sparar..." : "Skapa"}
        </Button>
      </form>
    </div>
  );
}
