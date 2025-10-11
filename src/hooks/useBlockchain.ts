import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { CONTRACT_ADDRESSES, SUPPORTED_TOKENS } from '@/lib/blockchain/config';
import { ESCROW_ABI, SLOT_TOKEN_ABI, INSURANCE_POOL_ABI, ERC20_ABI } from '@/lib/blockchain/contracts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

export const useBlockchain = () => {
  const { address, isConnected, chain } = useAccount();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ 
    hash 
  });

  // Monitor transaction success
  useEffect(() => {
    if (isConfirmed && hash) {
      setLastTxHash(hash);
      setIsProcessing(false);
      
      toast({
        title: "Transaction Confirmed",
        description: "Your payment has been confirmed on the blockchain",
      });
    }
  }, [isConfirmed, hash, toast]);

  useEffect(() => {
    if (error) {
      setIsProcessing(false);
      toast({
        title: "Transaction Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Read ETH balance
  const { data: ethBalance } = useBalance({
    address: address,
  });

  const getEthBalance = () => {
    if (!ethBalance) return '0';
    return formatUnits(ethBalance.value, SUPPORTED_TOKENS.ETH.decimals);
  };

  const hasInsufficientBalance = (amount: string) => {
    if (!ethBalance) return true;
    const balance = parseFloat(getEthBalance());
    const required = parseFloat(amount) * 1.02; // Include 2% fee
    return balance < required;
  };

  const needsApproval = (amount: string) => {
    // Native ETH doesn't need approval
    return false;
  };

  // ETH doesn't need approval, so this function is simplified
  const approveETH = async (amount: string) => {
    // Native ETH doesn't require approval
    return true;
  };

  // Create escrow with real blockchain transactions
  const createEscrow = async (bookingId: string, facilityAddress: string, amount: string) => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to proceed with crypto payment",
        variant: "destructive",
      });
      return null;
    }

    if (hasInsufficientBalance(amount)) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough ETH to complete this payment",
        variant: "destructive",
      });
      return null;
    }

    setIsProcessing(true);

    try {
      // First, create escrow record in backend
      const { data: escrowData, error: escrowError } = await supabase.functions.invoke('blockchain-service', {
        body: {
          action: 'create_escrow',
          bookingId,
          buyerAddress: address,
          facilityAddress,
          amount,
          tokenAddress: CONTRACT_ADDRESSES.ETH
        }
      });

      if (escrowError) {
        throw new Error(escrowError.message || 'Failed to create escrow record');
      }

      const requiredAmount = parseFloat(amount) * 1.02; // Include 2% fee
      const parsedAmount = parseUnits(requiredAmount.toString(), SUPPORTED_TOKENS.ETH.decimals);

      toast({
        title: "Creating Escrow",
        description: "Please confirm the transaction in your wallet",
      });

      // Call the smart contract to create and fund escrow
      writeContract({
        address: CONTRACT_ADDRESSES.ESCROW as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'createEscrow',
        args: [bookingId, address, facilityAddress as `0x${string}`, parsedAmount, CONTRACT_ADDRESSES.ETH as `0x${string}`],
        account: address,
        chain: chain,
      } as any);

      // The transaction hash will be available in the `hash` variable
      // and the confirmation will be handled by the useEffect hooks

      return null; // Will be updated when transaction confirms
    } catch (error) {
      console.error('Escrow creation failed:', error);
      toast({
        title: "Transaction Failed",
        description: error instanceof Error ? error.message : "Failed to create escrow. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
      return null;
    }
  };

  const releaseEscrow = async (bookingId: string) => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      toast({
        title: "Releasing Escrow",
        description: "Please confirm the transaction in your wallet",
      });

      writeContract({
        address: CONTRACT_ADDRESSES.ESCROW as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'releaseEscrow',
        args: [bookingId],
        account: address,
        chain: chain,
      });

    } catch (error) {
      console.error('Error releasing escrow:', error);
      toast({
        title: "Release Failed",
        description: error instanceof Error ? error.message : "Failed to release escrow.",
        variant: "destructive",
      });
      setIsProcessing(false);
      throw error;
    }
  };

  const disputeEscrow = async (bookingId: string) => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      toast({
        title: "Creating Dispute",
        description: "Please confirm the transaction in your wallet",
      });

      writeContract({
        address: CONTRACT_ADDRESSES.ESCROW as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'disputeEscrow',
        args: [bookingId],
        account: address,
        chain: chain,
      });

    } catch (error) {
      console.error('Error disputing escrow:', error);
      toast({
        title: "Dispute Failed",
        description: error instanceof Error ? error.message : "Failed to create dispute.",
        variant: "destructive",
      });
      setIsProcessing(false);
      throw error;
    }
  };

  const mintSlotToken = async (bookingId: string, metadata: any) => {
    if (!isConnected || !address) return;
    
    setIsProcessing(true);
    
    try {
      toast({
        title: "Minting Slot Token",
        description: "Please confirm the transaction in your wallet",
      });

      writeContract({
        address: CONTRACT_ADDRESSES.SLOT_TOKENS as `0x${string}`,
        abi: SLOT_TOKEN_ABI,
        functionName: 'mintSlotToken',
        args: [address, bookingId, JSON.stringify(metadata)],
        account: address,
        chain: chain,
      });

    } catch (error) {
      console.error('Token minting failed:', error);
      toast({
        title: "Minting Failed",
        description: "Failed to mint slot token. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const getInsurancePoolBalance = async () => {
    // Get insurance pool balance
    return "0";
  };

  return {
    address,
    isConnected,
    chain,
    isProcessing,
    lastTxHash,
    ethBalance: getEthBalance(),
    hasInsufficientBalance,
    needsApproval,
    createEscrow,
    releaseEscrow,
    disputeEscrow,
    mintSlotToken,
    getInsurancePoolBalance,
    approveETH,
  };
};