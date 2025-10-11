import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import PaymentProcessor from '@/components/PaymentProcessor';
import { RealTimeActivityFeed } from '@/components/RealTimeActivityFeed';
import { ActivityFeedReal } from '@/components/ActivityFeedReal';
import { AdminSystemMonitor } from '@/components/AdminSystemMonitor';
import { RevenueSettings } from '@/components/RevenueSettings';
import { FloatingChat } from '@/components/FloatingChat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building, 
  AlertTriangle, 
  BarChart3, 
  Users,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Shield,
  Settings,
  Eye
} from 'lucide-react';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('facilities');
  const [pendingFacilities, setPendingFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingFacilities();
  }, []);

  const fetchPendingFacilities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('facilities')
        .select(`
          *,
          profiles:owner_user_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingFacilities(data || []);
    } catch (error) {
      console.error('Error fetching pending facilities:', error);
      toast({
        title: "Error loading facilities",
        description: "Failed to load pending facilities.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFacilityAction = async (facilityId: string, action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase
        .from('facilities')
        .update({ 
          status: action === 'approve' ? 'approved' : 'rejected' 
        })
        .eq('id', facilityId);

      if (error) throw error;

      toast({
        title: action === 'approve' ? "Facility approved" : "Facility rejected",
        description: `The facility has been ${action}d successfully.`,
      });

      // Refresh the list
      fetchPendingFacilities();
    } catch (error) {
      console.error(`Error ${action}ing facility:`, error);
      toast({
        title: `Failed to ${action} facility`,
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const mockDisputes = [
    {
      id: '1',
      title: 'Quality Standards Disagreement',
      buyer: 'PharmaCorp Inc.',
      facility: 'BioLab Elite',
      amount: 12500,
      issue: 'QA documentation incomplete',
      submittedDate: '2024-01-19',
      status: 'pending'
    }
  ];

  const platformStats = {
    totalUsers: 1247,
    activeFacilities: 89,
    totalBookings: 567,
    totalRevenue: 2847000,
    cancellationRate: 3.2,
    avgRating: 4.7,
    growthRate: 23.5 // monthly
  };

  const userGrowth = [
    { month: 'Nov', buyers: 156, facilities: 12 },
    { month: 'Dec', buyers: 189, facilities: 15 },
    { month: 'Jan', buyers: 234, facilities: 18 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <Navigation />
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage platform operations and monitor system health</p>
        </div>

        {/* Platform Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-glow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{platformStats.totalUsers.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                +{platformStats.growthRate}% this month
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Facilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{platformStats.activeFacilities}</div>
              <div className="text-xs text-muted-foreground">
                Approved and operational
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{platformStats.totalBookings}</div>
              <div className="text-xs text-muted-foreground">
                Lifetime platform activity
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Platform Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">${(platformStats.totalRevenue / 1000000).toFixed(1)}M</div>
              <div className="text-xs text-muted-foreground">
                Total transaction volume
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

          <TabsContent value="facilities" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Facility Onboarding</h2>
              <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                {pendingFacilities.length} Pending Approval
              </Badge>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : pendingFacilities.length === 0 ? (
              <Card className="card-glow">
                <CardContent className="text-center py-12">
                  <Building className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No pending facilities</h3>
                  <p className="text-muted-foreground">
                    All facility applications have been reviewed.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {pendingFacilities.map((facility) => (
                <Card key={facility.id} className="card-glow border-yellow-500/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{facility.name}</CardTitle>
                        <p className="text-muted-foreground">{facility.location}</p>
                      </div>
                      <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending Review
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <div className="text-muted-foreground">Owner</div>
                        <div className="font-semibold">
                          {facility.profiles ? `${facility.profiles.first_name} ${facility.profiles.last_name}` : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Email</div>
                        <div className="font-semibold">{facility.profiles?.email || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Submitted</div>
                        <div className="font-semibold">{new Date(facility.created_at).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Certifications</div>
                        <div className="flex gap-1">
                          {facility.certifications.map((cert) => (
                            <Badge key={cert} variant="secondary" className="text-xs">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg mb-4">
                      <h4 className="font-semibold mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground">{facility.description}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        Review Details
                      </Button>
                      <Button 
                        size="sm" 
                        variant="premium"
                        onClick={() => handleFacilityAction(facility.id, 'approve')}
                        disabled={loading}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleFacilityAction(facility.id, 'reject')}
                        disabled={loading}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="disputes" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Dispute Resolution</h2>
              <Badge className="bg-red-500/10 text-red-400 border-red-500/30">
                {mockDisputes.length} Active Dispute{mockDisputes.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="grid gap-6">
              {mockDisputes.map((dispute) => (
                <Card key={dispute.id} className="card-glow border-red-500/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{dispute.title}</CardTitle>
                        <p className="text-muted-foreground">{dispute.buyer} vs {dispute.facility}</p>
                      </div>
                      <Badge className="bg-red-500/10 text-red-400 border-red-500/30">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Active Dispute
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <div className="text-muted-foreground">Amount</div>
                        <div className="font-semibold text-primary">${dispute.amount.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Issue</div>
                        <div className="font-semibold">{dispute.issue}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Submitted</div>
                        <div className="font-semibold">{dispute.submittedDate}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Status</div>
                        <div className="font-semibold capitalize">{dispute.status}</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        View Evidence
                      </Button>
                      <Button size="sm" variant="premium">
                        Resolve for Buyer
                      </Button>
                      <Button size="sm" variant="outline">
                        Resolve for Facility
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="card-glow">
                <CardHeader>
                  <CardTitle>Platform Growth</CardTitle>
                  <CardDescription>User acquisition and engagement metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">New Users (30d)</span>
                      <span className="font-semibold text-primary">+{Math.floor(platformStats.totalUsers * 0.12)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Active Users</span>
                      <span className="font-semibold text-primary">{Math.floor(platformStats.totalUsers * 0.68)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Facility Onboarding</span>
                      <span className="font-semibold text-primary">+{Math.floor(platformStats.activeFacilities * 0.15)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Booking Completion Rate</span>
                      <span className="font-semibold text-green-400">{(100 - platformStats.cancellationRate).toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-glow">
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Platform performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>System Uptime</span>
                        <span className="font-semibold text-green-400">99.9%</span>
                      </div>
                      <Progress value={99.9} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>API Response Time</span>
                        <span className="font-semibold">&lt; 200ms</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Database Performance</span>
                        <span className="font-semibold text-green-400">Optimal</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <ActivityFeedReal />
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="card-glow">
                <CardHeader>
                  <CardTitle>User Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Buyers</span>
                    <span className="font-semibold">{Math.floor(platformStats.totalUsers * 0.65)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Facilities</span>
                    <span className="font-semibold">{Math.floor(platformStats.totalUsers * 0.25)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Auditors</span>
                    <span className="font-semibold">{Math.floor(platformStats.totalUsers * 0.08)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Admins</span>
                    <span className="font-semibold">{Math.floor(platformStats.totalUsers * 0.02)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-glow">
                <CardHeader>
                  <CardTitle>User Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Active</span>
                    <span className="font-semibold text-primary">{Math.floor(platformStats.totalUsers * 0.23)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weekly Active</span>
                    <span className="font-semibold text-primary">{Math.floor(platformStats.totalUsers * 0.45)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Active</span>
                    <span className="font-semibold text-primary">{Math.floor(platformStats.totalUsers * 0.68)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Session Time</span>
                    <span className="font-semibold">12m 45s</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-glow">
                <CardHeader>
                  <CardTitle>Verification Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verified Users</span>
                    <span className="font-semibold text-green-400">{Math.floor(platformStats.totalUsers * 0.78)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pending Verification</span>
                    <span className="font-semibold text-yellow-400">{Math.floor(platformStats.totalUsers * 0.15)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unverified</span>
                    <span className="font-semibold">{Math.floor(platformStats.totalUsers * 0.07)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verification Rate</span>
                    <span className="font-semibold text-green-400">78%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <AdminSystemMonitor />
          </TabsContent>
        </Tabs>
        
        {/* Floating Chat System */}
        <FloatingChat />
      </div>
    </div>
  );
};