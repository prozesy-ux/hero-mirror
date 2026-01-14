import { useState, useRef } from 'react';
import { User, Mail, Save, Camera, Lock, Eye, EyeOff, Loader2, AlertTriangle, CheckCircle, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { GlassCard } from '@/components/ui/glass-card';

const ProfileSection = () => {
  const { profile, user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Email change
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  
  // Password change
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setAvatarLoading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: `${publicUrl}?t=${Date.now()}` })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast.success('Avatar updated successfully');
      window.location.reload();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error?.message || 'Failed to upload avatar');
    } finally {
      setAvatarLoading(false);
    }
  };

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
    <div className="max-w-2xl mx-auto animate-fade-up">
      <h2 className="text-3xl font-bold text-white mb-2">Profile Settings</h2>
      <p className="text-gray-400 mb-8">Manage your account settings and preferences</p>

      {/* Avatar Section */}
      <GlassCard variant="glow" className="mb-6">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="relative">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-28 h-28 rounded-full object-cover ring-4 ring-purple-500/30 transition-all duration-300 group-hover:ring-purple-500/50"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl font-bold ring-4 ring-purple-500/30">
                  {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                </div>
              )}
              
              {/* Upload Overlay */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full"
              >
                {avatarLoading ? (
                  <Loader2 size={24} className="text-white animate-spin" />
                ) : (
                  <Camera size={24} className="text-white" />
                )}
              </button>
            </div>
            
            {/* Upload Button */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
              className="absolute -bottom-1 -right-1 p-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg glow-purple"
            >
              <Upload size={14} />
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white mb-1">
              {profile?.full_name || 'User'}
            </h3>
            <p className="text-gray-400 mb-2">{profile?.email}</p>
            <p className="text-sm text-gray-500">
              Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Profile Form */}
      <GlassCard className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <User size={20} className="text-purple-400" />
          Personal Information
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-400 cursor-not-allowed"
              />
              <button
                onClick={() => setShowEmailChange(!showEmailChange)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all text-sm font-medium border border-white/10"
              >
                Change
              </button>
            </div>
          </div>

          {showEmailChange && (
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3 animate-scale-in">
              <div className="flex items-center gap-2 text-yellow-400 text-sm">
                <AlertTriangle size={16} />
                A verification email will be sent to your new address
              </div>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email address"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEmailChange(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEmailChange}
                  disabled={emailLoading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium py-3 px-6 rounded-xl transition-all disabled:opacity-50 glow-purple-hover"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </GlassCard>

      {/* Password Change */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Lock size={20} className="text-purple-400" />
            Password & Security
          </h3>
          <button
            onClick={() => setShowPasswordChange(!showPasswordChange)}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all text-sm font-medium border border-white/10"
          >
            {showPasswordChange ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {!showPasswordChange ? (
          <p className="text-gray-400 text-sm">
            Keep your account secure with a strong password. We recommend using a unique password that you don't use elsewhere.
          </p>
        ) : (
          <div className="space-y-4 animate-scale-in">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="mt-3">
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${passwordStrength >= 4 ? 'text-green-400' : passwordStrength >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                placeholder="Confirm new password"
              />
              {confirmPassword && newPassword && (
                <div className="flex items-center gap-1.5 mt-2">
                  {confirmPassword === newPassword ? (
                    <>
                      <CheckCircle size={14} className="text-green-400" />
                      <span className="text-xs text-green-400 font-medium">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={14} className="text-red-400" />
                      <span className="text-xs text-red-400 font-medium">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handlePasswordChange}
              disabled={passwordLoading || newPassword.length < 6 || newPassword !== confirmPassword}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-purple-hover"
            >
              {passwordLoading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default ProfileSection;
