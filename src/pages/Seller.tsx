import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Store, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import { SellerProvider } from '@/contexts/SellerContext';
import { SellerSidebarProvider, useSellerSidebarContext } from '@/contexts/SellerSidebarContext';
import SellerSidebar from '@/components/seller/SellerSidebar';
import SellerTopBar from '@/components/seller/SellerTopBar';
import SellerMobileHeader from '@/components/seller/SellerMobileHeader';
import SellerMobileNavigation from '@/components/seller/SellerMobileNavigation';
import SellerDashboard from '@/components/seller/SellerDashboard';
import SellerProducts from '@/components/seller/SellerProducts';
import SellerOrders from '@/components/seller/SellerOrders';
import SellerChat from '@/components/seller/SellerChat';
import SellerWallet from '@/components/seller/SellerWallet';
import SellerSupport from '@/components/seller/SellerSupport';
import SellerSettings from '@/components/seller/SellerSettings';
import SellerFeatureRequests from '@/components/seller/SellerFeatureRequests';

interface SellerProfile {
  id: string;
  user_id: string;
  store_name: string;
  store_description: string | null;
  store_logo_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  commission_rate: number;
  total_sales: number;
  total_orders: number;
}

// Seller Registration Form
const SellerRegistration = ({ onSuccess }: { onSuccess: () => void }) => {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    store_name: '',
    store_description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.store_name.trim()) {
      toast.error('Store name is required');
      return;
    }

    setLoading(true);
    try {
      const { error: profileError } = await supabase
        .from('seller_profiles')
        .insert({
          user_id: user.id,
          store_name: formData.store_name.trim(),
          store_description: formData.store_description.trim() || null
        });

      if (profileError) throw profileError;

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: 'seller' });

      if (roleError && !roleError.message.includes('duplicate')) {
        console.error('Role error:', roleError);
      }

      toast.success('Application submitted!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 h-14 w-14 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Store className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Become a Seller</h1>
            <p className="text-slate-500 text-sm mt-2">
              Create your store and start selling
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="store_name">Store Name</Label>
              <Input
                id="store_name"
                placeholder="Your Store Name"
                value={formData.store_name}
                onChange={(e) => setFormData(prev => ({ ...prev, store_name: e.target.value }))}
                className="border-slate-200"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store_description">Description (optional)</Label>
              <Textarea
                id="store_description"
                placeholder="Tell buyers about your store..."
                value={formData.store_description}
                onChange={(e) => setFormData(prev => ({ ...prev, store_description: e.target.value }))}
                rows={3}
                className="border-slate-200"
              />
            </div>

            <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Application
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Pending Approval Screen
const PendingApproval = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-xl bg-amber-50 flex items-center justify-center">
          <Clock className="h-7 w-7 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Pending Approval</h1>
        <p className="text-slate-500 text-sm mb-6">
          Your application is being reviewed. You'll be notified once approved.
        </p>
        <Button variant="outline" onClick={() => window.location.href = '/dashboard'} className="border-slate-200">
          Back to Dashboard
        </Button>
      </div>
    </div>
  </div>
);

// Suspended Screen
const SuspendedAccount = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-xl bg-red-50 flex items-center justify-center">
          <AlertTriangle className="h-7 w-7 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Account Suspended</h1>
        <p className="text-slate-500 text-sm mb-6">
          Your account has been suspended. Contact support for more information.
        </p>
        <Button variant="outline" onClick={() => window.location.href = '/dashboard'} className="border-slate-200">
          Back to Dashboard
        </Button>
      </div>
    </div>
  </div>
);

// Main Content Area with dynamic margin
const SellerMainContent = () => {
  const { isCollapsed } = useSellerSidebarContext();
  
  return (
    <main className={`
      min-h-screen bg-slate-50 transition-all duration-300
      pt-16 pb-20 lg:pb-0
      lg:pt-16 ${isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-60'}
    `}>
      <Routes>
        <Route path="/" element={<SellerDashboard />} />
        <Route path="/products" element={<SellerProducts />} />
        <Route path="/orders" element={<SellerOrders />} />
        <Route path="/chat" element={<SellerChat />} />
        <Route path="/wallet" element={<SellerWallet />} />
        <Route path="/feature-requests" element={<SellerFeatureRequests />} />
        <Route path="/support" element={<SellerSupport />} />
        <Route path="/settings" element={<SellerSettings />} />
      </Routes>
    </main>
  );
};

// Main Seller Content with Routes
const SellerContent = () => {
  return (
    <SellerSidebarProvider>
      <div className="min-h-screen bg-slate-50">
        {/* Mobile Header - Only visible on mobile */}
        <SellerMobileHeader />
        
        {/* Desktop Sidebar */}
        <SellerSidebar />
        
        {/* Desktop Top Header */}
        <SellerTopBar />
        
        {/* Main Content */}
        <SellerMainContent />
        
        {/* Mobile Bottom Navigation */}
        <SellerMobileNavigation />
      </div>
    </SellerSidebarProvider>
  );
};

// Main Seller Page
const Seller = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsRegistration, setNeedsRegistration] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/signin?redirect=/seller');
      return;
    }

    if (user) {
      checkSellerStatus();
    }
  }, [user, authLoading, isAuthenticated]);

  const checkSellerStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSellerProfile(data);
        setNeedsRegistration(false);
      } else {
        setNeedsRegistration(true);
      }
    } catch (error) {
      console.error('Error:', error);
      setNeedsRegistration(true);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (needsRegistration) {
    return <SellerRegistration onSuccess={checkSellerStatus} />;
  }

  if (sellerProfile && !sellerProfile.is_verified) {
    return <PendingApproval />;
  }

  if (sellerProfile && !sellerProfile.is_active) {
    return <SuspendedAccount />;
  }

  if (sellerProfile) {
    return (
      <SellerProvider sellerProfile={sellerProfile}>
        <SellerContent />
      </SellerProvider>
    );
  }

  return null;
};

export default Seller;
