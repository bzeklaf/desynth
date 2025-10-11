import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatDateTime } from '@/lib/utils';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  FileText,
  Calendar,
  Award,
  AlertCircle,
  Download,
  Upload,
  Eye,
  Edit
} from 'lucide-react';

interface ComplianceItem {
  id: string;
  title: string;
  type: 'certificate' | 'audit' | 'training' | 'documentation' | 'inspection';
  status: 'compliant' | 'expiring_soon' | 'expired' | 'pending' | 'non_compliant';
  compliance_framework: 'GMP' | 'ISO_13485' | 'FDA_21CFR' | 'EU_GMP' | 'ICH_Q7' | 'ISPE';
  issue_date: string;
  expiry_date?: string;
  responsible_person: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  completion_percentage: number;
  next_action: string;
  documents: string[];
}

interface ComplianceMetrics {
  total_items: number;
  compliant: number;
  expiring_soon: number;
  expired: number;
  pending: number;
  compliance_score: number;
}

export const ComplianceTracker = () => {
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      
      // Mock compliance data - replace with actual Supabase query
      const mockComplianceItems: ComplianceItem[] = [
        {
          id: '1',
          title: 'GMP Manufacturing License',
          type: 'certificate',
          status: 'compliant',
          compliance_framework: 'GMP',
          issue_date: '2023-01-15',
          expiry_date: '2025-01-15',
          responsible_person: 'Dr. Sarah Johnson',
          description: 'Primary GMP manufacturing license for pharmaceutical production',
          priority: 'high',
          completion_percentage: 100,
          next_action: 'Schedule renewal review 6 months before expiry',
          documents: ['gmp-license-2023.pdf', 'inspection-report.pdf']
        },
        {
          id: '2',
          title: 'Annual Safety Training',
          type: 'training',
          status: 'expiring_soon',
          compliance_framework: 'ISO_13485',
          issue_date: '2023-03-01',
          expiry_date: '2024-03-01',
          responsible_person: 'Mark Wilson',
          description: 'Mandatory safety training for all production staff',
          priority: 'high',
          completion_percentage: 85,
          next_action: 'Complete remaining training modules by Feb 15',
          documents: ['training-records.xlsx', 'curriculum.pdf']
        },
        {
          id: '3',
          title: 'FDA Process Validation',
          type: 'documentation',
          status: 'pending',
          compliance_framework: 'FDA_21CFR',
          issue_date: '2024-01-10',
          responsible_person: 'Dr. Emily Chen',
          description: 'Process validation documentation for new bioreactor system',
          priority: 'high',
          completion_percentage: 60,
          next_action: 'Submit validation protocol for review',
          documents: ['validation-protocol-draft.docx']
        },
        {
          id: '4',
          title: 'Quality Management System Audit',
          type: 'audit',
          status: 'compliant',
          compliance_framework: 'ISO_13485',
          issue_date: '2023-09-15',
          expiry_date: '2024-09-15',
          responsible_person: 'Jennifer Lee',
          description: 'Annual internal QMS audit',
          priority: 'medium',
          completion_percentage: 100,
          next_action: 'Prepare for next annual audit',
          documents: ['audit-report-2023.pdf', 'corrective-actions.xlsx']
        },
        {
          id: '5',
          title: 'Sterility Testing Qualification',
          type: 'inspection',
          status: 'expired',
          compliance_framework: 'EU_GMP',
          issue_date: '2022-06-01',
          expiry_date: '2024-01-01',
          responsible_person: 'Dr. Michael Brown',
          description: 'Sterility testing facility qualification',
          priority: 'high',
          completion_percentage: 0,
          next_action: 'Schedule immediate re-qualification',
          documents: ['sterility-protocol.pdf']
        }
      ];

      const mockMetrics: ComplianceMetrics = {
        total_items: mockComplianceItems.length,
        compliant: mockComplianceItems.filter(item => item.status === 'compliant').length,
        expiring_soon: mockComplianceItems.filter(item => item.status === 'expiring_soon').length,
        expired: mockComplianceItems.filter(item => item.status === 'expired').length,
        pending: mockComplianceItems.filter(item => item.status === 'pending').length,
        compliance_score: Math.round((mockComplianceItems.filter(item => item.status === 'compliant').length / mockComplianceItems.length) * 100)
      };

      setComplianceItems(mockComplianceItems);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error loading compliance data:', error);
      toast({
        title: "Error loading compliance data",
        description: "Failed to load compliance information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Compliant</Badge>;
      case 'expiring_soon':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Expiring Soon</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Pending</Badge>;
      case 'non_compliant':
        return <Badge variant="destructive">Non-Compliant</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'certificate':
        return <Award className="w-4 h-4" />;
      case 'audit':
        return <Shield className="w-4 h-4" />;
      case 'training':
        return <FileText className="w-4 h-4" />;
      case 'documentation':
        return <FileText className="w-4 h-4" />;
      case 'inspection':
        return <Eye className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="card-glow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Compliance Score</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.compliance_score}%</p>
                </div>
                <Shield className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-glow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Compliant</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.compliant}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Expiring Soon</p>
                  <p className="text-2xl font-bold text-yellow-600">{metrics.expiring_soon}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Expired</p>
                  <p className="text-2xl font-bold text-red-600">{metrics.expired}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-blue-600">{metrics.pending}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Compliance Tracker */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Compliance Tracker
          </CardTitle>
          <CardDescription>Monitor and manage regulatory compliance requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="certificates">Certificates</TabsTrigger>
              <TabsTrigger value="audits">Audits</TabsTrigger>
              <TabsTrigger value="training">Training</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {complianceItems.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex-shrink-0 mt-1">
                            {getTypeIcon(item.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{item.title}</h4>
                              {getStatusBadge(item.status)}
                              <Badge variant="outline" className="text-xs">
                                {item.compliance_framework}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {item.description}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Responsible:</span>
                                <span className="ml-1 font-medium">{item.responsible_person}</span>
                              </div>
                              {item.expiry_date && (
                                <div>
                                  <span className="text-muted-foreground">Expires:</span>
                                  <span className="ml-1 font-medium">{formatDate(item.expiry_date)}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-muted-foreground">Priority:</span>
                                <span className={`ml-1 font-medium ${getPriorityColor(item.priority)}`}>
                                  {item.priority.toUpperCase()}
                                </span>
                              </div>
                            </div>
                            {item.completion_percentage < 100 && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm text-muted-foreground">Progress</span>
                                  <span className="text-sm font-medium">{item.completion_percentage}%</span>
                                </div>
                                <Progress value={item.completion_percentage} className="h-2" />
                              </div>
                            )}
                            <div className="mt-3 p-2 bg-muted/50 rounded-md">
                              <p className="text-sm">
                                <span className="font-medium">Next Action:</span> {item.next_action}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="certificates" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {complianceItems
                  .filter(item => item.type === 'certificate')
                  .map((item) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{item.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span>Issued: {formatDate(item.issue_date)}</span>
                              {item.expiry_date && (
                                <span>Expires: {formatDate(item.expiry_date)}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(item.status)}
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="audits" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {complianceItems
                  .filter(item => item.type === 'audit')
                  .map((item) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{item.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span>Date: {formatDate(item.issue_date)}</span>
                              <span>Auditor: {item.responsible_person}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(item.status)}
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="training" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {complianceItems
                  .filter(item => item.type === 'training')
                  .map((item) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-muted-foreground">Completion Progress</span>
                                <span className="text-sm font-medium">{item.completion_percentage}%</span>
                              </div>
                              <Progress value={item.completion_percentage} className="h-2" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {getStatusBadge(item.status)}
                            <Button variant="outline" size="sm">
                              Continue
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};