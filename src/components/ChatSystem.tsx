import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatTime } from '@/lib/utils';
import { 
  MessageCircle, 
  Send, 
  Phone, 
  Video,
  MoreHorizontal,
  Paperclip,
  Smile,
  Search,
  Users,
  Clock,
  CheckCheck,
  AlertCircle,
  X
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  message: string;
  timestamp: Date;
  read: boolean;
  message_type: 'text' | 'file' | 'system';
  file_url?: string;
  file_name?: string;
}

interface ChatChannel {
  id: string;
  name: string;
  type: 'direct' | 'booking' | 'support' | 'group';
  participants: string[];
  last_message?: ChatMessage;
  unread_count: number;
  booking_id?: string;
  avatar?: string;
}

interface ChatSystemProps {
  isOpen: boolean;
  onClose: () => void;
  initialChannelId?: string;
}

export const ChatSystem = ({ isOpen, onClose, initialChannelId }: ChatSystemProps) => {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<ChatChannel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && user) {
      fetchChannels();
      setupRealtimeSubscription();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (activeChannel) {
      fetchMessages(activeChannel.id);
      markChannelAsRead(activeChannel.id);
    }
  }, [activeChannel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChannels = async () => {
    try {
      const { data: channels, error } = await supabase
        .from('chat_channels')
        .select(`
          *,
          chat_messages (
            id,
            sender_id,
            message,
            created_at,
            message_type,
            file_name
          )
        `)
        .contains('participants', [user?.id])
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const formattedChannels: ChatChannel[] = channels?.map(channel => ({
        id: channel.id,
        name: channel.name,
        type: channel.type as 'direct' | 'booking' | 'support' | 'group',
        participants: channel.participants,
        unread_count: 0, // TODO: Calculate based on read status
        booking_id: channel.booking_id,
        avatar: '/placeholder.svg',
        last_message: channel.chat_messages?.[0] ? {
          id: channel.chat_messages[0].id,
          sender_id: channel.chat_messages[0].sender_id,
          sender_name: 'User', // TODO: Get from profiles
          message: channel.chat_messages[0].message,
          timestamp: new Date(channel.chat_messages[0].created_at),
          read: true, // TODO: Implement read status
          message_type: channel.chat_messages[0].message_type as 'text' | 'file' | 'system',
          file_name: channel.chat_messages[0].file_name
        } : undefined
      })) || [];

      setChannels(formattedChannels);
      
      if (initialChannelId) {
        const channel = formattedChannels.find(c => c.id === initialChannelId);
        if (channel) setActiveChannel(channel);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
      toast({
        title: "Error",
        description: "Failed to load chat channels.",
        variant: "destructive"
      });
    }
  };

  const fetchMessages = async (channelId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: ChatMessage[] = messages?.map(message => ({
        id: message.id,
        sender_id: message.sender_id,
        sender_name: message.sender_id === user?.id 
          ? 'You' 
          : message.sender_name || 'User',
        sender_avatar: message.sender_avatar_url || '/placeholder.svg',
        message: message.message,
        timestamp: new Date(message.created_at),
        read: true, // TODO: Implement read status tracking
        message_type: message.message_type as 'text' | 'file' | 'system',
        file_name: message.file_name,
        file_url: message.file_url
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages.",
        variant: "destructive"
      });
    }
  };

  const setupRealtimeSubscription = () => {
    // Set up Supabase real-time subscription for messages
    const channel = supabase
      .channel('chat_messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          if (activeChannel && newMessage.sender_id !== user?.id) {
            setMessages(prev => [...prev, newMessage]);
            toast({
              title: "New Message",
              description: `${newMessage.sender_name}: ${newMessage.message.substring(0, 50)}...`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChannel || !user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          channel_id: activeChannel.id,
          sender_id: user.id,
          sender_name: 'You',
          message: newMessage,
          message_type: 'text'
        })
        .select()
        .single();

      if (error) throw error;

      const message: ChatMessage = {
        id: data.id,
        sender_id: user.id,
        sender_name: 'You',
        message: newMessage,
        timestamp: new Date(data.created_at),
        read: true,
        message_type: 'text'
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');

      // Update channel's updated_at timestamp
      await supabase
        .from('chat_channels')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeChannel.id);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markChannelAsRead = (channelId: string) => {
    setChannels(prev => 
      prev.map(channel => 
        channel.id === channelId 
          ? { ...channel, unread_count: 0 }
          : channel
      )
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed inset-4 bg-background rounded-lg shadow-xl overflow-hidden">
        <div className="h-full flex">
          {/* Sidebar */}
          <div className="w-80 border-r border-border flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Messages</h2>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Channel List */}
            <ScrollArea className="flex-1">
              <div className="p-2">
                {filteredChannels.map((channel) => (
                  <div
                    key={channel.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                      activeChannel?.id === channel.id 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setActiveChannel(channel)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={channel.avatar} />
                        <AvatarFallback>
                          {channel.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate">{channel.name}</p>
                          {channel.unread_count > 0 && (
                            <Badge variant="default" className="bg-primary text-primary-foreground ml-2">
                              {channel.unread_count}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {channel.type}
                          </Badge>
                          {channel.last_message && (
                            <Clock className="w-3 h-3 ml-1" />
                          )}
                          {channel.last_message && formatTime(channel.last_message.timestamp)}
                        </div>
                        
                        {channel.last_message && (
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {channel.last_message.message_type === 'file' 
                              ? '📎 File attachment' 
                              : channel.last_message.message
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {activeChannel ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={activeChannel.avatar} />
                        <AvatarFallback>
                          {activeChannel.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{activeChannel.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {activeChannel.type === 'booking' && 'Production Booking'}
                          {activeChannel.type === 'support' && 'Support Channel'}
                          {activeChannel.type === 'group' && `${activeChannel.participants.length} participants`}
                          {activeChannel.type === 'direct' && 'Direct Message'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Video className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.sender_id === user?.id ? 'flex-row-reverse' : ''
                        }`}
                      >
                        {message.sender_id !== user?.id && (
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={message.sender_avatar} />
                            <AvatarFallback>
                              {message.sender_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={`max-w-xs lg:max-w-md ${
                          message.sender_id === user?.id ? 'ml-auto' : ''
                        }`}>
                          <div className={`rounded-lg p-3 ${
                            message.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}>
                            {message.message_type === 'file' ? (
                              <div className="flex items-center gap-2">
                                <Paperclip className="w-4 h-4" />
                                <span className="text-sm">{message.file_name}</span>
                              </div>
                            ) : (
                              <p className="text-sm">{message.message}</p>
                            )}
                          </div>
                          
                          <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${
                            message.sender_id === user?.id ? 'justify-end' : ''
                          }`}>
                            <span>{formatTime(message.timestamp)}</span>
                            {message.sender_id === user?.id && (
                              <CheckCheck className={`w-3 h-3 ${
                                message.read ? 'text-blue-500' : 'text-muted-foreground'
                              }`} />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2"
                      >
                        <Smile className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button onClick={sendMessage} disabled={loading || !newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the sidebar to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};