-- Comment on deprecated tables that are no longer used in the simplified blockchain model
-- These tables remain for historical data but are not actively used

COMMENT ON TABLE public.insurance_claims IS 'DEPRECATED: Insurance claims feature removed. Table kept for historical data only.';
COMMENT ON TABLE public.slot_nfts IS 'DEPRECATED: NFT tokenization feature removed. Table kept for historical data only.';
COMMENT ON TABLE public.nft_marketplace_listings IS 'DEPRECATED: NFT marketplace removed. Table kept for historical data only.';
COMMENT ON TABLE public.claims IS 'DEPRECATED: Claims/tokenization feature removed. Table kept for historical data only.';
COMMENT ON TABLE public.resale_listings IS 'DEPRECATED: Resale marketplace removed. Table kept for historical data only.';

-- Add comments to clarify the simplified model
COMMENT ON TABLE public.bookings IS 'Main bookings table. Supports payments via: 1) Stripe (credit card) or 2) ETH via Sepolia to escrow wallet';
COMMENT ON TABLE public.crypto_escrows IS 'Simple escrow records for crypto payments. Tracks ETH payments sent to platform escrow wallet on Sepolia testnet';
COMMENT ON TABLE public.blockchain_transactions IS 'Blockchain transaction records for crypto payments only (no NFTs or complex contracts)';
