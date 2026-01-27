import { ArrowLeft, CheckCircle, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MobileStoreHeaderProps {
  storeName: string;
  storeLogoUrl: string | null;
  isVerified: boolean;
  onShare: () => void;
}

const MobileStoreHeader = ({
  storeName,
  storeLogoUrl,
  isVerified,
  onShare
}: MobileStoreHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="md:hidden sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100 px-3 py-2.5 safe-area-top">
      <div className="flex items-center justify-between gap-3">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors tap-feedback"
          aria-label="Go back"
        >
          <ArrowLeft size={22} className="text-slate-700" />
        </button>

        {/* Store Info */}
        <div className="flex-1 flex items-center gap-2.5 min-w-0">
          <Avatar className="w-8 h-8 border-2 border-white shadow-sm flex-shrink-0">
            <AvatarImage src={storeLogoUrl || ''} />
            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-xs font-bold">
              {storeName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-slate-900 truncate text-sm">
              {storeName}
            </span>
            {isVerified && (
              <CheckCircle size={14} className="text-emerald-500 fill-emerald-100 flex-shrink-0" />
            )}
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={onShare}
          className="p-2 -mr-1 rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors tap-feedback"
          aria-label="Share store"
        >
          <Share2 size={18} className="text-slate-700" />
        </button>
      </div>
    </div>
  );
};

export default MobileStoreHeader;
