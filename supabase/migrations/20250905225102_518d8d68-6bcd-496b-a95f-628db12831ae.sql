-- Create enum types
CREATE TYPE public.user_role AS ENUM ('buyer', 'facility', 'auditor', 'admin');
CREATE TYPE public.compliance_level AS ENUM ('rd', 'gmp', 'gcp');
CREATE TYPE public.booking_status AS ENUM ('reserved', 'in_progress', 'completed', 'cancelled', 'disputed');
CREATE TYPE public.claim_status AS ENUM ('active', 'listed_for_sale', 'sold', 'fractionalized');
CREATE TYPE public.listing_status AS ENUM ('active', 'sold', 'cancelled');
CREATE TYPE public.facility_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE public.attestation_result AS ENUM ('passed', 'failed', 'pending');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'buyer',
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  reputation_score DECIMAL(3,2) DEFAULT 0.00,
  verification_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create facilities table
CREATE TABLE public.facilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  certifications TEXT[],
  reputation_score DECIMAL(3,2) DEFAULT 0.00,
  status facility_status DEFAULT 'pending',
  on_time_percentage DECIMAL(5,2) DEFAULT 0.00,
  qa_pass_rate DECIMAL(5,2) DEFAULT 0.00,
  cancellation_rate DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create slots table
CREATE TABLE public.slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  equipment TEXT NOT NULL,
  compliance_level compliance_level NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_hours INTEGER NOT NULL,
  scale_capacity TEXT,
  qa_deliverables TEXT,
  price DECIMAL(10,2) NOT NULL,
  cancellation_policy TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id UUID NOT NULL REFERENCES public.slots(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  status booking_status DEFAULT 'reserved',
  insurance_flag BOOLEAN DEFAULT FALSE,
  finance_flag BOOLEAN DEFAULT FALSE,
  payment_status TEXT DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create claims table
CREATE TABLE public.claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  fraction DECIMAL(10,8) DEFAULT 1.0,
  status claim_status DEFAULT 'active',
  resale_listing_id UUID,
  token_id TEXT, -- Placeholder for future blockchain integration
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resale_listings table
CREATE TABLE public.resale_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  status listing_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attestations table
CREATE TABLE public.attestations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  auditor_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  facility_sign_off BOOLEAN DEFAULT FALSE,
  auditor_sign_off BOOLEAN DEFAULT FALSE,
  result attestation_result DEFAULT 'pending',
  file_path TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create simulated transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  payee_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  transaction_type TEXT NOT NULL, -- 'booking', 'resale', 'payout'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resale_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for facilities
CREATE POLICY "Anyone can view approved facilities" ON public.facilities
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Facility owners can manage their facilities" ON public.facilities
  FOR ALL USING (owner_user_id = auth.uid());

CREATE POLICY "Admins can manage all facilities" ON public.facilities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for slots
CREATE POLICY "Anyone can view available slots" ON public.slots
  FOR SELECT USING (is_available = true);

CREATE POLICY "Facility owners can manage their slots" ON public.slots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.facilities 
      WHERE id = facility_id AND owner_user_id = auth.uid()
    )
  );

-- Create RLS policies for bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Facility owners can view bookings for their slots" ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.slots s 
      JOIN public.facilities f ON s.facility_id = f.id
      WHERE s.id = slot_id AND f.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (buyer_id = auth.uid());

-- Create RLS policies for claims
CREATE POLICY "Users can view their own claims" ON public.claims
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can manage their own claims" ON public.claims
  FOR ALL USING (owner_id = auth.uid());

-- Create RLS policies for resale listings
CREATE POLICY "Anyone can view active listings" ON public.resale_listings
  FOR SELECT USING (status = 'active');

CREATE POLICY "Sellers can manage their listings" ON public.resale_listings
  FOR ALL USING (seller_id = auth.uid());

-- Create RLS policies for attestations
CREATE POLICY "Auditors can view attestations" ON public.attestations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role IN ('auditor', 'admin')
    )
  );

CREATE POLICY "Auditors can create attestations" ON public.attestations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'auditor'
    )
  );

-- Create RLS policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (payer_id = auth.uid() OR payee_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_facilities_updated_at
  BEFORE UPDATE ON public.facilities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_slots_updated_at
  BEFORE UPDATE ON public.slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_claims_updated_at
  BEFORE UPDATE ON public.claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resale_listings_updated_at
  BEFORE UPDATE ON public.resale_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attestations_updated_at
  BEFORE UPDATE ON public.attestations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();