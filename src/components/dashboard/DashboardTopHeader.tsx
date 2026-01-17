import { Link } from 'react-router-dom';
import { Crown, Bell } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSidebarContext } from './DashboardSidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const DashboardTopHeader = () => {
  const { profile, signOut } = useAuthContext();
  const { isCollapsed } = useSidebarContext();

  return (
    <header 
      className={`
        hidden lg:flex fixed top-0 right-0 z-40
        h-16 items-center justify-end
        bg-white/80 backdrop-blur-xl border-b border-gray-100
        px-6 transition-all duration-300 ease-in-out
        ${isCollapsed ? 'left-[72px]' : 'left-72'}
      `}
    >
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button className="relative p-2.5 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200">
                <Bell size={20} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-gray-900 text-white border-gray-800">
              Notifications
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Profile Avatar with Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative group focus:outline-none">
              <div className="rounded-full bg-gradient-to-br from-violet-500 to-purple-600 p-0.5 w-10 h-10 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-violet-500/25">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Avatar" 
                    className="w-full h-full rounded-full object-cover bg-white"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm">
                    {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              {/* PRO Crown badge */}
              {profile?.is_pro && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center ring-1.5 ring-white shadow-md">
                  <Crown size={8} className="text-black" />
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-xl rounded-xl p-1">
            <DropdownMenuLabel className="px-3 py-2">
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900">{profile?.full_name || 'User'}</span>
                <span className="text-xs text-gray-500 truncate">{profile?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-100" />
            <DropdownMenuItem asChild>
              <Link to="/dashboard/profile" className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 rounded-lg">
                Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/dashboard/billing" className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 rounded-lg">
                Billing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-100" />
            <DropdownMenuItem 
              onClick={signOut}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg"
            >
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardTopHeader;
