import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, arbitrumSepolia } from 'wagmi/chains';

export const blockchainConfig = getDefaultConfig({
  appName: 'DeSynth',
  projectId: '2f05a7cac472ced85b63e5f49a4543f1', // Valid WalletConnect project ID
  chains: [sepolia], // Only Sepolia for testing
  ssr: false,
});

// Contract addresses for Sepolia testnet
export const CONTRACT_ADDRESSES = {
  ESCROW: '0x742d35Cc6634C0532925a3b8D30a5f7B5d6e8C29', // Deploy your escrow contract here  
  SLOT_TOKENS: '0x8C5AE1e7CA6C9c0E1b6F0D2E3B4A5F6C7D8E9F10', // Deploy your slot tokens contract here
  INSURANCE_POOL: '0x9D6B1F2E8A5C4D3B2A9F8E7D6C5B4A3E2D1C0B9A', // Deploy your insurance pool here
  // Native ETH doesn't need an address, represented as zero address
  ETH: '0x0000000000000000000000000000000000000000',
};

// Fee collection wallets - all set to platform wallet for testing
// Replace with actual wallets for production
export const FEE_WALLETS = {
  PLATFORM_WALLET: '0xf2664dBc523ac59892bCFdFF99E184f5372cc5Bc', // Main platform wallet (booking commission, escrow service)
  INSURANCE_POOL: '0xf2664dBc523ac59892bCFdFF99E184f5372cc5Bc', // Insurance pool fees
  AUDITOR_NETWORK: '0xf2664dBc523ac59892bCFdFF99E184f5372cc5Bc', // Auditor network fees
  TOKENIZATION: '0xf2664dBc523ac59892bCFdFF99E184f5372cc5Bc', // Tokenization fees
  STABLECOIN: '0xf2664dBc523ac59892bCFdFF99E184f5372cc5Bc', // Stablecoin settlement fees
  PRIORITY_MATCHING: '0xf2664dBc523ac59892bCFdFF99E184f5372cc5Bc', // Priority matching fees
};

// Supported tokens
export const SUPPORTED_TOKENS = {
  ETH: {
    address: '0x0000000000000000000000000000000000000000', // Native ETH
    symbol: 'ETH',
    decimals: 18,
    name: 'Ethereum',
  },
};