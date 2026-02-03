import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  ArrowLeft, Download, File, Image, Video, Music, 
  FileText, Archive, ExternalLink, Lock, Play, 
  Eye, Clock, CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentFile {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  content_type: string;
  external_link: string | null;
  stream_url: string | null;
  is_preview: boolean;
  display_order: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
  seller: {
    store_name: string;
  };
}

interface AccessRecord {
  id: string;
  download_count: number;
  max_downloads: number | null;
  access_granted_at: string;
}

const FILE_ICONS: Record<string, any> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  txt: FileText,
  jpg: Image,
  jpeg: Image,
  png: Image,
  gif: Image,
  webp: Image,
  mp4: Video,
  mov: Video,
  avi: Video,
  webm: Video,
  mp3: Music,
  wav: Music,
  flac: Music,
  aac: Music,
  zip: Archive,
  rar: Archive,
  '7z': Archive,
  link: ExternalLink
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const DownloadManager = () => {
  const { productId } = useParams<{ productId: string }>();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [files, setFiles] = useState<ContentFile[]>([]);
  const [access, setAccess] = useState<AccessRecord | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (productId && user) {
      fetchProductContent();
    }
  }, [productId, user]);

  const fetchProductContent = async () => {
    if (!productId || !user) return;
    
    setLoading(true);
    try {
      // Check access
      const { data: accessData } = await supabase
        .from('buyer_content_access')
        .select('id, download_count, max_downloads, access_granted_at')
        .eq('buyer_id', user.id)
        .eq('product_id', productId)
        .in('access_type', ['download', 'stream'])
        .maybeSingle();

      setAccess(accessData);

      // Fetch product info
      const { data: productData } = await supabase
        .from('seller_products')
        .select(`
          id,
          name,
          description,
          icon_url,
          seller:seller_profiles(store_name)
        `)
        .eq('id', productId)
        .single();

      setProduct(productData);

      // Fetch content files
      const { data: filesData } = await supabase
        .from('product_content')
        .select('*')
        .eq('product_id', productId)
        .order('display_order');

      setFiles(filesData || []);
    } catch (error: any) {
      console.error('Error fetching content:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: ContentFile) => {
    if (!access) {
      toast.error('You need to purchase this product');
      return;
    }

    if (access.max_downloads && access.download_count >= access.max_downloads) {
      toast.error('Download limit reached');
      return;
    }

    setDownloading(file.id);
    
    try {
      // If it's an external link, open in new tab
      if (file.content_type === 'link' && file.external_link) {
        window.open(file.external_link, '_blank');
        return;
      }

      // Download the file
      const response = await fetch(file.file_url);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Update download count
      await supabase
        .from('buyer_content_access')
        .update({ 
          download_count: (access.download_count || 0) + 1,
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', access.id);

      setAccess(prev => prev ? { 
        ...prev, 
        download_count: prev.download_count + 1 
      } : null);

      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download');
    } finally {
      setDownloading(null);
    }
  };

  const handleStream = (file: ContentFile) => {
    // For audio/video files, could open a modal player
    // For now, open in new tab
    window.open(file.stream_url || file.file_url, '_blank');
  };

  const getFileIcon = (fileType: string) => {
    return FILE_ICONS[fileType.toLowerCase()] || File;
  };

  const isStreamable = (fileType: string) => {
    return ['mp4', 'mov', 'webm', 'mp3', 'wav', 'flac', 'aac'].includes(fileType.toLowerCase());
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!access) {
    return (
      <Card className="p-12 text-center">
        <Lock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Access Required
        </h3>
        <p className="text-gray-500 mb-6">
          You need to purchase this product to download the files.
        </p>
        <Button asChild>
          <Link to="/marketplace">Browse Products</Link>
        </Button>
      </Card>
    );
  }

  const previewFiles = files.filter(f => f.is_preview);
  const paidFiles = files.filter(f => !f.is_preview);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard/library">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{product?.name}</h1>
          <p className="text-sm text-gray-500">
            by {product?.seller?.store_name}
          </p>
        </div>
      </div>

      {/* Access Info */}
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">
              You have access to this product
            </p>
            <p className="text-sm text-gray-500">
              Purchased {new Date(access.access_granted_at).toLocaleDateString()}
              {access.max_downloads && (
                <> • {access.max_downloads - access.download_count} downloads remaining</>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Files ({paidFiles.length})
        </h2>
        
        <div className="space-y-2">
          {paidFiles.map((file) => {
            const FileIcon = getFileIcon(file.file_type);
            const canStream = isStreamable(file.file_type);

            return (
              <Card key={file.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center",
                    file.content_type === 'link' 
                      ? "bg-blue-100" 
                      : "bg-gray-100"
                  )}>
                    <FileIcon className={cn(
                      "w-6 h-6",
                      file.content_type === 'link' 
                        ? "text-blue-500" 
                        : "text-gray-500"
                    )} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {file.title || file.file_name}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {file.content_type !== 'link' && (
                        <>
                          <span className="uppercase">{file.file_type}</span>
                          <span>•</span>
                          <span>{formatFileSize(file.file_size)}</span>
                        </>
                      )}
                      {file.content_type === 'link' && (
                        <span className="text-blue-500 truncate">
                          {file.external_link}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canStream && file.content_type !== 'link' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStream(file)}
                        className="gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Stream
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleDownload(file)}
                      disabled={downloading === file.id}
                      className="gap-2"
                    >
                      {file.content_type === 'link' ? (
                        <>
                          <ExternalLink className="w-4 h-4" />
                          Open
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          {downloading === file.id ? 'Downloading...' : 'Download'}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Preview Files Section */}
        {previewFiles.length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mt-8">
              Preview Files ({previewFiles.length})
            </h2>
            <p className="text-sm text-gray-500">
              These files are available as free previews
            </p>
            
            <div className="space-y-2">
              {previewFiles.map((file) => {
                const FileIcon = getFileIcon(file.file_type);

                return (
                  <Card key={file.id} className="border-green-200 bg-green-50/50">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                        <FileIcon className="w-6 h-6 text-green-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">
                            {file.title || file.file_name}
                          </p>
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            Preview
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.file_size)}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file)}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DownloadManager;
