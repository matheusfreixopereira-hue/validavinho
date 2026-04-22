CREATE TABLE public.analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Análise sem nome',
  address TEXT,
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  selection_type TEXT NOT NULL DEFAULT 'radius',
  radius_meters INTEGER,
  geojson JSONB,
  inhabitants INTEGER NOT NULL DEFAULT 0,
  income_per_capita NUMERIC NOT NULL DEFAULT 0,
  social_class TEXT,
  avg_age INTEGER,
  num_towers INTEGER,
  score INTEGER,
  potential NUMERIC,
  recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read analyses"
  ON public.analyses FOR SELECT
  USING (true);

CREATE POLICY "Public can insert analyses"
  ON public.analyses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update analyses"
  ON public.analyses FOR UPDATE
  USING (true);

CREATE POLICY "Public can delete analyses"
  ON public.analyses FOR DELETE
  USING (true);

CREATE INDEX idx_analyses_created_at ON public.analyses (created_at DESC);