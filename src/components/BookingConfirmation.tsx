import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  FileText,
  Download,
  Share2,
  Star,
  AlertTriangle
} from 'lucide-react';

interface BookingDetails {
  id: string;
  slotTitle: string;
  facility: {
    name: string;
    location: string;
    rating: number;
  };
  schedule: {
    startDate: string;
    endDate: string;
    duration: string;
  };
  pricing: {
    basePrice: number;
    fees: number;
    total: number;
  };
  status: 'confirmed' | 'pending' | 'processing';
  compliance: string[];
  equipment: string[];
}

interface BookingConfirmationProps {
  booking: BookingDetails;
  onClose: () => void;
}

export const BookingConfirmation = ({ booking, onClose }: BookingConfirmationProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'processing':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-muted/10 text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'processing':
        return <Clock className="w-4 h-4" />;
      case 'pending':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleDownloadConfirmation = () => {
    setLoading(true);
    // Simulate download
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Download complete",
        description: "Booking confirmation saved to your device.",
      });
    }, 1500);
  };

  const handleShareBooking = () => {
    toast({
      title: "Share link copied",
      description: "Booking details link copied to clipboard.",
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <Card className="card-glow">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
          <CardDescription>
            Your production slot has been successfully reserved
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Badge className={getStatusColor(booking.status)}>
            {getStatusIcon(booking.status)}
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Badge>
          <p className="text-sm text-muted-foreground mt-4">
            Booking ID: {booking.id}
          </p>
        </CardContent>
      </Card>

      {/* Booking Details */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Booking Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Slot Information */}
          <div>
            <h4 className="font-semibold mb-3">Production Slot</h4>
            <div className="space-y-2">
              <p className="font-medium text-lg">{booking.slotTitle}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {booking.facility.name}, {booking.facility.location}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {booking.facility.rating}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Schedule */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Schedule
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Start Date</p>
                <p className="font-medium">{booking.schedule.startDate}</p>
              </div>
              <div>
                <p className="text-muted-foreground">End Date</p>
                <p className="font-medium">{booking.schedule.endDate}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Duration</p>
                <p className="font-medium">{booking.schedule.duration}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Pricing */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Pricing Breakdown
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Price</span>
                <span>${booking.pricing.basePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fees</span>
                <span>${booking.pricing.fees.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total Amount</span>
                <span className="text-primary">${booking.pricing.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Compliance & Equipment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Compliance Standards</h4>
              <div className="flex flex-wrap gap-2">
                {booking.compliance.map((standard, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {standard}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Equipment Access</h4>
              <div className="flex flex-wrap gap-2">
                {booking.equipment.map((item, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>What happens next with your booking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium">Facility Confirmation</p>
                <p className="text-sm text-muted-foreground">
                  The facility will review and confirm your booking within 24 hours
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium">Pre-Production Setup</p>
                <p className="text-sm text-muted-foreground">
                  Receive detailed protocols and equipment specifications
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">3</span>
              </div>
              <div>
                <p className="font-medium">Production Begins</p>
                <p className="text-sm text-muted-foreground">
                  Real-time monitoring and quality assurance throughout the process
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="font-medium text-blue-400">Important</p>
                <p className="text-sm text-muted-foreground">
                  You'll receive email notifications for each step. Check your dashboard for real-time updates.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={handleShareBooking} className="flex-1">
          <Share2 className="w-4 h-4 mr-2" />
          Share Details
        </Button>
        <Button 
          variant="outline" 
          onClick={handleDownloadConfirmation}
          disabled={loading}
          className="flex-1"
        >
          <Download className="w-4 h-4 mr-2" />
          {loading ? 'Downloading...' : 'Download PDF'}
        </Button>
        <Button onClick={onClose} className="flex-1">
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};