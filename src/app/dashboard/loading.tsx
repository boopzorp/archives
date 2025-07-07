import { AppLayout } from '@/components/app-layout';

export default function Loading() {
  return (
    <AppLayout>
      <header className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-muted rounded-md animate-pulse md:hidden" />
          <div className="h-8 w-32 bg-muted rounded-md animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-28 bg-muted rounded-md animate-pulse" />
          <div className="h-10 w-36 bg-muted rounded-md animate-pulse hidden md:flex" />
          <div className="h-10 w-10 bg-muted rounded-md animate-pulse" />
        </div>
      </header>
      <main className="p-4 md:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-video w-full bg-muted rounded-md animate-pulse"></div>
              <div className="h-5 w-3/4 bg-muted rounded-md animate-pulse mt-4"></div>
              <div className="h-4 w-1/2 bg-muted rounded-md animate-pulse"></div>
            </div>
          ))}
        </div>
      </main>
    </AppLayout>
  );
}
