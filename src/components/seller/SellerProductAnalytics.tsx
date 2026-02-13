import { useState, useEffect } from 'react';
import { BarChart3, Eye, MousePointer, ShoppingCart, TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSellerContext } from '@/contexts/SellerContext';
import { useCurrency } from '@/contexts/CurrencyContext';
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
  const { formatAmountOnly } = useCurrency();
  const [analytics, setAnalytics] = useState<ProductAnalytic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const productIds = products.map(p => p.id);
      if (productIds.length === 0) { setLoading(false); return; }
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('product_analytics')
        .select('*')
        .in('product_id', productIds)
        .gte('date', thirtyDaysAgo)
        .order('date', { ascending: true });
      if (!error && data) setAnalytics(data);
      setLoading(false);
    };
    fetchAnalytics();
  }, [products]);

  const productAnalytics: ProductWithAnalytics[] = products.map(product => {
    const productData = analytics.filter(a => a.product_id === product.id);
    const totalViews = productData.reduce((sum, a) => sum + a.views, 0);
    const totalClicks = productData.reduce((sum, a) => sum + a.clicks, 0);
    const totalPurchases = productData.reduce((sum, a) => sum + a.purchases, 0);
    const totalRevenue = productData.reduce((sum, a) => sum + a.revenue, 0);
    return { id: product.id, name: product.name, icon_url: product.icon_url, totalViews, totalClicks, totalPurchases, totalRevenue, conversionRate: totalViews > 0 ? (totalPurchases / totalViews) * 100 : 0 };
  }).sort((a, b) => b.totalViews - a.totalViews);

  const getChartData = () => {
    const productId = selectedProduct || products[0]?.id;
    if (!productId) return [];
    return Array.from({ length: 7 }, (_, i) => {
      const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
      const dayData = analytics.find(a => a.product_id === productId && a.date === date);
      return { date: format(subDays(new Date(), 6 - i), 'MMM dd'), views: dayData?.views || 0, purchases: dayData?.purchases || 0 };
    });
  };

  if (loading) {
    return (
      <div className="bg-[#f1f5f9] min-h-screen p-8 flex items-center justify-center dashboard-inter">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF7F00]" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-[#f1f5f9] min-h-screen p-8 dashboard-inter">
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
          <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[#6B7280]">No products to analyze</p>
          <p className="text-xs text-gray-400">Add products to see analytics</p>
        </div>
      </div>
    );
  }

  const totals = productAnalytics.reduce((acc, p) => ({
    views: acc.views + p.totalViews, clicks: acc.clicks + p.totalClicks,
    purchases: acc.purchases + p.totalPurchases, revenue: acc.revenue + p.totalRevenue,
  }), { views: 0, clicks: 0, purchases: 0, revenue: 0 });

  const statCards = [
    { title: 'Total Views', value: totals.views.toLocaleString(), icon: Eye, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { title: 'Total Clicks', value: totals.clicks.toLocaleString(), icon: MousePointer, iconBg: 'bg-orange-100', iconColor: 'text-[#FF7F00]' },
    { title: 'Total Purchases', value: totals.purchases.toLocaleString(), icon: ShoppingCart, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    { title: 'Conversion Rate', value: `${totals.views > 0 ? ((totals.purchases / totals.views) * 100).toFixed(1) : '0'}%`, icon: TrendingUp, iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
  ];

  return (
    <div className="bg-[#f1f5f9] min-h-screen p-8 space-y-6 dashboard-inter">
      <div>
        <h2 className="text-2xl font-bold text-[#1F2937]">Product Analytics</h2>
        <p className="text-sm text-[#6B7280]">Track product views, clicks, and conversions</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <div className="text-3xl font-bold text-[#1F2937]">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#1F2937]">Views & Purchases (Last 7 Days)</h3>
          <select
            value={selectedProduct || products[0]?.id}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white text-[#1F2937]"
          >
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
                  <stop offset="5%" stopColor="#FF7F00" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#FF7F00" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} stroke="#6B7280" />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} stroke="#6B7280" />
              <Tooltip contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Area type="monotone" dataKey="views" stroke="#3B82F6" fillOpacity={1} fill="url(#colorViews)" strokeWidth={2} />
              <Area type="monotone" dataKey="purchases" stroke="#FF7F00" fillOpacity={1} fill="url(#colorPurchases)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product Performance Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-[#1F2937]">Product Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3">Product</th>
                <th className="text-right text-xs font-medium text-[#6B7280] px-4 py-3">Views</th>
                <th className="text-right text-xs font-medium text-[#6B7280] px-4 py-3">Clicks</th>
                <th className="text-right text-xs font-medium text-[#6B7280] px-4 py-3">Purchases</th>
                <th className="text-right text-xs font-medium text-[#6B7280] px-4 py-3">Revenue</th>
                <th className="text-right text-xs font-medium text-[#6B7280] px-4 py-3">Conv. Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productAnalytics.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.icon_url ? (
                        <img src={product.icon_url} alt="" className="w-8 h-8 rounded-xl object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
                          <BarChart3 className="h-4 w-4 text-[#FF7F00]" />
                        </div>
                      )}
                      <span className="font-medium text-sm text-[#1F2937] line-clamp-1">{product.name}</span>
                    </div>
                  </td>
                  <td className="text-right px-4 py-3 text-sm text-[#6B7280]">{product.totalViews}</td>
                  <td className="text-right px-4 py-3 text-sm text-[#6B7280]">{product.totalClicks}</td>
                  <td className="text-right px-4 py-3 text-sm text-[#6B7280]">{product.totalPurchases}</td>
                  <td className="text-right px-4 py-3 text-sm font-medium text-emerald-600">{formatAmountOnly(product.totalRevenue)}</td>
                  <td className="text-right px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      product.conversionRate > 5 ? 'bg-emerald-100 text-emerald-700' :
                      product.conversionRate > 2 ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-[#6B7280]'
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
