import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Plus, GripVertical, Trash2, Video, FileText, Loader2, 
  ChevronDown, ChevronUp, Upload, Eye 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LessonAttachment {
  url: string;
  name: string;
  size: number;
}

interface Lesson {
  id?: string;
  title: string;
  description: string;
  video_url: string;
  video_duration?: number;
  content_html: string;
  attachments: LessonAttachment[];
  display_order: number;
  is_free_preview: boolean;
}

interface LessonBuilderProps {
  lessons: Lesson[];
  onChange: (lessons: Lesson[]) => void;
  sellerId: string;
}

const LessonBuilder = ({ lessons, onChange, sellerId }: LessonBuilderProps) => {
  const [expandedLesson, setExpandedLesson] = useState<number | null>(0);
  const [uploading, setUploading] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFor, setUploadingFor] = useState<{ index: number; type: 'video' | 'attachment' } | null>(null);

  const addLesson = () => {
    const newLesson: Lesson = {
      title: `Lesson ${lessons.length + 1}`,
      description: '',
      video_url: '',
      content_html: '',
      attachments: [],
      display_order: lessons.length,
      is_free_preview: false
    };
    onChange([...lessons, newLesson]);
    setExpandedLesson(lessons.length);
  };

  const updateLesson = (index: number, updates: Partial<Lesson>) => {
    const updated = lessons.map((lesson, i) => 
      i === index ? { ...lesson, ...updates } : lesson
    );
    onChange(updated);
  };

  const removeLesson = (index: number) => {
    const updated = lessons.filter((_, i) => i !== index)
      .map((lesson, i) => ({ ...lesson, display_order: i }));
    onChange(updated);
    if (expandedLesson === index) {
      setExpandedLesson(null);
    } else if (expandedLesson !== null && expandedLesson > index) {
      setExpandedLesson(expandedLesson - 1);
    }
  };

  const moveLesson = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === lessons.length - 1)
    ) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...lessons];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated.map((l, i) => ({ ...l, display_order: i })));
    setExpandedLesson(newIndex);
  };

  const handleVideoUpload = async (index: number, file: File) => {
    setUploading(index);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${sellerId}/videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('product-files')
        .getPublicUrl(filePath);

      updateLesson(index, { video_url: urlData.publicUrl });
      toast.success('Video uploaded');
    } catch (error: any) {
      toast.error('Failed to upload video');
      console.error(error);
    } finally {
      setUploading(null);
    }
  };

  const handleAttachmentUpload = async (index: number, file: File) => {
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${sellerId}/attachments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('product-files')
        .getPublicUrl(filePath);

      const newAttachment: LessonAttachment = {
        url: urlData.publicUrl,
        name: file.name,
        size: file.size
      };

      const lesson = lessons[index];
      updateLesson(index, { 
        attachments: [...lesson.attachments, newAttachment] 
      });
      toast.success('Attachment added');
    } catch (error: any) {
      toast.error('Failed to upload attachment');
      console.error(error);
    }
  };

  const removeAttachment = (lessonIndex: number, attachmentIndex: number) => {
    const lesson = lessons[lessonIndex];
    const updated = lesson.attachments.filter((_, i) => i !== attachmentIndex);
    updateLesson(lessonIndex, { attachments: updated });
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingFor) return;

    if (uploadingFor.type === 'video') {
      await handleVideoUpload(uploadingFor.index, file);
    } else {
      await handleAttachmentUpload(uploadingFor.index, file);
    }
    
    setUploadingFor(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={uploadingFor?.type === 'video' ? 'video/*' : '*'}
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Lessons List */}
      <div className="space-y-3">
        {lessons.map((lesson, index) => (
          <div
            key={index}
            className={cn(
              "border rounded-lg overflow-hidden transition-all",
              expandedLesson === index ? "border-black" : "border-gray-200",
              lesson.is_free_preview && "border-l-4 border-l-green-500"
            )}
          >
            {/* Lesson Header */}
            <div
              className={cn(
                "flex items-center gap-3 p-3 cursor-pointer",
                expandedLesson === index ? "bg-gray-50" : "bg-white hover:bg-gray-50"
              )}
              onClick={() => setExpandedLesson(expandedLesson === index ? null : index)}
            >
              <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLesson(index, 'up');
                  }}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLesson(index, 'down');
                  }}
                  disabled={index === lessons.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-400">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="font-medium text-gray-900 truncate">
                    {lesson.title || 'Untitled Lesson'}
                  </span>
                  {lesson.is_free_preview && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                      Free Preview
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {lesson.video_url && <Video className="w-4 h-4 text-blue-500" />}
                {lesson.attachments.length > 0 && (
                  <FileText className="w-4 h-4 text-gray-400" />
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLesson(index);
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-gray-400 transition-transform",
                    expandedLesson === index && "rotate-180"
                  )}
                />
              </div>
            </div>

            {/* Lesson Content (Expanded) */}
            {expandedLesson === index && (
              <div className="p-4 border-t border-gray-200 space-y-4 bg-white">
                {/* Title */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                    Lesson Title
                  </label>
                  <Input
                    value={lesson.title}
                    onChange={(e) => updateLesson(index, { title: e.target.value })}
                    placeholder="e.g., Introduction to the Course"
                    className="h-10"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                    Description
                  </label>
                  <Textarea
                    value={lesson.description}
                    onChange={(e) => updateLesson(index, { description: e.target.value })}
                    placeholder="What will students learn in this lesson?"
                    rows={3}
                  />
                </div>

                {/* Video Upload */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                    Video
                  </label>
                  {lesson.video_url ? (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Video className="w-5 h-5 text-blue-500" />
                      <span className="flex-1 text-sm text-blue-700 truncate">
                        Video uploaded
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => updateLesson(index, { video_url: '' })}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setUploadingFor({ index, type: 'video' });
                        fileInputRef.current?.click();
                      }}
                      disabled={uploading === index}
                      className="w-full h-20 border-dashed gap-2"
                    >
                      {uploading === index ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          Upload Video
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Content */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                    Text Content (optional)
                  </label>
                  <Textarea
                    value={lesson.content_html}
                    onChange={(e) => updateLesson(index, { content_html: e.target.value })}
                    placeholder="Additional text content, notes, or instructions..."
                    rows={4}
                  />
                </div>

                {/* Attachments */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                    Attachments
                  </label>
                  {lesson.attachments.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {lesson.attachments.map((att, attIndex) => (
                        <div 
                          key={attIndex}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                        >
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="flex-1 text-sm truncate">{att.name}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index, attIndex)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUploadingFor({ index, type: 'attachment' });
                      fileInputRef.current?.click();
                    }}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Attachment
                  </Button>
                </div>

                {/* Free Preview Toggle */}
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Free Preview</p>
                    <p className="text-xs text-gray-500">
                      Let potential buyers preview this lesson
                    </p>
                  </div>
                  <Switch
                    checked={lesson.is_free_preview}
                    onCheckedChange={(checked) => 
                      updateLesson(index, { is_free_preview: checked })
                    }
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Lesson Button */}
      <Button
        type="button"
        variant="outline"
        onClick={addLesson}
        className="w-full gap-2 border-dashed"
      >
        <Plus className="w-4 h-4" />
        Add Lesson
      </Button>

      {/* Summary */}
      <p className="text-xs text-gray-500">
        {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} • 
        {lessons.filter(l => l.is_free_preview).length} free preview{lessons.filter(l => l.is_free_preview).length !== 1 ? 's' : ''}
      </p>
    </div>
  );
};

export default LessonBuilder;
