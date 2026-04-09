-- Storage policies for recipe-images bucket
CREATE POLICY "Anyone can view recipe images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'recipe-images');

CREATE POLICY "Coaches can upload recipe images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'recipe-images');

CREATE POLICY "Coaches can update recipe images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'recipe-images');
