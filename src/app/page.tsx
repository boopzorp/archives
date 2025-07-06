"use client";

import { useState, useEffect } from 'react';
import { Plus, WifiOff, Settings, Search as SearchIcon, Star } from 'lucide-react';
import { AppLayout } from '@/components/app-layout';
import LinkCard from '@/components/link-card';
import { GraphView } from '@/components/graph-view';
import { AddLinkForm } from '@/components/add-link-form';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { Link } from '@/lib/types';
import { AppProvider, useAppContext } from '@/context/app-context';

function HomePage() {
  const { searchTerm, links, addLink, activeFilter, folders } = useAppContext();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleAddLink = (newLink: Omit<Link, 'id' | 'createdAt' | 'isFavorite' | 'folderId'>) => {
    addLink(newLink);
    setIsSheetOpen(false);
  };

  const filteredBySearch = links.filter(link => {
    if (!searchTerm) return true;
    const lowercasedTerm = searchTerm.toLowerCase();
    return (
      link.title.toLowerCase().includes(lowercasedTerm) ||
      (link.description && link.description.toLowerCase().includes(lowercasedTerm)) ||
      link.url.toLowerCase().includes(lowercasedTerm) ||
      link.tags.some(tag => tag.toLowerCase().includes(lowercasedTerm))
    )
  });

  const filteredLinks = filteredBySearch.filter(link => {
    switch (activeFilter.type) {
      case 'all':
        return true;
      case 'folder':
        return link.folderId === activeFilter.value;
      case 'tag':
        return link.tags.includes(activeFilter.value!);
      case 'favorites':
        return link.isFavorite;
      default:
        return true;
    }
  });
  
  const getHeaderTitle = () => {
    switch (activeFilter.type) {
      case 'all':
        return 'All';
      case 'folder':
        const folder = folders.find(f => f.id === activeFilter.value);
        return folder ? folder.name : 'Folder';
      case 'tag':
        return `#${activeFilter.value}`;
      case 'favorites':
        return 'Favorites';
      case 'graph':
        return 'Graph View';
      default:
        return 'All';
    }
  };

  if (!isMounted) {
     return (
      <AppLayout>
        <header className="flex items-center justify-between p-4 border-b bg-card">
          <div className="h-8 w-32 bg-muted rounded-md animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-10 w-28 bg-muted rounded-md animate-pulse" />
            <div className="h-10 w-36 bg-muted rounded-md animate-pulse" />
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

  return (
    <AppLayout>
      <header className="flex items-center justify-between p-4 border-b bg-card">
        <h1 className="text-2xl font-bold">{getHeaderTitle()}</h1>
        <div className="flex items-center gap-2">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button>
                <Plus className="-ml-1 h-5 w-5" />
                New Link
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="font-headline text-2xl">Add a new link</SheetTitle>
              </SheetHeader>
              <AddLinkForm onAddLink={handleAddLink} />
            </SheetContent>
          </Sheet>
          <Button variant="outline">Give Feedback</Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8">
        {activeFilter.type === 'graph' ? (
          <GraphView />
        ) : (
          <>
            {filteredLinks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredLinks.map((link) => (
                  <LinkCard key={link.id} link={link} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-20">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                   {searchTerm ? <SearchIcon className="w-12 h-12 text-primary" /> : 
                    activeFilter.type === 'favorites' ? <Star className="w-12 h-12 text-primary" /> :
                    <WifiOff className="w-12 h-12 text-primary" />}
                </div>
                <h2 className="text-2xl font-bold font-headline mb-2">
                  {searchTerm ? 'No links found' : 
                   activeFilter.type === 'favorites' ? 'No favorites yet' :
                   activeFilter.type !== 'all' ? 'No links found' :
                   "It's quiet in here..."}
                </h2>
                <p className="text-muted-foreground max-w-sm">
                  {searchTerm 
                    ? `Your search for "${searchTerm}" did not match any links.` 
                    : activeFilter.type === 'favorites'
                    ? 'Click the star on a link to add it to your favorites.'
                    : activeFilter.type !== 'all' 
                    ? 'There are no links in this view.'
                    : 'Your saved links will appear here. Get started by adding your first link.'
                  }
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </AppLayout>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <HomePage />
    </AppProvider>
  );
}
