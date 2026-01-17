import { Link, useLocation } from 'react-router-dom';
import { FileText, Bot, CreditCard, MessageCircle, LogOut } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navItems = [
  { icon: FileText, label: 'All Prompts', path: '/dashboard/prompts' },
  { icon: Bot, label: 'AI Marketplace', path: '/dashboard/ai-accounts' },
  { icon: CreditCard, label: 'Billing', path: '/dashboard/billing' },
  { icon: MessageCircle, label: 'Chat Support', path: '/dashboard/chat' },
];

const DashboardTabBar = () => {
  const location = useLocation();
  const { user, signOut } = useAuthContext();

  // Fetch unread messages count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('sender_type', 'admin')
        .eq('is_read', false);
      
      if (error) return 0;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-16 bg-white border-r border-gray-100 flex-col items-center py-4 z-30">
      <TooltipProvider delayDuration={100}>
        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col items-center gap-2">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            const showBadge = item.path === '/dashboard/chat' && unreadCount > 0;

            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    className={`
                      relative w-11 h-11 rounded-xl flex items-center justify-center
                      transition-all duration-200 group
                      ${active 
                        ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30' 
                        : 'text-gray-400 hover:bg-violet-50 hover:text-violet-600'
                      }
                    `}
                  >
                    <Icon size={20} className={active ? 'drop-shadow-sm' : ''} />
                    
                    {/* Unread Badge */}
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Sign Out Button */}
        <div className="pt-4 border-t border-gray-100 mt-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleSignOut}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
              >
                <LogOut size={20} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              Sign Out
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </aside>
  );
};

export default DashboardTabBar;
