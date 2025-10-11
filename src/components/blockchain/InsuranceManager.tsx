import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  DollarSign,
  FileText,
  Upload,
  Loader2
} from 'lucide-react';

interface InsuranceClaim {
  id: string;
  booking_id: string;
  claimant_id: string;
  claim_type: string;
  claim_amount: number;
  status: string;
  evidence_urls: string[];
  description: string;
  admin_notes?: string;
  approved_amount?: number;
  payout_tx_hash?: string;
  created_at: string;
  processed_at?: string;
}

interface InsuranceManagerProps {
  bookingId: string;
  bookingAmount: number;
  userRole?: 'buyer' | 'facility' | 'admin';
}

export const InsuranceManager = ({ bookingId, bookingAmount, userRole = 'buyer' }: InsuranceManagerProps) => {
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    claim_type: '',
    claim_amount: '',
    description: '',
    evidence_urls: ['']
  });

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchClaims();
    
    // Set up real-time subscription for claim updates
    const channel = supabase
      .channel('insurance-claims')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'insurance_claims',
          filter: `booking_id=eq.${bookingId}`
        }, 
        () => {
          fetchClaims();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('insurance_claims')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClaims(data || []);
    } catch (error) {
      console.error('Error fetching insurance claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClaim = async () => {
    if (!user) return;

    try {
      setSubmitting(true);
      
      const { data, error } = await supabase
        .from('insurance_claims')
        .insert({
          booking_id: bookingId,
          claimant_id: user.id,
          claim_type: formData.claim_type,
          claim_amount: parseFloat(formData.claim_amount),
          description: formData.description,
          evidence_urls: formData.evidence_urls.filter(url => url.trim() !== ''),
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Claim Submitted",
        description: "Your insurance claim has been submitted for review.",
      });

      setShowCreateForm(false);
      setFormData({
        claim_type: '',
        claim_amount: '',
        description: '',
        evidence_urls: ['']
      });
      
      fetchClaims();
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit insurance claim. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessClaim = async (claimId: string, status: 'approved' | 'rejected', approvedAmount?: number, notes?: string) => {
    try {
      const { error } = await supabase
        .from('insurance_claims')
        .update({
          status,
          approved_amount: approvedAmount,
          admin_notes: notes,
          processed_at: new Date().toISOString()
        })
        .eq('id', claimId);

      if (error) throw error;

      toast({
        title: `Claim ${status}`,
        description: `The insurance claim has been ${status}.`,
      });

      fetchClaims();
    } catch (error) {
      console.error('Error processing claim:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to process insurance claim.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'approved': return 'status-bullish';
      case 'rejected': return 'status-bearish';
      case 'paid': return 'bg-green-500/10 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <AlertTriangle className="w-4 h-4" />;
      case 'paid': return <DollarSign className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const addEvidenceUrl = () => {
    setFormData(prev => ({
      ...prev,
      evidence_urls: [...prev.evidence_urls, '']
    }));
  };

  const updateEvidenceUrl = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      evidence_urls: prev.evidence_urls.map((url, i) => i === index ? value : url)
    }));
  };

  const canCreateClaim = () => {
    return (userRole === 'buyer' || userRole === 'facility') && !claims.some(c => c.status === 'pending');
  };

  const canProcessClaims = () => {
    return userRole === 'admin';
  };

  return (
    <div className="space-y-6">
      <Card className="card-glow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Insurance Claims
            </CardTitle>
            {canCreateClaim() && (
              <Button 
                onClick={() => setShowCreateForm(!showCreateForm)}
                variant="outline"
              >
                <FileText className="w-4 h-4 mr-2" />
                Create Claim
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Create Claim Form */}
          {showCreateForm && (
            <div className="border border-border/50 p-4 rounded-lg mb-6 space-y-4">
              <h3 className="font-semibold">Submit Insurance Claim</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="claim-type">Claim Type</Label>
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, claim_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select claim type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qa_failure">QA Failure</SelectItem>
                      <SelectItem value="facility_default">Facility Default</SelectItem>
                      <SelectItem value="force_majeure">Force Majeure</SelectItem>
                      <SelectItem value="equipment_failure">Equipment Failure</SelectItem>
                      <SelectItem value="schedule_delay">Schedule Delay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="claim-amount">Claim Amount (USDC)</Label>
                  <Input
                    id="claim-amount"
                    type="number"
                    placeholder="0.00"
                    max={bookingAmount}
                    value={formData.claim_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, claim_amount: e.target.value }))}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Maximum: ${bookingAmount.toFixed(2)} USDC
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the issue and why you're claiming insurance..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label>Evidence URLs</Label>
                {formData.evidence_urls.map((url, index) => (
                  <div key={index} className="flex gap-2 mt-2">
                    <Input
                      placeholder="https://example.com/evidence.pdf"
                      value={url}
                      onChange={(e) => updateEvidenceUrl(index, e.target.value)}
                    />
                  </div>
                ))}
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={addEvidenceUrl}
                  className="mt-2"
                >
                  + Add Evidence URL
                </Button>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmitClaim}
                  disabled={submitting || !formData.claim_type || !formData.claim_amount || !formData.description}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Submit Claim
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Claims List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading claims...
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Insurance Claims</h3>
              <p className="text-muted-foreground">
                No insurance claims have been submitted for this booking.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {claims.map((claim) => (
                <div key={claim.id} className="border border-border/50 p-4 rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold capitalize">
                        {claim.claim_type.replace('_', ' ')} Claim
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Submitted on {new Date(claim.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getStatusColor(claim.status)}>
                      {getStatusIcon(claim.status)}
                      <span className="ml-1 capitalize">{claim.status}</span>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Claim Amount</div>
                      <div className="font-semibold">${claim.claim_amount.toFixed(2)} USDC</div>
                    </div>
                    {claim.approved_amount && (
                      <div>
                        <div className="text-sm text-muted-foreground">Approved Amount</div>
                        <div className="font-semibold text-green-400">${claim.approved_amount.toFixed(2)} USDC</div>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-muted-foreground mb-1">Description</div>
                    <p className="text-sm">{claim.description}</p>
                  </div>

                  {claim.evidence_urls && claim.evidence_urls.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm text-muted-foreground mb-1">Evidence</div>
                      <div className="space-y-1">
                        {claim.evidence_urls.map((url, index) => (
                          <a 
                            key={index}
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline block"
                          >
                            Evidence {index + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {claim.admin_notes && (
                    <Alert className="mb-4">
                      <FileText className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Admin Notes:</strong> {claim.admin_notes}
                      </AlertDescription>
                    </Alert>
                  )}

                  {canProcessClaims() && claim.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        onClick={() => handleProcessClaim(claim.id, 'approved', claim.claim_amount)}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleProcessClaim(claim.id, 'rejected', undefined, 'Claim rejected after review')}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};