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

  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const repeatCustomers = customers.filter(c => c.total_orders > 1).length;
    const retentionRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;
    const avgOrderValue = orders.length > 0 ? orders.reduce((sum, o) => sum + o.amount, 0) / orders.length : 0;
    const topSpender = customers[0];
    return { totalCustomers, repeatCustomers, retentionRate, avgOrderValue, topSpender };
  }, [customers, orders]);

  const segmentData = useMemo(() => {
    return [
      { name: 'New (1 order)', value: customers.filter(c => c.total_orders === 1).length, color: '#3B82F6' },
      { name: 'Returning (2-5)', value: customers.filter(c => c.total_orders >= 2 && c.total_orders <= 5).length, color: '#10B981' },
      { name: 'Loyal (5+)', value: customers.filter(c => c.total_orders > 5).length, color: '#FF7F00' },
    ].filter(s => s.value > 0);
  }, [customers]);

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
        c.email, `"${c.full_name || ''}"`, c.total_orders, formatAmountOnly(c.total_spent),
        new Date(c.first_order).toLocaleDateString(), new Date(c.last_order).toLocaleDateString(),
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
      <div className="bg-[#f1f5f9] min-h-screen p-8 space-y-6 dashboard-inter">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const statCards = [
    { title: 'Total Customers', value: stats.totalCustomers, icon: Users, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { title: 'Repeat Customers', value: stats.repeatCustomers, icon: Users, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', valueColor: 'text-emerald-600' },
    { title: 'Retention Rate', value: `${stats.retentionRate}%`, icon: Crown, iconBg: 'bg-orange-100', iconColor: 'text-[#FF7F00]', valueColor: 'text-[#FF7F00]' },
    { title: 'Avg Order Value', value: formatAmountOnly(stats.avgOrderValue), icon: Users, iconBg: 'bg-violet-100', iconColor: 'text-violet-600', valueColor: 'text-violet-600' },
  ];

  return (
    <div className="bg-[#f1f5f9] min-h-screen p-8 space-y-6 dashboard-inter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1F2937]">Customers</h2>
          <p className="text-sm text-[#6B7280]">View and manage your customer base</p>
        </div>
        <Button size="sm" onClick={exportCustomers} className="bg-[#FF7F00] hover:bg-[#e67200] text-white rounded-xl">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats Cards */}
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

      {/* Top Spender & Segments */}
      <div className="grid lg:grid-cols-2 gap-6">
        {stats.topSpender && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-[#1F2937]">Top Customer</h3>
            </div>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-[#FF7F00]">
                <AvatarFallback className="bg-orange-100 text-[#FF7F00] text-xl font-bold">
                  {stats.topSpender.full_name?.charAt(0) || stats.topSpender.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-[#1F2937]">{stats.topSpender.full_name || 'Anonymous'}</p>
                <p className="text-sm text-[#6B7280]">{stats.topSpender.email}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm"><strong>{formatAmountOnly(stats.topSpender.total_spent)}</strong> spent</span>
                  <span className="text-sm"><strong>{stats.topSpender.total_orders}</strong> orders</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-[#1F2937] mb-4">Customer Segments</h3>
          {segmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={segmentData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                  {segmentData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', backgroundColor: 'white' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">No customer data yet</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-200 rounded-xl"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-[#6B7280]">Customer</TableHead>
              <TableHead className="font-semibold text-center text-[#6B7280]">Orders</TableHead>
              <TableHead className="font-semibold text-right text-[#6B7280]">Total Spent</TableHead>
              <TableHead className="font-semibold text-center text-[#6B7280]">Type</TableHead>
              <TableHead className="font-semibold text-right text-[#6B7280]">Last Order</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-400">{customers.length === 0 ? 'No customers yet' : 'No customers found'}</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.buyer_id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-orange-100 text-[#FF7F00] text-sm">
                          {customer.full_name?.charAt(0) || customer.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-[#1F2937]">{customer.full_name || 'Anonymous'}</p>
                        <p className="text-xs text-[#6B7280]">{customer.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">{customer.total_orders}</TableCell>
                  <TableCell className="text-right font-semibold text-emerald-600">{formatAmountOnly(customer.total_spent)}</TableCell>
                  <TableCell className="text-center">
                    {customer.total_orders > 5 ? (
                      <Badge className="bg-orange-100 text-[#FF7F00] border-0 rounded-full">Loyal</Badge>
                    ) : customer.total_orders > 1 ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 rounded-full">Returning</Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-700 border-0 rounded-full">New</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm text-[#6B7280]">
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
