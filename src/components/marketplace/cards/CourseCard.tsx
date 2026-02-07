import { Play, BookOpen, Clock, Star, GraduationCap, Users } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Progress } from '@/components/ui/progress';
import { ProductCardProps } from './ProductCardRenderer';
import { cn } from '@/lib/utils';

const CourseCard = ({
  product,
  onClick,
}: ProductCardProps) => {
  const hasProgress = product.progress !== undefined && product.progress > 0;
  const lessonCount = product.lessonCount || 0;
  const duration = product.totalDuration || '';

  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-white rounded-xl overflow-hidden border border-black/10 shadow-sm transition-all duration-200 hover:shadow-xl hover:border-teal-200 hover:-translate-y-1"
    >
      {/* Video-style 16:9 thumbnail */}
      <div className="relative overflow-hidden">
        <AspectRatio ratio={16/9}>
          {product.iconUrl ? (
            <img
              src={product.iconUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-400 via-cyan-500 to-purple-500">
              <GraduationCap className="w-16 h-16 text-white/80" />
            </div>
          )}
        </AspectRatio>

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/95 shadow-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <Play className="w-7 h-7 text-teal-600 ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Course info badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className="px-2.5 py-1 bg-teal-500 text-white rounded-full text-[11px] font-semibold flex items-center gap-1.5 shadow-lg">
            <GraduationCap className="w-3.5 h-3.5" />
            Course
          </div>
        </div>

        {/* Lesson count & Duration */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          {lessonCount > 0 && (
            <div className="px-2.5 py-1 bg-black/70 backdrop-blur-sm text-white rounded-full text-[11px] font-medium flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {lessonCount} Lessons
            </div>
          )}
          {duration && (
            <div className="px-2.5 py-1 bg-black/70 backdrop-blur-sm text-white rounded-full text-[11px] font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {duration}
            </div>
          )}
        </div>

        {/* Progress bar for enrolled courses */}
        {hasProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20">
            <div 
              className="h-full bg-gradient-to-r from-teal-400 to-cyan-400"
              style={{ width: `${product.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-sm font-semibold text-black line-clamp-2 mb-2 min-h-[2.5rem] leading-tight group-hover:text-teal-700 transition-colors">
          {product.name}
        </h3>

        {/* Instructor */}
        {product.sellerName && (
          <div className="flex items-center gap-2 mb-3">
            {product.sellerAvatar ? (
              <img 
                src={product.sellerAvatar} 
                alt={product.sellerName}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center">
                <span className="text-[10px] font-semibold text-teal-700">
                  {product.sellerName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <p className="text-xs text-black/60 truncate">{product.sellerName}</p>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-3 text-xs text-black/50">
          {product.soldCount && product.soldCount > 0 && (
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{product.soldCount.toLocaleString()} enrolled</span>
            </div>
          )}
          {product.rating && product.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-black">{product.rating.toFixed(1)}</span>
              {product.reviewCount && <span>({product.reviewCount})</span>}
            </div>
          )}
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-black">${product.price.toFixed(0)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-black/40 line-through">
                ${product.originalPrice.toFixed(0)}
              </span>
            )}
          </div>
          <div className={cn(
            "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
            hasProgress 
              ? "bg-teal-100 text-teal-700" 
              : "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
          )}>
            {hasProgress ? `${product.progress}% Complete` : 'Start Learning'}
          </div>
        </div>
      </div>
    </button>
  );
};

export default CourseCard;
