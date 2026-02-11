import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign, ShoppingCart, Users, TrendingUp, TrendingDown } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
export interface DashboardStatData {
  totalSales: number;
  totalSalesChange: number;
  totalOrders: number;
  totalOrdersChange: number;
  totalVisitors: number;
  totalVisitorsChange: number;
  revenueChartData: { date: string; revenue: number; orders: number }[];
  monthlyTarget: number;
  monthlyProgress: number; // 0-100
  targetAmount: number;
  revenueAmount: number;
  topCategories: { name: string; value: number; color: string }[];
  totalCategorySales: string;
  activeUsers: number;
  activeUsersByCountry: { country: string; flag: string; percent: number }[];
  conversionFunnel: { label: string; value: string; percent: number }[];
  trafficSources: { name: string; percent: number; color: string }[];
  formatAmount: (v: number) => string;
}

// ── Stat Card ──────────────────────────────────────────────────────────────
const Dashboard_StatCard = ({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  change,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  change: number;
}) => {
  const isPositive = change >= 0;
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <span
          className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
          }`}
        >
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? '+' : ''}
          {change.toFixed(2)}%
        </span>
      </div>
      <p className="text-sm text-[#6B7280] mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#1F2937]">{value}</p>
      <p className="text-xs text-[#6B7280] mt-1">vs last week</p>
    </div>
  );
};

// ── Revenue Analytics Chart ────────────────────────────────────────────────
const Dashboard_RevenueChart = ({
  data,
}: {
  data: { date: string; revenue: number; orders: number }[];
}) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm col-span-2">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg font-semibold text-[#1F2937]">Revenue Analytics</h3>
        <p className="text-sm text-[#6B7280]">Revenue vs Orders comparison</p>
      </div>
      <div className="flex items-center gap-4 text-xs text-[#6B7280]">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded bg-[#FF7F00]" /> Revenue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded bg-[#FDBA74] border-dashed" style={{ borderBottom: '2px dashed #FDBA74', height: 0, width: 12 }} /> Orders
        </span>
      </div>
    </div>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              fontSize: 13,
              backgroundColor: 'white',
            }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#FF7F00"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: '#FF7F00' }}
          />
          <Line
            type="monotone"
            dataKey="orders"
            stroke="#FDBA74"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// ── Monthly Target Gauge ───────────────────────────────────────────────────
const Dashboard_MonthlyTarget = ({
  progress,
  change,
  targetAmount,
  revenueAmount,
  formatAmount,
}: {
  progress: number;
  change: number;
  targetAmount: number;
  revenueAmount: number;
  formatAmount: (v: number) => string;
}) => {
  const angle = (progress / 100) * 180;
  const rad = (angle * Math.PI) / 180;
  const r = 70;
  const cx = 90;
  const cy = 85;
  const x = cx + r * Math.cos(Math.PI - rad);
  const y = cy - r * Math.sin(Math.PI - rad);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-[#1F2937]">Monthly Target</h3>
        <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
          <TrendingUp className="w-3 h-3" />+{change.toFixed(2)}%
        </span>
      </div>
      <svg viewBox="0 0 180 110" className="w-44 h-28 mt-2">
        {/* Background arc */}
        <path
          d="M 20 85 A 70 70 0 0 1 160 85"
          fill="none"
          stroke="#F3F4F6"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d={`M 20 85 A 70 70 0 ${angle > 90 ? 1 : 0} 1 ${x} ${y}`}
          fill="none"
          stroke="#FF7F00"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <text x="90" y="78" textAnchor="middle" className="text-2xl font-bold" fill="#1F2937" fontSize="24">
          {progress}%
        </text>
      </svg>
      <p className="text-sm font-semibold text-green-600 mt-1">Great Progress!</p>
      <p className="text-xs text-[#6B7280]">You're on track to meet your target</p>
      <div className="w-full mt-4 bg-[#FF7F00]/10 rounded-xl p-3 flex justify-between text-xs">
        <div className="text-center">
          <p className="text-[#6B7280]">Target</p>
          <p className="font-bold text-[#1F2937]">{formatAmount(targetAmount)}</p>
        </div>
        <div className="w-px bg-[#FF7F00]/20" />
        <div className="text-center">
          <p className="text-[#6B7280]">Revenue</p>
          <p className="font-bold text-[#FF7F00]">{formatAmount(revenueAmount)}</p>
        </div>
      </div>
    </div>
  );
};

// ── Top Categories (Donut) ─────────────────────────────────────────────────
const Dashboard_TopCategories = ({
  categories,
  totalSales,
}: {
  categories: { name: string; value: number; color: string }[];
  totalSales: string;
}) => {
  const total = categories.reduce((s, c) => s + c.value, 0) || 1;
  let cumAngle = 0;

  const arcs = categories.map((cat) => {
    const angle = (cat.value / total) * 360;
    const startRad = ((cumAngle - 90) * Math.PI) / 180;
    const endRad = ((cumAngle + angle - 90) * Math.PI) / 180;
    const largeArc = angle > 180 ? 1 : 0;
    const r = 60;
    const cx = 80;
    const cy = 80;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    cumAngle += angle;
    return (
      <path
        key={cat.name}
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
        fill="none"
        stroke={cat.color}
        strokeWidth="20"
      />
    );
  });

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm row-span-2">
      <h3 className="text-lg font-semibold text-[#1F2937] mb-4">Top Categories</h3>
      <div className="flex justify-center mb-4">
        <svg viewBox="0 0 160 160" className="w-40 h-40">
          {arcs}
          <text x="80" y="74" textAnchor="middle" fill="#6B7280" fontSize="10">
            Total Sales
          </text>
          <text x="80" y="92" textAnchor="middle" fill="#1F2937" fontSize="16" fontWeight="bold">
            {totalSales}
          </text>
        </svg>
      </div>
      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="text-sm text-[#6B7280]">{cat.name}</span>
            </div>
            <span className="text-sm font-semibold text-[#1F2937]">
              {((cat.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Active Users ───────────────────────────────────────────────────────────
const Dashboard_ActiveUsers = ({
  total,
  countries,
}: {
  total: number;
  countries: { country: string; flag: string; percent: number }[];
}) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm">
    <h3 className="text-lg font-semibold text-[#1F2937] mb-1">Active Users</h3>
    <p className="text-3xl font-bold text-[#1F2937] mb-4">{total.toLocaleString()}</p>
    <div className="space-y-3">
      {countries.map((c) => (
        <div key={c.country}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#6B7280]">
              {c.flag} {c.country}
            </span>
            <span className="font-semibold text-[#1F2937]">{c.percent}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[#FF7F00]"
              style={{ width: `${c.percent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── Conversion Rate Funnel ─────────────────────────────────────────────────
const Dashboard_ConversionRate = ({
  funnel,
}: {
  funnel: { label: string; value: string; percent: number }[];
}) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm col-span-2">
    <h3 className="text-lg font-semibold text-[#1F2937] mb-1">Conversion Rate</h3>
    <p className="text-sm text-[#6B7280] mb-6">From product views to purchases</p>
    <div className="flex items-end gap-3 justify-between">
      {funnel.map((step) => (
        <div key={step.label} className="flex-1 flex flex-col items-center">
          <span className="text-sm font-bold text-[#1F2937] mb-1">{step.value}</span>
          <div className="w-full flex justify-center">
            <div
              className="rounded-lg w-full max-w-[56px]"
              style={{
                height: `${Math.max(step.percent * 1.6, 20)}px`,
                background: `linear-gradient(180deg, #FF7F00 0%, #FDBA74 100%)`,
                opacity: 0.3 + step.percent * 0.007,
              }}
            />
          </div>
          <span className="text-[10px] text-[#6B7280] mt-2 text-center leading-tight">
            {step.label}
          </span>
        </div>
      ))}
    </div>
  </div>
);

// ── Traffic Sources ────────────────────────────────────────────────────────
const Dashboard_TrafficSources = ({
  sources,
}: {
  sources: { name: string; percent: number; color: string }[];
}) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm">
    <h3 className="text-lg font-semibold text-[#1F2937] mb-4">Traffic Sources</h3>
    {/* Stacked bar */}
    <div className="flex h-3 rounded-full overflow-hidden mb-4">
      {sources.map((s) => (
        <div key={s.name} style={{ width: `${s.percent}%`, backgroundColor: s.color }} />
      ))}
    </div>
    <div className="space-y-2">
      {sources.map((s) => (
        <div key={s.name} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-[#6B7280]">{s.name}</span>
          </div>
          <span className="font-semibold text-[#1F2937]">{s.percent}%</span>
        </div>
      ))}
    </div>
  </div>
);

// ── Main Grid ──────────────────────────────────────────────────────────────
const EzMartDashboardGrid = ({ data }: { data: DashboardStatData }) => (
  <div
    className="grid gap-5"
    style={{
      gridTemplateColumns: 'repeat(4, 1fr)',
    }}
  >
    {/* Row 1: 3 stat cards + Top Categories (row-span-2) */}
    <Dashboard_StatCard
      icon={<DollarSign className="w-5 h-5" />}
      iconBg="bg-[#FF7F00]/10"
      iconColor="text-[#FF7F00]"
      label="Total Sales"
      value={data.formatAmount(data.totalSales)}
      change={data.totalSalesChange}
    />
    <Dashboard_StatCard
      icon={<ShoppingCart className="w-5 h-5" />}
      iconBg="bg-gray-100"
      iconColor="text-[#6B7280]"
      label="Total Orders"
      value={data.totalOrders.toLocaleString()}
      change={data.totalOrdersChange}
    />
    <Dashboard_StatCard
      icon={<Users className="w-5 h-5" />}
      iconBg="bg-gray-100"
      iconColor="text-[#6B7280]"
      label="Total Visitors"
      value={data.totalVisitors.toLocaleString()}
      change={data.totalVisitorsChange}
    />
    <Dashboard_TopCategories
      categories={data.topCategories}
      totalSales={data.totalCategorySales}
    />

    {/* Row 2: Revenue Chart (2 cols) + Monthly Target (1 col) */}
    <Dashboard_RevenueChart data={data.revenueChartData} />
    <Dashboard_MonthlyTarget
      progress={data.monthlyProgress}
      change={data.totalVisitorsChange}
      targetAmount={data.targetAmount}
      revenueAmount={data.revenueAmount}
      formatAmount={data.formatAmount}
    />

    {/* Row 3: Active Users (1 col) + Conversion Rate (2 cols) + Traffic Sources (1 col) */}
    <Dashboard_ActiveUsers total={data.activeUsers} countries={data.activeUsersByCountry} />
    <Dashboard_ConversionRate funnel={data.conversionFunnel} />
    <Dashboard_TrafficSources sources={data.trafficSources} />
  </div>
);

export default EzMartDashboardGrid;
