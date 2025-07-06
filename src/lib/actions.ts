
'use server';

import * as cheerio from 'cheerio';
import type { SuggestTagsAndTitleOutput } from '@/lib/types';


export async function getLinkMetadata(url: string): Promise<SuggestTagsAndTitleOutput | { error: string }> {
  if (!url) {
    return { error: 'URL is required.' };
  }

  try {
    let effectiveUrl = url;
    const isTweet = /^(https?:\/\/)(twitter\.com|x\.com)/.test(url);
    
    if (isTweet) {
        const urlObj = new URL(url);
        urlObj.hostname = 'fxtwitter.com';
        effectiveUrl = urlObj.toString();
    }

    const response = await fetch(effectiveUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      return { error: `Failed to fetch the page. Status: ${response.status}` };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const getMetaTag = (name: string) => {
      return (
        $(`meta[property="og:${name}"]`).attr('content') ||
        $(`meta[name="twitter:${name}"]`).attr('content') ||
        $(`meta[name="${name}"]`).attr('content')
      );
    };
    
    let title: string;
    let description: string;
    let imageUrl = getMetaTag('image');

    if (isTweet) {
        const tweetContent = getMetaTag('description');
        const authorInfo = getMetaTag('title');
        const tweetAuthor = authorInfo ? authorInfo.replace(/ on (X|Twitter)$/, '') : '';

        title = tweetContent || tweetAuthor || $('title').text() || '';
        description = tweetContent ? `Tweet from ${tweetAuthor}` : '';
    } else {
        title = getMetaTag('title') || $('title').text() || '';
        description = getMetaTag('description') || '';
    }

    if (imageUrl) {
      try {
        const absoluteUrl = new URL(imageUrl, url);
        imageUrl = absoluteUrl.href;
      } catch (e) {
        // if image url is invalid, just ignore it
        imageUrl = undefined;
      }
    }

    const metadata: SuggestTagsAndTitleOutput = {
      title: title.trim(),
      description: description.trim(),
      imageUrl,
      tags: [],
    };

    return metadata;
  } catch (error: any) {
    console.error('Error fetching link metadata:', error);
    if (error.cause?.code === 'ENOTFOUND') {
      return { error: `Could not find the host for the provided URL.` };
    }
    return { error: 'Could not fetch metadata. Please check the URL and add details manually.' };
  }
}
