import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ImageSearchButtonProps {
  onSearchResult: (searchText: string) => void;
  className?: string;
}

export function ImageSearchButton({ onSearchResult, className }: ImageSearchButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Process image
    await processImage(file);
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Get session for auth
      const { data: { session } } = await supabase.auth.getSession();
      
      // Call image-search edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            ...(session?.access_token && {
              'Authorization': `Bearer ${session.access_token}`,
            }),
          },
          body: JSON.stringify({
            image: base64,
            mimeType: file.type,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Image analysis failed');
      }

      const data = await response.json();
      
      if (data.searchQuery) {
        toast.success(`Found: "${data.searchQuery}"`);
        onSearchResult(data.searchQuery);
        setIsOpen(false);
        setPreviewUrl(null);
      } else {
        toast.error('Could not identify product in image');
      }
    } catch (error) {
      console.error('Image search error:', error);
      toast.error('Failed to analyze image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      await processImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const clearPreview = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn("h-9 w-9 text-muted-foreground hover:text-primary", className)}
        title="Search by image"
      >
        <Camera className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Visual Search
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                isProcessing
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg object-contain"
                  />
                  {!isProcessing && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-0 right-0 h-6 w-6"
                      onClick={clearPreview}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">
                          Analyzing image...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Drop an image here</p>
                    <p className="text-sm text-muted-foreground">
                      or click to upload
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Upload a screenshot or image of a product to find similar items
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
