
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

    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' } });
    if (!res.ok) {
      console.error(`${op}: fetch failed with status ${res.status}`);
      return { error: 'Failed to fetch Behance project data.' };
    }
    const html = await res.text();
    const $ = cheerio.load(html);

    if (!title) {
        title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    }

    let imageUrl = '';
    
    // Method 1: Parse embedded JSON data store
    const scriptDataNode = $('#beconfig-store-state');
    if (scriptDataNode.length > 0) {
      const scriptDataText = scriptDataNode.text();
      if (scriptDataText) {
        try {
          const pageData = JSON.parse(scriptDataText);
          const projectData = pageData?.preloaded?.project?.data?.project;
          if (projectData && projectData.covers) {
              const covers = projectData.covers;
              imageUrl = covers['max_808'] || covers['808'] || covers.original || covers['404'] || covers['202'] || Object.values(covers)[0] as string || '';
          }
        } catch (e) {
          console.error(`${op}: Failed to parse Behance JSON data`, e);
        }
      }
    }
    
    // Method 2 (Fallback): Look for Open Graph meta tags
    if (!imageUrl) {
        imageUrl = $('meta[property="og:image"]').attr('content') ||
                   $('meta[property="og:image:url"]').attr('content') || '';
    }
    
    // Method 3 (Fallback): Find a plausible project image via common selectors
    if (!imageUrl) {
      const mainImage = $('#project-cover-image img, .project-cover__image, .cover-244L-image-244L').first();
      if (mainImage.length > 0) {
        imageUrl = mainImage.attr('src') || '';
      }
    }
    
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = new URL(imageUrl, url).href;
    }

    const output: SuggestTagsAndTitleOutput = {
      title,
      description: '', // As requested, no description.
      imageUrl,
      tags: [],
    };
    
    if (!output.title && !output.imageUrl) {
        return { error: "Could not find a title or image for this Behance project." };
    }

    return output;
  } catch (error) {
    console.error(`${op}:`, error);
    return { error: 'An unexpected error occurred while fetching Behance project data.' };
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
