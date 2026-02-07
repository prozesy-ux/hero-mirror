import { BookOpen, FileText, Star, Download } from 'lucide-react';
import { ProductCardProps } from './ProductCardRenderer';
import { cn } from '@/lib/utils';

const EbookCard = ({
  product,
  onClick,
}: ProductCardProps) => {
  const pageCount = product.pageCount || 0;
  const formats = product.formats || ['PDF'];

  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl overflow-hidden border border-amber-200/50 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-amber-300 hover:-translate-y-1"
    >
      {/* 3D Book Cover Effect */}
      <div className="relative p-6 pb-4">
        <div className="relative mx-auto w-[140px] perspective-1000">
          {/* Book shadow */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[120px] h-4 bg-black/10 blur-lg rounded-full" />
          
          {/* Book spine */}
          <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-amber-600 to-amber-500 rounded-l-sm transform -skew-y-6 origin-left shadow-lg" />
          
          {/* Book cover with 3D tilt */}
          <div className="relative bg-white rounded-r-lg rounded-l-sm overflow-hidden shadow-xl transform transition-transform duration-500 group-hover:rotate-y-[-8deg] group-hover:scale-105 border border-amber-200/50"
               style={{ 
                 aspectRatio: '2/3',
                 transformStyle: 'preserve-3d',
               }}>
            {product.iconUrl ? (
              <img
                src={product.iconUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-100 to-yellow-200 p-4">
                <BookOpen className="w-10 h-10 text-amber-600 mb-2" />
                <div className="text-center">
                  <p className="text-[10px] font-bold text-amber-800 line-clamp-2">{product.name}</p>
                </div>
              </div>
            )}

            {/* Page edge effect */}
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-r from-transparent to-amber-200/50" />
          </div>

          {/* Format badges floating */}
          <div className="absolute -top-1 -right-2 flex flex-col gap-1">
            {formats.slice(0, 2).map((format) => (
              <span
                key={format}
                className="px-1.5 py-0.5 bg-amber-500 text-white rounded text-[9px] font-bold shadow-md"
              >
                {format}
              </span>
            ))}
          </div>
        </div>

        {/* E-book badge */}
        <div className="absolute top-3 left-3 px-2 py-1 bg-amber-500 text-white rounded-full text-[10px] font-semibold flex items-center gap-1 shadow-md">
          <BookOpen className="w-3 h-3" />
          E-book
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        {/* Title */}
        <h3 className="text-sm font-semibold text-amber-900 line-clamp-2 mb-1 min-h-[2.5rem] leading-tight group-hover:text-amber-700 transition-colors text-center">
          {product.name}
        </h3>

        {/* Author */}
        {product.sellerName && (
          <p className="text-xs text-amber-700/60 mb-2 truncate text-center">
            by {product.sellerName}
          </p>
        )}

        {/* Stats row */}
        <div className="flex items-center justify-center gap-3 mb-3 text-xs text-amber-700/60">
          {pageCount > 0 && (
            <div className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              <span>{pageCount} pages</span>
            </div>
          )}
          {product.rating && product.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-amber-900">{product.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-amber-900">${product.price.toFixed(0)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-amber-600/50 line-through">
                ${product.originalPrice.toFixed(0)}
              </span>
            )}
          </div>
          <div className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md">
            <Download className="w-3.5 h-3.5" />
            Read Now
          </div>
        </div>
      </div>
    </button>
  );
};

export default EbookCard;
