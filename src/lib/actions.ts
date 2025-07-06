
'use server';

import { suggestTagsAndTitle, SuggestTagsAndTitleOutput } from '@/ai/flows/suggest-tags-and-title';

export async function getLinkMetadata(url: string): Promise<SuggestTagsAndTitleOutput | { error: string }> {
  if (!url) {
    return { error: 'URL is required.' };
  }

  try {
    // Basic URL validation
    new URL(url);
  } catch (_) {
    return { error: 'Invalid URL provided.' };
  }
  
  try {
    const metadata = await suggestTagsAndTitle({ url });
    return metadata;
  } catch (error) {
    console.error('Error fetching link metadata:', error);
    return { error: 'Could not fetch metadata for the provided URL. Please check the link or try again later.' };
  }
}
