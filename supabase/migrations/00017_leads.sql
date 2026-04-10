-- Migration 00017: Leads management table
-- Pipeline: ny (new) → kontaktad (contacted) → vunnen (won/converted)

CREATE TABLE public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES public.profiles(id) NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  country TEXT DEFAULT 'Sverige',
  status TEXT NOT NULL DEFAULT 'ny' CHECK (status IN ('ny', 'kontaktad', 'vunnen')),
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_leads_coach ON public.leads(coach_id);
CREATE INDEX idx_leads_status ON public.leads(status);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach full access leads" ON public.leads
  FOR ALL USING (coach_id = auth.uid());
