import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bell, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  X
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'booking_update' | 'payment_received' | 'slot_available' | 'audit_complete';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface RealTimeUpdatesProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RealTimeUpdates = ({ isOpen, onClose }: RealTimeUpdatesProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'booking_update',
      title: 'Booking Confirmed',
      message: 'Your mRNA production slot has been confirmed for next week',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      read: false
    },
    {
      id: '2',
      type: 'payment_received',
      title: 'Payment Processed',
      message: '$18,500 payment received for cell therapy manufacturing',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false
    },
    {
      id: '3',
      type: 'audit_complete',
      title: 'Audit Complete',
      message: 'Quality audit passed with 98% compliance score',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      read: true
    }
  ]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_update':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'payment_received':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'slot_available':
        return <Bell className="w-4 h-4 text-primary" />;
      case 'audit_complete':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking_update':
        return 'bg-blue-500/10 border-blue-500/30';
      case 'payment_received':
        return 'bg-green-500/10 border-green-500/30';
      case 'slot_available':
        return 'bg-primary/10 border-primary/30';
      case 'audit_complete':
        return 'bg-green-500/10 border-green-500/30';
      default:
        return 'bg-muted/10 border-border';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-6">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Live Updates</h2>
              {unreadCount > 0 && (
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground text-sm">
                  You're all caught up! New updates will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !notification.read ? getNotificationColor(notification.type) : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(notification.timestamp)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setLoading(true);
                // Simulate refresh
                setTimeout(() => setLoading(false), 1000);
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Updates
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};