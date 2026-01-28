import { useState, useEffect } from 'react';
import { Plus, Zap, Trash2, Calendar, Percent, Package, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSellerContext } from '@/contexts/SellerContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import FlashSaleCountdown from '@/components/flash-sale/FlashSaleCountdown';

interface FlashSale {
  id: string;
  product_id: string;
  discount_percentage: number;
  original_price: number;
  sale_price: number;
  starts_at: string;
  ends_at: string;
  max_quantity: number | null;
  sold_quantity: number;
  is_active: boolean;
  product?: {
    name: string;
    icon_url: string | null;
  };
}

const SellerFlashSales = () => {
  const { profile, products } = useSellerContext();
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [selectedProduct, setSelectedProduct] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('20');
  const [duration, setDuration] = useState('24'); // hours
  const [maxQuantity, setMaxQuantity] = useState('');

  const fetchFlashSales = async () => {
    const { data, error } = await supabase
      .from('flash_sales')
      .select(`
        *,
        product:seller_products(name, icon_url)
      `)
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setFlashSales(data as FlashSale[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFlashSales();
    
    // Subscribe to changes
    const channel = supabase
      .channel('seller-flash-sales')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'flash_sales',
        filter: `seller_id=eq.${profile.id}`
      }, () => {
        fetchFlashSales();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile.id]);

  const handleCreateFlashSale = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    setCreating(true);

    const discount = parseFloat(discountPercentage);
    const salePrice = product.price * (1 - discount / 100);
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + parseInt(duration) * 60 * 60 * 1000);

    const { error } = await supabase
      .from('flash_sales')
      .insert({
        product_id: selectedProduct,
        seller_id: profile.id,
        discount_percentage: discount,
        original_price: product.price,
        sale_price: salePrice,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        max_quantity: maxQuantity ? parseInt(maxQuantity) : null,
      });

    setCreating(false);

    if (error) {
      toast.error('Failed to create flash sale');
      console.error(error);
    } else {
      toast.success('Flash sale created!');
      setDialogOpen(false);
      resetForm();
    }
  };

  const handleDeleteFlashSale = async (id: string) => {
    const { error } = await supabase
      .from('flash_sales')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete flash sale');
    } else {
      toast.success('Flash sale deleted');
    }
  };

  const resetForm = () => {
    setSelectedProduct('');
    setDiscountPercentage('20');
    setDuration('24');
    setMaxQuantity('');
  };

  // Filter products that don't have active flash sales
  const availableProducts = products.filter(p => 
    p.is_available && 
    !flashSales.some(fs => fs.product_id === p.id && fs.is_active && new Date(fs.ends_at) > new Date())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Flash Sales
          </h2>
          <p className="text-sm text-slate-500">Create time-limited discounts to boost sales</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Flash Sale
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                Create Flash Sale
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              {/* Product Selection */}
              <div className="space-y-2">
                <Label>Select Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-slate-400" />
                          <span>{product.name}</span>
                          <span className="text-slate-400">${product.price}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Discount Percentage */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Percent className="h-4 w-4" />
                  Discount Percentage
                </Label>
                <Input
                  type="number"
                  min="5"
                  max="90"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  placeholder="20"
                />
                {selectedProduct && (
                  <p className="text-xs text-slate-500">
                    Sale price: ${(products.find(p => p.id === selectedProduct)!.price * (1 - parseFloat(discountPercentage || '0') / 100)).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Duration (hours)
                </Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 hours</SelectItem>
                    <SelectItem value="12">12 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="48">48 hours</SelectItem>
                    <SelectItem value="72">72 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Max Quantity */}
              <div className="space-y-2">
                <Label>Max Quantity (optional)</Label>
                <Input
                  type="number"
                  min="1"
                  value={maxQuantity}
                  onChange={(e) => setMaxQuantity(e.target.value)}
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <Button 
                onClick={handleCreateFlashSale} 
                className="w-full gap-2"
                disabled={creating || !selectedProduct}
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Start Flash Sale
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Flash Sales List */}
      {flashSales.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Zap className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No flash sales yet</p>
          <p className="text-xs text-slate-400">Create your first flash sale to boost conversions</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {flashSales.map((sale) => {
            const isActive = sale.is_active && new Date(sale.ends_at) > new Date();
            const isExpired = new Date(sale.ends_at) <= new Date();
            
            return (
              <div 
                key={sale.id}
                className={`p-4 rounded-xl border ${
                  isActive 
                    ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200' 
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {sale.product?.icon_url ? (
                      <img 
                        src={sale.product.icon_url} 
                        alt={sale.product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center">
                        <Package className="h-6 w-6 text-slate-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-slate-900">{sale.product?.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-red-600 font-bold">${sale.sale_price.toFixed(2)}</span>
                        <span className="text-slate-400 line-through text-sm">${sale.original_price.toFixed(2)}</span>
                        <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">
                          {sale.discount_percentage}% OFF
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {isActive && (
                      <FlashSaleCountdown endsAt={sale.ends_at} />
                    )}
                    {isExpired && (
                      <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded">
                        Expired
                      </span>
                    )}
                    <div className="text-right text-xs text-slate-500">
                      <div>{sale.sold_quantity} sold</div>
                      {sale.max_quantity && (
                        <div>of {sale.max_quantity}</div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteFlashSale(sale.id)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SellerFlashSales;
