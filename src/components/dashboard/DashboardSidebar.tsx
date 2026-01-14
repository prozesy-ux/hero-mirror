import { useState, forwardRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, Heart, CreditCard, User, LogOut, Menu, X, 
  Crown, Wrench, Bot, ShoppingBag, Megaphone, ExternalLink, Zap
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';

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
      className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-300 ${
        isActive 
          ? 'bg-white text-black' 
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className={`transition-transform duration-300 ${isActive ? '' : 'group-hover:scale-110'}`}>
        {icon}
      </span>
      <span className="font-medium text-sm">{label}</span>
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
      <div ref={ref} className="flex flex-col h-full overflow-y-auto">
        {/* Logo Section */}
        <div className="p-4 border-b border-white/5">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-1.5 bg-white rounded-lg">
              <Zap size={18} className="text-black" />
            </div>
            <span className="text-xl font-bold text-white">PromptHero</span>
          </Link>
        </div>

        {/* User Card */}
        <div className="p-3 mx-3 my-3 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-2">
            <div className="relative flex-shrink-0">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black text-sm font-bold ring-2 ring-white/20">
                  {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                </div>
              )}
              {profile?.is_pro && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                  <Crown size={8} className="text-black" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{profile?.full_name || 'User'}</p>
              <p className="text-gray-400 text-xs truncate">{profile?.email}</p>
            </div>
          </div>
          {profile?.is_pro && (
            <div className="mt-2 px-2 py-1 bg-amber-400/10 rounded-lg border border-amber-400/20">
              <span className="text-xs font-medium text-amber-400 flex items-center gap-1">
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
          <div className="p-4 rounded-xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-2 mb-3">
              <Megaphone size={18} className="text-white" />
              <span className="text-sm font-semibold text-white">Ads Agency Service</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              We provide Meta & Google Ads services to grow your business
            </p>
            <div className="flex gap-2 mb-3">
              <a
                href="https://business.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-medium rounded-lg transition-colors border border-blue-500/20"
              >
                Meta
                <ExternalLink size={10} />
              </a>
              <a
                href="https://ads.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs font-medium rounded-lg transition-colors border border-green-500/20"
              >
                Google
                <ExternalLink size={10} />
              </a>
            </div>
            <a
              href="mailto:contact@agency.com"
              className="block w-full text-center px-3 py-2 bg-white hover:bg-gray-100 text-black text-xs font-semibold rounded-lg transition-all"
            >
              Contact Agency →
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
            <span className="font-medium">Sign Out</span>
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
          <Link to="/" className="flex items-center gap-2">
            <div className="p-1.5 bg-white rounded-lg">
              <Zap size={16} className="text-black" />
            </div>
            <span className="text-xl font-bold text-white">PromptHero</span>
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
        <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-60 bg-[#0a0a0a] border-r border-white/5 pt-16 animate-slide-in-left">
          <SidebarContent onNavClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen w-60 bg-[#0a0a0a] border-r border-white/5">
        <SidebarContent />
      </div>
    </>
  );
};

export default DashboardSidebar;
