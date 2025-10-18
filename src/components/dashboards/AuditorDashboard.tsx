import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
// import { AuditingSystem } from '@/components/AuditingSystem'; // TODO: Create audit tables
import { FloatingChat } from '@/components/FloatingChat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock,
  Upload,
  FileText,
  Award,
  AlertCircle
} from 'lucide-react';

export const AuditorDashboard = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingAudits, setPendingAudits] = useState<any[]>([]);
  const [completedAudits, setCompletedAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPendingAudits();
      fetchCompletedAudits();
    }
  }, [user]);

  const fetchPendingAudits = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          slots (
            title,
            equipment,
            compliance_level,
            facilities (
              name
            )
          ),
          profiles:buyer_id (
            first_name,
            last_name
          )
        `)
        .eq('status', 'completed')
        .is('attestations.id', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setPendingAudits(data || []);
    } catch (error) {
      console.error('Error fetching pending audits:', error);
      toast({
        title: "Error loading audits",
        description: "Failed to load pending audits.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedAudits = async () => {
    try {
      // TODO: Create attestations table
      // const { data, error } = await supabase
      //   .from('attestations')
      //   .select(`
      //     *,
      //     bookings (
      //       *,
      //       slots (
      //         title,
      //         facilities (
      //           name
      //         )
      //       ),
      //       profiles:buyer_id (
      //         first_name,
      //         last_name
      //       )
      //     )
      //   `)
      //   .eq('auditor_id', user?.id)
      //   .order('created_at', { ascending: false });

      // if (error) throw error;
      setCompletedAudits([]);
    } catch (error) {
      console.error('Error fetching completed audits:', error);
    }
  };

  const handleAuditAction = async (bookingId: string, result: 'passed' | 'failed', notes?: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      // TODO: Create attestations table
      // const { error } = await supabase
      //   .from('attestations')
      //   .insert({
      //     booking_id: bookingId,
      //     auditor_id: user.id,
      //     result: result,
      //     notes: notes || '',
      //     auditor_sign_off: true,
      //     created_at: new Date().toISOString(),
      //   });

      // if (error) throw error;

      toast({
        title: "Audit feature unavailable",
        description: "Attestations table needs to be created first.",
        variant: "destructive"
      });

      // Refresh both lists
      fetchPendingAudits();
      fetchCompletedAudits();
    } catch (error) {
      console.error('Error completing audit:', error);
      toast({
        title: "Failed to complete audit",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const mockPendingAudits = [
    {
      id: '1',
      title: 'Vaccine Production Scale-Up',
      facility: 'BioLab Elite',
      buyer: 'PharmaCorp Inc.',
      completedDate: '2024-01-20',
      status: 'pending',
      facilitySignOff: true,
      amount: 12500,
      compliance: 'GMP'
    },
    {
      id: '2',
      title: 'Cell Line Development',
      facility: 'GenTech Labs',
      buyer: 'BioTech Solutions',
      completedDate: '2024-01-18',
      status: 'pending',
      facilitySignOff: true,
      amount: 8200,
      compliance: 'R&D'
    }
  ];

  const mockCompletedAudits = [
    {
      id: '3',
      title: 'mRNA Therapeutic Production',
      facility: 'BioSynth Pro',
      buyer: 'PharmGen Corp',
      completedDate: '2024-01-15',
      auditDate: '2024-01-16',
      result: 'passed',
      amount: 18500,
      compliance: 'GMP'
    }
  ];

  const auditStats = {
    totalAudited: completedAudits.length,
    passRate: completedAudits.length > 0 
      ? Math.round((completedAudits.filter(a => a.result === 'passed').length / completedAudits.length) * 100)
      : 0,
    avgAuditTime: 1.2, // days - could be calculated from actual data
    pendingCount: pendingAudits.length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <Navigation />
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Auditor Dashboard</h1>
          <p className="text-muted-foreground">Review and verify completed biomanufacturing runs</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-glow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Audits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{auditStats.pendingCount}</div>
              <div className="text-xs text-muted-foreground">
                Require immediate attention
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Audited</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{auditStats.totalAudited}</div>
              <div className="text-xs text-muted-foreground">
                Lifetime completed audits
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pass Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{auditStats.passRate}%</div>
              <div className="text-xs text-muted-foreground">
                QA standards maintained
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Audit Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{auditStats.avgAuditTime}d</div>
              <div className="text-xs text-muted-foreground">
                Time to complete review
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Audits ({auditStats.pendingCount})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Completed Audits
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : pendingAudits.length === 0 ? (
              <Card className="card-glow">
                <CardContent className="text-center py-12">
                  <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No pending audits</h3>
                  <p className="text-muted-foreground">
                    All bookings have been reviewed and audited.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {pendingAudits.map((booking) => (
                <Card key={booking.id} className="card-glow border-yellow-500/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{booking.slots?.title || 'Unknown Slot'}</CardTitle>
                        <div className="text-muted-foreground text-sm">
                          {booking.slots?.facilities?.name || 'Unknown Facility'} → {booking.profiles ? `${booking.profiles.first_name} ${booking.profiles.last_name}` : 'Unknown Buyer'}
                        </div>
                      </div>
                      <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Pending Review
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
                      <div>
                        <div className="text-muted-foreground">Completed Date</div>
                        <div className="font-semibold">{new Date(booking.updated_at).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Amount</div>
                        <div className="font-semibold text-primary">${booking.total_amount.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Compliance</div>
                        <div className="font-semibold">{booking.slots?.compliance_level?.toUpperCase() || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Equipment</div>
                        <div className="font-semibold">{booking.slots?.equipment || 'N/A'}</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          QA Documentation Review Required
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Review facility-provided documentation and verify compliance with {booking.slots?.compliance_level?.toUpperCase() || 'required'} standards.
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Upload className="w-4 h-4 mr-1" />
                            Upload Verification
                          </Button>
                          <Button 
                            size="sm" 
                            variant="premium"
                            onClick={() => handleAuditAction(booking.id, 'passed')}
                            disabled={loading}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark as Passed
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleAuditAction(booking.id, 'failed')}
                            disabled={loading}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Mark as Failed
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <div className="grid gap-6">
              {completedAudits.map((audit) => (
                <Card key={audit.id} className="card-glow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{audit.bookings?.slots?.title || 'Unknown Slot'}</CardTitle>
                        <div className="text-muted-foreground text-sm">
                          {audit.bookings?.slots?.facilities?.name || 'Unknown Facility'} → {audit.bookings?.profiles ? `${audit.bookings.profiles.first_name} ${audit.bookings.profiles.last_name}` : 'Unknown Buyer'}
                        </div>
                      </div>
                      <Badge className={
                        audit.result === 'passed' ? 'status-bullish' : 'status-bearish'
                      }>
                        {audit.result === 'passed' ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {audit.result?.toUpperCase() || 'PENDING'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Completed Date</div>
                        <div className="font-semibold">{new Date(audit.bookings?.updated_at || audit.created_at).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Audit Date</div>
                        <div className="font-semibold">{new Date(audit.created_at).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Amount</div>
                        <div className="font-semibold text-primary">${audit.bookings?.total_amount?.toLocaleString() || 0}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Compliance</div>
                        <div className="font-semibold">{audit.bookings?.slots?.compliance_level?.toUpperCase() || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Result</div>
                        <div className="font-semibold capitalize">{audit.result || 'pending'}</div>
                      </div>
                    </div>
                    {audit.notes && (
                      <div className="mt-4 p-3 bg-muted/20 rounded-lg">
                        <div className="text-sm font-semibold mb-1">Notes:</div>
                        <div className="text-sm text-muted-foreground">{audit.notes}</div>
                      </div>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-1" />
                        View Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="card-glow">
                <CardHeader>
                  <CardTitle>Audit Statistics</CardTitle>
                  <CardDescription>Your auditing performance overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Audits Completed</span>
                      <span className="font-semibold text-primary">{auditStats.totalAudited}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Overall Pass Rate</span>
                      <span className="font-semibold text-green-400">{auditStats.passRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average Audit Time</span>
                      <span className="font-semibold">{auditStats.avgAuditTime} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Currently Pending</span>
                      <span className="font-semibold text-yellow-400">{auditStats.pendingCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-glow">
                <CardHeader>
                  <CardTitle>Auditor Rating</CardTitle>
                  <CardDescription>How facilities and buyers rate your audits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="text-4xl font-bold text-primary">4.9</div>
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Shield 
                          key={star} 
                          className="w-5 h-5 fill-green-400 text-green-400" 
                        />
                      ))}
                    </div>
                    <p className="text-muted-foreground">
                      Highly trusted by the community
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm pt-4">
                      <div className="text-center">
                        <div className="font-semibold">98%</div>
                        <div className="text-muted-foreground">Accuracy Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">1.2d</div>
                        <div className="text-muted-foreground">Avg Response</div>
                      </div>
                    </div>
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