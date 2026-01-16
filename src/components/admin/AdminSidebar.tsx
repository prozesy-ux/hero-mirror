import { useState, forwardRef, createContext, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  XCircle,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Trash2,
  Settings
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Context for sidebar collapse state
interface AdminSidebarContextType {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const AdminSidebarContext = createContext<AdminSidebarContextType>({
  isCollapsed: false,
  toggleCollapse: () => {},
});

export const useAdminSidebarContext = () => useContext(AdminSidebarContext);

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  active?: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
}

const NavItem = forwardRef<HTMLAnchorElement, NavItemProps>(
  ({ icon, label, to, active, isCollapsed, onClick }, ref) => {
    const linkContent = (
      <Link
        ref={ref}
        to={to}
        onClick={onClick}
        className={`group flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-300 ${
          active 
            ? 'bg-white text-black' 
            : 'text-gray-400 hover:bg-[#1a1a1e] hover:text-white'
        } ${isCollapsed ? 'justify-center' : ''}`}
      >
        <span className={`transition-transform duration-300 flex-shrink-0 ${active ? '' : 'group-hover:scale-110'}`}>
          {icon}
        </span>
        {!isCollapsed && (
          <>
            <span className={`transition-all duration-200 ${
              active 
                ? 'font-semibold text-base tracking-tight' 
                : 'font-medium text-base tracking-normal'
            }`}>
              {label}
            </span>
            {active && (
              <span className="ml-auto w-2 h-2 rounded-full bg-black" />
            )}
          </>
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-[#1a1a24] text-white border-[#27272a]">
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  }
);

NavItem.displayName = 'NavItem';

interface SidebarContentProps {
  onNavClick?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SidebarContent = forwardRef<HTMLDivElement, SidebarContentProps>(
  ({ onNavClick, isCollapsed = false, onToggleCollapse }, ref) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut } = useAuthContext();

    const handleLogout = async () => {
      await signOut();
      navigate('/signin');
    };

    const navItems = [
      { icon: <LayoutDashboard size={22} />, label: 'Dashboard', to: '/admin' },
      { icon: <FileText size={22} />, label: 'Prompts', to: '/admin/prompts' },
      { icon: <FolderOpen size={22} />, label: 'Categories & Tools', to: '/admin/categories' },
      { icon: <Users size={22} />, label: 'Users', to: '/admin/users' },
      { icon: <CreditCard size={22} />, label: 'Purchases', to: '/admin/purchases' },
      { icon: <Wallet size={22} />, label: 'Wallets', to: '/admin/wallets' },
      { icon: <Settings size={22} />, label: 'Payment Settings', to: '/admin/payments' },
      { icon: <Bot size={22} />, label: 'AI Accounts', to: '/admin/ai-accounts' },
      { icon: <Package size={22} />, label: 'Account Orders', to: '/admin/account-orders' },
      { icon: <RefreshCcw size={22} />, label: 'Refund Requests', to: '/admin/refunds' },
      { icon: <XCircle size={22} />, label: 'Cancellations', to: '/admin/cancellations' },
      { icon: <Trash2 size={22} />, label: 'Deletions', to: '/admin/deletions' },
      { icon: <MessageCircle size={22} />, label: 'Support Chats', to: '/admin/chats' },
      { icon: <Shield size={22} />, label: 'Security Logs', to: '/admin/security' },
    ];

    return (
      <TooltipProvider>
        <div ref={ref} className="flex flex-col h-full overflow-y-auto premium-scrollbar pt-4">
          {/* Navigation */}
          <nav className={`flex-1 space-y-1.5 ${isCollapsed ? 'px-2' : 'px-4'}`}>
            {navItems.map((item) => (
              <NavItem
                key={item.to}
                icon={item.icon}
                label={item.label}
                to={item.to}
                active={location.pathname === item.to}
                isCollapsed={isCollapsed}
                onClick={onNavClick}
              />
            ))}
          </nav>

          {/* Sign Out + Collapse Toggle */}
          <div className={`p-4 border-t border-white/5 ${isCollapsed ? 'px-2' : ''}`}>
            <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'gap-2'}`}>
              {/* Sign Out Button */}
              {isCollapsed ? (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center p-3 w-full text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-300"
                    >
                      <LogOut size={22} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-[#1a1a24] text-white border-[#27272a]">
                    Sign Out
                  </TooltipContent>
                </Tooltip>
              ) : (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3.5 px-4 py-3 flex-1 text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-300"
                >
                  <LogOut size={22} />
                  <span className="font-medium text-base">Sign Out</span>
                </button>
              )}
              
              {/* Collapse Toggle Button */}
              {onToggleCollapse && (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onToggleCollapse}
                      className="p-3 rounded-xl bg-[#18181b] border border-[#27272a] hover:bg-[#1f1f23] text-gray-400 hover:text-white transition-all duration-300 flex-shrink-0"
                    >
                      {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-[#1a1a24] text-white border-[#27272a]">
                    {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  }
);

SidebarContent.displayName = 'SidebarContent';

const AdminSidebar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-sidebar-collapsed') === 'true';
    }
    return false;
  });

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('admin-sidebar-collapsed', String(newState));
  };

  return (
    <AdminSidebarContext.Provider value={{ isCollapsed, toggleCollapse }}>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-red-400" />
            <span className="text-sm font-semibold text-red-400">Admin Panel</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="p-2 text-white hover:bg-[#1a1a1e] rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/85"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-[#0a0a0a] border-r border-white/5 pt-16 animate-slide-in-left">
          <SidebarContent onNavClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Desktop Sidebar */}
      <div 
        className={`hidden lg:block fixed left-0 top-0 h-screen bg-[#0a0a0a] border-r border-white/5 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-[72px]' : 'w-72'
        }`}
      >
        <SidebarContent isCollapsed={isCollapsed} onToggleCollapse={toggleCollapse} />
      </div>
    </AdminSidebarContext.Provider>
  );
};

export { AdminSidebarContext };
export default AdminSidebar;
