import React from 'react';

const GUMROAD_ICON_BASE = 'https://anpeyqpnsavhykstwwbq.supabase.co/storage/v1/object/public/images/gumroad';

// SVG icons from Supabase storage - mapped to menu items
export const GUMROAD_ICONS = {
  // Seller sidebar icons (main nav)
  home: `${GUMROAD_ICON_BASE}/1769952887708-5.svg`,
  products: `${GUMROAD_ICON_BASE}/1769952888337-6.svg`,
  sales: `${GUMROAD_ICON_BASE}/1769952888975-7.svg`,
  customers: `${GUMROAD_ICON_BASE}/1769952889656-8.svg`,
  flashSales: `${GUMROAD_ICON_BASE}/1769952890290-9.svg`,
  analytics: `${GUMROAD_ICON_BASE}/1769952890922-10.svg`,
  insights: `${GUMROAD_ICON_BASE}/1769952891544-11.svg`,
  payouts: `${GUMROAD_ICON_BASE}/1769952892170-12.svg`,
  emails: `${GUMROAD_ICON_BASE}/1769952892822-13.svg`,
  inventory: `${GUMROAD_ICON_BASE}/1769952893447-14.svg`,
  reports: `${GUMROAD_ICON_BASE}/1769952894054-15.svg`,
  
  // Reused icons for other menu items
  performance: `${GUMROAD_ICON_BASE}/1769952890922-10.svg`, // Same as analytics
  chat: `${GUMROAD_ICON_BASE}/1769952892822-13.svg`, // Same as emails
  settings: `${GUMROAD_ICON_BASE}/1769952893447-14.svg`, // Same as inventory
  help: `${GUMROAD_ICON_BASE}/1769952894054-15.svg`, // Same as reports
  
  // Buyer-specific icons (mapped to closest matches)
  marketplace: `${GUMROAD_ICON_BASE}/1769952888337-6.svg`, // Same as products
  orders: `${GUMROAD_ICON_BASE}/1769952888975-7.svg`, // Same as sales
  wishlist: `${GUMROAD_ICON_BASE}/1769952889656-8.svg`, // Same as customers
  prompts: `${GUMROAD_ICON_BASE}/1769952890290-9.svg`, // Same as flash sales
  wallet: `${GUMROAD_ICON_BASE}/1769952892170-12.svg`, // Same as payouts
  notifications: `${GUMROAD_ICON_BASE}/1769952892822-13.svg`, // Same as emails
  support: `${GUMROAD_ICON_BASE}/1769952894054-15.svg`, // Same as help
};

interface GumroadIconProps {
  src: string;
  size?: number;
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}

export const GumroadIcon: React.FC<GumroadIconProps> = ({ 
  src, 
  size = 20, 
  className = '',
  alt = 'icon',
  style 
}) => (
  <img 
    src={src}
    style={style}
    alt={alt}
    width={size} 
    height={size} 
    className={`flex-shrink-0 ${className}`}
    loading="lazy"
  />
);

export default GumroadIcon;
