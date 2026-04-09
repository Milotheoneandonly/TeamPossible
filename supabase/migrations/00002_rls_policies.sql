-- =============================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================

-- Helper: Check if current user is the coach
create or replace function public.is_coach()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'coach'
  );
$$ language sql stable security definer;

-- Helper: Get current user's client record ID
create or replace function public.my_client_id()
returns uuid as $$
  select id from public.clients
  where profile_id = auth.uid()
  limit 1;
$$ language sql stable security definer;

-- PROFILES
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (id = auth.uid());
create policy "Coach can view all profiles" on public.profiles for select using (is_coach());
create policy "Users can update own profile" on public.profiles for update using (id = auth.uid());

-- CLIENTS
alter table public.clients enable row level security;
create policy "Coach can do everything with clients" on public.clients for all using (is_coach());
create policy "Client can view own record" on public.clients for select using (profile_id = auth.uid());

-- EXERCISE CATEGORIES
alter table public.exercise_categories enable row level security;
create policy "Everyone can view categories" on public.exercise_categories for select to authenticated using (true);
create policy "Coach can manage categories" on public.exercise_categories for all using (is_coach());

-- EXERCISES
alter table public.exercises enable row level security;
create policy "Everyone can view exercises" on public.exercises for select to authenticated using (true);
create policy "Coach can manage exercises" on public.exercises for all using (is_coach());

-- WORKOUT PLANS
alter table public.workout_plans enable row level security;
create policy "Coach can manage all workout plans" on public.workout_plans for all using (is_coach());
create policy "Client can view own workout plans" on public.workout_plans for select using (client_id = my_client_id());

-- WORKOUT DAYS
alter table public.workout_days enable row level security;
create policy "Coach can manage workout days" on public.workout_days for all using (is_coach());
create policy "Client can view own workout days" on public.workout_days for select using (
  exists (select 1 from public.workout_plans wp where wp.id = workout_days.plan_id and wp.client_id = my_client_id())
);

-- WORKOUT EXERCISES
alter table public.workout_exercises enable row level security;
create policy "Coach can manage workout exercises" on public.workout_exercises for all using (is_coach());
create policy "Client can view own workout exercises" on public.workout_exercises for select using (
  exists (
    select 1 from public.workout_days wd
    join public.workout_plans wp on wp.id = wd.plan_id
    where wd.id = workout_exercises.workout_day_id and wp.client_id = my_client_id()
  )
);

-- WORKOUT LOGS
alter table public.workout_logs enable row level security;
create policy "Coach can view all workout logs" on public.workout_logs for select using (is_coach());
create policy "Client can manage own workout logs" on public.workout_logs for all using (client_id = my_client_id());

-- WORKOUT LOG SETS
alter table public.workout_log_sets enable row level security;
create policy "Coach can view all log sets" on public.workout_log_sets for select using (is_coach());
create policy "Client can manage own log sets" on public.workout_log_sets for all using (
  exists (select 1 from public.workout_logs wl where wl.id = workout_log_sets.log_id and wl.client_id = my_client_id())
);

-- FOODS
alter table public.foods enable row level security;
create policy "Everyone can view foods" on public.foods for select to authenticated using (true);
create policy "Coach can manage foods" on public.foods for all using (is_coach());

-- RECIPES
alter table public.recipes enable row level security;
create policy "Everyone can view recipes" on public.recipes for select to authenticated using (true);
create policy "Coach can manage recipes" on public.recipes for all using (is_coach());

-- RECIPE INGREDIENTS
alter table public.recipe_ingredients enable row level security;
create policy "Everyone can view recipe ingredients" on public.recipe_ingredients for select to authenticated using (true);
create policy "Coach can manage recipe ingredients" on public.recipe_ingredients for all using (is_coach());

-- MEAL PLANS
alter table public.meal_plans enable row level security;
create policy "Coach can manage all meal plans" on public.meal_plans for all using (is_coach());
create policy "Client can view own meal plans" on public.meal_plans for select using (client_id = my_client_id());

-- MEAL PLAN DAYS
alter table public.meal_plan_days enable row level security;
create policy "Coach can manage meal plan days" on public.meal_plan_days for all using (is_coach());
create policy "Client can view own meal plan days" on public.meal_plan_days for select using (
  exists (select 1 from public.meal_plans mp where mp.id = meal_plan_days.plan_id and mp.client_id = my_client_id())
);

-- MEALS
alter table public.meals enable row level security;
create policy "Coach can manage meals" on public.meals for all using (is_coach());
create policy "Client can view own meals" on public.meals for select using (
  exists (
    select 1 from public.meal_plan_days mpd
    join public.meal_plans mp on mp.id = mpd.plan_id
    where mpd.id = meals.day_id and mp.client_id = my_client_id()
  )
);

-- MEAL ITEMS
alter table public.meal_items enable row level security;
create policy "Coach can manage meal items" on public.meal_items for all using (is_coach());
create policy "Client can view own meal items" on public.meal_items for select using (
  exists (
    select 1 from public.meals m
    join public.meal_plan_days mpd on mpd.id = m.day_id
    join public.meal_plans mp on mp.id = mpd.plan_id
    where m.id = meal_items.meal_id and mp.client_id = my_client_id()
  )
);

-- CHECK-IN TEMPLATES
alter table public.check_in_templates enable row level security;
create policy "Coach can manage check-in templates" on public.check_in_templates for all using (is_coach());
create policy "Client can view templates" on public.check_in_templates for select to authenticated using (true);

-- CHECK-IN QUESTIONS
alter table public.check_in_questions enable row level security;
create policy "Coach can manage questions" on public.check_in_questions for all using (is_coach());
create policy "Client can view questions" on public.check_in_questions for select to authenticated using (true);

-- CHECK-INS
alter table public.check_ins enable row level security;
create policy "Coach can manage all check-ins" on public.check_ins for all using (is_coach());
create policy "Client can manage own check-ins" on public.check_ins for all using (client_id = my_client_id());

-- CHECK-IN RESPONSES
alter table public.check_in_responses enable row level security;
create policy "Coach can view all responses" on public.check_in_responses for select using (is_coach());
create policy "Client can manage own responses" on public.check_in_responses for all using (
  exists (select 1 from public.check_ins ci where ci.id = check_in_responses.check_in_id and ci.client_id = my_client_id())
);

-- PROGRESS ENTRIES
alter table public.progress_entries enable row level security;
create policy "Coach can view all progress" on public.progress_entries for select using (is_coach());
create policy "Client can manage own progress" on public.progress_entries for all using (client_id = my_client_id());

-- PROGRESS PHOTOS
alter table public.progress_photos enable row level security;
create policy "Coach can view all photos" on public.progress_photos for select using (is_coach());
create policy "Client can manage own photos" on public.progress_photos for all using (
  exists (select 1 from public.progress_entries pe where pe.id = progress_photos.progress_entry_id and pe.client_id = my_client_id())
);

-- MESSAGES
alter table public.messages enable row level security;
create policy "Coach can manage all messages" on public.messages for all using (is_coach());
create policy "Client can view own messages" on public.messages for select using (client_id = my_client_id());
create policy "Client can insert own messages" on public.messages for insert with check (
  sender_id = auth.uid() and client_id = my_client_id()
);
create policy "Client can mark own messages as read" on public.messages for update using (
  client_id = my_client_id()
);
