-- Check if STRIPE_SECRET_KEY secret exists, if not we'll need to add it
-- Add payment_session_id column to bookings table for tracking Stripe sessions
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_session_id TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'credit-card' CHECK (payment_method IN ('credit-card', 'crypto', 'bank-transfer'));

-- Update transactions table to include proper payment tracking
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS blockchain_tx_hash TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'credit-card';

-- Create payment_sessions table for tracking Stripe checkout sessions
CREATE TABLE IF NOT EXISTS public.payment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'canceled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on payment_sessions
ALTER TABLE public.payment_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_sessions
CREATE POLICY "Users can view their own payment sessions" ON public.payment_sessions
FOR SELECT USING (
  booking_id IN (
    SELECT id FROM public.bookings WHERE buyer_id = auth.uid()
  )
);

CREATE POLICY "Service role can insert payment sessions" ON public.payment_sessions
FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update payment sessions" ON public.payment_sessions
FOR UPDATE USING (true);