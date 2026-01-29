import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, CheckCircle, Shield, ArrowLeft, Loader2 } from 'lucide-react';
import signinBackground from '@/assets/signin-background.webp';
import uptozaLogo from '@/assets/uptoza-logo.png';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset link. Please request a new password reset.');
      setValidating(false);
      return;
    }
    setValidating(false);
  }, [token]);

  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
    if (/\d/.test(pass)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
  const strengthTextColors = passwordStrength <= 1 ? 'text-red-400' : 
    passwordStrength === 2 ? 'text-orange-400' :
    passwordStrength === 3 ? 'text-yellow-400' : 'text-emerald-400';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords don't match", {
        description: "Please make sure both passwords are the same."
      });
      return;
    }

    if (password.length < 8) {
      toast.error("Password too short", {
        description: "Password must be at least 8 characters long."
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-password-reset', {
        body: { token, password }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to reset password');
      }

      setSuccess(true);
      toast.success("Password updated!", {
        description: "Your password has been successfully reset."
      });

      setTimeout(() => navigate('/signin'), 2000);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to reset password. Please try again.";
      
      if (errorMessage.includes('expired')) {
        setError('This reset link has expired. Please request a new one.');
      } else if (errorMessage.includes('Invalid')) {
        setError('Invalid reset link. Please request a new password reset.');
      } else {
        toast.error("Reset failed", {
          description: errorMessage
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (validating) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-black">
        <div className="overflow-hidden rounded-2xl bg-white p-2 shadow-xl shadow-black/20 mb-6">
          <img src={uptozaLogo} alt="Uptoza" className="h-12 w-auto rounded-xl" />
        </div>
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-lg font-medium">Validating reset link...</span>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-black p-4">
        <div className="w-full max-w-md text-center">
          <div className="overflow-hidden rounded-2xl bg-white p-2 shadow-xl shadow-black/20 mx-auto w-fit mb-6">
            <img src={uptozaLogo} alt="Uptoza" className="h-10 w-auto rounded-xl" />
          </div>
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Password Reset Complete!</h1>
          <p className="text-gray-400 mb-6">
            Your password has been successfully updated. Redirecting to sign in...
          </p>
          <button
            onClick={() => navigate('/signin')}
            className="w-full rounded-lg bg-purple-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-700"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-black p-4">
        <div className="w-full max-w-md text-center">
          <div className="overflow-hidden rounded-2xl bg-white p-2 shadow-xl shadow-black/20 mx-auto w-fit mb-6">
            <img src={uptozaLogo} alt="Uptoza" className="h-10 w-auto rounded-xl" />
          </div>
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Reset Link</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/signin')}
            className="w-full rounded-lg bg-purple-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-700"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Main form
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
            backgroundSize: "20px 20px"
          }}
        />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12 text-center">
          <div className="space-y-3">
            <h1 className="text-4xl font-light tracking-tight text-white drop-shadow-lg">
              Reset Your Password
            </h1>
            <p className="text-xl font-medium text-white/90 drop-shadow-md">
              Create a strong password to secure your account
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
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
            <h1 className="text-2xl font-light text-white">Reset Your Password</h1>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex w-full max-w-sm flex-col items-center px-6 py-8 lg:px-0">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="overflow-hidden rounded-2xl bg-white p-2 shadow-xl shadow-black/20">
              <img src={uptozaLogo} alt="Uptoza" className="h-10 w-auto rounded-xl" />
            </div>
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate('/signin')}
            className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm self-start"
          >
            <ArrowLeft size={16} />
            Back to Sign In
          </button>

          {/* Form Card */}
          <div className="w-full rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Lock className="w-7 h-7 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Create New Password</h2>
              <p className="text-gray-400 text-sm mt-2">Enter your new password below</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Password Field */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded-lg border border-gray-700 bg-black/50 py-3 pl-10 pr-10 text-sm text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs ${strengthTextColors}`}>
                      {strengthLabels[passwordStrength - 1] || 'Too weak'}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-lg border border-gray-700 bg-black/50 py-3 pl-10 pr-10 text-sm text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-400">Passwords don't match</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || password !== confirmPassword || password.length < 8}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>

            {/* Password Requirements */}
            <div className="mt-5 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <h4 className="text-xs font-medium text-white mb-2">Password requirements:</h4>
              <ul className="text-xs text-gray-400 space-y-1">
                <li className={password.length >= 8 ? 'text-emerald-400' : ''}>
                  • At least 8 characters
                </li>
                <li className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-emerald-400' : ''}>
                  • Upper and lowercase letters
                </li>
                <li className={/\d/.test(password) ? 'text-emerald-400' : ''}>
                  • At least one number
                </li>
                <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-emerald-400' : ''}>
                  • At least one special character
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
