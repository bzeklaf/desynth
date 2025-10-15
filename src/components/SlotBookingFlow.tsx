import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CryptoPaymentOption } from './blockchain/CryptoPaymentOption';
import { FeeBreakdown } from './FeeBreakdown';
import { pricingEngine, BookingContext } from '@/lib/pricing';
import { formatCurrency } from '@/lib/utils';
import { 
  CalendarDays, 
  Clock, 
  DollarSign, 
  MapPin, 
  Users, 
  Shield,
  CheckCircle,
  CreditCard,
  FileText,
  AlertCircle,
  Coins,
  ArrowLeft,
  X
} from 'lucide-react';

interface SlotBookingFlowProps {
  slotId: string;
  slotData?: {
    id: string;
    title: string;
    description?: string;
    facility: {
      name: string;
      location: string;
      reputation_score: number;
    };
    start_date?: string;
    end_date?: string;
    duration_hours?: number;
    price: number;
    compliance_level: string;
    equipment: string;
    scale_capacity?: string;
  };
  onClose: () => void;
}

interface Slot {
  id: string;
  facility_name: string;
  location: string;
  production_type: string;
  capacity: number;
  start_date: string;
  end_date: string;
  price_per_unit: number;
  available_capacity: number;
  requirements: string[];
  certifications: string[];
  description: string;
}

interface BookingDetails {
  requested_capacity: number;
  project_description: string;
  compliance_requirements: string[];
  timeline_flexibility: 'strict' | 'flexible' | 'very_flexible';
  payment_method: 'credit-card' | 'crypto' | 'bank-transfer';
  booking_vertical: 'cdmo' | 'sequencing' | 'cloud_lab' | 'fermentation' | 'academic';
  facility_type: 'bioprocessing' | 'cell_culture' | 'analytical' | 'formulation' | 'manufacturing';
  is_priority: boolean;
  requires_tokenization: boolean;
  requires_insurance: boolean;
}

export const SlotBookingFlow = ({ slotId, slotData, onClose }: SlotBookingFlowProps) => {
  const [step, setStep] = useState<'details' | 'payment' | 'confirmation'>('details');
  const [slot, setSlot] = useState<Slot | null>(null);
  const [booking, setBooking] = useState<BookingDetails>({
    requested_capacity: 1,
    project_description: '',
    compliance_requirements: [],
    timeline_flexibility: 'flexible',
    payment_method: 'credit-card',
    booking_vertical: 'cloud_lab',
    facility_type: 'manufacturing',
    is_priority: false,
    requires_tokenization: false,
    requires_insurance: false
  });
  const [loading, setLoading] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [feeBreakdown, setFeeBreakdown] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchSlotDetails();
  }, [slotId]);

  useEffect(() => {
    if (slot) {
      const baseAmount = booking.requested_capacity * slot.price_per_unit;
      const context: BookingContext = {
        vertical: booking.booking_vertical,
        facilityType: booking.facility_type,
        transactionSize: baseAmount,
        isPriority: booking.is_priority,
        paymentMethod: booking.payment_method
      };
      
      const fees = pricingEngine.calculateFees(baseAmount, context);
      setFeeBreakdown(fees);
      setTotalCost(fees.totalAmount);
    }
  }, [slot, booking]);

  const fetchSlotDetails = async () => {
    if (slotData) {
      // Use provided slot data
      const adaptedSlot: Slot = {
        id: slotData.id,
        facility_name: slotData.facility.name,
        location: slotData.facility.location,
        production_type: slotData.title,
        capacity: 10000,
        start_date: slotData.start_date ? new Date(slotData.start_date).toLocaleDateString() : '2024-01-15',
        end_date: slotData.end_date ? new Date(slotData.end_date).toLocaleDateString() : '2024-01-20',
        price_per_unit: slotData.price,
        available_capacity: 7500,
        requirements: [slotData.compliance_level.toUpperCase()],
        certifications: ['ISO 9001', 'GMP', 'FDA Approved'],
        description: slotData.description || 'Premium biomanufacturing facility with full compliance and quality assurance.'
      };
      setSlot(adaptedSlot);
      return;
    }

    // Fallback to mock data if no slot data provided
    const mockSlot: Slot = {
      id: slotId,
      facility_name: 'BioTech Manufacturing Hub',
      location: 'Cambridge, MA',
      production_type: 'mRNA Vaccine',
      capacity: 10000,
      start_date: '2024-01-15',
      end_date: '2024-01-20',
      price_per_unit: 1850,
      available_capacity: 7500,
      requirements: ['GMP Certified', 'ISO 13485', 'FDA Approved'],
      certifications: ['ISO 9001', 'ISO 14001', 'GMP', 'FDA 21 CFR Part 820'],
      description: 'State-of-the-art mRNA vaccine production facility with full quality assurance and regulatory compliance.'
    };
    setSlot(mockSlot);
  };

  const [bookingId, setBookingId] = useState<string | null>(null);

  const handleBookingSubmit = async () => {
    setLoading(true);
    try {
      // Create booking in database
      const { data, error } = await supabase
        .from('bookings')
        .insert([
          {
            slot_id: slotId,
            buyer_id: user?.id,
            total_amount: totalCost,
            status: 'reserved',
            payment_status: 'pending',
            payment_method: booking.payment_method
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setBookingId(data.id);
      setStep('payment');
      toast({
        title: "Booking Created",
        description: "Your booking has been reserved and is ready for payment.",
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!bookingId) {
      toast({
        title: "Error",
        description: "No booking ID found. Please try again.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (booking.payment_method === 'credit-card') {
        // Create Stripe checkout session
        const { data, error } = await supabase.functions.invoke('create-payment-session', {
          body: {
            bookingId,
            amount: totalCost,
            successUrl: `${window.location.origin}/booking-success`,
            cancelUrl: `${window.location.origin}/book`
          }
        });

        if (error) throw error;

        // Redirect to Stripe Checkout
        window.location.href = data.url;
        return;
      } else if (booking.payment_method === 'crypto') {
        // Handle crypto payment through blockchain service
        const { data, error } = await supabase.functions.invoke('blockchain-service', {
          body: {
            action: 'create_escrow',
            bookingId,
            amount: totalCost.toString(),
            facilityAddress: '0x0000000000000000000000000000000000000000'
          }
        });

        if (error) throw error;

        setStep('confirmation');
        toast({
          title: "Crypto Payment Initiated",
          description: "Escrow created successfully. Your booking is now secured.",
        });
      } else {
        // Bank transfer - just update status
        await supabase
          .from('bookings')
          .update({ 
            payment_status: 'pending_transfer',
            payment_method: 'bank-transfer',
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId);

        setStep('confirmation');
        toast({
          title: "Bank Transfer Instructions",
          description: "Please complete the bank transfer as instructed.",
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "Payment processing failed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!slot) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading slot details...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed inset-4 bg-background rounded-lg shadow-xl overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Book Production Slot</h2>
                <p className="text-muted-foreground mt-1">{slot.facility_name}</p>
              </div>
              <Button variant="ghost" onClick={onClose}>×</Button>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center mt-6 space-x-4">
              <div className={`flex items-center ${step === 'details' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'details' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>1</div>
                <span className="ml-2 font-medium">Details</span>
              </div>
              <div className="flex-1 h-px bg-border"></div>
              <div className={`flex items-center ${step === 'payment' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'payment' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>2</div>
                <span className="ml-2 font-medium">Payment</span>
              </div>
              <div className="flex-1 h-px bg-border"></div>
              <div className={`flex items-center ${step === 'confirmation' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'confirmation' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>3</div>
                <span className="ml-2 font-medium">Confirmation</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {step === 'details' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Slot Information */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Facility Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Location</Label>
                        <p className="text-sm text-muted-foreground">{slot.location}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Production Type</Label>
                        <p className="text-sm text-muted-foreground">{slot.production_type}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Timeline</Label>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarDays className="w-4 h-4" />
                          {slot.start_date} to {slot.end_date}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Available Capacity</Label>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          {slot.available_capacity.toLocaleString()} units
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Certifications</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {slot.certifications.map((cert) => (
                            <Badge key={cert} variant="outline" className="text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Booking Form */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Booking Requirements</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="capacity">Requested Capacity (units)</Label>
                        <Input
                          id="capacity"
                          type="number"
                          min="1"
                          max={slot.available_capacity}
                          value={booking.requested_capacity}
                          onChange={(e) => setBooking(prev => ({
                            ...prev,
                            requested_capacity: parseInt(e.target.value) || 1
                          }))}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Max available: {slot.available_capacity.toLocaleString()} units
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="description">Project Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe your production requirements, timeline, and any special needs..."
                          value={booking.project_description}
                          onChange={(e) => setBooking(prev => ({
                            ...prev,
                            project_description: e.target.value
                          }))}
                          rows={4}
                        />
                      </div>

                      <div>
                        <Label>Timeline Flexibility</Label>
                        <Select
                          value={booking.timeline_flexibility}
                          onValueChange={(value: 'strict' | 'flexible' | 'very_flexible') => 
                            setBooking(prev => ({ ...prev, timeline_flexibility: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="strict">Strict - Exact dates required</SelectItem>
                            <SelectItem value="flexible">Flexible - Some date adjustment OK</SelectItem>
                            <SelectItem value="very_flexible">Very Flexible - Open to alternatives</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Payment Method</Label>
                        <RadioGroup
                          value={booking.payment_method}
                          onValueChange={(value: 'credit-card' | 'crypto' | 'bank-transfer') => 
                            setBooking(prev => ({ ...prev, payment_method: value }))
                          }
                          className="grid grid-cols-1 gap-3 mt-2"
                        >
                          <div className="flex items-center space-x-2 border rounded-lg p-3">
                            <RadioGroupItem value="credit-card" id="credit-card" />
                            <Label htmlFor="credit-card" className="flex items-center gap-2 cursor-pointer">
                              <CreditCard className="h-4 w-4" />
                              Credit Card
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 border rounded-lg p-3">
                            <RadioGroupItem value="crypto" id="crypto" />
                            <Label htmlFor="crypto" className="flex items-center gap-2 cursor-pointer">
                              <Coins className="h-4 w-4" />
                              Crypto (USDC)
                              <Badge variant="secondary" className="text-xs">Escrow + NFT</Badge>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 border rounded-lg p-3">
                            <RadioGroupItem value="bank-transfer" id="bank-transfer" />
                            <Label htmlFor="bank-transfer" className="flex items-center gap-2 cursor-pointer">
                              <Shield className="h-4 w-4" />
                              Bank Transfer
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                        <div className="space-y-3">
                          <div>
                            <Label>Booking Vertical</Label>
                            <Select
                              value={booking.booking_vertical}
                              onValueChange={(value: 'cdmo' | 'sequencing' | 'cloud_lab' | 'fermentation' | 'academic') => 
                                setBooking(prev => ({ ...prev, booking_vertical: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cdmo">CDMO/Manufacturing</SelectItem>
                                <SelectItem value="sequencing">DNA/RNA Sequencing</SelectItem>
                                <SelectItem value="cloud_lab">Cloud Lab Services</SelectItem>
                                <SelectItem value="fermentation">Fermentation</SelectItem>
                                <SelectItem value="academic">Academic Research</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="priority"
                                checked={booking.is_priority}
                                onChange={(e) => setBooking(prev => ({ ...prev, is_priority: e.target.checked }))}
                              />
                              <Label htmlFor="priority" className="text-sm">Priority Matching (+3.5%)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="insurance"
                                checked={booking.requires_insurance}
                                onChange={(e) => setBooking(prev => ({ ...prev, requires_insurance: e.target.checked }))}
                              />
                              <Label htmlFor="insurance" className="text-sm">Insurance Coverage</Label>
                            </div>
                          </div>

                          {booking.payment_method === 'crypto' && (
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="tokenization"
                                checked={booking.requires_tokenization}
                                onChange={(e) => setBooking(prev => ({ ...prev, requires_tokenization: e.target.checked }))}
                              />
                              <Label htmlFor="tokenization" className="text-sm">NFT Tokenization</Label>
                            </div>
                          )}
                        </div>

                        <Separator />

                      <div className="bg-muted/50 rounded-lg p-4">
                        {feeBreakdown ? (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Base Amount</span>
                              <span>{formatCurrency(feeBreakdown.baseAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Platform Fees</span>
                              <span>{formatCurrency(feeBreakdown.totalFees)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold">
                              <span>Total Cost</span>
                              <span className="text-primary">{formatCurrency(totalCost)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Total Cost</span>
                            <div className="text-right">
                              <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
                              <div className="text-sm text-muted-foreground">
                                ${slot.price_per_unit}/unit × {booking.requested_capacity} units
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <Button 
                        onClick={handleBookingSubmit} 
                        disabled={loading || !booking.project_description.trim()}
                        className="w-full"
                        size="lg"
                      >
                        {loading ? 'Creating Booking...' : 'Continue to Payment'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep('details')}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Details
                  </Button>
                  <div>
                    <h2 className="text-2xl font-bold">Payment</h2>
                    <p className="text-muted-foreground">Complete your booking payment</p>
                  </div>
                </div>

                {/* Booking Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Booking Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Facility:</span>
                      <span className="font-medium">{slot.facility_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Capacity:</span>
                      <span className="font-medium">{booking.requested_capacity} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unit Price:</span>
                      <span className="font-medium">${slot.price_per_unit}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>${totalCost.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Options */}
                {booking.payment_method === 'crypto' ? (
                  <CryptoPaymentOption
                    bookingId={bookingId || `temp-${Date.now()}`}
                    amount={totalCost.toString()}
                    facilityAddress="0x1234567890123456789012345678901234567890"
                    onPaymentComplete={(txHash) => {
                      console.log('Crypto payment completed:', txHash);
                      setStep('confirmation');
                      toast({
                        title: "Crypto Payment Completed",
                        description: `Transaction: ${txHash}`,
                      });
                    }}
                  />
                ) : (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5" />
                          Payment Information
                        </CardTitle>
                        <CardDescription>
                          Secure payment processing for your production slot
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="cardNumber">Card Number</Label>
                            <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                          </div>
                          <div>
                            <Label htmlFor="name">Cardholder Name</Label>
                            <Input id="name" placeholder="John Doe" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiry">Expiry Date</Label>
                            <Input id="expiry" placeholder="MM/YY" />
                          </div>
                          <div>
                            <Label htmlFor="cvc">CVC</Label>
                            <Input id="cvc" placeholder="123" />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span className="text-blue-900">
                            Your payment is secured with 256-bit SSL encryption
                          </span>
                        </div>

                        <Button 
                          onClick={handlePayment} 
                          disabled={loading}
                          className="w-full"
                          size="lg"
                        >
                          {loading ? 'Processing Payment...' : `Pay $${totalCost.toLocaleString()}`}
                        </Button>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}

            {step === 'confirmation' && (
              <div className="max-w-2xl mx-auto space-y-6 text-center">
                <Card>
                  <CardContent className="p-8">
                    <div className="mb-6">
                      <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                      <h3 className="text-2xl font-bold text-green-700 mb-2">Booking Confirmed!</h3>
                      <p className="text-muted-foreground">
                        Your production slot has been successfully booked and payment processed.
                      </p>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-6 text-left">
                      <h4 className="font-semibold mb-3">Booking Reference</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Booking ID:</span>
                          <span className="font-mono">BK-{Date.now()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Facility:</span>
                          <span>{slot.facility_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Production Dates:</span>
                          <span>{slot.start_date} to {slot.end_date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Capacity Booked:</span>
                          <span>{booking.requested_capacity} units</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Paid:</span>
                          <span className="font-semibold">${totalCost.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 mt-6">
                      <Button variant="outline" className="flex-1">
                        <FileText className="w-4 h-4 mr-2" />
                        Download Contract
                      </Button>
                      <Button className="flex-1" onClick={onClose}>
                        Continue to Dashboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};