import { MessageSquare, Eye, Clock, CheckCircle, Truck, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface OrderCardProps {
  id: string;
  title: string;
  imageUrl?: string | null;
  sellerName?: string;
  sellerAvatar?: string | null;
  buyerName?: string;
  buyerAvatar?: string | null;
  amount: number;
  currency?: string;
  status: 'pending' | 'delivered' | 'completed' | 'cancelled' | 'refunded';
  createdAt: string;
  dueDate?: string;
  onView?: () => void;
  onContact?: () => void;
  variant?: 'buyer' | 'seller';
  className?: string;
}

const statusConfig = {
  pending: {
    label: 'In Progress',
    icon: Clock,
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  delivered: {
    label: 'Delivered',
    icon: Truck,
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
  refunded: {
    label: 'Refunded',
    icon: AlertCircle,
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
  },
};

const OrderCard = ({
  id,
  title,
  imageUrl,
  sellerName,
  sellerAvatar,
  buyerName,
  buyerAvatar,
  amount,
  currency = '$',
  status,
  createdAt,
  dueDate,
  onView,
  onContact,
  variant = 'buyer',
  className,
}: OrderCardProps) => {
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;
  const personName = variant === 'buyer' ? sellerName : buyerName;
  const personAvatar = variant === 'buyer' ? sellerAvatar : buyerAvatar;
  const personLabel = variant === 'buyer' ? 'Seller' : 'Buyer';

  const formatPrice = (val: number) => `${currency}${val.toLocaleString()}`;

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 p-4",
        "hover:shadow-stat-hover hover:border-slate-300 transition-all duration-300",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Product Image or Avatar */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
          />
        ) : personAvatar ? (
          <img
            src={personAvatar}
            alt={personName || 'User'}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-semibold">
              {(personName || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Status */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0">
              <h4 className="font-medium text-slate-900 truncate text-[15px] leading-tight">
                {title}
              </h4>
              {personName && (
                <p className="text-sm text-slate-500 mt-0.5">
                  {personLabel}: {personName}
                </p>
              )}
            </div>
            
            {/* Status Badge */}
            <div
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium flex-shrink-0",
                statusInfo.bg,
                statusInfo.text
              )}
            >
              <StatusIcon className="w-3 h-3" />
              {statusInfo.label}
            </div>
          </div>

          {/* Order Details */}
          <div className="flex items-center gap-3 mt-2 text-sm text-slate-600 flex-wrap">
            <span className="font-semibold text-slate-900">{formatPrice(amount)}</span>
            <span className="text-slate-300">•</span>
            <span>{format(new Date(createdAt), 'MMM d, yyyy')}</span>
            {dueDate && status === 'pending' && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-amber-600">
                  Due: {format(new Date(dueDate), 'MMM d')}
                </span>
              </>
            )}
          </div>

          {/* Order ID */}
          <p className="text-[11px] text-slate-400 mt-1.5">
            Order ID: {id.slice(0, 8).toUpperCase()}
          </p>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView?.();
              }}
              className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              View Details
            </button>
            {onContact && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onContact?.();
                }}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Contact {personLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
