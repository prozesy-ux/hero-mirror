import { Skeleton } from '@/components/ui/skeleton';

export const CardSkeleton = () => (
  <div className="bg-white rounded-2xl p-4 border border-gray-100">
    <Skeleton className="h-32 w-full rounded-xl mb-3" />
    <Skeleton className="h-4 w-3/4 mb-2" />
    <Skeleton className="h-3 w-1/2" />
  </div>
);

export const CarouselSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="flex gap-4 overflow-hidden">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex-shrink-0 w-64">
        <CardSkeleton />
      </div>
    ))}
  </div>
);

export const StatsSkeleton = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100">
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-8 w-24" />
      </div>
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
    <div className="p-4 border-b border-gray-100">
      <Skeleton className="h-5 w-32" />
    </div>
    <div className="divide-y divide-gray-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  </div>
);

export const GridSkeleton = ({ count = 8, cols = 4 }: { count?: number; cols?: number }) => (
  <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-${cols} gap-4`}>
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

export const SellerDashboardSkeleton = () => (
  <div className="space-y-6 p-4">
    {/* Trust Score Skeleton */}
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <div className="flex items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </div>
    
    {/* Stats Grid */}
    <StatsSkeleton />
    
    {/* Quick Actions */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-xl" />
      ))}
    </div>
    
    {/* Recent Activity */}
    <TableSkeleton rows={3} />
  </div>
);

export const DashboardHomeSkeleton = () => (
  <div className="space-y-8">
    {/* Section Header */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-8 w-20" />
    </div>
    <CarouselSkeleton count={4} />
    
    {/* Second Section */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-8 w-20" />
    </div>
    <CarouselSkeleton count={4} />
  </div>
);

export const PromptsGridSkeleton = () => (
  <div className="space-y-6">
    {/* Tabs */}
    <div className="flex gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-24 rounded-full" />
      ))}
    </div>
    
    {/* Grid */}
    <GridSkeleton count={8} cols={4} />
  </div>
);

export const AIAccountsSkeleton = () => (
  <div className="space-y-6">
    {/* Tabs */}
    <div className="flex gap-2 mb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-28 rounded-full" />
      ))}
    </div>
    
    {/* Categories */}
    <div className="flex gap-2 overflow-hidden pb-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-24 rounded-full flex-shrink-0" />
      ))}
    </div>
    
    {/* Products Grid */}
    <GridSkeleton count={6} cols={3} />
  </div>
);
