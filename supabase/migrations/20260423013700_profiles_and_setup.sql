-- ============================================================
-- ValidaVinho — schema completo (analyses + profiles)
-- ============================================================

-- 1) Tabela analyses (já existia em migration anterior, idempotente)
CREATE TABLE IF NOT EXISTS public.analyses (
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

DROP POLICY IF EXISTS "Public can read analyses" ON public.analyses;
DROP POLICY IF EXISTS "Public can insert analyses" ON public.analyses;
DROP POLICY IF EXISTS "Public can update analyses" ON public.analyses;
DROP POLICY IF EXISTS "Public can delete analyses" ON public.analyses;

CREATE POLICY "Public can read analyses" ON public.analyses FOR SELECT USING (true);
CREATE POLICY "Public can insert analyses" ON public.analyses FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update analyses" ON public.analyses FOR UPDATE USING (true);
CREATE POLICY "Public can delete analyses" ON public.analyses FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses (created_at DESC);

-- 2) Tabela profiles (auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  first_name TEXT,
  role TEXT NOT NULL DEFAULT 'franchisee' CHECK (role IN ('admin', 'franchisee')),
  franchise_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role manages profiles" ON public.profiles;

-- Usuário autenticado lê e atualiza apenas o próprio profile
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);
