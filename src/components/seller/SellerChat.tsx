import { useState, useEffect, useRef } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Send, 
  Loader2, 
  MessageSquare,
  User,
  Search
} from 'lucide-react';

interface ChatMessage {
  id: string;
  seller_id: string;
  buyer_id: string;
  product_id: string | null;
  message: string;
  sender_type: string;
  is_read: boolean;
  created_at: string;
}

interface ChatUser {
  buyer_id: string;
  email: string;
  full_name: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

const SellerChat = () => {
  const { profile } = useSellerContext();
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChatUsers();
    subscribeToMessages();
  }, [profile.id]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser);
      markAsRead(selectedUser);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatUsers = async () => {
    try {
      // Get all unique buyers who have chatted with this seller
      const { data: chats, error } = await supabase
        .from('seller_chats')
        .select('buyer_id, message, created_at, is_read, sender_type')
        .eq('seller_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by buyer and get latest message + unread count
      const buyerMap = new Map<string, {
        last_message: string;
        last_message_time: string;
        unread_count: number;
      }>();

      chats?.forEach((chat) => {
        if (!buyerMap.has(chat.buyer_id)) {
          buyerMap.set(chat.buyer_id, {
            last_message: chat.message,
            last_message_time: chat.created_at,
            unread_count: 0
          });
        }
        // Count unread messages from buyer
        if (!chat.is_read && chat.sender_type === 'buyer') {
          const existing = buyerMap.get(chat.buyer_id)!;
          existing.unread_count++;
        }
      });

      // Fetch buyer profiles
      const buyerIds = Array.from(buyerMap.keys());
      if (buyerIds.length === 0) {
        setChatUsers([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', buyerIds);

      const users: ChatUser[] = buyerIds.map((buyerId) => {
        const buyerProfile = profiles?.find(p => p.user_id === buyerId);
        const chatInfo = buyerMap.get(buyerId)!;
        return {
          buyer_id: buyerId,
          email: buyerProfile?.email || 'Unknown',
          full_name: buyerProfile?.full_name || null,
          ...chatInfo
        };
      });

      // Sort by last message time
      users.sort((a, b) => 
        new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      );

      setChatUsers(users);
    } catch (error) {
      console.error('Error fetching chat users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (buyerId: string) => {
    const { data, error } = await supabase
      .from('seller_chats')
      .select('*')
      .eq('seller_id', profile.id)
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }
    setMessages(data || []);
  };

  const markAsRead = async (buyerId: string) => {
    await supabase
      .from('seller_chats')
      .update({ is_read: true })
      .eq('seller_id', profile.id)
      .eq('buyer_id', buyerId)
      .eq('sender_type', 'buyer');
    
    fetchChatUsers();
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('seller-chats')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'seller_chats',
        filter: `seller_id=eq.${profile.id}`
      }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        if (newMsg.buyer_id === selectedUser) {
          setMessages(prev => [...prev, newMsg]);
          if (newMsg.sender_type === 'buyer') {
            markAsRead(newMsg.buyer_id);
          }
        }
        fetchChatUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!selectedUser || !newMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('seller_chats')
        .insert({
          seller_id: profile.id,
          buyer_id: selectedUser,
          message: newMessage.trim(),
          sender_type: 'seller'
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error: any) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredUsers = chatUsers.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = chatUsers.reduce((sum, u) => sum + u.unread_count, 0);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-3 gap-4 h-[calc(100vh-200px)]">
          <Skeleton className="col-span-1" />
          <Skeleton className="col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customer Chat</h1>
          <p className="text-muted-foreground">Chat with your buyers</p>
        </div>
        {totalUnread > 0 && (
          <Badge className="bg-emerald-500">
            {totalUnread} unread
          </Badge>
        )}
      </div>

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
        {/* Users List */}
        <Card className="lg:col-span-1">
          <CardContent className="p-0 h-full flex flex-col">
            {/* Search */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Users */}
            <ScrollArea className="flex-1">
              {filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No conversations yet</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.buyer_id}
                      onClick={() => setSelectedUser(user.buyer_id)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedUser === user.buyer_id
                          ? 'bg-emerald-500/10 border border-emerald-500/20'
                          : 'hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {user.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">
                              {user.full_name || user.email}
                            </p>
                            {user.unread_count > 0 && (
                              <Badge className="bg-emerald-500 text-xs ml-2">
                                {user.unread_count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.last_message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(user.last_message_time), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2">
          <CardContent className="p-0 h-full flex flex-col">
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {chatUsers.find(u => u.buyer_id === selectedUser)?.full_name || 
                       chatUsers.find(u => u.buyer_id === selectedUser)?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">Customer</p>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === 'seller' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] rounded-lg p-3 ${
                          msg.sender_type === 'seller'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-accent'
                        }`}>
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender_type === 'seller' ? 'text-emerald-100' : 'text-muted-foreground'
                          }`}>
                            {format(new Date(msg.created_at), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={sending}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="bg-emerald-500 hover:bg-emerald-600"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a customer from the list to start chatting
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerChat;
