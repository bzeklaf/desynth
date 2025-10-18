import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SlotBookingFlow } from '@/components/SlotBookingFlow';
import { formatDate } from '@/lib/utils';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  Star,
  Filter,
  DollarSign,
  Award,
  Beaker
} from 'lucide-react';

interface Slot {
  id: string;
  title: string;
  description?: string;
  facility: {
    name: string;
    location: string;
    reputation_score: number;
  };
  start_date?: string;
  end_date?: string;
  duration_hours?: number;
  price: number;
  is_available: boolean;
  compliance_level: string;
  equipment: string;
  scale_capacity?: string;
}

// Mock data for demonstration
const mockSlots: Slot[] = [
  {
    id: 'demo-1',
    title: 'Premium GMP Vaccine Production',
    description: 'State-of-the-art facility with automated systems for vaccine production',
    facility: {
      name: 'BioPharma Excellence',
      location: 'Cambridge, MA',
      reputation_score: 4.9
    },
    start_date: '2024-02-15T08:00:00Z',
    end_date: '2024-02-20T17:00:00Z',
    duration_hours: 120,
    price: 250,
    is_available: true,
    compliance_level: 'gmp',
    equipment: 'Automated Bioreactor 2000L',
    scale_capacity: '1000L - 5000L'
  },
  {
    id: 'demo-2',
    title: 'Rapid Prototyping Lab Space',
    description: 'Perfect for early-stage research and development projects',
    facility: {
      name: 'Innovation BioCenter',
      location: 'San Francisco, CA',
      reputation_score: 4.7
    },
    start_date: '2024-01-25T09:00:00Z',
    end_date: '2024-01-30T18:00:00Z',
    duration_hours: 96,
    price: 18000,
    is_available: true,
    compliance_level: 'rd',
    equipment: 'Modular R&D Suite',
    scale_capacity: '50L - 500L'
  },
  {
    id: 'demo-3',
    title: 'Clinical Trial Manufacturing',
    description: 'GCP-compliant facility for clinical phase production',
    facility: {
      name: 'ClinTech Solutions',
      location: 'Basel, Switzerland',
      reputation_score: 4.8
    },
    start_date: '2024-03-01T07:00:00Z',
    end_date: '2024-03-07T19:00:00Z',
    duration_hours: 144,
    price: 52000,
    is_available: true,
    compliance_level: 'gcp',
    equipment: 'Single-Use Bioreactor 1000L',
    scale_capacity: '500L - 2000L'
  },
  {
    id: 'demo-4',
    title: 'Advanced Cell Culture System',
    description: 'Latest technology for advanced cell culture applications',
    facility: {
      name: 'NextGen Biologics',
      location: 'Singapore',
      reputation_score: 4.6
    },
    start_date: '2024-02-05T08:30:00Z',
    end_date: '2024-02-12T17:30:00Z',
    duration_hours: 168,
    price: 38000,
    is_available: true,
    compliance_level: 'gmp',
    equipment: 'Advanced Cell Culture System',
    scale_capacity: '200L - 1000L'
  },
  {
    id: 'demo-5',
    title: 'Protein Expression Platform',
    description: 'High-yield protein production using mammalian cell lines',
    facility: {
      name: 'PrecisionBio Labs',
      location: 'Boston, MA',
      reputation_score: 4.8
    },
    start_date: '2024-01-20T07:00:00Z',
    end_date: '2024-01-24T19:00:00Z',
    duration_hours: 80,
    price: 28000,
    is_available: true,
    compliance_level: 'gmp',
    equipment: 'CHO Expression System',
    scale_capacity: '100L - 800L'
  }
];

export const SlotBrowser = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [complianceFilter, setComplianceFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchSlots();
  }, [complianceFilter]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('slots')
        .select(`
          *,
          facilities:facility_id (
            name,
            location,
            reputation_score
          )
        `)
        .eq('is_available', true)
        .gte('start_date', new Date().toISOString());

      if (complianceFilter !== 'all') {
        query = query.eq('compliance_level', complianceFilter as 'basic' | 'gmp' | 'fda' | 'iso');
      }

      const { data, error } = await query;

      if (error) throw error;

      // If no real data, use mock data for demo
      if (!data || data.length === 0) {
        console.log('No database slots found, using mock data for demo');
        setSlots(mockSlots);
      } else {
        const formattedSlots = data?.map(slot => ({
          ...slot,
          facility: slot.facilities
        })) || [];
        setSlots(formattedSlots);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      // Fallback to mock data on error
      setSlots(mockSlots);
      toast({
        title: "Using demo data",
        description: "Real data will be available once facilities create slots.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async (slot: Slot) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to book a slot.",
        variant: "destructive",
      });
      return;
    }

    setSelectedSlot(slot);
    setShowBookingModal(true);
  };

  const filteredSlots = slots.filter(slot => {
    const matchesSearch = searchTerm === '' || 
      slot.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slot.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slot.facility.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLocation = locationFilter === '' ||
        slot.facility.location.toLowerCase().includes(locationFilter.toLowerCase());

    return matchesSearch && matchesLocation;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search & Filter Slots
          </CardTitle>
          <CardDescription>Find the perfect biomanufacturing capacity for your needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search by title, equipment, or facility..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={complianceFilter} onValueChange={setComplianceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Compliance Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Compliance Levels</SelectItem>
                <SelectItem value="gmp">GMP</SelectItem>
                <SelectItem value="rd">R&D</SelectItem>
                <SelectItem value="gcp">GCP</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Location filter..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid gap-6">
        {filteredSlots.length === 0 ? (
          <Card className="card-glow">
            <CardContent className="text-center py-12">
              <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No slots found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or check back later for new slots.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSlots.map((slot) => (
            <Card key={slot.id} className="card-glow hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{slot.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {slot.facility.name} • {slot.facility.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {slot.facility.reputation_score.toFixed(1)}
                      </div>
                    </div>
                    {slot.description && (
                      <p className="text-sm text-muted-foreground mb-4">{slot.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary mb-1">
                      ${slot.price.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {slot.duration_hours}h duration
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                      <Calendar className="w-3 h-3" />
                      Start Date
                    </div>
                    <div className="font-semibold">{formatDate(slot.start_date)}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                      <Clock className="w-3 h-3" />
                      End Date
                    </div>
                    <div className="font-semibold">{formatDate(slot.end_date)}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                      <Award className="w-3 h-3" />
                      Compliance
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {slot.compliance_level.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                      <Beaker className="w-3 h-3" />
                      Equipment
                    </div>
                    <div className="font-semibold text-sm">{slot.equipment}</div>
                  </div>
                </div>

                {slot.scale_capacity && (
                  <div className="mb-4">
                    <div className="text-muted-foreground text-sm mb-1">Scale Capacity</div>
                    <div className="font-semibold">{slot.scale_capacity}</div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleBookSlot(slot)}
                    className="flex-1"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Book Slot
                  </Button>
                  <Button variant="outline">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {showBookingModal && selectedSlot && (
        <SlotBookingFlow 
          slotId={selectedSlot.id}
          slotData={selectedSlot}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedSlot(null);
          }}
        />
      )}
    </div>
  );
};