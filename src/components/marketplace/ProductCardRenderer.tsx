import { lazy, Suspense, ComponentType } from 'react';
import { CardProduct, CardSettings, CardLayoutProps, mergeCardSettings } from './card-types';

const DigitalProductCard = lazy(() => import('./card-layouts/DigitalProductCard'));
const CourseCard = lazy(() => import('./card-layouts/CourseCard'));
const EbookCard = lazy(() => import('./card-layouts/EbookCard'));
const MembershipCard = lazy(() => import('./card-layouts/MembershipCard'));
const BundleCard = lazy(() => import('./card-layouts/BundleCard'));
const SoftwareCard = lazy(() => import('./card-layouts/SoftwareCard'));
const TemplateCard = lazy(() => import('./card-layouts/TemplateCard'));
const GraphicsCard = lazy(() => import('./card-layouts/GraphicsCard'));
const AudioCard = lazy(() => import('./card-layouts/AudioCard'));
const VideoCard = lazy(() => import('./card-layouts/VideoCard'));
const ServiceCard = lazy(() => import('./card-layouts/ServiceCard'));
const CommissionCard = lazy(() => import('./card-layouts/CommissionCard'));
const CallCard = lazy(() => import('./card-layouts/CallCard'));
const CoffeeCard = lazy(() => import('./card-layouts/CoffeeCard'));

const LAYOUT_MAP: Record<string, React.LazyExoticComponent<ComponentType<CardLayoutProps>>> = {
  digital_product: DigitalProductCard,
  course: CourseCard,
  ebook: EbookCard,
  membership: MembershipCard,
  bundle: BundleCard,
  software: SoftwareCard,
  template: TemplateCard,
  graphics: GraphicsCard,
  audio: AudioCard,
  video: VideoCard,
  service: ServiceCard,
  commission: CommissionCard,
  call: CallCard,
  coffee: CoffeeCard,
};

interface ProductCardRendererProps {
  product: CardProduct;
  storeCardSettings?: Partial<CardSettings>;
  sellerName?: string;
  sellerAvatar?: string | null;
  onClick: () => void;
  onBuy?: () => void;
  onChat?: () => void;
  purchasing?: boolean;
  isLoggedIn?: boolean;
  hasEnoughBalance?: boolean;
}

const ProductCardRenderer = ({
  product,
  storeCardSettings,
  sellerName,
  sellerAvatar,
  onClick,
  onBuy,
  onChat,
  purchasing,
  isLoggedIn,
  hasEnoughBalance,
}: ProductCardRendererProps) => {
  // Merge store defaults → product overrides
  const productOverrides = (product.product_metadata as any)?.card_overrides as Partial<CardSettings> | undefined;
  const settings = mergeCardSettings(storeCardSettings || {}, productOverrides);

  const productType = product.product_type || 'digital_product';
  const LayoutComponent = LAYOUT_MAP[productType] || DigitalProductCard;

  return (
    <Suspense fallback={<div className="animate-pulse bg-slate-100 rounded-xl aspect-[3/4]" />}>
      <LayoutComponent
        product={product}
        settings={settings}
        sellerName={sellerName}
        sellerAvatar={sellerAvatar}
        onClick={onClick}
        onBuy={onBuy}
        onChat={onChat}
        purchasing={purchasing}
        isLoggedIn={isLoggedIn}
        hasEnoughBalance={hasEnoughBalance}
      />
    </Suspense>
  );
};

export default ProductCardRenderer;
