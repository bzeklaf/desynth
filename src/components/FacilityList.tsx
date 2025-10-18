import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Award, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface Facility {
  id: string;
  name: string;
  location: string;
  description: string | null;
  certifications: string[] | null;
  status: string;
  reputation_score: number;
  created_at: string;
}

export const FacilityList = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchFacilities = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('facilities')
          .select('*')
          .eq('owner_user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setFacilities(data || []);
      } catch (error) {
        console.error('Error fetching facilities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'rejected':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'suspended':
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-2">Loading facilities...</p>
      </div>
    );
  }

  if (facilities.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No facilities yet</h3>
          <p className="text-muted-foreground">
            Register your first facility to start creating slots.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {facilities.map((facility) => (
        <Card key={facility.id} className="card-glow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{facility.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {facility.location}
                  </CardDescription>
                </div>
              </div>
              <Badge className={getStatusColor(facility.status)}>
                {facility.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {facility.description && (
              <p className="text-sm text-muted-foreground">{facility.description}</p>
            )}
            
            {facility.certifications && facility.certifications.length > 0 && (
              <div className="flex items-start gap-2">
                <Award className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex flex-wrap gap-2">
                  {facility.certifications.map((cert) => (
                    <Badge key={cert} variant="outline" className="bg-primary/5">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-3 border-t">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Registered {format(new Date(facility.created_at), 'MMM d, yyyy')}
              </div>
              <div>
                Reputation: {facility.reputation_score.toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
