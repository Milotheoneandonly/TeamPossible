-- Fix: Allow coach to update client profiles (for avatar upload etc.)
CREATE POLICY "Coach can update all profiles"
ON public.profiles FOR UPDATE
USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'coach')
);
