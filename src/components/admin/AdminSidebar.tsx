import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  CreditCard, 
  FolderOpen,
  LogOut,
  Menu,
  X,
  Shield,
  Bot,
  Package,
  RefreshCcw,
  XCircle
} from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import theLogo from '@/assets/the-logo.png';

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
        ? 'bg-red-600 text-white'
        : 'text-gray-400 hover:text-white hover:bg-gray-800'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
);

const AdminSidebar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { adminLogout } = useAdmin();

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', to: '/admin' },
    { icon: <FileText size={20} />, label: 'Prompts', to: '/admin/prompts' },
    { icon: <FolderOpen size={20} />, label: 'Categories', to: '/admin/categories' },
    { icon: <Users size={20} />, label: 'Users', to: '/admin/users' },
    { icon: <CreditCard size={20} />, label: 'Purchases', to: '/admin/purchases' },
    { icon: <Bot size={20} />, label: 'AI Accounts', to: '/admin/ai-accounts' },
    { icon: <Package size={20} />, label: 'Account Orders', to: '/admin/account-orders' },
    { icon: <RefreshCcw size={20} />, label: 'Refund Requests', to: '/admin/refunds' },
    { icon: <XCircle size={20} />, label: 'Cancellations', to: '/admin/cancellations' },
  ];

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6 border-b border-gray-800">
        <img src={theLogo} alt="THE" className="h-8" />
        <span className="text-xs text-red-400 flex items-center gap-1">
          <Shield size={12} /> Admin Panel
        </span>
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
          onClick={adminLogout}
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
          <img src={theLogo} alt="THE" className="h-6" />
          <span className="text-lg font-bold text-white">Admin</span>
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

export default AdminSidebar;
