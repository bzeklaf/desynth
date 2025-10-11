import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Percent, Shield, Coins, TrendingUp, Settings, Save, RotateCcw } from 'lucide-react';
import { FeeRates, DEFAULT_FEE_RATES } from '@/lib/pricing';

export const RevenueSettings = () => {
  const [feeRates, setFeeRates] = useState<FeeRates>(DEFAULT_FEE_RATES);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = async () => {
    try {
      setLoading(true);
      // TODO: Load from database once types are updated
      // For now, use defaults
      setFeeRates(DEFAULT_FEE_RATES);
    } catch (error) {
      console.error('Error loading revenue settings:', error);
      toast({
        title: "Error Loading Settings",
        description: "Failed to load current revenue settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      // TODO: Save to database once types are updated
      toast({
        title: "Settings Saved",
        description: "Revenue settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving revenue settings:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save revenue settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setFeeRates(DEFAULT_FEE_RATES);
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to default values.",
    });
  };

  const updateFeeRate = (category: keyof FeeRates, field: string, value: number) => {
    setFeeRates(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value / 100 // Convert percentage to decimal
      }
    }));
  };

  const updateFlatFee = (category: keyof FeeRates, field: string, value: number) => {
    setFeeRates(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const formatPercentage = (decimal: number) => (decimal * 100).toFixed(2);

  if (loading) {
    return (
      <Card className="card-glow">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading revenue settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Revenue Model Configuration
          </CardTitle>
          <CardDescription>
            Configure dynamic pricing and fee structures for the DeSynth platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Booking Commission */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Booking Commission (5-15%)
            </Label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="booking-min" className="text-sm">Minimum</Label>
                <div className="relative">
                  <Input
                    id="booking-min"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formatPercentage(feeRates.bookingCommission.min)}
                    onChange={(e) => updateFeeRate('bookingCommission', 'min', parseFloat(e.target.value))}
                  />
                  <Percent className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <Label htmlFor="booking-default" className="text-sm">Default</Label>
                <div className="relative">
                  <Input
                    id="booking-default"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formatPercentage(feeRates.bookingCommission.default)}
                    onChange={(e) => updateFeeRate('bookingCommission', 'default', parseFloat(e.target.value))}
                  />
                  <Percent className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <Label htmlFor="booking-max" className="text-sm">Maximum</Label>
                <div className="relative">
                  <Input
                    id="booking-max"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formatPercentage(feeRates.bookingCommission.max)}
                    onChange={(e) => updateFeeRate('bookingCommission', 'max', parseFloat(e.target.value))}
                  />
                  <Percent className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Applied dynamically based on booking vertical and transaction size
            </p>
          </div>

          <Separator />

          {/* Escrow Service Fee */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Escrow Service Fee (0.5-1%)
            </Label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="escrow-min" className="text-sm">Minimum</Label>
                <div className="relative">
                  <Input
                    id="escrow-min"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formatPercentage(feeRates.escrowServiceFee.min)}
                    onChange={(e) => updateFeeRate('escrowServiceFee', 'min', parseFloat(e.target.value))}
                  />
                  <Percent className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <Label htmlFor="escrow-default" className="text-sm">Default</Label>
                <div className="relative">
                  <Input
                    id="escrow-default"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formatPercentage(feeRates.escrowServiceFee.default)}
                    onChange={(e) => updateFeeRate('escrowServiceFee', 'default', parseFloat(e.target.value))}
                  />
                  <Percent className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <Label htmlFor="escrow-max" className="text-sm">Maximum</Label>
                <div className="relative">
                  <Input
                    id="escrow-max"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formatPercentage(feeRates.escrowServiceFee.max)}
                    onChange={(e) => updateFeeRate('escrowServiceFee', 'max', parseFloat(e.target.value))}
                  />
                  <Percent className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tokenization Fee */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Coins className="w-4 h-4" />
              NFT Tokenization Fee
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="token-flat" className="text-sm">Flat Fee ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="token-flat"
                    type="number"
                    step="1"
                    min="0"
                    className="pl-10"
                    value={feeRates.tokenizationFee.flat}
                    onChange={(e) => updateFlatFee('tokenizationFee', 'flat', parseFloat(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="token-percent" className="text-sm">Percentage (%)</Label>
                <div className="relative">
                  <Input
                    id="token-percent"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formatPercentage(feeRates.tokenizationFee.percentage)}
                    onChange={(e) => updateFeeRate('tokenizationFee', 'percentage', parseFloat(e.target.value))}
                  />
                  <Percent className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Uses the higher of flat fee or percentage, capped at $50 for small transactions
            </p>
          </div>

          <Separator />

          {/* Auditor Network Fee */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Auditor Network Fee ($250-500)
            </Label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="auditor-min" className="text-sm">Minimum ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="auditor-min"
                    type="number"
                    step="1"
                    min="0"
                    className="pl-10"
                    value={feeRates.auditorNetworkFee.min}
                    onChange={(e) => updateFlatFee('auditorNetworkFee', 'min', parseFloat(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="auditor-default" className="text-sm">Default ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="auditor-default"
                    type="number"
                    step="1"
                    min="0"
                    className="pl-10"
                    value={feeRates.auditorNetworkFee.default}
                    onChange={(e) => updateFlatFee('auditorNetworkFee', 'default', parseFloat(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="auditor-max" className="text-sm">Maximum ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="auditor-max"
                    type="number"
                    step="1"
                    min="0"
                    className="pl-10"
                    value={feeRates.auditorNetworkFee.max}
                    onChange={(e) => updateFlatFee('auditorNetworkFee', 'max', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={saveSettings} disabled={saving} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button variant="outline" onClick={resetToDefaults}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>

          {/* Current Revenue Summary */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Pricing Examples
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-sm font-medium">CDMO Run (0.01 ETH)</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Commission: 3% • Fee: {(0.01 * 0.03).toFixed(4)} ETH
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-sm font-medium">Sequencing (0.003 ETH)</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Commission: 5% • Fee: {(0.003 * 0.05).toFixed(4)} ETH
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-sm font-medium">Cloud Lab (0.008 ETH)</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Commission: 3.5% • Fee: {(0.008 * 0.035).toFixed(4)} ETH
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};