import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Link2, 
  Video, 
  Loader2, 
  X, 
  Play,
  CheckCircle
} from 'lucide-react';

interface VideoUploaderProps {
  currentVideoUrl: string;
  onVideoChange: (url: string) => void;
  sellerId: string;
}

const VideoUploader = ({ currentVideoUrl, onVideoChange, sellerId }: VideoUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [embedUrl, setEmbedUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Video must be less than 50MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `store-videos/${sellerId}-${Date.now()}.${fileExt}`;

      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { error: uploadError } = await supabase.storage
        .from('store-media')
        .upload(fileName, file, { upsert: true });

      clearInterval(progressInterval);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('store-media')
        .getPublicUrl(fileName);

      setUploadProgress(100);
      onVideoChange(publicUrl);
      toast.success('Video uploaded successfully!');

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload video');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleEmbedUrl = () => {
    if (!embedUrl.trim()) {
      toast.error('Please enter a video URL');
      return;
    }

    // Convert YouTube URL to embed format
    let processedUrl = embedUrl.trim();
    
    // YouTube watch URL to embed
    const youtubeMatch = processedUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
      processedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo URL to embed
    const vimeoMatch = processedUrl.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      processedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    onVideoChange(processedUrl);
    setEmbedUrl('');
    toast.success('Video URL saved!');
  };

  const handleRemoveVideo = () => {
    onVideoChange('');
    toast.success('Video removed');
  };

  const isEmbedUrl = currentVideoUrl.includes('youtube.com') || currentVideoUrl.includes('vimeo.com');

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium text-slate-700">Profile Video</Label>
      
      {currentVideoUrl && (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-black">
          {isEmbedUrl ? (
            <iframe
              src={currentVideoUrl}
              className="w-full aspect-video"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <video
              src={currentVideoUrl}
              controls
              className="w-full aspect-video"
            />
          )}
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full"
            onClick={handleRemoveVideo}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {!currentVideoUrl && (
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="embed" className="gap-2">
              <Link2 className="w-4 h-4" />
              YouTube/Vimeo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                uploading ? 'border-violet-300 bg-violet-50' : 'border-slate-200 hover:border-violet-300 hover:bg-violet-50/50'
              }`}
            >
              {uploading ? (
                <div className="space-y-4">
                  <Loader2 className="w-10 h-10 text-violet-600 mx-auto animate-spin" />
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600">Uploading video...</p>
                    <div className="w-full bg-slate-200 rounded-full h-2 max-w-xs mx-auto">
                      <div 
                        className="bg-violet-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500">{uploadProgress}%</p>
                  </div>
                </div>
              ) : (
                <>
                  <Video className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-600 mb-2">
                    Drag and drop a video or click to browse
                  </p>
                  <p className="text-xs text-slate-400 mb-4">
                    MP4, MOV, WebM • Max 50MB
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Video
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="embed" className="mt-4 space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-slate-600">
                Paste a YouTube or Vimeo video URL
              </p>
              <div className="flex gap-2">
                <Input
                  value={embedUrl}
                  onChange={(e) => setEmbedUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="flex-1"
                />
                <Button onClick={handleEmbedUrl}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
              <p className="text-xs text-slate-400">
                Supported: YouTube, Vimeo, or direct video URLs
              </p>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default VideoUploader;
