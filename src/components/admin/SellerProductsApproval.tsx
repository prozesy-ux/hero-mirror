import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Package, Check, X, Eye, Store, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';

interface SellerProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  icon_url: string | null;
  stock: number | null;
  is_available: boolean;
  is_approved: boolean;
  sold_count: number | null;
  tags: string[] | null;
  created_at: string;
  seller_profiles: {
    id: string;
    store_name: string;
    store_logo_url: string | null;
    is_verified: boolean;
  } | null;
  categories: {
    name: string;
    color: string | null;
  } | null;
}

type TabType = 'pending' | 'approved' | 'all';

const SellerProductsApproval = () => {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<SellerProduct | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel('seller-products-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seller_products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('seller_products')
      .select(`
        *,
        seller_profiles (id, store_name, store_logo_url, is_verified),
        categories (name, color)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching seller products:', error);
      toast.error('Failed to load seller products');
    } else {
      setProducts(data as SellerProduct[]);
    }
    setLoading(false);
  };

  const toggleApproval = async (product: SellerProduct) => {
    setUpdating(product.id);
    const newStatus = !product.is_approved;

    const { error } = await supabase
      .from('seller_products')
      .update({ is_approved: newStatus })
      .eq('id', product.id);

    if (error) {
      toast.error('Failed to update product status');
    } else {
      toast.success(newStatus ? 'Product approved!' : 'Product unapproved');
      fetchProducts();
    }
    setUpdating(null);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.seller_profiles?.store_name.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'pending') return matchesSearch && !product.is_approved;
    if (activeTab === 'approved') return matchesSearch && product.is_approved;
    return matchesSearch;
  });

  const pendingCount = products.filter(p => !p.is_approved).length;
  const approvedCount = products.filter(p => p.is_approved).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Seller Products Approval</h1>
          <p className="text-gray-400 text-sm">Review and approve seller product submissions</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-amber-500/20 text-amber-400 px-4 py-2 rounded-xl font-semibold text-sm">
            {pendingCount} Pending
          </div>
          <div className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl font-semibold text-sm">
            {approvedCount} Approved
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <Clock size={16} />
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
            activeTab === 'approved'
              ? 'bg-emerald-500 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <CheckCircle size={16} />
          Approved ({approvedCount})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
            activeTab === 'all'
              ? 'bg-white text-gray-900'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <Package size={16} />
          All ({products.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by product name or seller..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30"
        />
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white/5 rounded-xl p-12 text-center border border-white/10">
          <Package size={48} className="mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-semibold text-white mb-2">No Products Found</h3>
          <p className="text-gray-400">
            {activeTab === 'pending' ? 'No products pending approval' : 'No products match your search'}
          </p>
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-gray-400 font-medium text-sm">Product</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm">Seller</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm">Price</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm">Stock</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm">Created</th>
                <th className="text-center p-4 text-gray-400 font-medium text-sm">Approved</th>
                <th className="text-center p-4 text-gray-400 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {product.icon_url ? (
                        <img src={product.icon_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                          <Package size={18} className="text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium">{product.name}</p>
                        {product.categories && (
                          <p className="text-gray-500 text-xs">{product.categories.name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Store size={14} className="text-gray-500" />
                      <span className="text-gray-300">{product.seller_profiles?.store_name || 'Unknown'}</span>
                      {product.seller_profiles?.is_verified && (
                        <CheckCircle size={14} className="text-emerald-500" />
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-emerald-400 font-semibold">${product.price}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-300">{product.stock ?? 'N/A'}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-400 text-sm">
                      {format(new Date(product.created_at), 'MMM d, yyyy')}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <Switch
                      checked={product.is_approved}
                      onCheckedChange={() => toggleApproval(product)}
                      disabled={updating === product.id}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowDetailsModal(true);
                      }}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Eye size={16} className="text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="bg-[#1a1a24] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              {selectedProduct.icon_url && (
                <img 
                  src={selectedProduct.icon_url} 
                  alt={selectedProduct.name}
                  className="w-full h-48 object-cover rounded-xl"
                />
              )}
              <div>
                <h3 className="text-xl font-bold">{selectedProduct.name}</h3>
                <p className="text-gray-400 text-sm mt-1">{selectedProduct.description || 'No description'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-3 rounded-lg">
                  <p className="text-gray-400 text-xs">Price</p>
                  <p className="text-emerald-400 font-bold">${selectedProduct.price}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <p className="text-gray-400 text-xs">Stock</p>
                  <p className="text-white font-bold">{selectedProduct.stock ?? 'N/A'}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <p className="text-gray-400 text-xs">Seller</p>
                  <p className="text-white font-medium">{selectedProduct.seller_profiles?.store_name}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <p className="text-gray-400 text-xs">Status</p>
                  <p className={`font-medium ${selectedProduct.is_approved ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {selectedProduct.is_approved ? 'Approved' : 'Pending'}
                  </p>
                </div>
              </div>
              {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                <div>
                  <p className="text-gray-400 text-xs mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-white/10 rounded text-xs text-gray-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    toggleApproval(selectedProduct);
                    setShowDetailsModal(false);
                  }}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                    selectedProduct.is_approved
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  }`}
                >
                  {selectedProduct.is_approved ? 'Revoke Approval' : 'Approve Product'}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerProductsApproval;
