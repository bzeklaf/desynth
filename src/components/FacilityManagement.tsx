import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Building2, 
  Calendar as CalendarIcon, 
  Users, 
  DollarSign, 
  TrendingUp,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  BarChart3
} from 'lucide-react';

interface Facility {
  id: string;
  name: string;
  location: string;
  description: string;
  certifications: string[];
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  reputation_score: number;
  on_time_percentage: number;
  qa_pass_rate: number;
  cancellation_rate: number;
}

interface Slot {
  id: string;
  facility_id: string;
  production_type: string;
  capacity: number;
  available_capacity: number;
  start_date: string;
  end_date: string;
  price_per_unit: number;
  status: 'available' | 'booked' | 'in_progress' | 'completed';
}

interface Booking {
  id: string;
  slot_id: string;
  buyer_id: string;
  buyer_name: string;
  total_amount: number;
  status: 'reserved' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  payment_status: string;
  created_at: string;
}

export const FacilityManagement = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [newSlot, setNewSlot] = useState({
    production_type: '',
    capacity: 0,
    start_date: '',
    end_date: '',
    price_per_unit: 0
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchFacilities();
      fetchSlots();
      fetchBookings();
    }
  }, [user]);

  const fetchFacilities = async () => {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('owner_user_id', user?.id);
      
      if (error) throw error;
      setFacilities(data || []);
    } catch (error) {
      console.error('Error fetching facilities:', error);
    }
  };

  const fetchSlots = async () => {
    // Mock data for now
    const mockSlots: Slot[] = [
      {
        id: '1',
        facility_id: 'fac1',
        production_type: 'mRNA Vaccine',
        capacity: 10000,
        available_capacity: 7500,
        start_date: '2024-01-15',
        end_date: '2024-01-20',
        price_per_unit: 1850,
        status: 'available'
      },
      {
        id: '2',
        facility_id: 'fac1',
        production_type: 'Monoclonal Antibodies',
        capacity: 5000,
        available_capacity: 2000,
        start_date: '2024-02-01',
        end_date: '2024-02-07',
        price_per_unit: 2200,
        status: 'booked'
      }
    ];
    setSlots(mockSlots);
  };

  const fetchBookings = async () => {
    // Mock data for now
    const mockBookings: Booking[] = [
      {
        id: '1',
        slot_id: '1',
        buyer_id: 'buyer1',
        buyer_name: 'Pharma Corp',
        total_amount: 185000,
        status: 'in_progress',
        payment_status: 'completed',
        created_at: '2024-01-10T10:00:00Z'
      },
      {
        id: '2',
        slot_id: '2',
        buyer_id: 'buyer2',
        buyer_name: 'BioTech Solutions',
        total_amount: 440000,
        status: 'reserved',
        payment_status: 'pending',
        created_at: '2024-01-12T14:30:00Z'
      }
    ];
    setBookings(mockBookings);
  };

  const createSlot = async () => {
    setLoading(true);
    try {
      // In real implementation, create slot in database
      toast({
        title: "Slot Created",
        description: "New production slot has been created successfully.",
      });
      
      // Reset form
      setNewSlot({
        production_type: '',
        capacity: 0,
        start_date: '',
        end_date: '',
        price_per_unit: 0
      });
      
      fetchSlots();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create slot. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: 'reserved' | 'in_progress' | 'completed' | 'cancelled' | 'disputed') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Booking status has been updated to ${status}.`,
      });

      fetchBookings();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update booking status.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { variant: 'default' as const, color: 'text-green-600' },
      booked: { variant: 'secondary' as const, color: 'text-blue-600' },
      in_progress: { variant: 'default' as const, color: 'text-yellow-600' },
      completed: { variant: 'default' as const, color: 'text-green-600' },
      reserved: { variant: 'outline' as const, color: 'text-orange-600' },
      cancelled: { variant: 'destructive' as const, color: 'text-red-600' },
      disputed: { variant: 'destructive' as const, color: 'text-red-600' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.available;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const facility = facilities[0]; // For demo, show first facility

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facility Management</h1>
          <p className="text-muted-foreground mt-1">Manage your production facilities and slots</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Facility
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Bookings</p>
                <p className="text-2xl font-bold">{bookings.filter(b => b.status === 'in_progress').length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue (YTD)</p>
                <p className="text-2xl font-bold">$2.4M</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Slots</p>
                <p className="text-2xl font-bold">{slots.filter(s => s.status === 'available').length}</p>
              </div>
              <CalendarIcon className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reputation Score</p>
                <p className="text-2xl font-bold">{facility?.reputation_score || 4.8}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bookings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="slots">Production Slots</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="facility">Facility Info</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Manage your facility bookings and requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-semibold">{booking.buyer_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Booking #{booking.id} • {new Date(booking.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${booking.total_amount.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Payment: {booking.payment_status}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(booking.status)}
                      <Select
                        value={booking.status}
                        onValueChange={(value) => updateBookingStatus(booking.id, value as 'reserved' | 'in_progress' | 'completed' | 'cancelled' | 'disputed')}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reserved">Reserved</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slots" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create New Slot */}
            <Card>
              <CardHeader>
                <CardTitle>Create New Slot</CardTitle>
                <CardDescription>Add a new production slot to your facility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Production Type</Label>
                  <Input
                    placeholder="e.g., mRNA Vaccine"
                    value={newSlot.production_type}
                    onChange={(e) => setNewSlot(prev => ({ ...prev, production_type: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Capacity (units)</Label>
                  <Input
                    type="number"
                    value={newSlot.capacity}
                    onChange={(e) => setNewSlot(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={newSlot.start_date}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={newSlot.end_date}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Price per Unit ($)</Label>
                  <Input
                    type="number"
                    value={newSlot.price_per_unit}
                    onChange={(e) => setNewSlot(prev => ({ ...prev, price_per_unit: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <Button onClick={createSlot} disabled={loading} className="w-full">
                  {loading ? 'Creating...' : 'Create Slot'}
                </Button>
              </CardContent>
            </Card>

            {/* Existing Slots */}
            <Card>
              <CardHeader>
                <CardTitle>Current Slots</CardTitle>
                <CardDescription>Manage your existing production slots</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {slots.map((slot) => (
                    <div key={slot.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">{slot.production_type}</p>
                        {getStatusBadge(slot.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>Capacity: {slot.capacity.toLocaleString()} units</div>
                        <div>Available: {slot.available_capacity.toLocaleString()} units</div>
                        <div>Start: {slot.start_date}</div>
                        <div>End: {slot.end_date}</div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-semibold">${slot.price_per_unit}/unit</span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">On-Time Delivery</span>
                    <span className="text-sm text-muted-foreground">{facility?.on_time_percentage || 95}%</span>
                  </div>
                  <Progress value={facility?.on_time_percentage || 95} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">QA Pass Rate</span>
                    <span className="text-sm text-muted-foreground">{facility?.qa_pass_rate || 98}%</span>
                  </div>
                  <Progress value={facility?.qa_pass_rate || 98} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Capacity Utilization</span>
                    <span className="text-sm text-muted-foreground">87%</span>
                  </div>
                  <Progress value={87} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Q1 2024</span>
                    <span className="font-semibold">$620,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Q2 2024</span>
                    <span className="font-semibold">$580,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Q3 2024</span>
                    <span className="font-semibold">$720,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Q4 2024 (est)</span>
                    <span className="font-semibold">$480,000</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total 2024</span>
                    <span>$2,400,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="facility" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Facility Information</CardTitle>
              <CardDescription>Update your facility details and certifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Facility Name</Label>
                    <Input value={facility?.name || ''} />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input value={facility?.location || ''} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={facility?.description || ''} rows={4} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Status</Label>
                    <div className="mt-2">
                      {facility && getStatusBadge(facility.status)}
                    </div>
                  </div>
                  <div>
                    <Label>Certifications</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {facility?.certifications?.map((cert) => (
                        <Badge key={cert} variant="outline">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Certification
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
