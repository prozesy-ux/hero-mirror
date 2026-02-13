import { useState, useEffect } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
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
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'medium' });

  const fetchRequests = async () => {
    if (!profile?.id) return;
    const { data, error } = await supabase
      .from('seller_feature_requests')
      .select('*')
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false });
    if (!error) setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
    const channel = supabase
      .channel('my-feature-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seller_feature_requests', filter: `seller_id=eq.${profile?.id}` }, () => fetchRequests())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    if (!formData.title.trim()) { toast.error('Title is required'); return; }
    if (!formData.description.trim()) { toast.error('Description is required'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('seller_feature_requests').insert({
        seller_id: profile.id, title: formData.title.trim(), description: formData.description.trim(), priority: formData.priority
      });
      if (error) throw error;
      toast.success('Feature request submitted!');
      setFormData({ title: '', description: '', priority: 'medium' });
      fetchRequests();
    } catch (error: any) { toast.error(error.message || 'Failed to submit request'); }
    finally { setSubmitting(false); }
  };

  const filteredRequests = requests.filter(r => activeTab === 'all' || r.status === activeTab);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-3.5 w-3.5" />;
      case 'reviewing': return <Eye className="h-3.5 w-3.5" />;
      case 'approved': case 'completed': return <CheckCircle2 className="h-3.5 w-3.5" />;
      case 'rejected': return <XCircle className="h-3.5 w-3.5" />;
      default: return <Clock className="h-3.5 w-3.5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'reviewing': return 'bg-blue-100 text-blue-700';
      case 'approved': return 'bg-emerald-100 text-emerald-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-[#6B7280]';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-[#6B7280]';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'high': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-[#6B7280]';
    }
  };

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'reviewing', label: 'Reviewing' },
    { id: 'completed', label: 'Completed' }
  ];

  return (
    <div className="bg-[#FCFCFC] min-h-screen p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1F2937]">Feature Requests</h2>
        <p className="text-sm text-[#6B7280]">Submit ideas and track their status</p>
      </div>

      <div className="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-6">
        {/* Submit Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Lightbulb className="h-5 w-5 text-[#FF7F00]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1F2937]">New Request</h3>
                <p className="text-xs text-[#6B7280]">Share your idea</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Feature title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="border-gray-200 rounded-xl"
              />
              <Textarea
                placeholder="Describe your feature idea in detail..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="border-gray-200 rounded-xl resize-none"
              />
              <div>
                <p className="text-xs text-[#6B7280] mb-2">Priority</p>
                <div className="flex gap-2">
                  {['low', 'medium', 'high'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, priority: p }))}
                      className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors border ${
                        formData.priority === p
                          ? p === 'low' ? 'bg-gray-100 text-[#6B7280] border-gray-300'
                          : p === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-300'
                          : 'bg-red-100 text-red-700 border-red-300'
                          : 'bg-white text-[#6B7280] border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full bg-[#FF7F00] hover:bg-[#e67200] text-white rounded-xl" disabled={submitting}>
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : <><Send className="mr-2 h-4 w-4" />Submit Request</>}
              </Button>
            </form>
          </div>
        </div>

        {/* Requests List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5 border-b border-gray-100 pb-4 overflow-x-auto hide-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-[#FF7F00]/10 text-[#FF7F00]'
                      : 'text-[#6B7280] hover:text-[#1F2937] hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                  {tab.id !== 'all' && (
                    <span className="ml-1 text-xs">({requests.filter(r => r.status === tab.id).length})</span>
                  )}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#FF7F00]" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <Lightbulb className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No requests yet</p>
                <p className="text-xs text-gray-400 mt-1">Submit your first feature request!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge className={`${getPriorityColor(request.priority)} text-xs px-2 py-0.5 rounded-full border-0`}>
                            {request.priority}
                          </Badge>
                          <h4 className="font-semibold text-[#1F2937] truncate">{request.title}</h4>
                        </div>
                        <p className="text-sm text-[#6B7280] line-clamp-2">{request.description}</p>
                      </div>
                      <Badge className={`${getStatusColor(request.status)} flex items-center gap-1 text-xs px-2 py-1 shrink-0 rounded-full border-0`}>
                        {getStatusIcon(request.status)}
                        {request.status}
                      </Badge>
                    </div>
                    {request.admin_notes && (
                      <div className="mt-3 p-3 rounded-xl bg-white border border-gray-200">
                        <p className="text-xs text-[#6B7280] mb-1">Admin Response</p>
                        <p className="text-sm text-[#1F2937]">{request.admin_notes}</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-3">
                      {new Date(request.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerFeatureRequests;
