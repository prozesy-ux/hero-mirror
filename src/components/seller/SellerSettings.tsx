import { useState, useEffect, useRef, useCallback } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Store, 
  Upload, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Shield,
  Percent,
  ShoppingBag,
  DollarSign,
  Calendar,
  Settings,
  Image,
  Link2,
  Palette,
  Eye,
  EyeOff,
  Globe,
  Star,
  Package,
  Users,
  Trash2,
  Video,
  AlertTriangle,
  Bell,
  BellRing,
  ChevronLeft
} from 'lucide-react';
import VideoUploader from './VideoUploader';
import ProfileHeader from '@/components/profile/ProfileHeader';
import MenuListItem from '@/components/profile/MenuListItem';
import SectionHeader from '@/components/profile/SectionHeader';
import StatusToggleCard from '@/components/profile/StatusToggleCard';

type BannerHeight = 'small' | 'medium' | 'large';
type BannerType = 'image' | 'video';

interface DisplaySettings {
  banner_height: BannerHeight;
  show_reviews: boolean;
  show_product_count: boolean;
  show_order_count: boolean;
  show_description: boolean;
  show_social_links: boolean;
}

const SellerSettings = () => {
  const { profile, orders, loading, refreshProfile } = useSellerContext();
  const { permission, isSubscribed, isLoading: pushLoading, subscribe, unsubscribe, isSupported } = usePushNotifications();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bannerType, setBannerType] = useState<BannerType>('image');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  // Sheet states for sub-views
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  
  // Online status
  const [isOnline, setIsOnline] = useState(true);
  
  const [formData, setFormData] = useState({
    store_name: '',
    store_description: '',
    store_logo_url: '',
    store_banner_url: '',
    store_video_url: '',
    store_tagline: '',
    store_slug: ''
  });
  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    twitter: '',
    tiktok: '',
    youtube: ''
  });
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    banner_height: 'medium',
    show_reviews: true,
    show_product_count: true,
    show_order_count: true,
    show_description: true,
    show_social_links: true
  });

  // Calculate stats
  const totalSalesCount = orders.filter(o => o.status === 'completed').length;
  const totalOrdersCount = orders.length;

  useEffect(() => {
    if (profile) {
      const p = profile as any;
      setFormData({
        store_name: profile.store_name || '',
        store_description: profile.store_description || '',
        store_logo_url: profile.store_logo_url || '',
        store_banner_url: p.store_banner_url || '',
        store_video_url: p.store_video_url || '',
        store_tagline: p.store_tagline || '',
        store_slug: p.store_slug || ''
      });
      const links = p.social_links || {};
      setSocialLinks({
        instagram: links.instagram || '',
        twitter: links.twitter || '',
        tiktok: links.tiktok || '',
        youtube: links.youtube || ''
      });
      setDisplaySettings({
        banner_height: p.banner_height || 'medium',
        show_reviews: p.show_reviews !== false,
        show_product_count: p.show_product_count !== false,
        show_order_count: p.show_order_count !== false,
        show_description: p.show_description !== false,
        show_social_links: p.show_social_links !== false
      });
      setBannerType(p.banner_type || 'image');
    }
  }, [profile]);

  // Auto-save with debounce
  const autoSave = useCallback(async () => {
    if (!profile?.id || !hasChanges) return;
    
    if (!formData.store_name.trim()) return;
    
    setSaving(true);
    const socialLinksObj: Record<string, string> = {};
    if (socialLinks.instagram.trim()) socialLinksObj.instagram = socialLinks.instagram.trim();
    if (socialLinks.twitter.trim()) socialLinksObj.twitter = socialLinks.twitter.trim();
    if (socialLinks.tiktok.trim()) socialLinksObj.tiktok = socialLinks.tiktok.trim();
    if (socialLinks.youtube.trim()) socialLinksObj.youtube = socialLinks.youtube.trim();

    const { error } = await supabase
      .from('seller_profiles')
      .update({
        store_name: formData.store_name.trim(),
        store_description: formData.store_description.trim() || null,
        store_logo_url: formData.store_logo_url.trim() || null,
        store_banner_url: formData.store_banner_url.trim() || null,
        store_video_url: formData.store_video_url.trim() || null,
        store_tagline: formData.store_tagline.trim() || null,
        social_links: Object.keys(socialLinksObj).length > 0 ? socialLinksObj : null,
        banner_height: displaySettings.banner_height,
        banner_type: bannerType,
        show_reviews: displaySettings.show_reviews,
        show_product_count: displaySettings.show_product_count,
        show_order_count: displaySettings.show_order_count,
        show_description: displaySettings.show_description,
        show_social_links: displaySettings.show_social_links
      })
      .eq('id', profile.id);

    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Changes saved');
      setHasChanges(false);
      refreshProfile();
    }
    setSaving(false);
  }, [profile?.id, formData, socialLinks, displaySettings, bannerType, hasChanges, refreshProfile]);

  // Trigger auto-save after 2 seconds of no changes
  useEffect(() => {
    if (hasChanges) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        autoSave();
      }, 2000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasChanges, autoSave]);

  // Mark changes
  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const updateSocialLinks = (updates: Partial<typeof socialLinks>) => {
    setSocialLinks(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const updateDisplaySettings = (updates: Partial<DisplaySettings>) => {
    setDisplaySettings(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setBannerUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `store-banners/${profile.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('store-media')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast.error('Failed to upload banner');
      setBannerUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('store-media')
      .getPublicUrl(fileName);

    updateFormData({ store_banner_url: publicUrl });
    setBannerUploading(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `seller-logos/${profile.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast.error('Failed to upload logo');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    updateFormData({ store_logo_url: publicUrl });
    setUploading(false);
    setActiveSheet(null);
  };

  const handleDeleteStore = async () => {
    if (!profile?.id) return;
    
    const { data: walletData } = await supabase
      .from('seller_wallets')
      .select('balance, pending_balance')
      .eq('seller_id', profile.id)
      .single();
    
    const totalBalance = (walletData?.balance || 0) + (walletData?.pending_balance || 0);
    
    if (totalBalance >= 5) {
      toast.error(`You have $${totalBalance.toFixed(2)} in your wallet. Please withdraw funds before deleting.`);
      return;
    }
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('seller_profiles')
        .update({ 
          is_deleted: true, 
          deleted_at: new Date().toISOString(),
          is_active: false,
          deletion_reason: 'User requested deletion'
        })
        .eq('id', profile.id);
      
      if (error) throw error;
      
      await supabase.auth.signOut();
      toast.success('Store deleted successfully');
      window.location.href = '/';
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete store');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const bannerHeightPx: Record<BannerHeight, string> = {
    small: 'h-24',
    medium: 'h-32',
    large: 'h-44'
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl seller-dashboard">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-0 pb-24 space-y-4 seller-dashboard">
      {/* Hidden file inputs */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        onChange={handleLogoUpload}
        className="hidden"
      />

      {/* Profile Header */}
      <ProfileHeader
        avatarUrl={formData.store_logo_url}
        name={formData.store_name || 'Your Store'}
        subtitle={`Seller since ${formatDate((profile as any)?.created_at)}`}
        isOnline={isOnline}
        isVerified={profile?.is_verified}
        gradient="emerald"
        avatarLoading={uploading}
        onAvatarClick={() => setActiveSheet('store-logo')}
      />

      {/* Unsaved changes indicator */}
      {(hasChanges || saving) && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span className="text-emerald-600">Saving...</span>
            </>
          ) : (
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 animate-pulse">
              Unsaved changes
            </Badge>
          )}
        </div>
      )}

      {/* STORE Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <SectionHeader title="Store" />
        
        <MenuListItem
          icon={Store}
          label="Store Information"
          description="Name, tagline, and description"
          onClick={() => setActiveSheet('store-info')}
          iconColor="text-emerald-500"
        />
        
        <MenuListItem
          icon={Palette}
          label="Display Settings"
          description="Control what's visible on your store"
          onClick={() => setActiveSheet('display-settings')}
          iconColor="text-violet-500"
        />
        
        <MenuListItem
          icon={Image}
          label="Banner & Media"
          description="Store banner image or video"
          onClick={() => setActiveSheet('banner-media')}
          iconColor="text-pink-500"
        />
        
        <MenuListItem
          icon={Link2}
          label="Social Media Links"
          description="Instagram, Twitter, TikTok, YouTube"
          onClick={() => setActiveSheet('social-links')}
          iconColor="text-blue-500"
        />
      </div>

      {/* SETTINGS Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <SectionHeader title="Settings" />
        
        {isSupported && (
          <MenuListItem
            icon={Bell}
            label="Notifications"
            description={isSubscribed ? 'Push notifications enabled' : 'Enable push notifications'}
            onClick={() => setActiveSheet('notifications')}
            iconColor="text-purple-500"
          />
        )}
        
        <MenuListItem
          icon={Shield}
          label="Two-Factor Authentication"
          value={(profile as any)?.two_factor_enabled !== false ? 'ON' : 'OFF'}
          onClick={() => setActiveSheet('two-factor')}
          iconColor="text-emerald-500"
        />
        
        <MenuListItem
          icon={Settings}
          label="Account Details"
          description="Status, commission, and stats"
          onClick={() => setActiveSheet('account-details')}
          iconColor="text-gray-600"
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
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <div>
              <MenuListItem
                icon={Trash2}
                label="Delete Store"
                description="Permanently delete your store and data"
                variant="danger"
              />
            </div>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600">Delete Store?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your store "{formData.store_name}" and remove all associated products, orders, and data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteStore}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Store'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Store Logo Sheet */}
      <Sheet open={activeSheet === 'store-logo'} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="text-center pb-4">
            <SheetTitle>Store Logo</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 pb-safe">
            <Button
              variant="ghost"
              className="w-full justify-start h-14 text-base"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-5 h-5 mr-3 text-gray-600" />
              {uploading ? 'Uploading...' : 'Choose from Library'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Store Information Sheet */}
      <Sheet open={activeSheet === 'store-info'} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="flex flex-row items-center gap-3 pb-6">
            <Button variant="ghost" size="icon" onClick={() => setActiveSheet(null)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <SheetTitle>Store Information</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Store Name</Label>
              <Input
                value={formData.store_name}
                onChange={(e) => updateFormData({ store_name: e.target.value })}
                placeholder="Enter your store name"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label>Store Tagline</Label>
              <Input
                value={formData.store_tagline}
                onChange={(e) => updateFormData({ store_tagline: e.target.value })}
                placeholder="e.g., Premium AI accounts at unbeatable prices"
                className="mt-2"
                maxLength={100}
              />
            </div>
            
            <div>
              <Label>Store Description</Label>
              <Textarea
                value={formData.store_description}
                onChange={(e) => updateFormData({ store_description: e.target.value })}
                placeholder="Tell customers about your store..."
                className="mt-2"
                rows={4}
              />
            </div>
            
            <div>
              <Label className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Store URL
              </Label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mt-2">
                <span className="text-sm text-gray-500 truncate">{window.location.origin}/store/</span>
                <span className="text-sm font-medium text-emerald-700">{formData.store_slug || 'your-store'}</span>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Display Settings Sheet */}
      <Sheet open={activeSheet === 'display-settings'} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="flex flex-row items-center gap-3 pb-6">
            <Button variant="ghost" size="icon" onClick={() => setActiveSheet(null)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <SheetTitle>Display Settings</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Banner Height</Label>
              <Select
                value={displaySettings.banner_height}
                onValueChange={(value: BannerHeight) => updateDisplaySettings({ banner_height: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3 pt-4">
              {[
                { key: 'show_reviews', label: 'Show Reviews', icon: Star },
                { key: 'show_product_count', label: 'Show Product Count', icon: Package },
                { key: 'show_order_count', label: 'Show Order Count', icon: Users },
                { key: 'show_description', label: 'Show Description', icon: Eye },
                { key: 'show_social_links', label: 'Show Social Links', icon: Link2 },
              ].map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <Switch
                    checked={displaySettings[key as keyof DisplaySettings] as boolean}
                    onCheckedChange={(checked) => updateDisplaySettings({ [key]: checked })}
                  />
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Banner & Media Sheet */}
      <Sheet open={activeSheet === 'banner-media'} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="flex flex-row items-center gap-3 pb-6">
            <Button variant="ghost" size="icon" onClick={() => setActiveSheet(null)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <SheetTitle>Banner & Media</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4">
            <Tabs value={bannerType} onValueChange={(v) => { setBannerType(v as BannerType); setHasChanges(true); }} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="image" className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Image
                </TabsTrigger>
                <TabsTrigger value="video" className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Video
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="image" className="mt-4 space-y-3">
                <div>
                  <Label>Image URL or Upload</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={formData.store_banner_url}
                      onChange={(e) => updateFormData({ store_banner_url: e.target.value })}
                      placeholder="https://example.com/banner.jpg"
                    />
                    <label>
                      <Button type="button" variant="outline" disabled={bannerUploading} asChild>
                        <span>
                          {bannerUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        </span>
                      </Button>
                      <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" disabled={bannerUploading} />
                    </label>
                  </div>
                </div>
                
                {formData.store_banner_url && (
                  <div className="relative rounded-xl overflow-hidden border">
                    <img src={formData.store_banner_url} alt="Store banner" className={`w-full object-cover ${bannerHeightPx[displaySettings.banner_height]}`} />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => updateFormData({ store_banner_url: '' })}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="video" className="mt-4">
                <VideoUploader
                  currentVideoUrl={formData.store_video_url}
                  onVideoChange={(url) => updateFormData({ store_video_url: url })}
                  sellerId={profile?.id || ''}
                />
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* Social Links Sheet */}
      <Sheet open={activeSheet === 'social-links'} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="flex flex-row items-center gap-3 pb-6">
            <Button variant="ghost" size="icon" onClick={() => setActiveSheet(null)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <SheetTitle>Social Media Links</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4">
            {['instagram', 'twitter', 'tiktok', 'youtube'].map((platform) => (
              <div key={platform}>
                <Label className="capitalize">{platform === 'twitter' ? 'Twitter / X' : platform}</Label>
                <Input
                  value={socialLinks[platform as keyof typeof socialLinks]}
                  onChange={(e) => updateSocialLinks({ [platform]: e.target.value })}
                  placeholder={platform === 'youtube' ? 'channel name or full URL' : 'username (without @)'}
                  className="mt-2"
                />
              </div>
            ))}
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
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-4 border-b">
              <div className="flex items-center gap-3">
                <BellRing className="w-4 h-4 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium">Push Notifications</p>
                  <p className="text-xs text-gray-500">
                    {permission === 'denied' ? 'Blocked in browser' : 'New orders, messages & payments'}
                  </p>
                </div>
              </div>
              <Switch
                checked={isSubscribed}
                onCheckedChange={isSubscribed ? unsubscribe : subscribe}
                disabled={pushLoading || permission === 'denied'}
              />
            </div>

            {permission === 'denied' && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Notifications blocked. Enable in browser settings.
                </p>
              </div>
            )}

            <div className="p-4 rounded-xl bg-gray-50 border">
              <p className="text-sm font-medium mb-2">When enabled, you'll receive:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  New orders from buyers
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Chat messages
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Funds released to wallet
                </li>
              </ul>
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
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border">
              <div>
                <p className="font-medium text-sm">Enable 2FA Protection</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  OTP required for withdrawals
                </p>
              </div>
              <Switch 
                checked={(profile as any)?.two_factor_enabled !== false}
                onCheckedChange={async (checked) => {
                  if (!profile?.id) return;
                  setSaving(true);
                  try {
                    const { error } = await supabase
                      .from('seller_profiles')
                      .update({ two_factor_enabled: checked })
                      .eq('id', profile.id);
                    if (error) throw error;
                    await refreshProfile();
                    toast.success(checked ? '2FA enabled' : '2FA disabled');
                  } catch (err: any) {
                    toast.error(err.message || 'Failed to update 2FA');
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
              />
            </div>
            
            {(profile as any)?.two_factor_enabled !== false ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-emerald-900">Protection Active</h4>
                    <p className="text-sm text-emerald-700 mt-1">
                      OTP code required for all withdrawals.
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
                      Withdrawals process without OTP verification.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Account Details Sheet */}
      <Sheet open={activeSheet === 'account-details'} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="flex flex-row items-center gap-3 pb-6">
            <Button variant="ghost" size="icon" onClick={() => setActiveSheet(null)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <SheetTitle>Account Details</SheetTitle>
          </SheetHeader>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-gray-50 border">
              <div className="flex items-center gap-2 mb-2">
                {profile?.is_active ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-xs text-gray-500">Status</span>
              </div>
              <p className="font-semibold">{profile?.is_active ? 'Active' : 'Inactive'}</p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-500">Verification</span>
              </div>
              <p className="font-semibold">{profile?.is_verified ? 'Verified' : 'Unverified'}</p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-4 h-4 text-violet-500" />
                <span className="text-xs text-gray-500">Commission</span>
              </div>
              <p className="font-semibold">{profile?.commission_rate || 0}%</p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-gray-500">Total Sales</span>
              </div>
              <p className="font-semibold">${(Number(profile?.total_sales) || 0).toFixed(2)}</p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-gray-500">Completed</span>
              </div>
              <p className="font-semibold">{totalSalesCount}</p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-500">Orders</span>
              </div>
              <p className="font-semibold">{totalOrdersCount}</p>
            </div>

            <div className="col-span-2 p-4 rounded-xl bg-gray-50 border">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500">Member Since</span>
              </div>
              <p className="font-semibold">
                {(profile as any)?.created_at ? new Date((profile as any).created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                }) : 'N/A'}
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default SellerSettings;
