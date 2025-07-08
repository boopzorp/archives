
"use client";

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/auth-context';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, LogOut, ExternalLink, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getTweetMetadata, getBehanceMetadata, getWsjMetadata, getGenericMetadata } from '@/lib/actions';
import type { Link, SuggestTagsAndTitleOutput } from '@/lib/types';
import { useSearchParams } from 'next/navigation';

function ExtensionPopupContent() {
  const { user, username, loading: authLoading, signOut } = useAuth();
  const { addLink } = useAppContext();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const appOrigin = 'https://arch1ves.vercel.app';

  useEffect(() => {
    // The URL is now passed as a query parameter, so we get it from there.
    const urlFromQuery = searchParams.get('url');
    if (urlFromQuery) {
        try {
            const decodedUrl = decodeURIComponent(urlFromQuery);
            // Quick validation
            new URL(decodedUrl);
            setCurrentUrl(decodedUrl);
        } catch (e) {
            console.error("Invalid URL passed to extension popup:", e);
        }
    }
  }, [searchParams]);

  const handleSave = async () => {
    if (!currentUrl) {
      toast({
        variant: "destructive",
        title: "No URL found",
        description: "Could not get the URL of the current page.",
      });
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const isTweet = /https?:\/\/(www\.)?(twitter|x)\.com/.test(currentUrl);
      const isBehance = /https?:\/\/(www\.)?behance\.net/.test(currentUrl);
      const isWsj = /https?:\/\/(www\.)?wsj\.com/.test(currentUrl);

      let result: SuggestTagsAndTitleOutput | { error: string };

      if (isTweet) result = await getTweetMetadata(currentUrl);
      else if (isBehance) result = await getBehanceMetadata(currentUrl);
      else if (isWsj) result = await getWsjMetadata(currentUrl);
      else result = await getGenericMetadata(currentUrl);
      
      let linkData: Partial<Omit<Link, 'id' | 'createdAt' | 'isFavorite' | 'folderId'>> = {
          url: currentUrl,
          title: "Untitled", // Default title
          tags: [],
      };

      if ('error' in result) {
        console.warn(`Metadata fetch failed: ${result.error}. Saving with URL only.`);
        linkData.title = currentUrl;
      } else {
        linkData.title = result.title || currentUrl;
        linkData.description = result.description;
        linkData.imageUrl = result.imageUrl;
        linkData.tags = result.tags;
      }

      await addLink(linkData as Omit<Link, 'id' | 'createdAt' | 'isFavorite' | 'folderId'>);
      
      setSaveSuccess(true);
      setTimeout(() => {
        window.parent.postMessage({ type: 'CLOSE_POPUP' }, appOrigin);
      }, 1500);

    } catch (error) {
      console.error("Failed to save link:", error);
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: "Could not save the link. Please try again.",
      });
      setIsSaving(false);
    }
  };
  
  const handleOpenApp = () => {
     window.parent.postMessage({ type: 'OPEN_APP' }, appOrigin);
  }
  
  const handleAuthAction = (path: string) => {
     window.parent.postMessage({ type: 'AUTH_ACTION', path }, appOrigin);
  }

  const handleSignOut = async () => {
    await signOut();
    // No need to redirect. The component will re-render with the logged-out view.
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  const saveButtonContent = () => {
    if (saveSuccess) {
      return <>Saved <CheckCircle className="ml-2 h-4 w-4" /></>;
    }
    if (isSaving) {
      return <>Saving... <Loader2 className="ml-2 h-4 w-4 animate-spin" /></>;
    }
    return "Save Current Page";
  };

  return (
    <div className="p-4 text-foreground w-full h-full flex flex-col items-center justify-center">
      {user ? (
        // Logged-in view
        <div className="space-y-4 w-full">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photoURL || undefined} alt={username || ''} />
              <AvatarFallback>{username?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-grow overflow-hidden">
              <p className="font-semibold text-sm truncate">{username}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
             <Button variant="ghost" size="icon" onClick={handleSignOut} title="Log out">
               <LogOut className="h-4 w-4" />
             </Button>
          </div>
          <Button onClick={handleSave} className="w-full" disabled={isSaving || saveSuccess || !currentUrl}>
            {saveButtonContent()}
          </Button>
           <Button variant="outline" onClick={handleOpenApp} className="w-full">
            Open archives <ExternalLink className="ml-2 h-4 w-4" />
           </Button>
        </div>
      ) : (
        // Logged-out view
        <div className="text-center space-y-3">
           <h1 className="text-xl font-bold text-primary tracking-tighter">archives</h1>
           <p className="text-sm text-muted-foreground">Log in to save links from any page.</p>
           <div className="space-y-2 pt-2">
             <Button onClick={() => handleAuthAction('/login')} className="w-full">
                Log In
             </Button>
             <Button variant="secondary" onClick={() => handleAuthAction('/signup')} className="w-full">
                Sign Up
             </Button>
           </div>
        </div>
      )}
    </div>
  );
}

import { Suspense } from 'react';

function Loader() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  )
}

export default function ExtensionPopupPage() {
  return (
    <Suspense fallback={<Loader />}>
      <ExtensionPopupContent />
    </Suspense>
  )
}
