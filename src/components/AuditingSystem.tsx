import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Shield, 
  FileText, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Upload,
  Eye,
  Users,
  Calendar,
  BarChart3,
  Search,
  Filter,
  Star,
  Award,
  Building2
} from 'lucide-react';

interface AuditTask {
  id: string;
  booking_id: string;
  facility_name: string;
  facility_location: string;
  production_type: string;
  audit_type: 'pre_production' | 'in_progress' | 'post_production' | 'compliance';
  status: 'assigned' | 'in_review' | 'completed' | 'requires_action';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_date: string;
  due_date: string;
  completion_date?: string;
  client_name: string;
  progress: number;
  findings: number;
  documents_count: number;
}

interface AuditFinding {
  id: string;
  audit_id: string;
  category: 'compliance' | 'quality' | 'safety' | 'documentation' | 'process';
  severity: 'minor' | 'major' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  status: 'open' | 'acknowledged' | 'resolved' | 'closed';
  created_date: string;
  resolved_date?: string;
}

interface AuditReport {
  id: string;
  audit_id: string;
  title: string;
  summary: string;
  overall_rating: 'pass' | 'conditional_pass' | 'fail';
  compliance_score: number;
  quality_score: number;
  safety_score: number;
  generated_date: string;
  approved_by?: string;
  approval_date?: string;
}

export const AuditingSystem = () => {
  const [audits, setAudits] = useState<AuditTask[]>([]);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<AuditTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAudits();
      fetchFindings();
      fetchReports();
    }
  }, [user]);

  const fetchAudits = async () => {
    try {
      const { data: audits, error } = await supabase
        .from('audit_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedAudits: AuditTask[] = audits?.map(audit => ({
        id: audit.id,
        booking_id: audit.booking_id,
        facility_name: 'Facility Name', // TODO: Get from facilities table
        facility_location: 'Location', // TODO: Get from facilities table
        production_type: 'Production Type', // TODO: Get from bookings table
        audit_type: audit.audit_type as 'pre_production' | 'in_progress' | 'post_production' | 'compliance',
        status: audit.status as 'assigned' | 'in_review' | 'completed' | 'requires_action',
        priority: audit.priority as 'low' | 'medium' | 'high' | 'urgent',
        assigned_date: audit.assigned_date,
        due_date: audit.due_date,
        completion_date: audit.completion_date,
        client_name: 'Client Name', // TODO: Get from bookings/users table
        progress: audit.progress,
        findings: 0, // TODO: Calculate from findings table
        documents_count: audit.documents_count || 0
      })) || [];

      setAudits(formattedAudits);
    } catch (error) {
      console.error('Error fetching audits:', error);
      toast({
        title: "Error",
        description: "Failed to load audit tasks.",
        variant: "destructive"
      });
    }
  };

  const fetchFindings = async () => {
    try {
      const { data: findings, error } = await supabase
        .from('audit_findings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedFindings: AuditFinding[] = findings?.map(finding => ({
        id: finding.id,
        audit_id: finding.audit_id,
        category: finding.category as 'compliance' | 'quality' | 'safety' | 'documentation' | 'process',
        severity: finding.severity as 'minor' | 'major' | 'critical',
        title: finding.title,
        description: finding.description,
        recommendation: finding.recommendation,
        status: finding.status as 'open' | 'acknowledged' | 'resolved' | 'closed',
        created_date: finding.created_at.split('T')[0],
        resolved_date: finding.resolved_at ? finding.resolved_at.split('T')[0] : undefined
      })) || [];

      setFindings(formattedFindings);
    } catch (error) {
      console.error('Error fetching findings:', error);
      toast({
        title: "Error",
        description: "Failed to load audit findings.",
        variant: "destructive"
      });
    }
  };

  const fetchReports = async () => {
    try {
      const { data: reports, error } = await supabase
        .from('audit_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedReports: AuditReport[] = reports?.map(report => ({
        id: report.id,
        audit_id: report.audit_id,
        title: report.title,
        summary: report.summary,
        overall_rating: report.overall_rating as 'pass' | 'conditional_pass' | 'fail',
        compliance_score: report.compliance_score,
        quality_score: report.quality_score,
        safety_score: report.safety_score,
        generated_date: report.created_at.split('T')[0],
        approved_by: report.approved_by,
        approval_date: report.approved_at ? report.approved_at.split('T')[0] : undefined
      })) || [];

      setReports(formattedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to load audit reports.",
        variant: "destructive"
      });
    }
  };

  const updateAuditStatus = async (auditId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('audit_tasks')
        .update({ 
          status: status,
          completion_date: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', auditId);

      if (error) throw error;

      setAudits(prev => 
        prev.map(audit => 
          audit.id === auditId ? { 
            ...audit, 
            status: status as any,
            completion_date: status === 'completed' ? new Date().toISOString().split('T')[0] : audit.completion_date
          } : audit
        )
      );

      toast({
        title: "Status Updated",
        description: `Audit status has been updated to ${status}.`,
      });
    } catch (error) {
      console.error('Error updating audit status:', error);
      toast({
        title: "Error",
        description: "Failed to update audit status.",
        variant: "destructive"
      });
    }
  };

  const updateFindingStatus = async (findingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('audit_findings')
        .update({ 
          status: status,
          resolved_at: status === 'resolved' || status === 'closed' ? new Date().toISOString() : null
        })
        .eq('id', findingId);

      if (error) throw error;

      setFindings(prev => 
        prev.map(finding => 
          finding.id === findingId ? { 
            ...finding, 
            status: status as any,
            resolved_date: status === 'resolved' || status === 'closed' ? new Date().toISOString().split('T')[0] : finding.resolved_date
          } : finding
        )
      );

      toast({
        title: "Finding Updated",
        description: `Finding status has been updated to ${status}.`,
      });
    } catch (error) {
      console.error('Error updating finding status:', error);
      toast({
        title: "Error",
        description: "Failed to update finding status.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      assigned: { variant: 'default' as const, color: 'text-blue-600' },
      in_review: { variant: 'default' as const, color: 'text-yellow-600' },
      completed: { variant: 'default' as const, color: 'text-green-600' },
      requires_action: { variant: 'destructive' as const, color: 'text-red-600' },
      open: { variant: 'destructive' as const, color: 'text-red-600' },
      acknowledged: { variant: 'default' as const, color: 'text-yellow-600' },
      resolved: { variant: 'default' as const, color: 'text-green-600' },
      closed: { variant: 'outline' as const, color: 'text-gray-600' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.assigned;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { variant: 'outline' as const, color: 'text-gray-600' },
      medium: { variant: 'default' as const, color: 'text-blue-600' },
      high: { variant: 'default' as const, color: 'text-orange-600' },
      urgent: { variant: 'destructive' as const, color: 'text-red-600' }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      minor: { variant: 'default' as const, color: 'text-yellow-600' },
      major: { variant: 'default' as const, color: 'text-orange-600' },
      critical: { variant: 'destructive' as const, color: 'text-red-600' }
    };
    
    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.minor;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const filteredAudits = audits.filter(audit => {
    const matchesSearch = audit.facility_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         audit.client_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || audit.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Management</h1>
          <p className="text-muted-foreground mt-1">Manage facility audits and compliance reviews</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Reports
          </Button>
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Upload Documents
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Audits</p>
                <p className="text-2xl font-bold">{audits.filter(a => a.status !== 'completed').length}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Findings</p>
                <p className="text-2xl font-bold">{findings.filter(f => f.status === 'open').length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Audits</p>
                <p className="text-2xl font-bold">{audits.filter(a => a.status === 'completed').length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Compliance Score</p>
                <p className="text-2xl font-bold">87%</p>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="audits" className="space-y-6">
        <TabsList>
          <TabsTrigger value="audits">Audit Tasks</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="audits" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search audits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="requires_action">Requires Action</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Audit List */}
          <div className="grid gap-4">
            {filteredAudits.map((audit) => (
              <Card key={audit.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{audit.facility_name}</h3>
                        {getStatusBadge(audit.status)}
                        {getPriorityBadge(audit.priority)}
                        <Badge variant="outline">{audit.audit_type.replace('_', ' ')}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {audit.facility_location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {audit.client_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due: {audit.due_date}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {audit.documents_count} documents
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{audit.progress}%</span>
                        </div>
                        <Progress value={audit.progress} />
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Production: {audit.production_type}
                        </span>
                        {audit.findings > 0 && (
                          <Badge variant="outline" className="text-orange-600">
                            {audit.findings} findings
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Select
                        value={audit.status}
                        onValueChange={(value) => updateAuditStatus(audit.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="in_review">In Review</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="requires_action">Requires Action</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="findings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Findings</CardTitle>
              <CardDescription>Review and manage audit findings and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {findings.map((finding) => (
                  <div key={finding.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold">{finding.title}</h4>
                        {getSeverityBadge(finding.severity)}
                        {getStatusBadge(finding.status)}
                        <Badge variant="outline">{finding.category}</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">{finding.created_date}</span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{finding.description}</p>
                    
                    <div className="bg-muted/50 rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium mb-1">Recommendation:</p>
                      <p className="text-sm text-muted-foreground">{finding.recommendation}</p>
                    </div>
                    
                    <div className="flex justify-end">
                      <Select
                        value={finding.status}
                        onValueChange={(value) => updateFindingStatus(finding.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="acknowledged">Acknowledged</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Reports</CardTitle>
              <CardDescription>Generated audit reports and summaries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{report.title}</h4>
                        <p className="text-sm text-muted-foreground">{report.summary}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={report.overall_rating === 'pass' ? 'default' : 
                                  report.overall_rating === 'conditional_pass' ? 'default' : 'destructive'}
                          className={report.overall_rating === 'pass' ? 'text-green-600' : 
                                    report.overall_rating === 'conditional_pass' ? 'text-yellow-600' : 'text-red-600'}
                        >
                          {report.overall_rating.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium">Compliance</p>
                        <p className="text-2xl font-bold text-blue-600">{report.compliance_score}%</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Quality</p>
                        <p className="text-2xl font-bold text-green-600">{report.quality_score}%</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Safety</p>
                        <p className="text-2xl font-bold text-purple-600">{report.safety_score}%</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Generated: {report.generated_date}</span>
                      {report.approved_by && (
                        <span>Approved by: {report.approved_by}</span>
                      )}
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Audit Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Compliance Score Trend</span>
                      <span className="text-sm text-green-600">↑ 3.2%</span>
                    </div>
                    <Progress value={87} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Average Audit Duration</span>
                      <span className="text-sm text-blue-600">12.3 days</span>
                    </div>
                    <Progress value={65} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Finding Resolution Rate</span>
                      <span className="text-sm text-purple-600">78%</span>
                    </div>
                    <Progress value={78} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Finding Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Compliance</span>
                    <span className="text-sm font-semibold">32%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Quality</span>
                    <span className="text-sm font-semibold">28%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Documentation</span>
                    <span className="text-sm font-semibold">21%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Safety</span>
                    <span className="text-sm font-semibold">12%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Process</span>
                    <span className="text-sm font-semibold">7%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};