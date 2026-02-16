import { useState } from 'react';
import { MoreHorizontal, DollarSign, ShoppingCart, User, ChevronDown, Search, Package, Clock, Wallet } from 'lucide-react';
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

// ── eShop Design Tokens ────────────────────────────────────────────────────
const CARD_STYLE = {
  background: '#ffffff',
  borderRadius: '12px',
  padding: '28px',
  border: '1px solid #f1f5f9',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
  transition: 'all 0.2s ease',
} as const;

const TEXT = {
  primary: '#0f172a',
  secondary: '#64748b',
  accent: '#3b82f6',
} as const;

// ── Stat Card (eShop style) ────────────────────────────────────────────────
const STAT_CARD_CONFIG: Record<string, { iconBg: string; iconColor: string; linkText: string }> = {
  dollar: { iconBg: 'rgba(16,185,129,0.1)', iconColor: '#10b981', linkText: 'View net earnings' },
  cart: { iconBg: 'rgba(59,130,246,0.1)', iconColor: '#3b82f6', linkText: 'View all orders' },
  user: { iconBg: 'rgba(245,158,11,0.1)', iconColor: '#f59e0b', linkText: 'See details' },
  wallet: { iconBg: 'rgba(239,68,68,0.1)', iconColor: '#ef4444', linkText: 'Withdraw' },
};

const Dashboard_StatCard = ({
  label,
  value,
  change,
  iconType,
}: {
  label: string;
  value: string;
  change: number;
  iconType: 'dollar' | 'cart' | 'user';
  isOrange?: boolean;
}) => {
  const isPositive = change >= 0;
  const Icon = iconType === 'dollar' ? DollarSign : iconType === 'cart' ? ShoppingCart : User;
  const config = STAT_CARD_CONFIG[iconType] || STAT_CARD_CONFIG.dollar;

  return (
    <div
      style={{
        ...CARD_STYLE,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '152px',
        cursor: 'default',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.04)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{
          fontSize: '12px',
          color: TEXT.secondary,
          fontWeight: 600,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.06em',
        }}>{label}</span>
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          color: isPositive ? '#10b981' : '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
        }}>
          {isPositive ? '↑' : '↓'} {isPositive ? '+' : ''}{change.toFixed(2)} %
        </span>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: TEXT.primary, marginBottom: '10px', letterSpacing: '-0.01em' }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: TEXT.accent, fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }}
        onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
        onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
      >
        {config.linkText}
      </div>
      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        width: '44px',
        height: '44px',
        borderRadius: '10px',
        backgroundColor: config.iconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon style={{ width: 20, height: 20, color: config.iconColor }} />
      </div>
    </div>
  );
};

// ── Top Categories (donut) ─────────────────────────────────────────────────
const Dashboard_TopCategories = ({
  categories,
  totalSales,
}: {
  categories: CategoryItem[];
  totalSales: string;
}) => (
  <div style={{
    ...CARD_STYLE,
    display: 'flex',
    flexDirection: 'column',
    gridColumn: 'span 1',
    gridRow: 'span 2',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
      <div style={{ fontSize: '17px', fontWeight: 600, color: TEXT.primary }}>Top Categories</div>
      <div style={{ fontSize: '12px', color: TEXT.accent, cursor: 'pointer' }}>See All</div>
    </div>

    <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto 32px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="200" height="200" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        {(() => {
          const circumference = 2 * Math.PI * 40;
          const totalAmount = categories.reduce((sum, c) => sum + parseFloat(c.amount.replace(/[^0-9.-]/g, '') || '0'), 0) || 1;
          let offset = 0;
          return (
            <>
              <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="12" />
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
        <div style={{ fontSize: '12px', color: TEXT.secondary }}>Total Sales</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: TEXT.primary }}>{totalSales}</div>
      </div>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {categories.map((cat) => (
        <div key={cat.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: TEXT.secondary }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: cat.color }} />
            {cat.name}
          </div>
          <div style={{ fontWeight: 600, color: TEXT.primary }}>{cat.amount}</div>
        </div>
      ))}
    </div>
  </div>
);

// ── Revenue Status (Bar chart with pill filters, eShop style) ──────────────
const TIME_FILTERS = ['ALL', '1W', '1M', '6M', '1Y'] as const;

const Dashboard_RevenueChart = ({
  dailyRevenue,
  formatAmount,
}: {
  dailyRevenue: DailyRevenueItem[];
  formatAmount: (v: number) => string;
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('1M');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Filter data based on selected range
  const filteredData = (() => {
    switch (activeFilter) {
      case '1W': return dailyRevenue.slice(-7);
      case '1M': return dailyRevenue.slice(-30);
      case '6M': return dailyRevenue.slice(-180);
      case '1Y': return dailyRevenue.slice(-365);
      default: return dailyRevenue;
    }
  })();

  // Take last 12 points for display
  const chartData = filteredData.slice(-12);
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  // Sub-stats
  const totalOrders = chartData.length;
  const totalEarning = chartData.reduce((s, d) => s + d.revenue, 0);
  const conversionRatio = totalOrders > 0 ? ((chartData.filter(d => d.revenue > 0).length / totalOrders) * 100).toFixed(2) : '0.00';

  // Y-axis labels
  const yMax = Math.ceil(maxRevenue / 30) * 30 || 120;
  const yLabels = [yMax, yMax * 0.75, yMax * 0.5, yMax * 0.25, 0];

  return (
    <div style={{
      ...CARD_STYLE,
      display: 'flex',
      flexDirection: 'column',
      gridColumn: 'span 2',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '17px', fontWeight: 600, color: TEXT.primary }}>Revenue Status</div>
        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', borderRadius: '4px', padding: '2px' }}>
          {TIME_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: activeFilter === f ? 600 : 400,
                color: activeFilter === f ? '#fff' : TEXT.secondary,
                background: activeFilter === f ? TEXT.accent : 'transparent',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-stats row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        padding: '16px 0',
        marginBottom: '16px',
        borderBottom: '1px solid #f1f5f9',
      }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: TEXT.primary }}>{totalOrders.toLocaleString()}</div>
          <div style={{ fontSize: '11px', color: TEXT.secondary }}>Orders</div>
        </div>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: TEXT.primary }}>{formatAmount(totalEarning)}</div>
          <div style={{ fontSize: '11px', color: TEXT.secondary }}>Earning</div>
        </div>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: TEXT.primary }}>{formatAmount(0)}</div>
          <div style={{ fontSize: '11px', color: TEXT.secondary }}>Refunds</div>
        </div>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: TEXT.accent }}>{conversionRatio}%</div>
          <div style={{ fontSize: '11px', color: TEXT.secondary }}>Conversation Ratio</div>
        </div>
      </div>

      {/* Bar chart */}
      <div style={{ position: 'relative', height: '180px', width: '100%' }}>
        {/* Y Axis */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: '30px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          fontSize: '10px', color: '#9ca3af', width: '35px',
        }}>
          {yLabels.map((v, i) => <span key={i}>{v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toFixed(2)}</span>)}
        </div>

        <div style={{ marginLeft: '40px', position: 'relative', height: '150px', display: 'flex', alignItems: 'flex-end', gap: '6px', paddingBottom: '0' }}>
          {/* Grid lines */}
          {[0, 25, 50, 75].map(pct => (
            <div key={pct} style={{ position: 'absolute', width: '100%', bottom: `${pct}%`, borderTop: '1px dashed #f1f5f9', zIndex: 0 }} />
          ))}

          {chartData.map((d, i) => {
            const barH = maxRevenue > 0 ? Math.max((d.revenue / maxRevenue) * 100, 2) : 2;
            return (
              <div
                key={i}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}
                onMouseEnter={() => setHoveredBar(i)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                <div style={{
                  width: '100%',
                  maxWidth: '28px',
                  height: `${barH}%`,
                  backgroundColor: hoveredBar === i ? '#2563eb' : TEXT.accent,
                  borderRadius: '2px 2px 0 0',
                  transition: 'background-color 0.15s',
                  cursor: 'pointer',
                  minHeight: '3px',
                }} />
                {/* Tooltip */}
                {hoveredBar === i && (
                  <div style={{
                    position: 'absolute',
                    bottom: `${barH + 5}%`,
                    background: '#1e293b',
                    color: '#fff',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    pointerEvents: 'none',
                  }}>
                    <div style={{ fontWeight: 600 }}>Date: {d.date}</div>
                    <div>Revenue: {formatAmount(d.revenue)}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* X Axis labels */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginLeft: '40px', marginTop: '8px',
          fontSize: '10px', color: '#9ca3af',
        }}>
          {chartData.map(d => (
            <span key={d.date} style={{ flex: 1, textAlign: 'center' }}>{d.date.split(' ')[0]}</span>
          ))}
        </div>
      </div>

      {/* Bottom row: Order / Sold / Refund */}
      <div style={{
        display: 'flex',
        gap: '24px',
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: '1px solid #f1f5f9',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: TEXT.secondary }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: TEXT.accent }} />
          Order
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: TEXT.secondary }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#10b981' }} />
          Sold
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: TEXT.secondary }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#ef4444' }} />
          Refund
        </div>
      </div>
    </div>
  );
};

// ── Monthly Target (gauge) ─────────────────────────────────────────────────
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
  
  const radius = 38;
  const cx = 50, cy = 50;
  const startAngle = Math.PI;
  const totalArc = Math.PI;
  const fillAngle = startAngle - (percentage / 100) * totalArc;
  
  const endX = cx + radius * Math.cos(fillAngle);
  const endY = cy - radius * Math.sin(fillAngle);
  const largeArc = 0;

  return (
    <div style={{
      ...CARD_STYLE,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gridColumn: 'span 1',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '24px' }}>
        <div style={{ fontSize: '17px', fontWeight: 600, color: TEXT.primary }}>Monthly Target</div>
        <MoreHorizontal style={{ width: 18, height: 18, color: '#9ca3af', cursor: 'pointer' }} />
      </div>

      <div style={{ position: 'relative', width: '180px', height: '120px', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
        <svg style={{ width: '180px', height: '100px' }} viewBox="0 0 100 60">
          <path d="M 12 50 A 38 38 0 0 1 88 50" stroke="#f1f5f9" strokeWidth="6" fill="none" strokeLinecap="round" />
          {percentage > 0 && (
            <path 
              d={`M 12 50 A 38 38 0 ${largeArc} 1 ${endX.toFixed(1)} ${endY.toFixed(1)}`} 
              stroke={TEXT.accent}
              strokeWidth="6" 
              fill="none" 
              strokeLinecap="round" 
            />
          )}
        </svg>
        <div style={{ position: 'absolute', bottom: '5px', textAlign: 'center' }}>
          <span style={{ fontSize: '24px', fontWeight: 700, color: TEXT.primary, display: 'block', lineHeight: 1 }}>{percentage.toFixed(0)}%</span>
          <span style={{ fontSize: '10px', color: change >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
          </span>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px', color: TEXT.primary }}>
          {percentage >= 100 ? 'Target Reached! 🎉' : percentage >= 75 ? 'Great Progress! 🎉' : percentage >= 50 ? 'Halfway There! 💪' : 'Keep Going! 🚀'}
        </div>
        <div style={{ fontSize: '10px', color: TEXT.secondary, lineHeight: 1.4 }}>
          {remaining > 0 ? (
            <>Need <span style={{ color: TEXT.accent }}>{formatAmount(remaining)}</span> more to reach target.</>
          ) : (
            <>You've exceeded your target by <span style={{ color: '#10b981' }}>{formatAmount(revenue - target)}</span>!</>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex', width: '100%', justifyContent: 'space-between',
        marginTop: 'auto', background: '#f1f5f9', padding: '12px', borderRadius: '4px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: TEXT.secondary, marginBottom: '4px' }}>Target</div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: TEXT.primary }}>{formatAmount(target)}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: TEXT.secondary, marginBottom: '4px' }}>Revenue</div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: TEXT.primary }}>{formatAmount(revenue)}</div>
        </div>
      </div>
    </div>
  );
};

// ── Sales by Locations ─────────────────────────────────────────────────────
const Dashboard_ActiveUsers = ({
  total,
  countries,
}: {
  total: number;
  countries: CountryItem[];
}) => (
  <div style={{
    ...CARD_STYLE,
    display: 'flex',
    flexDirection: 'column',
    gridColumn: 'span 1',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
      <div style={{ fontSize: '17px', fontWeight: 600, color: TEXT.primary }}>Sales by Locations</div>
      <MoreHorizontal style={{ width: 18, height: 18, color: '#9ca3af', cursor: 'pointer' }} />
    </div>

    {/* Map placeholder */}
    <div style={{
      width: '100%',
      height: '120px',
      background: '#f8fafc',
      borderRadius: '4px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px dashed #e2e8f0',
    }}>
      <span style={{ fontSize: '11px', color: '#94a3b8' }}>🌍 Map View</span>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {countries.map((c) => (
        <div key={c.country} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: TEXT.secondary }}>
            <span>{c.country}</span>
            <span style={{ color: TEXT.primary, fontWeight: 600 }}>{c.percent}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(c.percent, 100)}%`, background: TEXT.accent, borderRadius: '3px' }} />
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
    ...CARD_STYLE,
    display: 'flex',
    flexDirection: 'column',
    gridColumn: 'span 2',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
      <div style={{ fontSize: '17px', fontWeight: 600, color: TEXT.primary }}>Conversion Rate</div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '6px 12px', backgroundColor: '#fff', border: '1px solid #e2e8f0',
        borderRadius: '4px', fontSize: '12px', color: TEXT.secondary,
      }}>
        This Week
        <ChevronDown style={{ width: 14, height: 14 }} />
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginTop: '12px', position: 'relative', zIndex: 2 }}>
      {funnel.map((item) => (
        <div key={item.label} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '11px', color: TEXT.secondary, marginBottom: '8px', height: '28px', lineHeight: 1.2 }}
            dangerouslySetInnerHTML={{ __html: `${item.label}<br/>${item.labelLine2}` }}
          />
          <div style={{ fontSize: '18px', fontWeight: 700, color: TEXT.primary, marginBottom: '4px' }}>{item.value}</div>
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
          borderRadius: '4px 4px 0 0',
        }} />
      ))}
    </div>
  </div>
);

// ── Traffic Sources / Order Breakdown ──────────────────────────────────────
const Dashboard_TrafficSources = ({
  sources,
}: {
  sources: TrafficItem[];
}) => (
  <div style={{
    ...CARD_STYLE,
    display: 'flex',
    flexDirection: 'column',
    gridColumn: 'span 1',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
      <div style={{ fontSize: '17px', fontWeight: 600, color: TEXT.primary }}>Order Breakdown</div>
      <MoreHorizontal style={{ width: 18, height: 18, color: '#9ca3af', cursor: 'pointer' }} />
    </div>

    <div style={{ display: 'flex', gap: '4px', height: '50px', marginBottom: '24px', borderRadius: '4px', overflow: 'hidden' }}>
      {sources.map((s) => (
        <div key={s.name} style={{ height: '100%', width: `${s.percent}%`, backgroundColor: s.color }} />
      ))}
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {sources.map((s) => (
        <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: TEXT.secondary }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: s.color }} />
            {s.name}
          </div>
          <div style={{ fontWeight: 600, color: TEXT.primary }}>{s.percent}%</div>
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
  processing: { bg: '#f1f5f9', text: '#64748b' },
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
      ...CARD_STYLE,
      gridColumn: 'span 3',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '17px', fontWeight: 600, color: TEXT.primary }}>Recent Orders</div>
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
                border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px',
                outline: 'none', width: '200px', color: '#374151', background: '#fff',
              }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setCategoryOpen(!categoryOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', backgroundColor: TEXT.accent, color: 'white',
                border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 500,
              }}
            >
              {selectedCategory}
              <ChevronDown style={{ width: 14, height: 14, transform: categoryOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {categoryOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', marginTop: '4px',
                background: 'white', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '1px solid #e2e8f0', zIndex: 50, minWidth: '140px', overflow: 'hidden',
              }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setCategoryOpen(false); }}
                    style={{
                      display: 'block', width: '100%', padding: '8px 14px', fontSize: '12px',
                      textAlign: 'left', border: 'none',
                      background: selectedCategory === cat ? 'rgba(59,130,246,0.1)' : 'white',
                      color: selectedCategory === cat ? TEXT.accent : '#374151',
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
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              {['No', 'Order ID', 'Customer', 'Product', 'Qty', 'Total', 'Status'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontSize: '13px' }}>No orders found</td></tr>
            ) : filtered.map((order, idx) => {
              const statusStyle = STATUS_COLORS[order.status.toLowerCase()] || STATUS_COLORS.pending;
              return (
                <tr key={order.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '12px', color: TEXT.secondary }}>{idx + 1}</td>
                  <td style={{ padding: '12px', fontWeight: 500, color: TEXT.primary }}>#{order.orderId}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 600, color: TEXT.secondary, overflow: 'hidden', flexShrink: 0,
                      }}>
                        {order.customerAvatar ? <img src={order.customerAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : order.customerName.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ color: '#374151', fontSize: '12px' }}>{order.customerName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '4px',
                        background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {order.productIcon ? <img src={order.productIcon} alt="" style={{ width: '20px', height: '20px', objectFit: 'cover', borderRadius: '3px' }} /> : <Package style={{ width: 14, height: 14, color: TEXT.accent }} />}
                      </div>
                      <span style={{ color: '#374151', fontSize: '12px' }}>{order.productName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px', color: TEXT.secondary }}>{order.qty}</td>
                  <td style={{ padding: '12px', fontWeight: 600, color: TEXT.primary }}>{order.total}</td>
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
    ...CARD_STYLE,
    gridColumn: 'span 1',
    display: 'flex',
    flexDirection: 'column',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      <div style={{ fontSize: '17px', fontWeight: 600, color: TEXT.primary }}>Recent Activity</div>
      <MoreHorizontal style={{ width: 18, height: 18, color: '#9ca3af', cursor: 'pointer' }} />
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px' }}>No recent activity</div>
      ) : activities.map(a => (
        <div key={a.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '4px',
            background: a.color || '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
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
      gap: '28px',
      width: '100%',
      fontFamily: '"Inter", system-ui, sans-serif',
    }}>
      {/* Row 1: 3 stat cards + Top Categories (row-span-2) */}
      <Dashboard_StatCard
        label="Total Earning"
        value={data.formatAmount(data.totalSales)}
        change={data.totalSalesChange}
        iconType="dollar"
      />
      <Dashboard_StatCard
        label="Orders"
        value={data.totalOrders.toLocaleString()}
        change={data.totalOrdersChange}
        iconType="cart"
      />
      <Dashboard_StatCard
        label={data.thirdCardLabel || "Customers"}
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

      {/* Row 3: Sales by Locations (1 col) + Conversion Rate (2 cols) + Traffic Sources (1 col) */}
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
