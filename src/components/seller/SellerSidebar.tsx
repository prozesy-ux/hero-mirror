import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSellerContext } from '@/contexts/SellerContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  Store
} from 'lucide-react';

const navItems = [
  { path: '/seller', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/seller/products', icon: Package, label: 'Products' },
  { path: '/seller/orders', icon: ShoppingCart, label: 'Orders' },
  { path: '/seller/chat', icon: MessageSquare, label: 'Chat' },
  { path: '/seller/wallet', icon: Wallet, label: 'Wallet' },
  { path: '/seller/settings', icon: Settings, label: 'Settings' },
];

const SidebarContent = ({ isCollapsed, onCollapse }: { isCollapsed: boolean; onCollapse?: () => void }) => {
  const { profile } = useSellerContext();
  const { signOut } = useAuthContext();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-full flex-col bg-card border-r border-border">
      {/* Header */}
      <div className={cn(
        "flex items-center gap-3 border-b border-border p-4",
        isCollapsed && "justify-center"
      )}>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
          <Store className="h-5 w-5 text-emerald-500" />
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground truncate">{profile.store_name}</h2>
            <p className="text-xs text-muted-foreground">Seller Dashboard</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <Tooltip key={item.path} delayDuration={0}>
            <TooltipTrigger asChild>
              <NavLink
                to={item.path}
                end={item.exact}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive 
                    ? "bg-emerald-500/10 text-emerald-500" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                {item.label}
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2 space-y-2">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-muted-foreground hover:text-destructive",
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
            className="w-full"
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
            className="fixed left-4 top-4 z-50 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent isCollapsed={false} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
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
