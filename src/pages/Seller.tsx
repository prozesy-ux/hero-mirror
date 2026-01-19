import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Store, ArrowRight, AlertTriangle, Mail, Lock, User, Clock } from 'lucide-react';
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
import SellerAnalytics from '@/components/seller/SellerAnalytics';

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

// Seller Auth Form - Login/Signup on same page
const SellerAuthForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast.success('Account created! Setting up your seller profile...');
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success('Welcome back!');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Google sign-in failed');
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
              {isSignUp ? 'Create an account to start selling' : 'Sign in to access your store'}
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex mb-6 bg-slate-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                !isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Google Auth */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4 border-slate-200"
            onClick={handleGoogleAuth}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="fullName"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 border-slate-200"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 border-slate-200"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 border-slate-200"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-emerald-500 hover:bg-emerald-600" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

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
          store_description: formData.store_description.trim() || null,
          is_verified: true,  // Auto-approve stores
          is_active: true
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
        <Route path="/analytics" element={<SellerAnalytics />} />
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
    // Don't redirect - we show auth form inline
    if (user) {
      checkSellerStatus();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

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

  // Show inline auth form if not logged in
  if (!isAuthenticated) {
    return <SellerAuthForm onSuccess={() => {
      setLoading(true);
      // Re-check after short delay for auth state to update
      setTimeout(() => checkSellerStatus(), 500);
    }} />;
  }

  if (needsRegistration) {
    return <SellerRegistration onSuccess={checkSellerStatus} />;
  }

  // Skip pending approval - stores are auto-approved now
  // if (sellerProfile && !sellerProfile.is_verified) {
  //   return <PendingApproval />;
  // }

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
