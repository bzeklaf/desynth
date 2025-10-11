import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SlotBookingFlow } from '@/components/SlotBookingFlow';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Star,
  Clock,
  DollarSign,
  Shield,
  Beaker
} from 'lucide-react';

interface Slot {
  id: string;
  title: string;
  description: string;
  equipment: string;
  price: number;
  duration_hours: number;
  start_date: string;
  end_date: string;
  compliance_level: string;
  scale_capacity: string;
  facilities: {
    id: string;
    name: string;
    location: string;
    reputation_score: number;
  };
}

export const SlotBrowserReal = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [filteredSlots, setFilteredSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [complianceFilter, setComplianceFilter] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSlots();
  }, []);

  useEffect(() => {
    filterSlots();
  }, [slots, searchTerm, complianceFilter, priceRange, locationFilter]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('slots')
        .select(`
          *,
          facilities (
            id,
            name,
            location,
            reputation_score
          )
        `)
        .eq('is_available', true)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      if (error) throw error;
      
      const slotsData = data?.map(slot => ({
        ...slot,
        facilities: slot.facilities || {
          id: '',
          name: 'Unknown Facility',
          location: 'Unknown Location',
          reputation_score: 0
        }
      })) || [];
      
      setSlots(slotsData);
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast({
        title: "Error loading slots",
        description: "Failed to load available slots.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSlots = () => {
    let filtered = slots;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(slot =>
        slot.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        slot.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        slot.facilities.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        slot.facilities.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Compliance filter
    if (complianceFilter !== 'all') {
      filtered = filtered.filter(slot => slot.compliance_level === complianceFilter);
    }

    // Price range filter
    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(Number);
      filtered = filtered.filter(slot => {
        if (max) {
          return slot.price >= min && slot.price <= max;
        } else {
          return slot.price >= min;
        }
      });
    }

    // Location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(slot => 
        slot.facilities.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    setFilteredSlots(filtered);
  };

  const handleBookSlot = (slot: Slot) => {
    setSelectedSlot(slot);
    setShowBookingFlow(true);
  };

  const getComplianceBadgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'gmp': return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'iso': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'fda': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  if (showBookingFlow && selectedSlot) {
    return (
      <SlotBookingFlow
        slotId={selectedSlot.id}
        onClose={() => {
          setShowBookingFlow(false);
          setSelectedSlot(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Browse Available Slots
          </CardTitle>
          <CardDescription>Find and book manufacturing capacity that meets your needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search slots, equipment, or facilities..."
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
                <SelectItem value="all">All Compliance</SelectItem>
                <SelectItem value="gmp">GMP</SelectItem>
                <SelectItem value="iso">ISO</SelectItem>
                <SelectItem value="fda">FDA</SelectItem>
                <SelectItem value="research">Research</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger>
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="0-100">$0 - $100</SelectItem>
                <SelectItem value="100-500">$100 - $500</SelectItem>
                <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                <SelectItem value="1000">$1,000+</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Location filter..."
              value={locationFilter === 'all' ? '' : locationFilter}
              onChange={(e) => setLocationFilter(e.target.value || 'all')}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {loading ? 'Loading...' : `${filteredSlots.length} Available Slots`}
        </h2>
        <Button variant="outline" onClick={fetchSlots} disabled={loading}>
          <Filter className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Slots Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredSlots.length === 0 ? (
        <Card className="card-glow">
          <CardContent className="text-center py-12">
            <Beaker className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No slots found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or check back later for new slots.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSlots.map((slot) => (
            <Card key={slot.id} className="card-glow hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{slot.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      {slot.facilities.name}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="w-3 h-3" />
                      {slot.facilities.location}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-primary">
                      ${slot.price.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {slot.duration_hours}h duration
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {slot.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Beaker className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{slot.equipment}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{new Date(slot.start_date).toLocaleDateString()} - {new Date(slot.end_date).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={getComplianceBadgeColor(slot.compliance_level)}>
                      <Shield className="w-3 h-3 mr-1" />
                      {slot.compliance_level.toUpperCase()}
                    </Badge>
                    {slot.facilities.reputation_score > 0 && (
                      <Badge variant="outline">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        {slot.facilities.reputation_score.toFixed(1)}
                      </Badge>
                    )}
                  </div>

                  {slot.scale_capacity && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Scale:</span> {slot.scale_capacity}
                    </div>
                  )}

                  <Button 
                    className="w-full" 
                    onClick={() => handleBookSlot(slot)}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book This Slot
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};