
'use server';

import * as cheerio from 'cheerio';
import type { SuggestTagsAndTitleOutput } from '@/lib/types';


export async function getLinkMetadata(url: string): Promise<SuggestTagsAndTitleOutput | { error: string }> {
  if (!url) {
    return { error: 'URL is required.' };
  }

  try {
    const response = await fetch(url, {
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

    const title = getMetaTag('title') || $('title').text() || '';
    const description = getMetaTag('description') || '';
    let imageUrl = getMetaTag('image');

    if (imageUrl) {
      try {
        const absoluteUrl = new URL(imageUrl, url);
        imageUrl = absoluteUrl.href;
      } catch (e) {
        imageUrl = undefined;
      }
    }

    const metadata: SuggestTagsAndTitleOutput = {
      title: title.trim(),
      description: description.trim(),
      imageUrl,
      tags: [], // Tags are no longer auto-generated
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
