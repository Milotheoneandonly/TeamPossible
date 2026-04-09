-- =============================================================
-- CONTENT: FILES & LESSONS
-- =============================================================

-- Files (PDFs, images, documents uploaded by coach)
create table public.content_files (
  id uuid default uuid_generate_v4() primary key,
  coach_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  file_url text not null,
  file_type text,
  file_size_bytes int,
  created_at timestamptz default now()
);

-- Lessons (rich content with media)
create table public.lessons (
  id uuid default uuid_generate_v4() primary key,
  coach_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  subtitle text,
  message text,
  media_url text,
  media_type text,
  status text default 'published' check (status in ('draft', 'published')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_content_files_coach on public.content_files(coach_id);
create index idx_lessons_coach on public.lessons(coach_id);

-- RLS
alter table public.content_files enable row level security;
create policy "Coach can manage files" on public.content_files for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'coach')
);
create policy "Clients can view files" on public.content_files for select to authenticated using (true);

alter table public.lessons enable row level security;
create policy "Coach can manage lessons" on public.lessons for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'coach')
);
create policy "Clients can view published lessons" on public.lessons for select to authenticated using (status = 'published');

-- Updated_at trigger for lessons
create trigger set_updated_at before update on public.lessons
  for each row execute function public.handle_updated_at();

-- Storage policies for content-files bucket
-- (Run these only if you created a 'content-files' bucket)
