import StoreProductCard from './StoreProductCard';
import EbookProductCard from './EbookProductCard';
import CourseProductCard from './CourseProductCard';
import MembershipProductCard from './MembershipProductCard';
import GalleryProductCard from './GalleryProductCard';

interface SellerProduct {
  id: string;
  slug?: string;
  name: string;
  description: string | null;
  price: number;
  icon_url: string | null;
  images?: string[] | null;
  category_id: string | null;
  tags: string[] | null;
  sold_count: number | null;
  chat_allowed: boolean | null;
  seller_id: string;
  product_type?: string | null;
}

interface ProductCardRendererProps {
  product: SellerProduct;
  storeName: string;
  storeSlug?: string;
  hasEnoughBalance: boolean;
  isLoggedIn: boolean;
  purchasing: boolean;
  onChat: () => void;
  onView: () => void;
  onBuy: () => void;
}

export function ProductCardRenderer({
  product,
  storeName,
  storeSlug,
  hasEnoughBalance,
  isLoggedIn,
  purchasing,
  onChat,
  onView,
  onBuy,
}: ProductCardRendererProps) {
  const commonProps = {
    product,
    storeName,
    storeSlug,
    hasEnoughBalance,
    isLoggedIn,
    purchasing,
    onChat,
    onView,
    onBuy,
  };

  switch (product.product_type) {
    case 'ebook':
      return <EbookProductCard {...commonProps} />;
    case 'course':
      return <CourseProductCard {...commonProps} />;
    case 'membership':
      return <MembershipProductCard {...commonProps} />;
    case 'art':
    case 'photo':
      return <GalleryProductCard {...commonProps} />;
    default:
      return <StoreProductCard {...commonProps} />;
  }
}

export default ProductCardRenderer;
