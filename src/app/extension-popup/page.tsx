
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, LogOut, ExternalLink, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Link } from '@/lib/types';
import { AddLinkForm, AddLinkFormValues } from '@/components/add-link-form';

function ExtensionPopupContent() {
  const { user, username, loading: authLoading, signOut } = useAuth();
  const { addLink } = useAppContext();
  const { toast } = useToast();

  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [view, setView] = useState<'main' | 'addForm'>('main');
  const [isSaving, setIsSaving] = useState(false);
  
  const appOrigin = 'https://arch1ves.vercel.app';

  useEffect(() => {
    // 1. Signal to the parent window that the UI is ready to receive data
    window.parent.postMessage({ type: 'POPUP_UI_READY' }, appOrigin);

    const handleMessage = (event: MessageEvent) => {
      // IMPORTANT: Always verify the origin
      if (event.origin !== appOrigin) {
        return;
      }

      const { type, url } = event.data;

      if (type === 'CURRENT_TAB_INFO') {
        try {
          // Quick validation for non-null URLs
          if (url) new URL(url);
          setCurrentUrl(url);
        } catch (e) {
          console.error("Invalid URL passed to extension popup:", e);
          setCurrentUrl(null);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []); // Empty dependency array means this runs once on mount


  const handleSaveLink = async (formDataWithImage: AddLinkFormValues & { imageUrl?: string }) => {
    setIsSaving(true);
    try {
      const { imageUrl, ...formData } = formDataWithImage;
      const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      
      const linkData: Partial<Link> = { ...formData, tags: tagsArray, imageUrl };
      
      // Firestore does not support `undefined`.
      Object.keys(linkData).forEach(key => {
        if ((linkData as any)[key] === undefined) {
          delete (linkData as any)[key];
        }
      });
      
      await addLink(linkData as Omit<Link, 'id' | 'createdAt' | 'isFavorite' | 'folderId'>);
      
      toast({
        title: "Link Saved!",
        description: "Your link has been added to archives.",
      });

      setTimeout(() => {
        window.parent.postMessage({ type: 'CLOSE_POPUP' }, appOrigin);
      }, 1000);

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
    setView('main');
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  if (user) {
    // Logged-in view
    if (view === 'addForm') {
      return (
        <div className="p-4 w-full h-full overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView('main')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">Save Link</h2>
          </div>
          <AddLinkForm onSave={handleSaveLink} initialUrl={currentUrl!} />
        </div>
      )
    }

    return (
      <div className="p-4 text-foreground w-full h-full flex flex-col items-center justify-center">
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
          <Button onClick={() => setView('addForm')} className="w-full" disabled={!currentUrl}>
            { currentUrl ? 'Save Current Page' : 'Getting page URL...' }
          </Button>
           <Button variant="outline" onClick={handleOpenApp} className="w-full">
            Open archives <ExternalLink className="ml-2 h-4 w-4" />
           </Button>
        </div>
      </div>
    );
  }

  // Logged-out view
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center space-y-3 p-4">
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
    </div>
  );
}

export default function ExtensionPopupPage() {
    return <ExtensionPopupContent />;
}
