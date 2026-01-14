import { useState, forwardRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, Heart, CreditCard, User, LogOut, Menu, X, 
  Crown, Wrench, Bot, ShoppingBag, ArrowRight, Zap
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';

// Meta Logo SVG Component
const MetaLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className}>
    <path 
      d="M50 20C35 20 27 30 20 45C13 60 10 75 10 75C10 75 15 85 30 85C45 85 50 65 50 65C50 65 55 85 70 85C85 85 90 75 90 75C90 75 87 60 80 45C73 30 65 20 50 20Z" 
      fill="currentColor"
    />
    <path 
      d="M30 55C30 55 35 45 45 45C55 45 50 65 50 65" 
      stroke="currentColor" 
      strokeWidth="8" 
      strokeLinecap="round"
      fill="none"
    />
    <path 
      d="M70 55C70 55 65 45 55 45C45 45 50 65 50 65" 
      stroke="currentColor" 
      strokeWidth="8" 
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

// Google Ads Logo SVG Component (Official Colors)
const GoogleAdsLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 192 192" className={className}>
    {/* Yellow bar */}
    <path 
      d="M24.4 144.5L78.1 55.6L120.9 80.3L67.2 169.2C55.4 188.6 30.1 195.1 10.7 183.4C-8.7 171.6 0.6 163.9 24.4 144.5Z" 
      fill="#FBBC04"
    />
    {/* Blue bar */}
    <path 
      d="M167.6 144.5L113.9 55.6L71.1 80.3L124.8 169.2C136.6 188.6 161.9 195.1 181.3 183.4C200.7 171.6 191.4 163.9 167.6 144.5Z" 
      fill="#4285F4"
    />
    {/* Green circle */}
    <circle cx="96" cy="36" r="28" fill="#34A853"/>
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
      { to: '/dashboard/my-accounts', icon: <ShoppingBag size={20} />, label: 'My Purchases' },
      { to: '/dashboard/billing', icon: <CreditCard size={20} />, label: 'Billing' },
      { to: '/dashboard/profile', icon: <User size={20} />, label: 'Profile' },
    ];

    return (
      <div ref={ref} className="flex flex-col h-full overflow-y-auto premium-scrollbar">
        {/* Logo Section */}
        <div className="p-5 border-b border-white/5">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-2 bg-white rounded-xl">
              <Zap size={18} className="text-black" />
            </div>
            <span className="text-[22px] font-bold text-white tracking-tight">PromptHero</span>
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
            <div className="p-1.5 bg-white rounded-lg">
              <Zap size={16} className="text-black" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">PromptHero</span>
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