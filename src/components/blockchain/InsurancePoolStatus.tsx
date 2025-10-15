import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, TrendingUp } from 'lucide-react';

export const InsurancePoolStatus = () => {
  // Mock data for insurance pool display
  const poolBalance = '50000';
  const totalClaims = '5000';
  const utilizationRate = (parseFloat(totalClaims) / parseFloat(poolBalance)) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Insurance Pool (Coming Soon)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Estimated Pool Balance</p>
            <p className="text-2xl font-bold">${parseFloat(poolBalance).toLocaleString()}</p>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Projected growth
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Estimated Claims</p>
            <p className="text-2xl font-bold">${parseFloat(totalClaims).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Projected</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Utilization Rate</span>
            <span>{utilizationRate.toFixed(1)}%</span>
          </div>
          <Progress value={utilizationRate} className="h-2" />
        </div>

        <div className="flex gap-2">
          <Badge variant="secondary" className="text-xs">
            Coming soon
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Smart contract insurance
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          Insurance pool features will be available in a future update with full smart contract integration.
        </p>
      </CardContent>
    </Card>
  );
};
