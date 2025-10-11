import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Building2, MapPin, Award, Upload, CheckCircle, X } from 'lucide-react';

interface FacilityFormData {
  name: string;
  location: string;
  description: string;
  certifications: string[];
}

interface FacilityRegistrationProps {
  onRegistrationComplete?: () => void;
}

export const FacilityRegistration = ({ onRegistrationComplete }: FacilityRegistrationProps) => {
  const [formData, setFormData] = useState<FacilityFormData>({
    name: '',
    location: '',
    description: '',
    certifications: []
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const availableCertifications = [
    'GMP', 'ISO 9001', 'ISO 13485', 'FDA', 'EMA', 'MHRA', 'TGA', 'PMDA'
  ];

  const handleInputChange = (field: keyof Omit<FacilityFormData, 'certifications'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCertificationToggle = (certification: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(certification)
        ? prev.certifications.filter(c => c !== certification)
        : [...prev.certifications, certification]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profile) {
      toast({
        title: "Authentication required",
        description: "Please sign in to register a facility.",
        variant: "destructive",
      });
      return;
    }

    // Validation
    if (!formData.name || !formData.location) {
      toast({
        title: "Missing information",
        description: "Please provide facility name and location.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('facilities')
        .insert({
          owner_user_id: user.id,
          name: formData.name,
          location: formData.location,
          description: formData.description || null,
          certifications: formData.certifications,
          status: 'pending',
          reputation_score: 0.00,
          on_time_percentage: 0.00,
          qa_pass_rate: 0.00,
          cancellation_rate: 0.00
        });

      if (error) throw error;

      // Add facility role to user if they don't have it yet
      // Note: Role assignment now requires admin approval for security
      // Users will need an admin to grant them facility role
      if (profile.role !== 'facility') {
        console.info('Facility created. Role upgrade requires admin approval.');
        toast({
          title: "Facility registered",
          description: "Your facility has been created. Contact an admin to activate your facility owner role.",
          variant: "default",
        });
      }

      toast({
        title: "Facility registration submitted",
        description: "Your facility is pending approval. You'll be notified once it's reviewed.",
      });

      // Reset form
      setFormData({
        name: '',
        location: '',
        description: '',
        certifications: []
      });

      onRegistrationComplete?.();
    } catch (error) {
      console.error('Error registering facility:', error);
      toast({
        title: "Registration failed",
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
          <Building2 className="w-5 h-5" />
          Register Your Facility
        </CardTitle>
        <CardDescription>
          Join the DeSynth network as a verified biomanufacturing partner
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Facility Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., BioTech Labs Boston"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., Boston, MA, USA"
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Facility Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your facility's capabilities, equipment, and specializations..."
              rows={4}
            />
          </div>

          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Certifications & Compliance
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {availableCertifications.map((certification) => (
                <div key={certification} className="flex items-center space-x-2">
                  <Checkbox
                    id={certification}
                    checked={formData.certifications.includes(certification)}
                    onCheckedChange={() => handleCertificationToggle(certification)}
                  />
                  <Label htmlFor={certification} className="text-sm font-normal">
                    {certification}
                  </Label>
                </div>
              ))}
            </div>
            {formData.certifications.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-3">
                {formData.certifications.map((cert) => (
                  <Badge key={cert} variant="outline" className="bg-primary/10">
                    {cert}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-2"
                      onClick={() => handleCertificationToggle(cert)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="bg-muted/30 p-4 rounded-lg space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              What happens next?
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Your facility application will be reviewed by our team</li>
              <li>• We may request additional documentation or verification</li>
              <li>• Once approved, you can start creating and managing slots</li>
              <li>• Build your reputation through successful completions</li>
            </ul>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting Application...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Submit Facility Registration
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};