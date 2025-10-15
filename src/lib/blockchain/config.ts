import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, arbitrumSepolia } from 'wagmi/chains';

export const blockchainConfig = getDefaultConfig({
  appName: 'DeSynth',
  projectId: '2f05a7cac472ced85b63e5f49a4543f1', // Valid WalletConnect project ID
  chains: [sepolia], // Only Sepolia for testing
  ssr: false,
});

// Simple escrow wallet address for Sepolia testnet
export const ESCROW_WALLET_ADDRESS = '0xf2664dBc523ac59892bCFdFF99E184f5372cc5Bc'; // Escrow wallet address

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