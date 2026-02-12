import { MoreHorizontal, DollarSign, ShoppingCart, User, ChevronDown } from 'lucide-react';
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

export interface DashboardStatData {
  totalSales: number;
  totalSalesChange: number;
  totalOrders: number;
  totalOrdersChange: number;
  totalVisitors: number;
  totalVisitorsChange: number;
  // Optional custom 3rd stat card
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
  // Real data for charts
  dailyRevenue?: DailyRevenueItem[];
  monthlyTarget?: number;
  monthlyRevenue?: number;
  monthlyTargetChange?: number;
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
        <circle cx="50" cy="50" r="40" fill="none" stroke="#F3F4F6" strokeWidth="12" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="#FF7F00" strokeWidth="12" strokeDasharray="100 251" strokeDashoffset="0" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="#FDBA74" strokeWidth="12" strokeDasharray="70 251" strokeDashoffset="-105" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="#FED7AA" strokeWidth="12" strokeDasharray="50 251" strokeDashoffset="-180" />
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
const Dashboard_RevenueChart = ({
  dailyRevenue,
  formatAmount,
}: {
  dailyRevenue: DailyRevenueItem[];
  formatAmount: (v: number) => string;
}) => {
  // Use last 8 data points for display
  const chartData = dailyRevenue.slice(-8);
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);
  
  // Generate SVG path from real data
  const width = 450;
  const height = 130;
  const padding = 0;
  
  const points = chartData.map((d, i) => {
    const x = chartData.length > 1 ? (i / (chartData.length - 1)) * width : width / 2;
    const y = height - (d.revenue / maxRevenue) * (height - 10) - 5;
    return { x, y, ...d };
  });

  // Create smooth curve path
  const pathD = points.length > 1
    ? points.reduce((acc, p, i) => {
        if (i === 0) return `M${p.x},${p.y}`;
        const prev = points[i - 1];
        const cpx1 = prev.x + (p.x - prev.x) * 0.4;
        const cpx2 = p.x - (p.x - prev.x) * 0.4;
        return `${acc} C${cpx1},${prev.y} ${cpx2},${p.y} ${p.x},${p.y}`;
      }, '')
    : `M${width / 2},${height / 2}`;

  // Find peak point for tooltip
  const peakIdx = points.reduce((best, p, i) => p.revenue > points[best].revenue ? i : best, 0);
  const peak = points[peakIdx];

  // Y axis labels
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          backgroundColor: '#ff7f00',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '12px',
        }}>
          Last {chartData.length} Days
          <ChevronDown style={{ width: 14, height: 14 }} />
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
          {/* Grid lines */}
          {[20, 40, 60, 80].map(pct => (
            <div key={pct} style={{ position: 'absolute', width: '100%', top: `${pct}%`, borderTop: '1px dashed #f3f4f6' }} />
          ))}

          <svg width="100%" height="130px" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            <path d={pathD} fill="none" stroke="#FF7F00" strokeWidth="2" />
            {peak && (
              <circle cx={peak.x} cy={peak.y} r="4" fill="#FFF" stroke="#FF7F00" strokeWidth="2" />
            )}
          </svg>

          {/* Tooltip on peak */}
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

          {/* X Axis */}
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
  // Full arc = M 10 50 A 40 40 0 0 1 90 50 (180 degrees)
  // We need to fill `percentage` of this arc
  const radius = 40;
  const cx = 50, cy = 50;
  const startAngle = Math.PI; // left side (180 degrees)
  const totalArc = Math.PI; // semicircle (180 degrees)
  const fillAngle = startAngle - (percentage / 100) * totalArc;
  
  const endX = cx + radius * Math.cos(fillAngle);
  const endY = cy - radius * Math.sin(fillAngle);
  const largeArc = percentage > 50 ? 1 : 0;

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

      <div style={{ position: 'relative', width: '180px', height: '110px', display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
        <svg style={{ width: '180px', height: '100px' }} viewBox="0 0 100 55">
          <path d="M 10 50 A 40 40 0 0 1 90 50" stroke="#F3F4F6" strokeWidth="10" fill="none" />
          {percentage > 0 && (
            <path 
              d={`M 10 50 A 40 40 0 ${largeArc} 1 ${endX.toFixed(1)} ${endY.toFixed(1)}`} 
              stroke="#FF7F00" 
              strokeWidth="10" 
              fill="none" 
              strokeLinecap="round" 
            />
          )}
        </svg>
        <div style={{ position: 'absolute', bottom: '0px', textAlign: 'center' }}>
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
        marginTop: '16px', background: '#fff7ed', padding: '12px', borderRadius: '8px',
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
      Users
      <span style={{
        float: 'right', color: '#10b981', background: '#ecfdf5',
        padding: '2px 6px', borderRadius: '4px', fontWeight: 600, fontSize: '11px',
      }}>+8.02%</span>
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

    <div style={{ display: 'flex', alignItems: 'flex-end', height: '100px', gap: '12px', marginTop: '24px' }}>
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
      <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>Traffic Sources</div>
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

// ── Main Grid ──────────────────────────────────────────────────────────────
const EzMartDashboardGrid = ({ data }: { data: DashboardStatData }) => {
  // Default daily revenue if not provided
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
      gridTemplateRows: 'auto auto auto',
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
    </div>
  );
};

export default EzMartDashboardGrid;
