import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { SITE_URL } from '@/lib/config';
import { jsonLd } from '@/lib/seo';
import type { Media } from '@/types/api';
import { CmsImage } from '../ui/CmsImage';

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ label: 'Home', href: '/' }, ...items];
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, ...(c.href ? { item: `${SITE_URL}${c.href}` } : {}) })),
  };
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-brand-100">
        {all.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <ChevronRight aria-hidden className="size-3.5 opacity-70" />}
            {c.href && i < all.length - 1 ? (
              <Link href={c.href} className="hover:text-white hover:underline">
                {c.label}
              </Link>
            ) : (
              <span aria-current={i === all.length - 1 ? 'page' : undefined} className="text-white">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
    </nav>
  );
}

/**
 * Page title band used by every inner page. A banner image is optional; the navy band keeps
 * pages consistent when no approved photography exists.
 */
export function PageHeader({
  title,
  intro,
  crumbs,
  eyebrow,
  image,
  children,
}: {
  title: string;
  intro?: ReactNode;
  crumbs: Crumb[];
  eyebrow?: string;
  image?: Media | null;
  children?: ReactNode;
}) {
  return (
    <header className="relative isolate overflow-hidden bg-brand-900 text-white">
      {image?.url && (
        <div className="absolute inset-0 -z-10 opacity-25" aria-hidden>
          <CmsImage media={image} slot="pageBanner" alt="" fill priority sizes="100vw" />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1 bg-linear-to-r from-sky-accent via-brand-500 to-gold" aria-hidden />
      <div className="container-site py-10 md:py-14">
        <Breadcrumbs items={crumbs} />
        {eyebrow && <p className="mt-6 font-display text-sm font-semibold tracking-[0.14em] text-sky-accent uppercase">{eyebrow}</p>}
        <h1 className={`${eyebrow ? 'mt-2' : 'mt-6'} max-w-4xl text-[2rem] leading-[1.15] font-bold text-white md:text-[2.75rem]`}>{title}</h1>
        {intro && <div className="mt-4 max-w-3xl text-lg text-brand-100 md:text-xl">{intro}</div>}
        {children}
      </div>
    </header>
  );
}
