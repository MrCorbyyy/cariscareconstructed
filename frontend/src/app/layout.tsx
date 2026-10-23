import type { Metadata, Viewport } from 'next';
import { Barlow, Noto_Sans } from 'next/font/google';
import { SITE_URL } from '@/lib/config';
import '@/styles/globals.css';

const heading = Barlow({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-heading', display: 'swap' });
const body = Noto_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'CARISCA – Centre for Applied Research and Innovation in Supply Chain – Africa',
    template: '%s | CARISCA',
  },
  description:
    'CARISCA at KNUST trains, generates and translates supply chain management research and innovation into development outcomes for Ghana and across Africa.',
  applicationName: 'CARISCA',
  openGraph: { siteName: 'CARISCA', locale: 'en_GH', type: 'website', images: ['/images/og-default.png'] },
  icons: { icon: '/favicon.png' },
};

export const viewport: Viewport = {
  themeColor: '#0a2961',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${heading.variable} ${body.variable}`}>
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
