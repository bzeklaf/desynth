import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, TrendingUp, AlertCircle } from 'lucide-react';
import { useBlockchain } from '@/hooks/useBlockchain';

export const InsurancePoolStatus = () => {
  const [poolBalance, setPoolBalance] = useState('0');
  const [totalClaims, setTotalClaims] = useState('0');
  const [activeDisputes, setActiveDisputes] = useState(0);
  const { getInsurancePoolBalance, isConnected } = useBlockchain();

  useEffect(() => {
    const fetchPoolData = async () => {
      if (!isConnected) return;
      
      try {
        const balance = await getInsurancePoolBalance();
        setPoolBalance(balance);
        // Mock data for demonstration
        setTotalClaims('15000');
        setActiveDisputes(2);
      } catch (error) {
        console.error('Failed to fetch insurance pool data:', error);
      }
    };

    fetchPoolData();
  }, [isConnected, getInsurancePoolBalance]);

  if (!isConnected) {
    return null;
  }

  const utilizationRate = (parseFloat(totalClaims) / Math.max(parseFloat(poolBalance), 1)) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Insurance Pool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Pool Balance</p>
            <p className="text-2xl font-bold">${parseFloat(poolBalance).toLocaleString()}</p>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +5.2% this month
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Claims Paid</p>
            <p className="text-2xl font-bold">${parseFloat(totalClaims).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">All time</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Pool Utilization</span>
            <span>{utilizationRate.toFixed(1)}%</span>
          </div>
          <Progress value={Math.min(utilizationRate, 100)} className="h-2" />
        </div>

        {activeDisputes > 0 && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <div className="text-sm">
              <span className="font-medium text-yellow-800">
                {activeDisputes} active dispute{activeDisputes !== 1 ? 's' : ''}
              </span>
              <p className="text-yellow-700">Pending resolution and potential payouts</p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Badge variant="secondary" className="text-xs">
            Auto-staking enabled
          </Badge>
          <Badge variant="secondary" className="text-xs">
            2% fee per booking
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};