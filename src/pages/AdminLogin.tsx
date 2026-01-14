import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, Lock, User, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import promptheroIcon from '@/assets/prompthero-icon.png';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'admin' | 'account'>('admin');
  const { adminLogin, isAdminAuthenticated, hasAdminRole, adminUser, checkAdminRole } = useAdmin();
  const navigate = useNavigate();

  // Check if already fully authenticated
  useEffect(() => {
    if (isAdminAuthenticated && hasAdminRole) {
      navigate('/admin');
    }
  }, [isAdminAuthenticated, hasAdminRole, navigate]);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await new Promise(resolve => setTimeout(resolve, 300));

    const success = adminLogin(username, password);
    setLoading(false);

    if (success) {
      toast.success('Admin credentials verified!');
      // Check if already signed in with admin role
      if (hasAdminRole) {
        navigate('/admin');
      } else {
        setStep('account');
      }
    } else {
      toast.error('Invalid admin credentials');
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: accountPassword
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      // Wait for auth state to update and check role
      await new Promise(resolve => setTimeout(resolve, 500));
      const isAdmin = await checkAdminRole();
      
      if (isAdmin) {
        toast.success('Welcome, Admin! Full access granted.');
        navigate('/admin');
      } else {
        toast.error('This account does not have admin permissions');
        await supabase.auth.signOut();
      }
    } catch (error: any) {
      toast.error(error?.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const skipAccountLogin = () => {
    toast.info('Continuing with limited access. Some features may not work.');
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src={promptheroIcon} alt="PromptHero" className="w-12 h-12 rounded-lg" />
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-gray-400 mt-2">
              {step === 'admin' ? 'Enter admin credentials' : 'Sign in with your admin account'}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className={`flex items-center gap-2 ${step === 'admin' ? 'text-purple-400' : 'text-green-400'}`}>
              {step === 'account' ? <CheckCircle size={18} /> : <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm">1</div>}
              <span className="text-sm">Admin Key</span>
            </div>
            <div className="w-8 h-px bg-gray-700"></div>
            <div className={`flex items-center gap-2 ${step === 'account' ? 'text-purple-400' : 'text-gray-500'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${step === 'account' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'}`}>2</div>
              <span className="text-sm">Account</span>
            </div>
          </div>

          {step === 'admin' ? (
            /* Admin Credentials Form */
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <User size={16} className="inline mr-2" />
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Lock size={16} className="inline mr-2" />
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield size={18} />
                    Continue
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Account Sign In Form */
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-sm mb-4">
                <AlertCircle size={16} className="inline mr-2" />
                Sign in with your account to enable database operations (create, update, delete prompts)
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Mail size={16} className="inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mdmerajul614@gmail.com"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Lock size={16} className="inline mr-2" />
                  Account Password
                </label>
                <input
                  type="password"
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <Shield size={18} />
                    Access Admin Panel
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={skipAccountLogin}
                className="w-full text-gray-400 hover:text-gray-300 text-sm py-2 transition-colors"
              >
                Skip (limited access)
              </button>

              <button
                type="button"
                onClick={() => setStep('admin')}
                className="w-full text-gray-500 hover:text-gray-400 text-sm py-2 transition-colors"
              >
                ← Back to admin credentials
              </button>
            </form>
          )}

          <p className="text-center text-gray-500 text-sm mt-6">
            Authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
