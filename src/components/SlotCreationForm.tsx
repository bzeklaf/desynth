import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CalendarIcon, Clock, DollarSign, Plus } from 'lucide-react';

interface SlotFormData {
  title: string;
  description: string;
  equipment: string;
  scale_capacity: string;
  compliance_level: string;
  start_date: string;
  end_date: string;
  price: string;
  cancellation_policy: string;
  qa_deliverables: string;
}

interface SlotCreationFormProps {
  onSlotCreated?: () => void;
}

export const SlotCreationForm = ({ onSlotCreated }: SlotCreationFormProps) => {
  const [formData, setFormData] = useState<SlotFormData>({
    title: '',
    description: '',
    equipment: '',
    scale_capacity: '',
    compliance_level: '',
    start_date: '',
    end_date: '',
    price: '',
    cancellation_policy: '',
    qa_deliverables: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const handleInputChange = (field: keyof SlotFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateDuration = () => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      return diffHours;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profile) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a slot.",
        variant: "destructive",
      });
      return;
    }

    if (profile.role !== 'facility') {
      toast({
        title: "Access denied",
        description: "Only facility owners can create slots.",
        variant: "destructive",
      });
      return;
    }

    // Validation
    if (!formData.title || !formData.equipment || !formData.compliance_level || 
        !formData.start_date || !formData.end_date || !formData.price) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    
    if (startDate >= endDate) {
      toast({
        title: "Invalid dates",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }

    if (startDate < new Date()) {
      toast({
        title: "Invalid start date",
        description: "Start date cannot be in the past.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // First, get the facility ID for this user
      const { data: facilities, error: facilityError } = await supabase
        .from('facilities')
        .select('id')
        .eq('owner_user_id', user.id)
        .limit(1);

      if (facilityError) throw facilityError;

      if (!facilities || facilities.length === 0) {
        toast({
          title: "No facility found",
          description: "Please create a facility profile first.",
          variant: "destructive",
        });
        return;
      }

      const facilityId = facilities[0].id;
      const duration = calculateDuration();

      const { error } = await supabase
        .from('slots')
        .insert({
          facility_id: facilityId,
          title: formData.title,
          description: formData.description || null,
          equipment: formData.equipment,
          scale_capacity: formData.scale_capacity || null,
          compliance_level: formData.compliance_level as 'gmp' | 'rd' | 'gcp',
          start_date: formData.start_date,
          end_date: formData.end_date,
          duration_hours: duration,
          price: parseFloat(formData.price),
          is_available: true,
          cancellation_policy: formData.cancellation_policy || null,
          qa_deliverables: formData.qa_deliverables || null
        });

      if (error) throw error;

      toast({
        title: "Slot created successfully",
        description: "Your slot is now available for booking.",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        equipment: '',
        scale_capacity: '',
        compliance_level: '',
        start_date: '',
        end_date: '',
        price: '',
        cancellation_policy: '',
        qa_deliverables: ''
      });

      onSlotCreated?.();
    } catch (error) {
      console.error('Error creating slot:', error);
      toast({
        title: "Failed to create slot",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create New Slot
        </CardTitle>
        <CardDescription>Add a new biomanufacturing slot to your facility</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Slot Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Vaccine Production Scale-Up"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipment">Equipment *</Label>
              <Input
                id="equipment"
                value={formData.equipment}
                onChange={(e) => handleInputChange('equipment', e.target.value)}
                placeholder="e.g., Bioreactor 500L"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="compliance_level">Compliance Level *</Label>
              <Select value={formData.compliance_level} onValueChange={(value) => handleInputChange('compliance_level', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select compliance level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gmp">GMP (Good Manufacturing Practice)</SelectItem>
                  <SelectItem value="rd">R&D (Research & Development)</SelectItem>
                  <SelectItem value="gcp">GCP (Good Clinical Practice)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scale_capacity">Scale Capacity</Label>
              <Input
                id="scale_capacity"
                value={formData.scale_capacity}
                onChange={(e) => handleInputChange('scale_capacity', e.target.value)}
                placeholder="e.g., 500L - 2000L"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (USD) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {calculateDuration()} hours
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Detailed description of the slot, processes, and requirements..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qa_deliverables">QA Deliverables</Label>
            <Textarea
              id="qa_deliverables"
              value={formData.qa_deliverables}
              onChange={(e) => handleInputChange('qa_deliverables', e.target.value)}
              placeholder="List of quality assurance deliverables and documentation..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancellation_policy">Cancellation Policy</Label>
            <Textarea
              id="cancellation_policy"
              value={formData.cancellation_policy}
              onChange={(e) => handleInputChange('cancellation_policy', e.target.value)}
              placeholder="Cancellation terms and refund policy..."
              rows={2}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Slot...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Slot
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};