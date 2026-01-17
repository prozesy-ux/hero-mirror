import { useState } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2, Store, Camera, Info } from 'lucide-react';

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
      toast.success('Settings saved successfully');
      refreshProfile();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
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
      toast.success('Logo uploaded! Click Save to apply changes.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Store Settings</h1>
        <p className="text-muted-foreground">Manage your store information</p>
      </div>

      {/* Store Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Store Information</CardTitle>
          <CardDescription>Update your store details visible to buyers</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            {/* Logo Upload */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={formData.store_logo_url} />
                  <AvatarFallback className="bg-emerald-500/10">
                    <Store className="h-8 w-8 text-emerald-500" />
                  </AvatarFallback>
                </Avatar>
                <label 
                  htmlFor="logo-upload"
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600 transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Camera className="h-3 w-3" />
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
                <p className="font-medium">Store Logo</p>
                <p className="text-sm text-muted-foreground">
                  JPG, PNG or GIF. Max 2MB.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="store_name">Store Name *</Label>
              <Input
                id="store_name"
                value={formData.store_name}
                onChange={(e) => setFormData(prev => ({ ...prev, store_name: e.target.value }))}
                placeholder="Your Store Name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store_description">Store Description</Label>
              <Textarea
                id="store_description"
                value={formData.store_description}
                onChange={(e) => setFormData(prev => ({ ...prev, store_description: e.target.value }))}
                placeholder="Tell buyers about your store and what you offer..."
                rows={4}
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
              />
              <p className="text-xs text-muted-foreground">
                Or upload a logo using the button above
              </p>
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
        </CardContent>
      </Card>

      {/* Account Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your seller account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-muted-foreground">Account Status</span>
            <span className={`font-medium ${profile.is_active ? 'text-emerald-500' : 'text-destructive'}`}>
              {profile.is_active ? 'Active' : 'Suspended'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-muted-foreground">Verification</span>
            <span className={`font-medium ${profile.is_verified ? 'text-emerald-500' : 'text-yellow-500'}`}>
              {profile.is_verified ? 'Verified' : 'Pending'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-muted-foreground">Commission Rate</span>
            <span className="font-medium">{profile.commission_rate}%</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-muted-foreground">Total Orders</span>
            <span className="font-medium">{profile.total_orders}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-muted-foreground">Total Sales</span>
            <span className="font-medium">${Number(profile.total_sales || 0).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Member Since</span>
            <span className="font-medium">
              {format(new Date((profile as any).created_at || Date.now()), 'MMMM d, yyyy')}
            </span>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-blue-500/10 flex gap-3">
            <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-600">
              Commission rate and verification status are managed by the platform administrators.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerSettings;
