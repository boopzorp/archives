import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBrandName(urlOrHost: string): string {
  let hostname = urlOrHost;

  try {
    // Try to parse as a URL first
    hostname = new URL(urlOrHost).hostname;
  } catch (e) {
    // If it fails, assume it's already a hostname
  }

  hostname = hostname.replace('www.', '');

  const specialCases: { [key: string]: string } = {
    'x.com': 'X',
    'newyorker.com': 'The New Yorker',
    'github.com': 'GitHub',
    'youtube.com': 'YouTube',
    'youtu.be': 'YouTube',
    'vimeo.com': 'Vimeo',
    'behance.net': 'Behance',
    'dribbble.com': 'Dribbble',
    'medium.com': 'Medium',
    'substack.com': 'Substack',
    'figma.com': 'Figma',
    'producthunt.com': 'Product Hunt',
    'techcrunch.com': 'TechCrunch',
    'theverge.com': 'The Verge',
    'nytimes.com': 'The New York Times',
    'wsj.com': 'The Wall Street Journal',
  };

  for (const key in specialCases) {
    if (hostname.endsWith(key)) {
      return specialCases[key];
    }
  }

  const domainParts = hostname.split('.');
  if (domainParts.length > 1) {
      const mainPart = domainParts[0];
      return mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
  }

  return urlOrHost; // Fallback to original string
}
