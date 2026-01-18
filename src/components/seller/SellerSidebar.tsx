import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSellerContext } from '@/contexts/SellerContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquare,
  Wallet,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Headphones
} from 'lucide-react';

const navItems = [
  { path: '/seller', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/seller/products', icon: Package, label: 'Products' },
  { path: '/seller/orders', icon: ShoppingCart, label: 'Orders' },
  { path: '/seller/chat', icon: MessageSquare, label: 'Messages' },
  { path: '/seller/wallet', icon: Wallet, label: 'Wallet' },
  { path: '/seller/support', icon: Headphones, label: 'Support' },
  { path: '/seller/settings', icon: Settings, label: 'Settings' },
];

const SidebarContent = ({ isCollapsed, onCollapse }: { isCollapsed: boolean; onCollapse?: () => void }) => {
  const { profile, orders } = useSellerContext();
  const { signOut } = useAuthContext();
  const navigate = useNavigate();

  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      {/* Store Header */}
      <div className={cn(
        "flex items-center gap-3 border-b border-slate-100 p-4",
        isCollapsed && "justify-center p-3"
      )}>
        <Avatar className="h-10 w-10 ring-2 ring-emerald-100">
          <AvatarImage src={profile.store_logo_url || undefined} />
          <AvatarFallback className="bg-emerald-50 text-emerald-600 font-semibold">
            {profile.store_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-slate-900 truncate text-sm">{profile.store_name}</h2>
            <div className="flex items-center gap-1.5">
              {profile.is_verified ? (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-emerald-50 text-emerald-600 border-emerald-200">
                  Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-amber-50 text-amber-600 border-amber-200">
                  Pending
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => (
          <Tooltip key={item.path} delayDuration={0}>
            <TooltipTrigger asChild>
              <NavLink
                to={item.path}
                end={item.exact}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all relative",
                  isActive 
                    ? "bg-emerald-50 text-emerald-600" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
                {item.path === '/seller/orders' && pendingOrders > 0 && (
                  <span className={cn(
                    "absolute bg-emerald-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center",
                    isCollapsed ? "top-0 right-0" : "ml-auto"
                  )}>
                    {pendingOrders}
                  </span>
                )}
              </NavLink>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" className="font-medium">
                {item.label}
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 p-2 space-y-1">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50",
            isCollapsed && "justify-center px-2"
          )}
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="ml-3">Sign Out</span>}
        </Button>

        {onCollapse && (
          <Button
            variant="ghost"
            size="icon"
            className="w-full text-slate-400 hover:text-slate-600"
            onClick={onCollapse}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

const SellerSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-4 z-50 lg:hidden bg-white shadow-sm border border-slate-200"
          >
            <Menu className="h-5 w-5 text-slate-600" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent isCollapsed={false} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 transition-all duration-300",
        isCollapsed ? "w-16" : "w-60"
      )}>
        <SidebarContent 
          isCollapsed={isCollapsed} 
          onCollapse={() => setIsCollapsed(!isCollapsed)} 
        />
      </aside>
    </>
  );
};

export default SellerSidebar;
