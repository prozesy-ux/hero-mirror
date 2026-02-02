import { useState, useMemo } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Package, AlertTriangle, TrendingUp, TrendingDown, Search, Filter, RefreshCw, Download, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const SellerInventory = () => {
  const { products, loading, refreshProducts } = useSellerContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [updating, setUpdating] = useState(false);

  // Calculate inventory stats
  const inventoryStats = useMemo(() => {
    const totalProducts = products.length;
    const lowStock = products.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5).length;
    const outOfStock = products.filter(p => (p.stock ?? 0) === 0).length;
    const inStock = products.filter(p => (p.stock ?? 0) > 5).length;
    const totalUnits = products.reduce((sum, p) => sum + (p.stock ?? 0), 0);
    
    // Health score: 100 if all in stock, decreases with low/out of stock
    const healthScore = totalProducts > 0 
      ? Math.round(((inStock * 100) + (lowStock * 50)) / totalProducts)
      : 100;

    return { totalProducts, lowStock, outOfStock, inStock, totalUnits, healthScore };
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const stock = product.stock ?? 0;
      
      if (stockFilter === 'low') return matchesSearch && stock > 0 && stock <= 5;
      if (stockFilter === 'out') return matchesSearch && stock === 0;
      if (stockFilter === 'in') return matchesSearch && stock > 5;
      return matchesSearch;
    });
  }, [products, searchQuery, stockFilter]);

  const handleUpdateStock = async (productId: string, newStock: number) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('seller_products')
        .update({ stock: newStock })
        .eq('id', productId);

      if (error) throw error;
      toast.success('Stock updated successfully');
      setEditingId(null);
      refreshProducts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update stock');
    } finally {
      setUpdating(false);
    }
  };

  const getStockBadge = (stock: number | null) => {
    const s = stock ?? 0;
    if (s === 0) return <Badge variant="destructive" className="text-xs">Out of Stock</Badge>;
    if (s <= 5) return <Badge variant="outline" className="text-xs text-orange-600 border-orange-300 bg-orange-50">Low Stock</Badge>;
    return <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300 bg-emerald-50">In Stock</Badge>;
  };

  const exportInventory = () => {
    const csv = [
      ['Product Name', 'Stock', 'Price', 'Sold Count', 'Status'].join(','),
      ...filteredProducts.map(p => [
        `"${p.name}"`,
        p.stock ?? 0,
        p.price,
        p.sold_count,
        (p.stock ?? 0) === 0 ? 'Out of Stock' : (p.stock ?? 0) <= 5 ? 'Low Stock' : 'In Stock'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Inventory exported');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl border border-slate-200" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl border border-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refreshProducts()} className="rounded-xl">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={exportInventory} className="bg-emerald-500 hover:bg-emerald-600 rounded-xl">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Products */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Products</p>
              <p className="text-2xl font-bold text-slate-800">{inventoryStats.totalProducts}</p>
            </div>
          </div>
        </div>

        {/* Total Units */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Units</p>
              <p className="text-2xl font-bold text-slate-800">{inventoryStats.totalUnits}</p>
            </div>
          </div>
        </div>

        {/* In Stock */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">In Stock</p>
              <p className="text-2xl font-bold text-green-600">{inventoryStats.inStock}</p>
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Low Stock</p>
              <p className="text-2xl font-bold text-orange-600">{inventoryStats.lowStock}</p>
            </div>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{inventoryStats.outOfStock}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Health */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800">Inventory Health Score</h3>
          <span className={`text-lg font-bold ${
            inventoryStats.healthScore >= 80 ? 'text-emerald-600' :
            inventoryStats.healthScore >= 50 ? 'text-orange-600' : 'text-red-600'
          }`}>
            {inventoryStats.healthScore}%
          </span>
        </div>
        <Progress 
          value={inventoryStats.healthScore} 
          className="h-3"
        />
        <p className="text-xs text-slate-500 mt-2">
          {inventoryStats.healthScore >= 80 ? 'Your inventory is healthy!' :
           inventoryStats.healthScore >= 50 ? 'Some products need restocking' :
           'Critical: Many products are low or out of stock'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl border-slate-200"
          />
        </div>
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-full sm:w-[180px] rounded-xl border-slate-200">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Filter by stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="in">In Stock (&gt;5)</SelectItem>
            <SelectItem value="low">Low Stock (1-5)</SelectItem>
            <SelectItem value="out">Out of Stock (0)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold">Product</TableHead>
              <TableHead className="font-semibold text-center">Stock</TableHead>
              <TableHead className="font-semibold text-center">Status</TableHead>
              <TableHead className="font-semibold text-right">Price</TableHead>
              <TableHead className="font-semibold text-center">Sold</TableHead>
              <TableHead className="font-semibold text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.icon_url ? (
                        <img src={product.icon_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Package className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <span className="font-medium text-slate-800 truncate max-w-[200px]">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {editingId === product.id ? (
                      <Input
                        type="number"
                        value={editStock}
                        onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                        className="w-20 mx-auto text-center"
                        min={0}
                      />
                    ) : (
                      <span className="font-semibold">{product.stock ?? 0}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStockBadge(product.stock)}
                  </TableCell>
                  <TableCell className="text-right font-medium">₹{product.price}</TableCell>
                  <TableCell className="text-center">{product.sold_count}</TableCell>
                  <TableCell className="text-center">
                    {editingId === product.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateStock(product.id, editStock)}
                          disabled={updating}
                          className="h-8 w-8 p-0"
                        >
                          <Save className="w-4 h-4 text-emerald-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4 text-slate-400" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(product.id);
                          setEditStock(product.stock ?? 0);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="w-4 h-4 text-slate-400" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SellerInventory;
