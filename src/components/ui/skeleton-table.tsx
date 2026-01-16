import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export const SkeletonTable = ({ rows = 5, columns = 4 }: SkeletonTableProps) => {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead className="bg-white/5">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="text-left px-6 py-4">
                <Skeleton className="h-4 w-20 bg-white/10" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-t border-white/5">
              {Array.from({ length: columns }).map((_, colIdx) => (
                <td key={colIdx} className="px-6 py-4">
                  <Skeleton className="h-4 w-full max-w-[120px] bg-white/10" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface SkeletonStatCardProps {
  count?: number;
}

export const SkeletonStatCards = ({ count = 2 }: SkeletonStatCardProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-6 mb-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-xl bg-white/10" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-20 bg-white/10" />
              <Skeleton className="h-8 w-16 bg-white/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
