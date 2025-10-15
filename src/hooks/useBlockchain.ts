import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { ESCROW_WALLET_ADDRESS, SUPPORTED_TOKENS } from '@/lib/blockchain/config';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

export const useBlockchain = () => {
  const { address, isConnected, chain } = useAccount();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  
  const { sendTransaction, data: hash, isPending, error } = useSendTransaction();
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
    return formatEther(ethBalance.value);
  };

  const hasInsufficientBalance = (amount: string) => {
    if (!ethBalance) return true;
    const balance = parseFloat(getEthBalance());
    const required = parseFloat(amount);
    return balance < required;
  };

  // Simple ETH payment to escrow wallet
  const sendPayment = async (bookingId: string, amount: string) => {
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
      const parsedAmount = parseEther(amount);

      toast({
        title: "Sending Payment",
        description: "Please confirm the transaction in your wallet",
      });

      // Send ETH directly to escrow wallet
      sendTransaction({
        to: ESCROW_WALLET_ADDRESS as `0x${string}`,
        value: parsedAmount,
      });

      return null; // Transaction hash will be available when confirmed
    } catch (error) {
      console.error('Payment failed:', error);
      toast({
        title: "Transaction Failed",
        description: error instanceof Error ? error.message : "Failed to send payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
      return null;
    }
  };


  return {
    address,
    isConnected,
    chain,
    isProcessing,
    lastTxHash,
    ethBalance: getEthBalance(),
    hasInsufficientBalance,
    sendPayment,
  };
};