import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/lib/utils';
import { 
  Star, 
  MapPin, 
  Calendar, 
  Clock,
  DollarSign,
  Award,
  Beaker,
  TrendingUp,
  Eye
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

export const FeaturedSlots = () => {
  const [featuredSlots, setFeaturedSlots] = useState<FeaturedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadFeaturedSlots();
  }, []);

  const loadFeaturedSlots = async () => {
    try {
      setLoading(true);
      
      // Mock featured slots data - replace with actual Supabase query
      const mockSlots: FeaturedSlot[] = [
        {
          id: '1',
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
          compliance_level: 'gmp',
          equipment: 'Automated Bioreactor 2000L',
          scale_capacity: '1000L - 5000L',
          featured_reason: 'premium',
          discount_percentage: 15
        },
        {
          id: '2',
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
          compliance_level: 'rd',
          equipment: 'Modular R&D Suite',
          scale_capacity: '50L - 500L',
          featured_reason: 'popular'
        },
        {
          id: '3',
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
          compliance_level: 'gcp',
          equipment: 'Single-Use Bioreactor 1000L',
          scale_capacity: '500L - 2000L',
          featured_reason: 'urgent',
          discount_percentage: 10
        },
        {
          id: '4',
          title: 'New Generation Cell Culture',
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
          compliance_level: 'gmp',
          equipment: 'Advanced Cell Culture System',
          scale_capacity: '200L - 1000L',
          featured_reason: 'new'
        }
      ];

      setFeaturedSlots(mockSlots);
    } catch (error) {
      console.error('Error loading featured slots:', error);
      toast({
        title: "Error loading featured slots",
        description: "Failed to load featured slots. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewSlot = (slot: FeaturedSlot) => {
    navigate('/book', { state: { detailsSlot: slot } });
  };

  const handleQuickBook = (slot: FeaturedSlot) => {
    navigate('/book', { state: { quickBookSlot: slot } });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Featured Slots
        </CardTitle>
        <CardDescription>
          Hand-picked premium biomanufacturing opportunities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {featuredSlots.map((slot) => (
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
                
                <div className="text-xs text-muted-foreground mb-4">
                  Available: {formatDate(slot.start_date)} - {formatDate(slot.end_date)}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleQuickBook(slot)}
                    className="flex-1"
                    size="sm"
                  >
                    <DollarSign className="w-4 h-4 mr-1" />
                    Quick Book
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleViewSlot(slot)}
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
        
        <div className="text-center mt-6">
          <Button variant="outline" className="w-full max-w-md" onClick={() => navigate('/book')}>
            <TrendingUp className="w-4 h-4 mr-2" />
            View All Slots
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};