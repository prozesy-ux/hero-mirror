import { Skeleton } from '@/components/ui/skeleton';

interface AppShellProps {
  variant?: 'dashboard' | 'seller' | 'store' | 'default';
}

/**
 * App Shell - Instant skeleton UI shown during loading
 * Provides immediate visual feedback like Fiverr/Upwork
 */
const AppShell = ({ variant = 'default' }: AppShellProps) => {
  // Dashboard shell with sidebar
  if (variant === 'dashboard' || variant === 'seller') {
    return (
      <div className="min-h-screen bg-background flex">
        {/* Sidebar skeleton */}
        <aside className="hidden lg:flex w-64 border-r border-border bg-card flex-col">
          <div className="p-4 border-b border-border">
            <Skeleton className="h-8 w-32" />
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Top bar */}
          <header className="h-16 border-b border-border bg-card flex items-center px-4 gap-4">
            <Skeleton className="h-8 w-8 rounded-full lg:hidden" />
            <Skeleton className="h-8 flex-1 max-w-md rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </header>

          {/* Content area */}
          <main className="flex-1 p-4 md:p-6">
            <div className="space-y-6">
              {/* Title */}
              <Skeleton className="h-8 w-48" />
              
              {/* Stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>

              {/* Main content */}
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Store shell
  if (variant === 'store') {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center px-4 gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-32" />
          <div className="flex-1" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </header>

        {/* Store content */}
        <main className="max-w-7xl mx-auto p-4 md:p-6">
          {/* Store header */}
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          {/* Products grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Default centered loading - spinner only
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent" />
        <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border border-primary/20" />
      </div>
    </div>
  );
};

export default AppShell;
