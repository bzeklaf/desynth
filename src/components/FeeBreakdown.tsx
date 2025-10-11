import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Info, DollarSign, Shield, Coins, Clock, Star, AlertTriangle } from 'lucide-react';
import { FeeBreakdown as FeeBreakdownType } from '@/lib/pricing';

interface FeeBreakdownProps {
  fees: FeeBreakdownType;
  paymentMethod: 'credit-card' | 'crypto' | 'bank-transfer';
  showDetails?: boolean;
}

export const FeeBreakdown = ({ fees, paymentMethod, showDetails = true }: FeeBreakdownProps) => {
  const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const feeItems = [
    {
      name: 'Booking Commission',
      amount: fees.bookingCommission,
      description: 'Platform service fee',
      icon: <DollarSign className="w-4 h-4" />,
      show: fees.bookingCommission > 0
    },
    {
      name: 'Escrow Service Fee',
      amount: fees.escrowServiceFee,
      description: 'Secure payment processing',
      icon: <Shield className="w-4 h-4" />,
      show: fees.escrowServiceFee > 0
    },
    {
      name: 'NFT Tokenization Fee',
      amount: fees.tokenizationFee,
      description: 'Blockchain slot token minting',
      icon: <Coins className="w-4 h-4" />,
      show: fees.tokenizationFee > 0
    },
    {
      name: 'Stablecoin Settlement Fee',
      amount: fees.stablecoinSettlementFee,
      description: 'USDC transaction processing',
      icon: <Coins className="w-4 h-4" />,
      show: fees.stablecoinSettlementFee > 0
    },
    {
      name: 'Insurance Pool Fee',
      amount: fees.insurancePoolFee,
      description: 'Risk coverage and protection',
      icon: <Shield className="w-4 h-4" />,
      show: fees.insurancePoolFee > 0
    },
    {
      name: 'Auditor Network Fee',
      amount: fees.auditorNetworkFee,
      description: 'Quality assurance and compliance',
      icon: <AlertTriangle className="w-4 h-4" />,
      show: fees.auditorNetworkFee > 0
    },
    {
      name: 'Priority Matching Fee',
      amount: fees.priorityMatchingFee,
      description: 'Fast-track booking placement',
      icon: <Star className="w-4 h-4" />,
      show: fees.priorityMatchingFee > 0
    }
  ];

  const visibleFees = feeItems.filter(item => item.show);

  const getPaymentMethodBadge = () => {
    switch (paymentMethod) {
      case 'crypto':
        return <Badge variant="outline" className="text-purple-400 border-purple-400"><Coins className="w-3 h-3 mr-1" />Crypto</Badge>;
      case 'credit-card':
        return <Badge variant="outline" className="text-blue-400 border-blue-400"><DollarSign className="w-3 h-3 mr-1" />Card</Badge>;
      case 'bank-transfer':
        return <Badge variant="outline" className="text-green-400 border-green-400"><Clock className="w-3 h-3 mr-1" />Bank</Badge>;
    }
  };

  return (
    <Card className="card-glow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Fee Breakdown
          </CardTitle>
          {getPaymentMethodBadge()}
        </div>
        <CardDescription>
          Transparent pricing with no hidden costs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Base Amount */}
        <div className="flex justify-between items-center text-lg font-semibold">
          <span>Base Amount</span>
          <span className="text-primary">{formatCurrency(fees.baseAmount)}</span>
        </div>
        
        <Separator />

        {/* Fee Details */}
        {showDetails && visibleFees.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <Info className="w-4 h-4" />
              Platform Fees
            </h4>
            {visibleFees.map((fee, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  {fee.icon}
                  <div>
                    <div className="font-medium">{fee.name}</div>
                    <div className="text-xs text-muted-foreground">{fee.description}</div>
                  </div>
                </div>
                <span className="font-semibold">{formatCurrency(fee.amount)}</span>
              </div>
            ))}
            <Separator className="my-3" />
          </div>
        )}

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Fees</span>
            <span className="font-semibold">{formatCurrency(fees.totalFees)}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total Amount</span>
            <span className="text-primary">{formatCurrency(fees.totalAmount)}</span>
          </div>
        </div>

        <Separator />

        {/* Facility Payout */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Net to Facility</span>
            <span className="font-semibold text-green-400">{formatCurrency(fees.netToFacility)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Amount facility receives after platform deductions
          </p>
        </div>

        {/* Payment Method Info */}
        {paymentMethod === 'crypto' && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Coins className="w-4 h-4 text-purple-400 mt-0.5" />
              <div className="text-xs">
                <p className="font-medium text-purple-400">Crypto Payment Benefits</p>
                <p className="text-muted-foreground">
                  Includes escrow protection, NFT tokenization, and insurance coverage
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};