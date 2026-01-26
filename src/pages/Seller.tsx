import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Store, ArrowRight, AlertTriangle, Mail, Lock, User, Clock, Eye, EyeOff, Package, FileText } from 'lucide-react';
import { SellerProvider } from '@/contexts/SellerContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
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
import SellerInventory from '@/components/seller/SellerInventory';
import SellerCustomers from '@/components/seller/SellerCustomers';
import SellerMarketing from '@/components/seller/SellerMarketing';
import SellerReports from '@/components/seller/SellerReports';
import SellerPerformance from '@/components/seller/SellerPerformance';
import signinBackground from '@/assets/signin-background.webp';
import promptheroIcon from '@/assets/prompthero-icon.png';

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
  two_factor_enabled: boolean;
}

// Seller Auth Form - Same design as main SignIn page
const SellerAuthForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (isSignUp && password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, fullName);
      setLoading(false);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Account created successfully!");
        onSuccess();
      }
    } else {
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Welcome back!");
        onSuccess();
      }
    }
  };

  const handleGoogleAuth = async () => {
    // Override to redirect back to /seller instead of /dashboard
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/seller`
      }
    });
    if (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Left Side - Background Image */}
      <div className="relative hidden h-full min-h-dvh overflow-hidden lg:block lg:w-2/3">
        <img
          src={signinBackground}
          alt="Background"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-black/60 via-black/60 to-gray-900/60" />
        <div
          className="absolute inset-0 z-10"
          style={{
            backgroundImage: "radial-gradient(rgba(0, 0, 0, 0.15) 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12 text-center">
          <div className="space-y-3">
            <h1 className="text-4xl font-light tracking-tight text-white drop-shadow-lg">
              Become a Seller
            </h1>
            <p className="text-xl font-medium text-white/90 drop-shadow-md">
              Start selling on PromptHero
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex min-h-dvh w-full flex-col items-center bg-black text-white lg:w-1/3 lg:justify-center lg:p-8">
        {/* Mobile Background */}
        <div className="relative w-full overflow-hidden lg:hidden" style={{ minHeight: "180px" }}>
          <img
            src={signinBackground}
            alt="Background"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black" />
          <div className="relative z-10 flex h-full flex-col items-center justify-center p-8">
            <h1 className="text-2xl font-light text-white">Become a Seller</h1>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex w-full max-w-sm flex-col items-center px-6 py-8 lg:px-0">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="overflow-hidden rounded-2xl bg-white p-0.5 shadow-xl shadow-black/20">
              <img src={promptheroIcon} alt="PromptHero" className="h-14 w-14 rounded-xl" />
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex w-full rounded-lg bg-gray-800/50 p-1">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-all ${
                !isSignUp ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-all ${
                isSignUp ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form Card */}
          <div className="w-full rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
            {/* Google Button */}
            <button
              onClick={handleGoogleAuth}
              className="mb-5 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-700 bg-transparent px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-900/50 px-4 text-gray-500">Or continue with email</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name (Sign Up only) */}
              {isSignUp && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full rounded-lg border border-gray-700 bg-black/50 py-3 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-gray-700 bg-black/50 py-3 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-gray-700 bg-black/50 py-3 pl-10 pr-10 text-sm text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {isSignUp && (
                  <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {isSignUp ? "Creating account..." : "Signing in..."}
                  </>
                ) : (
                  <>{isSignUp ? "Create Account" : "Sign In"}</>
                )}
              </button>
            </form>

            {/* Terms */}
            {isSignUp && (
              <p className="mt-4 text-center text-xs text-gray-500">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            )}
          </div>
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
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Left Side - Background Image */}
      <div className="relative hidden h-full min-h-dvh overflow-hidden lg:block lg:w-2/3">
        <img
          src={signinBackground}
          alt="Background"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-black/60 via-black/60 to-gray-900/60" />
        <div
          className="absolute inset-0 z-10"
          style={{
            backgroundImage: "radial-gradient(rgba(0, 0, 0, 0.15) 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12 text-center">
          <div className="space-y-3">
            <h1 className="text-4xl font-light tracking-tight text-white drop-shadow-lg">
              Create Your Store
            </h1>
            <p className="text-xl font-medium text-white/90 drop-shadow-md">
              You're one step away from selling
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Store Form */}
      <div className="flex min-h-dvh w-full flex-col items-center bg-black text-white lg:w-1/3 lg:justify-center lg:p-8">
        {/* Mobile Background */}
        <div className="relative w-full overflow-hidden lg:hidden" style={{ minHeight: "180px" }}>
          <img
            src={signinBackground}
            alt="Background"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black" />
          <div className="relative z-10 flex h-full flex-col items-center justify-center p-8">
            <h1 className="text-2xl font-light text-white">Create Your Store</h1>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex w-full max-w-sm flex-col items-center px-6 py-8 lg:px-0">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 p-4 shadow-xl shadow-purple-900/30">
              <Package className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* Header Text */}
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-white">Almost there!</h2>
            <p className="mt-1 text-sm text-gray-400">Set up your store details</p>
          </div>

          {/* Form Card */}
          <div className="w-full rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Store Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Store Name
                </label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={formData.store_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, store_name: e.target.value }))}
                    placeholder="Your Store Name"
                    className="w-full rounded-lg border border-gray-700 bg-black/50 py-3 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              {/* Store Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Description <span className="text-gray-500">(optional)</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <textarea
                    value={formData.store_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, store_description: e.target.value }))}
                    placeholder="Tell buyers about your store..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-700 bg-black/50 py-3 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating Store...
                  </>
                ) : (
                  <>
                    Create Store
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Info Note */}
            <p className="mt-4 text-center text-xs text-gray-500">
              Your store will be activated immediately after creation
            </p>
          </div>
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

// Deleted Account Screen
const DeletedAccount = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-xl bg-gray-100 flex items-center justify-center">
          <Store className="h-7 w-7 text-gray-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Store Deleted</h1>
        <p className="text-slate-500 text-sm mb-6">
          This seller account has been deleted. If you believe this is a mistake, please contact support.
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
      <div className="p-3 sm:p-4 lg:p-6">
        <Routes>
          <Route path="/" element={<SellerDashboard />} />
          <Route path="/products" element={<SellerProducts />} />
          <Route path="/orders" element={<SellerOrders />} />
          <Route path="/analytics" element={<SellerAnalytics />} />
          <Route path="/inventory" element={<SellerInventory />} />
          <Route path="/customers" element={<SellerCustomers />} />
          <Route path="/marketing" element={<SellerMarketing />} />
          <Route path="/reports" element={<SellerReports />} />
          <Route path="/performance" element={<SellerPerformance />} />
          <Route path="/chat" element={<SellerChat />} />
          <Route path="/wallet" element={<SellerWallet />} />
          <Route path="/feature-requests" element={<SellerFeatureRequests />} />
          <Route path="/support" element={<SellerSupport />} />
          <Route path="/settings" element={<SellerSettings />} />
        </Routes>
      </div>
    </main>
  );
};

// Main Seller Content with Routes
const SellerContent = () => {
  return (
    <SellerSidebarProvider>
      <div className="min-h-screen bg-slate-50 overflow-x-hidden">
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
        .select('*, is_deleted, deleted_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Check if account is deleted
        if (data.is_deleted) {
          setSellerProfile({ ...data, is_deleted: true } as any);
        } else {
          setSellerProfile(data);
        }
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

  // Check if account is deleted
  if (sellerProfile && (sellerProfile as any).is_deleted) {
    return <DeletedAccount />;
  }

  if (sellerProfile && !sellerProfile.is_active) {
    return <SuspendedAccount />;
  }

  if (sellerProfile) {
    return (
      <CurrencyProvider sellerCountry={(sellerProfile as any)?.country}>
        <SellerProvider sellerProfile={sellerProfile}>
          <SellerContent />
        </SellerProvider>
      </CurrencyProvider>
    );
  }

  return null;
};

export default Seller;
