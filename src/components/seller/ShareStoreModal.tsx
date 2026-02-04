import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
        <DialogContent className="max-w-md p-0 overflow-hidden">
          {/* Pink accent bar */}
          <div className="h-1 bg-[#FF90E8]" />
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <div className="w-8 h-8 rounded border border-black bg-[#FF90E8] flex items-center justify-center">
                <Share2 className="w-4 h-4 text-black" />
              </div>
              Share Your Store
            </DialogTitle>
            <DialogDescription>
              Your store URL is being generated. Please save your settings first.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded border border-black bg-[#FF90E8] flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-black" />
            </div>
            <p className="text-slate-600 mb-4">
              Go to Settings and save your store information to generate your unique store URL.
            </p>
            <button 
              onClick={() => onOpenChange(false)} 
              className="px-4 py-2 border border-black rounded text-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Got it
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Pink accent bar */}
        <div className="h-1 bg-[#FF90E8]" />
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <div className="w-8 h-8 rounded border border-black bg-[#FF90E8] flex items-center justify-center">
              <Share2 className="w-4 h-4 text-black" />
            </div>
            Share Your Store
          </DialogTitle>
          <DialogDescription>
            Share your store link with customers to drive more sales.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 p-6 pt-4">
          {/* Store URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Your Store Link</label>
            <div className="flex gap-2">
              <input
                value={storeUrl || ''}
                readOnly
                className="flex-1 px-3 py-2 text-sm border border-black rounded bg-white"
              />
              <button 
                onClick={handleCopy}
                className="shrink-0 p-2 border border-black rounded hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Preview Button */}
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-black rounded text-black font-medium hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            onClick={() => window.open(storeUrl!, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
            Preview Your Store
          </button>

          {/* Social Share Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Share on Social Media</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleShare('twitter')}
                className="flex flex-col items-center gap-2 h-auto py-4 border border-black rounded hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <Twitter className="w-5 h-5 text-sky-500" />
                <span className="text-xs">Twitter</span>
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="flex flex-col items-center gap-2 h-auto py-4 border border-black rounded hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <Facebook className="w-5 h-5 text-blue-600" />
                <span className="text-xs">Facebook</span>
              </button>
              <button
                onClick={() => handleShare('whatsapp')}
                className="flex flex-col items-center gap-2 h-auto py-4 border border-black rounded hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <MessageCircle className="w-5 h-5 text-green-500" />
                <span className="text-xs">WhatsApp</span>
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div className="space-y-2">
            <button
              className="w-full flex items-center justify-between px-4 py-2 border border-black rounded hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              onClick={() => setShowQR(!showQR)}
            >
              <span className="flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                QR Code
              </span>
              <span className="text-xs text-slate-500">{showQR ? 'Hide' : 'Show'}</span>
            </button>
            
            {showQR && qrCodeUrl && (
              <div className="flex justify-center p-4 bg-white rounded border border-black">
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
            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FF90E8] border border-black rounded text-black font-semibold hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              onClick={handleNativeShare}
            >
              <Share2 className="w-4 h-4" />
              Share...
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareStoreModal;
