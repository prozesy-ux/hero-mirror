import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, Bell, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileHeaderProps {
  avatarUrl?: string | null;
  name: string;
  subtitle: string;
  isOnline?: boolean;
  isVerified?: boolean;
  isPro?: boolean;
  gradient?: 'violet' | 'emerald';
  avatarLoading?: boolean;
  onAvatarClick?: () => void;
  onNotificationClick?: () => void;
  notificationCount?: number;
}

const ProfileHeader = ({
  avatarUrl,
  name,
  subtitle,
  isOnline = false,
  isVerified = false,
  isPro = false,
  gradient = 'violet',
  avatarLoading = false,
  onAvatarClick,
  onNotificationClick,
  notificationCount = 0
}: ProfileHeaderProps) => {
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const gradientClasses = {
    violet: 'from-violet-500 via-purple-500 to-violet-600',
    emerald: 'from-emerald-500 via-teal-500 to-emerald-600'
  };

  return (
    <div className={cn(
      "relative w-full bg-gradient-to-br rounded-2xl overflow-hidden",
      gradientClasses[gradient]
    )}>
      {/* Header content */}
      <div className="px-5 py-6 sm:px-6 sm:py-7">
        <div className="flex items-center gap-4">
          {/* Avatar with camera overlay */}
          <div className="relative">
            <Avatar className="h-[72px] w-[72px] border-4 border-white/90 shadow-lg">
              <AvatarImage 
                src={avatarUrl || ''} 
                alt={name} 
                className="object-cover"
              />
              <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            
            {/* Camera overlay - always visible */}
            <button
              onClick={onAvatarClick}
              disabled={avatarLoading}
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer transition-all hover:bg-black/50"
            >
              {avatarLoading ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </button>
            
            {/* Online status dot */}
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full shadow-sm" />
            )}
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                {name || 'User'}
              </h2>
              {isVerified && (
                <CheckCircle className="w-4 h-4 text-white/90 flex-shrink-0" />
              )}
              {isPro && (
                <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded-full uppercase tracking-wide">
                  PRO
                </span>
              )}
            </div>
            
            {/* Online status text */}
            {isOnline && (
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs text-white/80 font-medium">Online</span>
              </div>
            )}
            
            <p className="text-xs text-white/70 mt-1 truncate">
              {subtitle}
            </p>
          </div>

          {/* Notification bell */}
          {onNotificationClick && (
            <button
              onClick={onNotificationClick}
              className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <Bell className="h-5 w-5 text-white" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
