import { useEffect, useState } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Check,
  Sparkles,
  User,
  Package,
  Users,
  DollarSign,
  Wallet,
  Star,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TrustScore {
  trust_score: number;
  total_reports: number;
  successful_orders: number;
  buyer_approved_count: number;
}

interface MilestoneCard {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  completed: boolean;
  action?: () => void;
}

const SellerDashboard = () => {
  const { profile, wallet, products, orders, loading } = useSellerContext();
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.id) {
      fetchTrustScore();
    }
  }, [profile?.id]);

  // Real-time subscription for trust score updates
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('trust-score-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'seller_trust_scores',
        filter: `seller_id=eq.${profile.id}`
      }, () => {
        fetchTrustScore();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  const fetchTrustScore = async () => {
    if (!profile?.id) return;
    
    const { data } = await supabase
      .from('seller_trust_scores')
      .select('trust_score, total_reports, successful_orders, buyer_approved_count')
      .eq('seller_id', profile.id)
      .single();
    
    if (data) {
      setTrustScore(data);
    }
  };

  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const totalEarnings = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + (Number(o.seller_earning) || 0), 0);
  const hasWithdrawal = (wallet?.balance || 0) > 0 || totalEarnings > 0;

  // Milestone cards - Gumroad style "Getting Started"
  const milestones: MilestoneCard[] = [
    {
      id: 'welcome',
      icon: Sparkles,
      title: 'Welcome aboard',
      subtitle: 'Your account is created',
      completed: true
    },
    {
      id: 'profile',
      icon: User,
      title: 'Make an impression',
      subtitle: 'Complete your profile',
      completed: !!(profile?.store_description || (profile as any)?.store_logo_url),
      action: () => navigate('/seller/settings')
    },
    {
      id: 'product',
      icon: Package,
      title: 'Showtime',
      subtitle: 'Add your first product',
      completed: products.length > 0,
      action: () => navigate('/seller/products')
    },
    {
      id: 'follower',
      icon: Users,
      title: 'Build your tribe',
      subtitle: 'Get your first customer',
      completed: orders.length > 0
    },
    {
      id: 'sale',
      icon: DollarSign,
      title: 'Cha-ching',
      subtitle: 'Make your first sale',
      completed: completedOrders > 0
    },
    {
      id: 'payout',
      icon: Wallet,
      title: 'Money inbound',
      subtitle: 'Receive your first payout',
      completed: hasWithdrawal,
      action: () => navigate('/seller/wallet')
    }
  ];

  const completedCount = milestones.filter(m => m.completed).length;
  const progressPercent = (completedCount / milestones.length) * 100;

  if (loading) {
    return (
      <div className="space-y-6 seller-dashboard p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="seller-dashboard p-6 max-w-5xl">
      {/* Getting Started Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-black">Getting started</h2>
          <span className="text-sm text-black/50">{completedCount}/{milestones.length} complete</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-1 bg-black/10 rounded-full mb-6">
          <div 
            className="h-full bg-[#ff90e8] rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Milestone Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {milestones.map((milestone) => {
            const Icon = milestone.icon;
            return (
              <button
                key={milestone.id}
                onClick={milestone.action}
                disabled={!milestone.action}
                className={`relative flex flex-col items-center justify-center p-6 rounded-lg border text-center transition-all ${
                  milestone.completed
                    ? 'bg-white border-black/10'
                    : 'bg-white border-black hover:bg-black/5 cursor-pointer'
                } ${!milestone.action ? 'cursor-default' : ''}`}
              >
                {/* Completion Checkmark */}
                {milestone.completed && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#23a094] flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
                
                {/* Icon */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                  milestone.completed ? 'bg-black/5' : 'bg-[#ff90e8]/20'
                }`}>
                  <Icon size={24} className={milestone.completed ? 'text-black/40' : 'text-black'} />
                </div>
                
                {/* Text */}
                <h3 className={`font-semibold text-sm mb-1 ${
                  milestone.completed ? 'text-black/40' : 'text-black'
                }`}>
                  {milestone.title}
                </h3>
                <p className={`text-xs ${
                  milestone.completed ? 'text-black/30' : 'text-black/50'
                }`}>
                  {milestone.subtitle}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats Summary - Minimal */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-black/10 rounded-lg p-4">
          <p className="text-sm text-black/50 mb-1">Balance</p>
          <p className="text-2xl font-semibold text-black">${(wallet?.balance || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white border border-black/10 rounded-lg p-4">
          <p className="text-sm text-black/50 mb-1">Total Earnings</p>
          <p className="text-2xl font-semibold text-black">${totalEarnings.toFixed(2)}</p>
        </div>
        <div className="bg-white border border-black/10 rounded-lg p-4">
          <p className="text-sm text-black/50 mb-1">Products</p>
          <p className="text-2xl font-semibold text-black">{products.length}</p>
        </div>
        <div className="bg-white border border-black/10 rounded-lg p-4">
          <p className="text-sm text-black/50 mb-1">Sales</p>
          <p className="text-2xl font-semibold text-black">{completedOrders}</p>
        </div>
      </div>

      {/* Trust Score - if available */}
      {trustScore && (
        <div className="bg-white border border-black/10 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-black mb-1">Trust Score</h3>
              <p className="text-sm text-black/50">Based on your performance</p>
            </div>
            <div className="flex items-center gap-2">
              <Star size={20} className="text-[#ff90e8]" />
              <span className="text-3xl font-bold text-black">{trustScore.trust_score}%</span>
            </div>
          </div>
          <div className="flex gap-6 mt-4 pt-4 border-t border-black/10">
            <div>
              <p className="text-lg font-semibold text-black">{trustScore.successful_orders}</p>
              <p className="text-xs text-black/50">Successful Orders</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-black">{trustScore.buyer_approved_count}</p>
              <p className="text-xs text-black/50">Buyer Approved</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-black">{trustScore.total_reports}</p>
              <p className="text-xs text-black/50">Reports</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;