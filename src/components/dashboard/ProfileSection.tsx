import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  User, 
  Shield, 
  Bell, 
  Trash2, 
  Camera,
  Check,
  X,
  Eye,
  EyeOff,
  Smartphone,
  Monitor,
  LogOut,
  Download,
  Mail,
  Key,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Globe,
  BellRing,
  ChevronLeft,
  Palette,
  Languages,
  Wallet,
  Image as ImageIcon
} from 'lucide-react';

import ProfileHeader from '@/components/profile/ProfileHeader';
import MenuListItem from '@/components/profile/MenuListItem';
import SectionHeader from '@/components/profile/SectionHeader';
import StatusToggleCard from '@/components/profile/StatusToggleCard';

interface UserPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  marketing_emails: boolean;
  security_alerts: boolean;
  security_emails?: boolean;
  login_alerts?: boolean;
  order_emails?: boolean;
  wallet_emails?: boolean;
  product_emails?: boolean;
}

interface UserSession {
  id: string;
  user_id: string;
  device_name: string | null;
  browser: string | null;
  ip_address: string | null;
  location: string | null;
  is_current: boolean;
  last_active: string;
  created_at: string;
}

const ProfileSection = () => {
  const { profile, user, signOut } = useAuthContext();
  const { permission, isSubscribed, isLoading: pushLoading, subscribe, unsubscribe, isSupported } = usePushNotifications();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Sheet states for sub-views
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  
  // Password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // 2FA toggle loading state
  const [updating2FA, setUpdating2FA] = useState(false);

  // Preferences state - from database
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [updatingPreference, setUpdatingPreference] = useState<string | null>(null);

  // Sessions state - from database
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // Export/Delete state
  const [isExporting, setIsExporting] = useState(false);
  const [isSigningOutAll, setIsSigningOutAll] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Online status
  const [isOnline, setIsOnline] = useState(true);

  // Push notification toggle handler
  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  // Sync profile data
  useEffect(() => {
    setFullName(profile?.full_name || '');
  }, [profile]);

  // Fetch preferences and sessions on mount
  useEffect(() => {
    if (user) {
      fetchPreferences();
      fetchSessions();
      trackCurrentSession();
    }
  }, [user]);

  // Fetch user preferences from database
  const fetchPreferences = async () => {
    if (!user) return;
    
    setPreferencesLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) {
        const { data: newPrefs, error: insertError } = await supabase
          .from('user_preferences')
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (!insertError) {
          setPreferences(newPrefs);
        }
      } else {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setPreferencesLoading(false);
    }
  };

  // Update preference in database
  const updatePreference = async (key: keyof UserPreferences, value: boolean) => {
    if (!user || !preferences) return;
    
    setUpdatingPreference(key);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({ [key]: value })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setPreferences({ ...preferences, [key]: value });
      toast.success('Preference updated');
    } catch (error) {
      console.error('Error updating preference:', error);
      toast.error('Failed to update preference');
    } finally {
      setUpdatingPreference(null);
    }
  };

  // Fetch user sessions from database
  const fetchSessions = async () => {
    if (!user) return;
    
    setSessionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_active', { ascending: false });
      
      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  };

  // Track current session in database
  const trackCurrentSession = async () => {
    if (!user) return;
    
    try {
      const userAgent = navigator.userAgent;
      const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
      const deviceName = isMobile ? 'Mobile Device' : 'Desktop';
      
      let browser = 'Unknown Browser';
      if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
      else if (userAgent.includes('Edge')) browser = 'Edge';
      
      const { data: existingSessions } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_current', true);
      
      if (existingSessions && existingSessions.length > 0) {
        await supabase
          .from('user_sessions')
          .update({ 
            last_active: new Date().toISOString(),
            device_name: deviceName,
            browser: browser
          })
          .eq('id', existingSessions[0].id);
      } else {
        await supabase
          .from('user_sessions')
          .insert({
            user_id: user.id,
            device_name: deviceName,
            browser: browser,
            is_current: true,
            location: 'Current Location'
          });
      }
      
      fetchSessions();
    } catch (error) {
      console.error('Error tracking session:', error);
    }
  };

  // Terminate a session
  const handleTerminateSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId);
      
      if (error) throw error;
      
      setSessions(sessions.filter(s => s.id !== sessionId));
      toast.success('Session terminated');
    } catch (error) {
      console.error('Error terminating session:', error);
      toast.error('Failed to terminate session');
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

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
      setActiveSheet(null);
      window.location.reload();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error?.message || 'Failed to upload avatar');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!user) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('user_id', user.id);

    setLoading(false);

    if (error) {
      toast.error('Failed to update name');
    } else {
      toast.success('Name updated successfully');
      setActiveSheet(null);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
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
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  // Export user data
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please log in again');
        return;
      }
      
      const response = await supabase.functions.invoke('export-user-data', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (response.error) throw response.error;
      
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  // Sign out all devices
  const handleSignOutAll = async () => {
    setIsSigningOutAll(true);
    try {
      if (user) {
        await supabase
          .from('user_sessions')
          .delete()
          .eq('user_id', user.id);
      }
      
      await supabase.auth.signOut({ scope: 'global' });
      toast.success('Signed out from all devices');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out from all devices');
    } finally {
      setIsSigningOutAll(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('account_deletion_requests')
        .insert({
          user_id: user.id,
          reason: deleteReason || 'No reason provided'
        });
      
      if (error) throw error;
      
      await supabase.auth.signOut();
      toast.success('Account deletion requested. Your account will be deleted within 48 hours.');
    } catch (error: any) {
      console.error('Error requesting deletion:', error);
      if (error.code === '23505') {
        toast.error('Deletion request already submitted');
      } else {
        toast.error('Failed to submit deletion request');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8 animate-fade-up p-4 lg:p-6 bg-[#FBF8F3] min-h-screen">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        className="hidden"
      />

      {/* Profile Header */}
      <ProfileHeader
        avatarUrl={profile?.avatar_url}
        name={profile?.full_name || 'User'}
        subtitle={`Member since ${formatDate(profile?.created_at)}`}
        isOnline={isOnline}
        isPro={profile?.is_pro}
        gradient="violet"
        avatarLoading={avatarLoading}
        onAvatarClick={() => setActiveSheet('profile-image')}
      />

      {/* PROFILE Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <SectionHeader title="Profile" />
        
        <MenuListItem
          icon={ImageIcon}
          label="Profile Image"
          description="Change your profile photo"
          onClick={() => setActiveSheet('profile-image')}
          iconColor="text-violet-500"
        />
        
        <MenuListItem
          icon={User}
          label="Edit Name"
          value={profile?.full_name || 'Not set'}
          onClick={() => setActiveSheet('edit-name')}
          iconColor="text-blue-500"
        />
        
        <MenuListItem
          icon={Mail}
          label="Email Address"
          value={
            <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 bg-emerald-50">
              Verified
            </Badge>
          }
          hasChevron={false}
          iconColor="text-gray-500"
        />
      </div>

      {/* SETTINGS Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <SectionHeader title="Settings" />
        
        <MenuListItem
          icon={Bell}
          label="Notifications"
          description="Email and push preferences"
          onClick={() => setActiveSheet('notifications')}
          iconColor="text-purple-500"
        />
        
        <MenuListItem
          icon={Shield}
          label="Security"
          description="Password and sessions"
          onClick={() => setActiveSheet('security')}
          iconColor="text-emerald-500"
        />
        
        <MenuListItem
          icon={Key}
          label="Two-Factor Authentication"
          value={(profile as any)?.two_factor_enabled !== false ? 'ON' : 'OFF'}
          onClick={() => setActiveSheet('two-factor')}
          iconColor="text-violet-500"
        />
        
        <MenuListItem
          icon={Languages}
          label="Language"
          value="English"
          hasChevron={false}
          iconColor="text-gray-500"
        />
        
        <MenuListItem
          icon={Palette}
          label="Appearance"
          value="System"
          hasChevron={false}
          iconColor="text-pink-500"
        />
        
        <MenuListItem
          icon={Wallet}
          label="Currency"
          value="USD"
          hasChevron={false}
          iconColor="text-amber-500"
        />
      </div>

      {/* Status Toggle */}
      <StatusToggleCard
        isOnline={isOnline}
        onToggle={setIsOnline}
      />

      {/* DANGER ZONE Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <SectionHeader title="Danger Zone" className="bg-red-50" />
        
        <MenuListItem
          icon={Download}
          label="Export Data"
          description="Download all your data"
          onClick={handleExportData}
          iconColor="text-gray-600"
        />
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <div>
              <MenuListItem
                icon={Trash2}
                label="Delete Account"
                description="Permanently delete your account"
                variant="danger"
              />
            </div>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600">Delete Account?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. Your account will be permanently deleted within 48 hours.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label className="text-sm font-medium text-gray-700">
                Why are you leaving? (optional)
              </Label>
              <Textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Help us improve by sharing your reason..."
                className="mt-2"
                rows={3}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Profile Image Sheet */}
      <Sheet open={activeSheet === 'profile-image'} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="text-center pb-4">
            <SheetTitle>Profile Image</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 pb-safe">
            <Button
              variant="ghost"
              className="w-full justify-start h-14 text-base"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
            >
              <Camera className="w-5 h-5 mr-3 text-gray-600" />
              {avatarLoading ? 'Uploading...' : 'Choose from Library'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Name Sheet */}
      <Sheet open={activeSheet === 'edit-name'} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="flex flex-row items-center gap-3 pb-6">
            <Button variant="ghost" size="icon" onClick={() => setActiveSheet(null)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <SheetTitle>Edit Name</SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                className="mt-2"
              />
            </div>
            <Button
              onClick={handleSaveName}
              disabled={loading}
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Notifications Sheet */}
      <Sheet open={activeSheet === 'notifications'} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="flex flex-row items-center gap-3 pb-6">
            <Button variant="ghost" size="icon" onClick={() => setActiveSheet(null)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <SheetTitle>Notifications</SheetTitle>
          </SheetHeader>
          
          {preferencesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Push Notifications */}
              {isSupported && (
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="text-sm font-medium">Push Notifications</p>
                    <p className="text-xs text-gray-500">
                      {permission === 'denied' ? 'Blocked in browser' : 'Get instant alerts'}
                    </p>
                  </div>
                  <Switch
                    checked={isSubscribed}
                    onCheckedChange={handlePushToggle}
                    disabled={pushLoading || permission === 'denied'}
                  />
                </div>
              )}

              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-xs text-gray-500">Account updates</p>
                </div>
                <Switch
                  checked={preferences?.email_notifications ?? true}
                  onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
                  disabled={updatingPreference === 'email_notifications'}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="text-sm font-medium">Marketing Emails</p>
                  <p className="text-xs text-gray-500">Tips and offers</p>
                </div>
                <Switch
                  checked={preferences?.marketing_emails ?? false}
                  onCheckedChange={(checked) => updatePreference('marketing_emails', checked)}
                  disabled={updatingPreference === 'marketing_emails'}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="text-sm font-medium">Security Alerts</p>
                  <p className="text-xs text-gray-500">Suspicious activity</p>
                </div>
                <Switch
                  checked={preferences?.security_alerts ?? true}
                  onCheckedChange={(checked) => updatePreference('security_alerts', checked)}
                  disabled={updatingPreference === 'security_alerts'}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="text-sm font-medium">Order Updates</p>
                  <p className="text-xs text-gray-500">Confirmations & status</p>
                </div>
                <Switch
                  checked={preferences?.order_emails ?? true}
                  onCheckedChange={(checked) => updatePreference('order_emails' as keyof UserPreferences, checked)}
                  disabled={updatingPreference === 'order_emails'}
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">Wallet Notifications</p>
                  <p className="text-xs text-gray-500">Top-ups & refunds</p>
                </div>
                <Switch
                  checked={preferences?.wallet_emails ?? true}
                  onCheckedChange={(checked) => updatePreference('wallet_emails' as keyof UserPreferences, checked)}
                  disabled={updatingPreference === 'wallet_emails'}
                />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Security Sheet */}
      <Sheet open={activeSheet === 'security'} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="flex flex-row items-center gap-3 pb-6">
            <Button variant="ghost" size="icon" onClick={() => setActiveSheet(null)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <SheetTitle>Security</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-6">
            {/* Password Change */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Change Password</h4>
              <div>
                <Label className="text-xs">New Password</Label>
                <div className="relative mt-1">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs font-medium ${passwordStrength >= 4 ? 'text-green-600' : passwordStrength >= 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {strengthLabels[passwordStrength - 1] || 'Too Short'}
                    </span>
                  </div>
                )}
              </div>
              
              <div>
                <Label className="text-xs">Confirm Password</Label>
                <div className="relative mt-1">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && (
                  <div className="flex items-center gap-1.5 mt-1">
                    {passwordsMatch ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-xs text-green-600">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                        <span className="text-xs text-red-600">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              <Button
                onClick={handlePasswordChange}
                disabled={passwordLoading || newPassword.length < 8 || !passwordsMatch}
                className="w-full"
              >
                {passwordLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Update Password
              </Button>
            </div>

            {/* Active Sessions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Active Sessions</h4>
                {sessions.length > 1 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 text-xs">
                        <LogOut className="h-3 w-3 mr-1" />
                        Sign Out All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Sign out from all devices?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will log you out from all devices, including this one.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleSignOutAll}
                          disabled={isSigningOutAll}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          {isSigningOutAll ? 'Signing out...' : 'Sign Out All'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
              
              {sessionsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">No active sessions</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        session.is_current ? 'bg-emerald-50 border border-emerald-100' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {session.device_name?.includes('Mobile') ? (
                          <Smartphone className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Monitor className="h-4 w-4 text-gray-500" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">
                              {session.browser || 'Unknown'} on {session.device_name || 'Unknown'}
                            </p>
                            {session.is_current && (
                              <Badge className="text-xs bg-emerald-100 text-emerald-700">
                                Current
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(session.last_active).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {!session.is_current && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTerminateSession(session.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Two-Factor Sheet */}
      <Sheet open={activeSheet === 'two-factor'} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="flex flex-row items-center gap-3 pb-6">
            <Button variant="ghost" size="icon" onClick={() => setActiveSheet(null)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <SheetTitle>Two-Factor Authentication</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4">
            {/* Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border">
              <div>
                <p className="font-medium text-sm">Enable 2FA Protection</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Require email OTP for sensitive actions
                </p>
              </div>
              <Switch 
                checked={(profile as any)?.two_factor_enabled !== false}
                onCheckedChange={async (checked) => {
                  if (!user) return;
                  setUpdating2FA(true);
                  try {
                    const { error } = await supabase
                      .from('profiles')
                      .update({ two_factor_enabled: checked })
                      .eq('user_id', user.id);
                    if (error) throw error;
                    toast.success(checked ? '2FA enabled' : '2FA disabled');
                    window.location.reload();
                  } catch (err: any) {
                    toast.error(err.message || 'Failed to update 2FA');
                  } finally {
                    setUpdating2FA(false);
                  }
                }}
                disabled={updating2FA}
              />
            </div>
            
            {/* Status */}
            {(profile as any)?.two_factor_enabled !== false ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-emerald-900">Protection Active</h4>
                    <p className="text-sm text-emerald-700 mt-1">
                      Sensitive actions require email verification.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900">Protection Disabled</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      We recommend enabling 2FA for security.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-4 rounded-xl bg-gray-50 border">
              <p className="text-sm font-medium text-gray-700 mb-3">Protected actions:</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Password changes
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Email address updates
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Account deletion
                </li>
              </ul>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ProfileSection;
