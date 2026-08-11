-- 1. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('escola', 'sicredi', 'prefeitura')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create schools table
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  responsible TEXT,
  coordinator TEXT,
  address TEXT,
  current_balance INTEGER DEFAULT 0 NOT NULL,
  total_received INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  enrollment TEXT UNIQUE NOT NULL,
  school TEXT NOT NULL,
  ecotrocas INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create vendors table
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  total_redeemed INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create deliveries table
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  containers INTEGER DEFAULT 0,
  pet_units INTEGER DEFAULT 0,
  tetra_pak_units INTEGER DEFAULT 0,
  aluminum_units INTEGER DEFAULT 0,
  plastic_units INTEGER DEFAULT 0,
  oil_liters NUMERIC(5,2) DEFAULT 0,
  ecotrocas_earned INTEGER NOT NULL,
  received_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create school_allocations table
CREATE TABLE public.school_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  delivered_by TEXT,
  received_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create redemptions table
CREATE TABLE public.redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Create sicredi_budget table for managing total allocated funds
CREATE TABLE public.sicredi_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_budget NUMERIC(10,2) DEFAULT 50000.00 NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) - Disabled for development
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sicredi_budget DISABLE ROW LEVEL SECURITY;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (
    new.id, 
    COALESCE(
      (new.raw_user_meta_data->>'role')::text, 
      CASE 
        WHEN new.email LIKE '%sicredi%' THEN 'sicredi'
        WHEN new.email LIKE '%prefeitura%' THEN 'prefeitura'
        ELSE 'escola'
      END
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update school balance when allocations are made (by Prefeitura)
CREATE OR REPLACE FUNCTION public.update_school_balance_on_allocation()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.schools
    SET total_received = total_received + NEW.amount,
        current_balance = current_balance + NEW.amount
    WHERE id = NEW.school_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_school_balance
  AFTER INSERT ON public.school_allocations
  FOR EACH ROW EXECUTE FUNCTION update_school_balance_on_allocation();

-- Function to update school balance when deliveries are made (by Escola)
-- NOTE: Allows negative balance (school can distribute before receiving physical bills)
CREATE OR REPLACE FUNCTION public.update_school_balance_on_delivery()
RETURNS TRIGGER AS $$
DECLARE
    student_school_name TEXT;
    target_school_id UUID;
BEGIN
    SELECT school INTO student_school_name FROM public.students WHERE id = NEW.student_id;
    SELECT id INTO target_school_id FROM public.schools WHERE name = student_school_name;
    
    IF target_school_id IS NOT NULL THEN
        UPDATE public.schools
        SET total_distributed = total_distributed + NEW.ecotrocas_earned,
            current_balance = current_balance - NEW.ecotrocas_earned
        WHERE id = target_school_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_school_balance_delivery
  AFTER INSERT ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION update_school_balance_on_delivery();

-- Function to auto-create school record when a student references a new school name
CREATE OR REPLACE FUNCTION public.ensure_school_exists()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.schools (name)
    VALUES (NEW.school)
    ON CONFLICT (name) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_school_exists
  BEFORE INSERT OR UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION ensure_school_exists();
