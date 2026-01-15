import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
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
  Lock,
  Loader2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const ProfileSection = () => {
  const { profile, user } = useAuthContext();
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
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  // 2FA state (UI only)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

  const handleToggle2FA = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    toast.info(twoFactorEnabled ? 'Two-factor authentication disabled' : 'Two-factor authentication enabled (Demo)');
  };

  const handleDeleteAccount = async () => {
    toast.info('Account deletion request submitted. Our team will process this within 48 hours.');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4 lg:p-6 animate-fade-up">
      {/* Compact Profile Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6">
        <div className="flex items-center gap-5">
          {/* Avatar with change button */}
          <div className="relative group">
            <Avatar className="h-16 w-16 border-2 border-gray-100">
              <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
              <AvatarFallback className="bg-gray-900 text-white text-lg font-semibold">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
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

          {/* User info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {profile?.full_name || 'User'}
            </h2>
            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-1">
              Member since {formatDate(profile?.created_at)}
            </p>
          </div>

          {/* Pro badge */}
          {profile?.is_pro && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-900 text-white">
              PRO
            </span>
          )}
        </div>
      </div>

      {/* Settings Accordion */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
        <Accordion type="multiple" defaultValue={['personal']} className="divide-y divide-gray-100">
          
          {/* Personal Information */}
          <AccordionItem value="personal" className="border-none">
            <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Personal Information</span>
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
                          className="h-9 text-sm bg-white border-gray-300 flex-1"
                          placeholder="Enter your name"
                        />
                        <Button
                          size="sm"
                          onClick={handleSaveName}
                          disabled={loading}
                          className="h-9 bg-gray-900 hover:bg-gray-800"
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
                          className="h-9"
                        >
                          <X className="h-4 w-4" />
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
                    <p className="text-sm text-gray-900 mt-1">{user?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <Check className="h-3 w-3 mr-1" />
                      Verified
                    </span>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Security */}
          <AccordionItem value="security" className="border-none">
            <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Shield className="h-4 w-4 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Security</span>
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
                        <p className="text-xs text-gray-500">Keep your account secure</p>
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
                    <div className="mt-4 space-y-3 pl-7 animate-fade-up">
                      <div>
                        <div className="relative">
                          <Input
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder="New password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="h-9 text-sm bg-white border-gray-300 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        
                        {/* Password Strength */}
                        {newPassword && (
                          <div className="mt-2">
                            <div className="flex gap-1 mb-1">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
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
                        <Input
                          type="password"
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-9 text-sm bg-white border-gray-300"
                        />
                        {confirmPassword && newPassword && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {confirmPassword === newPassword ? (
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
                        disabled={passwordLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                        className="h-9 bg-gray-900 hover:bg-gray-800 text-sm"
                      >
                        {passwordLoading ? 'Updating...' : 'Update Password'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Two-Factor Authentication */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                      <p className="text-xs text-gray-500">Add an extra layer of security</p>
                    </div>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={handleToggle2FA}
                  />
                </div>

                {/* Active Sessions */}
                <div className="py-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Monitor className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Active Sessions</p>
                        <p className="text-xs text-gray-500">Manage your logged-in devices</p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-7 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-green-100 rounded">
                          <Monitor className="h-3.5 w-3.5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-900">Current Session</p>
                          <p className="text-xs text-gray-500">This device • Active now</p>
                        </div>
                      </div>
                      <span className="text-xs text-green-600 font-medium">Current</span>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Notifications */}
          <AccordionItem value="notifications" className="border-none">
            <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Bell className="h-4 w-4 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Notifications</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                      <p className="text-xs text-gray-500">Receive updates about your account</p>
                    </div>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
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
                    checked={marketingEmails}
                    onCheckedChange={setMarketingEmails}
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Lock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Security Alerts</p>
                      <p className="text-xs text-gray-500">Get notified about suspicious activity</p>
                    </div>
                  </div>
                  <Switch
                    checked={securityAlerts}
                    onCheckedChange={setSecurityAlerts}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Danger Zone */}
          <AccordionItem value="danger" className="border-none">
            <AccordionTrigger className="px-6 py-4 hover:bg-red-50 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </div>
                <span className="text-sm font-medium text-red-600">Danger Zone</span>
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
                    onClick={() => toast.info('Data export started. You\'ll receive an email when ready.')}
                    className="text-gray-600 border-gray-300 hover:bg-gray-50 text-xs"
                  >
                    Export
                  </Button>
                </div>

                {/* Sign Out All Devices */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <LogOut className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Sign Out All Devices</p>
                      <p className="text-xs text-gray-500">Log out from all other sessions</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.success('Signed out from all other devices')}
                    className="text-gray-600 border-gray-300 hover:bg-gray-50 text-xs"
                  >
                    Sign Out
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
                        variant="destructive"
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-xs"
                      >
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white border border-gray-200 shadow-xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900">Delete Account?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500">
                          This action cannot be undone. This will permanently delete your account
                          and remove all your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Delete Account
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
