import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SlotBrowserReal } from '@/components/SlotBrowserReal';
import { NotificationCenter } from '@/components/NotificationCenter';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { SlotBookingFlow } from '@/components/SlotBookingFlow';
import { FloatingChat } from '@/components/FloatingChat';
import PaymentProcessor from '@/components/PaymentProcessor';
import { 
  Search, 
  Calendar, 
  Wallet, 
  TrendingUp, 
  Clock,
  MapPin,
  Star,
  Eye,
  Lock,
  RefreshCw,
  DollarSign,
  BarChart3
} from 'lucide-react';

export const BuyerDashboard = () => {
  const [activeTab, setActiveTab] = useState('browse');
  const [showNotifications, setShowNotifications] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [resaleListings, setResaleListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchBookings();
      fetchClaims();
      fetchResaleListings();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          slots (
            title,
            equipment,
            start_date,
            end_date,
            facilities (
              name,
              location
            )
          )
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error loading bookings",
        description: "Failed to load your bookings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClaims = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('claims')
        .select(`
          *,
          bookings (
            slots (
              title,
              facilities (
                name
              )
            )
          )
        `)
        .eq('owner_id', user.id)
        .eq('status', 'active');

      if (error) throw error;
      setClaims(data || []);
    } catch (error) {
      console.error('Error fetching claims:', error);
    }
  };

  const fetchResaleListings = async () => {
    try {
      const { data, error } = await supabase
        .from('resale_listings')
        .select(`
          *,
          claims (
            bookings (
              slots (
                title,
                facilities (
                  name,
                  reputation_score
                )
              )
            )
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setResaleListings(data || []);
    } catch (error) {
      console.error('Error fetching resale listings:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <Navigation />
      <NotificationCenter isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Buyer Dashboard</h1>
          <p className="text-muted-foreground">Manage your bookings, claims, and explore new opportunities</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Browse Slots
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              My Bookings
            </TabsTrigger>
            <TabsTrigger value="claims" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Claim Wallet
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Marketplace
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="finance" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Finance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            <SlotBrowserReal />
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : bookings.length === 0 ? (
              <Card className="card-glow">
                <CardContent className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start browsing slots to make your first booking
                  </p>
                  <Button onClick={() => setActiveTab('browse')}>
                    <Search className="w-4 h-4 mr-2" />
                    Browse Slots
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="card-glow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{booking.slots?.title || 'Unknown Slot'}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                            <MapPin className="w-4 h-4" />
                            {booking.slots?.facilities?.name || 'Unknown Facility'} • {booking.slots?.facilities?.location || 'Unknown Location'}
                          </div>
                        </div>
                        <Badge className={
                          booking.status === 'completed' ? 'status-bullish' : 
                          booking.status === 'reserved' ? 'status-warning' :
                          booking.status === 'cancelled' ? 'status-bearish' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }>
                          {booking.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <div className="text-muted-foreground">Start Date</div>
                          <div className="font-semibold">
                            {booking.slots?.start_date ? new Date(booking.slots.start_date).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">End Date</div>
                          <div className="font-semibold">
                            {booking.slots?.end_date ? new Date(booking.slots.end_date).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Amount</div>
                          <div className="font-semibold text-primary">${booking.total_amount.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Payment</div>
                          <div className="font-semibold capitalize">{booking.payment_status}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        {booking.status === 'reserved' && (
                          <Button variant="outline" size="sm">
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Modify Booking
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="claims" className="space-y-6">
            <div className="grid gap-6">
              <Card className="card-glow">
                <CardHeader>
                  <CardTitle>My Claims Wallet</CardTitle>
                  <CardDescription>Digital ownership certificates for your booked slots</CardDescription>
                </CardHeader>
                <CardContent>
                  {claims.length === 0 ? (
                    <div className="text-center py-8">
                      <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">No Claims Yet</h3>
                      <p className="text-muted-foreground">
                        Complete bookings to receive digital ownership certificates
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {claims.map((claim) => (
                        <div key={claim.id} className="p-4 border border-border rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">{claim.bookings?.slots?.title || 'Unknown Slot'}</h4>
                              <p className="text-sm text-muted-foreground">{claim.bookings?.slots?.facilities?.name || 'Unknown Facility'}</p>
                            </div>
                            <Badge className="status-bullish">
                              {claim.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Ownership</div>
                              <div className="font-semibold">{(claim.fraction * 100).toFixed(1)}%</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Token ID</div>
                              <div className="font-semibold font-mono text-xs">{claim.token_id || 'Pending'}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Status</div>
                              <div className="font-semibold capitalize">{claim.status}</div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button variant="outline" size="sm">
                              List for Resale
                            </Button>
                            <Button variant="outline" size="sm">
                              Fractionalize
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-6">
            <Card className="card-glow">
              <CardHeader>
                <CardTitle>Secondary Market</CardTitle>
                <CardDescription>Purchase claims from other buyers at market rates</CardDescription>
              </CardHeader>
              <CardContent>
                {resaleListings.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No Active Listings</h3>
                    <p className="text-muted-foreground">
                      No claims available for purchase in the secondary market
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {resaleListings.map((listing) => (
                      <div key={listing.id} className="p-4 border border-border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{listing.claims?.bookings?.slots?.title || 'Unknown Slot'}</h4>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Star className="w-3 h-3 fill-warning text-warning" />
                              {listing.claims?.bookings?.slots?.facilities?.reputation_score?.toFixed(1) || '0.0'} • {listing.claims?.bookings?.slots?.facilities?.name || 'Unknown Facility'}
                            </div>
                          </div>
                          <Badge variant="outline">
                            <Clock className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <div className="text-muted-foreground">Listing Price</div>
                            <div className="font-semibold text-primary">${listing.price.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Created</div>
                            <div className="font-semibold">{new Date(listing.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <Button variant="premium" size="sm">
                          <Lock className="w-4 h-4 mr-1" />
                          Purchase Claim
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="finance" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="card-glow">
                <CardHeader>
                  <CardTitle>Insurance Options</CardTitle>
                  <CardDescription>Protect your bookings against unforeseen issues</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                     <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                       <Lock className="w-6 h-6 text-success" />
                     </div>
                    <h3 className="font-semibold mb-2">Insurance Coming Soon</h3>
                    <p className="text-muted-foreground text-sm">
                      Comprehensive coverage for booking cancellations and QA failures
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-glow">
                <CardHeader>
                  <CardTitle>Collateral Lending</CardTitle>
                  <CardDescription>Borrow against your claim portfolio</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                     <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                       <DollarSign className="w-6 h-6 text-success" />
                     </div>
                    <h3 className="font-semibold mb-2">Lending Coming Soon</h3>
                    <p className="text-muted-foreground text-sm">
                      Use your claims as collateral for liquidity
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Floating Chat System */}
        <FloatingChat />
      </div>
    </div>
  );
};