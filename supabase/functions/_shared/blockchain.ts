// Shared blockchain utilities

export interface TransactionVerification {
  verified: boolean;
  blockNumber?: number;
  confirmations?: number;
  gasUsed?: string;
}

export async function verifyTransaction(
  txHash: string,
  network: string = 'sepolia'
): Promise<TransactionVerification> {
  try {
    const alchemyKey = Deno.env.get('ALCHEMY_API_KEY');
    if (!alchemyKey) {
      throw new Error('Alchemy API key not configured');
    }

    const rpcUrl = `https://eth-${network}.g.alchemy.com/v2/${alchemyKey}`;

    // Get transaction receipt
    const receiptResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionReceipt',
        params: [txHash]
      })
    });

    const receiptData = await receiptResponse.json();

    if (receiptData.error) {
      console.error('RPC Error:', receiptData.error);
      return { verified: false };
    }

    const receipt = receiptData.result;
    if (!receipt) {
      return { verified: false };
    }

    // Check if transaction was successful
    const success = receipt.status === '0x1';
    if (!success) {
      return { verified: false };
    }

    // Get current block number
    const blockResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'eth_blockNumber',
        params: []
      })
    });

    const blockData = await blockResponse.json();
    const currentBlock = parseInt(blockData.result, 16);
    const txBlock = parseInt(receipt.blockNumber, 16);
    const confirmations = currentBlock - txBlock;

    return {
      verified: true,
      blockNumber: txBlock,
      confirmations,
      gasUsed: receipt.gasUsed
    };
  } catch (error) {
    console.error('Transaction verification error:', error);
    return { verified: false };
  }
}

export async function estimateGas(
  from: string,
  to: string,
  value: string,
  network: string = 'sepolia'
): Promise<string | null> {
  try {
    const alchemyKey = Deno.env.get('ALCHEMY_API_KEY');
    if (!alchemyKey) return null;

    const rpcUrl = `https://eth-${network}.g.alchemy.com/v2/${alchemyKey}`;

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_estimateGas',
        params: [{
          from,
          to,
          value
        }]
      })
    });

    const data = await response.json();
    return data.result || null;
  } catch (error) {
    console.error('Gas estimation error:', error);
    return null;
  }
}

export const CONTRACT_ADDRESSES = {
  sepolia: {
    escrow: '0x742d35Cc6634C0532925a3b8D30a5f7B5d6e8C29',
    slotTokens: '0x8C5AE1e7CA6C9c0E1b6F0D2E3B4A5F6C7D8E9F10',
    insurancePool: '0x9D6B1F2E8A5C4D3B2A9F8E7D6C5B4A3E2D1C0B9A'
  }
};

// Fee collection wallets - all set to platform wallet for testing
// Replace with actual wallets for production
export const FEE_WALLETS = {
  platformWallet: '0xf2664dBc523ac59892bCFdFF99E184f5372cc5Bc', // Main platform wallet (booking commission, escrow service)
  insurancePool: '0xf2664dBc523ac59892bCFdFF99E184f5372cc5Bc', // Insurance pool fees
  auditorNetwork: '0xf2664dBc523ac59892bCFdFF99E184f5372cc5Bc', // Auditor network fees
  tokenization: '0xf2664dBc523ac59892bCFdFF99E184f5372cc5Bc', // Tokenization fees
  stablecoin: '0xf2664dBc523ac59892bCFdFF99E184f5372cc5Bc', // Stablecoin settlement fees
  priorityMatching: '0xf2664dBc523ac59892bCFdFF99E184f5372cc5Bc', // Priority matching fees
};

export function getContractAddress(network: string, contract: 'escrow' | 'slotTokens' | 'insurancePool'): string {
  return CONTRACT_ADDRESSES[network as keyof typeof CONTRACT_ADDRESSES]?.[contract] || '';
}
