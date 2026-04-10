-- Migration 00016: Add check-in day column to clients
-- 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday
-- NULL = no automatic reminder

ALTER TABLE public.clients ADD COLUMN check_in_day integer CHECK (check_in_day >= 0 AND check_in_day <= 6);
