import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSellerContext } from '@/contexts/SellerContext';
import { useSellerSidebarContext } from '@/contexts/SellerSidebarContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, TrendingUp, Sparkles } from 'lucide-react';

const SellerSidebar = () => {
  const { profile } = useSellerContext();
  const { isCollapsed, toggleSidebar } = useSellerSidebarContext();

  return (
    <aside className={cn(
      "hidden lg:flex flex-col h-screen fixed left-0 top-0 z-40 bg-white border-r border-slate-200 transition-all duration-300",
      isCollapsed ? "w-[72px]" : "w-60"
    )}>
      {/* Store Header */}
      <div className={cn(
        "flex items-center gap-3 border-b border-slate-100 p-4 h-16",
        isCollapsed && "justify-center px-2"
      )}>
        <Avatar className="h-10 w-10 ring-2 ring-emerald-100 flex-shrink-0">
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

      {/* Promotional Card */}
      <div className="flex-1 p-3">
        {!isCollapsed ? (
          <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
              <span className="font-semibold text-sm">Boost Sales</span>
            </div>
            <p className="text-xs text-emerald-100 mb-3">
              Get more visibility and reach more buyers with featured listings.
            </p>
            <Button
              size="sm"
              className="w-full bg-white text-emerald-600 hover:bg-emerald-50 text-xs h-8"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Learn More
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <div className="border-t border-slate-100 p-2">
        <Button
          variant="ghost"
          size="icon"
          className="w-full text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          onClick={toggleSidebar}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  );
};

export default SellerSidebar;
