// Seller-specific Gumroad-style SVG icons
// Reusing paths from GumroadIcons.tsx with seller-specific additions

interface IconProps {
  className?: string;
  size?: number;
}

// Re-export common icons from dashboard GumroadIcons
export { 
  GumroadHomeIcon,
  GumroadProductsIcon,
  GumroadCheckoutIcon as GumroadSalesIcon,
  GumroadAnalyticsIcon,
  GumroadPayoutsIcon,
  GumroadSettingsIcon,
  GumroadHelpIcon,
  GumroadInfoIcon,
} from '@/components/dashboard/GumroadIcons';

// Seller-specific icons

export const GumroadCustomersIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm-2 9a5 5 0 0 0-5 5v2h14v-2a5 5 0 0 0-5-5h-4z"/>
  </svg>
);

export const GumroadInsightsIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M3 17h2v4H3v-4zm4-6h2v10H7V11zm4-4h2v14h-2V7zm4 2h2v12h-2V9zm4 4h2v8h-2v-8z"/>
  </svg>
);

export const GumroadDiscountIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M9 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm3.707-11.707a1 1 0 0 0-1.414 0l-12 12a1 1 0 1 0 1.414 1.414l12-12a1 1 0 0 0 0-1.414z"/>
  </svg>
);

export const GumroadCouponsIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
  </svg>
);

export const GumroadFlashSaleIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
  </svg>
);

export const GumroadInventoryIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 5h6v2h-6V7zm0 4h6v2h-6v-2zm0 4h6v2h-6v-2zM6 7h4v4H6V7zm0 6h4v4H6v-4z"/>
  </svg>
);

export const GumroadReportsIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
  </svg>
);

export const GumroadPerformanceIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
  </svg>
);

export const GumroadChatIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
  </svg>
);

export const GumroadCollapseIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M15 18l-6-6 6-6"/>
  </svg>
);

export const GumroadExpandIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M9 18l6-6-6-6"/>
  </svg>
);

export const GumroadChevronDownIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M6 9l6 6 6-6"/>
  </svg>
);
