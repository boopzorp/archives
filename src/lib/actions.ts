
'use server';

import type { SuggestTagsAndTitleOutput } from '@/lib/types';


export async function getLinkMetadata(url: string): Promise<SuggestTagsAndTitleOutput | { error: string }> {
  // This function is no longer used for metadata fetching, 
  // as it has been replaced by the more robust AI-driven suggestTagsAndTitle flow.
  // It is kept here to prevent breaking any potential imports, but it will not be called
  // by the add-link-form.
  console.warn("getLinkMetadata is deprecated and should not be used.");
  return { error: 'This function is deprecated.' };
}
