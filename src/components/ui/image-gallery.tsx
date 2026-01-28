import * as React from 'react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  X,
  Package,
  Maximize2
} from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface ImageGalleryProps {
  images: string[];
  mainImage?: string | null;
  alt?: string;
  className?: string;
  showThumbnails?: boolean;
  enableZoom?: boolean;
  aspectRatio?: 'square' | 'video' | 'auto';
}

const ImageGallery = ({
  images = [],
  mainImage,
  alt = 'Product image',
  className,
  showThumbnails = true,
  enableZoom = true,
  aspectRatio = 'square'
}: ImageGalleryProps) => {
  // Combine mainImage with images array, ensuring no duplicates
  const allImages = React.useMemo(() => {
    const combined: string[] = [];
    if (mainImage) combined.push(mainImage);
    images.forEach(img => {
      if (img && !combined.includes(img)) combined.push(img);
    });
    return combined;
  }, [mainImage, images]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });

  // Reset index if images change
  useEffect(() => {
    setCurrentIndex(0);
  }, [allImages.length]);

  const goToPrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const goToNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  const openLightbox = () => {
    if (enableZoom && allImages.length > 0) {
      setIsLightboxOpen(true);
      setZoomLevel(1);
      setDragPosition({ x: 0, y: 0 });
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) setDragPosition({ x: 0, y: 0 });
      return newZoom;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setStartPosition({ x: e.clientX - dragPosition.x, y: e.clientY - dragPosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setDragPosition({
        x: e.clientX - startPosition.x,
        y: e.clientY - startPosition.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: ''
  }[aspectRatio];

  if (allImages.length === 0) {
    return (
      <div className={cn('bg-slate-100 rounded-2xl flex items-center justify-center', aspectRatioClass, className)}>
        <Package className="w-16 h-16 text-slate-300" />
      </div>
    );
  }

  const currentImage = allImages[currentIndex];

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main Image Container */}
      <div className={cn('relative rounded-2xl overflow-hidden group', aspectRatioClass)}>
        <OptimizedImage
          src={currentImage}
          alt={`${alt} ${currentIndex + 1}`}
          className="w-full h-full cursor-pointer transition-transform duration-300 group-hover:scale-105"
          onClick={openLightbox}
          priority={currentIndex === 0}
        />
        
        {/* Navigation Arrows */}
        {allImages.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              onClick={goToPrevious}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={goToNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {allImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">
            {currentIndex + 1} / {allImages.length}
          </div>
        )}

        {/* Zoom Button */}
        {enableZoom && (
          <Button
            variant="secondary"
            size="icon"
            onClick={openLightbox}
            className="absolute top-3 right-3 h-9 w-9 rounded-lg bg-white/90 backdrop-blur-sm shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Thumbnails */}
      {showThumbnails && allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {allImages.map((img, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={cn(
                'flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200',
                index === currentIndex
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'border-transparent hover:border-slate-300'
              )}
            >
              <OptimizedImage
                src={img}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full"
                aspectRatio="square"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none overflow-hidden">
          <div 
            className="relative w-full h-[90vh] flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Zoom Controls */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="h-8 w-8 rounded-full text-white hover:bg-white/20 disabled:opacity-30"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-white text-sm min-w-[3rem] text-center">{Math.round(zoomLevel * 100)}%</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="h-8 w-8 rounded-full text-white hover:bg-white/20 disabled:opacity-30"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            {/* Main Image */}
            <img
              src={currentImage}
              alt={`${alt} ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoomLevel}) translate(${dragPosition.x / zoomLevel}px, ${dragPosition.y / zoomLevel}px)`,
                cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
              }}
              draggable={false}
            />

            {/* Navigation */}
            {allImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}

            {/* Thumbnails in Lightbox */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-sm p-2 rounded-xl">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => handleThumbnailClick(index)}
                    className={cn(
                      'w-12 h-12 rounded-lg overflow-hidden border-2 transition-all',
                      index === currentIndex
                        ? 'border-white opacity-100'
                        : 'border-transparent opacity-50 hover:opacity-75'
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageGallery;
