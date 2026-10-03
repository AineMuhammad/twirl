import type { MetadataRoute } from 'next';

import { siteUrl } from '@/lib/site-url';

/** Public marketing pages are indexable; app, embeds, share links and APIs are not. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/admin', '/embed/', '/c/', '/api/', '/signin'],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
