"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Salad, Search, X, Camera, Trash2 } from "lucide-react";
import Link from "next/link";

const MEAL_TAGS = [
  { value: "breakfast", label: "Frukost" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Middag" },
  { value: "snack", label: "Mellanmål" },
  { value: "high_protein", label: "Proteinrik" },
  { value: "quick", label: "Snabb (<15 min)" },
  { value: "vegan", label: "Vegansk" },
  { value: "vegetarian", label: "Vegetarisk" },
];

export default function EditRecipePage() {
  const params = useParams();
  const recipeId = params.recipeId as string;
  const router = useRouter();
  const supabase = createClient();
  const imageRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("1");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadRecipe(); }, []);

  async function loadRecipe() {
    const { data } = await supabase.from("recipes").select("*").eq("id", recipeId).single();
    if (data) {
      setName(data.name_sv || data.name || "");
      setInstructions(data.instructions_sv || data.instructions || "");
      setPrepTime(data.prep_time_minutes?.toString() || "");
      setCookTime(data.cook_time_minutes?.toString() || "");
      setServings(data.servings?.toString() || "1");
      setSelectedTags(data.tags || []);
      setCalories(data.total_calories?.toString() || "");
      setProtein(data.total_protein?.toString() || "");
      setCarbs(data.total_carbs?.toString() || "");
      setFat(data.total_fat?.toString() || "");
      setImageUrl(data.image_url || null);
    }
    setLoading(false);
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    // Upload new image if selected
    let newImageUrl = imageUrl;
    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("recipe-images").upload(filePath, imageFile, { upsert: true });
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from("recipe-images").getPublicUrl(filePath);
        newImageUrl = publicUrl;
      }
    }

    const { error: updateError } = await supabase.from("recipes").update({
      name, name_sv: name,
      instructions: instructions || null, instructions_sv: instructions || null,
      prep_time_minutes: prepTime ? parseInt(prepTime) : null,
      cook_time_minutes: cookTime ? parseInt(cookTime) : null,
      servings: servings ? parseInt(servings) : 1,
      tags: selectedTags.length > 0 ? selectedTags : null,
      total_calories: calories ? parseFloat(calories) : null,
      total_protein: protein ? parseFloat(protein) : null,
      total_carbs: carbs ? parseFloat(carbs) : null,
      total_fat: fat ? parseFloat(fat) : null,
      image_url: newImageUrl,
    }).eq("id", recipeId);

    if (updateError) setError(updateError.message);
    else router.push("/foods?tab=recept");
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Är du säker på att du vill ta bort detta recept?")) return;
    setDeleting(true);
    await supabase.from("recipes").delete().eq("id", recipeId);
    router.push("/foods?tab=recept");
  }

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link href="/foods?tab=recept" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Tillbaka till recept
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-6">Redigera recept</h1>

      <div className="space-y-6">
        {/* Image + Name */}
        <Card>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="shrink-0">
                {(imagePreview || imageUrl) ? (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden group">
                    <img src={imagePreview || imageUrl || ""} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); setImageUrl(null); }}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => imageRef.current?.click()}
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-border bg-surface flex flex-col items-center justify-center hover:border-primary/50 transition-colors">
                    <Camera className="w-6 h-6 text-text-muted mb-1" />
                    <span className="text-[10px] text-text-muted">Lägg till bild</span>
                  </button>
                )}
                <input ref={imageRef} type="file" accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }}
                  className="hidden" />
              </div>
              <div className="flex-1">
                <Input id="name" label="Receptets namn" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-error font-medium">Protein {protein || 0}g</span>
              <span className="text-success font-medium">Kolhydrater {carbs || 0}g</span>
              <span className="text-accent font-medium">Fett {fat || 0}g</span>
            </div>
          </CardContent>
        </Card>

        {/* Macros */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-text-primary mb-3">Makron (per portion)</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input id="calories" label="Kalorier (kcal)" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} />
              <Input id="protein" label="Protein (g)" type="number" step="0.1" value={protein} onChange={(e) => setProtein(e.target.value)} />
              <Input id="carbs" label="Kolhydrater (g)" type="number" step="0.1" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
              <Input id="fat" label="Fett (g)" type="number" step="0.1" value={fat} onChange={(e) => setFat(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-text-primary mb-3">Instruktioner</h3>
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Instruktioner..."
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[80px] resize-none text-sm" />
          </CardContent>
        </Card>

        {/* Time + servings */}
        <Card>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <Input id="prepTime" label="Förberedelsetid" type="number" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} placeholder="min" />
              <Input id="cookTime" label="Tillagningstid" type="number" value={cookTime} onChange={(e) => setCookTime(e.target.value)} placeholder="min" />
              <Input id="servings" label="Portioner" type="number" value={servings} onChange={(e) => setServings(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-text-primary mb-3">Måltidstyp</h3>
            <div className="flex flex-wrap gap-2">
              {MEAL_TAGS.map((tag) => (
                <button key={tag.value} type="button" onClick={() => toggleTag(tag.value)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    selectedTags.includes(tag.value) ? "bg-primary text-white border-primary" : "bg-white text-text-secondary border-border hover:border-primary/50"
                  }`}>{tag.label}</button>
              ))}
            </div>
          </CardContent>
        </Card>

        {error && <div className="bg-error/10 text-error text-sm rounded-xl px-4 py-3">{error}</div>}

        <div className="flex gap-3">
          <button onClick={handleDelete} disabled={deleting} className="text-sm text-error hover:underline flex items-center gap-1">
            <Trash2 className="w-4 h-4" />{deleting ? "Tar bort..." : "Radera"}
          </button>
          <div className="flex-1" />
          <Button variant="ghost" onClick={() => router.push("/foods?tab=recept")}>Avbryt</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? "Sparar..." : "Uppdatera recept"}
          </Button>
        </div>
      </div>
    </div>
  );
}
