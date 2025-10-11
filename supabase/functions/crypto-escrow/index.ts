import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const alchemyApiKey = Deno.env.get('ALCHEMY_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface EscrowOperation {
  action: 'create' | 'fund' | 'release' | 'dispute' | 'resolve' | 'status';
  bookingId: string;
  txHash?: string;
  buyerAddress?: string;
  facilityAddress?: string;
  amount?: string;
  tokenAddress?: string;
  network?: string;
  disputeWinner?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, bookingId, txHash, buyerAddress, facilityAddress, amount, tokenAddress, network, disputeWinner }: EscrowOperation = await req.json();

    console.log(`Processing escrow operation: ${action} for booking ${bookingId}`);

    switch (action) {
      case 'create':
        return await createEscrow(bookingId, buyerAddress!, facilityAddress!, amount!, tokenAddress!, network!);
      
      case 'fund':
        return await fundEscrow(bookingId, txHash!);
      
      case 'release':
        return await releaseEscrow(bookingId);
      
      case 'dispute':
        return await disputeEscrow(bookingId);
      
      case 'resolve':
        return await resolveDispute(bookingId, disputeWinner!);
      
      case 'status':
        return await getEscrowStatus(bookingId);
      
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: any) {
    console.error('Error in crypto-escrow function:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function createEscrow(bookingId: string, buyerAddress: string, facilityAddress: string, amount: string, tokenAddress: string, network: string) {
  console.log(`Creating escrow for booking ${bookingId}`);
  
  // Insert escrow record into database
  const { data, error } = await supabase
    .from('crypto_escrows')
    .insert({
      booking_id: bookingId,
      buyer_address: buyerAddress,
      facility_address: facilityAddress,
      amount: amount,
      token_address: tokenAddress,
      network: network,
      status: 'created',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating escrow:', error);
    throw new Error('Failed to create escrow record');
  }

  // Update booking with crypto payment info
  await supabase
    .from('bookings')
    .update({
      payment_method: 'crypto',
      payment_status: 'pending'
    })
    .eq('id', bookingId);

  return new Response(JSON.stringify({ 
    success: true, 
    escrowId: data.id,
    message: 'Escrow created successfully' 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function fundEscrow(bookingId: string, txHash: string) {
  console.log(`Funding escrow for booking ${bookingId} with tx ${txHash}`);
  
  // Update escrow status
  const { error } = await supabase
    .from('crypto_escrows')
    .update({
      status: 'funded',
      funding_tx_hash: txHash,
      funded_at: new Date().toISOString()
    })
    .eq('booking_id', bookingId);

  if (error) {
    console.error('Error updating escrow:', error);
    throw new Error('Failed to update escrow status');
  }

  // Update booking payment status
  await supabase
    .from('bookings')
    .update({
      payment_status: 'completed',
      status: 'confirmed'
    })
    .eq('id', bookingId);

  // Create blockchain transaction record
  await supabase
    .from('blockchain_transactions')
    .insert({
      booking_id: bookingId,
      tx_hash: txHash,
      type: 'escrow_funding',
      status: 'completed',
      created_at: new Date().toISOString()
    });

  // Mint slot NFT (placeholder - would call actual minting function)
  await mintSlotNFT(bookingId);

  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Escrow funded successfully',
    txHash: txHash
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function releaseEscrow(bookingId: string) {
  console.log(`Releasing escrow for booking ${bookingId}`);
  
  // Check if booking is completed and audited
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(`
      *,
      attestations (*)
    `)
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error('Booking not found');
  }

  // Check if audit is passed
  const hasPassedAudit = booking.attestations?.some((att: any) => att.result === 'passed');
  if (!hasPassedAudit) {
    throw new Error('Cannot release escrow: Audit not passed');
  }

  // Update escrow status
  const { error } = await supabase
    .from('crypto_escrows')
    .update({
      status: 'released',
      released_at: new Date().toISOString()
    })
    .eq('booking_id', bookingId);

  if (error) {
    console.error('Error releasing escrow:', error);
    throw new Error('Failed to release escrow');
  }

  // Create notification for facility
  await supabase
    .from('notifications')
    .insert({
      user_id: booking.buyer_id, // Would need facility user ID
      type: 'payment',
      title: 'Escrow Released',
      message: `Payment for booking ${bookingId} has been released to the facility.`,
      urgent: false,
      read: false
    });

  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Escrow released successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function disputeEscrow(bookingId: string) {
  console.log(`Disputing escrow for booking ${bookingId}`);
  
  const { error } = await supabase
    .from('crypto_escrows')
    .update({
      status: 'disputed',
      disputed_at: new Date().toISOString()
    })
    .eq('booking_id', bookingId);

  if (error) {
    console.error('Error disputing escrow:', error);
    throw new Error('Failed to dispute escrow');
  }

  // Create admin notification for dispute resolution
  const { data: adminUsers } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('role', 'admin');

  if (adminUsers) {
    for (const admin of adminUsers) {
      await supabase
        .from('notifications')
        .insert({
          user_id: admin.user_id,
          type: 'dispute',
          title: 'Escrow Dispute Created',
          message: `Booking ${bookingId} has been disputed and requires admin resolution.`,
          urgent: true,
          read: false
        });
    }
  }

  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Escrow disputed successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function resolveDispute(bookingId: string, winner: string) {
  console.log(`Resolving dispute for booking ${bookingId} in favor of ${winner}`);
  
  const { error } = await supabase
    .from('crypto_escrows')
    .update({
      status: 'resolved',
      dispute_winner: winner,
      resolved_at: new Date().toISOString()
    })
    .eq('booking_id', bookingId);

  if (error) {
    console.error('Error resolving dispute:', error);
    throw new Error('Failed to resolve dispute');
  }

  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Dispute resolved successfully',
    winner: winner
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getEscrowStatus(bookingId: string) {
  const { data, error } = await supabase
    .from('crypto_escrows')
    .select('*')
    .eq('booking_id', bookingId)
    .single();

  if (error) {
    console.error('Error getting escrow status:', error);
    throw new Error('Failed to get escrow status');
  }

  return new Response(JSON.stringify({ 
    success: true, 
    escrow: data
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function mintSlotNFT(bookingId: string) {
  console.log(`Minting slot NFT for booking ${bookingId}`);
  
  // Get booking details
  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      slots (
        title,
        equipment,
        facilities (name, location)
      )
    `)
    .eq('id', bookingId)
    .single();

  if (booking) {
    // Create NFT metadata
    const metadata = {
      name: `DeSynth Slot: ${booking.slots?.title}`,
      description: `Biomanufacturing slot booking NFT for ${booking.slots?.title} at ${booking.slots?.facilities?.name}`,
      attributes: [
        { trait_type: "Facility", value: booking.slots?.facilities?.name },
        { trait_type: "Location", value: booking.slots?.facilities?.location },
        { trait_type: "Equipment", value: booking.slots?.equipment },
        { trait_type: "Booking Date", value: new Date(booking.created_at).toISOString() }
      ]
    };

    // Store NFT data (in real implementation, would interact with smart contract)
    await supabase
      .from('slot_nfts')
      .insert({
        booking_id: bookingId,
        owner_address: booking.buyer_id, // Would be buyer's wallet address
        metadata: JSON.stringify(metadata),
        minted_at: new Date().toISOString()
      });

    console.log('Slot NFT minted successfully');
  }
}