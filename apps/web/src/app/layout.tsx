import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Instrument_Serif, Plus_Jakarta_Sans } from 'next/font/google';

import { APP_DESCRIPTION, APP_NAME } from '@/config/app';
import { siteUrl } from '@/lib/site-url';
import { THEME_INIT_SCRIPT } from '@/lib/theme';

import './globals.css';

// One typeface across the site and the configurator; mono only for code snippets.
const jakarta = Plus_Jakarta_Sans({ variable: '--font-jakarta', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
// Only for merchants who pick the "Elegant" title font in their configurator.
const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  openGraph: { type: 'website', siteName: APP_NAME, title: APP_NAME, description: APP_DESCRIPTION },
  twitter: { card: 'summary', title: APP_NAME, description: APP_DESCRIPTION },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Lets the demo's bottom sheet extend under the iPhone home indicator (padded via safe-area).
  viewportFit: 'cover',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // data-theme is set by the inline script before hydration, hence suppressHydrationWarning.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jakarta.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
