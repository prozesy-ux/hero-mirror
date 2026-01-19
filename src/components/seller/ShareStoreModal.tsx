import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Copy, 
  Check, 
  Share2, 
  Facebook, 
  Twitter, 
  MessageCircle,
  QrCode,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface ShareStoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeSlug: string | null;
  storeName: string;
}

const ShareStoreModal = ({ open, onOpenChange, storeSlug, storeName }: ShareStoreModalProps) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const storeUrl = storeSlug 
    ? `${window.location.origin}/store/${storeSlug}`
    : null;

  const handleCopy = async () => {
    if (!storeUrl) return;
    
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = (platform: string) => {
    if (!storeUrl) return;
    
    const text = `Check out ${storeName} on our marketplace!`;
    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(storeUrl)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${storeUrl}`)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const handleNativeShare = async () => {
    if (!storeUrl || !navigator.share) return;

    try {
      await navigator.share({
        title: storeName,
        text: `Check out ${storeName} on our marketplace!`,
        url: storeUrl
      });
    } catch (err) {
      // User cancelled or error
    }
  };

  // Generate QR code URL using a free service
  const qrCodeUrl = storeUrl 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(storeUrl)}`
    : null;

  if (!storeSlug) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-violet-600" />
              Share Your Store
            </DialogTitle>
            <DialogDescription>
              Your store URL is being generated. Please save your settings first.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-amber-500" />
            </div>
            <p className="text-slate-600 mb-4">
              Go to Settings and save your store information to generate your unique store URL.
            </p>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-violet-600" />
            Share Your Store
          </DialogTitle>
          <DialogDescription>
            Share your store link with customers to drive more sales.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Store URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Your Store Link</label>
            <div className="flex gap-2">
              <Input
                value={storeUrl || ''}
                readOnly
                className="text-sm bg-slate-50"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Preview Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open(storeUrl!, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Preview Your Store
          </Button>

          {/* Social Share Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Share on Social Media</label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => handleShare('twitter')}
                className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-sky-50 hover:border-sky-200"
              >
                <Twitter className="w-5 h-5 text-sky-500" />
                <span className="text-xs">Twitter</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare('facebook')}
                className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-blue-50 hover:border-blue-200"
              >
                <Facebook className="w-5 h-5 text-blue-600" />
                <span className="text-xs">Facebook</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare('whatsapp')}
                className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-green-50 hover:border-green-200"
              >
                <MessageCircle className="w-5 h-5 text-green-500" />
                <span className="text-xs">WhatsApp</span>
              </Button>
            </div>
          </div>

          {/* QR Code */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => setShowQR(!showQR)}
            >
              <span className="flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                QR Code
              </span>
              <span className="text-xs text-slate-500">{showQR ? 'Hide' : 'Show'}</span>
            </Button>
            
            {showQR && qrCodeUrl && (
              <div className="flex justify-center p-4 bg-white rounded-xl border border-slate-200">
                <img 
                  src={qrCodeUrl} 
                  alt="Store QR Code" 
                  className="w-48 h-48"
                />
              </div>
            )}
          </div>

          {/* Native Share (if available) */}
          {'share' in navigator && (
            <Button
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              onClick={handleNativeShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share...
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareStoreModal;
