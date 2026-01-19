import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Bot, ArrowRight, Heart, Lock, Star, Check, ImageIcon, ShoppingCart, X, Wallet, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Import logos and assets
import chatgptLogo from '@/assets/chatgpt-logo.avif';
import midjourneyLogo from '@/assets/midjourney-logo.avif';
import geminiLogo from '@/assets/gemini-logo.avif';
import starsIcon from '@/assets/stars.svg';
import btnArrow from '@/assets/btn-arrow.svg';

interface Prompt {
  id: string;
  title: string;
  image_url: string | null;
  tool: string;
  is_free: boolean;
  is_featured: boolean;
  description: string | null;
}

interface AIAccount {
  id: string;
  name: string;
  description: string | null;
  price: number;
  icon_url: string | null;
  category: string | null;
}

interface PendingPurchase {
  productId: string;
  productName: string;
  sellerId: string;
  price: number;
  storeSlug: string;
  iconUrl: string | null;
}

const DashboardHome = () => {
  const navigate = useNavigate();
  const [trendingPrompts, setTrendingPrompts] = useState<Prompt[]>([]);
  const [aiAccounts, setAiAccounts] = useState<AIAccount[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [accountFavorites, setAccountFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPromptsPaused, setIsPromptsPaused] = useState(false);
  const [isAccountsPaused, setIsAccountsPaused] = useState(false);
  
  // Pending purchase state
  const [pendingPurchase, setPendingPurchase] = useState<PendingPurchase | null>(null);
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  
  const promptsScrollRef = useRef<HTMLDivElement>(null);
  const accountsScrollRef = useRef<HTMLDivElement>(null);
  
  const { user, isPro, profile } = useAuthContext();

  useEffect(() => {
    fetchData();
  }, [user]);

  // Fetch wallet balance
  useEffect(() => {
    const fetchWallet = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();
      if (data) setWallet(data);
    };
    fetchWallet();
  }, [user]);

  // Check for pending purchase from store redirect
  useEffect(() => {
    const storedPurchase = localStorage.getItem('pendingPurchase');
    if (storedPurchase) {
      try {
        const data = JSON.parse(storedPurchase) as PendingPurchase;
        setPendingPurchase(data);
        // Remove from localStorage so it doesn't show again on refresh
        localStorage.removeItem('pendingPurchase');
        toast.success(`Welcome! Complete your purchase of "${data.productName}"`);
      } catch (e) {
        console.error('Failed to parse pendingPurchase', e);
        localStorage.removeItem('pendingPurchase');
      }
    }
  }, []);

  // Auto-slide for Trending Prompts
  useEffect(() => {
    if (isPromptsPaused || trendingPrompts.length === 0) return;
    
    const interval = setInterval(() => {
      if (promptsScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = promptsScrollRef.current;
        const maxScroll = scrollWidth - clientWidth;
        
        if (scrollLeft >= maxScroll - 10) {
          promptsScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          promptsScrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }
    }, 3500);
    
    return () => clearInterval(interval);
  }, [isPromptsPaused, trendingPrompts]);

  // Auto-slide for AI Accounts
  useEffect(() => {
    if (isAccountsPaused || aiAccounts.length === 0) return;
    
    const interval = setInterval(() => {
      if (accountsScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = accountsScrollRef.current;
        const maxScroll = scrollWidth - clientWidth;
        
        if (scrollLeft >= maxScroll - 10) {
          accountsScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          accountsScrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }
    }, 3500);
    
    return () => clearInterval(interval);
  }, [isAccountsPaused, aiAccounts]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch trending/featured prompts (limit to 8 for scrollable)
    const { data: promptsData } = await supabase
      .from('prompts')
      .select('id, title, image_url, tool, is_free, is_featured, description')
      .eq('is_featured', true)
      .limit(8);
    
    setTrendingPrompts(promptsData || []);

    // Fetch AI accounts (limit to 8 for scrollable)
    const { data: accountsData } = await supabase
      .from('ai_accounts')
      .select('id, name, description, price, icon_url, category')
      .eq('is_available', true)
      .limit(8);
    
    setAiAccounts(accountsData || []);

    // Fetch user favorites
    if (user) {
      const { data: favoritesData } = await supabase
        .from('favorites')
        .select('prompt_id')
        .eq('user_id', user.id);
      
      setFavorites(favoritesData?.map(f => f.prompt_id) || []);
    }

    setLoading(false);
  };

  const toggleFavorite = async (promptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to add favorites');
      return;
    }

    const isFavorite = favorites.includes(promptId);

    if (isFavorite) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('prompt_id', promptId);
      setFavorites(favorites.filter(id => id !== promptId));
      toast.success('Removed from favorites');
    } else {
      await supabase
        .from('favorites')
        .insert({ user_id: user.id, prompt_id: promptId });
      setFavorites([...favorites, promptId]);
      toast.success('Added to favorites');
    }
  };

  const toggleAccountFavorite = (accountId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (accountFavorites.includes(accountId)) {
      setAccountFavorites(accountFavorites.filter(id => id !== accountId));
      toast.success('Removed from favorites');
    } else {
      setAccountFavorites([...accountFavorites, accountId]);
      toast.success('Added to favorites');
    }
  };

  const canAccessPrompt = (prompt: Prompt) => prompt.is_free || isPro;

  const getProductImage = (category: string | null) => {
    switch (category) {
      case 'chatgpt': return chatgptLogo;
      case 'midjourney': return midjourneyLogo;
      case 'gemini': return geminiLogo;
      default: return chatgptLogo;
    }
  };

  // Handle completing the pending purchase
  const handleCompletePurchase = async () => {
    if (!pendingPurchase || !user) return;
    
    const currentBalance = wallet?.balance || 0;
    
    if (currentBalance < pendingPurchase.price) {
      toast.error('Insufficient balance. Please top up your wallet.');
      navigate('/dashboard/wallet');
      return;
    }

    setPurchasing(true);

    try {
      // Create seller order
      const { error } = await supabase.from('seller_orders').insert({
        seller_id: pendingPurchase.sellerId,
        buyer_id: user.id,
        product_id: pendingPurchase.productId,
        amount: pendingPurchase.price,
        seller_earning: pendingPurchase.price * 0.85,
        status: 'pending'
      });

      if (error) throw error;

      // Deduct from wallet
      await supabase
        .from('user_wallets')
        .update({ balance: currentBalance - pendingPurchase.price })
        .eq('user_id', user.id);

      toast.success('Purchase successful! The seller will deliver your order soon.');
      setPendingPurchase(null);
      
      // Refresh wallet
      const { data: walletData } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();
      if (walletData) setWallet(walletData);
    } catch (error: any) {
      toast.error(error.message || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 lg:space-y-10 animate-fade-up">
      {/* Pending Purchase Modal */}
      <Dialog open={!!pendingPurchase} onOpenChange={(open) => !open && setPendingPurchase(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              Complete Your Purchase
            </DialogTitle>
          </DialogHeader>
          
          {pendingPurchase && (
            <div className="space-y-4">
              {/* Product Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                {pendingPurchase.iconUrl ? (
                  <img 
                    src={pendingPurchase.iconUrl} 
                    alt={pendingPurchase.productName}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{pendingPurchase.productName}</h3>
                  <p className="text-sm text-gray-500">From store: {pendingPurchase.storeSlug}</p>
                  <p className="text-lg font-bold text-emerald-600 mt-1">${pendingPurchase.price.toFixed(2)}</p>
                </div>
              </div>

              {/* Wallet Balance */}
              <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Your Balance</span>
                </div>
                <span className={`font-bold ${(wallet?.balance || 0) >= pendingPurchase.price ? 'text-emerald-600' : 'text-red-500'}`}>
                  ${(wallet?.balance || 0).toFixed(2)}
                </span>
              </div>

              {/* Insufficient Balance Warning */}
              {(wallet?.balance || 0) < pendingPurchase.price && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <X className="w-4 h-4 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-700">Insufficient Balance</p>
                    <p className="text-xs text-red-600">
                      You need ${(pendingPurchase.price - (wallet?.balance || 0)).toFixed(2)} more to complete this purchase.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPendingPurchase(null)}
                >
                  Cancel
                </Button>
                
                {(wallet?.balance || 0) >= pendingPurchase.price ? (
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleCompletePurchase}
                    disabled={purchasing}
                  >
                    {purchasing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Buy Now
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setPendingPurchase(null);
                      navigate('/dashboard/wallet');
                    }}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Top Up Wallet
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Trending Prompts Section - Horizontal Scroll */}
      <div>
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <div className="flex items-center gap-2 lg:gap-3 flex-wrap">
            <div className="p-2 lg:p-2.5 bg-gray-900 rounded-xl">
              <TrendingUp size={18} className="text-white lg:w-5 lg:h-5" />
            </div>
            <h2 className="text-lg lg:text-xl font-bold text-gray-900">Trending Prompts</h2>
            <span className="px-2 lg:px-3 py-1 bg-emerald-500 text-white rounded-full text-[10px] lg:text-xs font-bold">Popular</span>
          </div>
          <Link 
            to="/dashboard/prompts" 
            className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            View All
            <ArrowRight size={14} className="lg:w-4 lg:h-4" />
          </Link>
        </div>

        {trendingPrompts.length > 0 ? (
          <div 
            ref={promptsScrollRef}
            onMouseEnter={() => setIsPromptsPaused(true)}
            onMouseLeave={() => setIsPromptsPaused(false)}
            onTouchStart={() => setIsPromptsPaused(true)}
            onTouchEnd={() => setIsPromptsPaused(false)}
            className="flex gap-3 lg:gap-5 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 -mx-4 px-4 lg:mx-0 lg:px-0"
            style={{ scrollbarWidth: 'thin' }}
          >
            {trendingPrompts.map((prompt) => {
              const isLocked = !canAccessPrompt(prompt);
              const isFavorite = favorites.includes(prompt.id);

              return (
                <div
                  key={prompt.id}
                  className="group flex-shrink-0 w-[240px] lg:w-[280px] bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-md hover:shadow-xl hover:border-gray-300 hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Large Image Section */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {prompt.image_url ? (
                      <img
                        src={prompt.image_url}
                        alt={prompt.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <ImageIcon size={40} className="text-gray-300" />
                      </div>
                    )}

                    {/* Tool Badge - overlaid on image */}
                    <div className="absolute top-3 left-3 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-bold uppercase shadow-lg">
                      {prompt.tool}
                    </div>

                    {/* Favorite Button - overlaid on image */}
                    <button
                      onClick={(e) => toggleFavorite(prompt.id, e)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                    >
                      <Heart
                        size={16}
                        className={isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600'}
                      />
                    </button>

                    {/* Lock Overlay for locked prompts */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center">
                        <Lock size={28} className="text-white mb-2" />
                        <span className="text-white text-sm font-semibold">Pro Only</span>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="p-5">
                    {/* Title */}
                    <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-2 mb-2">
                      {prompt.title}
                    </h3>
                    
                    {/* Description - more visible */}
                    {prompt.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">{prompt.description}</p>
                    )}

                    {/* Pro Access Badge */}
                    <div className="mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        prompt.is_free 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-violet-100 text-violet-700'
                      }`}>
                        {prompt.is_free ? (
                          <>
                            <Check size={12} />
                            Free Access
                          </>
                        ) : (
                          <>
                            <Star size={12} className="fill-violet-500" />
                            Pro Access
                          </>
                        )}
                      </span>
                    </div>

                    {/* Review Section */}
                    <div className="flex items-center gap-2 mb-4">
                      <img src={starsIcon} alt="rating" className="h-4" />
                      <span className="text-sm text-gray-600 font-medium">4.9 (120+ reviews)</span>
                    </div>

                    {/* CTA Button */}
                    <Link
                      to="/dashboard/prompts"
                      className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      {isLocked ? 'Unlock Prompt' : 'View Prompt'}
                      <img src={btnArrow} alt="arrow" className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-md">
            <TrendingUp size={40} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No trending prompts available</p>
          </div>
        )}
      </div>

      {/* AI Accounts Section - Horizontal Scroll */}
      <div>
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <div className="flex items-center gap-2 lg:gap-3 flex-wrap">
            <div className="p-2 lg:p-2.5 bg-gray-900 rounded-xl">
              <Bot size={18} className="text-white lg:w-5 lg:h-5" />
            </div>
            <h2 className="text-lg lg:text-xl font-bold text-gray-900">Popular AI Accounts</h2>
            <span className="px-2 lg:px-3 py-1 bg-yellow-500 text-black rounded-full text-[10px] lg:text-xs font-bold">Cheap</span>
          </div>
          <Link 
            to="/dashboard/ai-accounts" 
            className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            View All
            <ArrowRight size={14} className="lg:w-4 lg:h-4" />
          </Link>
        </div>

        {aiAccounts.length > 0 ? (
          <div 
            ref={accountsScrollRef}
            onMouseEnter={() => setIsAccountsPaused(true)}
            onMouseLeave={() => setIsAccountsPaused(false)}
            onTouchStart={() => setIsAccountsPaused(true)}
            onTouchEnd={() => setIsAccountsPaused(false)}
            className="flex gap-3 lg:gap-5 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 -mx-4 px-4 lg:mx-0 lg:px-0"
            style={{ scrollbarWidth: 'thin' }}
          >
            {aiAccounts.map((account) => {
              const isFavorite = accountFavorites.includes(account.id);

              return (
                <div
                  key={account.id}
                  className="group flex-shrink-0 w-[240px] lg:w-[280px] bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-md hover:shadow-xl hover:border-gray-300 hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Large Image Section */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {account.icon_url ? (
                      <img
                        src={account.icon_url}
                        alt={account.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Bot size={40} className="text-gray-400" />
                      </div>
                    )}

                    {/* Category Badge - overlaid on image */}
                    <div className="absolute top-3 left-3 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-bold uppercase shadow-lg">
                      {account.category || 'Premium'}
                    </div>

                    {/* Favorite Button - overlaid on image */}
                    <button
                      onClick={(e) => toggleAccountFavorite(account.id, e)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                    >
                      <Heart
                        size={16}
                        className={isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600'}
                      />
                    </button>
                  </div>

                  {/* Content Section */}
                  <div className="p-5">
                    {/* Title */}
                    <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-2 mb-2">
                      {account.name}
                    </h3>
                    
                    {/* Description */}
                    {account.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">{account.description}</p>
                    )}

                    {/* Pro Access Badge + Price */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                        <Star size={12} className="fill-violet-500" />
                        Pro Access
                      </span>
                      <span className="text-lg font-bold text-gray-900">${account.price}</span>
                    </div>

                    {/* Review Section */}
                    <div className="flex items-center gap-2 mb-4">
                      <img src={starsIcon} alt="rating" className="h-4" />
                      <span className="text-sm text-gray-600 font-medium">4.8 (300+ reviews)</span>
                    </div>

                    {/* CTA Button */}
                    <Link
                      to="/dashboard/ai-accounts"
                      className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      Get Account
                      <img src={btnArrow} alt="arrow" className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
            <Bot size={40} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No AI accounts available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;
