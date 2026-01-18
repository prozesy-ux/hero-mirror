import { useState } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2, Store, Camera, CheckCircle, Clock, Shield } from 'lucide-react';

const SellerSettings = () => {
  const { profile, refreshProfile, loading } = useSellerContext();
  const [formData, setFormData] = useState({
    store_name: profile.store_name,
    store_description: profile.store_description || '',
    store_logo_url: profile.store_logo_url || ''
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.store_name.trim()) {
      toast.error('Store name is required');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('seller_profiles')
        .update({
          store_name: formData.store_name.trim(),
          store_description: formData.store_description.trim() || null,
          store_logo_url: formData.store_logo_url.trim() || null
        })
        .eq('id', profile.id);

      if (error) throw error;
      toast.success('Settings saved');
      refreshProfile();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Max file size is 2MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `seller-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, store_logo_url: publicUrl }));
      toast.success('Logo uploaded! Click Save to apply.');
    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500">Manage your store settings</p>
        </div>

        {/* Store Info Card */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-6">Store Information</h2>
          
          <form onSubmit={handleSave} className="space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <Avatar className="h-20 w-20 ring-2 ring-slate-100">
                  <AvatarImage src={formData.store_logo_url} />
                  <AvatarFallback className="bg-emerald-50 text-emerald-600 text-xl font-semibold">
                    {profile.store_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label 
                  htmlFor="logo-upload"
                  className="absolute -bottom-1 -right-1 p-2 rounded-full bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600 transition-colors shadow-sm"
                >
                  {uploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
                  )}
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </div>
              <div>
                <p className="font-medium text-slate-900">Store Logo</p>
                <p className="text-sm text-slate-500">JPG, PNG or GIF. Max 2MB.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="store_name">Store Name</Label>
              <Input
                id="store_name"
                value={formData.store_name}
                onChange={(e) => setFormData(prev => ({ ...prev, store_name: e.target.value }))}
                className="border-slate-200"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store_description">Description</Label>
              <Textarea
                id="store_description"
                value={formData.store_description}
                onChange={(e) => setFormData(prev => ({ ...prev, store_description: e.target.value }))}
                placeholder="Tell buyers about your store..."
                rows={4}
                className="border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store_logo_url">Logo URL (optional)</Label>
              <Input
                id="store_logo_url"
                type="url"
                value={formData.store_logo_url}
                onChange={(e) => setFormData(prev => ({ ...prev, store_logo_url: e.target.value }))}
                placeholder="https://example.com/logo.jpg"
                className="border-slate-200"
              />
            </div>

            <Button 
              type="submit" 
              disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </div>

        {/* Account Info Card */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-6">Account Details</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-slate-600">Status</span>
              <Badge 
                variant="outline" 
                className={profile.is_active 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                  : 'bg-red-50 text-red-600 border-red-200'
                }
              >
                {profile.is_active ? (
                  <><CheckCircle className="h-3 w-3 mr-1" />Active</>
                ) : (
                  <>Suspended</>
                )}
              </Badge>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-slate-600">Verification</span>
              <Badge 
                variant="outline" 
                className={profile.is_verified 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                  : 'bg-amber-50 text-amber-600 border-amber-200'
                }
              >
                {profile.is_verified ? (
                  <><Shield className="h-3 w-3 mr-1" />Verified</>
                ) : (
                  <><Clock className="h-3 w-3 mr-1" />Pending</>
                )}
              </Badge>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-slate-600">Commission Rate</span>
              <span className="font-semibold text-slate-900">{profile.commission_rate}%</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-slate-600">Total Orders</span>
              <span className="font-semibold text-slate-900">{profile.total_orders}</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-slate-600">Total Sales</span>
              <span className="font-semibold text-slate-900">${Number(profile.total_sales || 0).toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-slate-600">Member Since</span>
              <span className="font-medium text-slate-900">
                {format(new Date((profile as any).created_at || Date.now()), 'MMM d, yyyy')}
              </span>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              Commission rate and verification status are managed by administrators.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerSettings;
