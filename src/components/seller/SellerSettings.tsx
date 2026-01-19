import { useState, useEffect } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
  Video,
  Globe
} from 'lucide-react';
import VideoUploader from './VideoUploader';

const SellerSettings = () => {
  const { profile, loading, refreshProfile } = useSellerContext();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
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

  useEffect(() => {
    if (profile) {
      setFormData({
        store_name: profile.store_name || '',
        store_description: profile.store_description || '',
        store_logo_url: profile.store_logo_url || '',
        store_banner_url: (profile as any).store_banner_url || '',
        store_video_url: (profile as any).store_video_url || '',
        store_tagline: (profile as any).store_tagline || '',
        store_slug: (profile as any).store_slug || ''
      });
      const links = (profile as any).social_links || {};
      setSocialLinks({
        instagram: links.instagram || '',
        twitter: links.twitter || '',
        tiktok: links.tiktok || '',
        youtube: links.youtube || ''
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile?.id) return;
    
    if (!formData.store_name.trim()) {
      toast.error('Store name is required');
      return;
    }
    
    setSaving(true);
    // Build social links object, filtering empty values
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
        social_links: Object.keys(socialLinksObj).length > 0 ? socialLinksObj : null
      })
      .eq('id', profile.id);

    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Settings saved successfully');
      refreshProfile();
    }
    setSaving(false);
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

    setFormData(prev => ({ ...prev, store_banner_url: publicUrl }));
    setBannerUploading(false);
    toast.success('Banner uploaded! Click Save to apply.');
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

    setFormData(prev => ({ ...prev, store_logo_url: publicUrl }));
    setUploading(false);
    toast.success('Logo uploaded! Click Save to apply.');
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 lg:p-8 space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 h-20" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
            <div className="relative">
              <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                <AvatarImage src={formData.store_logo_url} />
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xl font-bold">
                  {getInitials(formData.store_name || 'Store')}
                </AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full border border-slate-200 shadow-sm flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
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
            <div className="flex-1 pt-4 sm:pt-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900">{formData.store_name || 'Your Store'}</h2>
                {profile?.is_verified ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                    Pending
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Seller since {(profile as any)?.created_at ? new Date((profile as any).created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Accordion */}
      <Accordion type="multiple" defaultValue={['store-info', 'account-details']} className="space-y-4">
        {/* Store Information */}
        <AccordionItem value="store-info" className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 overflow-hidden">
          <AccordionTrigger className="py-5 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                <Store className="w-5 h-5 text-violet-600" />
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
                onChange={(e) => setFormData(prev => ({ ...prev, store_name: e.target.value }))}
                placeholder="Enter your store name"
                className="h-11 rounded-xl border-slate-200 focus:border-violet-500 focus:ring-violet-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store_description" className="text-sm font-medium text-slate-700">
                Store Description
              </Label>
              <Textarea
                id="store_description"
                value={formData.store_description}
                onChange={(e) => setFormData(prev => ({ ...prev, store_description: e.target.value }))}
                placeholder="Tell customers about your store..."
                rows={4}
                className="rounded-xl border-slate-200 focus:border-violet-500 focus:ring-violet-500/20 resize-none"
              />
              <p className="text-xs text-slate-400">This appears on your store profile</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="store_logo_url" className="text-sm font-medium text-slate-700">
                Logo URL
              </Label>
              <div className="flex gap-3">
                <Input
                  id="store_logo_url"
                  value={formData.store_logo_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, store_logo_url: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                  className="h-11 rounded-xl border-slate-200 focus:border-violet-500 focus:ring-violet-500/20"
                />
                <label className="flex-shrink-0">
                  <Button type="button" variant="outline" className="h-11 rounded-xl border-slate-200" disabled={uploading} asChild>
                    <span>
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Image className="w-4 h-4 mr-2" />
                          Upload
                        </>
                      )}
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            {/* Store URL */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Store URL
              </Label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-sm text-slate-500">{window.location.origin}/store/</span>
                <span className="text-sm font-medium text-violet-700">{formData.store_slug || 'your-store'}</span>
              </div>
              <p className="text-xs text-slate-400">Your store URL is auto-generated from your store name</p>
            </div>

            {/* Store Tagline */}
            <div className="space-y-2">
              <Label htmlFor="store_tagline" className="text-sm font-medium text-slate-700">
                Store Tagline
              </Label>
              <Input
                id="store_tagline"
                value={formData.store_tagline}
                onChange={(e) => setFormData(prev => ({ ...prev, store_tagline: e.target.value }))}
                placeholder="e.g., Premium AI accounts at unbeatable prices"
                className="h-11 rounded-xl border-slate-200 focus:border-violet-500 focus:ring-violet-500/20"
                maxLength={100}
              />
              <p className="text-xs text-slate-400">A catchy phrase that appears on your store page</p>
            </div>

            {/* Store Banner */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Store Banner</Label>
              {formData.store_banner_url && (
                <div className="relative rounded-xl overflow-hidden border border-slate-200">
                  <img 
                    src={formData.store_banner_url} 
                    alt="Store banner" 
                    className="w-full h-32 object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setFormData(prev => ({ ...prev, store_banner_url: '' }))}
                  >
                    Remove
                  </Button>
                </div>
              )}
              {!formData.store_banner_url && (
                <label className="block">
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-violet-300 hover:bg-violet-50/50 transition-colors cursor-pointer">
                    {bannerUploading ? (
                      <Loader2 className="w-8 h-8 text-violet-600 mx-auto animate-spin" />
                    ) : (
                      <>
                        <Image className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-600">Click to upload banner image</p>
                        <p className="text-xs text-slate-400">Recommended: 1920x400px</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                    disabled={bannerUploading}
                  />
                </label>
              )}
            </div>

            {/* Profile Video */}
            <VideoUploader
              currentVideoUrl={formData.store_video_url}
              onVideoChange={(url) => setFormData(prev => ({ ...prev, store_video_url: url }))}
              sellerId={profile?.id || ''}
            />
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
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Instagram</Label>
              <Input
                value={socialLinks.instagram}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
                placeholder="username (without @)"
                className="h-11 rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Twitter / X</Label>
              <Input
                value={socialLinks.twitter}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
                placeholder="username (without @)"
                className="h-11 rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">TikTok</Label>
              <Input
                value={socialLinks.tiktok}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, tiktok: e.target.value }))}
                placeholder="username (without @)"
                className="h-11 rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">YouTube</Label>
              <Input
                value={socialLinks.youtube}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, youtube: e.target.value }))}
                placeholder="channel name or full URL"
                className="h-11 rounded-xl border-slate-200"
              />
            </div>
            <p className="text-xs text-slate-400">These links will appear on your public store page</p>
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
              {/* Status */}
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

              {/* Verification */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-slate-600">Verification</span>
                </div>
                <p className="text-lg font-semibold text-slate-900">
                  {profile?.is_verified ? 'Verified' : 'Unverified'}
                </p>
              </div>

              {/* Commission Rate */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <Percent className="w-5 h-5 text-violet-500" />
                  <span className="text-sm font-medium text-slate-600">Commission Rate</span>
                </div>
                <p className="text-lg font-semibold text-slate-900">
                  {profile?.commission_rate || 15}%
                </p>
              </div>

              {/* Total Products */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <ShoppingBag className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-medium text-slate-600">Total Products</span>
                </div>
                <p className="text-lg font-semibold text-slate-900">
                  {(profile as any)?.total_products || 0}
                </p>
              </div>

              {/* Total Sales */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium text-slate-600">Total Sales</span>
                </div>
                <p className="text-lg font-semibold text-slate-900">
                  ${(Number(profile?.total_sales) || 0).toFixed(2)}
                </p>
              </div>

              {/* Member Since */}
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

            <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Note:</span> Commission rate and verification status are managed by the platform administrators.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default SellerSettings;