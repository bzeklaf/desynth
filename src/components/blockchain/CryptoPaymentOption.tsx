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
    needsApproval,
    createEscrow,
    lastTxHash,
    chain
  } = useBlockchain();

  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'funding' | 'confirming' | 'completed' | 'failed'>('idle');
  const [escrowData, setEscrowData] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  
  const totalAmount = parseFloat(amount) * 1.02; // Include 2% insurance fee
  const insuranceFee = parseFloat(amount) * 0.02;

  // Monitor escrow status
  useEffect(() => {
    if (bookingId && bookingId !== 'test-booking-123') {
      checkEscrowStatus();
    }
  }, [bookingId]);

  // Monitor transaction hash for completion
  useEffect(() => {
    if (lastTxHash && paymentStatus === 'funding') {
      handleTransactionConfirmed();
    }
  }, [lastTxHash, paymentStatus]);

  const checkEscrowStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('blockchain-service', {
        body: {
          action: 'get_status',
          bookingId
        }
      });

      if (!error && data?.booking) {
        setEscrowData(data.escrow);
        if (data.escrow?.status === 'funded' || data.booking.payment_status === 'confirmed') {
          setPaymentStatus('completed');
          setProgress(100);
          onPaymentComplete?.(data.escrow?.funding_tx_hash);
        }
      }
    } catch (error) {
      console.error('Error checking escrow status:', error);
    }
  };

  const handleCryptoPayment = async () => {
    if (!isConnected) return;
    
    try {
      setPaymentStatus('funding');
      setProgress(50);
      
      // Generate a valid UUID for test bookings if needed
      const validBookingId = bookingId === 'test-booking-123' 
        ? crypto.randomUUID() 
        : bookingId;
      
      const txHash = await createEscrow(validBookingId, facilityAddress, amount);
      
      if (txHash) {
        setProgress(75);
      }
    } catch (error) {
      console.error('Crypto payment failed:', error);
      setPaymentStatus('failed');
      setProgress(0);
    }
  };

  const handleTransactionConfirmed = async () => {
    setPaymentStatus('confirming');
    setProgress(75);

    try {
      // Update escrow status in database via blockchain-service
      const { data, error } = await supabase.functions.invoke('blockchain-service', {
        body: {
          action: 'confirm_escrow',
          txHash: lastTxHash,
          bookingId
        }
      });

      if (error) throw error;

      setPaymentStatus('completed');
      setProgress(100);
      onPaymentComplete?.(lastTxHash);
    } catch (error) {
      console.error('Error confirming transaction:', error);
      setPaymentStatus('failed');
      setProgress(0);
    }
  };

  const getPaymentButtonText = () => {
    if (!isConnected) return 'Connect Wallet First';
    if (paymentStatus === 'funding' || isProcessing) return 'Processing Payment...';
    if (paymentStatus === 'confirming') return 'Confirming Transaction...';
    if (paymentStatus === 'completed') return 'Payment Completed';
    if (hasInsufficientBalance(amount)) return 'Insufficient ETH Balance';
    return `Pay ${totalAmount.toFixed(4)} ETH`;
  };

  const isPaymentDisabled = () => {
    return !isConnected || 
           isProcessing || 
           ['funding', 'confirming', 'completed'].includes(paymentStatus) ||
           hasInsufficientBalance(amount);
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'funding':
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
            Escrow Protected
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <Lock className="h-3 w-3 mr-1" />
            Smart Contract
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
                {paymentStatus === 'funding' && 'Creating escrow and transferring funds...'}
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

        {/* Payment Breakdown */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Base Slot Amount:</span>
            <span className="font-medium">{amount} ETH</span>
          </div>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Platform Fees (collected):</span>
            <span>~{(parseFloat(amount) * 0.05).toFixed(4)} ETH</span>
          </div>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Insurance Pool Fee (2%):</span>
            <span>{insuranceFee.toFixed(4)} ETH</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between items-center font-bold text-lg">
            <span>Total Payment:</span>
            <span>{totalAmount.toFixed(4)} ETH</span>
          </div>
          <div className="text-xs text-muted-foreground mt-2 p-2 bg-primary/5 rounded">
            <div className="flex items-start gap-2">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">On release:</p>
                <p>• Facility receives: {amount} ETH</p>
                <p>• Platform receives: ~{(parseFloat(amount) * 0.05).toFixed(4)} ETH (fees)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        {escrowData && (
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Escrow Details
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge className={
                  escrowData.status === 'funded' ? 'status-bullish' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                }>
                  {escrowData.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network:</span>
                <span className="capitalize">{escrowData.network}</span>
              </div>
              {escrowData.funding_tx_hash && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs">{escrowData.funding_tx_hash.slice(0, 10)}...</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Warnings and Status */}
        {isConnected && hasInsufficientBalance(amount) && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Insufficient ETH balance. You need {totalAmount.toFixed(4)} ETH but have {parseFloat(ethBalance).toFixed(4)} ETH.
            </AlertDescription>
          </Alert>
        )}

        {paymentStatus === 'completed' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Payment completed successfully! Your booking is now secured in escrow.
              {lastTxHash && (
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-xs">Transaction: </span>
                  <span className="font-mono text-xs">{lastTxHash.slice(0, 20)}...</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              )}
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
            <span>Funds are held in escrow until production completion is verified by auditor</span>
          </p>
          <p className="flex items-start gap-2">
            <Coins className="h-4 w-4 mt-0.5 text-primary" />
            <span>Slot NFT will be minted automatically upon payment confirmation</span>
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