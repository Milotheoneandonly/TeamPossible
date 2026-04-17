-- =============================================================
-- Add Längd + Stuss measurements to progress entries
-- Create private progress-photos storage bucket for check-in photos
-- =============================================================

-- New measurement columns
alter table public.progress_entries
  add column if not exists height_cm numeric(5,1),
  add column if not exists glutes_cm numeric(5,1);

-- Private bucket for progress/check-in photos (body photos are sensitive)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'progress-photos',
  'progress-photos',
  false,
  15728640, -- 15 MB per file
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 15728640,
  allowed_mime_types = array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

-- Storage RLS policies (RLS on progress_photos table already restricts rows;
-- coaches see all, clients see own — via public.progress_photos policies)
drop policy if exists "Progress photos: authenticated can view" on storage.objects;
create policy "Progress photos: authenticated can view"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'progress-photos');

drop policy if exists "Progress photos: authenticated can insert" on storage.objects;
create policy "Progress photos: authenticated can insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'progress-photos');

drop policy if exists "Progress photos: authenticated can update" on storage.objects;
create policy "Progress photos: authenticated can update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'progress-photos');

drop policy if exists "Progress photos: authenticated can delete" on storage.objects;
create policy "Progress photos: authenticated can delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'progress-photos');
