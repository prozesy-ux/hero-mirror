import { useState } from 'react';
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
  Link2
} from 'lucide-react';

interface MultiImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

const MultiImageUploader = ({ 
  images = [], 
  onChange, 
  maxImages = 5 
}: MultiImageUploaderProps) => {
  const [imageUrl, setImageUrl] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const addImage = () => {
    if (imageUrl.trim() && images.length < maxImages) {
      if (!images.includes(imageUrl.trim())) {
        onChange([...images, imageUrl.trim()]);
      }
      setImageUrl('');
    }
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
    <div className="space-y-3">
      <Label className="text-slate-700">Product Images</Label>
      
      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={() => { setDraggedIndex(null); setDragOverIndex(null); }}
              className={cn(
                'relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-move group',
                draggedIndex === index ? 'opacity-50 scale-95' : '',
                dragOverIndex === index ? 'border-emerald-500 border-dashed' : 'border-slate-200',
                index === 0 ? 'ring-2 ring-emerald-500 ring-offset-2' : ''
              )}
            >
              <img
                src={img}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Primary Badge */}
              {index === 0 && (
                <div className="absolute top-1 left-1 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  Main
                </div>
              )}
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <div className="absolute top-1 left-1">
                  <GripVertical className="w-4 h-4 text-white/80" />
                </div>
                
                {index !== 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={(e) => { e.stopPropagation(); setPrimaryImage(index); }}
                    className="h-7 text-xs bg-white/90 hover:bg-white"
                  >
                    <Star className="w-3 h-3 mr-1" />
                    Set Main
                  </Button>
                )}
                
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                  className="h-7 w-7"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Image Input */}
      {images.length < maxImages && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste image URL..."
              className="pl-9 border-slate-200 rounded-xl"
            />
          </div>
          <Button
            type="button"
            onClick={addImage}
            disabled={!imageUrl.trim()}
            className="bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50/50">
          <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Add up to {maxImages} product images</p>
          <p className="text-xs text-slate-400 mt-1">First image will be the main image</p>
        </div>
      )}

      <p className="text-xs text-slate-400">
        {images.length}/{maxImages} images • Drag to reorder • First image is main
      </p>
    </div>
  );
};

export default MultiImageUploader;
