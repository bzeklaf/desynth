import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { WalletConnection } from './WalletConnection';
import { useBlockchain } from '@/hooks/useBlockchain';
import { supabase } from '@/integrations/supabase/client';
import { 
  Coins, 
  Shield, 
  Lock, 
  AlertTriangle, 
  CheckCircle, 
  Wallet,
  Clock,
  ExternalLink,
  Loader2,
  Info
} from 'lucide-react';

interface CryptoPaymentOptionProps {
  bookingId: string;
  amount: string;
  facilityAddress?: string;
  onPaymentComplete?: (txHash: string) => void;
}

export const CryptoPaymentOption = ({ 
  bookingId, 
  amount, 
  facilityAddress = "0x742d35Cc66D3F5536BbfE95C5B1b85Fd5F70e7B8", // Default test address
  onPaymentComplete 
}: CryptoPaymentOptionProps) => {
  const { 
    isConnected,
    address, 
    isProcessing,
    ethBalance,
    hasInsufficientBalance,
    sendPayment,
    lastTxHash,
    chain
  } = useBlockchain();

  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'sending' | 'confirming' | 'completed' | 'failed'>('idle');
  const [progress, setProgress] = useState(0);
  
  const totalAmount = parseFloat(amount);

  // Monitor transaction hash for completion
  useEffect(() => {
    if (lastTxHash && paymentStatus === 'sending') {
      handleTransactionConfirmed();
    }
  }, [lastTxHash, paymentStatus]);

  const handleCryptoPayment = async () => {
    if (!isConnected) return;
    
    try {
      setPaymentStatus('sending');
      setProgress(50);
      
      await sendPayment(bookingId, amount);
      
      setProgress(75);
    } catch (error) {
      console.error('Crypto payment failed:', error);
      setPaymentStatus('failed');
      setProgress(0);
    }
  };

  const handleTransactionConfirmed = async () => {
    setPaymentStatus('confirming');
    setProgress(90);

    try {
      // Update booking payment status
      const { error } = await supabase
        .from('bookings')
        .update({ 
          payment_status: 'paid',
          status: 'completed'
        })
        .eq('id', bookingId);

      if (error) throw error;

      setPaymentStatus('completed');
      setProgress(100);
      onPaymentComplete?.(lastTxHash!);
    } catch (error) {
      console.error('Error confirming transaction:', error);
      setPaymentStatus('failed');
      setProgress(0);
    }
  };

  const getPaymentButtonText = () => {
    if (!isConnected) return 'Connect Wallet First';
    if (paymentStatus === 'sending' || isProcessing) return 'Sending Payment...';
    if (paymentStatus === 'confirming') return 'Confirming Transaction...';
    if (paymentStatus === 'completed') return 'Payment Completed';
    if (hasInsufficientBalance(amount)) return 'Insufficient ETH Balance';
    return `Pay ${totalAmount} ETH`;
  };

  const isPaymentDisabled = () => {
    return !isConnected || 
           isProcessing || 
           ['sending', 'confirming', 'completed'].includes(paymentStatus) ||
           hasInsufficientBalance(amount);
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'sending':
      case 'confirming':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Coins className="w-4 h-4" />;
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Crypto Payment (ETH)
        </CardTitle>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-xs">
            <Shield className="h-3 w-3 mr-1" />
            Secure Payment
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Indicator */}
        {paymentStatus !== 'idle' && paymentStatus !== 'failed' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Payment Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {getStatusIcon()}
             <span>
                {paymentStatus === 'sending' && 'Sending payment to escrow wallet...'}
                {paymentStatus === 'confirming' && 'Confirming transaction on blockchain...'}
                {paymentStatus === 'completed' && 'Payment completed successfully!'}
              </span>
            </div>
          </div>
        )}

        {/* Network and Balance Info */}
        {isConnected && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium">Network: {chain?.name || 'Unknown'}</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-1">
                <Wallet className="h-3 w-3" />
                <span>Balance: {parseFloat(ethBalance).toFixed(4)} ETH</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Amount */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between items-center font-bold text-lg">
            <span>Payment Amount:</span>
            <span>{totalAmount} ETH</span>
          </div>
          <div className="text-xs text-muted-foreground mt-2 p-2 bg-primary/5 rounded">
            <div className="flex items-start gap-2">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <div>
                <p>Payment will be sent to escrow wallet: <span className="font-mono">{facilityAddress.slice(0, 10)}...{facilityAddress.slice(-8)}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Warnings and Status */}
        {isConnected && hasInsufficientBalance(amount) && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Insufficient ETH balance. You need {totalAmount} ETH but have {parseFloat(ethBalance).toFixed(4)} ETH.
            </AlertDescription>
          </Alert>
        )}

        {paymentStatus === 'completed' && lastTxHash && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Payment completed successfully!
              <div className="mt-2 flex items-center gap-1">
                <span className="text-xs">Transaction: </span>
                <span className="font-mono text-xs">{lastTxHash.slice(0, 20)}...</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </AlertDescription>
          </Alert>
        )}

        {paymentStatus === 'failed' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Payment failed. Please try again or contact support.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground space-y-2">
          <p className="flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 text-primary" />
            <span>Payment will be sent to secure escrow wallet address</span>
          </p>
          <p className="flex items-start gap-2">
            <Coins className="h-4 w-4 mt-0.5 text-primary" />
            <span>Transaction will be confirmed on Sepolia testnet</span>
          </p>
        </div>

          <div className="space-y-3">
            <WalletConnection showBalance={true} />
            
            <Button 
              onClick={handleCryptoPayment}
              disabled={isPaymentDisabled()}
              className="w-full"
              size="lg"
              variant={paymentStatus === 'completed' ? 'secondary' : 'default'}
            >
              {paymentStatus === 'completed' ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Payment Completed
                </>
              ) : paymentStatus === 'failed' ? (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Retry Payment
                </>
              ) : (
                <>
                  {getStatusIcon()}
                  <span className="ml-2">{getPaymentButtonText()}</span>
                </>
              )}
            </Button>
          </div>
      </CardContent>
    </Card>
  );
};