import { Dialog, DialogContent } from '@/components/ui/dialog';
import ProductHoverPreview from './ProductHoverPreview';

interface MiniViewProduct {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  iconUrl: string | null;
  sellerName: string | null;
  sellerAvatar?: string | null;
  storeSlug: string | null;
  isVerified: boolean;
  soldCount?: number;
  rating?: number;
  reviewCount?: number;
  tags?: string[] | null;
  chatAllowed?: boolean;
}

interface MiniViewModalProps {
  product: MiniViewProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onBuy: () => void;
  onChat: () => void;
  onViewFull: () => void;
  isAuthenticated: boolean;
}

const MiniViewModal = ({
  product,
  isOpen,
  onClose,
  onBuy,
  onChat,
  onViewFull,
  isAuthenticated,
}: MiniViewModalProps) => {
  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[420px] p-0 border border-black/10 shadow-xl rounded-xl overflow-hidden">
        <ProductHoverPreview
          product={product}
          onBuy={onBuy}
          onChat={onChat}
          onViewFull={onViewFull}
          isAuthenticated={isAuthenticated}
        />
      </DialogContent>
    </Dialog>
  );
};

export default MiniViewModal;
