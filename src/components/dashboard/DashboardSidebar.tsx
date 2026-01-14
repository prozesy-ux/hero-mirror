import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Heart, 
  CreditCard, 
  User, 
  LogOut,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import promptheroIcon from '@/assets/prompthero-icon.png';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem = ({ icon, label, to, active, onClick }: NavItemProps) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
      active
        ? 'bg-purple-600 text-white'
        : 'text-gray-400 hover:text-white hover:bg-gray-800'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
);

const DashboardSidebar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { profile, signOut, isPro } = useAuthContext();

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', to: '/dashboard' },
    { icon: <FileText size={20} />, label: 'All Prompts', to: '/dashboard/prompts' },
    { icon: <Heart size={20} />, label: 'Favorites', to: '/dashboard/favorites' },
    { icon: <CreditCard size={20} />, label: 'Billing', to: '/dashboard/billing' },
    { icon: <User size={20} />, label: 'Profile', to: '/dashboard/profile' },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6 border-b border-gray-800">
        <img src={promptheroIcon} alt="PromptHero" className="w-10 h-10 rounded-lg" />
        <span className="text-xl font-bold text-white">PromptHero</span>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
            {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">
              {profile?.full_name || 'User'}
            </p>
            <p className="text-gray-500 text-sm truncate">{profile?.email}</p>
          </div>
        </div>
        {isPro ? (
          <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full w-fit">
            <Sparkles size={14} className="text-yellow-300" />
            <span className="text-xs font-semibold text-white">PRO</span>
          </div>
        ) : (
          <Link
            to="/dashboard/billing"
            className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-full w-fit transition-colors"
          >
            <Sparkles size={14} className="text-purple-400" />
            <span className="text-xs font-medium text-gray-300">Upgrade to Pro</span>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            icon={item.icon}
            label={item.label}
            to={item.to}
            active={location.pathname === item.to}
            onClick={() => setMobileMenuOpen(false)}
          />
        ))}
      </nav>

      {/* Sign Out */}
      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={promptheroIcon} alt="PromptHero" className="w-8 h-8 rounded-lg" />
          <span className="text-lg font-bold text-white">PromptHero</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-400 hover:text-white"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-gray-900 pt-16">
          <SidebarContent />
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-gray-900 border-r border-gray-800">
        <SidebarContent />
      </aside>
    </>
  );
};

export default DashboardSidebar;
