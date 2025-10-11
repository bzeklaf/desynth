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

interface MonitorRequest {
  action: 'verify_transaction' | 'check_balance' | 'get_gas_price' | 'monitor_escrow';
  txHash?: string;
  address?: string;
  network?: string;
  bookingId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, txHash, address, network, bookingId }: MonitorRequest = await req.json();
    
    console.log(`Processing blockchain monitor action: ${action}`);

    switch (action) {
      case 'verify_transaction':
        return await verifyTransaction(txHash!, network!);
      
      case 'check_balance':
        return await checkBalance(address!, network!);
      
      case 'get_gas_price':
        return await getGasPrice(network!);
      
      case 'monitor_escrow':
        return await monitorEscrow(bookingId!);
      
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: any) {
    console.error('Error in blockchain-monitor function:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function verifyTransaction(txHash: string, network: string) {
  console.log(`Verifying transaction ${txHash} on ${network}`);
  
  const rpcUrl = getRpcUrl(network);
  
  try {
    // Get transaction receipt
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 1
      })
    });

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error.message);
    }

    const receipt = result.result;
    const isSuccess = receipt && receipt.status === '0x1';
    
    // Update transaction status in database
    await supabase
      .from('blockchain_transactions')
      .update({
        status: isSuccess ? 'confirmed' : 'failed',
        block_number: receipt?.blockNumber ? parseInt(receipt.blockNumber, 16) : null,
        gas_used: receipt?.gasUsed ? parseInt(receipt.gasUsed, 16) : null,
        updated_at: new Date().toISOString()
      })
      .eq('tx_hash', txHash);

    return new Response(JSON.stringify({ 
      success: true, 
      verified: isSuccess,
      receipt: receipt,
      blockNumber: receipt?.blockNumber ? parseInt(receipt.blockNumber, 16) : null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error verifying transaction:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error?.message || 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function checkBalance(address: string, network: string) {
  console.log(`Checking balance for ${address} on ${network}`);
  
  const rpcUrl = getRpcUrl(network);
  
  try {
    // Get ETH balance
    const ethResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1
      })
    });

    const ethResult = await ethResponse.json();
    const ethBalance = ethResult.result ? parseInt(ethResult.result, 16) / 1e18 : 0;

    // Get USDC balance (example token contract call)
    const usdcAddress = getUsdcAddress(network);
    const usdcBalance = await getTokenBalance(address, usdcAddress, rpcUrl);

    return new Response(JSON.stringify({ 
      success: true, 
      balances: {
        eth: ethBalance,
        usdc: usdcBalance
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error checking balance:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error?.message || 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function getGasPrice(network: string) {
  console.log(`Getting gas price for ${network}`);
  
  const rpcUrl = getRpcUrl(network);
  
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_gasPrice',
        params: [],
        id: 1
      })
    });

    const result = await response.json();
    const gasPrice = result.result ? parseInt(result.result, 16) / 1e9 : 0; // Convert to Gwei

    return new Response(JSON.stringify({ 
      success: true, 
      gasPrice: gasPrice,
      gasPriceWei: result.result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error getting gas price:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error?.message || 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function monitorEscrow(bookingId: string) {
  console.log(`Monitoring escrow for booking ${bookingId}`);
  
  try {
    // Get escrow data
    const { data: escrow, error } = await supabase
      .from('crypto_escrows')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (error || !escrow) {
      throw new Error('Escrow not found');
    }

    // Check if funding transaction is confirmed
    if (escrow.funding_tx_hash && escrow.status === 'funded') {
      const verificationResult = await verifyTransaction(escrow.funding_tx_hash, escrow.network);
      const verificationData = await verificationResult.json();
      
      if (verificationData.verified) {
        // Update escrow as confirmed
        await supabase
          .from('crypto_escrows')
          .update({
            status: 'confirmed',
            confirmed_at: new Date().toISOString()
          })
          .eq('booking_id', bookingId);
      }
    }

    // Get updated escrow data
    const { data: updatedEscrow } = await supabase
      .from('crypto_escrows')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    return new Response(JSON.stringify({ 
      success: true, 
      escrow: updatedEscrow
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error monitoring escrow:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error?.message || 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function getTokenBalance(address: string, tokenAddress: string, rpcUrl: string) {
  try {
    // ERC20 balanceOf function signature
    const functionSignature = '0x70a08231'; // balanceOf(address)
    const paddedAddress = address.slice(2).padStart(64, '0');
    const data = functionSignature + paddedAddress;

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          to: tokenAddress,
          data: data
        }, 'latest'],
        id: 1
      })
    });

    const result = await response.json();
    const balance = result.result ? parseInt(result.result, 16) / 1e6 : 0; // USDC has 6 decimals
    return balance;
  } catch (error: any) {
    console.error('Error getting token balance:', error);
    return 0;
  }
}

function getRpcUrl(network: string): string {
  switch (network.toLowerCase()) {
    case 'sepolia':
      return `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`;
    case 'arbitrum-sepolia':
      return `https://arb-sepolia.g.alchemy.com/v2/${alchemyApiKey}`;
    default:
      return `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`;
  }
}

function getUsdcAddress(network: string): string {
  switch (network.toLowerCase()) {
    case 'sepolia':
      return '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
    case 'arbitrum-sepolia':
      return '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';
    default:
      return '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
  }
}