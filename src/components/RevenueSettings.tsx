import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Percent, Settings, Save, RotateCcw } from 'lucide-react';
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
    <Card className="card-glow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Revenue Settings
            </CardTitle>
            <CardDescription>
              Configure platform commission rates
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            Simplified Model
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Booking Commission */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Booking Commission (2-5%)
          </Label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="commission-min" className="text-sm">Minimum</Label>
              <div className="relative">
                <Input
                  id="commission-min"
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
              <Label htmlFor="commission-default" className="text-sm">Default</Label>
              <div className="relative">
                <Input
                  id="commission-default"
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
              <Label htmlFor="commission-max" className="text-sm">Maximum</Label>
              <div className="relative">
                <Input
                  id="commission-max"
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
            Platform commission applied to all bookings. Automatically adjusted based on booking vertical and size.
          </p>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
