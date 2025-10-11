import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { SlotCreationForm } from '@/components/SlotCreationForm';
import { FacilityManagementReal } from '@/components/FacilityManagementReal';
import { InventoryManagement } from '@/components/InventoryManagement';
import { ComplianceTracker } from '@/components/ComplianceTracker';
import { FloatingChat } from '@/components/FloatingChat';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Calendar, 
  TrendingUp, 
  Star, 
  Upload,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  FileText,
  Award
} from 'lucide-react';

export const FacilityDashboard = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data: facilities } = await supabase
        .from('facilities')
        .select('id')
        .eq('owner_user_id', user.id);

      if (facilities && facilities.length > 0) {
        const { data, error } = await supabase
          .from('slots')
          .select(`
            *,
            bookings (
              id,
              buyer_id,
              status,
              profiles:buyer_id (
                first_name,
                last_name
              )
            )
          `)
          .eq('facility_id', facilities[0].id)
          .order('start_date', { ascending: true });

        if (error) throw error;
        setSlots(data || []);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast({
        title: "Error loading slots",
        description: "Failed to load your slots.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const mockSlots = [
    {
      id: '1',
      title: 'Vaccine Production Scale-Up',
      equipment: 'Bioreactor 500L',
      startDate: '2024-01-15',
      endDate: '2024-01-20',
      status: 'booked',
      buyer: 'PharmaCorp Inc.',
      amount: 12500,
      compliance: 'GMP'
    },
    {
      id: '2',
      title: 'Cell Line Development',
      equipment: 'Cell Culture Suite',
      startDate: '2024-02-01',
      endDate: '2024-02-05',
      status: 'available',
      amount: 8200,
      compliance: 'R&D'
    }
  ];

  const mockRuns = [
    {
      id: '1',
      title: 'Vaccine Production Scale-Up',
      buyer: 'PharmaCorp Inc.',
      status: 'in_progress',
      progress: 65,
      startDate: '2024-01-15',
      endDate: '2024-01-20',
      requirements: ['Material Receipt Confirmation', 'QA Protocol Upload', 'Daily Progress Reports']
    }
  ];

  const reputationMetrics = {
    onTimePercentage: 94,
    qaPassRate: 98,
    cancellationRate: 2,
    totalCompleted: 127,
    avgRating: 4.8
  };

  const revenue = {
    thisMonth: 45200,
    lastMonth: 38900,
    pending: 12500,
    completed: 156700
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <Navigation />
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Facility Dashboard</h1>
          <p className="text-muted-foreground">Manage your lab capacity and track performance</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-glow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">${revenue.thisMonth.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                +{((revenue.thisMonth - revenue.lastMonth) / revenue.lastMonth * 100).toFixed(1)}% from last month
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Reputation Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{reputationMetrics.avgRating}/5.0</div>
              <div className="text-xs text-muted-foreground">
                Based on {reputationMetrics.totalCompleted} completed runs
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">On-Time Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{reputationMetrics.onTimePercentage}%</div>
              <div className="text-xs text-muted-foreground">
                QA Pass Rate: {reputationMetrics.qaPassRate}%
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">${revenue.pending.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                From 2 completed runs
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Slot Calendar
            </TabsTrigger>
            <TabsTrigger value="runs" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Active Runs
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Compliance
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Revenue & Fees
            </TabsTrigger>
            <TabsTrigger value="reputation" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Reputation
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Slot Management</h2>
              <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                <Calendar className="w-4 h-4 mr-2" />
                {showCreateForm ? 'Cancel' : 'Create New Slot'}
              </Button>
            </div>

            {showCreateForm && (
              <SlotCreationForm onSlotCreated={() => {
                setShowCreateForm(false);
                fetchSlots();
              }} />
            )}

            <div className="grid gap-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : slots.length === 0 ? (
                <Card className="card-glow">
                  <CardContent className="text-center py-12">
                    <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No slots created yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first slot to start accepting bookings
                    </p>
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Calendar className="w-4 h-4 mr-2" />
                      Create First Slot
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                slots.map((slot) => (
                  <Card key={slot.id} className="card-glow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{slot.title}</CardTitle>
                          <p className="text-muted-foreground">{slot.equipment}</p>
                        </div>
                        <Badge className={
                          slot.bookings && slot.bookings.length > 0 ? 'status-bullish' : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                        }>
                          {slot.bookings && slot.bookings.length > 0 ? 'booked' : 'available'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Start Date</div>
                          <div className="font-semibold">{new Date(slot.start_date).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">End Date</div>
                          <div className="font-semibold">{new Date(slot.end_date).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Amount</div>
                          <div className="font-semibold text-primary">${slot.price.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Compliance</div>
                          <div className="font-semibold">{slot.compliance_level.toUpperCase()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Buyer</div>
                          <div className="font-semibold">
                            {slot.bookings && slot.bookings.length > 0 && slot.bookings[0].profiles
                              ? `${slot.bookings[0].profiles.first_name} ${slot.bookings[0].profiles.last_name}`
                              : 'Available'
                            }
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm">
                          Edit Slot
                        </Button>
                        {(!slot.bookings || slot.bookings.length === 0) && (
                          <Button variant="outline" size="sm">
                            Delete Slot
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="runs" className="space-y-6">
            <div className="grid gap-6">
              {mockRuns.map((run) => (
                <Card key={run.id} className="card-glow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{run.title}</CardTitle>
                        <p className="text-muted-foreground">Buyer: {run.buyer}</p>
                      </div>
                      <Badge className="status-bullish">
                        {run.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span>{run.progress}%</span>
                        </div>
                        <Progress value={run.progress} className="h-2" />
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Required Actions:</h4>
                        {run.requirements.map((req, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            {req}
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm">
                          <Upload className="w-4 h-4 mr-1" />
                          Upload Report
                        </Button>
                        <Button variant="premium" size="sm">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark Completed
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryManagement />
          </TabsContent>

          <TabsContent value="compliance">
            <ComplianceTracker />
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="card-glow">
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                  <CardDescription>Monthly performance overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">This Month</span>
                      <span className="font-semibold text-primary">${revenue.thisMonth.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Month</span>
                      <span className="font-semibold">${revenue.lastMonth.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pending Payouts</span>
                      <span className="font-semibold text-yellow-400">${revenue.pending.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-muted-foreground">Total Completed</span>
                      <span className="font-semibold text-primary">${revenue.completed.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-glow">
                <CardHeader>
                  <CardTitle>Platform Fees Summary</CardTitle>
                  <CardDescription>Fees deducted from your bookings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Booking Commission (avg)</span>
                      <span className="font-semibold">8.5%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Auditor Network Fees</span>
                      <span className="font-semibold">$1,875</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Escrow Service Fees</span>
                      <span className="font-semibold">$234</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Insurance Pool Fees</span>
                      <span className="font-semibold">$167</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-semibold">
                      <span>Total Fees This Month</span>
                      <span className="text-destructive">$6,830</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="card-glow">
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
                <CardDescription>Your current facility subscription plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-semibold">Professional Plan</div>
                    <div className="text-sm text-muted-foreground">
                      Advanced analytics, priority support, up to 50 active slots
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">$3,000</div>
                    <div className="text-sm text-muted-foreground">per month</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" className="flex-1">
                    Change Plan
                  </Button>
                  <Button variant="outline" className="flex-1">
                    View Usage
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="card-glow">
                <CardHeader>
                  <CardTitle>Export Reports</CardTitle>
                  <CardDescription>Download financial and performance reports</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    Revenue Report (CSV)
                  </Button>
                  <Button variant="outline" className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    Fee Breakdown (PDF)
                  </Button>
                  <Button variant="outline" className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    Tax Summary (CSV)
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-glow">
                <CardHeader>
                  <CardTitle>Payout Schedule</CardTitle>
                  <CardDescription>When you receive your payments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Next Payout</span>
                    <span className="font-semibold">Jan 15, 2025</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Amount</span>
                    <span className="font-semibold text-primary">$12,500</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Payout Method</span>
                    <span className="font-semibold">Bank Transfer</span>
                  </div>
                  <Button className="w-full mt-4">
                    Update Payout Method
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reputation" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="card-glow">
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Your facility's reputation indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>On-Time Delivery</span>
                      <span className="font-semibold">{reputationMetrics.onTimePercentage}%</span>
                    </div>
                    <Progress value={reputationMetrics.onTimePercentage} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span>QA Pass Rate</span>
                      <span className="font-semibold">{reputationMetrics.qaPassRate}%</span>
                    </div>
                    <Progress value={reputationMetrics.qaPassRate} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Cancellation Rate</span>
                      <span className="font-semibold">{reputationMetrics.cancellationRate}%</span>
                    </div>
                    <Progress value={100 - reputationMetrics.cancellationRate} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-glow">
                <CardHeader>
                  <CardTitle>Rating Overview</CardTitle>
                  <CardDescription>How buyers rate your facility</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">{reputationMetrics.avgRating}</div>
                    <div className="flex justify-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-5 h-5 ${
                            star <= reputationMetrics.avgRating 
                              ? 'fill-yellow-400 text-yellow-400' 
                              : 'text-muted-foreground'
                          }`} 
                        />
                      ))}
                    </div>
                    <p className="text-muted-foreground">
                      Based on {reputationMetrics.totalCompleted} reviews
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="management" className="space-y-6">
            <FacilityManagementReal />
          </TabsContent>
        </Tabs>
        
        {/* Floating Chat System */}
        <FloatingChat />
      </div>
    </div>
  );
};