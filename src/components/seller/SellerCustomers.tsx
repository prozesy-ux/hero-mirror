import { useState, useMemo } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Users, Crown, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CustomerData {
  buyer_id: string;
  email: string;
  full_name: string | null;
  total_orders: number;
  total_spent: number;
  first_order: string;
  last_order: string;
}

const SellerCustomers = () => {
  const { orders, loading: contextLoading } = useSellerContext();
  const { formatAmountOnly } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');

  // Build customer data directly from BFF-provided orders
  const customers = useMemo<CustomerData[]>(() => {
    if (!orders.length) return [];

    const buyerMap = new Map<string, CustomerData>();

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
          buyer_id: order.buyer_id,
          email: (order as any).buyer?.email || 'Unknown',
          full_name: (order as any).buyer?.full_name || null,
          total_orders: 1,
          total_spent: order.amount,
          first_order: order.created_at,
          last_order: order.created_at,
        });
      }
    });

    return Array.from(buyerMap.values()).sort((a, b) => b.total_spent - a.total_spent);
  }, [orders]);

  // Stats
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

  // Segments for pie chart
  const segmentData = useMemo(() => {
    return [
      { name: 'New (1 order)', value: customers.filter(c => c.total_orders === 1).length, color: '#3B82F6' },
      { name: 'Returning (2-5)', value: customers.filter(c => c.total_orders >= 2 && c.total_orders <= 5).length, color: '#10B981' },
      { name: 'Loyal (5+)', value: customers.filter(c => c.total_orders > 5).length, color: '#F97316' },
    ].filter(s => s.value > 0);
  }, [customers]);

  // Filter
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return customers.filter(c =>
      c.email.toLowerCase().includes(q) || c.full_name?.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const exportCustomers = () => {
    const csv = [
      ['Email', 'Name', 'Total Orders', 'Total Spent', 'First Order', 'Last Order'].join(','),
      ...filteredCustomers.map(c => [
        c.email,
        `"${c.full_name || ''}"`,
        c.total_orders,
        formatAmountOnly(c.total_spent),
        new Date(c.first_order).toLocaleDateString(),
        new Date(c.last_order).toLocaleDateString(),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (contextLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded border" />
          ))}
        </div>
        <Skeleton className="h-96 rounded border" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
        <Button size="sm" onClick={exportCustomers} className="bg-emerald-500 hover:bg-emerald-600 rounded-xl">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded p-8">
          <div className="text-base text-slate-700 mb-2">Total Customers</div>
          <div className="text-4xl font-semibold text-slate-900">{stats.totalCustomers}</div>
        </div>
        <div className="bg-white border rounded p-8">
          <div className="text-base text-slate-700 mb-2">Repeat Customers</div>
          <div className="text-4xl font-semibold text-emerald-600">{stats.repeatCustomers}</div>
        </div>
        <div className="bg-white border rounded p-8">
          <div className="text-base text-slate-700 mb-2">Retention Rate</div>
          <div className="text-4xl font-semibold text-orange-600">{stats.retentionRate}%</div>
        </div>
        <div className="bg-white border rounded p-8">
          <div className="text-base text-slate-700 mb-2">Avg Order Value</div>
          <div className="text-4xl font-semibold text-violet-600">{formatAmountOnly(stats.avgOrderValue)}</div>
        </div>
      </div>

      {/* Top Spender & Segments */}
      <div className="grid lg:grid-cols-2 gap-6">
        {stats.topSpender && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border rounded p-6">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-slate-800">Top Customer</h3>
            </div>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-black">
                <AvatarFallback className="bg-amber-200 text-amber-800 text-xl font-bold">
                  {stats.topSpender.full_name?.charAt(0) || stats.topSpender.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-slate-800">{stats.topSpender.full_name || 'Anonymous'}</p>
                <p className="text-sm text-slate-500">{stats.topSpender.email}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm"><strong>{formatAmountOnly(stats.topSpender.total_spent)}</strong> spent</span>
                  <span className="text-sm"><strong>{stats.topSpender.total_orders}</strong> orders</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border rounded p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Customer Segments</h3>
          {segmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={segmentData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
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
      <div className="bg-white border rounded overflow-hidden">
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
                  {customers.length === 0 ? 'No customers yet' : 'No customers found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.buyer_id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
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
                  <TableCell className="text-right font-semibold text-emerald-600">{formatAmountOnly(customer.total_spent)}</TableCell>
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
