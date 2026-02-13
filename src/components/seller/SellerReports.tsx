import { useState, useMemo } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { FileText, Download, Calendar, TrendingUp, Package, ShoppingCart, DollarSign, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

type ReportType = 'sales' | 'orders' | 'products' | 'customers';

interface ReportConfig {
  type: ReportType;
  title: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

const reportConfigs: ReportConfig[] = [
  {
    type: 'sales',
    title: 'Sales Report',
    description: 'Revenue breakdown, earnings, and trends',
    icon: DollarSign,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600'
  },
  {
    type: 'orders',
    title: 'Orders Report',
    description: 'Order history, status, and fulfillment',
    icon: ShoppingCart,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600'
  },
  {
    type: 'products',
    title: 'Products Report',
    description: 'Product performance and inventory',
    icon: Package,
    iconBg: 'bg-orange-100',
    iconColor: 'text-[#FF7F00]'
  },
  {
    type: 'customers',
    title: 'Customers Report',
    description: 'Customer insights and behavior',
    icon: Users,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600'
  }
];

const SellerReports = () => {
  const { orders, products, loading } = useSellerContext();
  const { formatAmountOnly } = useCurrency();
  const [selectedReport, setSelectedReport] = useState<ReportType>('sales');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [period, setPeriod] = useState('30d');
  const [generating, setGenerating] = useState(false);

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    const now = new Date();
    switch (value) {
      case '7d': setDateRange({ from: subDays(now, 7), to: now }); break;
      case '30d': setDateRange({ from: subDays(now, 30), to: now }); break;
      case '90d': setDateRange({ from: subDays(now, 90), to: now }); break;
      case 'thisMonth': setDateRange({ from: startOfMonth(now), to: endOfMonth(now) }); break;
      case 'thisWeek': setDateRange({ from: startOfWeek(now), to: endOfWeek(now) }); break;
    }
  };

  const filteredOrders = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return orders;
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= dateRange.from! && orderDate <= dateRange.to!;
    });
  }, [orders, dateRange]);

  const generateReportData = (type: ReportType) => {
    switch (type) {
      case 'sales':
        return {
          headers: ['Date', 'Order ID', 'Product', 'Amount', 'Earnings', 'Status'],
          rows: filteredOrders.map(o => [
            format(new Date(o.created_at), 'yyyy-MM-dd'),
            o.id.slice(0, 8),
            o.product?.name || 'Unknown',
            o.amount.toString(),
            o.seller_earning.toString(),
            o.status
          ]),
          summary: {
            'Total Revenue': formatAmountOnly(filteredOrders.reduce((sum, o) => sum + o.amount, 0)),
            'Total Earnings': formatAmountOnly(filteredOrders.reduce((sum, o) => sum + o.seller_earning, 0)),
            'Total Orders': filteredOrders.length.toString(),
            'Avg Order Value': formatAmountOnly(filteredOrders.length > 0 ? filteredOrders.reduce((sum, o) => sum + o.amount, 0) / filteredOrders.length : 0)
          }
        };
      case 'orders':
        return {
          headers: ['Order ID', 'Date', 'Product', 'Customer', 'Amount', 'Status', 'Delivered'],
          rows: filteredOrders.map(o => [
            o.id.slice(0, 8),
            format(new Date(o.created_at), 'yyyy-MM-dd HH:mm'),
            o.product?.name || 'Unknown',
            o.buyer?.email || 'Unknown',
            o.amount.toString(),
            o.status,
            o.delivered_at ? format(new Date(o.delivered_at), 'yyyy-MM-dd') : '-'
          ]),
          summary: {
            'Total Orders': filteredOrders.length.toString(),
            'Pending': filteredOrders.filter(o => o.status === 'pending').length.toString(),
            'Delivered': filteredOrders.filter(o => o.status === 'delivered').length.toString(),
            'Completed': filteredOrders.filter(o => o.status === 'completed').length.toString()
          }
        };
      case 'products':
        return {
          headers: ['Product Name', 'Price', 'Stock', 'Sold', 'Revenue', 'Status'],
          rows: products.map(p => {
            const productOrders = filteredOrders.filter(o => o.product_id === p.id);
            const revenue = productOrders.reduce((sum, o) => sum + o.amount, 0);
            return [p.name, p.price.toString(), (p.stock ?? 0).toString(), p.sold_count.toString(), revenue.toString(), p.is_available ? 'Active' : 'Inactive'];
          }),
          summary: {
            'Total Products': products.length.toString(),
            'Active': products.filter(p => p.is_available).length.toString(),
            'Out of Stock': products.filter(p => (p.stock ?? 0) === 0).length.toString(),
            'Total Revenue': formatAmountOnly(filteredOrders.reduce((sum, o) => sum + o.amount, 0))
          }
        };
      case 'customers':
        const customerMap = new Map<string, { orders: number; spent: number; email: string }>();
        filteredOrders.forEach(o => {
          const existing = customerMap.get(o.buyer_id);
          if (existing) { existing.orders += 1; existing.spent += o.amount; }
          else { customerMap.set(o.buyer_id, { orders: 1, spent: o.amount, email: o.buyer?.email || 'Unknown' }); }
        });
        return {
          headers: ['Customer Email', 'Total Orders', 'Total Spent', 'Avg Order Value'],
          rows: Array.from(customerMap.entries()).map(([id, data]) => [
            data.email, data.orders.toString(), data.spent.toString(), Math.round(data.spent / data.orders).toString()
          ]).sort((a, b) => parseInt(b[2]) - parseInt(a[2])),
          summary: {
            'Total Customers': customerMap.size.toString(),
            'Repeat Customers': Array.from(customerMap.values()).filter(c => c.orders > 1).length.toString(),
            'Total Revenue': formatAmountOnly(filteredOrders.reduce((sum, o) => sum + o.amount, 0)),
            'Avg Customer Value': formatAmountOnly(customerMap.size > 0 ? filteredOrders.reduce((sum, o) => sum + o.amount, 0) / customerMap.size : 0)
          }
        };
      default:
        return { headers: [], rows: [], summary: {} };
    }
  };

  const downloadReport = (type: ReportType) => {
    setGenerating(true);
    setTimeout(() => {
      const data = generateReportData(type);
      const config = reportConfigs.find(c => c.type === type)!;
      const summarySection = Object.entries(data.summary).map(([key, value]) => `${key},${value}`).join('\n');
      const csv = [
        `${config.title}`, `Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
        `Period: ${format(dateRange.from!, 'yyyy-MM-dd')} to ${format(dateRange.to!, 'yyyy-MM-dd')}`,
        '', 'SUMMARY', summarySection, '', 'DETAILS', data.headers.join(','),
        ...data.rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      toast.success(`${config.title} downloaded`);
      setGenerating(false);
    }, 500);
  };

  if (loading) {
    return (
      <div className="bg-[#FCFCFC] min-h-screen p-8 space-y-6">
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const currentReportData = generateReportData(selectedReport);
  const currentConfig = reportConfigs.find(c => c.type === selectedReport)!;

  return (
    <div className="bg-[#FCFCFC] min-h-screen p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1F2937]">Reports</h2>
          <p className="text-sm text-[#6B7280]">Generate and download business reports</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-white border-gray-200 rounded-xl">
                <Calendar className="w-4 h-4 mr-2 text-[#6B7280]" />
                <span className="text-sm text-[#1F2937]">
                  {dateRange.from && dateRange.to 
                    ? `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}`
                    : 'Select dates'
                  }
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="range"
                selected={dateRange}
                onSelect={(range) => range && setDateRange(range)}
                numberOfMonths={2}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[140px] bg-white border-gray-200 rounded-xl">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="thisWeek">This week</SelectItem>
              <SelectItem value="thisMonth">This month</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Report Type Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {reportConfigs.map((config) => {
          const Icon = config.icon;
          const isSelected = selectedReport === config.type;
          
          return (
            <button
              key={config.type}
              onClick={() => setSelectedReport(config.type)}
              className={`text-left bg-white rounded-2xl shadow-sm p-6 transition-all ${
                isSelected 
                  ? 'ring-2 ring-[#FF7F00] bg-[#FF7F00]/5' 
                  : 'hover:shadow-md'
              }`}
            >
              <div className={`w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${config.iconColor}`} />
              </div>
              <h3 className="text-sm font-semibold text-[#1F2937] mb-1">{config.title}</h3>
              <p className="text-xs text-[#6B7280]">{config.description}</p>
            </button>
          );
        })}
      </div>

      {/* Report Preview */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full ${currentConfig.iconBg} flex items-center justify-center`}>
              <currentConfig.icon className={`w-5 h-5 ${currentConfig.iconColor}`} />
            </div>
            <div>
              <h3 className="font-semibold text-[#1F2937]">{currentConfig.title}</h3>
              <p className="text-xs text-[#6B7280]">
                {filteredOrders.length} records • {format(dateRange.from!, 'MMM d')} - {format(dateRange.to!, 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <Button 
            onClick={() => downloadReport(selectedReport)}
            disabled={generating}
            className="bg-[#FF7F00] hover:bg-[#e67200] text-white rounded-xl"
          >
            <Download className="w-4 h-4 mr-2" />
            {generating ? 'Generating...' : 'Download CSV'}
          </Button>
        </div>

        {/* Summary */}
        <div className="p-6 bg-gray-50 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(currentReportData.summary).map(([key, value]) => (
            <div key={key} className="text-center">
              <p className="text-xs text-[#6B7280] mb-1">{key}</p>
              <p className="text-lg font-bold text-[#1F2937]">{value}</p>
            </div>
          ))}
        </div>

        {/* Preview Table */}
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {currentReportData.headers.map((header, i) => (
                  <th key={i} className="px-4 py-3 text-left font-semibold text-[#6B7280]">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentReportData.rows.slice(0, 10).map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3 text-[#6B7280]">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {currentReportData.rows.length > 10 && (
            <div className="p-4 text-center text-sm text-[#6B7280] bg-gray-50">
              Showing 10 of {currentReportData.rows.length} records. Download full report for all data.
            </div>
          )}
          {currentReportData.rows.length === 0 && (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No data for selected period</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerReports;
