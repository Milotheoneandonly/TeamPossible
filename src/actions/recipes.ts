"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getRecipes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("id, name, name_sv, description, total_calories, total_protein, total_carbs, total_fat, prep_time_minutes, cook_time_minutes, servings, image_url, tags, created_at")
    .order("name");

  if (error) throw error;
  return data;
}

export async function getRecipe(recipeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select(`
      *,
      recipe_ingredients (
        id, amount_g, sort_order,
        food:foods (id, name, name_sv, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)
      )
    `)
    .eq("id", recipeId)
    .single();

  if (error) throw error;
  return data;
}

export async function createRecipe(data: {
  name: string;
  name_sv?: string;
  description?: string;
  instructions?: string;
  instructions_sv?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  tags?: string[];
  total_calories?: number;
  total_protein?: number;
  total_carbs?: number;
  total_fat?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Ej inloggad");

  const { data: recipe, error } = await supabase
    .from("recipes")
    .insert({
      coach_id: user.id,
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/foods");
  return recipe;
}

export async function updateRecipe(
  recipeId: string,
  data: {
    name?: string;
    name_sv?: string;
    description?: string;
    instructions?: string;
    total_calories?: number;
    total_protein?: number;
    total_carbs?: number;
    total_fat?: number;
    prep_time_minutes?: number;
    tags?: string[];
  }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("recipes")
    .update(data)
    .eq("id", recipeId);

  if (error) throw error;
  revalidatePath("/foods");
}

export async function deleteRecipe(recipeId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", recipeId);

  if (error) throw error;
  revalidatePath("/foods");
}

export async function searchRecipes(query: string) {
  const supabase = await createClient();
  const sanitized = query.replace(/[%_\\(),."']/g, "");
  if (!sanitized.trim()) return [];

  const { data, error } = await supabase
    .from("recipes")
    .select("id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, image_url")
    .or(`name.ilike.%${sanitized}%,name_sv.ilike.%${sanitized}%`)
    .limit(20);

  if (error) throw error;
  return data;
}
