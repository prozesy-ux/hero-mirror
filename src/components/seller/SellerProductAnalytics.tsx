import { useState, useEffect } from 'react';
import { BarChart3, Eye, MousePointer, ShoppingCart, TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSellerContext } from '@/contexts/SellerContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

interface ProductAnalytic {
  product_id: string;
  date: string;
  views: number;
  clicks: number;
  purchases: number;
  revenue: number;
}

interface ProductWithAnalytics {
  id: string;
  name: string;
  icon_url: string | null;
  totalViews: number;
  totalClicks: number;
  totalPurchases: number;
  totalRevenue: number;
  conversionRate: number;
}

const SellerProductAnalytics = () => {
  const { products } = useSellerContext();
  const [analytics, setAnalytics] = useState<ProductAnalytic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const productIds = products.map(p => p.id);
      if (productIds.length === 0) {
        setLoading(false);
        return;
      }

      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('product_analytics')
        .select('*')
        .in('product_id', productIds)
        .gte('date', thirtyDaysAgo)
        .order('date', { ascending: true });

      if (!error && data) {
        setAnalytics(data);
      }
      setLoading(false);
    };

    fetchAnalytics();
  }, [products]);

  // Aggregate analytics per product
  const productAnalytics: ProductWithAnalytics[] = products.map(product => {
    const productData = analytics.filter(a => a.product_id === product.id);
    const totalViews = productData.reduce((sum, a) => sum + a.views, 0);
    const totalClicks = productData.reduce((sum, a) => sum + a.clicks, 0);
    const totalPurchases = productData.reduce((sum, a) => sum + a.purchases, 0);
    const totalRevenue = productData.reduce((sum, a) => sum + a.revenue, 0);
    const conversionRate = totalViews > 0 ? (totalPurchases / totalViews) * 100 : 0;

    return {
      id: product.id,
      name: product.name,
      icon_url: product.icon_url,
      totalViews,
      totalClicks,
      totalPurchases,
      totalRevenue,
      conversionRate,
    };
  }).sort((a, b) => b.totalViews - a.totalViews);

  // Get chart data for selected product
  const getChartData = () => {
    const productId = selectedProduct || products[0]?.id;
    if (!productId) return [];

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
      const dayData = analytics.find(a => a.product_id === productId && a.date === date);
      return {
        date: format(subDays(new Date(), 6 - i), 'MMM dd'),
        views: dayData?.views || 0,
        purchases: dayData?.purchases || 0,
      };
    });

    return last7Days;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-black">
        <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No products to analyze</p>
        <p className="text-xs text-slate-400">Add products to see analytics</p>
      </div>
    );
  }

  const totals = productAnalytics.reduce((acc, p) => ({
    views: acc.views + p.totalViews,
    clicks: acc.clicks + p.totalClicks,
    purchases: acc.purchases + p.totalPurchases,
    revenue: acc.revenue + p.totalRevenue,
  }), { views: 0, clicks: 0, purchases: 0, revenue: 0 });

  return (
    <div className="space-y-6">

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded p-8">
          <div className="flex items-center gap-2 text-base mb-2">
            <span className="text-slate-700">Total Views</span>
          </div>
          <div className="text-4xl font-semibold text-slate-900">{totals.views.toLocaleString()}</div>
        </div>
        <div className="bg-white border rounded p-8">
          <div className="flex items-center gap-2 text-base mb-2">
            <span className="text-slate-700">Total Clicks</span>
          </div>
          <div className="text-4xl font-semibold text-slate-900">{totals.clicks.toLocaleString()}</div>
        </div>
        <div className="bg-white border rounded p-8">
          <div className="flex items-center gap-2 text-base mb-2">
            <span className="text-slate-700">Total Purchases</span>
          </div>
          <div className="text-4xl font-semibold text-slate-900">{totals.purchases.toLocaleString()}</div>
        </div>
        <div className="bg-white border rounded p-8">
          <div className="flex items-center gap-2 text-base mb-2">
            <span className="text-slate-700">Conversion Rate</span>
          </div>
          <div className="text-4xl font-semibold text-slate-900">
            {totals.views > 0 ? ((totals.purchases / totals.views) * 100).toFixed(1) : '0'}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg p-6 border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Views & Purchases (Last 7 Days)</h3>
          <select
            value={selectedProduct || products[0]?.id}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5"
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={getChartData()}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="views" 
                stroke="#3B82F6" 
                fillOpacity={1} 
                fill="url(#colorViews)" 
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="purchases" 
                stroke="#10B981" 
                fillOpacity={1} 
                fill="url(#colorPurchases)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product Performance Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Product Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Product</th>
                <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Views</th>
                <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Clicks</th>
                <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Purchases</th>
                <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Revenue</th>
                <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Conv. Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productAnalytics.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.icon_url ? (
                        <img src={product.icon_url} alt="" className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
                          <BarChart3 className="h-4 w-4 text-slate-400" />
                        </div>
                      )}
                      <span className="font-medium text-sm text-slate-900 line-clamp-1">{product.name}</span>
                    </div>
                  </td>
                  <td className="text-right px-4 py-3 text-sm text-slate-600">{product.totalViews}</td>
                  <td className="text-right px-4 py-3 text-sm text-slate-600">{product.totalClicks}</td>
                  <td className="text-right px-4 py-3 text-sm text-slate-600">{product.totalPurchases}</td>
                  <td className="text-right px-4 py-3 text-sm font-medium text-emerald-600">${product.totalRevenue.toFixed(2)}</td>
                  <td className="text-right px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      product.conversionRate > 5 ? 'bg-emerald-100 text-emerald-700' :
                      product.conversionRate > 2 ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {product.conversionRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SellerProductAnalytics;
