-- ⚠️ WARNING: This migration will DELETE ALL DATA ⚠️
-- Drop all tables, functions, and types, then recreate fresh schema

-- Drop all tables (in dependency order)
DROP TABLE IF EXISTS public.attestations CASCADE;
DROP TABLE IF EXISTS public.audit_findings CASCADE;
DROP TABLE IF EXISTS public.audit_reports CASCADE;
DROP TABLE IF EXISTS public.audit_tasks CASCADE;
DROP TABLE IF EXISTS public.blockchain_transactions CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_channels CASCADE;
DROP TABLE IF EXISTS public.insurance_claims CASCADE;
DROP TABLE IF EXISTS public.nft_marketplace_listings CASCADE;
DROP TABLE IF EXISTS public.slot_nfts CASCADE;
DROP TABLE IF EXISTS public.claims CASCADE;
DROP TABLE IF EXISTS public.resale_listings CASCADE;
DROP TABLE IF EXISTS public.crypto_escrows CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.slots CASCADE;
DROP TABLE IF EXISTS public.payment_sessions CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.revenue_analytics CASCADE;
DROP TABLE IF EXISTS public.revenue_settings CASCADE;
DROP TABLE IF EXISTS public.facility_subscriptions CASCADE;
DROP TABLE IF EXISTS public.facilities CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS public.has_role(uuid, user_role) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Drop all custom types
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.facility_status CASCADE;
DROP TYPE IF EXISTS public.booking_status CASCADE;
DROP TYPE IF EXISTS public.compliance_level CASCADE;
DROP TYPE IF EXISTS public.attestation_result CASCADE;
DROP TYPE IF EXISTS public.claim_status CASCADE;
DROP TYPE IF EXISTS public.listing_status CASCADE;

-- ========================================
-- RECREATE SCHEMA FROM SCRATCH
-- ========================================

-- Create enums
CREATE TYPE public.user_role AS ENUM ('admin', 'auditor', 'facility', 'buyer');
CREATE TYPE public.facility_status AS ENUM ('pending', 'approved', 'suspended');
CREATE TYPE public.booking_status AS ENUM ('reserved', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.compliance_level AS ENUM ('basic', 'gmp', 'fda', 'iso');
CREATE TYPE public.attestation_result AS ENUM ('pending', 'passed', 'failed');
CREATE TYPE public.claim_status AS ENUM ('active', 'listed', 'sold', 'redeemed');
CREATE TYPE public.listing_status AS ENUM ('active', 'sold', 'cancelled');

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text,
  first_name text,
  last_name text,
  role user_role NOT NULL DEFAULT 'buyer',
  reputation_score numeric DEFAULT 0.00,
  verification_status boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Block anonymous access to profiles" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role user_role NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

-- Create security definer functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'auditor' THEN 2
      WHEN 'facility' THEN 3
      WHEN 'buyer' THEN 4
    END
  LIMIT 1
$$;

-- Admin policies for user_roles
CREATE POLICY "Only admins can assign roles" ON public.user_roles
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can modify roles" ON public.user_roles
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can remove roles" ON public.user_roles
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Create trigger functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'buyer')::user_role
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'buyer')::user_role
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create triggers on auth.users
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Create facilities table
CREATE TABLE public.facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  name text NOT NULL,
  location text NOT NULL,
  description text,
  status facility_status DEFAULT 'pending',
  certifications text[],
  reputation_score numeric DEFAULT 0.00,
  on_time_percentage numeric DEFAULT 0.00,
  qa_pass_rate numeric DEFAULT 0.00,
  cancellation_rate numeric DEFAULT 0.00,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view approved facilities" ON public.facilities
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Facility owners can manage their facilities" ON public.facilities
  FOR ALL USING (owner_user_id = auth.uid());

CREATE POLICY "Admins can manage all facilities" ON public.facilities
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_facilities_updated_at
  BEFORE UPDATE ON public.facilities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create slots table
CREATE TABLE public.slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  equipment text NOT NULL,
  compliance_level compliance_level NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  duration_hours integer NOT NULL,
  price numeric NOT NULL,
  is_available boolean DEFAULT true,
  scale_capacity text,
  qa_deliverables text,
  cancellation_policy text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view available slots" ON public.slots
  FOR SELECT USING (is_available = true);

CREATE POLICY "Facility owners can manage their slots" ON public.slots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.facilities
      WHERE facilities.id = slots.facility_id
      AND facilities.owner_user_id = auth.uid()
    )
  );

CREATE TRIGGER update_slots_updated_at
  BEFORE UPDATE ON public.slots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create bookings table
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  slot_id uuid NOT NULL REFERENCES public.slots(id) ON DELETE CASCADE,
  status booking_status DEFAULT 'reserved',
  payment_status text DEFAULT 'pending',
  payment_method text DEFAULT 'credit-card',
  payment_session_id text,
  total_amount numeric NOT NULL,
  fee_breakdown jsonb,
  booking_vertical text DEFAULT 'cloud_lab',
  facility_type text DEFAULT 'manufacturing',
  requires_insurance boolean DEFAULT false,
  requires_tokenization boolean DEFAULT false,
  is_priority boolean DEFAULT false,
  insurance_flag boolean DEFAULT false,
  finance_flag boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (buyer_id = auth.uid());

CREATE POLICY "Facility owners can view bookings for their slots" ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.slots s
      JOIN public.facilities f ON s.facility_id = f.id
      WHERE s.id = bookings.slot_id
      AND f.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Block anonymous access to bookings" ON public.bookings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  read boolean DEFAULT false,
  urgent boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Create revenue_settings table
CREATE TABLE public.revenue_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_rates jsonb NOT NULL DEFAULT '{
    "bookingCommission": {"min": 0.05, "max": 0.15, "default": 0.10},
    "escrowServiceFee": {"min": 0.005, "max": 0.01, "default": 0.0075},
    "insurancePoolFee": {"min": 0.0025, "max": 0.005, "default": 0.00375},
    "auditorNetworkFee": {"min": 250, "max": 500, "default": 375},
    "stablecoinSettlementFee": {"min": 0.005, "max": 0.01, "default": 0.0075},
    "tokenizationFee": {"flat": 25, "percentage": 0.00375},
    "priorityMatchingFee": {"min": 0.02, "max": 0.05, "default": 0.035}
  }'::jsonb,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.revenue_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage revenue settings" ON public.revenue_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_revenue_settings_updated_at
  BEFORE UPDATE ON public.revenue_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default revenue settings
INSERT INTO public.revenue_settings (id) VALUES (gen_random_uuid());