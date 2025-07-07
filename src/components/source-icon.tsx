'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SourceIconProps {
  hostname: string;
}

export function SourceIcon({ hostname }: SourceIconProps) {
  const [error, setError] = useState(false);

  // Using Google's favicon service is a reliable way to get favicons.
  // sz=32 provides a decent resolution for small icons.
  const faviconUrl = `https://www.google.com/s2/favicons?sz=32&domain_url=${hostname}`;

  // If there's an error loading the favicon (e.g., it doesn't exist),
  // fall back to the generic Globe icon.
  if (error) {
    return <Globe />;
  }

  return (
    <Image
      src={faviconUrl}
      alt={`${hostname} favicon`}
      width={16} // Intrinsic size, can be overridden by CSS
      height={16} // Intrinsic size, can be overridden by CSS
      className={cn(
        "rounded-sm",
        // GitHub's favicon has a white background which looks bad in dark mode.
        // Inverting it fixes the issue for dark mode.
        hostname.includes('github.com') && 'dark:invert'
      )}
      onError={() => setError(true)}
      unoptimized // Necessary for dynamically sourced external images
    />
  );
}
