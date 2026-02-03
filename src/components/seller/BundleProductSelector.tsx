import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SellerProduct {
  id: string;
  name: string;
  price: number;
  icon_url: string | null;
  product_type: string | null;
}

interface BundleProductSelectorProps {
  sellerId: string;
  selectedProductIds: string[];
  onChange: (productIds: string[]) => void;
  excludeProductId?: string; // Exclude current product being edited
}

const BundleProductSelector = ({
  sellerId,
  selectedProductIds,
  onChange,
  excludeProductId
}: BundleProductSelectorProps) => {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [sellerId]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('seller_products')
        .select('id, name, price, icon_url, product_type')
        .eq('seller_id', sellerId)
        .eq('is_available', true)
        .neq('product_type', 'bundle') // Can't bundle bundles
        .order('name');

      if (error) throw error;
      
      // Filter out the current product if editing
      const filtered = excludeProductId 
        ? data?.filter(p => p.id !== excludeProductId) || []
        : data || [];
      
      setProducts(filtered);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      onChange(selectedProductIds.filter(id => id !== productId));
    } else {
      onChange([...selectedProductIds, productId]);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));
  const totalValue = selectedProducts.reduce((sum, p) => sum + p.price, 0);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm">No products available to bundle</p>
        <p className="text-xs mt-1">Create some products first</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="pl-9 h-10"
        />
      </div>

      {/* Product List */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {filteredProducts.map(product => {
          const isSelected = selectedProductIds.includes(product.id);
          
          return (
            <label
              key={product.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                isSelected
                  ? "bg-black text-white"
                  : "bg-gray-50 hover:bg-gray-100 text-gray-900"
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleProduct(product.id)}
                className={cn(
                  "border-2",
                  isSelected ? "border-white data-[state=checked]:bg-white data-[state=checked]:text-black" : "border-gray-300"
                )}
              />
              
              {product.icon_url ? (
                <img
                  src={product.icon_url}
                  alt={product.name}
                  className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-md bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-gray-400" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{product.name}</p>
                <p className={cn(
                  "text-xs",
                  isSelected ? "text-white/70" : "text-gray-500"
                )}>
                  {product.product_type || 'Product'}
                </p>
              </div>
              
              <span className={cn(
                "font-semibold text-sm flex-shrink-0",
                isSelected ? "text-white" : "text-gray-900"
              )}>
                ${product.price.toFixed(2)}
              </span>
            </label>
          );
        })}
      </div>

      {/* Summary */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {selectedProductIds.length} product{selectedProductIds.length !== 1 ? 's' : ''} selected
          </span>
          <span className="font-semibold text-lg">
            ${totalValue.toFixed(2)} value
          </span>
        </div>
        {selectedProductIds.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Set your bundle price below to offer a discount
          </p>
        )}
      </div>
    </div>
  );
};

export default BundleProductSelector;
