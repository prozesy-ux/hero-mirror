import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Download, Play, BookOpen, Users, Briefcase, Coffee, 
  Calendar, Clock, Package, ExternalLink, CheckCircle,
  FileText, Video, Music, Image as ImageIcon, Archive
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProductTypeById } from '@/components/icons/ProductTypeIcons';

interface ContentAccess {
  id: string;
  buyer_id: string;
  order_id: string;
  product_id: string;
  access_type: string;
  access_granted_at: string;
  access_expires_at: string | null;
  download_count: number;
  max_downloads: number | null;
  last_accessed_at: string | null;
  metadata: Record<string, any>;
  product?: {
    id: string;
    name: string;
    icon_url: string | null;
    product_type: string;
    seller_id: string;
    seller?: {
      store_name: string;
    };
  };
  order?: {
    id: string;
    created_at: string;
    amount: number;
  };
  progress?: number; // For courses
}

type FilterTab = 'all' | 'downloads' | 'courses' | 'memberships' | 'services';

const FILTER_TABS: { id: FilterTab; label: string; icon: any }[] = [
  { id: 'all', label: 'All', icon: Package },
  { id: 'downloads', label: 'Downloads', icon: Download },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'memberships', label: 'Memberships', icon: Users },
  { id: 'services', label: 'Services', icon: Briefcase },
];

const BuyerLibrary = () => {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [accessItems, setAccessItems] = useState<ContentAccess[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  useEffect(() => {
    if (user) {
      fetchLibraryItems();
    }
  }, [user]);

  const fetchLibraryItems = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch content access records with product and order details
      const { data, error } = await supabase
        .from('buyer_content_access')
        .select(`
          *,
          product:seller_products(
            id,
            name,
            icon_url,
            product_type,
            seller_id,
            seller:seller_profiles(store_name)
          ),
          order:seller_orders(
            id,
            created_at,
            amount
          )
        `)
        .eq('buyer_id', user.id)
        .order('access_granted_at', { ascending: false });

      if (error) throw error;

      // Fetch course progress for course items
      const courseItems = (data || []).filter(item => item.access_type === 'course');
      if (courseItems.length > 0) {
        const productIds = courseItems.map(item => item.product_id);
        
        const { data: progressData } = await supabase
          .from('course_progress')
          .select('product_id, progress_percent')
          .eq('buyer_id', user.id)
          .in('product_id', productIds);

        // Calculate average progress per course
        const progressMap: Record<string, { total: number; count: number }> = {};
        if (progressData) {
          progressData.forEach(p => {
            if (!progressMap[p.product_id]) {
              progressMap[p.product_id] = { total: 0, count: 0 };
            }
            progressMap[p.product_id].total += p.progress_percent;
            progressMap[p.product_id].count += 1;
          });
        }

        // Merge progress into items - cast metadata properly
        const itemsWithProgress = (data || []).map(item => ({
          ...item,
          metadata: (item.metadata || {}) as Record<string, any>,
          progress: progressMap[item.product_id] 
            ? Math.round(progressMap[item.product_id].total / progressMap[item.product_id].count)
            : 0
        })) as ContentAccess[];

        setAccessItems(itemsWithProgress);
      } else {
        // Cast metadata properly
        const itemsWithMetadata = (data || []).map(item => ({
          ...item,
          metadata: (item.metadata || {}) as Record<string, any>
        })) as ContentAccess[];
        setAccessItems(itemsWithMetadata);
      }
    } catch (error: any) {
      console.error('Error fetching library:', error);
      toast.error('Failed to load library');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = accessItems.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'downloads') return ['download', 'stream'].includes(item.access_type);
    if (activeTab === 'courses') return item.access_type === 'course';
    if (activeTab === 'memberships') return item.access_type === 'membership';
    if (activeTab === 'services') return item.access_type === 'service';
    return true;
  });

  const getAccessIcon = (accessType: string) => {
    switch (accessType) {
      case 'download': return Download;
      case 'stream': return Play;
      case 'course': return BookOpen;
      case 'membership': return Users;
      case 'service': return Briefcase;
      default: return Package;
    }
  };

  const getActionButton = (item: ContentAccess) => {
    const isExpired = item.access_expires_at && new Date(item.access_expires_at) < new Date();

    if (isExpired) {
      return (
        <Badge variant="outline" className="text-red-500 border-red-200">
          Expired
        </Badge>
      );
    }

    switch (item.access_type) {
      case 'download':
      case 'stream':
        return (
          <Button size="sm" className="gap-2" asChild>
            <Link to={`/dashboard/library/${item.product_id}`}>
              <Download className="w-4 h-4" />
              Download
            </Link>
          </Button>
        );
      case 'course':
        return (
          <Button size="sm" className="gap-2" asChild>
            <Link to={`/dashboard/course/${item.product_id}`}>
              <Play className="w-4 h-4" />
              {(item.progress || 0) > 0 ? 'Continue' : 'Start'}
            </Link>
          </Button>
        );
      case 'membership':
        return (
          <Button size="sm" variant="outline" className="gap-2" asChild>
            <Link to={`/dashboard/membership/${item.product_id}`}>
              <ExternalLink className="w-4 h-4" />
              Access
            </Link>
          </Button>
        );
      case 'service':
        return (
          <Button size="sm" variant="outline" className="gap-2" asChild>
            <Link to={`/dashboard/booking/${item.order_id}`}>
              <Calendar className="w-4 h-4" />
              View
            </Link>
          </Button>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Library</h1>
          <p className="text-sm text-gray-500">
            {accessItems.length} item{accessItems.length !== 1 ? 's' : ''} in your library
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-lg w-fit">
        {FILTER_TABS.map((tab) => {
          const Icon = tab.icon;
          const count = tab.id === 'all' 
            ? accessItems.length 
            : accessItems.filter(item => {
                if (tab.id === 'downloads') return ['download', 'stream'].includes(item.access_type);
                if (tab.id === 'courses') return item.access_type === 'course';
                if (tab.id === 'memberships') return item.access_type === 'membership';
                if (tab.id === 'services') return item.access_type === 'service';
                return false;
              }).length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {count > 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  activeTab === tab.id 
                    ? "bg-black text-white" 
                    : "bg-gray-200 text-gray-600"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Library Grid */}
      {filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === 'all' ? 'Your library is empty' : `No ${activeTab} found`}
          </h3>
          <p className="text-gray-500 mb-6">
            {activeTab === 'all' 
              ? 'Products you purchase will appear here'
              : `You haven't purchased any ${activeTab} yet`
            }
          </p>
          <Button asChild>
            <Link to="/marketplace">Browse Products</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const AccessIcon = getAccessIcon(item.access_type);
            const productType = item.product?.product_type || 'digital_product';
            const typeInfo = getProductTypeById(productType);
            const TypeIcon = typeInfo.Icon;
            const isExpired = item.access_expires_at && new Date(item.access_expires_at) < new Date();

            return (
              <Card 
                key={item.id} 
                className={cn(
                  "overflow-hidden hover:shadow-lg transition-shadow",
                  isExpired && "opacity-60"
                )}
              >
                {/* Product Image */}
                <div className="aspect-video bg-gray-100 relative">
                  {item.product?.icon_url ? (
                    <img 
                      src={item.product.icon_url} 
                      alt={item.product?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <TypeIcon className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                  
                  {/* Access Type Badge */}
                  <Badge 
                    className={cn(
                      "absolute top-3 left-3 gap-1",
                      item.access_type === 'course' && "bg-purple-500",
                      item.access_type === 'membership' && "bg-blue-500",
                      item.access_type === 'download' && "bg-green-500",
                      item.access_type === 'service' && "bg-orange-500"
                    )}
                  >
                    <AccessIcon className="w-3 h-3" />
                    {item.access_type}
                  </Badge>

                  {/* Course Progress */}
                  {item.access_type === 'course' && (item.progress || 0) > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                      <div 
                        className="h-full bg-green-500"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  {/* Product Name */}
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                    {item.product?.name || 'Unknown Product'}
                  </h3>

                  {/* Seller */}
                  <p className="text-sm text-gray-500 mb-3">
                    by {item.product?.seller?.store_name || 'Unknown Seller'}
                  </p>

                  {/* Status Info */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <Clock className="w-3 h-3" />
                    <span>Purchased {formatDate(item.access_granted_at)}</span>
                    
                    {item.access_type === 'course' && (item.progress || 0) > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-green-600 font-medium">
                          {item.progress}% complete
                        </span>
                      </>
                    )}

                    {item.access_expires_at && (
                      <>
                        <span>•</span>
                        <span className={isExpired ? "text-red-500" : "text-orange-500"}>
                          {isExpired ? 'Expired' : `Expires ${formatDate(item.access_expires_at)}`}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-end">
                    {getActionButton(item)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BuyerLibrary;
