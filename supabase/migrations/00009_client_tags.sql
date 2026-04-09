-- Add tags column to clients for labels like "COMP"
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
