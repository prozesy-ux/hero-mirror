import { useState } from 'react';
import { User, Mail, Save, Camera, Lock, Eye, EyeOff, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ProfileSection = () => {
  const { profile, user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  
  // Email change
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  
  // Password change
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('user_id', user.id);

    setLoading(false);

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully');
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setEmailLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      email: newEmail
    });

    setEmailLoading(false);

    if (error) {
      toast.error(error.message || 'Failed to update email');
    } else {
      toast.success('Verification email sent to your new address. Please check your inbox.');
      setShowEmailChange(false);
      setNewEmail('');
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    setPasswordLoading(false);

    if (error) {
      toast.error(error.message || 'Failed to update password');
    } else {
      toast.success('Password updated successfully');
      setShowPasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">Profile Settings</h2>

      {/* Avatar Section */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold">
              {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-purple-600 rounded-full text-white hover:bg-purple-700 transition-colors">
              <Camera size={16} />
            </button>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">
              {profile?.full_name || 'User'}
            </h3>
            <p className="text-gray-400">{profile?.email}</p>
            <p className="text-sm text-gray-500 mt-1">
              Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <User size={16} className="inline mr-2" />
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Mail size={16} className="inline mr-2" />
              Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-gray-400 cursor-not-allowed"
              />
              <button
                onClick={() => setShowEmailChange(!showEmailChange)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              >
                Change
              </button>
            </div>
          </div>

          {showEmailChange && (
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 space-y-3">
              <div className="flex items-center gap-2 text-yellow-400 text-sm">
                <AlertTriangle size={16} />
                A verification email will be sent to your new address
              </div>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email address"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEmailChange(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEmailChange}
                  disabled={emailLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {emailLoading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                  Send Verification
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Password Change */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Lock size={20} />
            Password & Security
          </h3>
          <button
            onClick={() => setShowPasswordChange(!showPasswordChange)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
          >
            {showPasswordChange ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {!showPasswordChange ? (
          <p className="text-gray-400 text-sm">
            Keep your account secure with a strong password. We recommend using a unique password that you don't use elsewhere.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${
                          i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs ${passwordStrength >= 4 ? 'text-green-400' : passwordStrength >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {strengthLabels[passwordStrength - 1] || 'Too Short'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Confirm new password"
              />
              {confirmPassword && newPassword && (
                <div className="flex items-center gap-1 mt-2">
                  {confirmPassword === newPassword ? (
                    <>
                      <CheckCircle size={14} className="text-green-400" />
                      <span className="text-xs text-green-400">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={14} className="text-red-400" />
                      <span className="text-xs text-red-400">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handlePasswordChange}
              disabled={passwordLoading || newPassword.length < 6 || newPassword !== confirmPassword}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {passwordLoading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSection;
