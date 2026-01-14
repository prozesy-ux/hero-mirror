import { Routes, Route } from 'react-router-dom';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import PromptsGrid from '@/components/dashboard/PromptsGrid';
import ProfileSection from '@/components/dashboard/ProfileSection';
import BillingSection from '@/components/dashboard/BillingSection';
import AIToolsSection from '@/components/dashboard/AIToolsSection';
import AIAccountsSection from '@/components/dashboard/AIAccountsSection';

const DashboardHome = () => {
  return (
    <div className="animate-fade-up">
      <PromptsGrid />
    </div>
  );
};

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <DashboardSidebar />
      <main className="lg:ml-60 pt-16 lg:pt-0 min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f18] to-[#12121f]">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(139, 92, 246, 0.5) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative p-6 lg:p-8">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="prompts" element={<PromptsGrid />} />
            <Route path="favorites" element={<PromptsGrid showFavoritesOnly />} />
            <Route path="tools" element={<AIToolsSection />} />
            <Route path="ai-accounts" element={<AIAccountsSection />} />
            <Route path="billing" element={<BillingSection />} />
            <Route path="profile" element={<ProfileSection />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;