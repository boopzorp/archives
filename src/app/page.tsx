"use client";

import { useState, useEffect } from 'react';
import { Plus, WifiOff } from 'lucide-react';
import Header from '@/components/header';
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
      const storedLinks = localStorage.getItem('linkflow_links');
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
        localStorage.setItem('linkflow_links', JSON.stringify(links));
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
    return null; // Or a loading spinner
  }

  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="container mx-auto">
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
                Your saved links will appear here. Get started by adding your first link using the plus button.
              </p>
            </div>
          )}
        </div>
      </main>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <div className="fixed bottom-8 right-8 z-50">
            <Button size="icon" className="h-16 w-16 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95">
              <Plus className="h-8 w-8" />
              <span className="sr-only">Add Link</span>
            </Button>
          </div>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-headline text-2xl">Add a new link</SheetTitle>
          </SheetHeader>
          <AddLinkForm onAddLink={addLink} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
