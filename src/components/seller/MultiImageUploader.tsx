import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  X, 
  GripVertical, 
  Image as ImageIcon,
  Star,
  Link2,
  Upload,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { prepareImageForUpload, calculateSavings } from '@/lib/image-optimizer';

interface MultiImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  sellerId?: string;
}

const MultiImageUploader = ({ 
  images = [], 
  onChange, 
  maxImages = 5,
  sellerId
}: MultiImageUploaderProps) => {
  const [imageUrl, setImageUrl] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lastCompression, setLastCompression] = useState<{ percentage: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addImage = () => {
    if (imageUrl.trim() && images.length < maxImages) {
      if (!images.includes(imageUrl.trim())) {
        onChange([...images, imageUrl.trim()]);
      }
      setImageUrl('');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    if (images.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    setLastCompression(null);

    try {
      const { file: compressedFile, originalSize, compressedSize } = await prepareImageForUpload(file, 'product');
      const { percentage } = calculateSavings(originalSize, compressedSize);
      setLastCompression({ percentage });

      const fileExt = compressedFile.name.split('.').pop();
      const folder = sellerId ? `products/${sellerId}` : 'products';
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('store-media')
        .upload(fileName, compressedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('store-media')
        .getPublicUrl(fileName);

      onChange([...images, publicUrl]);
      toast.success(`Image optimized & uploaded (${percentage}% smaller)`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const setPrimaryImage = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    const [moved] = newImages.splice(index, 1);
    newImages.unshift(moved);
    onChange(newImages);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newImages = [...images];
    const [moved] = newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, moved);
    onChange(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addImage();
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-bold text-black">Product Images</Label>
      
      {/* Image Grid - 4 columns */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={() => { setDraggedIndex(null); setDragOverIndex(null); }}
              className={cn(
                'relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-move group bg-gray-50',
                draggedIndex === index ? 'opacity-50 scale-95' : '',
                dragOverIndex === index ? 'border-black border-dashed' : 'border-black/10',
                index === 0 ? 'border-black' : ''
              )}
            >
              <img
                src={img}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
              
              {/* Primary Badge */}
              {index === 0 && (
                <div className="absolute top-1.5 left-1.5 bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  Main
                </div>
              )}
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                <div className="absolute top-1.5 left-1.5">
                  <GripVertical className="w-4 h-4 text-white/80" />
                </div>
                
                {index !== 0 && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setPrimaryImage(index); }}
                    className="h-7 text-xs bg-white text-black hover:bg-gray-100 rounded"
                  >
                    <Star className="w-3 h-3 mr-1" />
                    Main
                  </Button>
                )}
                
                <Button
                  type="button"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                  className="h-7 w-7 bg-white text-black hover:bg-red-500 hover:text-white rounded"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload & URL Input */}
      {images.length < maxImages && (
        <div className="space-y-3">
          {/* File Upload Button */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
              uploading ? 'border-black/30 bg-gray-50' : 'border-black/20 hover:border-black bg-white'
            )}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 text-black animate-spin" />
                <p className="text-sm font-medium text-black">Optimizing & uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-6 h-6 text-gray-400" />
                <p className="text-sm font-medium text-black">Click to upload image</p>
                <p className="text-xs text-gray-500">Auto-optimized to WebP</p>
              </div>
            )}
          </div>

          {/* URL Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Or paste image URL..."
                className="pl-10 border-2 border-black/10 rounded-lg focus:border-black transition-colors"
              />
            </div>
            <Button
              type="button"
              onClick={addImage}
              disabled={!imageUrl.trim()}
              className="bg-black text-white hover:bg-black/90 rounded-lg px-4"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !uploading && (
        <div className="border-2 border-dashed border-black/20 rounded-lg p-8 text-center bg-gray-50">
          <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600">Add up to {maxImages} product images</p>
          <p className="text-xs text-gray-400 mt-1">First image will be the main image</p>
        </div>
      )}

      {/* Last compression info */}
      {lastCompression && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
          <CheckCircle2 size={14} className="text-black" />
          <span>Last image: {lastCompression.percentage}% compression savings</span>
        </div>
      )}

      <p className="text-xs text-gray-500">
        {images.length}/{maxImages} images • Drag to reorder • First image is main
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default MultiImageUploader;
