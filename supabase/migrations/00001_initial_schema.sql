-- =============================================================
-- TEAM POSSIBLE - FULL DATABASE SCHEMA
-- =============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- =============================================================
-- PROFILES (extends auth.users)
-- =============================================================
create type public.user_role as enum ('coach', 'client');

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role user_role not null default 'client',
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  locale text default 'sv',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================================
-- CLIENTS (coach's client details)
-- =============================================================
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade unique not null,
  coach_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'active' check (status in ('active', 'paused', 'inactive')),
  date_of_birth date,
  gender text check (gender in ('male', 'female', 'other')),
  height_cm numeric(5,1),
  target_weight_kg numeric(5,1),
  activity_level text check (activity_level in ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
  dietary_preferences text[],
  allergies text[],
  injuries_notes text,
  goals text,
  start_date date default current_date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================================
-- EXERCISES
-- =============================================================
create table public.exercise_categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  name_sv text,
  sort_order int default 0
);

create table public.exercises (
  id uuid default uuid_generate_v4() primary key,
  category_id uuid references public.exercise_categories(id) on delete set null,
  name text not null,
  name_sv text,
  description text,
  description_sv text,
  video_url text,
  thumbnail_url text,
  muscle_groups text[],
  equipment text[],
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  is_custom boolean default false,
  created_at timestamptz default now()
);

-- =============================================================
-- WORKOUT PLANS
-- =============================================================
create table public.workout_plans (
  id uuid default uuid_generate_v4() primary key,
  coach_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  description text,
  is_template boolean default false,
  is_active boolean default false,
  start_date date,
  end_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.workout_days (
  id uuid default uuid_generate_v4() primary key,
  plan_id uuid references public.workout_plans(id) on delete cascade not null,
  day_number int not null,
  name text,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table public.workout_exercises (
  id uuid default uuid_generate_v4() primary key,
  workout_day_id uuid references public.workout_days(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) on delete cascade not null,
  sort_order int default 0,
  sets int default 3,
  reps text default '10',
  rest_seconds int default 90,
  tempo text,
  notes text,
  superset_group int,
  created_at timestamptz default now()
);

-- =============================================================
-- WORKOUT LOGS (client fills in)
-- =============================================================
create table public.workout_logs (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  workout_day_id uuid references public.workout_days(id) on delete set null,
  date date default current_date,
  duration_minutes int,
  notes text,
  completed boolean default false,
  created_at timestamptz default now()
);

create table public.workout_log_sets (
  id uuid default uuid_generate_v4() primary key,
  log_id uuid references public.workout_logs(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) on delete cascade not null,
  set_number int not null,
  weight_kg numeric(6,2),
  reps int,
  rpe numeric(3,1),
  completed boolean default true,
  created_at timestamptz default now()
);

-- =============================================================
-- FOODS & RECIPES
-- =============================================================
create table public.foods (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  name_sv text,
  brand text,
  calories_per_100g numeric(7,2),
  protein_per_100g numeric(7,2),
  carbs_per_100g numeric(7,2),
  fat_per_100g numeric(7,2),
  fiber_per_100g numeric(7,2),
  serving_size_g numeric(7,2) default 100,
  serving_unit text default 'g',
  category text,
  is_custom boolean default false,
  created_at timestamptz default now()
);

create table public.recipes (
  id uuid default uuid_generate_v4() primary key,
  coach_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  name_sv text,
  description text,
  instructions text,
  instructions_sv text,
  prep_time_minutes int,
  cook_time_minutes int,
  servings int default 1,
  image_url text,
  tags text[],
  total_calories numeric(7,2),
  total_protein numeric(7,2),
  total_carbs numeric(7,2),
  total_fat numeric(7,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.recipe_ingredients (
  id uuid default uuid_generate_v4() primary key,
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  food_id uuid references public.foods(id) on delete cascade not null,
  amount_g numeric(7,2) not null,
  sort_order int default 0
);

-- =============================================================
-- MEAL PLANS
-- =============================================================
create table public.meal_plans (
  id uuid default uuid_generate_v4() primary key,
  coach_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  description text,
  is_template boolean default false,
  is_active boolean default false,
  target_calories int,
  target_protein_g int,
  target_carbs_g int,
  target_fat_g int,
  start_date date,
  end_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.meal_plan_days (
  id uuid default uuid_generate_v4() primary key,
  plan_id uuid references public.meal_plans(id) on delete cascade not null,
  day_number int not null,
  name text,
  sort_order int default 0
);

create table public.meals (
  id uuid default uuid_generate_v4() primary key,
  day_id uuid references public.meal_plan_days(id) on delete cascade not null,
  meal_type text not null check (meal_type in ('breakfast', 'snack_am', 'lunch', 'snack_pm', 'dinner', 'snack_evening')),
  name text,
  sort_order int default 0
);

create table public.meal_items (
  id uuid default uuid_generate_v4() primary key,
  meal_id uuid references public.meals(id) on delete cascade not null,
  food_id uuid references public.foods(id) on delete set null,
  recipe_id uuid references public.recipes(id) on delete set null,
  amount_g numeric(7,2),
  servings numeric(4,2) default 1,
  sort_order int default 0,
  constraint food_or_recipe check (
    (food_id is not null and recipe_id is null) or
    (food_id is null and recipe_id is not null)
  )
);

-- =============================================================
-- CHECK-INS
-- =============================================================
create table public.check_in_templates (
  id uuid default uuid_generate_v4() primary key,
  coach_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  is_default boolean default false,
  frequency text default 'weekly' check (frequency in ('daily', 'weekly', 'biweekly', 'monthly')),
  created_at timestamptz default now()
);

create table public.check_in_questions (
  id uuid default uuid_generate_v4() primary key,
  template_id uuid references public.check_in_templates(id) on delete cascade not null,
  question_text text not null,
  question_text_sv text,
  question_type text not null check (question_type in ('text', 'number', 'scale', 'boolean', 'select')),
  options jsonb,
  is_required boolean default true,
  sort_order int default 0
);

create table public.check_ins (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  template_id uuid references public.check_in_templates(id) on delete set null,
  status text default 'pending' check (status in ('pending', 'submitted', 'reviewed')),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  coach_notes text,
  created_at timestamptz default now()
);

create table public.check_in_responses (
  id uuid default uuid_generate_v4() primary key,
  check_in_id uuid references public.check_ins(id) on delete cascade not null,
  question_id uuid references public.check_in_questions(id) on delete cascade not null,
  answer_text text,
  answer_number numeric(10,2),
  created_at timestamptz default now()
);

-- =============================================================
-- PROGRESS TRACKING
-- =============================================================
create table public.progress_entries (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  check_in_id uuid references public.check_ins(id) on delete set null,
  date date default current_date,
  weight_kg numeric(5,2),
  body_fat_pct numeric(4,1),
  waist_cm numeric(5,1),
  chest_cm numeric(5,1),
  hips_cm numeric(5,1),
  arm_left_cm numeric(5,1),
  arm_right_cm numeric(5,1),
  thigh_left_cm numeric(5,1),
  thigh_right_cm numeric(5,1),
  steps_avg int,
  sleep_hours_avg numeric(3,1),
  energy_level int check (energy_level between 1 and 10),
  stress_level int check (stress_level between 1 and 10),
  notes text,
  created_at timestamptz default now()
);

create table public.progress_photos (
  id uuid default uuid_generate_v4() primary key,
  progress_entry_id uuid references public.progress_entries(id) on delete cascade not null,
  storage_path text not null,
  photo_type text check (photo_type in ('front', 'side', 'back', 'other')),
  created_at timestamptz default now()
);

-- =============================================================
-- MESSAGES (simple inbox, not real-time)
-- =============================================================
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- =============================================================
-- INDEXES
-- =============================================================
create index idx_clients_coach on public.clients(coach_id);
create index idx_clients_profile on public.clients(profile_id);
create index idx_workout_plans_client on public.workout_plans(client_id);
create index idx_workout_plans_coach on public.workout_plans(coach_id);
create index idx_workout_days_plan on public.workout_days(plan_id);
create index idx_workout_exercises_day on public.workout_exercises(workout_day_id);
create index idx_workout_logs_client on public.workout_logs(client_id);
create index idx_workout_log_sets_log on public.workout_log_sets(log_id);
create index idx_meal_plans_client on public.meal_plans(client_id);
create index idx_meal_plans_coach on public.meal_plans(coach_id);
create index idx_meal_plan_days_plan on public.meal_plan_days(plan_id);
create index idx_meals_day on public.meals(day_id);
create index idx_meal_items_meal on public.meal_items(meal_id);
create index idx_recipes_coach on public.recipes(coach_id);
create index idx_check_ins_client on public.check_ins(client_id);
create index idx_progress_entries_client on public.progress_entries(client_id);
create index idx_progress_entries_date on public.progress_entries(client_id, date);
create index idx_messages_client on public.messages(client_id, created_at);
create index idx_foods_name on public.foods(name);

-- =============================================================
-- UPDATED_AT TRIGGERS
-- =============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.clients
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.workout_plans
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.meal_plans
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.recipes
  for each row execute function public.handle_updated_at();

-- =============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, first_name, last_name, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client'),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
