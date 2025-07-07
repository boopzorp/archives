
"use client";

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters.").max(20, "Username must be less than 20 characters."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const defaultAvatars = [
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iI2ZjYTVhNSIvPjwvc3ZnPg==',
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iI2ZkYmE3NCIvPjwvc3ZnPg==',
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iI2ZkZTA0NyIvPjwvc3ZnPg==',
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iI2JlZjI2NCIvPjwvc3ZnPg==',
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iI2E1YjRmYyIvPjwvc3ZnPg==',
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iI2Q4YjRmZSIvPjwvc3ZnPg==',
];

export function ProfileSettingsForm({ onFinished }: { onFinished: () => void }) {
  const { user, username, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
    },
  });

  const { reset } = form;

  useEffect(() => {
    if (user) {
      setPreviewUrl(user.photoURL || null);
    }
    if (username) {
      reset({ username });
    }
  }, [user, username, reset]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDefaultAvatarSelect = (url: string) => {
    setSelectedFile(null);
    setPreviewUrl(url);
  }

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  }

  const onSubmit = (data: ProfileFormValues) => {
    setIsLoading(true);

    // Fire-and-forget the update. We won't await the result from Firebase,
    // which prevents the UI from hanging.
    updateUserProfile({
      displayName: data.username,
      photoFile: selectedFile,
      photoURL: previewUrl,
    }).catch(error => {
      // Log any errors to the console for debugging. The UI will still proceed optimistically.
      console.error("Background profile update failed:", error);
    });
    
    // Per your request, we force the UI to update after a 3-second delay,
    // providing an optimistic and responsive feel.
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Profile Updated",
        description: "Your changes have been submitted.",
      });
      onFinished();
    }, 3000);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label>Profile Picture</Label>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={previewUrl || undefined} alt={username || 'User'} />
            <AvatarFallback className="text-3xl">
              {username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <Button type="button" onClick={() => fileInputRef.current?.click()}>Upload Photo</Button>
            <Input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange} 
            />
            <Button type="button" variant="ghost" onClick={handleRemovePhoto}>Remove</Button>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Choose an avatar</Label>
        <div className="flex flex-wrap gap-2">
          {defaultAvatars.map((avatar, index) => (
            <button key={index} type="button" onClick={() => handleDefaultAvatarSelect(avatar)} className={cn("h-12 w-12 rounded-full border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", { 'border-primary': previewUrl === avatar })}>
              <img src={avatar} alt={`Default avatar ${index + 1}`} className="h-full w-full rounded-full" />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" {...form.register('username')} />
        {form.formState.errors.username && (
          <p className="text-sm font-medium text-destructive">{form.formState.errors.username.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Changes
      </Button>
    </form>
  );
}
