import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  Bell, 
  Send, 
  Users, 
  MousePointerClick, 
  TrendingUp, 
  Smartphone,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  RefreshCw,
  ChevronDown,
  Crown,
  Store,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
      sent: 'bg-emerald-100 text-emerald-700',
      clicked: 'bg-blue-100 text-blue-700',
      failed: 'bg-red-100 text-red-700',
      pending: 'bg-amber-100 text-amber-700',
      completed: 'bg-emerald-100 text-emerald-700',
      sending: 'bg-blue-100 text-blue-700',
      draft: 'bg-gray-100 text-gray-700',
    };
    return (
      <Badge className={styles[status] || 'bg-gray-100 text-gray-700'}>
        {status}
      </Badge>
    );
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'pro_users': return <Crown className="h-4 w-4 text-amber-500" />;
      case 'sellers': return <Store className="h-4 w-4 text-violet-500" />;
      default: return <Globe className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Push Notifications</h1>
          <p className="text-gray-500 text-sm">Send and manage browser push notifications</p>
        </div>
        <Button onClick={loadAll} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Subscribed Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-violet-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Devices</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalSubscriptions || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Sent</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalSent || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Send className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Click Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.ctr || '0'}%</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <MousePointerClick className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="compose" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* Compose Tab */}
        <TabsContent value="compose">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Send Broadcast Notification
              </CardTitle>
              <CardDescription>
                Send a notification to all or selected users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Notification title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-400">{title.length}/50 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link">Link (optional)</Label>
                  <Input
                    id="link"
                    placeholder="/dashboard or https://..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Write your notification message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-gray-400">{message.length}/200 characters</p>
              </div>

              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select value={targetAudience} onValueChange={setTargetAudience}>
                  <SelectTrigger className="w-full lg:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-500" />
                        All Users
                      </div>
                    </SelectItem>
                    <SelectItem value="pro_users">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-500" />
                        Pro Users Only
                      </div>
                    </SelectItem>
                    <SelectItem value="sellers">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-violet-500" />
                        Sellers Only
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Preview */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm text-gray-500 mb-2">Preview:</p>
                <div className="bg-white rounded-lg shadow-sm border p-3 max-w-sm">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Bell className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {title || 'Notification Title'}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {message || 'Your notification message will appear here...'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSendBroadcast} 
                disabled={sending || !title.trim() || !message.trim()}
                className="w-full lg:w-auto"
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Broadcasts Tab */}
        <TabsContent value="broadcasts">
          <Card>
            <CardHeader>
              <CardTitle>Broadcast History</CardTitle>
              <CardDescription>All sent broadcast notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Clicked</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {broadcasts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No broadcasts sent yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      broadcasts.map((broadcast) => (
                        <TableRow key={broadcast.id}>
                          <TableCell>
                            <div className="max-w-xs">
                              <p className="font-medium truncate">{broadcast.title}</p>
                              <p className="text-sm text-gray-500 truncate">{broadcast.message}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {getAudienceIcon(broadcast.target_audience)}
                              <span className="text-sm capitalize">
                                {broadcast.target_audience.replace('_', ' ')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{broadcast.total_sent}</TableCell>
                          <TableCell>{broadcast.total_clicked}</TableCell>
                          <TableCell>{getStatusBadge(broadcast.status)}</TableCell>
                          <TableCell className="text-sm text-gray-500">
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
                            >
                              <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Device Subscriptions</CardTitle>
              <CardDescription>Users who have enabled push notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No subscriptions yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      subscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                              {sub.user_id.slice(0, 8)}...
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{sub.device_name || 'Unknown'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {sub.is_active ? (
                              <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-500">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(sub.last_used_at)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
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
                              >
                                <XCircle className="h-4 w-4 text-gray-400 hover:text-red-500" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Logs</CardTitle>
              <CardDescription>Recent notification delivery attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Clicked</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No logs yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="max-w-xs">
                              <p className="font-medium truncate">{log.title || '-'}</p>
                              <p className="text-sm text-gray-500 truncate">{log.message}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                              {log.user_id?.slice(0, 8)}...
                            </code>
                          </TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(log.sent_at)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {log.clicked_at ? formatDate(log.clicked_at) : '-'}
                          </TableCell>
                          <TableCell>
                            {log.error_message && (
                              <span className="text-xs text-red-500 truncate max-w-xs block">
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteType === 'broadcast' ? 'Delete Broadcast?' : 'Deactivate Subscription?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === 'broadcast'
                ? 'This will permanently delete this broadcast from history.'
                : 'This will deactivate the subscription. The user will need to re-subscribe to receive notifications.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {deleteType === 'broadcast' ? 'Delete' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PushNotificationManagement;
