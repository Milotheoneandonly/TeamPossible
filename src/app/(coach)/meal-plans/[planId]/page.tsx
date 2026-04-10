"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Salad, Loader2, UserPlus, CheckCircle,
  Plus, Search, X, GripVertical, MoreHorizontal, Camera,
} from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, useDraggable, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Draggable sidebar recipe ───────────────────────────────
function DraggableSidebarRecipe({ recipe, onClick }: { recipe: any; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `sidebar-${recipe.id}`,
    data: { recipeId: recipe.id },
  });

  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-hover transition-colors text-left border-b border-border-light cursor-grab active:cursor-grabbing"
    >
      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
        {recipe.image_url ? (
          <img src={recipe.image_url} alt="" className="w-10 h-10 object-cover" />
        ) : (
          <div className="w-10 h-10 bg-success/10 flex items-center justify-center">
            <Salad className="w-4 h-4 text-success" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{recipe.name_sv || recipe.name}</p>
        <p className="text-[10px] text-text-muted truncate">
          {recipe.total_calories ? `${Math.round(recipe.total_calories)} kcal` : ""}
          {recipe.tags?.length ? ` · ${recipe.tags.slice(0, 2).join(", ")}` : ""}
        </p>
      </div>
    </div>
  );
}

// ─── Sortable meal item row ─────────────────────────────────
function SortableMealItemRow({ item, onRemove, onUpdate }: {
  item: any;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: string, value: any) => void;
}) {
  const recipe = item.recipe;
  const food = item.food;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const displayName = recipe ? (recipe.name_sv || recipe.name) : food ? (food.name_sv || food.name) : "Okänt";
  const imageUrl = recipe?.image_url || null;

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-xl border border-border shadow-sm flex items-center gap-0">
      {/* Drag handle */}
      <button {...attributes} {...listeners} className="px-2 py-4 cursor-grab active:cursor-grabbing text-text-muted hover:text-text-primary shrink-0">
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-12 h-12 object-cover rounded-lg" />
        ) : (
          <div className="w-12 h-12 bg-success/10 flex items-center justify-center rounded-lg">
            <Salad className="w-5 h-5 text-success" />
          </div>
        )}
      </div>

      {/* Name + notes */}
      <div className="flex-1 min-w-0 px-3 py-2">
        <p className="text-sm font-semibold text-text-primary truncate">{displayName}</p>
        <input type="text" defaultValue={item.notes || ""} placeholder="Lägg till anteckning"
          onBlur={(e) => onUpdate(item.id, "notes", e.target.value)}
          className="text-xs text-text-muted w-full bg-transparent focus:outline-none placeholder:text-text-muted/50 mt-0.5" />
      </div>

      {/* Kcal */}
      <div className="text-center px-2 shrink-0 w-16">
        <p className="text-[10px] text-text-muted">Kcal</p>
        <input type="number" defaultValue={Math.round(item.calories || 0)}
          onBlur={(e) => onUpdate(item.id, "calories", parseFloat(e.target.value) || 0)}
          className="w-14 text-center text-sm font-semibold border border-border rounded-lg px-1 py-1 focus:outline-none focus:ring-1 focus:ring-primary/50" />
      </div>

      {/* Protein */}
      <div className="text-center px-2 shrink-0 w-16">
        <p className="text-[10px] text-emerald-600">Protein</p>
        <input type="number" defaultValue={Math.round(item.protein || 0)}
          onBlur={(e) => onUpdate(item.id, "protein", parseFloat(e.target.value) || 0)}
          className="w-14 text-center text-sm font-semibold border border-border rounded-lg px-1 py-1 focus:outline-none focus:ring-1 focus:ring-primary/50" />
      </div>

      {/* Kolhydrater */}
      <div className="text-center px-2 shrink-0 w-16">
        <p className="text-[10px] text-fuchsia-600">Karbs</p>
        <input type="number" defaultValue={Math.round(item.carbs || 0)}
          onBlur={(e) => onUpdate(item.id, "carbs", parseFloat(e.target.value) || 0)}
          className="w-14 text-center text-sm font-semibold border border-border rounded-lg px-1 py-1 focus:outline-none focus:ring-1 focus:ring-primary/50" />
      </div>

      {/* Fett */}
      <div className="text-center px-2 shrink-0 w-16">
        <p className="text-[10px] text-teal-600">Fett</p>
        <input type="number" defaultValue={Math.round(item.fat || 0)}
          onBlur={(e) => onUpdate(item.id, "fat", parseFloat(e.target.value) || 0)}
          className="w-14 text-center text-sm font-semibold border border-border rounded-lg px-1 py-1 focus:outline-none focus:ring-1 focus:ring-primary/50" />
      </div>

      {/* Remove */}
      <button onClick={() => onRemove(item.id)} className="text-text-muted hover:text-error p-2 shrink-0">
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Main page component ────────────────────────────────────
export default function MealPlanEditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const planId = params.planId as string;
  const assignClientId = searchParams.get("assign");

  const [plan, setPlan] = useState<any>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assigned, setAssigned] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMeal, setActiveMeal] = useState<string | null>(null);
  const [addingMealName, setAddingMealName] = useState("");
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [planImageUrl, setPlanImageUrl] = useState<string | null>(null);
  const planImageRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadPlan();
    loadRecipes();
    if (assignClientId) loadClientName();
  }, []);

  async function loadPlan() {
    const { data } = await supabase
      .from("meal_plans")
      .select(`
        *,
        meal_plan_days (
          id, day_number, name, sort_order,
          meals (
            id, meal_type, name, sort_order,
            meal_items (
              id, amount_g, servings, sort_order, calories, protein, carbs, fat, notes,
              food:foods (id, name, name_sv, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g),
              recipe:recipes (id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, image_url)
            )
          )
        )
      `)
      .eq("id", planId)
      .single();

    setPlan(data);
    if (data?.image_url) setPlanImageUrl(data.image_url);

    // Flatten all meals across all days and set active
    const allMeals = (data?.meal_plan_days || []).flatMap((d: any) => d.meals || []);
    if (allMeals.length > 0 && !activeMeal) {
      const sorted = [...allMeals].sort((a: any, b: any) => a.sort_order - b.sort_order);
      setActiveMeal(sorted[0].id);
    }
    setLoading(false);
  }

  async function loadRecipes() {
    const { data } = await supabase
      .from("recipes")
      .select("id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, image_url")
      .order("name");
    setRecipes(data || []);
  }

  async function loadClientName() {
    if (!assignClientId) return;
    const { data } = await supabase
      .from("clients")
      .select("profile:profiles!clients_profile_id_fkey(first_name, last_name)")
      .eq("id", assignClientId)
      .single();
    if (data?.profile) setClientName(`${(data.profile as any).first_name} ${(data.profile as any).last_name}`);
  }

  // ─── Assignment flow ────────────────────────────────────────
  async function handleAssignToClient() {
    if (!assignClientId || !plan) return;
    setSaving(true);
    await supabase.from("meal_plans").update({ is_active: false }).eq("client_id", assignClientId).eq("is_active", true);

    if (plan.is_template) {
      const { data: newPlan } = await supabase.from("meal_plans").insert({
        coach_id: plan.coach_id, client_id: assignClientId, title: plan.title, description: plan.description,
        is_template: false, is_active: true, image_url: plan.image_url,
        target_calories: plan.target_calories, target_protein_g: plan.target_protein_g,
        target_carbs_g: plan.target_carbs_g, target_fat_g: plan.target_fat_g,
      }).select().single();

      if (newPlan) {
        for (const day of (plan.meal_plan_days || [])) {
          const { data: newDay } = await supabase.from("meal_plan_days").insert({
            plan_id: newPlan.id, day_number: day.day_number, name: day.name, sort_order: day.sort_order,
          }).select().single();
          if (newDay) {
            for (const meal of (day.meals || [])) {
              const { data: newMeal } = await supabase.from("meals").insert({
                day_id: newDay.id, meal_type: meal.meal_type, name: meal.name, sort_order: meal.sort_order,
              }).select().single();
              if (newMeal) {
                for (const item of (meal.meal_items || [])) {
                  await supabase.from("meal_items").insert({
                    meal_id: newMeal.id, food_id: item.food?.id || null, recipe_id: item.recipe?.id || null,
                    amount_g: item.amount_g, servings: item.servings, sort_order: item.sort_order,
                    calories: item.calories, protein: item.protein, carbs: item.carbs, fat: item.fat, notes: item.notes,
                  });
                }
              }
            }
          }
        }
      }
    } else {
      await supabase.from("meal_plans").update({ client_id: assignClientId, is_active: true }).eq("id", planId);
    }
    setSaving(false);
    setAssigned(true);
  }

  // ─── CRUD operations ───────────────────────────────────────
  async function addRecipeToMeal(recipeId: string) {
    if (!activeMeal) return;
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return;

    const currentItems = getCurrentItems();
    const maxSort = currentItems.reduce((max: number, i: any) => Math.max(max, i.sort_order || 0), -1);

    await supabase.from("meal_items").insert({
      meal_id: activeMeal,
      recipe_id: recipeId,
      servings: 1,
      sort_order: maxSort + 1,
      calories: recipe.total_calories || 0,
      protein: recipe.total_protein || 0,
      carbs: recipe.total_carbs || 0,
      fat: recipe.total_fat || 0,
    });
    loadPlan();
  }

  async function removeItem(itemId: string) {
    await supabase.from("meal_items").delete().eq("id", itemId);
    loadPlan();
  }

  async function updateItem(itemId: string, field: string, value: any) {
    await supabase.from("meal_items").update({ [field]: value }).eq("id", itemId);
  }

  async function addNewMeal() {
    if (!addingMealName.trim()) return;
    // Find the first day (container)
    const day = (plan?.meal_plan_days || [])[0];
    if (!day) return;

    const allMeals = getAllMeals();
    const maxSort = allMeals.reduce((max: number, m: any) => Math.max(max, m.sort_order || 0), 0);

    const { data: newMeal } = await supabase.from("meals").insert({
      day_id: day.id, meal_type: "breakfast", name: addingMealName, sort_order: maxSort + 1,
    }).select().single();

    setAddingMealName("");
    setShowAddMeal(false);
    loadPlan();
    if (newMeal) setActiveMeal(newMeal.id);
  }

  async function removeMeal(mealId: string) {
    if (!confirm("Ta bort denna måltid och alla dess recept?")) return;
    await supabase.from("meals").delete().eq("id", mealId);
    setActiveMeal(null);
    loadPlan();
  }

  async function uploadPlanImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const fileExt = file.name.split(".").pop();
    const filePath = `meal-plans/${user.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("recipe-images").upload(filePath, file, { upsert: true });
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from("recipe-images").getPublicUrl(filePath);
      await supabase.from("meal_plans").update({ image_url: publicUrl }).eq("id", planId);
      setPlanImageUrl(publicUrl);
    }
  }

  // ─── DnD setup ─────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const activeId = String(active.id);

    // Sidebar recipe dropped into meal
    if (activeId.startsWith("sidebar-")) {
      const recipeId = activeId.replace("sidebar-", "");
      if (activeMeal) await addRecipeToMeal(recipeId);
      return;
    }

    // Reorder within meal
    if (!over || active.id === over.id) return;
    const items = getCurrentItems();
    const oldIndex = items.findIndex((i: any) => i.id === active.id);
    const newIndex = items.findIndex((i: any) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove([...items], oldIndex, newIndex) as any[];
    for (let i = 0; i < reordered.length; i++) {
      if (reordered[i].sort_order !== i) {
        await supabase.from("meal_items").update({ sort_order: i }).eq("id", reordered[i].id);
      }
    }
    loadPlan();
  }

  // ─── Helpers ───────────────────────────────────────────────
  function getAllMeals() {
    return (plan?.meal_plan_days || [])
      .flatMap((d: any) => d.meals || [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order);
  }

  function getCurrentItems() {
    const meals = getAllMeals();
    const currentMeal = meals.find((m: any) => m.id === activeMeal);
    return currentMeal ? (currentMeal.meal_items || []).sort((a: any, b: any) => a.sort_order - b.sort_order) : [];
  }

  const filteredRecipes = recipes.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (r.name || "").toLowerCase().includes(q) || (r.name_sv || "").toLowerCase().includes(q) || (r.tags || []).some((t: string) => t.toLowerCase().includes(q));
  });

  // ─── Loading / assigned / not found states ─────────────────
  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (assigned) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-success" /></div>
        <h2 className="text-xl font-bold text-text-primary">Kostplan tilldelad!</h2>
        <p className="text-text-secondary mt-2">{plan?.title} har tilldelats till {clientName}</p>
        <Button className="mt-6" onClick={() => router.push(`/clients/${assignClientId}`)}>Tillbaka till klient</Button>
      </div>
    );
  }

  if (!plan) return <div className="max-w-4xl mx-auto px-4 py-8 text-center"><p className="text-text-muted">Kostplan hittades inte.</p></div>;

  const meals = getAllMeals();
  const currentItems = getCurrentItems();

  return (
    <div className="h-[calc(100vh-64px)] lg:h-screen flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href={assignClientId ? `/clients/${assignClientId}` : "/foods?tab=mallar"} className="text-text-secondary hover:text-text-primary">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            {/* Plan image */}
            <div className="shrink-0">
              {planImageUrl ? (
                <div className="relative w-10 h-10 rounded-xl overflow-hidden group cursor-pointer" onClick={() => planImageRef.current?.click()}>
                  <img src={planImageUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="w-3 h-3 text-white" />
                  </div>
                </div>
              ) : (
                <button onClick={() => planImageRef.current?.click()}
                  className="w-10 h-10 rounded-xl border-2 border-dashed border-border bg-surface flex flex-col items-center justify-center hover:border-primary/50 transition-colors">
                  <Camera className="w-4 h-4 text-text-muted" />
                </button>
              )}
              <input ref={planImageRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPlanImage} className="hidden" />
            </div>
            <div>
              <h1 className="font-bold text-text-primary">{plan.title}</h1>
              <div className="flex items-center gap-3 text-xs text-text-muted">
                {plan.is_template && <span className="text-primary-darker">Mall</span>}
                {plan.target_calories && <span>Mål: {plan.target_calories} kcal</span>}
                {plan.target_protein_g && <span>P: {plan.target_protein_g}g</span>}
                {plan.target_carbs_g && <span>K: {plan.target_carbs_g}g</span>}
                {plan.target_fat_g && <span>F: {plan.target_fat_g}g</span>}
              </div>
            </div>
          </div>
          {assignClientId && (
            <Button onClick={handleAssignToClient} disabled={saving} size="sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {saving ? "Tilldelar..." : `Tilldela till ${clientName}`}
            </Button>
          )}
        </div>
      </div>

      {/* Meal tabs */}
      <div className="bg-white border-b border-border px-4 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1 max-w-7xl mx-auto">
          {meals.map((meal: any) => (
            <button
              key={meal.id}
              onClick={() => setActiveMeal(meal.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeMeal === meal.id
                  ? "text-primary-darker border-primary-darker"
                  : "text-text-muted border-transparent hover:text-text-primary"
              }`}
            >
              {meal.name || `Måltid ${meal.sort_order + 1}`}
            </button>
          ))}
          <button onClick={() => setShowAddMeal(true)} className="px-3 py-3 text-text-muted hover:text-text-primary">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add meal input */}
      {showAddMeal && (
        <div className="bg-surface border-b border-border px-4 py-3 shrink-0">
          <div className="flex items-center gap-2 max-w-7xl mx-auto">
            <input
              value={addingMealName}
              onChange={(e) => setAddingMealName(e.target.value)}
              placeholder="Måltidsnamn, t.ex. Frukost, Lunch, Kväll..."
              autoFocus
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              onKeyDown={(e) => e.key === "Enter" && addNewMeal()}
            />
            <Button size="sm" onClick={addNewMeal} disabled={!addingMealName.trim()}>Skapa</Button>
            <button onClick={() => setShowAddMeal(false)} className="text-text-muted hover:text-text-primary p-1"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Main content */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex-1 flex overflow-hidden">
        {/* Recipe library sidebar */}
        <div className="w-72 bg-white border-r border-border flex flex-col shrink-0 hidden lg:flex">
          <div className="p-3 space-y-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Sök recept..."
                className="w-full rounded-lg border border-border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredRecipes.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-text-muted">Inga recept hittades</p>
                <Link href="/foods/new-recipe" className="text-xs text-primary-darker hover:underline mt-1 inline-block">Skapa recept →</Link>
              </div>
            ) : (
              filteredRecipes.map((recipe) => (
                <DraggableSidebarRecipe
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => addRecipeToMeal(recipe.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Meal items (main area) */}
        <div className="flex-1 overflow-y-auto bg-surface p-4 lg:p-6">
          {!activeMeal ? (
            <div className="text-center py-16">
              <Salad className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary">Inga måltider</h3>
              <p className="text-text-secondary mt-1">Skapa en måltid för att börja</p>
              <Button className="mt-4" onClick={() => setShowAddMeal(true)}><Plus className="w-4 h-4" /> Skapa måltid</Button>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="text-center py-16">
              <Salad className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary">Inga recept</h3>
              <p className="text-text-secondary mt-1">Dra recept från listan till vänster</p>
              <div className="lg:hidden mt-4">
                <Link href="/foods/new-recipe"><Button variant="secondary"><Plus className="w-4 h-4" /> Skapa recept</Button></Link>
              </div>
            </div>
          ) : (
            <SortableContext items={currentItems.map((i: any) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="max-w-4xl space-y-2">
              {currentItems.map((item: any) => (
                <SortableMealItemRow
                  key={item.id}
                  item={item}
                  onRemove={removeItem}
                  onUpdate={updateItem}
                />
              ))}
            </div>
            </SortableContext>
          )}
        </div>
      </div>
      </DndContext>
    </div>
  );
}
