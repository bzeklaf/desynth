import { Suspense, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  type?: 'page' | 'component' | 'inline';
}

const DefaultPageSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="border-b border-border bg-card/30">
      <div className="container mx-auto px-4 py-4">
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-12 w-3/4" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

const DefaultComponentSkeleton = () => (
  <Card>
    <CardContent className="p-6 space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </CardContent>
  </Card>
);

const DefaultInlineSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);

export const LoadingBoundary = ({ 
  children, 
  fallback,
  type = 'component'
}: LoadingBoundaryProps) => {
  const getDefaultFallback = () => {
    switch (type) {
      case 'page':
        return <DefaultPageSkeleton />;
      case 'component':
        return <DefaultComponentSkeleton />;
      case 'inline':
        return <DefaultInlineSkeleton />;
      default:
        return <DefaultComponentSkeleton />;
    }
  };

  return (
    <Suspense fallback={fallback || getDefaultFallback()}>
      {children}
    </Suspense>
  );
};

// Loading component for critical sections
export const CriticalLoading = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center justify-center min-h-[200px] ${className}`}>
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);