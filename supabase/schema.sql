-- ==============================================================================
-- Schema para Salario SV en Supabase con Row Level Security (RLS)
-- Cifrado en tránsito (TLS/HTTPS) y en reposo (AES-256 nativo de Supabase)
-- ==============================================================================

-- 1. Tabla de Perfiles Públicos (vinculada a auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  current_hire_date DATE DEFAULT '2023-01-16',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Tabla de Historial de Salarios y Aumentos
CREATE TABLE IF NOT EXISTS public.salary_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  effective_date DATE NOT NULL,
  gross_salary NUMERIC(10, 2) NOT NULL CHECK (gross_salary > 0),
  reason TEXT DEFAULT 'Aumento salarial',
  company_name TEXT DEFAULT NULL,
  hire_date DATE DEFAULT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en salary_history
ALTER TABLE public.salary_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salary_history_select_own"
  ON public.salary_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "salary_history_insert_own"
  ON public.salary_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "salary_history_update_own"
  ON public.salary_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "salary_history_delete_own"
  ON public.salary_history FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Tabla de Libretas Quincenales por Mes (Monthly Ledgers)
CREATE TABLE IF NOT EXISTS public.month_ledgers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  gross_salary NUMERIC(10, 2) DEFAULT NULL,
  q1_items JSONB DEFAULT '[]'::jsonb NOT NULL,
  q2_items JSONB DEFAULT '[]'::jsonb NOT NULL,
  q1_starting_balance NUMERIC(10, 2) DEFAULT NULL,
  q2_starting_balance NUMERIC(10, 2) DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_month_ledger UNIQUE (user_id, year, month)
);

-- Habilitar RLS en month_ledgers
ALTER TABLE public.month_ledgers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "month_ledgers_select_own"
  ON public.month_ledgers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "month_ledgers_insert_own"
  ON public.month_ledgers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "month_ledgers_update_own"
  ON public.month_ledgers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "month_ledgers_delete_own"
  ON public.month_ledgers FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Trigger para crear automáticamente el perfil tras el registro en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
