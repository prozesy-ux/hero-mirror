import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import signinBackground from "@/assets/signin-background.webp";
import promptheroIcon from "@/assets/prompthero-icon.png";

const SignIn = () => {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const { user, loading: authLoading, signIn, signUp, signInWithGoogle } = useAuthContext();
  const didAutoRedirect = useRef(false);
  const navigate = useNavigate();

  // Handle post-auth redirect (for store purchases and chats)
  const handlePostAuthRedirect = () => {
    // Priority 1: Check for pending purchase - redirect to marketplace
    const pendingPurchase = localStorage.getItem('pendingPurchase');
    if (pendingPurchase) {
      // Don't remove pendingPurchase - AIAccountsSection will handle it and show product modal
      navigate('/dashboard/ai-accounts');
      return;
    }

    // Priority 2: Check for pending chat - redirect to marketplace
    const pendingChat = localStorage.getItem('pendingChat');
    if (pendingChat) {
      // Don't remove pendingChat - AIAccountsSection will handle it and open chat
      navigate('/dashboard/ai-accounts');
      return;
    }

    // Priority 3: Check localStorage storeReturn (legacy support)
    const storeReturn = localStorage.getItem('storeReturn');
    if (storeReturn) {
      try {
        const data = JSON.parse(storeReturn);
        // Don't remove yet - let the store page handle it
        if (data.returnUrl) {
          navigate(data.returnUrl);
          return;
        }
      } catch (e) {
        console.error('Failed to parse storeReturn', e);
      }
    }
    
    // Priority 4: Check returnTo query parameter (backup redirect path)
    const returnTo = searchParams.get('returnTo');
    if (returnTo && returnTo.startsWith('/')) {
      navigate(returnTo);
      return;
    }
    
    // Priority 5: Default to dashboard
    navigate("/dashboard");
  };

  // Auto-redirect after OAuth returns to /signin (no form submit happens)
  useEffect(() => {
    if (didAutoRedirect.current) return;
    if (authLoading) return;
    if (!user) return;

    didAutoRedirect.current = true;
    handlePostAuthRedirect();
  }, [user, authLoading]);

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
        handlePostAuthRedirect();
      }
    } else {
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Welcome back!");
        handlePostAuthRedirect();
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success("Password reset link sent! Check your email.");
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setResetLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    const { error } = await signInWithGoogle();
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
              Welcome to PromptHero
            </h1>
            <p className="text-xl font-medium text-white/90 drop-shadow-md">
              Access 10,000+ Premium AI Prompts
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
            <h1 className="text-2xl font-light text-white">Welcome to PromptHero</h1>
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
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="mt-2 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Forgot password?
                    </button>
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

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6 animate-fade-up">
            <button
              onClick={() => setShowForgotPassword(false)}
              className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} />
              Back to Sign In
            </button>
            
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Mail className="w-7 h-7 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Forgot Password?</h2>
              <p className="text-gray-400 text-sm mt-2">
                Enter your email and we'll send you a reset link
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-gray-700 bg-black/50 py-3 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignIn;
