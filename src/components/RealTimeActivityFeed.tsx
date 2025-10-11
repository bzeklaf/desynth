import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Activity, 
  Calendar, 
  DollarSign,
  Building2,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'booking' | 'facility' | 'payment' | 'user' | 'system';
  title: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    role: string;
    initials: string;
  };
  metadata?: {
    amount?: number;
    status?: string;
    facility?: string;
  };
}

export const RealTimeActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchRecentActivities();
    setupRealTimeSubscriptions();
  }, []);

  const fetchRecentActivities = async () => {
    try {
      setLoading(true);
      
      // Fetch recent bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          *,
          slots (
            title,
            facilities (
              name
            )
          ),
          profiles:buyer_id (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch recent facilities
      const { data: facilities } = await supabase
        .from('facilities')
        .select(`
          *,
          profiles:owner_user_id (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Transform data into activity items
      const activityItems: ActivityItem[] = [];

      // Process bookings
      bookings?.forEach((booking) => {
        const userName = booking.profiles ? 
          `${booking.profiles.first_name} ${booking.profiles.last_name}` : 
          'Unknown User';
        
        activityItems.push({
          id: `booking-${booking.id}`,
          type: 'booking',
          title: 'New Booking Created',
          description: `${userName} booked ${booking.slots?.title || 'a slot'} at ${booking.slots?.facilities?.name || 'Unknown Facility'}`,
          timestamp: booking.created_at,
          user: {
            name: userName,
            role: 'buyer',
            initials: userName.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
          },
          metadata: {
            amount: booking.total_amount,
            status: booking.status,
            facility: booking.slots?.facilities?.name
          }
        });
      });

      // Process facilities
      facilities?.forEach((facility) => {
        const ownerName = facility.profiles ? 
          `${facility.profiles.first_name} ${facility.profiles.last_name}` : 
          'Unknown Owner';
        
        activityItems.push({
          id: `facility-${facility.id}`,
          type: 'facility',
          title: 'Facility Registration',
          description: `${ownerName} registered ${facility.name} for approval`,
          timestamp: facility.created_at,
          user: {
            name: ownerName,
            role: 'facility',
            initials: ownerName.split(' ').map(n => n[0]).join('').toUpperCase() || 'F'
          },
          metadata: {
            status: facility.status,
            facility: facility.name
          }
        });
      });

      // Sort all activities by timestamp
      activityItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setActivities(activityItems.slice(0, 50));
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Error loading activities",
        description: "Failed to load recent activities.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeSubscriptions = () => {
    // Subscribe to bookings changes
    const bookingsChannel = supabase
      .channel('bookings-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('Booking change:', payload);
          // Refresh activities when new data comes in
          fetchRecentActivities();
        }
      )
      .subscribe();

    // Subscribe to facilities changes
    const facilitiesChannel = supabase
      .channel('facilities-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'facilities' },
        (payload) => {
          console.log('Facility change:', payload);
          fetchRecentActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(facilitiesChannel);
    };
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking': return <Calendar className="w-4 h-4" />;
      case 'facility': return <Building2 className="w-4 h-4" />;
      case 'payment': return <DollarSign className="w-4 h-4" />;
      case 'user': return <Users className="w-4 h-4" />;
      case 'system': return <Zap className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityIconColor = (type: string) => {
    switch (type) {
      case 'booking': return 'text-blue-400';
      case 'facility': return 'text-green-400';
      case 'payment': return 'text-primary';
      case 'user': return 'text-purple-400';
      case 'system': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="status-bullish">Completed</Badge>;
      case 'approved': return <Badge className="status-bullish">Approved</Badge>;
      case 'pending': return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case 'cancelled': return <Badge className="status-bearish">Cancelled</Badge>;
      case 'rejected': return <Badge className="status-bearish">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredActivities = activities.filter(activity => 
    filter === 'all' || activity.type === filter
  );

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <Card className="card-glow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Real-Time Activity Feed
            </CardTitle>
            <CardDescription>
              Live updates from across the platform
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRecentActivities} disabled={loading}>
            <Clock className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter Buttons */}
        <div className="flex gap-2 mb-4">
          {['all', 'booking', 'facility', 'payment', 'user'].map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(filterType)}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Button>
          ))}
        </div>

        {/* Activity Feed */}
        <ScrollArea className="h-[600px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Activities</h3>
              <p className="text-muted-foreground">
                No recent activities to display
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="flex gap-4 p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ${getActivityIconColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{activity.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                        
                        {activity.user && (
                          <div className="flex items-center gap-2 mt-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {activity.user.initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                              {activity.user.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {activity.user.role}
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-shrink-0 text-right">
                        <div className="text-xs text-muted-foreground mb-1">
                          {formatTimeAgo(activity.timestamp)}
                        </div>
                        {activity.metadata?.status && getStatusBadge(activity.metadata.status)}
                        {activity.metadata?.amount && (
                          <div className="text-xs font-semibold text-primary mt-1">
                            ${activity.metadata.amount.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};