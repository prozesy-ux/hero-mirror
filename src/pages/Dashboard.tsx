import { Routes, Route } from 'react-router-dom';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import PromptsGrid from '@/components/dashboard/PromptsGrid';
import ProfileSection from '@/components/dashboard/ProfileSection';
import BillingSection from '@/components/dashboard/BillingSection';
import AIToolsSection from '@/components/dashboard/AIToolsSection';
import AIAccountsSection from '@/components/dashboard/AIAccountsSection';
import MyPurchasedAccounts from '@/components/dashboard/MyPurchasedAccounts';

const DashboardHome = () => {
  return (
    <div className="animate-fade-up">
      <PromptsGrid />
    </div>
  );
};

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <DashboardSidebar />
      <main className="lg:ml-60 pt-16 lg:pt-0 min-h-screen">
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
