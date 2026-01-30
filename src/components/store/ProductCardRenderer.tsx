import EbookProductCard from './cards/EbookProductCard';
import RoadSelfieCard from './cards/RoadSelfieCard';
import DigitalAccountCard from './cards/DigitalAccountCard';
import SoftwareCard from './cards/SoftwareCard';
import CourseCard from './cards/CourseCard';
import TemplateCard from './cards/TemplateCard';
import GraphicsCard from './cards/GraphicsCard';
import AudioCard from './cards/AudioCard';
import VideoCard from './cards/VideoCard';
import ServiceCard from './cards/ServiceCard';
import StoreProductCard from './StoreProductCard';
import StoreProductCardCompact from './StoreProductCardCompact';

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
  stock: number | null;
  sold_count: number | null;
  chat_allowed: boolean | null;
  seller_id: string;
  view_count?: number | null;
  product_type?: string | null;
  type_metadata?: Record<string, any>;
}

interface ProductCardRendererProps {
  product: SellerProduct;
  storeName?: string;
  hasEnoughBalance?: boolean;
  isLoggedIn?: boolean;
  purchasing?: boolean;
  isMobile?: boolean;
  onView: () => void;
  onBuy: () => void;
  onChat?: () => void;
}

const ProductCardRenderer = ({ 
  product, 
  storeName,
  hasEnoughBalance = true,
  isLoggedIn = false,
  purchasing = false,
  isMobile = false,
  onView, 
  onBuy,
  onChat
}: ProductCardRendererProps) => {
  const productType = product.product_type || 'other';
  
  // Common props for type-specific cards
  const commonProps = {
    product,
    onView,
    onBuy,
    purchasing
  };

  // For mobile, we might want to use compact cards regardless of type
  // For now, type-specific cards work on both mobile and desktop
  
  switch (productType) {
    case 'ebook':
      return <EbookProductCard {...commonProps} />;
    
    case 'road_selfie':
      return <RoadSelfieCard {...commonProps} />;
    
    case 'digital_account':
      return <DigitalAccountCard {...commonProps} />;
    
    case 'software':
      return <SoftwareCard {...commonProps} />;
    
    case 'course':
      return <CourseCard {...commonProps} />;
    
    case 'template':
      return <TemplateCard {...commonProps} />;
    
    case 'graphics':
      return <GraphicsCard {...commonProps} />;
    
    case 'audio':
      return <AudioCard {...commonProps} />;
    
    case 'video':
      return <VideoCard {...commonProps} />;
    
    case 'service':
      return <ServiceCard {...commonProps} />;
    
    default:
      // Use the existing default cards
      if (isMobile) {
        return (
          <StoreProductCardCompact
            product={product}
            hasEnoughBalance={hasEnoughBalance}
            isLoggedIn={isLoggedIn}
            purchasing={purchasing}
            onView={onView}
            onBuy={onBuy}
          />
        );
      }
      
      return (
        <StoreProductCard
          product={product}
          storeName={storeName || ''}
          hasEnoughBalance={hasEnoughBalance}
          isLoggedIn={isLoggedIn}
          purchasing={purchasing}
          onChat={onChat}
          onView={onView}
          onBuy={onBuy}
        />
      );
  }
};

export default ProductCardRenderer;
