-- =============================================================
-- Workout plan hero image + per-client exercise notes
-- =============================================================

-- Hero image for workout plans (mirrors meal_plans.image_url)
alter table public.workout_plans
  add column if not exists image_url text;

-- Per-client, per-exercise notes so clients can save private notes
-- per exercise that persist across sessions
create table if not exists public.client_exercise_notes (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) on delete cascade not null,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (client_id, exercise_id)
);

create index if not exists idx_client_exercise_notes_client on public.client_exercise_notes(client_id);
create index if not exists idx_client_exercise_notes_exercise on public.client_exercise_notes(exercise_id);

-- updated_at trigger (function already exists from 00001)
drop trigger if exists set_updated_at on public.client_exercise_notes;
create trigger set_updated_at before update on public.client_exercise_notes
  for each row execute function public.handle_updated_at();

-- RLS: coach sees all, client manages only own
alter table public.client_exercise_notes enable row level security;

drop policy if exists "Coach can view all exercise notes" on public.client_exercise_notes;
create policy "Coach can view all exercise notes"
  on public.client_exercise_notes
  for select
  using (public.is_coach());

drop policy if exists "Client can manage own exercise notes" on public.client_exercise_notes;
create policy "Client can manage own exercise notes"
  on public.client_exercise_notes
  for all
  using (client_id = public.my_client_id());
