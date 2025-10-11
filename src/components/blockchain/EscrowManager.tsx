import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBlockchain } from '@/hooks/useBlockchain';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  Lock, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  Clock,
  DollarSign,
  Gavel,
  Loader2
} from 'lucide-react';

interface EscrowData {
  id: string;
  booking_id: string;
  buyer_address: string;
  facility_address: string;
  amount: number;
  token_address: string;
  network: string;
  status: string;
  funding_tx_hash?: string;
  release_tx_hash?: string;
  dispute_winner?: string;
  created_at: string;
  funded_at?: string;
  released_at?: string;
  disputed_at?: string;
  resolved_at?: string;
}

interface EscrowManagerProps {
  bookingId: string;
  userRole?: 'buyer' | 'facility' | 'auditor' | 'admin';
}

export const EscrowManager = ({ bookingId, userRole = 'buyer' }: EscrowManagerProps) => {
  const [escrowData, setEscrowData] = useState<EscrowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const { releaseEscrow, disputeEscrow } = useBlockchain();
  const { user } = useAuth();

  useEffect(() => {
    fetchEscrowData();
    
    // Set up real-time subscription for escrow updates
    const channel = supabase
      .channel('escrow-updates')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'crypto_escrows',
          filter: `booking_id=eq.${bookingId}`
        }, 
        (payload) => {
          setEscrowData(payload.new as EscrowData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  const fetchEscrowData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('crypto-escrow', {
        body: {
          action: 'status',
          bookingId
        }
      });

      if (error) throw error;

      if (data?.success) {
        setEscrowData(data.escrow);
      }
    } catch (error) {
      console.error('Error fetching escrow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseEscrow = async () => {
    if (!escrowData) return;
    
    try {
      setActionLoading(true);
      await releaseEscrow(escrowData.booking_id);
      await fetchEscrowData(); // Refresh data
    } catch (error) {
      console.error('Error releasing escrow:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisputeEscrow = async () => {
    if (!escrowData) return;
    
    try {
      setActionLoading(true);
      await disputeEscrow(escrowData.booking_id);
      await fetchEscrowData(); // Refresh data
    } catch (error) {
      console.error('Error disputing escrow:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveDispute = async (winner: 'buyer' | 'facility') => {
    if (!escrowData) return;
    
    try {
      setActionLoading(true);
      const { error } = await supabase.functions.invoke('crypto-escrow', {
        body: {
          action: 'resolve',
          bookingId: escrowData.booking_id,
          disputeWinner: winner
        }
      });

      if (error) throw error;
      await fetchEscrowData();
    } catch (error) {
      console.error('Error resolving dispute:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'funded': return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'released': return 'status-bullish';
      case 'disputed': return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'resolved': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created': return <Clock className="w-4 h-4" />;
      case 'funded': return <Lock className="w-4 h-4" />;
      case 'released': return <CheckCircle className="w-4 h-4" />;
      case 'disputed': return <AlertTriangle className="w-4 h-4" />;
      case 'resolved': return <Gavel className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const canRelease = () => {
    return userRole === 'auditor' && 
           escrowData?.status === 'funded' && 
           !escrowData.disputed_at;
  };

  const canDispute = () => {
    return (userRole === 'buyer' || userRole === 'facility') && 
           escrowData?.status === 'funded' && 
           !escrowData.disputed_at;
  };

  const canResolve = () => {
    return userRole === 'admin' && escrowData?.status === 'disputed';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className="card-glow">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading escrow data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!escrowData) {
    return (
      <Card className="card-glow">
        <CardContent className="p-6">
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Escrow Found</h3>
            <p className="text-muted-foreground">
              No crypto escrow has been created for this booking yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-glow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Crypto Escrow
          </CardTitle>
          <Badge className={getStatusColor(escrowData.status)}>
            {getStatusIcon(escrowData.status)}
            <span className="ml-1 capitalize">{escrowData.status}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Escrow Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Escrow Amount</div>
              <div className="font-semibold text-lg flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                ${escrowData.amount.toFixed(2)} USDC
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Network</div>
              <div className="font-semibold capitalize">{escrowData.network}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Created</div>
              <div className="font-semibold">{formatDate(escrowData.created_at)}</div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Buyer Address</div>
              <div className="font-mono text-sm">{escrowData.buyer_address.slice(0, 20)}...</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Facility Address</div>
              <div className="font-mono text-sm">{escrowData.facility_address.slice(0, 20)}...</div>
            </div>
            {escrowData.funded_at && (
              <div>
                <div className="text-sm text-muted-foreground">Funded</div>
                <div className="font-semibold">{formatDate(escrowData.funded_at)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Hashes */}
        {escrowData.funding_tx_hash && (
          <div className="p-3 bg-muted/20 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Funding Transaction</div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">{escrowData.funding_tx_hash}</span>
              <ExternalLink className="w-4 h-4 cursor-pointer" />
            </div>
          </div>
        )}

        {escrowData.release_tx_hash && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Release Transaction</div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">{escrowData.release_tx_hash}</span>
              <ExternalLink className="w-4 h-4 cursor-pointer" />
            </div>
          </div>
        )}

        {/* Status Messages */}
        {escrowData.status === 'disputed' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This escrow is currently under dispute. Admin review is required.
              {escrowData.disputed_at && (
                <div className="mt-2">
                  <span className="text-xs">Disputed on: {formatDate(escrowData.disputed_at)}</span>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {escrowData.status === 'resolved' && escrowData.dispute_winner && (
          <Alert className="border-purple-200 bg-purple-50">
            <Gavel className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-800">
              Dispute resolved in favor of: <strong>{escrowData.dispute_winner}</strong>
              {escrowData.resolved_at && (
                <div className="mt-2">
                  <span className="text-xs">Resolved on: {formatDate(escrowData.resolved_at)}</span>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {escrowData.status === 'released' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Escrow has been released to the facility.
              {escrowData.released_at && (
                <div className="mt-2">
                  <span className="text-xs">Released on: {formatDate(escrowData.released_at)}</span>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {canRelease() && (
            <Button 
              onClick={handleReleaseEscrow}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Release Escrow
            </Button>
          )}
          
          {canDispute() && (
            <Button 
              onClick={handleDisputeEscrow}
              disabled={actionLoading}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <AlertTriangle className="w-4 h-4 mr-2" />
              )}
              Dispute Escrow
            </Button>
          )}
          
          {canResolve() && (
            <div className="flex gap-2">
              <Button 
                onClick={() => handleResolveDispute('buyer')}
                disabled={actionLoading}
                variant="outline"
              >
                Resolve for Buyer
              </Button>
              <Button 
                onClick={() => handleResolveDispute('facility')}
                disabled={actionLoading}
                variant="outline"
              >
                Resolve for Facility
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};