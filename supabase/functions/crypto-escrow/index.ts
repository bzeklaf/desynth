import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface EscrowOperation {
  action: 'create' | 'fund' | 'release' | 'status';
  bookingId: string;
  txHash?: string;
  buyerAddress?: string;
  facilityAddress?: string;
  amount?: string;
  network?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, bookingId, txHash, buyerAddress, facilityAddress, amount, network }: EscrowOperation = await req.json();

    console.log(`Processing escrow operation: ${action} for booking ${bookingId}`);

    switch (action) {
      case 'create':
        return await createEscrow(bookingId, buyerAddress!, facilityAddress!, amount!, network || 'sepolia');
      
      case 'fund':
        return await fundEscrow(bookingId, txHash!);
      
      case 'release':
        return await releaseEscrow(bookingId);
      
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

async function createEscrow(bookingId: string, buyerAddress: string, facilityAddress: string, amount: string, network: string) {
  console.log(`Creating escrow for booking ${bookingId}`);
  
  // Insert escrow record into database
  const { data, error } = await supabase
    .from('crypto_escrows')
    .insert({
      booking_id: bookingId,
      buyer_address: buyerAddress,
      facility_address: facilityAddress,
      amount: amount,
      token_address: '0x0000000000000000000000000000000000000000', // ETH
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
      payment_status: 'paid',
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
  
  // Check if booking is completed
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error('Booking not found');
  }

  if (booking.status !== 'completed') {
    throw new Error('Cannot release escrow: Booking not completed');
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

  // Create notification
  await supabase
    .from('notifications')
    .insert({
      user_id: booking.buyer_id,
      type: 'payment',
      title: 'Escrow Released',
      message: `Payment for booking ${bookingId} has been released.`,
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
