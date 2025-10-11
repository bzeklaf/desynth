import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SlotDetailsModal } from '@/components/SlotDetailsModal';
import { SlotBookingFlow } from '@/components/SlotBookingFlow';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar,
  DollarSign,
  MapPin,
  Star,
  Award,
  Beaker,
  TrendingUp,
  Eye,
  ArrowLeft
} from 'lucide-react';

interface FeaturedSlot {
  id: string;
  title: string;
  description?: string;
  facility: {
    name: string;
    location: string;
    reputation_score: number;
  };
  start_date: string;
  end_date: string;
  duration_hours: number;
  price: number;
  compliance_level: string;
  equipment: string;
  scale_capacity?: string;
  featured_reason: 'popular' | 'new' | 'premium' | 'urgent';
  discount_percentage?: number;
}

export const Book = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [selectedSlot, setSelectedSlot] = useState<FeaturedSlot | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<FeaturedSlot[]>([]);

  // Get slot data from navigation state
  const quickBookSlot = location.state?.quickBookSlot;
  const detailsSlot = location.state?.detailsSlot;

  useEffect(() => {
    // If user is not authenticated, redirect to auth
    if (!user) {
      navigate('/auth', { state: { returnTo: '/book' } });
      return;
    }

    // Load available slots
    loadAvailableSlots();

    // Handle direct booking from featured slots
    if (quickBookSlot) {
      setSelectedSlot(quickBookSlot);
      setShowBookingFlow(true);
    } else if (detailsSlot) {
      setSelectedSlot(detailsSlot);
      setShowDetailsModal(true);
    }
  }, [user, quickBookSlot, detailsSlot, navigate]);

  const loadAvailableSlots = async () => {
    try {
      // Fetch real slots from Supabase
      const { data: slotsData, error } = await supabase
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform database data to match component interface
      const transformedSlots: FeaturedSlot[] = slotsData.map((slot, index) => ({
        id: slot.id,
        title: slot.title,
        description: slot.description,
        facility: {
          name: slot.facilities?.name || 'Unknown Facility',
          location: slot.facilities?.location || 'Location TBD',
          reputation_score: slot.facilities?.reputation_score || 4.5
        },
        start_date: slot.start_date,
        end_date: slot.end_date,
        duration_hours: slot.duration_hours,
        price: Number(slot.price),
        compliance_level: slot.compliance_level,
        equipment: slot.equipment,
        scale_capacity: slot.scale_capacity,
        featured_reason: index % 4 === 0 ? 'premium' : 
                        index % 4 === 1 ? 'popular' : 
                        index % 4 === 2 ? 'urgent' : 'new',
        discount_percentage: index < 2 ? 15 : undefined
      }));

      setAvailableSlots(transformedSlots);
    } catch (error) {
      console.error('Error loading slots:', error);
      // Fall back to empty array if real data fails
      setAvailableSlots([]);
    }
  };

  const handleViewDetails = (slot: FeaturedSlot) => {
    setSelectedSlot(slot);
    setShowDetailsModal(true);
  };

  const handleQuickBook = (slot: FeaturedSlot) => {
    setSelectedSlot(slot);
    setShowBookingFlow(true);
  };

  const handleCloseModals = () => {
    setSelectedSlot(null);
    setShowDetailsModal(false);
    setShowBookingFlow(false);
    // Clear navigation state
    navigate('/book', { replace: true });
  };

  const getFeaturedBadge = (reason: string) => {
    switch (reason) {
      case 'popular':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">🔥 Popular</Badge>;
      case 'new':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">✨ New</Badge>;
      case 'premium':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-700">⭐ Premium</Badge>;
      case 'urgent':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-700">⚡ Urgent</Badge>;
      default:
        return <Badge variant="outline">Featured</Badge>;
    }
  };

  if (!user) {
    return null; // Will redirect to auth in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </div>
          <h1 className="text-4xl font-bold mb-2">Book Production Slots</h1>
          <p className="text-xl text-muted-foreground">
            Reserve biomanufacturing capacity for your projects
          </p>
        </div>

        {/* Available Slots */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Available Slots
            </CardTitle>
            <CardDescription>
              Select from our curated list of premium biomanufacturing slots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {availableSlots.map((slot) => (
                <Card key={slot.id} className="relative overflow-hidden hover:shadow-lg transition-shadow border-2 hover:border-primary/20">
                  {slot.discount_percentage && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge variant="destructive" className="bg-red-500 text-white">
                        -{slot.discount_percentage}% OFF
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getFeaturedBadge(slot.featured_reason)}
                        </div>
                        <CardTitle className="text-lg line-clamp-2">{slot.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                          <MapPin className="w-4 h-4" />
                          <span>{slot.facility.name}</span>
                          <span>•</span>
                          <span>{slot.facility.location}</span>
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 ml-1" />
                          <span>{slot.facility.reputation_score}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">
                          ${slot.price.toLocaleString()}
                        </div>
                        {slot.discount_percentage && (
                          <div className="text-sm text-muted-foreground line-through">
                            ${Math.round(slot.price / (1 - slot.discount_percentage / 100)).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {slot.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {slot.description}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Calendar className="w-3 h-3" />
                          Duration
                        </div>
                        <div className="font-semibold">{slot.duration_hours}h</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Award className="w-3 h-3" />
                          Compliance
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {slot.compliance_level.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Beaker className="w-3 h-3" />
                          Equipment
                        </div>
                        <div className="font-semibold text-sm">{slot.equipment}</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleQuickBook(slot)}
                        className="flex-1"
                        size="sm"
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        Book Now
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleViewDetails(slot)}
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Browse More */}
        <div className="text-center mt-8">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => navigate('/browse')}
            className="px-8"
          >
            Browse All Available Slots
          </Button>
        </div>
      </div>

      {/* Modals */}
      <SlotDetailsModal 
        slot={selectedSlot}
        isOpen={showDetailsModal}
        onClose={handleCloseModals}
      />
      
      {showBookingFlow && selectedSlot && (
        <SlotBookingFlow 
          slotId={selectedSlot.id}
          slotData={selectedSlot}
          onClose={handleCloseModals}
        />
      )}
    </div>
  );
};