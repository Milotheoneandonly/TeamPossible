-- Client-document assignments (which files/lessons are shared with which client)
create table public.client_documents (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  content_file_id uuid references public.content_files(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  created_at timestamptz default now(),
  constraint file_or_lesson check (
    (content_file_id is not null and lesson_id is null) or
    (content_file_id is null and lesson_id is not null)
  )
);

create index idx_client_documents_client on public.client_documents(client_id);

alter table public.client_documents enable row level security;
create policy "Coach can manage client documents" on public.client_documents for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'coach')
);
create policy "Client can view own documents" on public.client_documents for select using (
  client_id = (select id from public.clients where profile_id = auth.uid() limit 1)
);
