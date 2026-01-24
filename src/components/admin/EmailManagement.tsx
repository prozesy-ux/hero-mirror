import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Mail, 
  Send, 
  RefreshCw, 
  Smartphone, 
  Monitor, 
  Copy, 
  Check,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  FileText,
  History,
  TestTube,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import {
  emailTemplates,
  getTemplateById,
  getTemplatesByCategory,
  getCategoryColor,
  getCategoryIcon,
  type EmailTemplate
} from '@/lib/email-templates';

const ADMIN_SESSION_KEY = 'admin_session_token';

interface EmailLog {
  id: string;
  user_id: string | null;
  template_id: string;
  recipient_email: string;
  subject: string;
  status: string;
  resend_id: string | null;
  error_message: string | null;
  sent_at: string;
  delivered_at: string | null;
  opened_at: string | null;
}

interface EmailStats {
  total_sent: number;
  delivered: number;
  opened: number;
  failed: number;
}

const EmailManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(emailTemplates[0]);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Stats & logs
  const [stats, setStats] = useState<EmailStats>({ total_sent: 0, delivered: 0, opened: 0, failed: 0 });
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Test email
  const [testEmail, setTestEmail] = useState('');
  const [testTemplateId, setTestTemplateId] = useState(emailTemplates[0].id);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch email logs from database
      const { data: logsData, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const fetchedLogs = (logsData || []) as EmailLog[];
      setLogs(fetchedLogs);

      // Calculate stats
      const statsCalc: EmailStats = {
        total_sent: fetchedLogs.length,
        delivered: fetchedLogs.filter(l => l.status === 'delivered' || l.status === 'sent').length,
        opened: fetchedLogs.filter(l => l.opened_at).length,
        failed: fetchedLogs.filter(l => l.status === 'failed').length,
      };
      setStats(statsCalc);
    } catch (error) {
      console.error('Error loading email data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(selectedTemplate.html);
    setCopied(true);
    toast.success('HTML copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    setIsSendingTest(true);
    try {
      // This would call an edge function to send the test email
      toast.success(`Test email would be sent to ${testEmail}`);
      toast.info('Note: Full email sending requires Resend API integration');
    } catch (error) {
      toast.error('Failed to send test email');
    } finally {
      setIsSendingTest(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      sent: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: <Send className="h-3 w-3" /> },
      delivered: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: <CheckCircle className="h-3 w-3" /> },
      opened: { color: 'bg-violet-500/20 text-violet-400 border-violet-500/30', icon: <Eye className="h-3 w-3" /> },
      failed: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <XCircle className="h-3 w-3" /> },
      pending: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: <Clock className="h-3 w-3" /> },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.color} border flex items-center gap-1`}>
        {config.icon}
        {status}
      </Badge>
    );
  };

  // Filter templates
  const filteredTemplates = emailTemplates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'security', 'order', 'wallet', 'marketing'];

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Email Templates</h1>
            <p className="text-slate-400 text-sm">Professional email templates with Fiverr/Google style design</p>
          </div>
        </div>
        <Button
          onClick={loadData}
          disabled={isLoading}
          className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Sent */}
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-400 text-sm font-medium mb-1">Total Sent</p>
              <p className="text-3xl font-bold text-white">{stats.total_sent.toLocaleString()}</p>
              <p className="text-emerald-400/70 text-xs mt-1">All time</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Send className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Delivered */}
        <div className="bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-violet-400 text-sm font-medium mb-1">Delivered</p>
              <p className="text-3xl font-bold text-white">{stats.delivered.toLocaleString()}</p>
              <p className="text-violet-400/70 text-xs mt-1">
                {stats.total_sent > 0 ? ((stats.delivered / stats.total_sent) * 100).toFixed(1) : 0}% rate
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-violet-400" />
            </div>
          </div>
        </div>

        {/* Opened */}
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm font-medium mb-1">Opened</p>
              <p className="text-3xl font-bold text-white">{stats.opened.toLocaleString()}</p>
              <p className="text-blue-400/70 text-xs mt-1">
                {stats.delivered > 0 ? ((stats.opened / stats.delivered) * 100).toFixed(1) : 0}% open rate
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Eye className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Failed */}
        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-400 text-sm font-medium mb-1">Failed</p>
              <p className="text-3xl font-bold text-white">{stats.failed.toLocaleString()}</p>
              <p className="text-amber-400/70 text-xs mt-1">
                {stats.total_sent > 0 ? ((stats.failed / stats.total_sent) * 100).toFixed(1) : 0}% failure
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-900/50 border border-slate-800 p-1">
          <TabsTrigger value="templates" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400">
            <History className="h-4 w-4 mr-2" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="test" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400">
            <TestTube className="h-4 w-4 mr-2" />
            Test
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex gap-6">
            {/* Template List */}
            <div className="w-80 flex-shrink-0">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        categoryFilter === cat
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {cat === 'all' ? '📋 All' : `${getCategoryIcon(cat as EmailTemplate['category'])} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
                    </button>
                  ))}
                </div>

                {/* Template List */}
                <ScrollArea className="h-[500px] pr-2">
                  <div className="space-y-2">
                    {filteredTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          selectedTemplate.id === template.id
                            ? 'bg-violet-600/20 border border-violet-500/50'
                            : 'bg-slate-800/50 border border-transparent hover:bg-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{template.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{template.name}</p>
                            <p className="text-slate-500 text-xs truncate">{template.description}</p>
                          </div>
                        </div>
                        <Badge className={`${getCategoryColor(template.category)} mt-2 text-xs border`}>
                          {template.category}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="flex-1">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                {/* Preview Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedTemplate.icon}</span>
                    <div>
                      <h3 className="text-white font-medium">{selectedTemplate.name}</h3>
                      <p className="text-slate-500 text-sm">Subject: {selectedTemplate.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="flex bg-slate-800 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('desktop')}
                        className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-all ${
                          viewMode === 'desktop' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Monitor className="h-4 w-4" />
                        Desktop
                      </button>
                      <button
                        onClick={() => setViewMode('mobile')}
                        className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-all ${
                          viewMode === 'mobile' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Smartphone className="h-4 w-4" />
                        Mobile
                      </button>
                    </div>
                    {/* Copy Button */}
                    <Button
                      onClick={handleCopyHtml}
                      className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                    >
                      {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      {copied ? 'Copied!' : 'Copy HTML'}
                    </Button>
                  </div>
                </div>

                {/* Preview Frame */}
                <div className="p-6 bg-slate-950 flex justify-center">
                  <div
                    className={`bg-white rounded-lg shadow-2xl transition-all duration-300 ${
                      viewMode === 'desktop' ? 'w-full max-w-[600px]' : 'w-[375px]'
                    }`}
                    style={{ height: '600px' }}
                  >
                    <iframe
                      srcDoc={selectedTemplate.html}
                      className="w-full h-full rounded-lg"
                      title="Email Preview"
                    />
                  </div>
                </div>

                {/* Variables */}
                <div className="p-4 border-t border-slate-800">
                  <p className="text-slate-400 text-sm mb-2">Template Variables:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map((variable) => (
                      <code key={variable} className="px-2 py-1 bg-slate-800 text-violet-400 rounded text-xs">
                        {variable}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-white font-medium">Email Delivery Logs</h3>
              <p className="text-slate-500 text-sm">Recent email activity and delivery status</p>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Mail className="h-12 w-12 text-slate-700 mb-4" />
                <p className="text-slate-400">No email logs yet</p>
                <p className="text-slate-600 text-sm">Emails will appear here once sent</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <table className="w-full">
                  <thead className="bg-slate-800/50 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Template</th>
                      <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Recipient</th>
                      <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Subject</th>
                      <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Status</th>
                      <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Sent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {logs.map((log) => {
                      const template = getTemplateById(log.template_id);
                      return (
                        <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span>{template?.icon || '📧'}</span>
                              <span className="text-white text-sm">{template?.name || log.template_id}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-sm">{log.recipient_email}</td>
                          <td className="px-4 py-3 text-slate-400 text-sm max-w-[200px] truncate">{log.subject}</td>
                          <td className="px-4 py-3">{getStatusBadge(log.status)}</td>
                          <td className="px-4 py-3 text-slate-500 text-sm">{formatDate(log.sent_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ScrollArea>
            )}
          </div>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test">
          <div className="max-w-xl">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <TestTube className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Test Email</h3>
                  <p className="text-slate-500 text-sm">Send a test email to verify template rendering</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-sm mb-2 block">Template</label>
                  <select
                    value={testTemplateId}
                    onChange={(e) => setTestTemplateId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  >
                    {emailTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.icon} {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 text-sm mb-2 block">Recipient Email</label>
                  <Input
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-400 text-sm font-medium">Note about email sending</p>
                      <p className="text-amber-400/70 text-xs mt-1">
                        Authentication emails (password reset, verification) are handled by Lovable Cloud's built-in system at no cost.
                        For transactional emails (orders, wallet), Resend API integration would be required.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSendTest}
                  disabled={isSendingTest || !testEmail}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                >
                  {isSendingTest ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Test Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailManagement;
