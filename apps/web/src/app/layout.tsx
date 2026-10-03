import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';

import { APP_DESCRIPTION, APP_NAME } from '@/config/app';

import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
// Display face for product names and headlines; Geist stays the UI face.
const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_DESCRIPTION,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Lets the demo's bottom sheet extend under the iPhone home indicator (padded via safe-area).
  viewportFit: 'cover',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
