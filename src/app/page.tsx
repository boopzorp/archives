"use client";

import { useState, useEffect } from 'react';
import { Plus, WifiOff, Settings } from 'lucide-react';
import { AppLayout } from '@/components/app-layout';
import LinkCard from '@/components/link-card';
import { AddLinkForm } from '@/components/add-link-form';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { Link } from '@/lib/types';

export default function Home() {
  const [links, setLinks] = useState<Link[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const storedLinks = localStorage.getItem('linksort_links');
      if (storedLinks) {
        setLinks(JSON.parse(storedLinks));
      }
    } catch (error) {
      console.error("Failed to parse links from localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      try {
        localStorage.setItem('linksort_links', JSON.stringify(links));
      } catch (error) {
        console.error("Failed to save links to localStorage", error);
      }
    }
  }, [links, isClient]);

  const addLink = (newLink: Omit<Link, 'id' | 'createdAt'>) => {
    const linkWithMeta: Link = {
      ...newLink,
      id: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setLinks(prevLinks => [linkWithMeta, ...prevLinks]);
    setIsSheetOpen(false);
  };

  const deleteLink = (id: string) => {
    setLinks(prevLinks => prevLinks.filter(link => link.id !== id));
  };
  
  if (!isClient) {
    return (
      <AppLayout>
        <div className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-video w-full bg-muted rounded-md animate-pulse"></div>
                <div className="h-5 w-3/4 bg-muted rounded-md animate-pulse"></div>
                <div className="h-4 w-1/2 bg-muted rounded-md animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <header className="flex items-center justify-between p-4 border-b bg-card">
        <h1 className="text-2xl font-bold">All</h1>
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
              <AddLinkForm onAddLink={addLink} />
            </SheetContent>
          </Sheet>
          <Button variant="outline">Give Feedback</Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8">
          {links.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {links.map((link) => (
                <LinkCard key={link.id} link={link} onDelete={deleteLink} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-20">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <WifiOff className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold font-headline mb-2">It's quiet in here...</h2>
              <p className="text-muted-foreground max-w-sm">
                Your saved links will appear here. Get started by adding your first link.
              </p>
            </div>
          )}
      </main>
    </AppLayout>
  );
}
