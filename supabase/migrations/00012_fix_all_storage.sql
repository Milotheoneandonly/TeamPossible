-- Fix storage policies for content-files bucket (had 0 policies)
CREATE POLICY "Anyone can view content files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'content-files');

CREATE POLICY "Coaches can upload content files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'content-files');

CREATE POLICY "Coaches can update content files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'content-files');

CREATE POLICY "Coaches can delete content files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'content-files');
