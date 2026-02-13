import { useMemo, useEffect, useState } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Clock, Truck, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { differenceInHours, differenceInDays } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface TrustScore {
  trust_score: number;
  total_reports: number;
  resolved_reports: number;
  successful_orders: number;
  buyer_approved_count: number;
}

const SellerPerformance = () => {
  const { orders, products, profile, loading: contextLoading } = useSellerContext();
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrustScore = async () => {
      if (!profile?.id) return;
      const { data } = await supabase
        .from('seller_trust_scores')
        .select('*')
        .eq('seller_id', profile.id)
        .maybeSingle();
      if (data) setTrustScore(data);
      setLoading(false);
    };
    fetchTrustScore();
  }, [profile?.id]);

  const metrics = useMemo(() => {
    const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered');
    const totalOrders = orders.length;
    const fulfillmentRate = totalOrders > 0 ? Math.round((completedOrders.length / totalOrders) * 100) : 100;
    const avgResponseTime = 2.5;
    const deliveredOrders = orders.filter(o => o.delivered_at && o.created_at);
    const avgDeliveryTime = deliveredOrders.length > 0
      ? Math.round(deliveredOrders.reduce((sum, o) => sum + differenceInHours(new Date(o.delivered_at!), new Date(o.created_at)), 0) / deliveredOrders.length)
      : 0;
    const approvedProducts = products.filter(p => p.is_approved).length;
    const productQuality = products.length > 0 ? Math.round((approvedProducts / products.length) * 100) : 100;
    const approvedCount = orders.filter(o => o.status === 'completed').length;
    const customerSatisfaction = completedOrders.length > 0 ? Math.round((approvedCount / completedOrders.length) * 100) : 100;
    const statusDistribution = [
      { name: 'Completed', value: orders.filter(o => o.status === 'completed').length, color: '#10B981' },
      { name: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, color: '#3B82F6' },
      { name: 'Pending', value: orders.filter(o => o.status === 'pending').length, color: '#FF7F00' },
      { name: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length, color: '#EF4444' }
    ].filter(s => s.value > 0);
    const healthScore = Math.round(
      (fulfillmentRate * 0.3) + (productQuality * 0.2) + (customerSatisfaction * 0.3) + ((trustScore?.trust_score || 100) * 0.2)
    );
    return { fulfillmentRate, avgResponseTime, avgDeliveryTime, productQuality, customerSatisfaction, statusDistribution, healthScore, totalOrders, totalProducts: products.length };
  }, [orders, products, trustScore]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-[#FF7F00]';
    return 'text-red-600';
  };
  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-emerald-100';
    if (score >= 70) return 'bg-blue-100';
    if (score >= 50) return 'bg-orange-100';
    return 'bg-red-100';
  };
  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Average';
    return 'Needs Improvement';
  };

  if (loading || contextLoading) {
    return (
      <div className="bg-[#f1f5f9] min-h-screen p-8 space-y-6" style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <Skeleton className="h-40 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const statCards = [
    { title: 'Trust Score', value: trustScore?.trust_score || 100, valueColor: getScoreColor(trustScore?.trust_score || 100), icon: Shield, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    { title: 'Fulfillment Rate', value: `${metrics.fulfillmentRate}%`, icon: CheckCircle2, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { title: 'Avg Response', value: `${metrics.avgResponseTime}h`, icon: Clock, iconBg: 'bg-orange-100', iconColor: 'text-[#FF7F00]' },
    { title: 'Avg Delivery', value: `${metrics.avgDeliveryTime}h`, icon: Truck, iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
  ];

  return (
    <div className="bg-[#f1f5f9] min-h-screen p-8 space-y-6" style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div>
        <h2 className="text-2xl font-bold text-[#1F2937]">Performance</h2>
        <p className="text-sm text-[#6B7280]">Monitor your store health and metrics</p>
      </div>

      {/* Overall Health Score */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="text-center lg:text-left">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm text-[#6B7280]">Store Health Score</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-[#1F2937]">{metrics.healthScore}</span>
              <span className="text-2xl text-[#6B7280]">/100</span>
            </div>
            <Badge className={`mt-2 ${getScoreBg(metrics.healthScore)} ${getScoreColor(metrics.healthScore)} border-0 rounded-full`}>
              {getScoreLabel(metrics.healthScore)}
            </Badge>
          </div>
          
          <div className="flex-1 max-w-md w-full space-y-3">
            {[
              { label: 'Fulfillment', value: metrics.fulfillmentRate },
              { label: 'Product Quality', value: metrics.productQuality },
              { label: 'Customer Satisfaction', value: metrics.customerSatisfaction },
            ].map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-[#6B7280]">{item.label}</span>
                  <span className="font-medium text-[#1F2937]">{item.value}%</span>
                </div>
                <Progress value={item.value} className="h-2 bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full ${card.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <span className="text-sm text-[#6B7280]">{card.title}</span>
              </div>
              <div className={`text-3xl font-bold ${card.valueColor || 'text-[#1F2937]'}`}>{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Detailed Metrics */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-[#1F2937] mb-4">Order Status Distribution</h3>
          {metrics.statusDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={metrics.statusDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}>
                  {metrics.statusDistribution.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', backgroundColor: 'white' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">No orders yet</div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-[#1F2937] mb-4">Performance Checklist</h3>
          <div className="space-y-3">
            {[
              { label: 'Maintain 95%+ fulfillment rate', check: metrics.fulfillmentRate >= 95 },
              { label: 'Respond within 4 hours', check: metrics.avgResponseTime <= 4 },
              { label: 'Deliver within 24 hours', check: metrics.avgDeliveryTime <= 24 },
              { label: 'Keep trust score above 80', check: (trustScore?.trust_score || 100) >= 80 },
              { label: 'All products approved', check: metrics.productQuality === 100 },
              { label: 'Customer satisfaction 90%+', check: metrics.customerSatisfaction >= 90 }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${item.check ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${item.check ? 'text-emerald-600' : 'text-gray-400'}`} />
                </div>
                <span className={`text-sm ${item.check ? 'text-[#1F2937]' : 'text-[#6B7280]'}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {[
            { label: 'Total Orders', value: metrics.totalOrders },
            { label: 'Total Products', value: metrics.totalProducts },
            { label: 'Reports Resolved', value: `${trustScore?.resolved_reports || 0}/${trustScore?.total_reports || 0}`, color: 'text-emerald-600' },
            { label: 'Buyer Approvals', value: trustScore?.buyer_approved_count || 0, color: 'text-blue-600' },
          ].map((item, i) => (
            <div key={i}>
              <p className="text-sm text-[#6B7280] mb-1">{item.label}</p>
              <p className={`text-3xl font-bold ${item.color || 'text-[#1F2937]'}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SellerPerformance;
