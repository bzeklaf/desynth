import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  MapPin, 
  Star, 
  Search,
  Award,
  TrendingUp,
  Calendar,
  Eye,
  Filter
} from 'lucide-react';

interface Facility {
  id: string;
  name: string;
  location: string;
  description: string;
  reputation_score: number;
  on_time_percentage: number;
  qa_pass_rate: number;
  cancellation_rate: number;
  certifications: string[];
  status: string;
}

export const Facilities = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [certificationFilter, setCertificationFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('status', 'approved')
        .order('reputation_score', { ascending: false });

      if (error) throw error;
      setFacilities(data || []);
    } catch (error) {
      console.error('Error fetching facilities:', error);
      toast({
        title: "Error loading facilities",
        description: "Failed to load facilities. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredFacilities = facilities.filter(facility => {
    const matchesSearch = searchTerm === '' || 
      facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation = locationFilter === '' ||
      facility.location.toLowerCase().includes(locationFilter.toLowerCase());

    const matchesCertification = certificationFilter === 'all' ||
      (facility.certifications && facility.certifications.includes(certificationFilter));

    return matchesSearch && matchesLocation && matchesCertification;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        <Navigation />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Lab Facilities</h1>
              <p className="text-muted-foreground">Discover verified biomanufacturing partners</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Facilities</p>
                    <p className="text-2xl font-bold text-primary">{facilities.length}</p>
                  </div>
                  <Badge variant="outline" className="bg-primary/10">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Rating</p>
                    <p className="text-2xl font-bold text-primary">
                      {facilities.length > 0 ? 
                        (facilities.reduce((acc, f) => acc + f.reputation_score, 0) / facilities.length).toFixed(1) 
                        : '0.0'
                      }
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400">
                    <Star className="w-3 h-3 mr-1" />
                    Score
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">GMP Certified</p>
                    <p className="text-2xl font-bold text-primary">
                      {facilities.filter(f => f.certifications?.includes('GMP')).length}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-400">
                    <Award className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Available Now</p>
                    <p className="text-2xl font-bold text-primary">
                      {Math.floor(facilities.length * 0.7)}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-primary/10">
                    <Calendar className="w-3 h-3 mr-1" />
                    Slots
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="card-glow mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search & Filter Facilities
              </CardTitle>
              <CardDescription>Find facilities that match your requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Search by name or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Input
                  placeholder="Filter by location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
                <Select value={certificationFilter} onValueChange={setCertificationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Certification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Certifications</SelectItem>
                    <SelectItem value="GMP">GMP</SelectItem>
                    <SelectItem value="ISO">ISO</SelectItem>
                    <SelectItem value="FDA">FDA</SelectItem>
                    <SelectItem value="EMA">EMA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="grid gap-6">
          {filteredFacilities.length === 0 ? (
            <Card className="card-glow">
              <CardContent className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No facilities found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or check back later for new facilities.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredFacilities.map((facility) => (
              <Card key={facility.id} className="card-glow hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{facility.name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <MapPin className="w-4 h-4" />
                        {facility.location}
                      </div>
                      {facility.description && (
                        <p className="text-sm text-muted-foreground mb-4">{facility.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-lg font-bold">{facility.reputation_score.toFixed(1)}</span>
                      </div>
                      <Badge variant="outline" className="bg-primary/10">
                        Verified
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <div className="text-muted-foreground text-sm mb-1">On-Time Rate</div>
                      <div className="font-semibold text-primary">{facility.on_time_percentage}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-sm mb-1">QA Pass Rate</div>
                      <div className="font-semibold text-primary">{facility.qa_pass_rate}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-sm mb-1">Cancellation Rate</div>
                      <div className="font-semibold text-primary">{facility.cancellation_rate}%</div>
                    </div>
                  </div>

                  {facility.certifications && facility.certifications.length > 0 && (
                    <div className="mb-4">
                      <div className="text-muted-foreground text-sm mb-2">Certifications</div>
                      <div className="flex gap-2 flex-wrap">
                        {facility.certifications.map((cert, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button className="flex-1">
                      <Calendar className="w-4 h-4 mr-2" />
                      View Available Slots
                    </Button>
                    <Button variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};