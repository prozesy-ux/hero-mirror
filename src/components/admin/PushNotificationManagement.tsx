import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  Bell, 
  Send, 
  Users, 
  MousePointerClick, 
  Smartphone,
  CheckCircle2,
  XCircle,
  Trash2,
  RefreshCw,
  Crown,
  Store,
  Globe,
  Zap,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const ADMIN_SESSION_KEY = 'admin_session_token';

interface Stats {
  totalSubscriptions: number;
  totalUsers: number;
  sentToday: number;
  clickedToday: number;
  totalSent: number;
  totalClicked: number;
  ctr: string;
}

interface Subscription {
  id: string;
  user_id: string;
  device_name: string;
  user_agent: string;
  is_active: boolean;
  last_used_at: string;
  created_at: string;
}

interface Broadcast {
  id: string;
  title: string;
  message: string;
  link: string;
  target_audience: string;
  status: string;
  total_sent: number;
  total_failed: number;
  total_clicked: number;
  sent_at: string;
  created_at: string;
}

interface PushLog {
  id: string;
  user_id: string;
  title: string;
  message: string;
  status: string;
  error_message: string;
  sent_at: string;
  clicked_at: string;
}

const PushNotificationManagement = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [logs, setLogs] = useState<PushLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [testSending, setTestSending] = useState(false);
  
  // Broadcast form
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  
  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'broadcast' | 'subscription'>('broadcast');

  const fetchData = useCallback(async (action: string, body?: object) => {
    const token = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!token) return null;

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/broadcast-push`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ action, token, ...body }),
      }
    );

    return response.json();
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, subsData, broadcastsData, logsData] = await Promise.all([
        fetchData('get-stats'),
        fetchData('get-subscriptions'),
        fetchData('get-broadcasts'),
        fetchData('get-logs', { limit: 50 }),
      ]);

      if (statsData && !statsData.error) setStats(statsData);
      if (subsData?.subscriptions) setSubscriptions(subsData.subscriptions);
      if (broadcastsData?.broadcasts) setBroadcasts(broadcastsData.broadcasts);
      if (logsData?.logs) setLogs(logsData.logs);
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSendBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    setSending(true);
    try {
      const result = await fetchData('send-broadcast', {
        title: title.trim(),
        message: message.trim(),
        link: link.trim() || '/dashboard',
        target_audience: targetAudience,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success(`Broadcast sent to ${result.total_users} users (${result.total_sent} notifications)`);
      setTitle('');
      setMessage('');
      setLink('');
      loadAll();
    } catch (error) {
      console.error('Send error:', error);
      toast.error('Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  const handleSendTest = async () => {
    setTestSending(true);
    try {
      const result = await fetchData('send-test');
      if (result.error) {
        throw new Error(result.error);
      }
      toast.success('Test notification sent to your devices');
    } catch (error) {
      console.error('Test error:', error);
      toast.error('Failed to send test notification');
    } finally {
      setTestSending(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const action = deleteType === 'broadcast' ? 'delete-broadcast' : 'deactivate-subscription';
      const idKey = deleteType === 'broadcast' ? 'broadcast_id' : 'subscription_id';
      
      await fetchData(action, { [idKey]: deleteId });
      toast.success(deleteType === 'broadcast' ? 'Broadcast deleted' : 'Subscription deactivated');
      loadAll();
    } catch (error) {
      toast.error('Failed to delete');
    } finally {
      setDeleteId(null);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      sent: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      clicked: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30',
      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      sending: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };
    return (
      <Badge className={`border ${styles[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
        {status}
      </Badge>
    );
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'pro_users': return <Crown className="h-4 w-4 text-amber-400" />;
      case 'sellers': return <Store className="h-4 w-4 text-violet-400" />;
      default: return <Globe className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 lg:p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Users Card - Emerald */}
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Subscribed Users</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.totalUsers || 0}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <Users className="h-7 w-7 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Devices Card - Violet */}
        <div className="bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Active Devices</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.totalSubscriptions || 0}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center">
              <Smartphone className="h-7 w-7 text-violet-400" />
            </div>
          </div>
        </div>

        {/* Sent Card - Blue */}
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Total Sent</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.totalSent || 0}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <Send className="h-7 w-7 text-blue-400" />
            </div>
          </div>
        </div>

        {/* CTR Card - Amber */}
        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Click Rate</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.ctr || '0'}%</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
              <MousePointerClick className="h-7 w-7 text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="compose" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-slate-900/50 border border-slate-800 p-1 rounded-xl">
            <TabsTrigger 
              value="compose" 
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4"
            >
              <Bell className="h-4 w-4 mr-2" />
              Compose
            </TabsTrigger>
            <TabsTrigger 
              value="broadcasts"
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4"
            >
              <Activity className="h-4 w-4 mr-2" />
              Broadcasts
            </TabsTrigger>
            <TabsTrigger 
              value="subscriptions"
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger 
              value="logs"
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Logs
            </TabsTrigger>
            <TabsTrigger 
              value="test"
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4"
            >
              <Zap className="h-4 w-4 mr-2" />
              Test
            </TabsTrigger>
          </TabsList>

          <Button 
            onClick={loadAll} 
            variant="outline" 
            size="sm" 
            disabled={loading}
            className="bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Compose Tab */}
        <TabsContent value="compose">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-300">Title *</Label>
                <Input
                  id="title"
                  placeholder="Notification title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={50}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20"
                />
                <p className={`text-xs ${title.length > 40 ? 'text-amber-400' : 'text-slate-500'}`}>
                  {title.length}/50 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="link" className="text-slate-300">Link (optional)</Label>
                <Input
                  id="link"
                  placeholder="/dashboard or https://..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-slate-300">Message *</Label>
              <Textarea
                id="message"
                placeholder="Write your notification message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={200}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 resize-none"
              />
              <p className={`text-xs ${message.length > 180 ? 'text-amber-400' : 'text-slate-500'}`}>
                {message.length}/200 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Target Audience</Label>
              <Select value={targetAudience} onValueChange={setTargetAudience}>
                <SelectTrigger className="w-full lg:w-64 bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all" className="text-white hover:bg-slate-800 focus:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-400" />
                      All Users
                    </div>
                  </SelectItem>
                  <SelectItem value="pro_users" className="text-white hover:bg-slate-800 focus:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-400" />
                      Pro Users Only
                    </div>
                  </SelectItem>
                  <SelectItem value="sellers" className="text-white hover:bg-slate-800 focus:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-violet-400" />
                      Sellers Only
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dark Preview */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">Preview</p>
              <div className="bg-slate-900 rounded-xl p-4 max-w-sm border border-slate-700">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">
                      {title || 'Notification Title'}
                    </p>
                    <p className="text-sm text-slate-400 line-clamp-2 mt-0.5">
                      {message || 'Your notification message will appear here...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSendBroadcast} 
              disabled={sending || !title.trim() || !message.trim()}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
            >
              {sending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Notification
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Broadcasts Tab */}
        <TabsContent value="broadcasts">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/50">
                  <TableHead className="text-slate-400 font-medium">Title</TableHead>
                  <TableHead className="text-slate-400 font-medium">Audience</TableHead>
                  <TableHead className="text-slate-400 font-medium">Sent</TableHead>
                  <TableHead className="text-slate-400 font-medium">Clicked</TableHead>
                  <TableHead className="text-slate-400 font-medium">Status</TableHead>
                  <TableHead className="text-slate-400 font-medium">Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {broadcasts.length === 0 ? (
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableCell colSpan={7}>
                      <div className="text-center py-16">
                        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                          <Bell className="h-10 w-10 text-slate-600" />
                        </div>
                        <p className="text-slate-500 text-lg">No broadcasts sent yet</p>
                        <p className="text-slate-600 text-sm mt-1">Compose your first notification above</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  broadcasts.map((broadcast) => (
                    <TableRow key={broadcast.id} className="border-slate-800 hover:bg-slate-800/30">
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium text-white truncate">{broadcast.title}</p>
                          <p className="text-sm text-slate-500 truncate">{broadcast.message}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {getAudienceIcon(broadcast.target_audience)}
                          <span className="text-sm text-slate-300 capitalize">
                            {broadcast.target_audience.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">{broadcast.total_sent}</TableCell>
                      <TableCell className="text-slate-300">{broadcast.total_clicked}</TableCell>
                      <TableCell>{getStatusBadge(broadcast.status)}</TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDate(broadcast.sent_at || broadcast.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeleteId(broadcast.id);
                            setDeleteType('broadcast');
                          }}
                          className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/50">
                  <TableHead className="text-slate-400 font-medium">User ID</TableHead>
                  <TableHead className="text-slate-400 font-medium">Device</TableHead>
                  <TableHead className="text-slate-400 font-medium">Status</TableHead>
                  <TableHead className="text-slate-400 font-medium">Last Used</TableHead>
                  <TableHead className="text-slate-400 font-medium">Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.length === 0 ? (
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableCell colSpan={6}>
                      <div className="text-center py-16">
                        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                          <Smartphone className="h-10 w-10 text-slate-600" />
                        </div>
                        <p className="text-slate-500 text-lg">No subscriptions yet</p>
                        <p className="text-slate-600 text-sm mt-1">Users will appear here when they enable notifications</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  subscriptions.map((sub) => (
                    <TableRow key={sub.id} className="border-slate-800 hover:bg-slate-800/30">
                      <TableCell>
                        <code className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-md font-mono">
                          {sub.user_id.slice(0, 8)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-slate-500" />
                          <span className="text-sm text-slate-300">{sub.device_name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {sub.is_active ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-500/20 text-slate-400 border border-slate-500/30">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDate(sub.last_used_at)}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDate(sub.created_at)}
                      </TableCell>
                      <TableCell>
                        {sub.is_active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteId(sub.id);
                              setDeleteType('subscription');
                            }}
                            className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/50">
                  <TableHead className="text-slate-400 font-medium">Title</TableHead>
                  <TableHead className="text-slate-400 font-medium">User</TableHead>
                  <TableHead className="text-slate-400 font-medium">Status</TableHead>
                  <TableHead className="text-slate-400 font-medium">Sent</TableHead>
                  <TableHead className="text-slate-400 font-medium">Clicked</TableHead>
                  <TableHead className="text-slate-400 font-medium">Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableCell colSpan={6}>
                      <div className="text-center py-16">
                        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                          <TrendingUp className="h-10 w-10 text-slate-600" />
                        </div>
                        <p className="text-slate-500 text-lg">No logs yet</p>
                        <p className="text-slate-600 text-sm mt-1">Delivery logs will appear here</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="border-slate-800 hover:bg-slate-800/30">
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium text-white truncate">{log.title || '-'}</p>
                          <p className="text-sm text-slate-500 truncate">{log.message}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-md font-mono">
                          {log.user_id?.slice(0, 8)}...
                        </code>
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDate(log.sent_at)}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {log.clicked_at ? formatDate(log.clicked_at) : '-'}
                      </TableCell>
                      <TableCell>
                        {log.error_message && (
                          <span className="text-xs text-red-400 truncate max-w-xs block bg-red-500/10 px-2 py-1 rounded">
                            {log.error_message}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="max-w-md mx-auto text-center py-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-6">
                <Zap className="h-12 w-12 text-violet-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Test Push Notification</h3>
              <p className="text-slate-400 mb-6">
                Send a test notification to verify the push system is working correctly.
                The notification will be sent to all your subscribed devices.
              </p>
              <Button
                onClick={handleSendTest}
                disabled={testSending}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
              >
                {testSending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending Test...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Send Test Notification
                  </>
                )}
              </Button>
              <p className="text-xs text-slate-600 mt-4">
                Make sure you have enabled notifications in your browser first.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog - Dark Theme */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {deleteType === 'broadcast' ? 'Delete Broadcast?' : 'Deactivate Subscription?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {deleteType === 'broadcast'
                ? 'This will permanently delete this broadcast from history.'
                : 'This will deactivate the subscription. The user will need to re-subscribe to receive notifications.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-red-600 hover:bg-red-700 text-white border-0"
            >
              {deleteType === 'broadcast' ? 'Delete' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PushNotificationManagement;
