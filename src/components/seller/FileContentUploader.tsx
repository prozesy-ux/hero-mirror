import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Upload, File, Trash2, Loader2, Download, Link2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileItem {
  id?: string;
  title: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  content_type: 'file' | 'link';
  external_link?: string;
  is_preview: boolean;
  display_order: number;
}

interface FileContentUploaderProps {
  files: FileItem[];
  onChange: (files: FileItem[]) => void;
  sellerId: string;
  allowLinks?: boolean;
  maxFiles?: number;
  acceptedTypes?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileContentUploader = ({
  files,
  onChange,
  sellerId,
  allowLinks = true,
  maxFiles = 20,
  acceptedTypes = '*'
}: FileContentUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [addingLink, setAddingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    const newFiles: FileItem[] = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${sellerId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-files')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('product-files')
          .getPublicUrl(filePath);

        newFiles.push({
          title: file.name.replace(/\.[^/.]+$/, ''),
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size,
          file_type: fileExt,
          content_type: 'file',
          is_preview: false,
          display_order: files.length + newFiles.length
        });
      }

      onChange([...files, ...newFiles]);
      toast.success(`${newFiles.length} file(s) uploaded`);
    } catch (error: any) {
      toast.error('Upload failed');
      console.error(error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    const newFile: FileItem = {
      title: linkTitle.trim() || 'External Link',
      file_url: '',
      file_name: '',
      file_size: 0,
      file_type: 'link',
      content_type: 'link',
      external_link: linkUrl.trim(),
      is_preview: false,
      display_order: files.length
    };

    onChange([...files, newFile]);
    setLinkUrl('');
    setLinkTitle('');
    setAddingLink(false);
    toast.success('Link added');
  };

  const handleRemoveFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onChange(updated.map((f, i) => ({ ...f, display_order: i })));
  };

  const handleTogglePreview = (index: number) => {
    const updated = files.map((f, i) => 
      i === index ? { ...f, is_preview: !f.is_preview } : f
    );
    onChange(updated);
  };

  const handleUpdateTitle = (index: number, title: string) => {
    const updated = files.map((f, i) => 
      i === index ? { ...f, title } : f
    );
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-3 p-3 bg-white border rounded-lg",
                file.is_preview && "border-green-300 bg-green-50"
              )}
            >
              <div className="flex-shrink-0">
                {file.content_type === 'link' ? (
                  <ExternalLink className="w-5 h-5 text-blue-500" />
                ) : (
                  <File className="w-5 h-5 text-gray-500" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <Input
                  value={file.title}
                  onChange={(e) => handleUpdateTitle(index, e.target.value)}
                  className="h-8 text-sm border-transparent hover:border-gray-200 focus:border-gray-300 bg-transparent"
                  placeholder="File title"
                />
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 px-2">
                  {file.content_type === 'file' ? (
                    <>
                      <span>{file.file_name}</span>
                      <span>•</span>
                      <span>{formatFileSize(file.file_size)}</span>
                    </>
                  ) : (
                    <span className="truncate">{file.external_link}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTogglePreview(index)}
                  className={cn(
                    "text-xs px-2 py-1 rounded transition-colors",
                    file.is_preview
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {file.is_preview ? 'Preview ✓' : 'Free Preview'}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Actions */}
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleFileUpload}
          className="hidden"
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || files.length >= maxFiles}
          className="gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload Files
            </>
          )}
        </Button>

        {allowLinks && !addingLink && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setAddingLink(true)}
            disabled={files.length >= maxFiles}
            className="gap-2"
          >
            <Link2 className="w-4 h-4" />
            Add Link
          </Button>
        )}
      </div>

      {/* Add Link Form */}
      {addingLink && (
        <div className="p-4 bg-gray-50 rounded-lg border space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">URL</label>
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="h-9"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Title (optional)</label>
            <Input
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              placeholder="e.g., Bonus Resources"
              className="h-9"
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={handleAddLink} size="sm">
              Add Link
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setAddingLink(false);
                setLinkUrl('');
                setLinkTitle('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Helper Text */}
      <p className="text-xs text-gray-500">
        {files.length}/{maxFiles} files • Mark files as "Free Preview" to let buyers see them before purchasing
      </p>
    </div>
  );
};

export default FileContentUploader;
