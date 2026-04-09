"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getMealPlanTemplates() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meal_plans")
    .select("id, title, description, target_calories, target_protein_g, target_carbs_g, target_fat_g, is_template, created_at")
    .eq("is_template", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getMealPlan(planId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meal_plans")
    .select(`
      *,
      meal_plan_days (
        id, day_number, name, sort_order,
        meals (
          id, meal_type, name, sort_order,
          meal_items (
            id, amount_g, servings, sort_order,
            food:foods (id, name, name_sv, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g),
            recipe:recipes (id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, servings)
          )
        )
      )
    `)
    .eq("id", planId)
    .single();

  if (error) throw error;
  return data;
}

export async function createMealPlan(data: {
  title: string;
  description?: string;
  is_template: boolean;
  client_id?: string;
  target_calories?: number;
  target_protein_g?: number;
  target_carbs_g?: number;
  target_fat_g?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Ej inloggad");

  const { data: plan, error } = await supabase
    .from("meal_plans")
    .insert({
      coach_id: user.id,
      ...data,
    })
    .select()
    .single();

  if (error) throw error;

  // Create 7 default days
  const days = Array.from({ length: 7 }, (_, i) => ({
    plan_id: plan.id,
    day_number: i + 1,
    name: ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"][i],
    sort_order: i,
  }));

  const { data: createdDays, error: daysError } = await supabase
    .from("meal_plan_days")
    .insert(days)
    .select();

  if (daysError) throw daysError;

  // Create default meals for each day
  const mealTypes = ["breakfast", "snack_am", "lunch", "snack_pm", "dinner"];
  const meals = (createdDays || []).flatMap((day) =>
    mealTypes.map((type, idx) => ({
      day_id: day.id,
      meal_type: type,
      sort_order: idx,
    }))
  );

  await supabase.from("meals").insert(meals);

  revalidatePath("/meal-plans");
  return plan;
}

export async function assignMealPlanToClient(planId: string, clientId: string) {
  const supabase = await createClient();

  // Deactivate any current active plan for this client
  await supabase
    .from("meal_plans")
    .update({ is_active: false })
    .eq("client_id", clientId)
    .eq("is_active", true);

  // Activate the new plan
  const { error } = await supabase
    .from("meal_plans")
    .update({ client_id: clientId, is_active: true })
    .eq("id", planId);

  if (error) throw error;
  revalidatePath(`/clients/${clientId}`);
}

export async function addMealItem(mealId: string, data: {
  food_id?: string;
  recipe_id?: string;
  amount_g?: number;
  servings?: number;
}) {
  const supabase = await createClient();

  // Get current max sort_order
  const { data: existing } = await supabase
    .from("meal_items")
    .select("sort_order")
    .eq("meal_id", mealId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSort = (existing?.[0]?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("meal_items").insert({
    meal_id: mealId,
    food_id: data.food_id || null,
    recipe_id: data.recipe_id || null,
    amount_g: data.amount_g || null,
    servings: data.servings || 1,
    sort_order: nextSort,
  });

  if (error) throw error;
}

export async function removeMealItem(itemId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("meal_items").delete().eq("id", itemId);
  if (error) throw error;
}

export async function searchFoods(query: string) {
  const supabase = await createClient();
  // Sanitize query to prevent PostgREST filter injection
  const sanitized = query.replace(/[%_\\(),."']/g, "");
  if (!sanitized.trim()) return [];

  const { data, error } = await supabase
    .from("foods")
    .select("id, name, name_sv, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, category")
    .or(`name.ilike.%${sanitized}%,name_sv.ilike.%${sanitized}%`)
    .limit(20);

  if (error) throw error;
  return data;
}

export async function createFood(data: {
  name: string;
  name_sv?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  category?: string;
}) {
  const supabase = await createClient();
  const { data: food, error } = await supabase
    .from("foods")
    .insert({ ...data, is_custom: true })
    .select()
    .single();

  if (error) throw error;
  return food;
}
