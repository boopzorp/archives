
'use server';

import type { SuggestTagsAndTitleOutput } from '@/lib/types';
import * as cheerio from 'cheerio';


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

export async function getBehanceMetadata(url: string): Promise<SuggestTagsAndTitleOutput | { error: string }> {
  const op = 'actions.getBehanceMetadata';
  try {
    const match = url.match(/\/gallery\/\d+\/([^\/?]+)/);
    let title = '';
    if (match && match[1]) {
      title = match[1]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    if (!title) {
        return { error: "Could not determine title from Behance URL." };
    }

    const output: SuggestTagsAndTitleOutput = {
      title,
      description: '',
      imageUrl: undefined,
      tags: [],
    };
    
    return output;
  } catch (error) {
    console.error(`${op}:`, error);
    return { error: 'An unexpected error occurred while processing Behance link.' };
  }
}

export async function getWsjMetadata(url: string): Promise<SuggestTagsAndTitleOutput | { error: string }> {
  const op = 'actions.getWsjMetadata';

  const getTitleFromUrl = (urlString: string): string => {
    try {
      const urlObj = new URL(urlString);
      const pathParts = urlObj.pathname.split('/');
      const slug = pathParts.filter(part => part).pop();
      if (slug) {
        const cleanedSlug = slug.replace(/-\d{2}-\d{2}-\d{4}$/, '');
        return cleanedSlug
          .split('-')
          .map(word => /^[a-zA-Z]+$/.test(word) ? word.charAt(0).toUpperCase() + word.slice(1) : word.toUpperCase())
          .join(' ');
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
    return '';
  };

  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36' } });
    
    if (!res.ok) {
      const title = getTitleFromUrl(url);
      if (title) {
        return {
          title,
          description: 'From The Wall Street Journal',
          tags: ['wsj', 'news', 'finance'],
        };
      }
      return { error: 'Failed to fetch WSJ link data.' };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const title = $('meta[property="og:title"]').attr('content') || $('h1').first().text() || getTitleFromUrl(url);
    const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
    
    if (!title) {
        return { error: "Could not determine title from WSJ URL." };
    }
    
    const output: SuggestTagsAndTitleOutput = {
      title,
      description: description || 'From The Wall Street Journal',
      tags: ['wsj', 'news', 'finance'],
    };
    
    return output;

  } catch (error) {
    console.error(`${op}:`, error);
    const title = getTitleFromUrl(url);
    if (title) {
        return {
          title,
          description: 'From The Wall Street Journal',
          tags: ['wsj', 'news', 'finance'],
        };
    }
    return { error: 'An unexpected error occurred while processing WSJ link.' };
  }
}


export async function getGenericMetadata(url: string): Promise<SuggestTagsAndTitleOutput | { error: string }> {
  const op = 'actions.getGenericMetadata';
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36' } });
    if (!res.ok) {
      console.error(`${op}: fetch failed with status ${res.status}`);
      return { error: 'Failed to fetch link data. The site may be blocking requests.' };
    }
    const html = await res.text();
    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('title').text() ||
      '';

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      '';

    let imageUrl = 
      $('meta[property="og:image"]').attr('content') ||
      $('meta[property="og:image:url"]').attr('content') ||
      '';

    if (imageUrl && !imageUrl.startsWith('http')) {
      const urlObj = new URL(url);
      imageUrl = new URL(imageUrl, urlObj.origin).href;
    }

    const output: SuggestTagsAndTitleOutput = {
      title,
      description,
      imageUrl,
      tags: [],
    };

    if (!output.title && !output.description && !output.imageUrl) {
      return { error: "Could not find any metadata for this link. Please add details manually." };
    }

    return output;
  } catch (error) {
    console.error(`${op}:`, error);
    return { error: 'An unexpected error occurred while fetching link data.' };
  }
}
