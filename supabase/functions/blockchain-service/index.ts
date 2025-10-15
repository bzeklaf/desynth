import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { createLogger } from '../_shared/logger.ts'
import { 
  checkRateLimit, 
  validateUUID, 
  validateAmount, 
  validateTxHash,
  validateEthAddress,
  AppError,
  createErrorResponse 
} from '../_shared/security.ts'
import { verifyTransaction } from '../_shared/blockchain.ts'

const logger = createLogger('blockchain-service')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BlockchainRequest {
  action: 'create_escrow' | 'confirm_escrow' | 'release_escrow' | 'get_status'
  bookingId?: string
  amount?: string
  facilityAddress?: string
  txHash?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await checkRateLimit(clientIp, { maxRequests: 20, windowMs: 60000 })
    
    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded', { clientIp })
      throw new AppError('RATE_LIMIT_EXCEEDED', 'Too many requests, please try again later', 429)
    }

    const { action, bookingId, amount, facilityAddress, txHash }: BlockchainRequest = await req.json()
    
    logger.info('Blockchain service request', { action, bookingId })

    // Validate environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error('Missing environment variables')
      throw new AppError('CONFIG_ERROR', 'Service configuration error', 500)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    switch (action) {
      case 'create_escrow':
        return await handleCreateEscrow(supabase, bookingId, amount, facilityAddress)
      
      case 'confirm_escrow':
        return await handleConfirmEscrow(supabase, txHash)
      
      case 'release_escrow':
        return await handleReleaseEscrow(supabase, bookingId)
      
      case 'get_status':
        return await handleGetStatus(supabase, bookingId)
      
      default:
        throw new AppError('INVALID_ACTION', 'Invalid action specified', 400)
    }

  } catch (error: any) {
    return createErrorResponse(error, corsHeaders)
  }
})

async function handleCreateEscrow(
  supabase: any,
  bookingId?: string,
  amount?: string,
  facilityAddress?: string
) {
  // Validation
  if (!bookingId || !validateUUID(bookingId)) {
    throw new AppError('INVALID_INPUT', 'Invalid booking ID')
  }
  if (!amount || !validateAmount(amount).valid) {
    throw new AppError('INVALID_INPUT', validateAmount(amount || '').error || 'Invalid amount')
  }
  if (!facilityAddress || !validateEthAddress(facilityAddress)) {
    throw new AppError('INVALID_INPUT', 'Invalid facility address')
  }

  logger.info('Creating escrow', { bookingId, amount, facilityAddress })

  // Check if booking exists
  const { data: booking, error: bookingFetchError } = await supabase
    .from('bookings')
    .select('status, buyer_id, total_amount, fee_breakdown')
    .eq('id', bookingId)
    .single()

  if (bookingFetchError || !booking) {
    throw new AppError('BOOKING_NOT_FOUND', 'Booking not found', 404)
  }

  if (booking.status !== 'reserved') {
    throw new AppError('INVALID_STATE', 'Booking is not in reserved state')
  }

  const baseAmount = parseFloat(amount)
  const feeBreakdown = booking.fee_breakdown || {}
  const totalFees = feeBreakdown.totalFees || 0

  logger.info('Fee breakdown', { baseAmount, totalFees })

  // Update booking status
  const { error: bookingError } = await supabase
    .from('bookings')
    .update({ 
      status: 'payment_processing',
      payment_method: 'crypto'
    })
    .eq('id', bookingId)

  if (bookingError) {
    logger.error('Failed to update booking', bookingError)
    throw new AppError('DATABASE_ERROR', 'Failed to update booking status', 500)
  }

  // Create escrow record
  const { error: escrowError } = await supabase
    .from('crypto_escrows')
    .insert({
      booking_id: bookingId,
      amount: baseAmount,
      buyer_address: '0x0000000000000000000000000000000000000000',
      facility_address: facilityAddress,
      token_address: '0x0000000000000000000000000000000000000000', // ETH
      status: 'created',
      network: 'sepolia'
    })

  if (escrowError) {
    logger.error('Failed to create escrow', escrowError)
    throw new AppError('DATABASE_ERROR', 'Failed to create escrow record', 500)
  }

  logger.info('Escrow created successfully', { bookingId })

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Escrow created successfully',
      data: { 
        bookingId, 
        totalAmount: baseAmount,
        facilityAddress 
      }
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

async function handleConfirmEscrow(supabase: any, txHash?: string) {
  if (!txHash || !validateTxHash(txHash)) {
    throw new AppError('INVALID_INPUT', 'Invalid transaction hash')
  }

  logger.info('Confirming escrow', { txHash })

  // Verify transaction on blockchain
  const verification = await verifyTransaction(txHash, 'sepolia')
  
  if (!verification.verified) {
    throw new AppError('TX_VERIFICATION_FAILED', 'Transaction verification failed or not confirmed')
  }

  if ((verification.confirmations || 0) < 1) {
    throw new AppError('INSUFFICIENT_CONFIRMATIONS', 'Transaction needs more confirmations')
  }

  // Update escrow with transaction hash
  const { data: escrowData, error: confirmError } = await supabase
    .from('crypto_escrows')
    .update({ 
      funding_tx_hash: txHash,
      status: 'funded',
      funded_at: new Date().toISOString()
    })
    .eq('status', 'created')
    .is('funding_tx_hash', null)
    .select('booking_id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (confirmError) {
    logger.error('Failed to confirm escrow', confirmError)
    throw new AppError('DATABASE_ERROR', 'Failed to confirm escrow', 500)
  }

  if (!escrowData) {
    throw new AppError('ESCROW_NOT_FOUND', 'No pending escrow found', 404)
  }

  // Update booking
  const { error: bookingError } = await supabase
    .from('bookings')
    .update({ 
      status: 'confirmed',
      payment_status: 'paid'
    })
    .eq('id', escrowData.booking_id)

  if (bookingError) {
    logger.error('Failed to update booking', bookingError)
  }

  // Create blockchain transaction record
  await supabase
    .from('blockchain_transactions')
    .insert({
      booking_id: escrowData.booking_id,
      tx_hash: txHash,
      type: 'escrow_funding',
      status: 'confirmed',
      block_number: verification.blockNumber,
      gas_used: verification.gasUsed
    })

  logger.info('Escrow confirmed successfully', { txHash, bookingId: escrowData.booking_id })

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Escrow confirmed successfully',
      data: { 
        txHash, 
        bookingId: escrowData.booking_id,
        confirmations: verification.confirmations 
      }
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

async function handleReleaseEscrow(supabase: any, bookingId?: string) {
  if (!bookingId || !validateUUID(bookingId)) {
    throw new AppError('INVALID_INPUT', 'Invalid booking ID')
  }

  logger.info('Releasing escrow', { bookingId })

  // Update booking
  const { error: bookingError } = await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', bookingId)

  if (bookingError) {
    logger.error('Failed to update booking', bookingError)
    throw new AppError('DATABASE_ERROR', 'Failed to update booking', 500)
  }

  // Update escrow
  const { error: escrowError } = await supabase
    .from('crypto_escrows')
    .update({ 
      status: 'released',
      released_at: new Date().toISOString()
    })
    .eq('booking_id', bookingId)

  if (escrowError) {
    logger.error('Failed to release escrow', escrowError)
    throw new AppError('DATABASE_ERROR', 'Failed to release escrow', 500)
  }

  logger.info('Escrow released successfully', { bookingId })

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Escrow released successfully',
      data: { bookingId }
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

async function handleGetStatus(supabase: any, bookingId?: string) {
  if (!bookingId || !validateUUID(bookingId)) {
    throw new AppError('INVALID_INPUT', 'Invalid booking ID')
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      *,
      crypto_escrows (*)
    `)
    .eq('id', bookingId)
    .single()

  if (error || !booking) {
    throw new AppError('BOOKING_NOT_FOUND', 'Booking not found', 404)
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      data: {
        booking,
        escrow: booking.crypto_escrows?.[0] || null
      }
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}
