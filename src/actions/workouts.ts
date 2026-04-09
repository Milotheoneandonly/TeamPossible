"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getWorkoutPlanTemplates() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workout_plans")
    .select(`
      id, title, description, is_template, created_at,
      workout_days (id, day_number, name)
    `)
    .eq("is_template", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getWorkoutPlan(planId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workout_plans")
    .select(`
      *,
      workout_days (
        id, day_number, name, sort_order,
        workout_exercises (
          id, sort_order, sets, reps, rest_seconds, tempo, notes, superset_group,
          exercise:exercises (id, name, name_sv, muscle_groups, equipment, video_url, category_id)
        )
      )
    `)
    .eq("id", planId)
    .single();

  if (error) throw error;
  return data;
}

export async function createWorkoutPlan(data: {
  title: string;
  description?: string;
  is_template: boolean;
  client_id?: string;
  days: { name: string }[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Ej inloggad");

  const { data: plan, error } = await supabase
    .from("workout_plans")
    .insert({
      coach_id: user.id,
      title: data.title,
      description: data.description,
      is_template: data.is_template,
      client_id: data.client_id || null,
    })
    .select()
    .single();

  if (error) throw error;

  // Create the workout days
  const days = data.days.map((day, idx) => ({
    plan_id: plan.id,
    day_number: idx + 1,
    name: day.name,
    sort_order: idx,
  }));

  await supabase.from("workout_days").insert(days);

  revalidatePath("/workouts");
  return plan;
}

export async function addExerciseToDay(dayId: string, data: {
  exercise_id: string;
  sets?: number;
  reps?: string;
  rest_seconds?: number;
  tempo?: string;
  notes?: string;
  superset_group?: number;
}) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("workout_exercises")
    .select("sort_order")
    .eq("workout_day_id", dayId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSort = (existing?.[0]?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("workout_exercises").insert({
    workout_day_id: dayId,
    exercise_id: data.exercise_id,
    sets: data.sets || 3,
    reps: data.reps || "10",
    rest_seconds: data.rest_seconds || 90,
    tempo: data.tempo || null,
    notes: data.notes || null,
    superset_group: data.superset_group || null,
    sort_order: nextSort,
  });

  if (error) throw error;
}

export async function removeExerciseFromDay(exerciseId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("workout_exercises")
    .delete()
    .eq("id", exerciseId);
  if (error) throw error;
}

export async function updateWorkoutExercise(
  exerciseId: string,
  data: {
    sets?: number;
    reps?: string;
    rest_seconds?: number;
    tempo?: string;
    notes?: string;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("workout_exercises")
    .update(data)
    .eq("id", exerciseId);
  if (error) throw error;
}

export async function assignWorkoutPlanToClient(planId: string, clientId: string) {
  const supabase = await createClient();

  // Deactivate any current active plan
  await supabase
    .from("workout_plans")
    .update({ is_active: false })
    .eq("client_id", clientId)
    .eq("is_active", true);

  // Activate the new plan
  const { error } = await supabase
    .from("workout_plans")
    .update({ client_id: clientId, is_active: true })
    .eq("id", planId);

  if (error) throw error;
  revalidatePath(`/clients/${clientId}`);
}

export async function getExercises(categoryId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("exercises")
    .select("id, name, name_sv, muscle_groups, equipment, difficulty, category_id, video_url")
    .order("name");

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getExerciseCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercise_categories")
    .select("id, name, name_sv, sort_order")
    .order("sort_order");

  if (error) throw error;
  return data;
}

export async function createExercise(data: {
  name: string;
  name_sv?: string;
  category_id?: string;
  muscle_groups?: string[];
  equipment?: string[];
  difficulty?: string;
  description?: string;
  video_url?: string;
}) {
  const supabase = await createClient();
  const { data: exercise, error } = await supabase
    .from("exercises")
    .insert({ ...data, is_custom: true })
    .select()
    .single();

  if (error) throw error;
  return exercise;
}
