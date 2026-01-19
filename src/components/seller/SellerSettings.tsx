import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSellerContext } from '@/contexts/SellerContext';
import { useSellerSidebarContext } from '@/contexts/SellerSidebarContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
  Save, 
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
  AlertTriangle
} from 'lucide-react';
import VideoUploader from './VideoUploader';

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
  const navigate = useNavigate();
  const { profile, orders, loading, refreshProfile } = useSellerContext();
  const { isCollapsed } = useSellerSidebarContext();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bannerType, setBannerType] = useState<BannerType>('image');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
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
      toast.success('Changes saved automatically');
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
  };

  const handleDeleteStore = async () => {
    if (!profile?.id) return;
    
    setDeleting(true);
    try {
      // Delete all products first
      await supabase.from('seller_products').delete().eq('seller_id', profile.id);
      
      // Delete the seller profile
      const { error } = await supabase.from('seller_profiles').delete().eq('id', profile.id);
      
      if (error) throw error;
      
      // Remove seller role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_roles').delete().eq('user_id', user.id).eq('role', 'seller');
      }
      
      toast.success('Store deleted successfully');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete store');
    } finally {
      setDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
    <div className="max-w-3xl mx-auto p-6 lg:p-8 pb-24 space-y-6 seller-dashboard">
      {/* Profile Header - Banner First Design */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
        {/* Dynamic Banner */}
        <div className="relative">
          {formData.store_banner_url ? (
            <div className="relative">
              <img 
                src={formData.store_banner_url} 
                alt="Store banner"
                className="w-full h-32 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          ) : (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-32" />
          )}
        </div>
        
        {/* Content Area */}
        <div className="px-6 pb-6 pt-4">
          <div className="flex items-start gap-4">
            {/* Logo with upload */}
            <div className="relative -mt-14 z-20 flex-shrink-0">
              <Avatar className="w-20 h-20 border-4 border-white shadow-lg ring-2 ring-slate-100">
                <AvatarImage src={formData.store_logo_url} />
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xl font-bold">
                  {getInitials(formData.store_name || 'Store')}
                </AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full border border-slate-200 shadow-sm flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors z-30">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : (
                  <Upload className="w-4 h-4 text-slate-500" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            
            {/* Store Info - Separate rows */}
            <div className="flex-1 min-w-0 pt-1">
              {/* Store Name */}
              <h2 className="seller-heading text-2xl font-bold text-slate-900 truncate leading-tight">
                {formData.store_name || 'Your Store'}
              </h2>
              
              {/* Badges - Separate row */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {profile?.is_verified ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs px-2 py-0.5">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-xs px-2 py-0.5">
                    Pending Verification
                  </Badge>
                )}
                {hasChanges && (
                  <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 animate-pulse text-xs px-2 py-0.5">
                    Unsaved Changes
                  </Badge>
                )}
              </div>
              
              {/* Seller since */}
              <p className="text-sm text-slate-500 mt-2">
                Seller since {(profile as any)?.created_at ? new Date((profile as any).created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
              </p>
            </div>
            
            {/* Saving indicator */}
            {saving && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 flex-shrink-0">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Accordion */}
      <Accordion type="multiple" defaultValue={['store-info', 'display-settings']} className="space-y-4">
        {/* Store Information */}
        <AccordionItem value="store-info" className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 overflow-hidden">
          <AccordionTrigger className="py-5 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                <Store className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900">Store Information</p>
                <p className="text-sm text-slate-500">Manage your store name, description, and branding</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="store_name" className="text-sm font-medium text-slate-700">
                Store Name
              </Label>
              <Input
                id="store_name"
                value={formData.store_name}
                onChange={(e) => updateFormData({ store_name: e.target.value })}
                placeholder="Enter your store name"
                className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store_tagline" className="text-sm font-medium text-slate-700">
                Store Tagline
              </Label>
              <Input
                id="store_tagline"
                value={formData.store_tagline}
                onChange={(e) => updateFormData({ store_tagline: e.target.value })}
                placeholder="e.g., Premium AI accounts at unbeatable prices"
                className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store_description" className="text-sm font-medium text-slate-700">
                Store Description
              </Label>
              <Textarea
                id="store_description"
                value={formData.store_description}
                onChange={(e) => updateFormData({ store_description: e.target.value })}
                placeholder="Tell customers about your store..."
                rows={4}
                className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 resize-none"
              />
            </div>

            {/* Store URL */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Store URL
              </Label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-sm text-slate-500">{window.location.origin}/store/</span>
                <span className="text-sm font-medium text-emerald-700">{formData.store_slug || 'your-store'}</span>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Logo URL</Label>
              <div className="flex gap-3">
                <Input
                  value={formData.store_logo_url}
                  onChange={(e) => updateFormData({ store_logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="h-11 rounded-xl border-slate-200"
                />
                <label className="flex-shrink-0">
                  <Button type="button" variant="outline" className="h-11 rounded-xl border-slate-200" disabled={uploading} asChild>
                    <span>
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Image className="w-4 h-4 mr-2" />Upload</>}
                    </span>
                  </Button>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
            </div>

            {/* Banner Type Selector */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700">Store Banner</Label>
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
                  {/* Image URL Input */}
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500">Image URL or Upload</Label>
                    <div className="flex gap-3">
                      <Input
                        value={formData.store_banner_url}
                        onChange={(e) => updateFormData({ store_banner_url: e.target.value })}
                        placeholder="https://example.com/banner.jpg"
                        className="h-10 rounded-xl border-slate-200"
                      />
                      <label className="flex-shrink-0">
                        <Button type="button" variant="outline" className="h-10 rounded-xl border-slate-200" disabled={bannerUploading} asChild>
                          <span>
                            {bannerUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          </span>
                        </Button>
                        <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" disabled={bannerUploading} />
                      </label>
                    </div>
                  </div>
                  
                  {/* Banner Preview */}
                  {formData.store_banner_url && (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200">
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
          </AccordionContent>
        </AccordionItem>

        {/* Display Settings */}
        <AccordionItem value="display-settings" className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 overflow-hidden">
          <AccordionTrigger className="py-5 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                <Palette className="w-5 h-5 text-violet-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900">Display Settings</p>
                <p className="text-sm text-slate-500">Control what's visible on your public store</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 space-y-5">
            {/* Banner Height */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Banner Height</Label>
              <Select
                value={displaySettings.banner_height}
                onValueChange={(value: BannerHeight) => updateDisplaySettings({ banner_height: value })}
              >
                <SelectTrigger className="h-11 rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Toggle Switches */}
            <div className="space-y-4 pt-2">
              {[
                { key: 'show_reviews', label: 'Show Reviews', desc: 'Display rating stars on your store', icon: Star, color: 'amber' },
                { key: 'show_product_count', label: 'Show Product Count', desc: 'Display total products on your store', icon: Package, color: 'blue' },
                { key: 'show_order_count', label: 'Show Order Count', desc: 'Display total orders on your store', icon: Users, color: 'emerald' },
                { key: 'show_description', label: 'Show Description', desc: 'Display store description on your page', icon: displaySettings.show_description ? Eye : EyeOff, color: 'slate' },
                { key: 'show_social_links', label: 'Show Social Links', desc: 'Display your social media on store', icon: Link2, color: 'pink' },
              ].map(({ key, label, desc, icon: Icon, color }) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-${color}-100 flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 text-${color}-600`} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{label}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={displaySettings[key as keyof DisplaySettings] as boolean}
                    onCheckedChange={(checked) => updateDisplaySettings({ [key]: checked })}
                  />
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Social Media Links */}
        <AccordionItem value="social-links" className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 overflow-hidden">
          <AccordionTrigger className="py-5 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-pink-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900">Social Media Links</p>
                <p className="text-sm text-slate-500">Add your social profiles to display on your store</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 space-y-4">
            {['instagram', 'twitter', 'tiktok', 'youtube'].map((platform) => (
              <div key={platform} className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 capitalize">{platform === 'twitter' ? 'Twitter / X' : platform}</Label>
                <Input
                  value={socialLinks[platform as keyof typeof socialLinks]}
                  onChange={(e) => updateSocialLinks({ [platform]: e.target.value })}
                  placeholder={platform === 'youtube' ? 'channel name or full URL' : 'username (without @)'}
                  className="h-11 rounded-xl border-slate-200"
                />
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Account Details */}
        <AccordionItem value="account-details" className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 overflow-hidden">
          <AccordionTrigger className="py-5 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900">Account Details</p>
                <p className="text-sm text-slate-500">View your account status and commission settings</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  {profile?.is_active ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm font-medium text-slate-600">Account Status</span>
                </div>
                <p className="text-lg font-semibold text-slate-900">
                  {profile?.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-slate-600">Verification</span>
                </div>
                <p className="text-lg font-semibold text-slate-900">
                  {profile?.is_verified ? 'Verified' : 'Unverified'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <Percent className="w-5 h-5 text-violet-500" />
                  <span className="text-sm font-medium text-slate-600">Commission Rate</span>
                </div>
                <p className="text-lg font-semibold text-slate-900">
                  {profile?.commission_rate || 0}%
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium text-slate-600">Total Sales</span>
                </div>
                <p className="text-lg font-semibold text-slate-900">
                  ${(Number(profile?.total_sales) || 0).toFixed(2)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <ShoppingBag className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-medium text-slate-600">Total Sales Count</span>
                </div>
                <p className="text-lg font-semibold text-slate-900">
                  {totalSalesCount}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-slate-600">Total Orders</span>
                </div>
                <p className="text-lg font-semibold text-slate-900">
                  {totalOrdersCount}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-slate-500" />
                  <span className="text-sm font-medium text-slate-600">Member Since</span>
                </div>
                <p className="text-lg font-semibold text-slate-900">
                  {(profile as any)?.created_at ? new Date((profile as any).created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'N/A'}
                </p>
              </div>
            </div>

            {/* Delete Store */}
            <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-900">Danger Zone</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Deleting your store will permanently remove all your products, orders, and data. This action cannot be undone.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="mt-3" disabled={deleting}>
                        {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                        Delete Store
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your store "{formData.store_name}" and remove all associated products, orders, and data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteStore} className="bg-red-600 hover:bg-red-700">
                          Delete Store
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default SellerSettings;