-- =============================================================
-- Add structured check-in answers column
-- Stores the 9 weekly check-in questions as a JSONB object
-- Keys: training, nutrition, motivation, hydration_steps,
--       injury, menstruation, wins, improvement, questions
-- =============================================================

alter table public.progress_entries
  add column if not exists check_in_answers jsonb;
