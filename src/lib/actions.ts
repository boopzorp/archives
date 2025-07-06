
'use server';

import type { SuggestTagsAndTitleOutput } from '@/lib/types';


export async function getTweetMetadata(url: string): Promise<SuggestTagsAndTitleOutput | { error: string }> {
  const op = 'actions.getTweetMetadata';
  try {
    const fxUrl = url.replace(/x\.com|twitter\.com/, 'api.fxtwitter.com');
    const res = await fetch(fxUrl);
    if (!res.ok) {
      console.error(`${op}: fxtwitter request failed with status ${res.status}`);
      return { error: 'Failed to fetch tweet data.' };
    }
    const data = await res.json();
    if (!data.tweet) {
      return { error: 'Could not find tweet data in the response.' };
    }
    const tweet = data.tweet;

    const title = tweet.text || `Tweet from ${tweet.author.name}`;
    const description = `Tweet from ${tweet.author.name} (@${tweet.author.screen_name})`;
    const imageUrl = tweet.media?.photos?.[0]?.url || tweet.media?.videos?.[0]?.thumbnail_url || tweet.author.avatar_url;

    const output: SuggestTagsAndTitleOutput = {
      title,
      description,
      imageUrl,
      tags: [],
    };

    return output;
  } catch (error) {
    console.error(`${op}:`, error);
    return { error: 'An unexpected error occurred while fetching tweet data.' };
  }
}
