import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load card components for performance
const CourseCard = lazy(() => import('./CourseCard'));
const EbookCard = lazy(() => import('./EbookCard'));
const SoftwareCard = lazy(() => import('./SoftwareCard'));
const ServiceCard = lazy(() => import('./ServiceCard'));
const BundleCard = lazy(() => import('./BundleCard'));
const MembershipCard = lazy(() => import('./MembershipCard'));
const MediaCard = lazy(() => import('./MediaCard'));
const TipCard = lazy(() => import('./TipCard'));
const DigitalProductCard = lazy(() => import('./DigitalProductCard'));

// Shared product interface for all card types
export interface ProductCardData {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  originalPrice?: number | null;
  iconUrl: string | null;
  images?: string[] | null;
  sellerName: string | null;
  sellerAvatar?: string | null;
  storeSlug: string | null;
  isVerified?: boolean;
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  productType?: string;
  tags?: string[] | null;
  // Course specific
  lessonCount?: number;
  totalDuration?: string;
  progress?: number;
  // Ebook specific
  pageCount?: number;
  formats?: string[];
  // Software specific
  version?: string;
  platforms?: string[];
  // Service specific
  responseTime?: string;
  availability?: string;
  // Media specific
  duration?: string;
  // Bundle specific
  itemCount?: number;
  includedItems?: string[];
  // Membership specific
  accessType?: 'lifetime' | 'monthly' | 'yearly';
}

export interface ProductCardProps {
  product: ProductCardData;
  onClick: () => void;
  onBuy?: () => void;
  onChat?: () => void;
  hasEnoughBalance?: boolean;
  isLoggedIn?: boolean;
  purchasing?: boolean;
  variant?: 'default' | 'compact';
}

const CardSkeleton = () => (
  <div className="bg-white rounded-xl overflow-hidden border border-black/10">
    <Skeleton className="aspect-square w-full" />
    <div className="p-3 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-5 w-1/4" />
    </div>
  </div>
);

const ProductCardRenderer = ({ product, ...props }: ProductCardProps) => {
  const productType = product.productType?.toLowerCase() || 'digital_product';

  const renderCard = () => {
    switch (productType) {
      // Learning Products
      case 'course':
      case 'tutorial':
        return <CourseCard product={product} onClick={props.onClick} />;

      // E-book
      case 'ebook':
        return <EbookCard product={product} onClick={props.onClick} />;

      // Software & Templates
      case 'software':
        return <SoftwareCard product={product} onClick={props.onClick} />;

      case 'template':
      case 'graphics':
        return <DigitalProductCard product={product} onClick={props.onClick} variant="template" />;

      // Media
      case 'video':
        return <MediaCard product={product} onClick={props.onClick} variant="video" />;

      case 'audio':
        return <MediaCard product={product} onClick={props.onClick} variant="audio" />;

      // Services
      case 'service':
      case 'commission':
      case 'call':
        return <ServiceCard product={product} onClick={props.onClick} serviceType={productType as 'service' | 'commission' | 'call'} />;

      // Membership & Bundle
      case 'membership':
        return <MembershipCard product={product} onClick={props.onClick} />;

      case 'bundle':
        return <BundleCard product={product} onClick={props.onClick} />;

      // Coffee / Tip
      case 'coffee':
        return <TipCard product={product} onClick={props.onClick} />;

      // Default: Digital Product
      default:
        return <DigitalProductCard product={product} onClick={props.onClick} />;
    }
  };

  return (
    <Suspense fallback={<CardSkeleton />}>
      {renderCard()}
    </Suspense>
  );
};

export default ProductCardRenderer;
