
"use client";

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, LogOut, ExternalLink } from 'lucide-react';

export default function ExtensionPopupPage() {
  const { user, username, loading: authLoading, signOut } = useAuth();

  const handleSave = () => {
    // Send a message to the parent window (the extension's popup.js)
    window.parent.postMessage({ type: 'SAVE_PAGE' }, '*'); 
  };
  
  const handleOpenApp = () => {
     window.parent.postMessage({ type: 'OPEN_APP' }, '*');
  }
  
  const handleAuthAction = (path: string) => {
     window.parent.postMessage({ type: 'AUTH_ACTION', path }, '*');
  }

  const handleSignOut = async () => {
    await signOut();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

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
          <Button onClick={handleSave} className="w-full">
            Save Current Page
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
