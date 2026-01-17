import { Link } from 'react-router-dom';
import { Crown, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSidebarContext } from '@/contexts/SidebarContext';
import metaLogo from '@/assets/meta-logo.png';
import googleAdsLogo from '@/assets/google-ads-logo.png';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const DashboardSidebar = () => {
  const { profile } = useAuthContext();
  const { isCollapsed, toggleSidebar } = useSidebarContext();

  return (
    <TooltipProvider>
      <aside 
        className={`hidden lg:flex flex-col fixed left-0 top-16 bottom-0 z-40 bg-white border-r border-gray-200 transition-all duration-300 ${
          isCollapsed ? 'w-[72px]' : 'w-60'
        }`}
      >
        {/* Profile Section */}
        <div className={`p-4 border-b border-gray-100 ${isCollapsed ? 'px-3' : ''}`}>
          <Link 
            to="/dashboard/profile" 
            className={`flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors ${isCollapsed ? 'justify-center p-2' : ''}`}
          >
            <div className="relative flex-shrink-0">
              <div className="rounded-full bg-gradient-to-br from-violet-500 to-purple-600 p-0.5 w-10 h-10">
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
              {profile?.is_pro && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center ring-2 ring-white">
                  <Crown size={8} className="text-black" />
                </div>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1.5">
                  {profile?.full_name || 'User'}
                  {profile?.is_pro && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded text-[9px] font-bold text-black">
                      PRO
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
              </div>
            )}
          </Link>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Ads Agency Card - White Design with Meta & Google Logos */}
        {!isCollapsed ? (
          <div className="p-3">
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              {/* Logos Row */}
              <div className="flex items-center justify-center gap-4 mb-3">
                <div className="w-10 h-10 bg-white rounded-lg border border-gray-100 flex items-center justify-center p-1.5 shadow-sm">
                  <img src={metaLogo} alt="Meta" className="w-full h-full object-contain" />
                </div>
                <div className="w-10 h-10 bg-white rounded-lg border border-gray-100 flex items-center justify-center p-1.5 shadow-sm">
                  <img src={googleAdsLogo} alt="Google Ads" className="w-full h-full object-contain" />
                </div>
              </div>
              
              {/* Content */}
              <div className="text-center">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Ads Agency</h3>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                  Get professional ad campaigns managed by experts
                </p>
                <button className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md">
                  Learn More
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="p-3">
                <div className="w-full aspect-square bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex flex-col gap-1">
                    <img src={metaLogo} alt="Meta" className="w-6 h-6 object-contain mx-auto" />
                    <img src={googleAdsLogo} alt="Google" className="w-6 h-6 object-contain mx-auto" />
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-gray-900 text-white border-0">
              <p>Ads Agency</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={toggleSidebar}
            className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            {isCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <>
                <ChevronLeft size={18} />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default DashboardSidebar;
