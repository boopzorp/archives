
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Plus, WifiOff, Search as SearchIcon, Star, MessageSquare, AlertCircle } from 'lucide-react';
import { AppLayout } from '@/components/app-layout';
import LinkCard from '@/components/link-card';
import { GraphView } from '@/components/graph-view';
import { AddLinkForm, AddLinkFormValues } from '@/components/add-link-form';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Link } from '@/lib/types';
import { useAppContext } from '@/context/app-context';
import { useAuth } from '@/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getBrandName } from '@/lib/utils';

function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const isFirebaseReady = !!auth && !!db;

  const { searchTerm, links, addLink, updateLink, activeFilter, folders, groupBy, sortBy, loading: dataLoading, error } = useAppContext();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [linkToEdit, setLinkToEdit] = useState<Link | null>(null);
  const [initialUrl, setInitialUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const urlFromQuery = searchParams.get('add');
    if (urlFromQuery) {
      try {
        const decodedUrl = decodeURIComponent(urlFromQuery);
        new URL(decodedUrl); // validates the URL
        setInitialUrl(decodedUrl);
        setIsSheetOpen(true);
        // Remove query param from URL to avoid re-triggering on reload
        router.replace('/dashboard', { scroll: false });
      } catch (e) {
        console.error("Invalid URL from query param", e);
        router.replace('/dashboard', { scroll: false });
      }
    }
  }, [searchParams, router]);


  const handleSaveLink = async (formDataWithImage: AddLinkFormValues & { imageUrl?: string }, linkId?: string) => {
    try {
      const { imageUrl, ...formData } = formDataWithImage;
      const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      
      const linkData: Partial<Link> = { ...formData, tags: tagsArray, imageUrl };
      
      // Firestore does not support `undefined`. We must remove any fields that are undefined.
      Object.keys(linkData).forEach(key => {
        if ((linkData as any)[key] === undefined) {
          delete (linkData as any)[key];
        }
      });
      
      if (linkId) {
        await updateLink(linkId, linkData);
        setLinkToEdit(null);
      } else {
        await addLink(linkData as Omit<Link, 'id' | 'createdAt' | 'isFavorite' | 'folderId'>);
        setIsSheetOpen(false);
      }
    } catch (error) {
       console.error("Failed to save link:", error);
       toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: "Could not save the link. This can happen if your Firebase project is not fully configured. Please ensure you have enabled Firestore database in your project.",
      });
    }
  };

  const filteredBySearch = useMemo(() => links.filter(link => {
    if (!searchTerm) return true;
    const lowercasedTerm = searchTerm.toLowerCase();
    return (
      link.title.toLowerCase().includes(lowercasedTerm) ||
      (link.description && link.description.toLowerCase().includes(lowercasedTerm)) ||
      link.url.toLowerCase().includes(lowercasedTerm) ||
      link.tags.some(tag => tag.toLowerCase().includes(lowercasedTerm))
    )
  }), [links, searchTerm]);

  const filteredLinks = useMemo(() => filteredBySearch.filter(link => {
    switch (activeFilter.type) {
      case 'all':
        return true;
      case 'folder':
        return link.folderId === activeFilter.value;
      case 'tag':
        return link.tags.includes(activeFilter.value!);
      case 'favorites':
        return link.isFavorite;
      case 'notes':
        return !!link.description?.trim();
      case 'source':
        try {
            const hostname = new URL(link.url).hostname.replace('www.', '');
            return hostname === activeFilter.value;
        } catch (e) {
            return false;
        }
      default:
        return true;
    }
  }), [filteredBySearch, activeFilter]);
  
  const sortedLinks = useMemo(() => {
    const sorted = [...filteredLinks];
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => parseISO(a.createdAt).getTime() - parseISO(b.createdAt).getTime());
        break;
      case 'title-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        break;
    }
    return sorted;
  }, [filteredLinks, sortBy]);

  const groupedAndFilteredLinks = useMemo(() => {
    if (groupBy === 'none' || sortedLinks.length === 0) {
      return [{ groupTitle: null, links: sortedLinks }];
    }

    const groups: { groupTitle: string; links: Link[] }[] = [];
    const groupMap = new Map<string, Link[]>();

    for (const link of sortedLinks) {
      const date = parseISO(link.createdAt);
      let groupKey = '';

      if (groupBy === 'day') {
        if (isToday(date)) groupKey = 'Today';
        else if (isYesterday(date)) groupKey = 'Yesterday';
        else groupKey = format(date, 'MMMM d, yyyy');
      } else if (groupBy === 'month') {
        groupKey = format(date, 'MMMM yyyy');
      } else if (groupBy === 'year') {
        groupKey = format(date, 'yyyy');
      }

      if (groupKey) {
        if (!groupMap.has(groupKey)) {
          const newGroupLinks: Link[] = [];
          groupMap.set(groupKey, newGroupLinks);
          groups.push({ groupTitle: groupKey, links: newGroupLinks });
        }
        groupMap.get(groupKey)!.push(link);
      }
    }
    
    return groups;
  }, [sortedLinks, groupBy]);


  const getHeaderTitle = () => {
    switch (activeFilter.type) {
      case 'all':
        return 'All';
      case 'folder':
        const folder = folders.find(f => f.id === activeFilter.value);
        return folder ? folder.name : 'Folder';
      case 'tag':
        return `#${activeFilter.value}`;
      case 'source':
        return activeFilter.value ? getBrandName(activeFilter.value) : 'Source';
      case 'favorites':
        return 'Favorites';
      case 'graph':
        return 'Graph View';
      case 'notes':
        return 'Notes';
      default:
        return 'All';
    }
  };
  
  if (authLoading || !user) {
    return null; // The loading component will be shown by Next.js
  }

  return (
    <AppLayout>
      <header className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl font-bold">{getHeaderTitle()}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Sheet open={isSheetOpen} onOpenChange={(isOpen) => {
            setIsSheetOpen(isOpen);
            if (!isOpen) setInitialUrl(undefined); // Clear initial URL when sheet is closed
          }}>
            <SheetTrigger asChild>
              <Button disabled={!isFirebaseReady}>
                <Plus className="-ml-1 h-5 w-5" />
                New Link
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="font-headline text-2xl">Add a new link</SheetTitle>
              </SheetHeader>
              <AddLinkForm onSave={handleSaveLink} initialUrl={initialUrl} />
            </SheetContent>
          </Sheet>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8">
        {!isFirebaseReady && (
            <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Firebase Not Configured</AlertTitle>
                <AlertDescription>
                Features like saving and editing links are disabled. Please add your Firebase credentials to the <code>.env</code> file to enable all features.
                </AlertDescription>
            </Alert>
        )}
        {error === 'permission-denied' && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Firestore Permission Denied</AlertTitle>
            <AlertDescription>
              <p>The app can't access your data. This is likely due to Firestore security rules.</p>
              <p className="mt-2">Please go to your <strong>Firebase Console</strong> &gt; <strong>Firestore Database</strong> &gt; <strong>Rules</strong> tab and replace the existing rules with the following:</p>
              <pre className="mt-2 p-2 bg-muted/50 rounded-md text-xs whitespace-pre-wrap font-mono">
                {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{**=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}
              </pre>
            </AlertDescription>
          </Alert>
        )}
        {error && error !== 'permission-denied' && (
           <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Database Error</AlertTitle>
            <AlertDescription>
              An unexpected error occurred while connecting to the database. Please check the console for more details.
            </AlertDescription>
          </Alert>
        )}
        {activeFilter.type === 'graph' ? (
          <GraphView />
        ) : (
          <>
            { (dataLoading && links.length === 0 && !error) ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="aspect-video w-full bg-muted rounded-md animate-pulse"></div>
                        <div className="h-5 w-3/4 bg-muted rounded-md animate-pulse mt-4"></div>
                        <div className="h-4 w-1/2 bg-muted rounded-md animate-pulse"></div>
                      </div>
                    ))}
                  </div>
            ) : groupedAndFilteredLinks.length > 0 && groupedAndFilteredLinks[0].links.length > 0 ? (
              <div className="space-y-8">
                {groupedAndFilteredLinks.map(({ groupTitle, links: groupLinks }) => (
                  <section key={groupTitle || 'all-links'}>
                    {groupTitle && (
                      <h2 className="text-xl font-bold mb-4 px-1">{groupTitle}</h2>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {groupLinks.map((link) => (
                        <LinkCard key={link.id} link={link} onEdit={setLinkToEdit} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              !error &&
              <div className="flex flex-col items-center justify-center text-center py-20">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                   {searchTerm ? <SearchIcon className="w-12 h-12 text-primary" /> : 
                    activeFilter.type === 'favorites' ? <Star className="w-12 h-12 text-primary" /> :
                    activeFilter.type === 'notes' ? <MessageSquare className="w-12 h-12 text-primary" /> :
                    <WifiOff className="w-12 h-12 text-primary" />}
                </div>
                <h2 className="text-2xl font-bold font-headline mb-2">
                  {searchTerm ? 'No links found' : 
                   activeFilter.type === 'favorites' ? 'No favorites yet' :
                   activeFilter.type === 'notes' ? 'No notes yet' :
                   activeFilter.type !== 'all' ? 'No links found' :
                   "It's quiet in here..."}
                </h2>
                <p className="text-muted-foreground max-w-sm">
                  {searchTerm 
                    ? `Your search for "${searchTerm}" did not match any links.` 
                    : activeFilter.type === 'favorites'
                    ? 'Click the star on a link to add it to your favorites.'
                    : activeFilter.type === 'notes'
                    ? 'Links with notes will appear here. Add a description to a link to create a note.'
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
      
      <Dialog open={!!linkToEdit} onOpenChange={(open) => !open && setLinkToEdit(null)}>
        <DialogContent className="sm:max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Link</DialogTitle>
          </DialogHeader>
          <AddLinkForm link={linkToEdit} onSave={handleSaveLink} />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

// This is the main export for the page, which is now just the DashboardPage
export default DashboardPage;
