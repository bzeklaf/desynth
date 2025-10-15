import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CryptoPaymentOption } from './CryptoPaymentOption';
import { EscrowManager } from './EscrowManager';
import { useAuth } from '@/hooks/useAuth';
import { 
  CreditCard,
  Coins, 
  Shield, 
  FileText,
  ArrowLeft
} from 'lucide-react';

interface CryptoBookingFlowProps {
  bookingId: string;
  slotData: any;
  onBack: () => void;
  onPaymentComplete: (txHash: string, paymentMethod: string) => void;
}

export const CryptoBookingFlow = ({ 
  bookingId, 
  slotData, 
  onBack, 
  onPaymentComplete 
}: CryptoBookingFlowProps) => {
  const [activeTab, setActiveTab] = useState('payment');
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const { profile } = useAuth();

  const handleCryptoPaymentComplete = (txHash: string) => {
    setPaymentCompleted(true);
    setActiveTab('escrow');
    onPaymentComplete(txHash, 'crypto');
  };

  const handleStripePaymentComplete = () => {
    setPaymentCompleted(true);
    onPaymentComplete('stripe-session-completed', 'stripe');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Booking
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Secure Payment & Escrow</h1>
              <p className="text-muted-foreground">Complete your booking with crypto or traditional payment</p>
            </div>
          </div>

          {/* Booking Summary */}
          <Card className="card-glow mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Slot</div>
                  <div className="font-semibold">{slotData?.title || 'Unknown Slot'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Facility</div>
                  <div className="font-semibold">{slotData?.facilities?.name || 'Unknown Facility'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Amount</div>
                  <div className="font-semibold text-primary">${slotData?.price?.toLocaleString() || '0'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Duration</div>
                  <div className="font-semibold">{slotData?.duration_hours || 0}h</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payment
            </TabsTrigger>
            <TabsTrigger value="escrow" disabled={!paymentCompleted} className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Escrow
            </TabsTrigger>
            <TabsTrigger value="documents" disabled={!paymentCompleted} className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payment" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Crypto Payment Option */}
              <CryptoPaymentOption
                bookingId={bookingId}
                amount={slotData?.price?.toString() || '0'}
                facilityAddress="0x742d35Cc66D3F5536BbfE95C5B1b85Fd5F70e7B8" // Mock facility address
                onPaymentComplete={handleCryptoPaymentComplete}
              />

              {/* Traditional Payment Option */}
              <Card className="border-muted-foreground/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    Traditional Payment
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Stripe Secure
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Pay with credit card or bank transfer through our secure payment processor.
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Amount:</span>
                      <span className="font-bold">${slotData?.price?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleStripePaymentComplete}
                  >
                    Pay with Card
                  </Button>

                  <div className="text-xs text-muted-foreground">
                    <p>• Standard payment processing fees apply</p>
                    <p>• Payment released upon completion verification</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="escrow" className="space-y-6">
            <EscrowManager 
              bookingId={bookingId} 
              userRole={profile?.role as any}
            />
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 w-5" />
                  Booking Documentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Documentation Center</h3>
                  <p className="text-muted-foreground mb-6">
                    Access contracts, compliance documents, and audit reports.
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full">
                      <FileText className="w-4 h-4 mr-2" />
                      Download Booking Contract
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Shield className="w-4 h-4 mr-2" />
                      View Compliance Certificates
                    </Button>
                    <Button variant="outline" className="w-full" disabled>
                      <FileText className="w-4 h-4 mr-2" />
                      Audit Report (Available after completion)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};