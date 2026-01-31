import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Globe, 
  RefreshCcw, 
  Send, 
  FileText, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2,
  Copy,
  ExternalLink,
  Trash2,
  Plus,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminMutate } from '@/hooks/useAdminMutate';
import { format } from 'date-fns';

interface SEOSettings {
  id: string;
  site_title: string | null;
  site_description: string | null;
  og_image_url: string | null;
  twitter_handle: string | null;
  google_indexing_enabled: boolean;
  google_service_account_email: string | null;
  google_service_account_key: string | null;
  indexnow_enabled: boolean;
  indexnow_key: string | null;
  robots_txt_content: string | null;
  updated_at: string;
}

interface IndexingHistory {
  id: string;
  url: string;
  search_engine: string;
  action_type: string;
  status: string;
  response_data: any;
  submitted_by: string | null;
  created_at: string;
}

const SEOManagement = () => {
  const { fetchData, loading: fetchLoading } = useAdminData();
  const { updateData, insertData, deleteData, mutating } = useAdminMutate();
  
  const [settings, setSettings] = useState<SEOSettings | null>(null);
  const [history, setHistory] = useState<IndexingHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [urlToIndex, setUrlToIndex] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [useGoogle, setUseGoogle] = useState(false);
  const [useIndexNow, setUseIndexNow] = useState(true);
  const [actionType, setActionType] = useState<'URL_UPDATED' | 'URL_DELETED'>('URL_UPDATED');
  
  // Settings form
  const [editedSettings, setEditedSettings] = useState<Partial<SEOSettings>>({});

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [settingsRes, historyRes] = await Promise.all([
        fetchData<SEOSettings>('seo_settings', { 
          filters: [{ column: 'id', value: 'global' }] 
        }),
        fetchData<IndexingHistory>('url_indexing_history', {
          order: { column: 'created_at', ascending: false },
          limit: 50
        })
      ]);
      
      if (settingsRes.data && settingsRes.data.length > 0) {
        setSettings(settingsRes.data[0]);
        setEditedSettings(settingsRes.data[0]);
      }
      if (historyRes.data) {
        setHistory(historyRes.data);
      }
    } catch (error) {
      console.error('Failed to load SEO data:', error);
      toast.error('Failed to load SEO settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmitUrl = async (urls: string[], engines: string[]) => {
    if (urls.length === 0) {
      toast.error('Please enter at least one URL');
      return;
    }

    if (engines.length === 0) {
      toast.error('Please select at least one search engine');
      return;
    }

    setSubmitting(true);
    
    try {
      for (const engine of engines) {
        if (engine === 'indexnow') {
          // Submit to IndexNow
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seo-indexnow-submit`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              },
              body: JSON.stringify({
                urls,
                actionType,
                adminToken: localStorage.getItem('admin_session_token')
              }),
            }
          );
          
          const result = await response.json();
          if (result.success) {
            toast.success(`Successfully submitted ${urls.length} URL(s) to IndexNow`);
          } else {
            toast.error(result.error || 'Failed to submit to IndexNow');
          }
        }
        
        if (engine === 'google') {
          // Submit to Google
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seo-google-indexing`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              },
              body: JSON.stringify({
                urls,
                actionType,
                adminToken: localStorage.getItem('admin_session_token')
              }),
            }
          );
          
          const result = await response.json();
          if (result.success) {
            toast.success(`Successfully submitted ${urls.length} URL(s) to Google`);
          } else {
            toast.error(result.error || 'Failed to submit to Google');
          }
        }
      }
      
      // Reload history
      loadData();
      setUrlToIndex('');
      setBulkUrls('');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit URLs');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSingleSubmit = () => {
    const engines: string[] = [];
    if (useGoogle && settings?.google_indexing_enabled) engines.push('google');
    if (useIndexNow && settings?.indexnow_enabled) engines.push('indexnow');
    
    handleSubmitUrl([urlToIndex.trim()], engines);
  };

  const handleBulkSubmit = () => {
    const urls = bulkUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);
    
    const engines: string[] = [];
    if (useGoogle && settings?.google_indexing_enabled) engines.push('google');
    if (useIndexNow && settings?.indexnow_enabled) engines.push('indexnow');
    
    handleSubmitUrl(urls, engines);
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    try {
      const result = await updateData('seo_settings', 'global', {
        ...editedSettings,
        updated_at: new Date().toISOString()
      });
      
      if (result.success) {
        toast.success('Settings saved successfully');
        loadData();
      } else {
        toast.error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save settings');
    }
  };

  const generateIndexNowKey = () => {
    const key = crypto.randomUUID();
    setEditedSettings(prev => ({ ...prev, indexnow_key: key }));
    toast.success('New IndexNow key generated');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Success</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  const getEngineBadge = (engine: string) => {
    switch (engine) {
      case 'google':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Google</Badge>;
      case 'indexnow':
        return <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">IndexNow</Badge>;
      case 'bing':
        return <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Bing</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{engine}</Badge>;
    }
  };

  // Calculate stats
  const todaySubmissions = history.filter(h => {
    const today = new Date().toISOString().split('T')[0];
    return h.created_at.startsWith(today);
  }).length;
  
  const successCount = history.filter(h => h.status === 'success').length;
  const googleCount = history.filter(h => h.search_engine === 'google').length;
  const indexNowCount = history.filter(h => h.search_engine === 'indexnow').length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 bg-slate-800/50" />
          ))}
        </div>
        <Skeleton className="h-96 bg-slate-800/50" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Today's Submissions</p>
              <p className="text-3xl font-bold text-white mt-1">{todaySubmissions}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center">
              <Send className="h-7 w-7 text-violet-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Successful</p>
              <p className="text-3xl font-bold text-white mt-1">{successCount}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Google Indexed</p>
              <p className="text-3xl font-bold text-white mt-1">{googleCount}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <Search className="h-7 w-7 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">IndexNow</p>
              <p className="text-3xl font-bold text-white mt-1">{indexNowCount}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
              <Globe className="h-7 w-7 text-cyan-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="indexing" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-slate-800/50 border border-white/10">
            <TabsTrigger value="indexing" className="data-[state=active]:bg-violet-600">
              <Send className="w-4 h-4 mr-2" /> Instant Indexing
            </TabsTrigger>
            <TabsTrigger value="sitemap" className="data-[state=active]:bg-violet-600">
              <FileText className="w-4 h-4 mr-2" /> Sitemap & Robots
            </TabsTrigger>
            <TabsTrigger value="meta" className="data-[state=active]:bg-violet-600">
              <Globe className="w-4 h-4 mr-2" /> Meta Tags
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-violet-600">
              <Settings className="w-4 h-4 mr-2" /> Settings
            </TabsTrigger>
          </TabsList>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={fetchLoading}
            className="border-white/10 text-white hover:bg-white/5"
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${fetchLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Instant Indexing Tab */}
        <TabsContent value="indexing" className="space-y-6">
          <Card className="bg-slate-900/50 border-white/10">
            <CardContent className="p-6 space-y-6">
              {/* Single URL Submission */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Submit Single URL</h3>
                <div className="flex gap-3">
                  <Input
                    placeholder="https://hero-mirror.lovable.app/your-page"
                    value={urlToIndex}
                    onChange={(e) => setUrlToIndex(e.target.value)}
                    className="flex-1 bg-slate-800/50 border-white/10 text-white"
                  />
                  <Button
                    onClick={handleSingleSubmit}
                    disabled={submitting || !urlToIndex.trim()}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    Submit
                  </Button>
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-400">
                    <input
                      type="checkbox"
                      checked={useGoogle}
                      onChange={(e) => setUseGoogle(e.target.checked)}
                      disabled={!settings?.google_indexing_enabled}
                      className="rounded border-white/20 bg-slate-800"
                    />
                    Google Indexing
                    {!settings?.google_indexing_enabled && (
                      <span className="text-xs text-amber-400">(Not configured)</span>
                    )}
                  </label>
                  
                  <label className="flex items-center gap-2 text-sm text-slate-400">
                    <input
                      type="checkbox"
                      checked={useIndexNow}
                      onChange={(e) => setUseIndexNow(e.target.checked)}
                      disabled={!settings?.indexnow_enabled}
                      className="rounded border-white/20 bg-slate-800"
                    />
                    IndexNow (Bing, Yandex, DuckDuckGo)
                    {!settings?.indexnow_enabled && (
                      <span className="text-xs text-amber-400">(Not configured)</span>
                    )}
                  </label>
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-400">
                    <input
                      type="radio"
                      name="actionType"
                      checked={actionType === 'URL_UPDATED'}
                      onChange={() => setActionType('URL_UPDATED')}
                      className="border-white/20 bg-slate-800"
                    />
                    URL Updated (Index/Re-index)
                  </label>
                  
                  <label className="flex items-center gap-2 text-sm text-slate-400">
                    <input
                      type="radio"
                      name="actionType"
                      checked={actionType === 'URL_DELETED'}
                      onChange={() => setActionType('URL_DELETED')}
                      className="border-white/20 bg-slate-800"
                    />
                    URL Deleted (Remove from index)
                  </label>
                </div>
              </div>

              {/* Bulk URL Submission */}
              <div className="space-y-4 pt-6 border-t border-white/10">
                <h3 className="text-lg font-semibold text-white">Bulk Submit URLs</h3>
                <Textarea
                  placeholder="Enter one URL per line:
https://hero-mirror.lovable.app/page1
https://hero-mirror.lovable.app/page2
https://hero-mirror.lovable.app/page3"
                  value={bulkUrls}
                  onChange={(e) => setBulkUrls(e.target.value)}
                  rows={5}
                  className="bg-slate-800/50 border-white/10 text-white font-mono text-sm"
                />
                <Button
                  onClick={handleBulkSubmit}
                  disabled={submitting || !bulkUrls.trim()}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Submit All URLs
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Submission History */}
          <Card className="bg-slate-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Recent Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">URL</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Engine</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Action</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-500">
                          No submissions yet. Submit your first URL above!
                        </td>
                      </tr>
                    ) : (
                      history.map((item) => (
                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-white text-sm truncate max-w-xs">{item.url}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-400 hover:text-white"
                                onClick={() => copyToClipboard(item.url)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                          <td className="py-3 px-4">{getEngineBadge(item.search_engine)}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-slate-400 border-slate-600">
                              {item.action_type === 'URL_UPDATED' ? 'Update' : 'Delete'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                          <td className="py-3 px-4 text-sm text-slate-400">
                            {format(new Date(item.created_at), 'MMM d, HH:mm')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sitemap & Robots Tab */}
        <TabsContent value="sitemap" className="space-y-6">
          <Card className="bg-slate-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Robots.txt Editor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={editedSettings.robots_txt_content || ''}
                onChange={(e) => setEditedSettings(prev => ({ ...prev, robots_txt_content: e.target.value }))}
                rows={10}
                className="bg-slate-800/50 border-white/10 text-white font-mono text-sm"
                placeholder="User-agent: *
Allow: /

Sitemap: https://hero-mirror.lovable.app/sitemap.xml"
              />
              <div className="flex gap-3">
                <Button
                  onClick={handleSaveSettings}
                  disabled={mutating}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {mutating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/5"
                  onClick={() => window.open('/robots.txt', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Live
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Sitemap</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-400 text-sm">
                Your sitemap is automatically generated and available at:
              </p>
              <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg">
                <code className="text-violet-400 flex-1">https://hero-mirror.lovable.app/sitemap.xml</code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard('https://hero-mirror.lovable.app/sitemap.xml')}
                  className="text-slate-400 hover:text-white"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open('/sitemap.xml', '_blank')}
                  className="text-slate-400 hover:text-white"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meta Tags Tab */}
        <TabsContent value="meta" className="space-y-6">
          <Card className="bg-slate-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Global SEO Meta Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Site Title</label>
                  <Input
                    value={editedSettings.site_title || ''}
                    onChange={(e) => setEditedSettings(prev => ({ ...prev, site_title: e.target.value }))}
                    placeholder="Your Website Title"
                    className="bg-slate-800/50 border-white/10 text-white"
                  />
                  <p className="text-xs text-slate-500">Max 60 characters recommended</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Twitter Handle</label>
                  <Input
                    value={editedSettings.twitter_handle || ''}
                    onChange={(e) => setEditedSettings(prev => ({ ...prev, twitter_handle: e.target.value }))}
                    placeholder="@yourhandle"
                    className="bg-slate-800/50 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Site Description</label>
                <Textarea
                  value={editedSettings.site_description || ''}
                  onChange={(e) => setEditedSettings(prev => ({ ...prev, site_description: e.target.value }))}
                  placeholder="A brief description of your website..."
                  rows={3}
                  className="bg-slate-800/50 border-white/10 text-white"
                />
                <p className="text-xs text-slate-500">Max 160 characters recommended</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Default OG Image URL</label>
                <Input
                  value={editedSettings.og_image_url || ''}
                  onChange={(e) => setEditedSettings(prev => ({ ...prev, og_image_url: e.target.value }))}
                  placeholder="https://your-site.com/og-image.png"
                  className="bg-slate-800/50 border-white/10 text-white"
                />
                <p className="text-xs text-slate-500">Recommended size: 1200x630 pixels</p>
              </div>

              <Button
                onClick={handleSaveSettings}
                disabled={mutating}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {mutating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Meta Tags
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* Google Indexing API */}
          <Card className="bg-slate-900/50 border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Google Indexing API</CardTitle>
                <Switch
                  checked={editedSettings.google_indexing_enabled || false}
                  onCheckedChange={(checked) => setEditedSettings(prev => ({ ...prev, google_indexing_enabled: checked }))}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-400">
                Submit URLs directly to Google for faster indexing. Requires a Google Cloud service account with Indexing API access.
              </p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Service Account Email</label>
                  <Input
                    value={editedSettings.google_service_account_email || ''}
                    onChange={(e) => setEditedSettings(prev => ({ ...prev, google_service_account_email: e.target.value }))}
                    placeholder="indexing@your-project.iam.gserviceaccount.com"
                    className="bg-slate-800/50 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Private Key (PEM format)</label>
                  <Textarea
                    value={editedSettings.google_service_account_key || ''}
                    onChange={(e) => setEditedSettings(prev => ({ ...prev, google_service_account_key: e.target.value }))}
                    placeholder="-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----"
                    rows={4}
                    className="bg-slate-800/50 border-white/10 text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="text-blue-400 font-medium mb-2">Setup Instructions</h4>
                <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
                  <li>Create a Google Cloud project and enable the Indexing API</li>
                  <li>Create a service account and download the JSON key</li>
                  <li>Add the service account email as an owner in Search Console</li>
                  <li>Paste the email and private key above</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* IndexNow */}
          <Card className="bg-slate-900/50 border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">IndexNow (Bing, Yandex, DuckDuckGo)</CardTitle>
                <Switch
                  checked={editedSettings.indexnow_enabled || false}
                  onCheckedChange={(checked) => setEditedSettings(prev => ({ ...prev, indexnow_enabled: checked }))}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-400">
                IndexNow instantly notifies search engines about URL changes. Supported by Bing, Yandex, DuckDuckGo, Naver, and Seznam.
              </p>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">API Key</label>
                <div className="flex gap-2">
                  <Input
                    value={editedSettings.indexnow_key || ''}
                    onChange={(e) => setEditedSettings(prev => ({ ...prev, indexnow_key: e.target.value }))}
                    placeholder="Your IndexNow API key"
                    className="bg-slate-800/50 border-white/10 text-white font-mono"
                    readOnly
                  />
                  <Button
                    variant="outline"
                    onClick={generateIndexNowKey}
                    className="border-white/10 text-white hover:bg-white/5"
                  >
                    Generate
                  </Button>
                  {editedSettings.indexnow_key && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(editedSettings.indexnow_key || '')}
                      className="text-slate-400 hover:text-white"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {editedSettings.indexnow_key && (
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-4">
                  <p className="text-sm text-slate-400 mb-2">Verification file URL:</p>
                  <code className="text-violet-400 text-sm break-all">
                    https://hero-mirror.lovable.app/{editedSettings.indexnow_key}.txt
                  </code>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            onClick={handleSaveSettings}
            disabled={mutating}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {mutating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save All Settings
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SEOManagement;
