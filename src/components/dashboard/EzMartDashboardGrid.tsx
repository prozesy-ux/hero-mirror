import { useState } from 'react';
import { MoreHorizontal, DollarSign, ShoppingCart, User, ChevronDown, Search, Package, Clock } from 'lucide-react';
import { format, subDays } from 'date-fns';

// ── Types ──────────────────────────────────────────────────────────────────
export interface ConversionItem {
  label: string;
  labelLine2: string;
  value: string;
  badge: string;
  isNegative?: boolean;
  barHeight: string;
  barColor: string;
}

export interface CountryItem {
  country: string;
  percent: number;
  barColor: string;
}

export interface CategoryItem {
  name: string;
  amount: string;
  color: string;
}

export interface TrafficItem {
  name: string;
  percent: number;
  color: string;
}

export interface DailyRevenueItem {
  date: string;
  revenue: number;
}

export interface RecentOrderItem {
  id: string;
  orderId: string;
  customerName: string;
  customerAvatar?: string;
  productName: string;
  productIcon?: string;
  qty: number;
  total: string;
  status: string;
}

export interface RecentActivityItem {
  id: string;
  icon: string;
  message: string;
  time: string;
  color?: string;
}

export interface DashboardStatData {
  totalSales: number;
  totalSalesChange: number;
  totalOrders: number;
  totalOrdersChange: number;
  totalVisitors: number;
  totalVisitorsChange: number;
  thirdCardLabel?: string;
  thirdCardValue?: string;
  thirdCardIcon?: 'dollar' | 'cart' | 'user';
  topCategories: CategoryItem[];
  totalCategorySales: string;
  activeUsers: number;
  activeUsersByCountry: CountryItem[];
  conversionFunnel: ConversionItem[];
  trafficSources: TrafficItem[];
  formatAmount: (v: number) => string;
  dailyRevenue?: DailyRevenueItem[];
  monthlyTarget?: number;
  monthlyRevenue?: number;
  monthlyTargetChange?: number;
  recentOrders?: RecentOrderItem[];
  recentActivity?: RecentActivityItem[];
}

// ── Stat Card (matches HTML exactly) ───────────────────────────────────────
const Dashboard_StatCard = ({
  label,
  value,
  change,
  iconType,
  isOrange,
}: {
  label: string;
  value: string;
  change: number;
  iconType: 'dollar' | 'cart' | 'user';
  isOrange?: boolean;
}) => {
  const isPositive = change >= 0;
  const Icon = iconType === 'dollar' ? DollarSign : iconType === 'cart' ? ShoppingCart : User;

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '16px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px',
      }}>
        <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>{label}</span>
        <div style={{
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          backgroundColor: isOrange ? '#fff7ed' : '#f3f4f6',
          color: isOrange ? '#ff7f00' : '#1f2937',
          border: isOrange ? '1px solid #ffedd5' : 'none',
        }}>
          <Icon style={{ width: 18, height: 18, color: isOrange ? '#ff7f00' : '#6b7280' }} />
        </div>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
        {value}
      </div>
      <div>
        <span style={{
          fontSize: '12px',
          fontWeight: 600,
          color: isPositive ? '#10b981' : '#ef4444',
        }}>
          {isPositive ? '+' : ''}{change.toFixed(2)}%
        </span>
        <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '4px', fontWeight: 400 }}>
          vs last week
        </span>
      </div>
    </div>
  );
};

// ── Top Categories (donut with circle stroke-dasharray) ────────────────────
const Dashboard_TopCategories = ({
  categories,
  totalSales,
}: {
  categories: CategoryItem[];
  totalSales: string;
}) => (
  <div style={{
    background: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    gridColumn: 'span 1',
    gridRow: 'span 2',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
      <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>Top Categories</div>
      <div style={{ fontSize: '12px', color: '#6b7280', cursor: 'pointer' }}>See All</div>
    </div>

    <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto 32px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="200" height="200" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        {(() => {
          const circumference = 2 * Math.PI * 40; // ~251.3
          const totalAmount = categories.reduce((sum, c) => sum + parseFloat(c.amount.replace(/[^0-9.-]/g, '') || '0'), 0) || 1;
          let offset = 0;
          return (
            <>
              <circle cx="50" cy="50" r="40" fill="none" stroke="#F3F4F6" strokeWidth="12" />
              {categories.map((cat, i) => {
                const proportion = parseFloat(cat.amount.replace(/[^0-9.-]/g, '') || '0') / totalAmount;
                const dashLength = proportion * circumference;
                const currentOffset = -offset;
                offset += dashLength;
                return (
                  <circle key={i} cx="50" cy="50" r="40" fill="none" stroke={cat.color} strokeWidth="12" strokeDasharray={`${dashLength} ${circumference}`} strokeDashoffset={currentOffset} />
                );
              })}
            </>
          );
        })()}
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Sales</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#1f2937' }}>{totalSales}</div>
      </div>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {categories.map((cat) => (
        <div key={cat.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: cat.color }} />
            {cat.name}
          </div>
          <div style={{ fontWeight: 600, color: '#1f2937' }}>{cat.amount}</div>
        </div>
      ))}
    </div>
  </div>
);

// ── Revenue Analytics (dynamic SVG chart using real data) ──────────────────
const FILTER_OPTIONS = [
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 14 Days', days: 14 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'All Time', days: 0 },
];

const Dashboard_RevenueChart = ({
  dailyRevenue,
  formatAmount,
}: {
  dailyRevenue: DailyRevenueItem[];
  formatAmount: (v: number) => string;
}) => {
  const [filterDays, setFilterDays] = useState(7);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedLabel = FILTER_OPTIONS.find(o => o.days === filterDays)?.label || `Last ${filterDays} Days`;

  // Filter data based on selected range, then take last 8 points for display
  const filteredData = filterDays === 0 ? dailyRevenue : dailyRevenue.slice(-filterDays);
  const chartData = filteredData.slice(-8);
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);
  
  // Generate SVG path from real data
  const width = 450;
  const height = 130;
  
  const points = chartData.map((d, i) => {
    const x = chartData.length > 1 ? (i / (chartData.length - 1)) * width : width / 2;
    const y = height - (d.revenue / maxRevenue) * (height - 10) - 5;
    return { x, y, ...d };
  });

  const pathD = points.length > 1
    ? points.reduce((acc, p, i) => {
        if (i === 0) return `M${p.x},${p.y}`;
        const prev = points[i - 1];
        const cpx1 = prev.x + (p.x - prev.x) * 0.4;
        const cpx2 = p.x - (p.x - prev.x) * 0.4;
        return `${acc} C${cpx1},${prev.y} ${cpx2},${p.y} ${p.x},${p.y}`;
      }, '')
    : `M${width / 2},${height / 2}`;

  const peakIdx = points.reduce((best, p, i) => p.revenue > points[best].revenue ? i : best, 0);
  const peak = points[peakIdx];

  const yLabels = [maxRevenue, maxRevenue * 0.75, maxRevenue * 0.5, maxRevenue * 0.25, 0];
  const formatYLabel = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toFixed(0);

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '16px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      gridColumn: 'span 2',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>Revenue Analytics</div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: '#ff7f00',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            {selectedLabel}
            <ChevronDown style={{ width: 14, height: 14, transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: '4px',
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '1px solid #e5e7eb',
              zIndex: 50,
              minWidth: '140px',
              overflow: 'hidden',
            }}>
              {FILTER_OPTIONS.map(opt => (
                <button
                  key={opt.days}
                  onClick={() => { setFilterDays(opt.days); setDropdownOpen(false); }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 14px',
                    fontSize: '12px',
                    textAlign: 'left',
                    border: 'none',
                    background: filterDays === opt.days ? '#fff7ed' : 'white',
                    color: filterDays === opt.days ? '#ff7f00' : '#374151',
                    fontWeight: filterDays === opt.days ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280' }}>
          <div style={{ width: '8px', height: '2px', backgroundColor: '#ff7f00', borderRadius: '2px' }} />
          Revenue
        </div>
      </div>

      <div style={{ position: 'relative', height: '160px', width: '100%' }}>
        {/* Y Axis */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: '30px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          fontSize: '10px', color: '#9ca3af',
        }}>
          {yLabels.map((v, i) => <span key={i}>{formatYLabel(v)}</span>)}
        </div>

        <div style={{ marginLeft: '30px', position: 'relative', height: '100%', borderBottom: '1px dashed #e5e7eb' }}>
          {[20, 40, 60, 80].map(pct => (
            <div key={pct} style={{ position: 'absolute', width: '100%', top: `${pct}%`, borderTop: '1px dashed #f3f4f6' }} />
          ))}

          <svg width="100%" height="130px" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            <path d={pathD} fill="none" stroke="#FF7F00" strokeWidth="2" />
            {peak && (
              <circle cx={peak.x} cy={peak.y} r="4" fill="#FFF" stroke="#FF7F00" strokeWidth="2" />
            )}
          </svg>

          {peak && chartData.length > 0 && (
            <div style={{
              position: 'absolute',
              left: `${(peakIdx / Math.max(chartData.length - 1, 1)) * 100}%`,
              top: '-10px',
              transform: 'translateX(-50%)',
              background: 'white', padding: '6px 10px', borderRadius: '6px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center',
              border: '1px solid #e5e7eb',
              whiteSpace: 'nowrap',
            }}>
              <div style={{ fontSize: '8px', color: '#9ca3af' }}>Revenue</div>
              <div style={{ fontSize: '12px', fontWeight: 700 }}>{formatAmount(peak.revenue)}</div>
            </div>
          )}

          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: '10px',
            fontSize: '10px', color: '#9ca3af',
          }}>
            {chartData.map(d => (
              <span key={d.date}>{d.date}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Monthly Target (gauge with SVG paths, using real data) ─────────────────
const Dashboard_MonthlyTarget = ({
  target,
  revenue,
  change,
  formatAmount,
}: {
  target: number;
  revenue: number;
  change: number;
  formatAmount: (v: number) => string;
}) => {
  const percentage = target > 0 ? Math.min((revenue / target) * 100, 100) : 0;
  const remaining = Math.max(target - revenue, 0);
  
   // Calculate arc for gauge (semicircle from left to right)
   // Full arc = M 12 50 A 38 38 0 0 1 88 50 (180 degrees)
   // We need to fill `percentage` of this arc
   const radius = 38;
   const cx = 50, cy = 50;
  const startAngle = Math.PI; // left side (180 degrees)
  const totalArc = Math.PI; // semicircle (180 degrees)
  const fillAngle = startAngle - (percentage / 100) * totalArc;
  
  const endX = cx + radius * Math.cos(fillAngle);
  const endY = cy - radius * Math.sin(fillAngle);
  const largeArc = 0;

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '16px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      gridColumn: 'span 1',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '24px' }}>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>Monthly Target</div>
        <MoreHorizontal style={{ width: 18, height: 18, color: '#9ca3af', cursor: 'pointer' }} />
      </div>

      <div style={{ position: 'relative', width: '180px', height: '120px', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
        <svg style={{ width: '180px', height: '100px' }} viewBox="0 0 100 60">
          <path d="M 12 50 A 38 38 0 0 1 88 50" stroke="#F3F4F6" strokeWidth="6" fill="none" strokeLinecap="round" />
          {percentage > 0 && (
            <path 
              d={`M 12 50 A 38 38 0 ${largeArc} 1 ${endX.toFixed(1)} ${endY.toFixed(1)}`} 
              stroke="#FF7F00" 
              strokeWidth="6" 
              fill="none" 
              strokeLinecap="round" 
            />
          )}
        </svg>
        <div style={{ position: 'absolute', bottom: '5px', textAlign: 'center' }}>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', display: 'block', lineHeight: 1 }}>{percentage.toFixed(0)}%</span>
          <span style={{ fontSize: '10px', color: change >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
          </span>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
          {percentage >= 100 ? 'Target Reached! 🎉' : percentage >= 75 ? 'Great Progress! 🎉' : percentage >= 50 ? 'Halfway There! 💪' : 'Keep Going! 🚀'}
        </div>
        <div style={{ fontSize: '10px', color: '#6b7280', lineHeight: 1.4 }}>
          {remaining > 0 ? (
            <>Need <span style={{ color: '#d97706' }}>{formatAmount(remaining)}</span> more to reach target.</>
          ) : (
            <>You've exceeded your target by <span style={{ color: '#10b981' }}>{formatAmount(revenue - target)}</span>!</>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex', width: '100%', justifyContent: 'space-between',
        marginTop: 'auto', background: '#fff7ed', padding: '12px', borderRadius: '8px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px' }}>Target</div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#1f2937' }}>{formatAmount(target)}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px' }}>Revenue</div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#1f2937' }}>{formatAmount(revenue)}</div>
        </div>
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
  countries: CountryItem[];
}) => (
  <div style={{
    background: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    gridColumn: 'span 1',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
      <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>Active User</div>
      <MoreHorizontal style={{ width: 18, height: 18, color: '#9ca3af', cursor: 'pointer' }} />
    </div>

    <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>{total.toLocaleString()}</div>
    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '24px' }}>
      Breakdown
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {countries.map((c) => (
        <div key={c.country} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
            <span>{c.country}</span>
            <span style={{ color: '#1f2937', fontWeight: 600 }}>{c.percent}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${c.percent}%`, background: c.barColor, borderRadius: '3px' }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── Conversion Rate ────────────────────────────────────────────────────────
const Dashboard_ConversionRate = ({
  funnel,
}: {
  funnel: ConversionItem[];
}) => (
  <div style={{
    background: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    gridColumn: 'span 2',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
      <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>Conversion Rate</div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '6px 12px', backgroundColor: '#fff', border: '1px solid #e5e7eb',
        borderRadius: '6px', fontSize: '12px', color: '#6b7280',
      }}>
        This Week
        <ChevronDown style={{ width: 14, height: 14 }} />
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginTop: '12px', position: 'relative', zIndex: 2 }}>
      {funnel.map((item) => (
        <div key={item.label} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px', height: '28px', lineHeight: 1.2 }}
            dangerouslySetInnerHTML={{ __html: `${item.label}<br/>${item.labelLine2}` }}
          />
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#1f2937', marginBottom: '4px' }}>{item.value}</div>
          <div style={{
            display: 'inline-block', padding: '2px 6px',
            background: item.isNegative ? '#fef2f2' : '#ecfdf5',
            color: item.isNegative ? '#ef4444' : '#10b981',
            borderRadius: '4px', fontSize: '10px', fontWeight: 600, width: 'fit-content',
          }}>
            {item.badge}
          </div>
        </div>
      ))}
    </div>

    <div style={{ display: 'flex', alignItems: 'flex-end', height: '100px', gap: '12px', marginTop: '24px', overflow: 'hidden' }}>
      {funnel.map((item) => (
        <div key={item.label} style={{
          flex: 1, height: item.barHeight, background: item.barColor,
          borderRadius: '6px 6px 0 0',
        }} />
      ))}
    </div>
  </div>
);

// ── Traffic Sources ────────────────────────────────────────────────────────
const Dashboard_TrafficSources = ({
  sources,
}: {
  sources: TrafficItem[];
}) => (
  <div style={{
    background: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    gridColumn: 'span 1',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
      <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>Order Breakdown</div>
      <MoreHorizontal style={{ width: 18, height: 18, color: '#9ca3af', cursor: 'pointer' }} />
    </div>

    {/* 50px tall segmented bar */}
    <div style={{ display: 'flex', gap: '4px', height: '50px', marginBottom: '24px', borderRadius: '8px', overflow: 'hidden' }}>
      {sources.map((s) => (
        <div key={s.name} style={{ height: '100%', width: `${s.percent}%`, backgroundColor: s.color }} />
      ))}
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {sources.map((s) => (
        <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: s.color }} />
            {s.name}
          </div>
          <div style={{ fontWeight: 600, color: '#1f2937' }}>{s.percent}%</div>
        </div>
      ))}
    </div>
  </div>
);

// ── Recent Orders Table ────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  completed: { bg: '#ecfdf5', text: '#10b981' },
  delivered: { bg: '#eff6ff', text: '#3b82f6' },
  shipped: { bg: '#eff6ff', text: '#3b82f6' },
  pending: { bg: '#fff7ed', text: '#f59e0b' },
  processing: { bg: '#f3f4f6', text: '#6b7280' },
  cancelled: { bg: '#fef2f2', text: '#ef4444' },
  refunded: { bg: '#fef2f2', text: '#ef4444' },
};

const Dashboard_RecentOrders = ({ orders }: { orders: RecentOrderItem[] }) => {
  const [search, setSearch] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  const categories = ['All Categories', ...Array.from(new Set(orders.map(o => o.status.charAt(0).toUpperCase() + o.status.slice(1))))];

  const filtered = orders.filter(o => {
    const matchesSearch = !search || o.customerName.toLowerCase().includes(search.toLowerCase()) || o.productName.toLowerCase().includes(search.toLowerCase()) || o.orderId.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || o.status.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  }).slice(0, 5);

  return (
    <div style={{
      background: '#ffffff', borderRadius: '16px', padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)', gridColumn: 'span 3',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>Recent Orders</div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search product, customer"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                paddingLeft: '32px', paddingRight: '12px', height: '36px',
                border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px',
                outline: 'none', width: '200px', color: '#374151', background: '#fff',
              }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setCategoryOpen(!categoryOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', backgroundColor: '#ff7f00', color: 'white',
                border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 500,
              }}
            >
              {selectedCategory}
              <ChevronDown style={{ width: 14, height: 14, transform: categoryOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {categoryOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', marginTop: '4px',
                background: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '1px solid #e5e7eb', zIndex: 50, minWidth: '140px', overflow: 'hidden',
              }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setCategoryOpen(false); }}
                    style={{
                      display: 'block', width: '100%', padding: '8px 14px', fontSize: '12px',
                      textAlign: 'left', border: 'none',
                      background: selectedCategory === cat ? '#fff7ed' : 'white',
                      color: selectedCategory === cat ? '#ff7f00' : '#374151',
                      fontWeight: selectedCategory === cat ? 600 : 400, cursor: 'pointer',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              {['No', 'Order ID', 'Customer', 'Product', 'Qty', 'Total', 'Status'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: '13px' }}>No orders found</td></tr>
            ) : filtered.map((order, idx) => {
              const statusStyle = STATUS_COLORS[order.status.toLowerCase()] || STATUS_COLORS.pending;
              return (
                <tr key={order.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '12px', color: '#6b7280' }}>{idx + 1}</td>
                  <td style={{ padding: '12px', fontWeight: 500, color: '#1f2937' }}>#{order.orderId}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 600, color: '#6b7280', overflow: 'hidden', flexShrink: 0,
                      }}>
                        {order.customerAvatar ? <img src={order.customerAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : order.customerName.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ color: '#374151', fontSize: '12px' }}>{order.customerName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '6px',
                        background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {order.productIcon ? <img src={order.productIcon} alt="" style={{ width: '20px', height: '20px', objectFit: 'cover', borderRadius: '4px' }} /> : <Package style={{ width: 14, height: 14, color: '#ff7f00' }} />}
                      </div>
                      <span style={{ color: '#374151', fontSize: '12px' }}>{order.productName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>{order.qty}</td>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#1f2937' }}>{order.total}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500,
                      background: statusStyle.bg, color: statusStyle.text,
                    }}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Recent Activity Feed ───────────────────────────────────────────────────
const ACTIVITY_ICONS: Record<string, string> = {
  purchase: '🛒',
  price: '💰',
  review: '⭐',
  stock: '📦',
  order: '📋',
  delivery: '🚚',
};

const Dashboard_RecentActivity = ({ activities }: { activities: RecentActivityItem[] }) => (
  <div style={{
    background: '#ffffff', borderRadius: '16px', padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)', gridColumn: 'span 1',
    display: 'flex', flexDirection: 'column',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>Recent Activity</div>
      <MoreHorizontal style={{ width: 18, height: 18, color: '#9ca3af', cursor: 'pointer' }} />
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: '13px' }}>No recent activity</div>
      ) : activities.map(a => (
        <div key={a.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: a.color || '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', flexShrink: 0,
          }}>
            {ACTIVITY_ICONS[a.icon] || '📌'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', color: '#374151', lineHeight: 1.4 }}>{a.message}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <Clock style={{ width: 10, height: 10, color: '#9ca3af' }} />
              <span style={{ fontSize: '10px', color: '#9ca3af' }}>{a.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── Main Grid ──────────────────────────────────────────────────────────────
const EzMartDashboardGrid = ({ data }: { data: DashboardStatData }) => {
  const defaultDaily: DailyRevenueItem[] = Array.from({ length: 8 }, (_, i) => ({
    date: format(subDays(new Date(), 7 - i), 'dd MMM'),
    revenue: 0,
  }));

  const dailyRevenue = data.dailyRevenue && data.dailyRevenue.length > 0 ? data.dailyRevenue : defaultDaily;
  const monthlyTarget = data.monthlyTarget ?? 0;
  const monthlyRevenue = data.monthlyRevenue ?? 0;
  const monthlyTargetChange = data.monthlyTargetChange ?? 0;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gridTemplateRows: 'auto auto auto auto',
      gap: '24px',
      width: '100%',
      fontFamily: '"Inter", system-ui, sans-serif',
    }}>
      {/* Row 1: 3 stat cards + Top Categories (row-span-2) */}
      <Dashboard_StatCard
        label="Total Sales"
        value={data.formatAmount(data.totalSales)}
        change={data.totalSalesChange}
        iconType="dollar"
        isOrange
      />
      <Dashboard_StatCard
        label="Total Orders"
        value={data.totalOrders.toLocaleString()}
        change={data.totalOrdersChange}
        iconType="cart"
      />
      <Dashboard_StatCard
        label={data.thirdCardLabel || "Total Visitors"}
        value={data.thirdCardValue || data.totalVisitors.toLocaleString()}
        change={data.totalVisitorsChange}
        iconType={data.thirdCardIcon || "user"}
      />
      <Dashboard_TopCategories
        categories={data.topCategories}
        totalSales={data.totalCategorySales}
      />

      {/* Row 2: Revenue Chart (2 cols) + Monthly Target (1 col) */}
      <Dashboard_RevenueChart 
        dailyRevenue={dailyRevenue} 
        formatAmount={data.formatAmount} 
      />
      <Dashboard_MonthlyTarget 
        target={monthlyTarget}
        revenue={monthlyRevenue}
        change={monthlyTargetChange}
        formatAmount={data.formatAmount}
      />

      {/* Row 3: Active Users (1 col) + Conversion Rate (2 cols) + Traffic Sources (1 col) */}
      <Dashboard_ActiveUsers total={data.activeUsers} countries={data.activeUsersByCountry} />
      <Dashboard_ConversionRate funnel={data.conversionFunnel} />
      <Dashboard_TrafficSources sources={data.trafficSources} />

      {/* Row 4: Recent Orders (3 cols) + Recent Activity (1 col) */}
      {data.recentOrders && data.recentOrders.length > 0 && (
        <Dashboard_RecentOrders orders={data.recentOrders} />
      )}
      {data.recentActivity && data.recentActivity.length > 0 && (
        <Dashboard_RecentActivity activities={data.recentActivity} />
      )}
    </div>
  );
};

export default EzMartDashboardGrid;
