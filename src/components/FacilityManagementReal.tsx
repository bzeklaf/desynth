import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Building2, 
  MapPin, 
  Shield,
  Award,
  Plus,
  Edit,
  Eye,
  Trash2,
  Check,
  X
} from 'lucide-react';

interface Facility {
  id: string;
  name: string;
  location: string;
  description: string;
  certifications: string[];
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  reputation_score: number;
  created_at: string;
}

interface Slot {
  id: string;
  title: string;
  equipment: string;
  start_date: string;
  end_date: string;
  price: number;
  compliance_level: string;
  is_available: boolean;
  facility_id: string;
  bookings?: Array<{
    id: string;
    status: string;
    buyer_id: string;
  }>;
}

export const FacilityManagementReal = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilitySlots, setFacilitySlots] = useState<Record<string, Slot[]>>({});
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [expandedFacility, setExpandedFacility] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    certifications: [''],
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchFacilities();
    }
  }, [user]);

  const fetchFacilities = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFacilities(data || []);
      
      // Fetch slots for each facility
      if (data && data.length > 0) {
        const facilityIds = data.map(f => f.id);
        const { data: slotsData, error: slotsError } = await supabase
          .from('slots')
          .select(`
            *,
            bookings (
              id,
              status,
              buyer_id
            )
          `)
          .in('facility_id', facilityIds)
          .order('start_date', { ascending: true });

        if (slotsError) throw slotsError;
        
        // Group slots by facility
        const slotsByFacility: Record<string, Slot[]> = {};
        facilityIds.forEach(id => {
          slotsByFacility[id] = [];
        });
        
        slotsData?.forEach(slot => {
          if (slotsByFacility[slot.facility_id]) {
            slotsByFacility[slot.facility_id].push(slot);
          }
        });
        
        setFacilitySlots(slotsByFacility);
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
      toast({
        title: "Error loading facilities",
        description: "Failed to load your facilities.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const cleanCertifications = formData.certifications.filter(cert => cert.trim() !== '');
    
    if (!formData.name.trim() || !formData.location.trim() || cleanCertifications.length === 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      if (editingFacility) {
        // Update existing facility
        const { error } = await supabase
          .from('facilities')
          .update({
            name: formData.name.trim(),
            location: formData.location.trim(),
            description: formData.description.trim(),
            certifications: cleanCertifications,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingFacility.id);

        if (error) throw error;
        
        toast({
          title: "Facility updated",
          description: "Your facility has been updated successfully.",
        });
      } else {
        // Create new facility
        const { error } = await supabase
          .from('facilities')
          .insert({
            name: formData.name.trim(),
            location: formData.location.trim(),
            description: formData.description.trim(),
            certifications: cleanCertifications,
            owner_user_id: user.id,
            status: 'pending',
            reputation_score: 0,
          });

        if (error) throw error;
        
        toast({
          title: "Facility submitted",
          description: "Your facility registration has been submitted for review.",
        });
      }

      // Reset form and refresh data
      setFormData({ name: '', location: '', description: '', certifications: [''] });
      setShowCreateForm(false);
      setEditingFacility(null);
      fetchFacilities();
    } catch (error) {
      console.error('Error saving facility:', error);
      toast({
        title: "Failed to save facility",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (facility: Facility) => {
    setEditingFacility(facility);
    setFormData({
      name: facility.name,
      location: facility.location,
      description: facility.description,
      certifications: facility.certifications.length > 0 ? facility.certifications : [''],
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (facilityId: string) => {
    if (!confirm('Are you sure you want to delete this facility? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('facilities')
        .delete()
        .eq('id', facilityId);

      if (error) throw error;
      
      toast({
        title: "Facility deleted",
        description: "Your facility has been deleted successfully.",
      });
      
      fetchFacilities();
    } catch (error) {
      console.error('Error deleting facility:', error);
      toast({
        title: "Failed to delete facility",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCertificationChange = (index: number, value: string) => {
    const newCertifications = [...formData.certifications];
    newCertifications[index] = value;
    setFormData({ ...formData, certifications: newCertifications });
  };

  const addCertification = () => {
    setFormData({
      ...formData,
      certifications: [...formData.certifications, '']
    });
  };

  const removeCertification = (index: number) => {
    const newCertifications = formData.certifications.filter((_, i) => i !== index);
    setFormData({ ...formData, certifications: newCertifications });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'status-bullish';
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'rejected': return 'status-bearish';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Facility Management</h2>
          <p className="text-muted-foreground">Manage your registered manufacturing facilities</p>
        </div>
        <Button onClick={() => {
          setEditingFacility(null);
          setFormData({ name: '', location: '', description: '', certifications: [''] });
          setShowCreateForm(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Register New Facility
        </Button>
      </div>

      {/* Facilities List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : facilities.length === 0 ? (
        <Card className="card-glow">
          <CardContent className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No facilities registered</h3>
            <p className="text-muted-foreground mb-4">
              Register your first facility to start offering manufacturing capacity
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Register First Facility
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {facilities.map((facility) => (
            <Card key={facility.id} className="card-glow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{facility.name}</CardTitle>
                    <div className="flex items-center gap-2 text-muted-foreground mt-2">
                      <MapPin className="w-4 h-4" />
                      {facility.location}
                    </div>
                  </div>
                  <Badge className={getStatusColor(facility.status)}>
                    {facility.status === 'approved' && <Check className="w-3 h-3 mr-1" />}
                    {facility.status === 'rejected' && <X className="w-3 h-3 mr-1" />}
                    {facility.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">{facility.description}</p>
                  
                  <div>
                    <div className="text-sm font-medium mb-2">Certifications</div>
                    <div className="flex flex-wrap gap-2">
                      {facility.certifications.map((cert, index) => (
                        <Badge key={index} variant="outline">
                          <Shield className="w-3 h-3 mr-1" />
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Reputation Score</div>
                      <div className="font-semibold">{facility.reputation_score.toFixed(1)}/5.0</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Status</div>
                      <div className="font-semibold capitalize">{facility.status}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Registered</div>
                      <div className="font-semibold">{new Date(facility.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(facility)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setExpandedFacility(expandedFacility === facility.id ? null : facility.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {expandedFacility === facility.id ? 'Hide' : 'View'} Slots ({facilitySlots[facility.id]?.length || 0})
                    </Button>
                    {facility.status === 'pending' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(facility.id)}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>

                  {/* Slots Section */}
                  {expandedFacility === facility.id && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <h4 className="font-semibold mb-4">Slots for this Facility</h4>
                      {facilitySlots[facility.id]?.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No slots created yet for this facility.</p>
                      ) : (
                        <div className="space-y-3">
                          {facilitySlots[facility.id]?.map(slot => (
                            <div key={slot.id} className="p-4 rounded-lg bg-background/50 border border-border">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="font-medium">{slot.title}</div>
                                  <div className="text-sm text-muted-foreground">{slot.equipment}</div>
                                </div>
                                <Badge className={
                                  slot.bookings && slot.bookings.length > 0 
                                    ? 'status-bullish' 
                                    : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                                }>
                                  {slot.bookings && slot.bookings.length > 0 ? 'Booked' : 'Available'}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3">
                                <div>
                                  <div className="text-muted-foreground">Start Date</div>
                                  <div className="font-medium">{new Date(slot.start_date).toLocaleDateString()}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">End Date</div>
                                  <div className="font-medium">{new Date(slot.end_date).toLocaleDateString()}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Price</div>
                                  <div className="font-medium text-primary">${slot.price.toLocaleString()}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Compliance</div>
                                  <div className="font-medium">{slot.compliance_level.toUpperCase()}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingFacility ? 'Edit Facility' : 'Register New Facility'}
            </DialogTitle>
            <DialogDescription>
              {editingFacility 
                ? 'Update your facility information and certifications.'
                : 'Provide details about your manufacturing facility for review and approval.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Facility Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., BioLab Manufacturing"
                  required
                />
              </div>
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Boston, MA"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your facility capabilities, equipment, and specializations..."
                rows={4}
              />
            </div>

            <div>
              <Label>Certifications *</Label>
              <div className="space-y-2 mt-2">
                {formData.certifications.map((cert, index) => (
                  <div key={index} className="flex gap-2">
                    <Select value={cert} onValueChange={(value) => handleCertificationChange(index, value)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select certification" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GMP">GMP (Good Manufacturing Practice)</SelectItem>
                        <SelectItem value="ISO 9001">ISO 9001</SelectItem>
                        <SelectItem value="ISO 13485">ISO 13485</SelectItem>
                        <SelectItem value="FDA">FDA Approved</SelectItem>
                        <SelectItem value="cGMP">cGMP</SelectItem>
                        <SelectItem value="EMA">EMA Compliant</SelectItem>
                        <SelectItem value="HACCP">HACCP</SelectItem>
                        <SelectItem value="Research">Research Grade</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.certifications.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCertification(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCertification}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Certification
                </Button>
              </div>
            </div>

            <div className="flex gap-4 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingFacility(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingFacility ? 'Update Facility' : 'Submit for Review'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};