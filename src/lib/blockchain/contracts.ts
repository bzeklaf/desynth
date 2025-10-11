// Smart contract ABIs (simplified for MVP)
export const ESCROW_ABI = [
  {
    "inputs": [
      {"name": "bookingId", "type": "string"},
      {"name": "buyer", "type": "address"},
      {"name": "facility", "type": "address"},
      {"name": "amount", "type": "uint256"},
      {"name": "token", "type": "address"}
    ],
    "name": "createEscrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "bookingId", "type": "string"}],
    "name": "releaseEscrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "bookingId", "type": "string"}],
    "name": "disputeEscrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "bookingId", "type": "string"}],
    "name": "getEscrowStatus",
    "outputs": [{"name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const SLOT_TOKEN_ABI = [
  {
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "bookingId", "type": "string"},
      {"name": "metadata", "type": "string"}
    ],
    "name": "mintSlotToken",
    "outputs": [{"name": "tokenId", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "tokenId", "type": "uint256"},
      {"name": "fractions", "type": "uint256"}
    ],
    "name": "fractionalize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "tokenURI",
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const INSURANCE_POOL_ABI = [
  {
    "inputs": [{"name": "amount", "type": "uint256"}],
    "name": "depositToPool",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "bookingId", "type": "string"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "claimFromPool",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPoolBalance",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const ERC20_ABI = [
  {
    "inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "owner", "type": "address"}, {"name": "spender", "type": "address"}],
    "name": "allowance",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;