-- Create revenue settings table for admin configuration
CREATE TABLE public.revenue_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_rates JSONB NOT NULL DEFAULT '{
    "bookingCommission": {"min": 0.05, "max": 0.15, "default": 0.10},
    "escrowServiceFee": {"min": 0.005, "max": 0.01, "default": 0.0075},
    "tokenizationFee": {"flat": 25, "percentage": 0.00375},
    "stablecoinSettlementFee": {"min": 0.005, "max": 0.01, "default": 0.0075},
    "insurancePoolFee": {"min": 0.0025, "max": 0.005, "default": 0.00375},
    "auditorNetworkFee": {"min": 250, "max": 500, "default": 375},
    "priorityMatchingFee": {"min": 0.02, "max": 0.05, "default": 0.035}
  }'::jsonb,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add fee tracking to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS fee_breakdown JSONB;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_vertical TEXT DEFAULT 'cloud_lab';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS facility_type TEXT DEFAULT 'manufacturing';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS is_priority BOOLEAN DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS requires_tokenization BOOLEAN DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS requires_insurance BOOLEAN DEFAULT false;

-- Create facility subscriptions table
CREATE TABLE public.facility_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
  monthly_price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'suspended')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 month'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create revenue analytics table for tracking platform revenue
CREATE TABLE public.revenue_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  revenue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  base_amount DECIMAL(12,2) NOT NULL,
  booking_commission DECIMAL(12,2) NOT NULL DEFAULT 0,
  escrow_service_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  tokenization_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  stablecoin_settlement_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  insurance_pool_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  auditor_network_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  priority_matching_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_fees DECIMAL(12,2) NOT NULL,
  net_to_facility DECIMAL(12,2) NOT NULL,
  payment_method TEXT NOT NULL,
  booking_vertical TEXT NOT NULL,
  facility_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.revenue_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for revenue_settings
CREATE POLICY "Only admins can manage revenue settings" ON public.revenue_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for facility_subscriptions
CREATE POLICY "Facility owners can view their subscriptions" ON public.facility_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.facilities 
      WHERE facilities.id = facility_subscriptions.facility_id 
      AND facilities.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all subscriptions" ON public.facility_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for revenue_analytics
CREATE POLICY "Facilities can view their revenue analytics" ON public.revenue_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.facilities 
      WHERE facilities.id = revenue_analytics.facility_id 
      AND facilities.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can view their spending analytics" ON public.revenue_analytics
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Admins can view all revenue analytics" ON public.revenue_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert revenue analytics" ON public.revenue_analytics
  FOR INSERT WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX idx_revenue_analytics_facility_date ON public.revenue_analytics(facility_id, revenue_date);
CREATE INDEX idx_revenue_analytics_buyer_date ON public.revenue_analytics(buyer_id, revenue_date);
CREATE INDEX idx_facility_subscriptions_facility ON public.facility_subscriptions(facility_id);

-- Update trigger for updated_at columns
CREATE TRIGGER update_revenue_settings_updated_at
  BEFORE UPDATE ON public.revenue_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_facility_subscriptions_updated_at
  BEFORE UPDATE ON public.facility_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_revenue_analytics_updated_at
  BEFORE UPDATE ON public.revenue_analytics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();