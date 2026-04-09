-- Add image_url to meal_plans for cover images
ALTER TABLE public.meal_plans ADD COLUMN IF NOT EXISTS image_url text;
