import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  BellRing
} from 'lucide-react';

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
  const [isEditingName, setIsEditingName] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Password states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
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
        // Create default preferences if none exist
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
      
      // Check for existing current session
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

  const getInitials = (name: string | null | undefined) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
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
      setIsEditingName(false);
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
      setShowPasswordChange(false);
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
    <div className="max-w-2xl mx-auto space-y-4 lg:space-y-6 animate-fade-up">
      {/* Modern Profile Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 sm:gap-6">
          {/* Avatar with change button - High Quality */}
          <div className="relative group">
            <Avatar className="h-20 w-20 border-3 border-slate-100 shadow-md">
              <AvatarImage 
                src={profile?.avatar_url || ''} 
                alt={profile?.full_name || 'User'} 
                className="object-cover"
                loading="lazy"
                decoding="async"
              />
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-lg font-bold tracking-tight">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-200"
            >
              {avatarLoading ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          {/* User info - Enhanced Typography */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 truncate">
                {profile?.full_name || 'User'}
              </h2>
              {profile?.is_pro && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                  PRO
                </Badge>
              )}
            </div>
            <p className="text-sm font-medium text-slate-600 truncate mt-1">{user?.email}</p>
            <p className="text-xs text-slate-400 mt-1 tracking-wide">
              Member since {formatDate(profile?.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Settings Accordion */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Accordion type="multiple" defaultValue={['personal']} className="divide-y divide-gray-100">
          
          {/* Personal Information */}
          <AccordionItem value="personal" className="border-none">
            <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium text-gray-900 block">Personal Information</span>
                  <span className="text-xs text-gray-500">Manage your name and contact details</span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                {/* Full Name */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex-1">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</Label>
                    {isEditingName ? (
                      <div className="flex items-center gap-2 mt-1.5">
                        <Input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="h-9 text-sm bg-white border-gray-200 flex-1"
                          placeholder="Enter your name"
                        />
                        <Button
                          size="sm"
                          onClick={handleSaveName}
                          disabled={loading}
                          className="h-9 w-9 p-0 bg-gray-900 hover:bg-gray-800"
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setIsEditingName(false);
                            setFullName(profile?.full_name || '');
                          }}
                          className="h-9 w-9 p-0"
                        >
                          <X className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">{profile?.full_name || 'Not set'}</p>
                    )}
                  </div>
                  {!isEditingName && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingName(true)}
                      className="text-gray-600 hover:text-gray-900 text-xs"
                    >
                      Edit
                    </Button>
                  )}
                </div>

                {/* Email */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email Address</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-gray-900">{user?.email}</p>
                      <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Security */}
          <AccordionItem value="security" className="border-none">
            <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium text-gray-900 block">Security</span>
                  <span className="text-xs text-gray-500">Password and session management</span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                {/* Password */}
                <div className="py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Key className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Password</p>
                        <p className="text-xs text-gray-500">••••••••</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPasswordChange(!showPasswordChange)}
                      className="text-gray-600 hover:text-gray-900 text-xs"
                    >
                      {showPasswordChange ? 'Cancel' : 'Change'}
                    </Button>
                  </div>

                  {showPasswordChange && (
                    <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="text-xs font-medium text-gray-600">New Password</label>
                        <div className="relative mt-1">
                          <Input
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="h-9 text-sm bg-white border-gray-200 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                        <label className="text-xs font-medium text-gray-600">Confirm Password</label>
                        <div className="relative mt-1">
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="h-9 text-sm bg-white border-gray-200 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {confirmPassword && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {passwordsMatch ? (
                              <>
                                <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                <span className="text-xs text-green-600 font-medium">Passwords match</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                                <span className="text-xs text-red-600 font-medium">Passwords do not match</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <Button
                        onClick={handlePasswordChange}
                        disabled={passwordLoading || newPassword.length < 8 || !passwordsMatch}
                        className="h-9 w-full bg-gray-900 hover:bg-gray-800 text-sm"
                      >
                        {passwordLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          'Update Password'
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Active Sessions */}
                <div className="py-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Monitor className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Active Sessions</p>
                        <p className="text-xs text-gray-500">
                          {sessionsLoading ? 'Loading...' : `${sessions.length} device${sessions.length !== 1 ? 's' : ''} logged in`}
                        </p>
                      </div>
                    </div>
                    {sessions.length > 1 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-amber-600 border-amber-200 hover:bg-amber-50 text-xs"
                          >
                            <LogOut className="h-3 w-3 mr-1" />
                            Sign Out All
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white border border-gray-200">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Sign out from all devices?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will log you out from all devices, including this one. You'll need to sign in again.
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
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  ) : sessions.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2 ml-7">No active sessions</p>
                  ) : (
                    <div className="space-y-2 ml-7">
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            session.is_current ? 'bg-green-50 border border-green-100' : 'bg-gray-50'
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
                                  <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                                    Current
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Globe className="h-3 w-3" />
                                <span>{session.ip_address || 'Unknown IP'}</span>
                                <span>•</span>
                                <span>{session.location || 'Unknown Location'}</span>
                                <span>•</span>
                                <span>{new Date(session.last_active).toLocaleDateString()}</span>
                              </div>
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
            </AccordionContent>
          </AccordionItem>

          {/* Two-Factor Authentication */}
          <AccordionItem value="two-factor" className="border-none">
            <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                  <Key className="h-4 w-4 text-violet-600" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium text-gray-900 block">Two-Factor Authentication</span>
                  <span className="text-xs text-gray-500">
                    {(profile as any)?.two_factor_enabled !== false ? 'Enabled - Extra verification for sensitive actions' : 'Disabled'}
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                {/* Toggle Switch */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">Enable 2FA Protection</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      When enabled, sensitive actions require email OTP verification
                    </p>
                  </div>
                  <Switch 
                    checked={(profile as any)?.two_factor_enabled !== false}
                    onCheckedChange={async (checked) => {
                      if (!user) return;
                      setUpdating2FA(true);
                      try {
                        console.log('[2FA_TOGGLE] Updating user 2FA:', { checked, user_id: user.id });
                        const { error } = await supabase
                          .from('profiles')
                          .update({ two_factor_enabled: checked })
                          .eq('user_id', user.id);
                        if (error) throw error;
                        console.log('[2FA_TOGGLE] Update successful');
                        toast.success(checked ? '2FA protection enabled' : '2FA protection disabled');
                        window.location.reload();
                      } catch (err: any) {
                        console.error('[2FA_TOGGLE] Error:', err);
                        toast.error(err.message || 'Failed to update 2FA setting');
                      } finally {
                        setUpdating2FA(false);
                      }
                    }}
                    disabled={loading || updating2FA}
                  />
                </div>
                
                {/* Status Info */}
                {(profile as any)?.two_factor_enabled !== false ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Shield className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-emerald-900">Email Verification Active</h4>
                        <p className="text-sm text-emerald-700 mt-1">
                          Important account actions are protected with email verification codes sent to your registered email address.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-amber-900">Protection Disabled</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          Warning: Sensitive actions will proceed without OTP verification. We recommend keeping 2FA enabled.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-sm font-medium text-gray-700 mb-3">Protected actions include:</p>
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
                      Account deletion requests
                    </li>
                  </ul>
                </div>
                
                <p className="text-xs text-gray-500">
                  💡 Keep your email address secure to protect your account.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Notifications */}
          <AccordionItem value="notifications" className="border-none">
            <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Bell className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium text-gray-900 block">Notifications</span>
                  <span className="text-xs text-gray-500">Manage your email preferences</span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              {preferencesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Push Notifications Toggle */}
                  {isSupported && (
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <BellRing className="h-4 w-4 text-violet-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Push Notifications</p>
                          <p className="text-xs text-gray-500">
                            {permission === 'denied' 
                              ? 'Blocked in browser settings' 
                              : 'Receive instant alerts even when not on the site'}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={isSubscribed}
                        onCheckedChange={handlePushToggle}
                        disabled={pushLoading || permission === 'denied'}
                      />
                    </div>
                  )}

                  {permission === 'denied' && (
                    <div className="ml-7 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-xs text-amber-700 flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3" />
                        Push notifications are blocked. Enable them in your browser settings.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                        <p className="text-xs text-gray-500">Receive updates about your account</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences?.email_notifications ?? true}
                      onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
                      disabled={updatingPreference === 'email_notifications'}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Bell className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Marketing Emails</p>
                        <p className="text-xs text-gray-500">Receive tips, updates and offers</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences?.marketing_emails ?? false}
                      onCheckedChange={(checked) => updatePreference('marketing_emails', checked)}
                      disabled={updatingPreference === 'marketing_emails'}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Security Alerts</p>
                        <p className="text-xs text-gray-500">Get notified about suspicious activity</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences?.security_alerts ?? true}
                      onCheckedChange={(checked) => updatePreference('security_alerts', checked)}
                      disabled={updatingPreference === 'security_alerts'}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Key className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Security Emails</p>
                        <p className="text-xs text-gray-500">Password changes, account recovery</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences?.security_emails ?? true}
                      onCheckedChange={(checked) => updatePreference('security_emails' as keyof UserPreferences, checked)}
                      disabled={updatingPreference === 'security_emails'}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Login Notifications</p>
                        <p className="text-xs text-gray-500">Email when you sign in from new device</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences?.login_alerts ?? true}
                      onCheckedChange={(checked) => updatePreference('login_alerts' as keyof UserPreferences, checked)}
                      disabled={updatingPreference === 'login_alerts'}
                    />
                  </div>

                  {/* Order Emails */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Bell className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Order Updates</p>
                        <p className="text-xs text-gray-500">Order confirmations, delivery status</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences?.order_emails ?? true}
                      onCheckedChange={(checked) => updatePreference('order_emails' as keyof UserPreferences, checked)}
                      disabled={updatingPreference === 'order_emails'}
                    />
                  </div>

                  {/* Wallet Emails */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Bell className="h-4 w-4 text-emerald-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Wallet Notifications</p>
                        <p className="text-xs text-gray-500">Top-ups, refunds, low balance alerts</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences?.wallet_emails ?? true}
                      onCheckedChange={(checked) => updatePreference('wallet_emails' as keyof UserPreferences, checked)}
                      disabled={updatingPreference === 'wallet_emails'}
                    />
                  </div>

                  {/* Product Emails */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Bell className="h-4 w-4 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Product Updates</p>
                        <p className="text-xs text-gray-500">New products, price changes</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences?.product_emails ?? false}
                      onCheckedChange={(checked) => updatePreference('product_emails' as keyof UserPreferences, checked)}
                      disabled={updatingPreference === 'product_emails'}
                    />
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Danger Zone */}
          <AccordionItem value="danger" className="border-none">
            <AccordionTrigger className="px-6 py-4 hover:bg-red-50 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium text-red-600 block">Danger Zone</span>
                  <span className="text-xs text-gray-500">Irreversible account actions</span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                {/* Export Data */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <Download className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Export Your Data</p>
                      <p className="text-xs text-gray-500">Download all your data in JSON format</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportData}
                    disabled={isExporting}
                    className="text-gray-600 border-gray-200 hover:bg-gray-50 text-xs"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </>
                    )}
                  </Button>
                </div>

                {/* Delete Account */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Trash2 className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-red-600">Delete Account</p>
                      <p className="text-xs text-gray-500">Permanently delete your account and data</p>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white border border-gray-200">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600">Delete Account?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. Your account will be permanently deleted within 48 hours.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="py-4">
                        <label className="text-sm font-medium text-gray-700">
                          Why are you leaving? (optional)
                        </label>
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
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default ProfileSection;