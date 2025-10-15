import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  Clock,
  DollarSign
} from 'lucide-react';

interface EscrowData {
  id: string;
  booking_id: string;
  buyer_address: string;
  facility_address: string;
  amount: number;
  network: string;
  status: string;
  funding_tx_hash?: string;
  created_at: string;
  funded_at?: string;
}

interface EscrowManagerProps {
  bookingId: string;
  userRole?: 'buyer' | 'facility' | 'auditor' | 'admin';
}

export const EscrowManager = ({ bookingId, userRole = 'buyer' }: EscrowManagerProps) => {
  const [escrowData, setEscrowData] = useState<EscrowData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEscrowData();
  }, [bookingId]);

  const fetchEscrowData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('crypto_escrows')
        .select('*')
        .eq('booking_id', bookingId)
        .maybeSingle();

      if (error) throw error;
      setEscrowData(data);
    } catch (error) {
      console.error('Error fetching escrow:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'funded':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'created':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'funded':
        return <CheckCircle className="w-4 h-4" />;
      case 'created':
        return <Clock className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Escrow Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading escrow information...</p>
        </CardContent>
      </Card>
    );
  }

  if (!escrowData) {
    return (
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Escrow Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No escrow found for this booking. Payment may still be pending.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Escrow Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon(escrowData.status)}
            <div>
              <p className="font-semibold">Current Status</p>
              <p className="text-sm text-muted-foreground">Last updated: {new Date(escrowData.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <Badge className={getStatusColor(escrowData.status)}>
            {escrowData.status}
          </Badge>
        </div>

        {/* Payment Details */}
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 border border-border rounded-lg">
            <span className="text-sm text-muted-foreground">Escrow Amount</span>
            <span className="font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              {escrowData.amount} ETH
            </span>
          </div>

          <div className="flex justify-between items-center p-3 border border-border rounded-lg">
            <span className="text-sm text-muted-foreground">Network</span>
            <Badge variant="outline" className="capitalize">
              {escrowData.network}
            </Badge>
          </div>

          {escrowData.funding_tx_hash && (
            <div className="flex justify-between items-center p-3 border border-border rounded-lg">
              <span className="text-sm text-muted-foreground">Transaction</span>
              <a 
                href={`https://sepolia.etherscan.io/tx/${escrowData.funding_tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <span className="font-mono text-xs">
                  {escrowData.funding_tx_hash.slice(0, 10)}...
                </span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Info Alert */}
        <Alert className="border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Funds are securely held in the escrow wallet until completion is verified.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
