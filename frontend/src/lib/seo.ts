import type { Metadata } from 'next';
import type { Media, SiteSettings } from '@/types/api';
import { SITE_URL } from './config';

export function buildMetadata(opts: {
  title: string;
  description?: string | null;
  path: string;
  image?: Media | null;
  type?: 'website' | 'article';
  publishedTime?: string | null;
  noindex?: boolean;
}): Metadata {
  const url = `${SITE_URL}${opts.path}`;
  const description = opts.description ? opts.description.slice(0, 300) : undefined;
  const images = opts.image?.url
    ? [
        {
          url: opts.image.url,
          width: opts.image.width ?? undefined,
          height: opts.image.height ?? undefined,
          alt: opts.image.alt_text ?? opts.title,
        },
      ]
    : undefined;
  return {
    title: opts.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description,
      url,
      type: opts.type ?? 'website',
      siteName: 'CARISCA',
      locale: 'en_GH',
      ...(images ? { images } : {}),
      ...(opts.publishedTime ? { publishedTime: opts.publishedTime } : {}),
    },
    twitter: { card: images ? 'summary_large_image' : 'summary', title: opts.title, description },
    ...(opts.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** schema.org description of CARISCA for the site-wide JSON-LD block. */
export function organizationJsonLd(settings: SiteSettings) {
  const sameAs = ['social_facebook', 'social_linkedin', 'social_x', 'social_youtube']
    .map((k) => settings[k])
    .filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'ResearchOrganization',
    name: settings.site_full_name ?? 'Centre for Applied Research and Innovation in Supply Chain – Africa',
    alternateName: settings.site_name ?? 'CARISCA',
    url: SITE_URL,
    logo: `${SITE_URL}/brand/carisca-lockup.jpg`,
    email: settings.contact_email ?? undefined,
    telephone: settings.contact_phone_link ?? undefined,
    parentOrganization: {
      '@type': 'CollegeOrUniversity',
      name: 'Kwame Nkrumah University of Science and Technology',
      url: 'https://www.knust.edu.gh/',
    },
    address: { '@type': 'PostalAddress', addressLocality: 'Kumasi', addressCountry: 'GH' },
    sameAs,
  };
}

/** Serialises JSON-LD safely for a <script> tag. */
export const jsonLd = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, '\\u003c') });
