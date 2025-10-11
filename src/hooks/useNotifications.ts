import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateNotificationOptions {
  userId: string;
  type: 'booking' | 'payment' | 'message' | 'compliance' | 'system' | 'audit' | 'facility' | 'dispute';
  title: string;
  message: string;
  urgent?: boolean;
  actionUrl?: string;
  sendEmail?: boolean;
  userEmail?: string;
}

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'message' | 'compliance' | 'system' | 'audit' | 'facility' | 'dispute';
  read: boolean;
  urgent: boolean;
  created_at: string;
  action_url?: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchNotifications();
      setupRealTimeSubscription();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      const typedData = (data || []) as NotificationData[];
      setNotifications(typedData);
      setUnreadCount(typedData.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const setupRealTimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as NotificationData;
          setNotifications(prev => [newNotification, ...prev.slice(0, 19)]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast for urgent notifications
          if (newNotification.urgent) {
            toast({
              title: newNotification.title,
              description: newNotification.message,
              variant: "default",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      if (toast) {
        toast({
          title: "All notifications marked as read",
          description: "Your notification list has been cleared.",
        });
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };
  const createNotification = async ({
    userId,
    type,
    title,
    message,
    urgent = false,
    actionUrl,
    sendEmail = false,
    userEmail
  }: CreateNotificationOptions) => {
    try {
      // Call secure edge function to create notification
      const { data, error } = await supabase.functions.invoke('create-notification', {
        body: {
          userId,
          type,
          title,
          message,
          urgent,
          actionUrl,
          sendEmail,
          userEmail
        }
      });

      if (error) throw error;

      return data?.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  };

  const generateEmailHTML = (type: string, title: string, message: string, actionUrl?: string) => {
    const typeColors = {
      booking: '#10B981',
      payment: '#3B82F6', 
      message: '#8B5CF6',
      compliance: '#F59E0B',
      system: '#6B7280'
    };

    const color = typeColors[type as keyof typeof typeColors] || '#6B7280';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: ${color}; margin: 0; font-size: 24px;">DeSynth Platform</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">Manufacturing Excellence Network</p>
          </div>
          
          <div style="border-left: 4px solid ${color}; padding-left: 20px; margin: 20px 0;">
            <h2 style="color: #111827; margin: 0 0 10px 0; font-size: 20px;">${title}</h2>
            <p style="color: #374151; margin: 0; line-height: 1.6;">${message}</p>
          </div>
          
          ${actionUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionUrl}" style="background-color: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Details</a>
            </div>
          ` : ''}
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
              This email was sent by DeSynth Platform. If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    `;
  };

  return { 
    createNotification, 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    refreshNotifications: fetchNotifications 
  };
};