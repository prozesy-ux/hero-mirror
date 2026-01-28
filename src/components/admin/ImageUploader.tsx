import { useState, useRef } from 'react';
import { X, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { prepareImageForUpload, formatFileSize, calculateSavings } from '@/lib/image-optimizer';

interface ImageUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  bucket?: string;
  folder?: string;
}

const ImageUploader = ({ 
  value, 
  onChange, 
  bucket = 'prompt-images',
  folder = 'prompts'
}: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<{ 
    original: number; 
    compressed: number; 
    percentage: number 
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    setUploading(true);
    setCompressionInfo(null);

    try {
      // Compress image before upload
      const { file: compressedFile, originalSize, compressedSize } = await prepareImageForUpload(file, 'full');
      const { percentage } = calculateSavings(originalSize, compressedSize);
      
      setCompressionInfo({
        original: originalSize,
        compressed: compressedSize,
        percentage
      });

      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, compressedFile, { upsert: true });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onChange(publicUrl);
      toast.success(`Image optimized & uploaded (${percentage}% smaller)`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error?.message || 'Failed to upload image');
      setCompressionInfo(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    try {
      // Extract path from URL
      const urlParts = value.split('/');
      const pathIndex = urlParts.indexOf(bucket);
      if (pathIndex !== -1) {
        const filePath = urlParts.slice(pathIndex + 1).join('/');
        await supabase.storage.from(bucket).remove([filePath]);
      }
      onChange(null);
      setCompressionInfo(null);
      toast.success('Image removed');
    } catch (error) {
      console.error('Remove error:', error);
      onChange(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        Prompt Image
      </label>
      
      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt="Prompt preview"
            className="w-full h-48 object-cover rounded-lg border border-gray-700"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleClick}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          {/* Compression info badge */}
          {compressionInfo && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-emerald-500/90 text-white rounded-md text-xs font-medium">
              <CheckCircle2 size={12} />
              <span>{compressionInfo.percentage}% smaller</span>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-lg h-48 flex flex-col items-center justify-center cursor-pointer transition-colors
            ${dragOver 
              ? 'border-purple-500 bg-purple-500/10' 
              : 'border-gray-700 hover:border-gray-600 bg-gray-900'
            }
          `}
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              <p className="text-gray-400 text-sm mt-2">Optimizing & uploading...</p>
              {compressionInfo && (
                <p className="text-emerald-400 text-xs mt-1">
                  {formatFileSize(compressionInfo.original)} → {formatFileSize(compressionInfo.compressed)}
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3">
                <ImageIcon className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-400 text-sm mb-1">Drag & drop an image here</p>
              <p className="text-gray-500 text-xs">or click to browse</p>
              <p className="text-gray-600 text-xs mt-2">Max 10MB • Auto-optimized to WebP</p>
            </>
          )}
        </div>
      )}

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

export default ImageUploader;