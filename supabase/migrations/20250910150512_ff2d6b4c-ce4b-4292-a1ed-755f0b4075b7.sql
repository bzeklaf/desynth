-- Create crypto escrows table
CREATE TABLE public.crypto_escrows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  buyer_address TEXT NOT NULL,
  facility_address TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  token_address TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'sepolia',
  status TEXT NOT NULL DEFAULT 'created',
  funding_tx_hash TEXT,
  release_tx_hash TEXT,
  dispute_winner TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  funded_at TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  disputed_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blockchain transactions table
CREATE TABLE public.blockchain_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  tx_hash TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'escrow_funding', 'escrow_release', 'nft_mint', etc.
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
  block_number BIGINT,
  gas_used BIGINT,
  gas_price BIGINT,
  from_address TEXT,
  to_address TEXT,
  value_wei TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create slot NFTs table
CREATE TABLE public.slot_nfts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  token_id BIGINT,
  owner_address TEXT NOT NULL,
  metadata JSONB,
  contract_address TEXT,
  network TEXT NOT NULL DEFAULT 'sepolia',
  minted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  transferred_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create insurance claims table
CREATE TABLE public.insurance_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  claimant_id UUID NOT NULL REFERENCES public.profiles(user_id),
  claim_type TEXT NOT NULL, -- 'qa_failure', 'facility_default', 'force_majeure'
  claim_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'paid'
  evidence_urls TEXT[],
  description TEXT,
  admin_notes TEXT,
  approved_amount NUMERIC,
  payout_tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.crypto_escrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crypto_escrows
CREATE POLICY "Users can view escrows for their bookings" 
ON public.crypto_escrows 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = crypto_escrows.booking_id 
    AND bookings.buyer_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.bookings 
    JOIN public.slots ON bookings.slot_id = slots.id
    JOIN public.facilities ON slots.facility_id = facilities.id
    WHERE bookings.id = crypto_escrows.booking_id 
    AND facilities.owner_user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "System can manage escrows" 
ON public.crypto_escrows 
FOR ALL 
USING (true);

-- RLS Policies for blockchain_transactions
CREATE POLICY "Users can view transactions for their bookings" 
ON public.blockchain_transactions 
FOR SELECT 
USING (
  booking_id IS NULL OR
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = blockchain_transactions.booking_id 
    AND bookings.buyer_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.bookings 
    JOIN public.slots ON bookings.slot_id = slots.id
    JOIN public.facilities ON slots.facility_id = facilities.id
    WHERE bookings.id = blockchain_transactions.booking_id 
    AND facilities.owner_user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "System can manage transactions" 
ON public.blockchain_transactions 
FOR ALL 
USING (true);

-- RLS Policies for slot_nfts
CREATE POLICY "Users can view their NFTs" 
ON public.slot_nfts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = slot_nfts.booking_id 
    AND bookings.buyer_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "System can manage NFTs" 
ON public.slot_nfts 
FOR ALL 
USING (true);

-- RLS Policies for insurance_claims
CREATE POLICY "Users can manage their own claims" 
ON public.insurance_claims 
FOR ALL 
USING (claimant_id = auth.uid());

CREATE POLICY "Admins can manage all claims" 
ON public.insurance_claims 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create indexes for better performance
CREATE INDEX idx_crypto_escrows_booking_id ON public.crypto_escrows(booking_id);
CREATE INDEX idx_crypto_escrows_status ON public.crypto_escrows(status);
CREATE INDEX idx_blockchain_transactions_tx_hash ON public.blockchain_transactions(tx_hash);
CREATE INDEX idx_blockchain_transactions_booking_id ON public.blockchain_transactions(booking_id);
CREATE INDEX idx_slot_nfts_booking_id ON public.slot_nfts(booking_id);
CREATE INDEX idx_slot_nfts_owner_address ON public.slot_nfts(owner_address);
CREATE INDEX idx_insurance_claims_claimant_id ON public.insurance_claims(claimant_id);
CREATE INDEX idx_insurance_claims_status ON public.insurance_claims(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_crypto_escrows_updated_at
    BEFORE UPDATE ON public.crypto_escrows
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blockchain_transactions_updated_at
    BEFORE UPDATE ON public.blockchain_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_slot_nfts_updated_at
    BEFORE UPDATE ON public.slot_nfts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_insurance_claims_updated_at
    BEFORE UPDATE ON public.insurance_claims
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();