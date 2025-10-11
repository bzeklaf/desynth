import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  Calendar, 
  DollarSign, 
  Shield, 
  Users,
  Clock,
  CheckCircle,
  Building,
  Beaker
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'booking_created' | 'booking_completed' | 'facility_approved' | 'audit_completed' | 'slot_created' | 'payment_received';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  amount?: number;
  facility?: string;
}

export const ActivityFeedReal = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecentActivity();
    setupRealTimeSubscription();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);
      
      // Fetch recent bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          *,
          slots (title, facilities (name)),
          profiles:buyer_id (first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent facilities
      const { data: facilities } = await supabase
        .from('facilities')
        .select(`
          *,
          profiles:owner_user_id (first_name, last_name)
        `)
        .eq('status', 'approved')
        .order('updated_at', { ascending: false })
        .limit(5);

      // Fetch recent attestations
      const { data: attestations } = await supabase
        .from('attestations')
        .select(`
          *,
          bookings (
            slots (title, facilities (name))
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent slots
      const { data: slots } = await supabase
        .from('slots')
        .select(`
          *,
          facilities (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // Convert to activity items
      const activityItems: ActivityItem[] = [];

      // Add booking activities
      bookings?.forEach(booking => {
        activityItems.push({
          id: `booking-${booking.id}`,
          type: booking.status === 'completed' ? 'booking_completed' : 'booking_created',
          title: booking.status === 'completed' ? 'Booking Completed' : 'New Booking Created',
          description: `${booking.profiles?.first_name} ${booking.profiles?.last_name} ${
            booking.status === 'completed' ? 'completed' : 'booked'
          } "${booking.slots?.title}" at ${booking.slots?.facilities?.name}`,
          timestamp: booking.status === 'completed' ? booking.updated_at : booking.created_at,
          user: `${booking.profiles?.first_name} ${booking.profiles?.last_name}`,
          amount: Number(booking.total_amount),
          facility: booking.slots?.facilities?.name
        });
      });

      // Add facility activities
      facilities?.forEach(facility => {
        activityItems.push({
          id: `facility-${facility.id}`,
          type: 'facility_approved',
          title: 'Facility Approved',
          description: `${facility.name} has been approved and is now accepting bookings`,
          timestamp: facility.updated_at,
          facility: facility.name
        });
      });

      // Add audit activities
      attestations?.forEach(attestation => {
        activityItems.push({
          id: `audit-${attestation.id}`,
          type: 'audit_completed',
          title: 'Audit Completed',
          description: `QA audit ${attestation.result} for "${attestation.bookings?.slots?.title}" at ${attestation.bookings?.slots?.facilities?.name}`,
          timestamp: attestation.created_at,
          facility: attestation.bookings?.slots?.facilities?.name
        });
      });

      // Add slot activities
      slots?.forEach(slot => {
        activityItems.push({
          id: `slot-${slot.id}`,
          type: 'slot_created',
          title: 'New Slot Available',
          description: `"${slot.title}" slot created at ${slot.facilities?.name}`,
          timestamp: slot.created_at,
          facility: slot.facilities?.name
        });
      });

      // Sort by timestamp and take the most recent
      const sortedActivities = activityItems
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20);

      setActivities(sortedActivities);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeSubscription = () => {
    // Subscribe to bookings changes
    const bookingsChannel = supabase
      .channel('bookings_activity')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchRecentActivity();
      })
      .subscribe();

    // Subscribe to facilities changes
    const facilitiesChannel = supabase
      .channel('facilities_activity')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'facilities' }, () => {
        fetchRecentActivity();
      })
      .subscribe();

    // Subscribe to attestations changes
    const attestationsChannel = supabase
      .channel('attestations_activity')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attestations' }, () => {
        fetchRecentActivity();
      })
      .subscribe();

    // Subscribe to slots changes
    const slotsChannel = supabase
      .channel('slots_activity')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slots' }, () => {
        fetchRecentActivity();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(facilitiesChannel);
      supabase.removeChannel(attestationsChannel);
      supabase.removeChannel(slotsChannel);
    };
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking_created': return <Calendar className="w-4 h-4" />;
      case 'booking_completed': return <CheckCircle className="w-4 h-4" />;
      case 'facility_approved': return <Building className="w-4 h-4" />;
      case 'audit_completed': return <Shield className="w-4 h-4" />;
      case 'slot_created': return <Beaker className="w-4 h-4" />;
      case 'payment_received': return <DollarSign className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'booking_created': return 'bg-blue-500/10 text-blue-400';
      case 'booking_completed': return 'bg-green-500/10 text-green-400';
      case 'facility_approved': return 'bg-purple-500/10 text-purple-400';
      case 'audit_completed': return 'bg-yellow-500/10 text-yellow-400';
      case 'slot_created': return 'bg-primary/10 text-primary';
      case 'payment_received': return 'bg-green-500/10 text-green-400';
      default: return 'bg-gray-500/10 text-gray-400';
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'booking_created': return { text: 'New Booking', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'booking_completed': return { text: 'Completed', color: 'status-bullish' };
      case 'facility_approved': return { text: 'Approved', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      case 'audit_completed': return { text: 'Audited', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' };
      case 'slot_created': return { text: 'New Slot', color: 'bg-primary/10 text-primary border-primary/30' };
      case 'payment_received': return { text: 'Payment', color: 'status-bullish' };
      default: return { text: 'Activity', color: 'bg-gray-500/10 text-gray-400 border-gray-500/30' };
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Live Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-1">
              {activities.map((activity) => {
                const badge = getActivityBadge(activity.type);
                return (
                  <div key={activity.id} className="p-4 border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-semibold text-foreground">
                            {activity.title}
                          </h4>
                          <div className="flex items-center gap-2 ml-2">
                            <Badge className={badge.color}>
                              {badge.text}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatRelativeTime(activity.timestamp)}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {activity.facility && (
                            <div className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {activity.facility}
                            </div>
                          )}
                          {activity.amount && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ${activity.amount.toLocaleString()}
                            </div>
                          )}
                          {activity.user && (
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {activity.user}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};