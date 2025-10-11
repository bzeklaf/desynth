import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, DollarSign, Calendar, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const BookingSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'failed'>('pending');

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    } else {
      setLoading(false);
      toast({
        title: "Error",
        description: "No payment session found.",
        variant: "destructive"
      });
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      // Verify the payment with our backend
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { sessionId }
      });

      if (error) throw error;

      setVerificationStatus(data.success ? 'success' : 'failed');
      
      if (data.success) {
        // Fetch booking details
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select('*, slots(*)')
          .eq('id', data.bookingId)
          .single();

        if (bookingError) throw bookingError;
        
        setBooking(bookingData);
        toast({
          title: "Payment Verified",
          description: "Your booking has been confirmed!",
        });
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setVerificationStatus('failed');
      toast({
        title: "Payment Verification Failed",
        description: "There was an issue verifying your payment. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verifying your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Payment Issue</CardTitle>
            <CardDescription>
              There was a problem verifying your payment. Please contact support.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button onClick={() => navigate('/book')} variant="outline" className="w-full">
              Back to Booking
            </Button>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Booking Confirmed!</CardTitle>
          <CardDescription>
            Your payment has been processed successfully and your production slot is confirmed.
          </CardDescription>
        </CardHeader>
        
        {booking && (
          <CardContent className="space-y-6">
            {/* Booking Details */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Booking Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Booking ID:</span>
                  <p className="font-medium">{booking.id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                    Confirmed
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <p className="font-medium">${booking.total_amount}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment Method:</span>
                  <p className="font-medium capitalize">{booking.payment_method?.replace('-', ' ')}</p>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3">Next Steps</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p>1. You will receive a confirmation email shortly</p>
                <p>2. Our team will contact you within 24 hours to coordinate production details</p>
                <p>3. Production scheduling will be finalized based on your requirements</p>
                <p>4. You can track your booking progress in your dashboard</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => navigate('/dashboard')} className="flex-1">
                Go to Dashboard
              </Button>
              <Button onClick={() => navigate('/')} variant="outline" className="flex-1">
                Back to Home
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};