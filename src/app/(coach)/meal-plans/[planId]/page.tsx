"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Salad, Loader2, UserPlus, CheckCircle,
  Plus, Search, X, GripVertical, MoreHorizontal, Camera, Trash2,
} from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, useDraggable, useDroppable, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Draggable sidebar recipe ───────────────────────────────
function DraggableSidebarRecipe({ recipe, onClick }: { recipe: any; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `sidebar-recipe-${recipe.id}`,
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
          {recipe.tags?.length ? ` \u00b7 ${recipe.tags.slice(0, 2).join(", ")}` : ""}
        </p>
      </div>
    </div>
  );
}

// ─── Draggable sidebar food (raw ingredient) ───────────────
function DraggableSidebarFood({ food, onClick }: { food: any; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `sidebar-food-${food.id}`,
    data: { foodId: food.id },
  });

  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.4 : 1,
  };

  const name = food.name_sv || food.name;
  const kcal = food.calories_per_100g ? `${Math.round(food.calories_per_100g)} kcal/100g` : "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-hover transition-colors text-left border-b border-border-light cursor-grab active:cursor-grabbing"
    >
      <div className="w-10 h-10 rounded-lg bg-primary-lighter/40 flex items-center justify-center shrink-0">
        <Salad className="w-4 h-4 text-primary-darker" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{name}</p>
        <p className="text-[10px] text-text-muted truncate">
          {kcal}
          {food.brand ? ` \u00b7 ${food.brand}` : ""}
        </p>
      </div>
    </div>
  );
}

// ─── Sortable meal item row (grams only) ────────────────────
function SortableMealItemRow({ item, onRemove, onGramsChange }: {
  item: any;
  onRemove: (id: string) => void;
  onGramsChange: (id: string, grams: number) => void;
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

  const displayName = recipe ? (recipe.name_sv || recipe.name) : food ? (food.name_sv || food.name) : "Ok\u00e4nt";
  const imageUrl = recipe?.image_url || null;

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-xl border border-border shadow-sm flex items-center gap-0">
      {/* Drag handle */}
      <button {...attributes} {...listeners} className="px-2 py-3 cursor-grab active:cursor-grabbing text-text-muted hover:text-text-primary shrink-0">
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-10 h-10 object-cover rounded-lg" />
        ) : (
          <div className="w-10 h-10 bg-success/10 flex items-center justify-center rounded-lg">
            <Salad className="w-4 h-4 text-success" />
          </div>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0 px-3 py-2">
        <p className="text-sm font-medium text-text-primary truncate">{displayName}</p>
      </div>

      {/* Grams input */}
      <div className="flex items-center gap-1 shrink-0 pr-2">
        <input
          type="number"
          defaultValue={item.amount_g ? Math.round(item.amount_g) : ""}
          placeholder="\u2014"
          onBlur={(e) => {
            const g = parseFloat(e.target.value) || 0;
            onGramsChange(item.id, g);
          }}
          className="w-16 text-center text-sm font-semibold border border-border rounded-lg px-1 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        <span className="text-xs text-text-muted">g</span>
      </div>

      {/* Remove */}
      <button onClick={() => onRemove(item.id)} className="text-text-muted hover:text-error p-2 shrink-0">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Meal section wrapper (sortable + droppable) ────────────
function MealSectionWrapper({
  mealId, isActive, onClick, scrollRef, children,
}: {
  mealId: string;
  isActive: boolean;
  onClick: () => void;
  scrollRef: (el: HTMLDivElement | null) => void;
  children: (dragHandleProps: { attributes: Record<string, any>; listeners: Record<string, any> | undefined }) => React.ReactNode;
}) {
  const sortable = useSortable({ id: `meal-section-${mealId}` });
  const droppable = useDroppable({ id: `meal-drop-${mealId}` });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={(el) => { sortable.setNodeRef(el); droppable.setNodeRef(el); scrollRef(el); }}
      style={style}
      className={`rounded-2xl transition-all ${
        isActive ? "ring-2 ring-primary/20" : ""
      } ${droppable.isOver && !sortable.isDragging ? "ring-2 ring-success/30 bg-success/5" : ""}`}
      onClick={onClick}
    >
      {children({ attributes: sortable.attributes, listeners: sortable.listeners })}
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
  const [foods, setFoods] = useState<any[]>([]);
  const [sidebarTab, setSidebarTab] = useState<"recipes" | "foods">("recipes");
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assigned, setAssigned] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMeal, setActiveMeal] = useState<string | null>(null);
  const [addingMealName, setAddingMealName] = useState("");
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [planImageUrl, setPlanImageUrl] = useState<string | null>(null);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [editingMealName, setEditingMealName] = useState("");
  const [mealMenuId, setMealMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const planImageRef = useRef<HTMLInputElement>(null);
  const mealRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadPlan();
    loadRecipes();
    loadFoods();
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

  async function loadFoods() {
    const { data } = await supabase
      .from("foods")
      .select("id, name, name_sv, brand, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, serving_size_g")
      .order("name");
    setFoods(data || []);
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
  async function addRecipeToMeal(recipeId: string, targetMealId?: string) {
    const mealId = targetMealId || activeMeal;
    if (!mealId) return;
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return;

    // Get recipe total weight from ingredients
    const { data: ingredients } = await supabase
      .from("recipe_ingredients")
      .select("amount_g")
      .eq("recipe_id", recipeId);
    const totalWeight = (ingredients || []).reduce((sum: number, ing: any) => sum + (ing.amount_g || 0), 0);

    // Get max sort for this meal
    const meal = getAllMeals().find((m: any) => m.id === mealId);
    const items = meal ? (meal.meal_items || []) : [];
    const maxSort = items.reduce((max: number, i: any) => Math.max(max, i.sort_order || 0), -1);

    await supabase.from("meal_items").insert({
      meal_id: mealId,
      recipe_id: recipeId,
      servings: 1,
      amount_g: totalWeight || null,
      sort_order: maxSort + 1,
      calories: recipe.total_calories || 0,
      protein: recipe.total_protein || 0,
      carbs: recipe.total_carbs || 0,
      fat: recipe.total_fat || 0,
    });
    loadPlan();
  }

  async function addFoodToMeal(foodId: string, targetMealId?: string) {
    const mealId = targetMealId || activeMeal;
    if (!mealId) return;
    const food = foods.find((f) => f.id === foodId);
    if (!food) return;

    // Default gram amount: the food's serving size, or 100g
    const grams = food.serving_size_g || 100;
    const factor = grams / 100;

    // Get max sort for this meal
    const meal = getAllMeals().find((m: any) => m.id === mealId);
    const items = meal ? (meal.meal_items || []) : [];
    const maxSort = items.reduce((max: number, i: any) => Math.max(max, i.sort_order || 0), -1);

    await supabase.from("meal_items").insert({
      meal_id: mealId,
      food_id: foodId,
      servings: 1,
      amount_g: grams,
      sort_order: maxSort + 1,
      calories: Math.round((food.calories_per_100g || 0) * factor),
      protein: Math.round((food.protein_per_100g || 0) * factor),
      carbs: Math.round((food.carbs_per_100g || 0) * factor),
      fat: Math.round((food.fat_per_100g || 0) * factor),
    });
    loadPlan();
  }

  async function removeItem(itemId: string) {
    await supabase.from("meal_items").delete().eq("id", itemId);
    loadPlan();
  }

  async function handleGramsChange(itemId: string, newGrams: number) {
    const allItems = getAllMeals().flatMap((m: any) => m.meal_items || []);
    const item = allItems.find((i: any) => i.id === itemId);
    if (!item) return;

    const oldGrams = item.amount_g;
    const updates: any = { amount_g: newGrams };

    if (oldGrams && oldGrams > 0) {
      const ratio = newGrams / oldGrams;
      updates.calories = Math.round((item.calories || 0) * ratio);
      updates.protein = Math.round((item.protein || 0) * ratio);
      updates.carbs = Math.round((item.carbs || 0) * ratio);
      updates.fat = Math.round((item.fat || 0) * ratio);
    }

    // Optimistic local update — header totals update instantly
    setPlan((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        meal_plan_days: prev.meal_plan_days.map((d: any) => ({
          ...d,
          meals: d.meals.map((m: any) => ({
            ...m,
            meal_items: m.meal_items.map((i: any) =>
              i.id === itemId ? { ...i, ...updates } : i
            ),
          })),
        })),
      };
    });

    // Persist to DB
    await supabase.from("meal_items").update(updates).eq("id", itemId);
  }

  async function addNewMeal() {
    if (!addingMealName.trim()) return;
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
    const allMeals = getAllMeals();
    if (allMeals.length <= 1) { alert("Du m\u00e5ste ha minst en m\u00e5ltid."); return; }
    if (!confirm("Ta bort denna m\u00e5ltid och alla dess recept?")) return;
    await supabase.from("meals").delete().eq("id", mealId);
    if (activeMeal === mealId) {
      const remaining = allMeals.filter((m: any) => m.id !== mealId);
      setActiveMeal(remaining.length > 0 ? remaining[0].id : null);
    }
    loadPlan();
  }

  async function renameMeal(mealId: string) {
    if (!editingMealName.trim()) { setEditingMealId(null); return; }
    await supabase.from("meals").update({ name: editingMealName.trim() }).eq("id", mealId);
    setEditingMealId(null);
    loadPlan();
  }

  function openMealMenu(mealId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (mealMenuId === mealId) { setMealMenuId(null); setMenuPos(null); return; }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, left: rect.left });
    setMealMenuId(mealId);
  }

  useEffect(() => {
    if (!mealMenuId) return;
    function close() { setMealMenuId(null); setMenuPos(null); }
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [mealMenuId]);

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
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    // 1. Sidebar item dropped (recipe or food) → find target meal from drop position
    if (activeId.startsWith("sidebar-recipe-") || activeId.startsWith("sidebar-food-")) {
      let targetMealId = activeMeal;

      if (overId.startsWith("meal-drop-")) {
        targetMealId = overId.replace("meal-drop-", "");
      } else if (overId.startsWith("meal-section-")) {
        targetMealId = overId.replace("meal-section-", "");
      } else {
        const parentMeal = findMealForItem(overId);
        if (parentMeal) targetMealId = parentMeal;
      }

      if (!targetMealId) return;
      if (activeId.startsWith("sidebar-recipe-")) {
        const recipeId = activeId.replace("sidebar-recipe-", "");
        await addRecipeToMeal(recipeId, targetMealId);
      } else {
        const foodId = activeId.replace("sidebar-food-", "");
        await addFoodToMeal(foodId, targetMealId);
      }
      return;
    }

    // 2. Meal section reordered
    if (activeId.startsWith("meal-section-") && overId.startsWith("meal-section-")) {
      if (activeId === overId) return;
      const fromMealId = activeId.replace("meal-section-", "");
      const toMealId = overId.replace("meal-section-", "");
      const allMeals = getAllMeals();
      const oldIndex = allMeals.findIndex((m: any) => m.id === fromMealId);
      const newIndex = allMeals.findIndex((m: any) => m.id === toMealId);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove([...allMeals], oldIndex, newIndex);
      for (let i = 0; i < reordered.length; i++) {
        if (reordered[i].sort_order !== i) {
          await supabase.from("meals").update({ sort_order: i }).eq("id", reordered[i].id);
        }
      }
      loadPlan();
      return;
    }

    // 3. Reorder items within a meal
    if (active.id === over.id) return;
    const mealId = findMealForItem(activeId);
    if (!mealId) return;
    const items = getItemsForMeal(mealId);
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

  function getItemsForMeal(mealId: string | null) {
    if (!mealId) return [];
    const meal = getAllMeals().find((m: any) => m.id === mealId);
    return meal ? (meal.meal_items || []).sort((a: any, b: any) => a.sort_order - b.sort_order) : [];
  }

  function getMealTotals(mealId: string) {
    const items = getItemsForMeal(mealId);
    return {
      calories: items.reduce((s: number, i: any) => s + (i.calories || 0), 0),
      protein: items.reduce((s: number, i: any) => s + (i.protein || 0), 0),
      carbs: items.reduce((s: number, i: any) => s + (i.carbs || 0), 0),
      fat: items.reduce((s: number, i: any) => s + (i.fat || 0), 0),
    };
  }

  function findMealForItem(itemId: string): string | null {
    for (const meal of getAllMeals()) {
      if ((meal.meal_items || []).some((i: any) => i.id === itemId)) {
        return meal.id;
      }
    }
    return null;
  }

  function scrollToMeal(mealId: string) {
    setActiveMeal(mealId);
    mealRefs.current[mealId]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const filteredRecipes = recipes.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (r.name || "").toLowerCase().includes(q) || (r.name_sv || "").toLowerCase().includes(q) || (r.tags || []).some((t: string) => t.toLowerCase().includes(q));
  });

  const filteredFoods = foods.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (f.name || "").toLowerCase().includes(q) ||
      (f.name_sv || "").toLowerCase().includes(q) ||
      (f.brand || "").toLowerCase().includes(q)
    );
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

  return (
    <div className="h-[calc(100vh-64px)] lg:h-screen flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href={assignClientId ? `/clients/${assignClientId}` : "/foods?tab=mallar"} className="text-text-secondary hover:text-text-primary">
              <ArrowLeft className="w-5 h-5" />
            </Link>
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
              {plan.is_template && <span className="text-xs text-primary-darker">Mall</span>}
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

      {/* Meal tabs — scroll-to navigation */}
      <div className="bg-white border-b border-border px-4 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1 max-w-7xl mx-auto">
          {meals.map((meal: any) => (
            <button
              key={meal.id}
              onClick={() => scrollToMeal(meal.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors shrink-0 ${
                activeMeal === meal.id
                  ? "text-primary-darker border-primary-darker"
                  : "text-text-muted border-transparent hover:text-text-primary"
              }`}
            >
              {meal.name || `M\u00e5ltid ${meal.sort_order + 1}`}
            </button>
          ))}
          <button onClick={() => setShowAddMeal(true)} className="px-3 py-3 text-text-muted hover:text-text-primary shrink-0">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab dropdown menu */}
      {mealMenuId && menuPos && (
        <div
          className="fixed bg-white border border-border rounded-lg shadow-lg z-50 py-1 min-w-[140px]"
          style={{ top: menuPos.top, left: menuPos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { const m = meals.find((m: any) => m.id === mealMenuId); setEditingMealId(mealMenuId); setEditingMealName(m?.name || ""); setMealMenuId(null); setMenuPos(null); }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-surface transition-colors"
          >
            Byt namn
          </button>
          <button
            onClick={() => { const id = mealMenuId; setMealMenuId(null); setMenuPos(null); removeMeal(id); }}
            className="w-full text-left px-3 py-2 text-sm text-error hover:bg-red-50 transition-colors"
          >
            Ta bort
          </button>
        </div>
      )}

      {/* Add meal input */}
      {showAddMeal && (
        <div className="bg-surface border-b border-border px-4 py-3 shrink-0">
          <div className="flex items-center gap-2 max-w-7xl mx-auto">
            <input
              value={addingMealName}
              onChange={(e) => setAddingMealName(e.target.value)}
              placeholder="M\u00e5ltidsnamn, t.ex. Frukost, Lunch, Kv\u00e4ll..."
              autoFocus
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              onKeyDown={(e) => e.key === "Enter" && addNewMeal()}
            />
            <Button size="sm" onClick={addNewMeal} disabled={!addingMealName.trim()}>Skapa</Button>
            <button onClick={() => setShowAddMeal(false)} className="text-text-muted hover:text-text-primary p-1"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Main content — stacked meals */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex-1 flex overflow-hidden">
        {/* Library sidebar — Livsmedel / Recept tabs */}
        <div className="w-72 bg-white border-r border-border flex flex-col shrink-0 hidden lg:flex">
          {/* Tab switcher */}
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => setSidebarTab("foods")}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                sidebarTab === "foods"
                  ? "text-primary-darker border-primary-darker"
                  : "text-text-muted border-transparent hover:text-text-primary"
              }`}
            >
              Livsmedel
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab("recipes")}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                sidebarTab === "recipes"
                  ? "text-primary-darker border-primary-darker"
                  : "text-text-muted border-transparent hover:text-text-primary"
              }`}
            >
              Recept
            </button>
          </div>

          {/* Search */}
          <div className="p-3 space-y-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={sidebarTab === "foods" ? "S\u00f6k livsmedel..." : "S\u00f6k recept..."}
                className="w-full rounded-lg border border-border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {sidebarTab === "recipes" ? (
              filteredRecipes.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-text-muted">Inga recept hittades</p>
                  <Link href="/foods/new-recipe" className="text-xs text-primary-darker hover:underline mt-1 inline-block">Skapa recept &rarr;</Link>
                </div>
              ) : (
                filteredRecipes.map((recipe) => (
                  <DraggableSidebarRecipe
                    key={recipe.id}
                    recipe={recipe}
                    onClick={() => addRecipeToMeal(recipe.id)}
                  />
                ))
              )
            ) : (
              filteredFoods.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-text-muted">Inga livsmedel hittades</p>
                  <Link href="/foods/new-food" className="text-xs text-primary-darker hover:underline mt-1 inline-block">Skapa livsmedel &rarr;</Link>
                </div>
              ) : (
                filteredFoods.map((food) => (
                  <DraggableSidebarFood
                    key={food.id}
                    food={food}
                    onClick={() => addFoodToMeal(food.id)}
                  />
                ))
              )
            )}
          </div>
        </div>

        {/* All meals stacked (main area) */}
        <div className="flex-1 overflow-y-auto bg-surface p-4 lg:p-6">
          {meals.length === 0 ? (
            <div className="text-center py-16">
              <Salad className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary">Inga m\u00e5ltider</h3>
              <p className="text-text-secondary mt-1">Skapa en m\u00e5ltid f\u00f6r att b\u00f6rja</p>
              <Button className="mt-4" onClick={() => setShowAddMeal(true)}><Plus className="w-4 h-4" /> Skapa m\u00e5ltid</Button>
            </div>
          ) : (
            <SortableContext items={meals.map((m: any) => `meal-section-${m.id}`)} strategy={verticalListSortingStrategy}>
            <div className="max-w-4xl space-y-6">
              {meals.map((meal: any) => {
                const items = getItemsForMeal(meal.id);
                const totals = getMealTotals(meal.id);
                const isActive = activeMeal === meal.id;

                return (
                  <MealSectionWrapper
                    key={meal.id}
                    mealId={meal.id}
                    isActive={isActive}
                    onClick={() => setActiveMeal(meal.id)}
                    scrollRef={(el) => { mealRefs.current[meal.id] = el; }}
                  >
                    {({ attributes, listeners }) => (
                      <>
                        {/* Meal section header */}
                        <div className="flex items-center justify-between px-1 mb-2">
                          <div className="flex items-center gap-2 group">
                            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-text-muted hover:text-text-primary p-0.5 touch-none">
                              <GripVertical className="w-4 h-4" />
                            </button>
                            {editingMealId === meal.id ? (
                              <input
                                value={editingMealName}
                                onChange={(e) => setEditingMealName(e.target.value)}
                                onBlur={() => renameMeal(meal.id)}
                                onKeyDown={(e) => { if (e.key === "Enter") renameMeal(meal.id); if (e.key === "Escape") setEditingMealId(null); }}
                                autoFocus
                                className="text-lg font-bold text-text-primary bg-transparent border-b-2 border-primary-darker focus:outline-none"
                              />
                            ) : (
                              <h3
                                className="text-lg font-bold text-text-primary cursor-pointer"
                                onDoubleClick={() => { setEditingMealId(meal.id); setEditingMealName(meal.name || ""); }}
                              >
                                {meal.name || `M\u00e5ltid ${meal.sort_order + 1}`}
                              </h3>
                            )}
                            <button
                              onClick={(e) => openMealMenu(meal.id, e)}
                              className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-primary p-0.5 transition-opacity"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Auto-calculated totals */}
                          {items.length > 0 && (
                            <div className="flex items-center gap-3 text-xs">
                              <span className="font-bold text-text-primary">{Math.round(totals.calories)} kcal</span>
                              <span className="text-emerald-600 font-semibold">P: {Math.round(totals.protein)}g</span>
                              <span className="text-fuchsia-600 font-semibold">K: {Math.round(totals.carbs)}g</span>
                              <span className="text-teal-600 font-semibold">F: {Math.round(totals.fat)}g</span>
                            </div>
                          )}
                        </div>

                        {/* Items list */}
                        <SortableContext items={items.map((i: any) => i.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-1.5">
                            {items.map((item: any) => (
                              <SortableMealItemRow
                                key={item.id}
                                item={item}
                                onRemove={removeItem}
                                onGramsChange={handleGramsChange}
                              />
                            ))}
                          </div>
                        </SortableContext>

                        {/* Empty state for this meal */}
                        {items.length === 0 && (
                          <div className="bg-white/50 rounded-xl border border-dashed border-border py-6 text-center">
                            <p className="text-sm text-text-muted">Dra recept hit eller klicka i listan</p>
                          </div>
                        )}
                      </>
                    )}
                  </MealSectionWrapper>
                );
              })}
            </div>
            </SortableContext>
          )}
        </div>
      </div>
      </DndContext>
    </div>
  );
}
