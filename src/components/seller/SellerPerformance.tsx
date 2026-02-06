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

  // Fetch trust score
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

  // Calculate performance metrics
  const metrics = useMemo(() => {
    const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered');
    const totalOrders = orders.length;
    
    // Fulfillment rate
    const fulfillmentRate = totalOrders > 0 
      ? Math.round((completedOrders.length / totalOrders) * 100)
      : 100;

    // Average response time (mock - would need chat data)
    const avgResponseTime = 2.5; // hours

    // Average delivery time
    const deliveredOrders = orders.filter(o => o.delivered_at && o.created_at);
    const avgDeliveryTime = deliveredOrders.length > 0
      ? Math.round(deliveredOrders.reduce((sum, o) => {
          return sum + differenceInHours(new Date(o.delivered_at!), new Date(o.created_at));
        }, 0) / deliveredOrders.length)
      : 0;

    // Product quality score (based on approval rate)
    const approvedProducts = products.filter(p => p.is_approved).length;
    const productQuality = products.length > 0 
      ? Math.round((approvedProducts / products.length) * 100)
      : 100;

    // Customer satisfaction (based on completed orders with buyer approval)
    const approvedCount = orders.filter(o => o.status === 'completed').length;
    const customerSatisfaction = completedOrders.length > 0
      ? Math.round((approvedCount / completedOrders.length) * 100)
      : 100;

    // Order status distribution
    const statusDistribution = [
      { name: 'Completed', value: orders.filter(o => o.status === 'completed').length, color: '#10B981' },
      { name: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, color: '#3B82F6' },
      { name: 'Pending', value: orders.filter(o => o.status === 'pending').length, color: '#F97316' },
      { name: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length, color: '#EF4444' }
    ].filter(s => s.value > 0);

    // Overall health score
    const healthScore = Math.round(
      (fulfillmentRate * 0.3) + 
      (productQuality * 0.2) + 
      (customerSatisfaction * 0.3) + 
      ((trustScore?.trust_score || 100) * 0.2)
    );

    return {
      fulfillmentRate,
      avgResponseTime,
      avgDeliveryTime,
      productQuality,
      customerSatisfaction,
      statusDistribution,
      healthScore,
      totalOrders,
      totalProducts: products.length
    };
  }, [orders, products, trustScore]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-orange-600';
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
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-lg border" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg border" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-lg border" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Overall Health Score */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="text-center lg:text-left">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-slate-300">Store Health Score</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-bold">{metrics.healthScore}</span>
              <span className="text-2xl text-slate-400">/100</span>
            </div>
            <Badge className={`mt-2 ${getScoreBg(metrics.healthScore)} ${getScoreColor(metrics.healthScore)} border-0`}>
              {getScoreLabel(metrics.healthScore)}
            </Badge>
          </div>
          
          <div className="flex-1 max-w-md w-full">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Fulfillment</span>
                <span className="font-medium">{metrics.fulfillmentRate}%</span>
              </div>
              <Progress value={metrics.fulfillmentRate} className="h-2 bg-slate-700" />
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Product Quality</span>
                <span className="font-medium">{metrics.productQuality}%</span>
              </div>
              <Progress value={metrics.productQuality} className="h-2 bg-slate-700" />
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Customer Satisfaction</span>
                <span className="font-medium">{metrics.customerSatisfaction}%</span>
              </div>
              <Progress value={metrics.customerSatisfaction} className="h-2 bg-slate-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid - Gumroad Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Trust Score */}
        <div className="bg-white border rounded p-8 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
          <div className="flex items-center gap-2 text-base mb-2">
            <span className="text-slate-700">Trust Score</span>
          </div>
          <div className={`text-4xl font-semibold ${getScoreColor(trustScore?.trust_score || 100)}`}>
            {trustScore?.trust_score || 100}
          </div>
        </div>

        {/* Fulfillment Rate */}
        <div className="bg-white border rounded p-8 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
          <div className="flex items-center gap-2 text-base mb-2">
            <span className="text-slate-700">Fulfillment Rate</span>
          </div>
          <div className="text-4xl font-semibold text-slate-900">{metrics.fulfillmentRate}%</div>
        </div>

        {/* Avg Response Time */}
        <div className="bg-white border rounded p-8 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
          <div className="flex items-center gap-2 text-base mb-2">
            <span className="text-slate-700">Avg Response</span>
          </div>
          <div className="text-4xl font-semibold text-slate-900">{metrics.avgResponseTime}h</div>
        </div>

        {/* Avg Delivery */}
        <div className="bg-white border rounded p-8 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
          <div className="flex items-center gap-2 text-base mb-2">
            <span className="text-slate-700">Avg Delivery</span>
          </div>
          <div className="text-4xl font-semibold text-slate-900">{metrics.avgDeliveryTime}h</div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Order Distribution */}
        <div className="bg-white rounded-lg p-8 border hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
          <h3 className="font-semibold text-slate-800 mb-4">Order Status Distribution</h3>
          {metrics.statusDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={metrics.statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {metrics.statusDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-400">
              No orders yet
            </div>
          )}
        </div>

        {/* Performance Checklist */}
        <div className="bg-white rounded-lg p-8 border hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
          <h3 className="font-semibold text-slate-800 mb-4">Performance Checklist</h3>
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
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  item.check ? 'bg-emerald-100' : 'bg-slate-100'
                }`}>
                  <CheckCircle2 className={`w-4 h-4 ${
                    item.check ? 'text-emerald-600' : 'text-slate-400'
                  }`} />
                </div>
                <span className={`text-sm ${item.check ? 'text-slate-800' : 'text-slate-500'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="bg-white rounded-lg p-8 border hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-sm text-slate-500 mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-slate-800">{metrics.totalOrders}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Total Products</p>
            <p className="text-3xl font-bold text-slate-800">{metrics.totalProducts}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Reports Resolved</p>
            <p className="text-3xl font-bold text-emerald-600">
              {trustScore?.resolved_reports || 0}/{trustScore?.total_reports || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Buyer Approvals</p>
            <p className="text-3xl font-bold text-blue-600">{trustScore?.buyer_approved_count || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerPerformance;
