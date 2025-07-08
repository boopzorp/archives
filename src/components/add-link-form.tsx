
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { Link, SuggestTagsAndTitleOutput } from '@/lib/types';
import { getTweetMetadata, getBehanceMetadata, getWsjMetadata, getGenericMetadata } from '@/lib/actions';

const addLinkFormSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL." }),
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().optional(),
  tags: z.string().optional(),
});

export type AddLinkFormValues = z.infer<typeof addLinkFormSchema>;

interface LinkFormProps {
  onSave: (data: AddLinkFormValues & { imageUrl?: string }, linkId?: string) => void;
  link?: Link | null;
  initialUrl?: string;
}

export function AddLinkForm({ onSave, link, initialUrl }: LinkFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const { toast } = useToast();

  const isEditMode = !!link;

  const form = useForm<AddLinkFormValues>({
    resolver: zodResolver(addLinkFormSchema),
    defaultValues: {
      url: link?.url || initialUrl || "",
      title: link?.title || "",
      description: link?.description || "",
      tags: link?.tags?.join(', ') || "",
    },
  });
  
  const handleFetchMetadata = useCallback(async () => {
    const url = form.getValues("url");
    if (!url) {
      form.setError("url", { type: "manual", message: "URL is required to fetch metadata." });
      return;
    }
    
    const parsedUrl = z.string().url().safeParse(url);
    if (!parsedUrl.success) {
      form.setError("url", { type: "manual", message: "Please enter a valid URL." });
      return;
    }

    setIsLoading(true);
    setImageUrl(undefined);
    form.clearErrors("url");
    
    try {
      const isTweet = /https?:\/\/(www\.)?(twitter|x)\.com/.test(url);
      const isBehance = /https?:\/\/(www\.)?behance\.net/.test(url);
      const isWsj = /https?:\/\/(www\.)?wsj\.com/.test(url);

      let result: SuggestTagsAndTitleOutput | { error: string };

      if (isTweet) {
        result = await getTweetMetadata(url);
      } else if (isBehance) {
        result = await getBehanceMetadata(url);
      } else if (isWsj) {
        result = await getWsjMetadata(url);
      } else {
        result = await getGenericMetadata(url);
      }

      if ('error' in result) {
        toast({
          variant: "destructive",
          title: "Couldn't fetch details",
          description: result.error,
        });
        return;
      }
      
      const hasData = result.title || result.description || result.imageUrl || (result.tags && result.tags.length > 0);
      
      form.setValue("title", result.title || '', { shouldValidate: !!result.title });
      form.setValue("description", result.description || '');
      form.setValue("tags", result.tags?.join(', ') || '');
      if (result.imageUrl) {
        setImageUrl(result.imageUrl);
      }

      if (hasData) {
        toast({
          title: "Success!",
          description: "We've filled in the details for you.",
        });
      } else {
         toast({
          variant: "destructive",
          title: "Couldn't fetch details",
          description: "We couldn't find any metadata for this link. Please add the details manually.",
        });
      }
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Couldn't fetch details",
        description: "An error occurred while fetching link details. The site may be protected or temporarily unavailable.",
      });
      console.error("Error fetching link metadata:", error);
    } finally {
      setIsLoading(false);
    }
  }, [form, toast]);


  useEffect(() => {
    form.reset({
      url: link?.url || initialUrl || "",
      title: link?.title || "",
      description: link?.description || "",
      tags: link?.tags?.join(', ') || "",
    });

    if (link) {
      setImageUrl(link.imageUrl);
    } else {
      // If there's an initial URL (from the extension), clear any previous image
      if (initialUrl) {
          setImageUrl(undefined);
      }
    }
  }, [link, initialUrl, form]);

  useEffect(() => {
    // Automatically fetch metadata if the URL is from the extension
    // and the form is not in edit mode.
    if (initialUrl && !link) {
      handleFetchMetadata();
    }
  }, [initialUrl, link, handleFetchMetadata]);


  const onSubmit = (data: AddLinkFormValues) => {
    const dataWithImage = { ...data, imageUrl };
    onSave(dataWithImage, link?.id);
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
                  <Input 
                    placeholder="https://your.link/here" 
                    {...field} 
                    onBlur={(e) => {
                      field.onBlur(e);
                      if (e.target.value && !isEditMode && !initialUrl) {
                        handleFetchMetadata();
                      }
                    }}
                    disabled={isEditMode} 
                  />
                </FormControl>
                <Button type="button" onClick={handleFetchMetadata} disabled={isLoading || isEditMode} variant="outline" className="shrink-0">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Fetch</span>
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
          {isEditMode ? 'Update Link' : 'Save Link'}
        </Button>
      </form>
    </Form>
  );
}
