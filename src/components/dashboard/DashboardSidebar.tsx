import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, Heart, CreditCard, User, LogOut, Menu, X, 
  Crown, Wrench, Bot, ShoppingBag
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

const NavItem = ({ to, icon, label, isActive, onClick }: NavItemProps) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive 
        ? 'bg-purple-600 text-white' 
        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
);

const DashboardSidebar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-800">
        <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          PromptHero
        </Link>
      </div>

      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
            {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{profile?.full_name || 'User'}</p>
            <p className="text-gray-400 text-sm truncate">{profile?.email}</p>
          </div>
          {profile?.is_pro && (
            <span className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full">
              <Crown size={12} />
              PRO
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            isActive={location.pathname === item.to}
            onClick={() => setMobileMenuOpen(false)}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            PromptHero
          </Link>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white p-2">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-gray-900 pt-16">
          <SidebarContent />
        </div>
      )}

      <div className="hidden lg:block fixed left-0 top-0 h-screen w-64 bg-gray-900 border-r border-gray-800">
        <SidebarContent />
      </div>
    </>
  );
};

export default DashboardSidebar;
