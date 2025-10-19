import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Info, DollarSign, Coins, Clock } from 'lucide-react';
import { FeeBreakdown as FeeBreakdownType } from '@/lib/pricing';

interface FeeBreakdownProps {
  fees: FeeBreakdownType;
  paymentMethod: 'credit-card' | 'crypto';
  showDetails?: boolean;
}

export const FeeBreakdown = ({ fees, paymentMethod, showDetails = true }: FeeBreakdownProps) => {
  const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const getPaymentMethodBadge = () => {
    switch (paymentMethod) {
      case 'crypto':
        return <Badge variant="outline" className="text-purple-400 border-purple-400"><Coins className="w-3 h-3 mr-1" />Crypto</Badge>;
      case 'credit-card':
        return <Badge variant="outline" className="text-blue-400 border-blue-400"><DollarSign className="w-3 h-3 mr-1" />Card</Badge>;
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
        {showDetails && fees.bookingCommission > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <Info className="w-4 h-4" />
              Platform Fees
            </h4>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <div>
                  <div className="font-medium">Booking Commission</div>
                  <div className="text-xs text-muted-foreground">Platform service fee</div>
                </div>
              </div>
              <span className="font-semibold">{formatCurrency(fees.bookingCommission)}</span>
            </div>
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
                  Secure escrow wallet protection for your transaction
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
