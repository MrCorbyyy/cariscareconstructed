import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Mail } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CmsImage } from '@/components/ui/CmsImage';
import { RichText } from '@/components/ui/Typography';
import { SITE_URL } from '@/lib/config';
import { buildMetadata, jsonLd } from '@/lib/seo';
import { getStaffMember } from '@/services/public';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getStaffMember((await params).slug);
  if (!p) return {};
  return buildMetadata({ title: p.name, description: [p.position, 'CARISCA'].filter(Boolean).join(', '), path: `/about/team/${p.slug}`, image: p.photo });
}

export default async function ProfilePage({ params }: Props) {
  const p = await getStaffMember((await params).slug);
  if (!p) notFound();
  const links: Array<[string, string | null | undefined]> = [
    ['LinkedIn', p.linkedin_url],
    ['Google Scholar', p.scholar_url],
    ['ORCID', p.orcid_url],
    ['Website', p.website_url],
  ];
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: p.name,
    ...(p.position ? { jobTitle: p.position } : {}),
    worksFor: { '@type': 'Organization', name: 'CARISCA' },
    url: `${SITE_URL}/about/team/${p.slug}`,
  };
  return (
    <>
      <PageHeader title={p.name} intro={p.position} crumbs={[{ label: 'About', href: '/about' }, { label: 'Meet the Team', href: '/about/team' }, { label: p.name }]} />
      <div className="container-site grid gap-12 py-12 md:py-16 md:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="max-w-72">
            <CmsImage media={p.photo} slot="portrait" alt={p.photo ? `Portrait of ${p.name}` : undefined} rounded priority sizes="288px" />
          </div>
          {p.group && <p className="meta">{p.group.name}</p>}
          {p.department && <p className="text-[0.95rem]">{p.department}</p>}
          {p.email && (
            <a href={`mailto:${p.email}`} className="link inline-flex items-center gap-2 break-all">
              <Mail aria-hidden className="size-4" /> {p.email}
            </a>
          )}
          <ul className="space-y-1.5">
            {links
              .filter(([, url]) => url)
              .map(([label, url]) => (
                <li key={label}>
                  <a href={url!} className="link" target="_blank" rel="noopener noreferrer">
                    {label}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
          </ul>
        </aside>
        <div className="max-w-3xl">
          <RichText html={p.bio} />
          {p.qualifications && (
            <section className="mt-10">
              <h2 className="text-2xl font-bold">Qualifications</h2>
              <p className="mt-3 whitespace-pre-line">{p.qualifications}</p>
            </section>
          )}
          <p className="mt-10">
            <Link href="/about/team" className="link">
              ← Meet the Team
            </Link>
          </p>
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
    </>
  );
}
