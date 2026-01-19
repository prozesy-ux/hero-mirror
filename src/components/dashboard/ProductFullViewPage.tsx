import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Package, Star, Users, Check, MessageCircle, Wallet, Loader2, Store, ShieldCheck, Zap, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFloatingChat } from '@/contexts/FloatingChatContext';
import { toast } from 'sonner';
import ImageGallery from '@/components/ui/image-gallery';
import ProductReviews from '@/components/reviews/ProductReviews';

// Import product images
import chatgptLogo from '@/assets/chatgpt-logo.avif';
import midjourneyLogo from '@/assets/midjourney-logo.avif';
import geminiLogo from '@/assets/gemini-logo.avif';

interface DynamicCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  is_active: boolean;
}

interface SellerProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  icon_url: string | null;
  images: string[] | null;
  category_id: string | null;
  is_available: boolean;
  tags: string[] | null;
  stock: number | null;
  sold_count: number | null;
  seller_id: string;
  chat_allowed: boolean | null;
  requires_email: boolean | null;
  seller_profiles: {
    id: string;
    store_name: string;
    store_logo_url: string | null;
    is_verified: boolean;
  } | null;
}

interface AIAccount {
  id: string;
  name: string;
  description: string | null;
  price: number;
  icon_url: string | null;
  category: string | null;
  category_id: string | null;
  is_available: boolean;
  is_trending: boolean;
  original_price: number | null;
  tags: string[] | null;
  stock: number | null;
  chat_allowed?: boolean | null;
}

const getProductImage = (category: string | null) => {
  switch (category?.toLowerCase()) {
    case 'chatgpt':
      return chatgptLogo;
    case 'midjourney':
      return midjourneyLogo;
    case 'gemini':
      return geminiLogo;
    default:
      return chatgptLogo;
  }
};

const getCategoryColorClass = (color: string | null) => {
  const colorMap: Record<string, string> = {
    'violet': 'bg-violet-500',
    'emerald': 'bg-emerald-500',
    'blue': 'bg-blue-500',
    'rose': 'bg-rose-500',
    'amber': 'bg-amber-500',
    'indigo': 'bg-indigo-500',
    'cyan': 'bg-cyan-500',
    'pink': 'bg-pink-500',
    'orange': 'bg-orange-500',
    'teal': 'bg-teal-500',
  };
  return colorMap[color || ''] || 'bg-gray-500';
};

const ProductFullViewPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { openChat } = useFloatingChat();

  const [product, setProduct] = useState<SellerProduct | AIAccount | null>(null);
  const [isSellerProduct, setIsSellerProduct] = useState(false);
  const [categories, setCategories] = useState<DynamicCategory[]>([]);
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (productId) {
      fetchProduct();
      fetchCategories();
    }
  }, [productId]);

  useEffect(() => {
    if (user) {
      fetchWallet();
    }
  }, [user]);

  const fetchProduct = async () => {
    if (!productId) return;
    setLoading(true);

    // Try seller products first
    const { data: sellerProduct, error: sellerError } = await supabase
      .from('seller_products')
      .select(`
        *,
        seller_profiles (id, store_name, store_logo_url, is_verified)
      `)
      .eq('id', productId)
      .single();

    if (!sellerError && sellerProduct) {
      setProduct(sellerProduct as SellerProduct);
      setIsSellerProduct(true);
      setLoading(false);
      return;
    }

    // Try AI accounts
    const { data: aiAccount, error: aiError } = await supabase
      .from('ai_accounts')
      .select('*')
      .eq('id', productId)
      .single();

    if (!aiError && aiAccount) {
      setProduct(aiAccount as AIAccount);
      setIsSellerProduct(false);
    }

    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, icon, color, is_active')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (!error && data) {
      setCategories(data);
    }
  };

  const fetchWallet = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      const { data: newWallet } = await supabase
        .from('user_wallets')
        .insert({ user_id: user.id, balance: 0 })
        .select('balance')
        .single();
      setWallet(newWallet);
    } else if (data) {
      setWallet(data);
    }
  };

  const handlePurchase = async () => {
    if (!user || !product) {
      toast.error('Please sign in to purchase');
      return;
    }

    const hasEnoughBalance = (wallet?.balance || 0) >= product.price;
    if (!hasEnoughBalance) {
      navigate('/dashboard/billing');
      toast.info('Please top up your wallet first');
      return;
    }

    setPurchasing(true);
    // Purchase logic would be implemented here
    toast.success('Redirecting to purchase...');
    navigate('/dashboard/ai-accounts');
    setPurchasing(false);
  };

  const handleChat = () => {
    if (!product) return;

    if (isSellerProduct) {
      const sellerProduct = product as SellerProduct;
      openChat({
        sellerId: sellerProduct.seller_id,
        sellerName: sellerProduct.seller_profiles?.store_name || 'Seller',
        productId: sellerProduct.id,
        productName: sellerProduct.name,
        type: 'seller'
      });
    } else {
      openChat({
        sellerId: 'support',
        sellerName: 'Uptoza Support',
        productId: product.id,
        productName: product.name,
        type: 'support'
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/dashboard/ai-accounts?search=${encodeURIComponent(searchQuery)}`);
  };

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/dashboard/ai-accounts?category=${categoryId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-violet-600 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Product Not Found</h2>
        <p className="text-gray-500 mb-4">The product you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/dashboard/ai-accounts')}
          className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors"
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  const hasEnoughBalance = (wallet?.balance || 0) >= product.price;
  const sellerProduct = isSellerProduct ? (product as SellerProduct) : null;
  const aiAccount = !isSellerProduct ? (product as AIAccount) : null;

  // Get images for gallery
  const productImages = sellerProduct?.images || [];
  const mainImage = product.icon_url;

  return (
    <div className="min-h-screen">
      {/* Header with Back Button and Search */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4">
          {/* Back Button */}
          <button
            onClick={() => navigate('/dashboard/ai-accounts')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar - Categories */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sticky top-24">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Categories</h3>
            <div className="space-y-1">
              <button
                onClick={() => handleCategoryClick('all')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-violet-100 text-violet-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                All Products
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? 'bg-violet-100 text-violet-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${getCategoryColorClass(category.color)}`} />
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Content - Product Details */}
        <div className="flex-1 max-w-4xl">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
            {/* Product Image Gallery */}
            <div className="p-6 border-b border-gray-100">
              <ImageGallery
                images={productImages}
                mainImage={mainImage}
                alt={product.name}
                showThumbnails={productImages.length > 0}
                enableZoom={true}
                aspectRatio="video"
              />
            </div>

            {/* Product Info */}
            <div className="p-6">
              {/* Seller/Uptoza Badge */}
              {isSellerProduct && sellerProduct?.seller_profiles ? (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                    <Store size={14} />
                    {sellerProduct.seller_profiles.store_name}
                    {sellerProduct.seller_profiles.is_verified && (
                      <ShieldCheck size={14} className="text-blue-500" />
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-4">
                  <div className="px-3 py-1.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-full text-sm font-bold">
                    Uptoza
                  </div>
                </div>
              )}

              {/* Title */}
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

              {/* Rating & Sales */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                  <span className="text-gray-600 text-sm font-medium ml-1">5.0</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                  <Users size={14} />
                  <span className="font-medium">
                    {isSellerProduct ? (sellerProduct?.sold_count || 0) : Math.floor(Math.random() * 500) + 100}+ sold
                  </span>
                </div>
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              <p className="text-gray-600 leading-relaxed mb-6 whitespace-pre-line" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                {product.description || 'Premium account with full access to all features. Get instant access to the most powerful tools available.'}
              </p>

              {/* Price & Wallet Balance */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Price</p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold text-gray-900">${product.price.toFixed(2)}</p>
                    {aiAccount?.original_price && aiAccount.original_price > aiAccount.price && (
                      <span className="text-lg text-gray-400 line-through">${aiAccount.original_price}</span>
                    )}
                  </div>
                  <p className="text-xs text-emerald-600 font-medium">One-time payment</p>
                </div>
                {user && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Your Balance</p>
                    <p className={`text-2xl font-bold ${hasEnoughBalance ? 'text-emerald-600' : 'text-red-500'}`}>
                      ${(wallet?.balance || 0).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm">
                  <ShieldCheck size={16} />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
                  <Zap size={16} />
                  <span>Instant Delivery</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 text-violet-700 rounded-lg text-sm">
                  <Clock size={16} />
                  <span>24/7 Support</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {/* Chat Button */}
                {(isSellerProduct ? sellerProduct?.chat_allowed !== false : aiAccount?.chat_allowed !== false) && (
                  <button
                    onClick={handleChat}
                    className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                      isSellerProduct
                        ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                        : 'bg-violet-100 hover:bg-violet-200 text-violet-700'
                    }`}
                  >
                    <MessageCircle size={18} />
                    {isSellerProduct ? 'Chat with Seller' : 'Chat with Uptoza'}
                  </button>
                )}

                {/* Buy Button */}
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className={`flex-1 px-6 py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${
                    purchasing
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : hasEnoughBalance
                      ? 'bg-yellow-400 hover:bg-yellow-500 text-black'
                      : 'bg-violet-600 hover:bg-violet-700 text-white'
                  }`}
                >
                  {purchasing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : hasEnoughBalance ? (
                    <>
                      <Check size={18} />
                      Buy Now
                    </>
                  ) : (
                    <>
                      <Wallet size={18} />
                      Top Up Wallet
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-6 bg-white rounded-2xl border border-gray-200 shadow-md p-6">
            <ProductReviews productId={productId || ''} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFullViewPage;
