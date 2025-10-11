import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Calendar, 
  MapPin, 
  DollarSign,
  Clock,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';

interface BookingManagerProps {
  bookingId?: string;
  onClose?: () => void;
}

export const BookingManager = ({ bookingId, onClose }: BookingManagerProps) => {
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    if (!bookingId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          slots (
            *,
            facilities (
              name,
              location,
              owner_user_id,
              profiles:owner_user_id (
                first_name,
                last_name,
                email
              )
            )
          ),
          transactions (
            *
          ),
          payment_sessions (
            *
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      setBooking(data);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      toast({
        title: "Error loading booking",
        description: "Failed to load booking details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking || !cancelReason.trim()) return;

    try {
      setLoading(true);
      
      // Update booking status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (bookingError) throw bookingError;

      // Create notification for facility owner via secure edge function
      if (booking.slots?.facilities?.owner_user_id) {
        await supabase.functions.invoke('create-notification', {
          body: {
            userId: booking.slots.facilities.owner_user_id,
            type: 'booking',
            title: 'Booking Cancelled',
            message: `Booking for ${booking.slots.title} has been cancelled by the buyer. Reason: ${cancelReason}`,
            urgent: true
          }
        });
      }

      toast({
        title: "Booking cancelled",
        description: "Your booking has been cancelled successfully.",
      });

      setShowCancelDialog(false);
      onClose?.();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Failed to cancel booking",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'status-bullish';
      case 'reserved': return 'status-warning';
      case 'cancelled': return 'status-bearish';
      case 'in_progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (loading || !booking) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="card-glow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{booking.slots?.title}</CardTitle>
              <div className="flex items-center gap-2 text-muted-foreground mt-2">
                <MapPin className="w-4 h-4" />
                {booking.slots?.facilities?.name} • {booking.slots?.facilities?.location}
              </div>
            </div>
            <Badge className={getStatusColor(booking.status)}>
              {booking.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-muted-foreground">Start Date</div>
              <div className="font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(booking.slots?.start_date).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">End Date</div>
              <div className="font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(booking.slots?.end_date).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Amount</div>
              <div className="font-semibold flex items-center gap-2 text-primary">
                <DollarSign className="w-4 h-4" />
                ${booking.total_amount.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Payment Status</div>
              <div className={`font-semibold ${getPaymentStatusColor(booking.payment_status)}`}>
                {booking.payment_status.toUpperCase()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="card-glow">
          <CardHeader>
            <CardTitle>Facility Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Equipment</div>
              <div className="font-semibold">{booking.slots?.equipment}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Compliance Level</div>
              <div className="font-semibold">{booking.slots?.compliance_level?.toUpperCase()}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Duration</div>
              <div className="font-semibold">{booking.slots?.duration_hours} hours</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Scale Capacity</div>
              <div className="font-semibold">{booking.slots?.scale_capacity || 'Not specified'}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardHeader>
            <CardTitle>Contact & Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Facility Owner</div>
              <div className="font-semibold">
                {booking.slots?.facilities?.profiles?.first_name} {booking.slots?.facilities?.profiles?.last_name}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Contact Email</div>
              <div className="font-semibold">{booking.slots?.facilities?.profiles?.email}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message Facility
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                View Contract
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {booking.status === 'reserved' && (
        <Card className="card-glow">
          <CardHeader>
            <CardTitle>Booking Actions</CardTitle>
            <CardDescription>Manage your booking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button variant="outline">
                <Clock className="w-4 h-4 mr-2" />
                Modify Dates
              </Button>
              
              <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Booking
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Booking</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to cancel this booking? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Reason for cancellation *</label>
                      <Textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Please provide a reason for cancelling this booking..."
                        className="mt-2"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                        Keep Booking
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleCancelBooking}
                        disabled={!cancelReason.trim() || loading}
                      >
                        {loading ? 'Cancelling...' : 'Cancel Booking'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Information */}
      {booking.payment_sessions && booking.payment_sessions.length > 0 && (
        <Card className="card-glow">
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {booking.payment_sessions.map((session: any) => (
                <div key={session.id} className="p-3 border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">${session.amount / 100} {session.currency.toUpperCase()}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(session.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge className={getStatusColor(session.status)}>
                      {session.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};