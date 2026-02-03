import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  ArrowLeft, Play, CheckCircle, Circle, Lock, 
  Download, FileText, Clock, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  video_duration: number | null;
  content_html: string;
  attachments: { url: string; name: string; size: number }[];
  display_order: number;
  is_free_preview: boolean;
}

interface LessonProgress {
  lesson_id: string;
  progress_percent: number;
  completed_at: string | null;
  last_position: number;
}

interface Course {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
  seller: {
    store_name: string;
  };
}

const CourseViewer = () => {
  const { productId } = useParams<{ productId: string }>();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (productId && user) {
      fetchCourseData();
    }
  }, [productId, user]);

  const fetchCourseData = async () => {
    if (!productId || !user) return;
    
    setLoading(true);
    try {
      // Check access
      const { data: accessData } = await supabase
        .from('buyer_content_access')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('product_id', productId)
        .eq('access_type', 'course')
        .maybeSingle();

      setHasAccess(!!accessData);

      // Fetch course info
      const { data: courseData, error: courseError } = await supabase
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

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('product_id', productId)
        .order('display_order');

      if (lessonsError) throw lessonsError;
      
      const parsedLessons = (lessonsData || []).map(l => ({
        ...l,
        attachments: typeof l.attachments === 'string' 
          ? JSON.parse(l.attachments) 
          : (l.attachments || [])
      }));
      
      setLessons(parsedLessons);

      // Set first lesson as current
      if (parsedLessons.length > 0) {
        setCurrentLesson(parsedLessons[0]);
      }

      // Fetch progress
      if (accessData) {
        const { data: progressData } = await supabase
          .from('course_progress')
          .select('*')
          .eq('buyer_id', user.id)
          .eq('product_id', productId);

        const progressMap: Record<string, LessonProgress> = {};
        (progressData || []).forEach(p => {
          progressMap[p.lesson_id] = p;
        });
        setProgress(progressMap);

        // Find first incomplete lesson
        const firstIncomplete = parsedLessons.find(
          l => !progressMap[l.id]?.completed_at
        );
        if (firstIncomplete) {
          setCurrentLesson(firstIncomplete);
        }
      }
    } catch (error: any) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (lessonId: string, percent: number, position: number) => {
    if (!user || !productId) return;

    const isComplete = percent >= 90;

    await supabase
      .from('course_progress')
      .upsert({
        buyer_id: user.id,
        product_id: productId,
        lesson_id: lessonId,
        progress_percent: Math.min(100, percent),
        last_position: position,
        completed_at: isComplete ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'buyer_id,lesson_id'
      });

    setProgress(prev => ({
      ...prev,
      [lessonId]: {
        lesson_id: lessonId,
        progress_percent: percent,
        completed_at: isComplete ? new Date().toISOString() : null,
        last_position: position
      }
    }));
  };

  const handleVideoProgress = () => {
    if (!videoRef.current || !currentLesson) return;
    
    const video = videoRef.current;
    const percent = (video.currentTime / video.duration) * 100;
    
    // Update progress every 10 seconds
    if (Math.floor(video.currentTime) % 10 === 0) {
      updateProgress(currentLesson.id, percent, video.currentTime);
    }
  };

  const goToNextLesson = () => {
    if (!currentLesson) return;
    const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
    if (currentIndex < lessons.length - 1) {
      setCurrentLesson(lessons[currentIndex + 1]);
    }
  };

  const markComplete = async () => {
    if (!currentLesson) return;
    await updateProgress(currentLesson.id, 100, 0);
    toast.success('Lesson marked as complete!');
  };

  const overallProgress = lessons.length > 0
    ? Math.round(
        Object.values(progress).filter(p => p.completed_at).length / lessons.length * 100
      )
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 aspect-video rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <Card className="p-12 text-center">
        <Lock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Access Required
        </h3>
        <p className="text-gray-500 mb-6">
          You need to purchase this course to access the lessons.
        </p>
        <Button asChild>
          <Link to="/marketplace">Browse Courses</Link>
        </Button>
      </Card>
    );
  }

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
          <h1 className="text-xl font-bold text-gray-900">{course?.name}</h1>
          <p className="text-sm text-gray-500">
            by {course?.seller?.store_name} • {overallProgress}% complete
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg p-4 border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Course Progress</span>
          <span className="text-sm text-gray-500">
            {Object.values(progress).filter(p => p.completed_at).length} / {lessons.length} lessons
          </span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Video Player & Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video */}
          {currentLesson?.video_url && (
            <div className="aspect-video bg-black rounded-xl overflow-hidden">
              <video
                ref={videoRef}
                src={currentLesson.video_url}
                controls
                className="w-full h-full"
                onTimeUpdate={handleVideoProgress}
                onEnded={() => {
                  updateProgress(currentLesson.id, 100, 0);
                  goToNextLesson();
                }}
              />
            </div>
          )}

          {/* Lesson Info */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {currentLesson?.title}
              </h2>
              <p className="text-gray-600 mb-4">
                {currentLesson?.description}
              </p>

              {/* Content HTML */}
              {currentLesson?.content_html && (
                <div 
                  className="prose prose-sm max-w-none mb-6"
                  dangerouslySetInnerHTML={{ __html: currentLesson.content_html }}
                />
              )}

              {/* Attachments */}
              {currentLesson?.attachments && currentLesson.attachments.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Attachments
                  </h4>
                  <div className="space-y-2">
                    {currentLesson.attachments.map((att, index) => (
                      <a
                        key={index}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <FileText className="w-5 h-5 text-gray-400" />
                        <span className="flex-1 text-sm font-medium">{att.name}</span>
                        <Download className="w-4 h-4 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 mt-6 pt-4 border-t">
                {!progress[currentLesson?.id || '']?.completed_at && (
                  <Button onClick={markComplete} variant="outline" className="gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Mark Complete
                  </Button>
                )}
                <Button onClick={goToNextLesson} className="gap-2 ml-auto">
                  Next Lesson
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lessons Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Lessons</h3>
              <div className="space-y-1">
                {lessons.map((lesson, index) => {
                  const lessonProgress = progress[lesson.id];
                  const isComplete = !!lessonProgress?.completed_at;
                  const isActive = currentLesson?.id === lesson.id;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setCurrentLesson(lesson)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                        isActive 
                          ? "bg-black text-white" 
                          : "hover:bg-gray-100"
                      )}
                    >
                      <div className="flex-shrink-0">
                        {isComplete ? (
                          <CheckCircle className={cn(
                            "w-5 h-5",
                            isActive ? "text-green-400" : "text-green-500"
                          )} />
                        ) : (
                          <Circle className={cn(
                            "w-5 h-5",
                            isActive ? "text-white/60" : "text-gray-300"
                          )} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          !isActive && "text-gray-900"
                        )}>
                          {index + 1}. {lesson.title}
                        </p>
                        {lesson.video_duration && (
                          <p className={cn(
                            "text-xs flex items-center gap-1 mt-0.5",
                            isActive ? "text-white/60" : "text-gray-500"
                          )}>
                            <Clock className="w-3 h-3" />
                            {Math.floor(lesson.video_duration / 60)}m
                          </p>
                        )}
                      </div>
                      {lesson.is_free_preview && !hasAccess && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                          Free
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseViewer;
