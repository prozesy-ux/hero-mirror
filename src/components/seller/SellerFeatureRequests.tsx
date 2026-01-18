import { useState, useEffect } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Lightbulb, Send, Clock, CheckCircle2, XCircle, Eye, Loader2 } from 'lucide-react';

interface FeatureRequest {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const SellerFeatureRequests = () => {
  const { profile } = useSellerContext();
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium'
  });

  const fetchRequests = async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from('seller_feature_requests')
      .select('*')
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();

    // Realtime subscription
    const channel = supabase
      .channel('my-feature-requests')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'seller_feature_requests',
        filter: `seller_id=eq.${profile?.id}`
      }, () => fetchRequests())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('seller_feature_requests').insert({
        seller_id: profile.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority
      });

      if (error) throw error;

      toast.success('Feature request submitted!');
      setFormData({ title: '', description: '', priority: 'medium' });
      fetchRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (activeTab === 'all') return true;
    return r.status === activeTab;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-3.5 w-3.5" />;
      case 'reviewing': return <Eye className="h-3.5 w-3.5" />;
      case 'approved': return <CheckCircle2 className="h-3.5 w-3.5" />;
      case 'rejected': return <XCircle className="h-3.5 w-3.5" />;
      case 'completed': return <CheckCircle2 className="h-3.5 w-3.5" />;
      default: return <Clock className="h-3.5 w-3.5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'reviewing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-slate-100 text-slate-600';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'high': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'reviewing', label: 'Reviewing' },
    { id: 'completed', label: 'Completed' }
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Feature Requests</h1>
        <p className="text-slate-500 text-sm mt-1">
          Submit ideas and track your feature requests
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Submit Form */}
        <div className="lg:col-span-1">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Lightbulb className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">New Request</h3>
                  <p className="text-xs text-slate-500">Share your idea</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    placeholder="Feature title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="border-slate-200"
                  />
                </div>

                <div>
                  <Textarea
                    placeholder="Describe your feature idea in detail..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="border-slate-200 resize-none"
                  />
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-2">Priority</p>
                  <div className="flex gap-2">
                    {['low', 'medium', 'high'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, priority: p }))}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${
                          formData.priority === p
                            ? p === 'low' ? 'bg-slate-100 text-slate-700 border-slate-300'
                            : p === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-300'
                            : 'bg-red-100 text-red-700 border-red-300'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-emerald-500 hover:bg-emerald-600"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Request
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Requests List */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5">
              {/* Tabs */}
              <div className="flex items-center gap-2 mb-5 border-b border-slate-100 pb-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                    {tab.id !== 'all' && (
                      <span className="ml-1.5 text-xs">
                        ({requests.filter(r => r.status === tab.id).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Request Cards */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Lightbulb className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No requests yet</p>
                  <p className="text-slate-400 text-xs mt-1">Submit your first feature request!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Badge className={`${getPriorityColor(request.priority)} text-xs px-2 py-0.5`}>
                              {request.priority}
                            </Badge>
                            <h4 className="font-semibold text-slate-900 truncate">
                              {request.title}
                            </h4>
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {request.description}
                          </p>
                        </div>
                        <Badge className={`${getStatusColor(request.status)} flex items-center gap-1 text-xs px-2 py-1 shrink-0`}>
                          {getStatusIcon(request.status)}
                          {request.status}
                        </Badge>
                      </div>

                      {request.admin_notes && (
                        <div className="mt-3 p-3 rounded-lg bg-white border border-slate-200">
                          <p className="text-xs text-slate-500 mb-1">Admin Response</p>
                          <p className="text-sm text-slate-700">{request.admin_notes}</p>
                        </div>
                      )}

                      <p className="text-xs text-slate-400 mt-3">
                        {new Date(request.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SellerFeatureRequests;
