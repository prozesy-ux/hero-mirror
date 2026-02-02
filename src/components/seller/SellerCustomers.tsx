import { useState, useMemo, useEffect } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, TrendingUp, Star, Crown, RefreshCw, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CustomerData {
  buyer_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  total_orders: number;
  total_spent: number;
  first_order: string;
  last_order: string;
}

const SellerCustomers = () => {
  const { orders, profile, loading: contextLoading } = useSellerContext();
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch customer details
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!orders.length) {
        setLoading(false);
        return;
      }

      // Group orders by buyer
      const buyerMap = new Map<string, {
        total_orders: number;
        total_spent: number;
        first_order: string;
        last_order: string;
      }>();

      orders.forEach(order => {
        const existing = buyerMap.get(order.buyer_id);
        const orderDate = new Date(order.created_at);
        
        if (existing) {
          existing.total_orders += 1;
          existing.total_spent += order.amount;
          if (new Date(existing.first_order) > orderDate) existing.first_order = order.created_at;
          if (new Date(existing.last_order) < orderDate) existing.last_order = order.created_at;
        } else {
          buyerMap.set(order.buyer_id, {
            total_orders: 1,
            total_spent: order.amount,
            first_order: order.created_at,
            last_order: order.created_at
          });
        }
      });

      // Fetch profiles for buyers
      const buyerIds = Array.from(buyerMap.keys());
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, avatar_url')
        .in('user_id', buyerIds);

      const customerData: CustomerData[] = buyerIds.map(buyerId => {
        const stats = buyerMap.get(buyerId)!;
        const profile = profiles?.find(p => p.user_id === buyerId);
        
        return {
          buyer_id: buyerId,
          email: profile?.email || 'Unknown',
          full_name: profile?.full_name,
          avatar_url: profile?.avatar_url,
          ...stats
        };
      });

      // Sort by total spent
      customerData.sort((a, b) => b.total_spent - a.total_spent);
      setCustomers(customerData);
      setLoading(false);
    };

    fetchCustomers();
  }, [orders]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const repeatCustomers = customers.filter(c => c.total_orders > 1).length;
    const retentionRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;
    const avgOrderValue = orders.length > 0 
      ? orders.reduce((sum, o) => sum + o.amount, 0) / orders.length 
      : 0;
    const topSpender = customers[0];

    return { totalCustomers, repeatCustomers, retentionRate, avgOrderValue, topSpender };
  }, [customers, orders]);

  // Customer segments for pie chart
  const segmentData = useMemo(() => {
    const segments = {
      new: customers.filter(c => c.total_orders === 1).length,
      returning: customers.filter(c => c.total_orders >= 2 && c.total_orders <= 5).length,
      loyal: customers.filter(c => c.total_orders > 5).length
    };
    
    return [
      { name: 'New (1 order)', value: segments.new, color: '#3B82F6' },
      { name: 'Returning (2-5)', value: segments.returning, color: '#10B981' },
      { name: 'Loyal (5+)', value: segments.loyal, color: '#F97316' }
    ].filter(s => s.value > 0);
  }, [customers]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customers, searchQuery]);

  const exportCustomers = () => {
    const csv = [
      ['Email', 'Name', 'Total Orders', 'Total Spent', 'First Order', 'Last Order'].join(','),
      ...filteredCustomers.map(c => [
        c.email,
        `"${c.full_name || ''}"`,
        c.total_orders,
        c.total_spent,
        new Date(c.first_order).toLocaleDateString(),
        new Date(c.last_order).toLocaleDateString()
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading || contextLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl border-2 border-black" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl border-2 border-black" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={exportCustomers} className="bg-emerald-500 hover:bg-emerald-600 rounded-xl">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Customers</p>
              <p className="text-2xl font-bold text-slate-800">{stats.totalCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Repeat Customers</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.repeatCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Retention Rate</p>
              <p className="text-2xl font-bold text-orange-600">{stats.retentionRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-violet-100 flex items-center justify-center">
              <Star className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Avg Order Value</p>
              <p className="text-2xl font-bold text-violet-600">₹{stats.avgOrderValue.toFixed(0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Spender & Segments */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Spender Card */}
        {stats.topSpender && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-orange-100">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-slate-800">Top Customer</h3>
            </div>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-amber-200">
                <AvatarImage src={stats.topSpender.avatar_url || ''} />
                <AvatarFallback className="bg-amber-200 text-amber-800 text-xl font-bold">
                  {stats.topSpender.full_name?.charAt(0) || stats.topSpender.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-slate-800">{stats.topSpender.full_name || 'Anonymous'}</p>
                <p className="text-sm text-slate-500">{stats.topSpender.email}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm"><strong>₹{stats.topSpender.total_spent}</strong> spent</span>
                  <span className="text-sm"><strong>{stats.topSpender.total_orders}</strong> orders</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Segments */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Customer Segments</h3>
          {segmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={segmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {segmentData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-slate-400">
              No customer data yet
            </div>
          )}
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-slate-200"
            />
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold">Customer</TableHead>
              <TableHead className="font-semibold text-center">Orders</TableHead>
              <TableHead className="font-semibold text-right">Total Spent</TableHead>
              <TableHead className="font-semibold text-center">Type</TableHead>
              <TableHead className="font-semibold text-right">Last Order</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.buyer_id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={customer.avatar_url || ''} />
                        <AvatarFallback className="bg-slate-100 text-slate-600 text-sm">
                          {customer.full_name?.charAt(0) || customer.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-slate-800">{customer.full_name || 'Anonymous'}</p>
                        <p className="text-xs text-slate-500">{customer.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">{customer.total_orders}</TableCell>
                  <TableCell className="text-right font-semibold text-emerald-600">₹{customer.total_spent}</TableCell>
                  <TableCell className="text-center">
                    {customer.total_orders > 5 ? (
                      <Badge className="bg-orange-100 text-orange-700 border-0">Loyal</Badge>
                    ) : customer.total_orders > 1 ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0">Returning</Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-700 border-0">New</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm text-slate-500">
                    {new Date(customer.last_order).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SellerCustomers;
