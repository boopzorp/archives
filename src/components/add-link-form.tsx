"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { getLinkMetadata } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { Link } from '@/lib/types';

const addLinkFormSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL." }),
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().optional(),
  tags: z.string().optional(),
});

type AddLinkFormValues = z.infer<typeof addLinkFormSchema>;

interface AddLinkFormProps {
  onAddLink: (link: Omit<Link, 'id' | 'createdAt'>) => void;
}

export function AddLinkForm({ onAddLink }: AddLinkFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const { toast } = useToast();

  const form = useForm<AddLinkFormValues>({
    resolver: zodResolver(addLinkFormSchema),
    defaultValues: {
      url: "",
      title: "",
      description: "",
      tags: "",
    },
  });

  const handleFetchMetadata = async () => {
    const url = form.getValues("url");
    if (!url) {
      form.setError("url", { type: "manual", message: "URL is required to fetch metadata." });
      return;
    }
    
    setIsLoading(true);
    setImageUrl(undefined);
    const result = await getLinkMetadata(url);
    setIsLoading(false);

    if ('error' in result) {
       toast({
        variant: "destructive",
        title: "Couldn't fetch details",
        description: result.error,
      });
    } else {
      form.setValue("title", result.title, { shouldValidate: true });
      form.setValue("tags", result.tags.join(', '));
      if (result.imageUrl) {
        setImageUrl(result.imageUrl);
      }
       toast({
        title: "Success!",
        description: "We've automagically filled in the details for you.",
      });
    }
  };

  const onSubmit = (data: AddLinkFormValues) => {
    const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
    
    onAddLink({ ...data, tags: tagsArray, imageUrl });
    form.reset();
    setImageUrl(undefined);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link URL</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input placeholder="https://your.link/here" {...field} />
                </FormControl>
                <Button type="button" onClick={handleFetchMetadata} disabled={isLoading} variant="outline" className="shrink-0">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Fetch Details</span>
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. My Awesome Link" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Add a short description (optional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <Input placeholder="e.g. design, inspiration, tech" {...field} />
              </FormControl>
               <p className="text-sm text-muted-foreground">Separate tags with a comma.</p>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
          Save Link
        </Button>
      </form>
    </Form>
  );
}
