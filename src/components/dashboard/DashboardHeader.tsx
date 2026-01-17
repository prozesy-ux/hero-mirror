import { Link } from 'react-router-dom';
import { Bell, Settings } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Crown } from 'lucide-react';

const DashboardHeader = () => {
  const { profile } = useAuthContext();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
      <div className="h-full flex items-center justify-between px-4 lg:px-6">
        {/* Left side - Profile + Notification */}
        <div className="flex items-center gap-4">
          {/* Profile Avatar */}
          <Link to="/dashboard/profile" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="rounded-full bg-gradient-to-br from-violet-500 to-purple-600 p-0.5 w-10 h-10 transition-all duration-300 group-hover:scale-105">
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
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center ring-2 ring-white shadow-md">
                  <Crown size={8} className="text-black" />
                </div>
              )}
            </div>
            
            {/* User Info - Hidden on mobile */}
            <div className="hidden md:flex flex-col">
              <span className="text-sm font-semibold text-gray-900 group-hover:text-violet-600 transition-colors">
                {profile?.full_name || 'User'}
              </span>
              <span className="text-xs text-gray-500">
                {profile?.is_pro ? 'PRO Member' : 'Free Plan'}
              </span>
            </div>
          </Link>

          {/* Notification Bell */}
          <button className="relative p-2.5 rounded-xl text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-all duration-200">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>
        </div>

        {/* Center - Page Title / Logo */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-lg font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            PromptHero
          </span>
        </div>

        {/* Right side - Settings */}
        <div className="flex items-center gap-2">
          <Link 
            to="/dashboard/profile"
            className="p-2.5 rounded-xl text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-all duration-200"
          >
            <Settings size={20} />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
