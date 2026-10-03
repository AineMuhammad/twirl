/**
 * The site's public base URL (no trailing slash), for metadata, sitemaps and links outside a
 * request: NEXT_PUBLIC_APP_URL, else Vercel's production domain, else localhost.
 */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/+$/, '');
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return 'http://localhost:3000';
}
