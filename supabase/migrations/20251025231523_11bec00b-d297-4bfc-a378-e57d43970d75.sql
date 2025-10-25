-- Create market listings table for secondary market
CREATE TABLE IF NOT EXISTS public.market_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id UUID NOT NULL REFERENCES public.slots(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  seller_type TEXT NOT NULL CHECK (seller_type IN ('facility', 'buyer')),
  original_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  listing_price NUMERIC NOT NULL CHECK (listing_price > 0),
  original_price NUMERIC NOT NULL,
  discount_percentage NUMERIC GENERATED ALWAYS AS (
    ROUND(((original_price - listing_price) / original_price * 100)::numeric, 2)
  ) STORED,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled', 'expired')),
  listed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  sold_at TIMESTAMP WITH TIME ZONE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create market transactions table
CREATE TABLE IF NOT EXISTS public.market_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.market_listings(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES public.slots(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  transaction_amount NUMERIC NOT NULL CHECK (transaction_amount > 0),
  platform_fee NUMERIC NOT NULL DEFAULT 0,
  seller_net_amount NUMERIC NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.market_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for market_listings
CREATE POLICY "Anyone can view active listings"
  ON public.market_listings
  FOR SELECT
  USING (status = 'active' OR seller_id = auth.uid());

CREATE POLICY "Sellers can create their own listings"
  ON public.market_listings
  FOR INSERT
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update their own listings"
  ON public.market_listings
  FOR UPDATE
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can delete their own listings"
  ON public.market_listings
  FOR DELETE
  USING (seller_id = auth.uid());

-- RLS Policies for market_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.market_transactions
  FOR SELECT
  USING (seller_id = auth.uid() OR buyer_id = auth.uid());

CREATE POLICY "System can create transactions"
  ON public.market_transactions
  FOR INSERT
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_market_listings_status ON public.market_listings(status);
CREATE INDEX idx_market_listings_seller ON public.market_listings(seller_id);
CREATE INDEX idx_market_listings_slot ON public.market_listings(slot_id);
CREATE INDEX idx_market_transactions_buyer ON public.market_transactions(buyer_id);
CREATE INDEX idx_market_transactions_seller ON public.market_transactions(seller_id);

-- Trigger for updated_at
CREATE TRIGGER update_market_listings_updated_at
  BEFORE UPDATE ON public.market_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically expire old listings
CREATE OR REPLACE FUNCTION expire_old_market_listings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.market_listings
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < now();
END;
$$;