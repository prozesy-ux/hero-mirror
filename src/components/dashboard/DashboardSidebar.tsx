import { useState, forwardRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, Heart, CreditCard, User, LogOut, Menu, X, 
  Crown, Wrench, Bot, ShoppingBag, ArrowRight, Zap
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import theLogo from '@/assets/the-logo.png';
// Meta Logo SVG Component (Official Infinity Logo)
const MetaLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 36 36" fill="none" className={className}>
    <path 
      d="M7.5 18c0-4.5 2.5-9 6-9 2.5 0 4 1.5 5.5 4l1 1.5 1-1.5c1.5-2.5 3-4 5.5-4 3.5 0 6 4.5 6 9s-2.5 9-6 9c-2.5 0-4-1.5-5.5-4l-1-1.5-1 1.5c-1.5 2.5-3 4-5.5 4-3.5 0-6-4.5-6-9z" 
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

// Google Ads Logo SVG Component (Official Triangle Design)
const GoogleAdsLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className}>
    {/* Yellow bar */}
    <rect x="4" y="28" width="16" height="40" rx="8" transform="rotate(-60 4 28)" fill="#FBBC04"/>
    {/* Blue bar */}
    <rect x="28" y="8" width="16" height="40" rx="8" transform="rotate(60 28 8)" fill="#4285F4"/>
    {/* Green circle */}
    <circle cx="12" cy="38" r="6" fill="#34A853"/>
  </svg>
);

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

const NavItem = forwardRef<HTMLAnchorElement, NavItemProps>(
  ({ to, icon, label, isActive, onClick }, ref) => (
    <Link
      ref={ref}
      to={to}
      onClick={onClick}
      className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-300 ${
        isActive 
          ? 'bg-white text-black' 
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className={`transition-transform duration-300 ${isActive ? '' : 'group-hover:scale-110'}`}>
        {icon}
      </span>
      <span className={`transition-all duration-200 ${
        isActive 
          ? 'font-semibold text-[15px] tracking-tight' 
          : 'font-medium text-[14px] tracking-normal'
      }`}>
        {label}
      </span>
      {isActive && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-black" />
      )}
    </Link>
  )
);

NavItem.displayName = 'NavItem';

interface SidebarContentProps {
  onNavClick?: () => void;
}

const SidebarContent = forwardRef<HTMLDivElement, SidebarContentProps>(
  ({ onNavClick }, ref) => {
    const location = useLocation();
    const { profile, signOut } = useAuthContext();

    const navItems = [
      { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
      { to: '/dashboard/prompts', icon: <FileText size={20} />, label: 'All Prompts' },
      { to: '/dashboard/favorites', icon: <Heart size={20} />, label: 'Favorites' },
      { to: '/dashboard/tools', icon: <Wrench size={20} />, label: 'AI Tools' },
      { to: '/dashboard/ai-accounts', icon: <Bot size={20} />, label: 'AI Accounts' },
      { to: '/dashboard/billing', icon: <CreditCard size={20} />, label: 'Billing' },
      { to: '/dashboard/profile', icon: <User size={20} />, label: 'Profile' },
    ];

    return (
      <div ref={ref} className="flex flex-col h-full overflow-y-auto premium-scrollbar">
        {/* Logo Section */}
        <div className="p-5 border-b border-white/5">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src={theLogo} alt="THE" className="h-7" />
          </Link>
        </div>

        {/* User Card */}
        <div className="p-3.5 mx-3 my-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-white/20"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-black text-sm font-bold ring-2 ring-white/20">
                  {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                </div>
              )}
              {profile?.is_pro && (
                <div className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-amber-400 rounded-full flex items-center justify-center">
                  <Crown size={9} className="text-black" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-[15px] tracking-tight truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-gray-500 text-[12px] tracking-normal truncate">
                {profile?.email}
              </p>
            </div>
          </div>
          {profile?.is_pro && (
            <div className="mt-2.5 px-2.5 py-1.5 bg-amber-400/10 rounded-lg border border-amber-400/20">
              <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
                <Crown size={10} />
                PRO Member
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              isActive={location.pathname === item.to || (item.to === '/dashboard' && location.pathname === '/dashboard/')}
              onClick={onNavClick}
            />
          ))}
        </nav>

        {/* Ads Agency Section */}
        <div className="mx-4 mb-4">
          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03]">
            {/* Header */}
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Ads Agency
            </p>
            <h3 className="text-[15px] font-semibold text-white tracking-tight mb-1">
              Grow Your Business
            </h3>
            <p className="text-[12px] text-gray-500 leading-relaxed mb-4">
              Professional Meta & Google Ads management services
            </p>
            
            {/* Logo Buttons */}
            <div className="flex gap-2.5 mb-3">
              <a
                href="https://business.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center py-3 bg-transparent border border-white/10 rounded-xl hover:bg-[#0668E1]/10 hover:border-[#0668E1]/30 transition-all group"
                title="Meta Ads"
              >
                <MetaLogo className="w-6 h-6 text-white group-hover:text-[#0668E1] transition-colors" />
              </a>
              <a
                href="https://ads.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center py-3 bg-transparent border border-white/10 rounded-xl hover:bg-white/5 hover:border-white/20 transition-all group"
                title="Google Ads"
              >
                <GoogleAdsLogo className="w-6 h-6" />
              </a>
            </div>
            
            {/* CTA Button */}
            <a
              href="mailto:contact@agency.com"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white hover:bg-gray-100 text-black text-[13px] font-semibold rounded-xl transition-all tracking-normal"
            >
              Contact Agency
              <ArrowRight size={14} />
            </a>
          </div>
        </div>

        {/* Sign Out */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-300"
          >
            <LogOut size={20} />
            <span className="font-medium text-[14px]">Sign Out</span>
          </button>
        </div>
      </div>
    );
  }
);

SidebarContent.displayName = 'SidebarContent';

const DashboardSidebar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={theLogo} alt="THE" className="h-6" />
          </Link>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

        {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0a0a] border-r border-white/5 pt-16 animate-slide-in-left">
          <SidebarContent onNavClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen w-64 bg-[#0a0a0a] border-r border-white/5">
        <SidebarContent />
      </div>
    </>
  );
};

export default DashboardSidebar;