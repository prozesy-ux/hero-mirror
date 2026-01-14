import { Routes, Route } from 'react-router-dom';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import PromptsGrid from '@/components/dashboard/PromptsGrid';
import ProfileSection from '@/components/dashboard/ProfileSection';
import BillingSection from '@/components/dashboard/BillingSection';
import { useAuthContext } from '@/contexts/AuthContext';
import { Sparkles, FileText, Heart, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DashboardHome = () => {
  const { profile, isPro } = useAuthContext();
  const [stats, setStats] = useState({ totalPrompts: 0, favorites: 0, freePrompts: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: prompts } = await supabase.from('prompts').select('id, is_free');
    const { data: favorites } = await supabase
      .from('favorites')
      .select('id');

    setStats({
      totalPrompts: prompts?.length || 0,
      favorites: favorites?.length || 0,
      freePrompts: prompts?.filter(p => p.is_free).length || 0
    });
  };

  return (
    <div>
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {profile?.full_name || 'User'}! 👋
        </h1>
        <p className="text-gray-300">
          {isPro 
            ? 'You have full access to all premium prompts.' 
            : 'Upgrade to Pro to unlock all 10,000+ premium prompts!'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-600/20 rounded-xl">
              <FileText size={24} className="text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Prompts</p>
              <p className="text-2xl font-bold text-white">{stats.totalPrompts}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-600/20 rounded-xl">
              <Sparkles size={24} className="text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Free Prompts</p>
              <p className="text-2xl font-bold text-white">{stats.freePrompts}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-600/20 rounded-xl">
              <Heart size={24} className="text-red-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Your Favorites</p>
              <p className="text-2xl font-bold text-white">{stats.favorites}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-600/20 rounded-xl">
              <TrendingUp size={24} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Your Plan</p>
              <p className="text-2xl font-bold text-white">{isPro ? 'Pro' : 'Free'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent/Featured Prompts */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Featured Prompts</h2>
        <PromptsGrid />
      </div>
    </div>
  );
};

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-950">
      <DashboardSidebar />
      
      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="prompts" element={<PromptsGrid />} />
            <Route path="favorites" element={<PromptsGrid showFavoritesOnly />} />
            <Route path="billing" element={<BillingSection />} />
            <Route path="profile" element={<ProfileSection />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
