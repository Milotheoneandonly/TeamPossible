-- Storage policies for avatars bucket
-- Run this in Supabase SQL Editor

-- Allow anyone authenticated to read avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

-- Allow coaches to upload avatars for anyone
CREATE POLICY "Coaches can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow coaches to update/overwrite avatars
CREATE POLICY "Coaches can update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Allow coaches to delete avatars
CREATE POLICY "Coaches can delete avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
