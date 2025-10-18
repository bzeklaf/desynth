import { useState, useEffect } from 'react';
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
  facility_id: string;
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

interface Facility {
  id: string;
  name: string;
  location: string;
  status: string;
}

interface SlotCreationFormProps {
  onSlotCreated?: () => void;
}

export const SlotCreationForm = ({ onSlotCreated }: SlotCreationFormProps) => {
  const [formData, setFormData] = useState<SlotFormData>({
    facility_id: '',
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
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    const fetchFacilities = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('facilities')
          .select('id, name, location, status')
          .eq('owner_user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setFacilities(data || []);
        
        // Auto-select first approved facility
        const approvedFacility = data?.find(f => f.status === 'approved');
        if (approvedFacility && !formData.facility_id) {
          setFormData(prev => ({ ...prev, facility_id: approvedFacility.id }));
        }
      } catch (error) {
        console.error('Error fetching facilities:', error);
      } finally {
        setLoadingFacilities(false);
      }
    };

    fetchFacilities();
  }, [user]);

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
    if (!formData.facility_id || !formData.title || !formData.equipment || 
        !formData.compliance_level || !formData.start_date || !formData.end_date || !formData.price) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields, including facility selection.",
        variant: "destructive",
      });
      return;
    }

    // Verify selected facility is approved
    const selectedFacility = facilities.find(f => f.id === formData.facility_id);
    if (selectedFacility?.status !== 'approved') {
      toast({
        title: "Facility not approved",
        description: "You can only create slots for approved facilities.",
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

      const duration = calculateDuration();

      const { error } = await supabase
        .from('slots')
        .insert({
          facility_id: formData.facility_id,
          title: formData.title,
          description: formData.description || null,
          equipment: formData.equipment,
          scale_capacity: formData.scale_capacity || null,
          compliance_level: formData.compliance_level as 'basic' | 'gmp' | 'fda' | 'iso',
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

      // Reset form but keep facility selection
      setFormData({
        facility_id: formData.facility_id,
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
          {loadingFacilities ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading facilities...</p>
            </div>
          ) : facilities.length === 0 ? (
            <div className="bg-muted/30 p-6 rounded-lg text-center">
              <p className="text-muted-foreground mb-4">
                You need to register a facility before creating slots.
              </p>
              <Button type="button" onClick={() => window.location.href = '/profile'}>
                Register Facility
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="facility">Select Facility *</Label>
                <Select value={formData.facility_id} onValueChange={(value) => handleInputChange('facility_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a facility" />
                  </SelectTrigger>
                  <SelectContent>
                    {facilities.map((facility) => (
                      <SelectItem key={facility.id} value={facility.id} disabled={facility.status !== 'approved'}>
                        {facility.name} - {facility.location}
                        {facility.status !== 'approved' && ` (${facility.status})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.facility_id && facilities.find(f => f.id === formData.facility_id)?.status !== 'approved' && (
                  <p className="text-sm text-amber-600">This facility is pending approval</p>
                )}
              </div>

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
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="gmp">GMP (Good Manufacturing Practice)</SelectItem>
                  <SelectItem value="fda">FDA Approved</SelectItem>
                  <SelectItem value="iso">ISO Certified</SelectItem>
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

              <Button type="submit" disabled={loading || !formData.facility_id} className="w-full">
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
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
};