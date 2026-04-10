-- Migration 00015: Add editable macro fields + notes to meal_items
-- Allows coach to manually adjust per-item macros for client-specific plans

ALTER TABLE public.meal_items ADD COLUMN calories numeric;
ALTER TABLE public.meal_items ADD COLUMN protein numeric;
ALTER TABLE public.meal_items ADD COLUMN carbs numeric;
ALTER TABLE public.meal_items ADD COLUMN fat numeric;
ALTER TABLE public.meal_items ADD COLUMN notes text;
