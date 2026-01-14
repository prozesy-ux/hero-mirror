import { Routes, Route } from 'react-router-dom';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import PromptsGrid from '@/components/dashboard/PromptsGrid';
import ProfileSection from '@/components/dashboard/ProfileSection';
import BillingSection from '@/components/dashboard/BillingSection';
import AIToolsSection from '@/components/dashboard/AIToolsSection';
import AIAccountsSection from '@/components/dashboard/AIAccountsSection';
import MyPurchasedAccounts from '@/components/dashboard/MyPurchasedAccounts';
import { useAuthContext } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/ui/glass-card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Crown, FileText, Heart, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardHome = () => {
  const { profile, isPro } = useAuthContext();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const stats = [
    { label: 'Total Prompts', value: 10000, icon: <FileText className="text-purple-400" />, suffix: '+' },
    { label: 'Categories', value: 50, icon: <Zap className="text-pink-400" />, suffix: '+' },
    { label: 'Favorites', value: 0, icon: <Heart className="text-red-400" />, suffix: '' },
  ];

  return (
    <div className="animate-fade-up">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          {getGreeting()}, <span className="gradient-text">{profile?.full_name?.split(' ')[0] || 'User'}</span>
        </h1>
        <p className="text-gray-400 text-lg">
          {isPro ? 'Enjoy unlimited access to all premium prompts' : 'Upgrade to Pro to unlock all prompts'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, index) => (
          <GlassCard 
            key={stat.label} 
            className="group hover:scale-[1.02] transition-transform duration-300"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-white">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
                {stat.icon}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link to="/dashboard/prompts">
          <GlassCard 
            variant="gradient" 
            className="group cursor-pointer hover:scale-[1.02] transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Browse Prompts</h3>
                <p className="text-gray-400">Explore our collection of AI prompts</p>
              </div>
              <ArrowRight className="text-white opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </GlassCard>
        </Link>

        {!isPro && (
          <Link to="/dashboard/billing">
            <GlassCard 
              variant="glow" 
              className="group cursor-pointer hover:scale-[1.02] transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="text-yellow-400" />
                    <h3 className="text-xl font-semibold text-white">Upgrade to Pro</h3>
                  </div>
                  <p className="text-gray-400">Unlock all 10,000+ premium prompts</p>
                </div>
                <ArrowRight className="text-white opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </GlassCard>
          </Link>
        )}
      </div>

      {/* Recent Prompts */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Featured Prompts</h2>
        <PromptsGrid />
      </div>
    </div>
  );
};

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <DashboardSidebar />
      <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-8">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="prompts" element={<PromptsGrid />} />
            <Route path="favorites" element={<PromptsGrid showFavoritesOnly />} />
            <Route path="tools" element={<AIToolsSection />} />
            <Route path="ai-accounts" element={<AIAccountsSection />} />
            <Route path="my-accounts" element={<MyPurchasedAccounts />} />
            <Route path="billing" element={<BillingSection />} />
            <Route path="profile" element={<ProfileSection />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
