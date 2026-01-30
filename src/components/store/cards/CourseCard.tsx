import { GraduationCap, Clock, BookOpen, BarChart3, Play, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CourseCardProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    icon_url: string | null;
    type_metadata?: Record<string, any>;
    sold_count?: number | null;
  };
  onView: () => void;
  onBuy: () => void;
  purchasing?: boolean;
}

const levelColors: Record<string, { bg: string; text: string }> = {
  Beginner: { bg: 'bg-green-100', text: 'text-green-700' },
  Intermediate: { bg: 'bg-amber-100', text: 'text-amber-700' },
  Advanced: { bg: 'bg-red-100', text: 'text-red-700' },
};

const CourseCard = ({ product, onView, onBuy, purchasing }: CourseCardProps) => {
  const metadata = product.type_metadata || {};
  const levelStyle = levelColors[metadata.level] || { bg: 'bg-slate-100', text: 'text-slate-700' };
  
  return (
    <div 
      className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all duration-300 cursor-pointer"
      onClick={onView}
    >
      {/* Course thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-amber-100 to-amber-50">
        {product.icon_url ? (
          <img 
            src={product.icon_url} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600">
            <GraduationCap className="w-16 h-16 text-white/80" />
          </div>
        )}
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-6 h-6 text-amber-600 ml-1" />
          </div>
        </div>
        
        {/* Level badge */}
        {metadata.level && (
          <Badge className={`absolute top-3 left-3 ${levelStyle.bg} ${levelStyle.text} border-0 text-[10px] font-semibold`}>
            <BarChart3 className="w-3 h-3 mr-1" />
            {metadata.level}
          </Badge>
        )}
        
        {/* Duration badge */}
        {metadata.duration_hours && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 text-white text-[10px] font-bold rounded flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {metadata.duration_hours}h
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-slate-900 line-clamp-2 mb-2 group-hover:text-amber-600 transition-colors">
          {product.name}
        </h3>
        
        {/* Course stats */}
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
          {metadata.lessons && (
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-amber-500" />
              {metadata.lessons} lessons
            </span>
          )}
          {metadata.duration_hours && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              {metadata.duration_hours} hours
            </span>
          )}
        </div>
        
        {/* Students enrolled */}
        {(product.sold_count || 0) > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex -space-x-1.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border border-white text-[8px] text-white flex items-center justify-center font-bold">
                  {i}
                </div>
              ))}
            </div>
            <span className="text-xs text-slate-500">
              {product.sold_count}+ enrolled
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-xl font-bold text-amber-600">${product.price.toFixed(2)}</span>
          <Button 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onBuy();
            }}
            disabled={purchasing}
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Enroll Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
