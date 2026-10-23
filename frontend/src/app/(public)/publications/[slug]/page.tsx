import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { PublicationCard } from '@/components/cards/Cards';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import { CmsImage } from '@/components/ui/CmsImage';
import { FileDownload } from '@/components/ui/FileDownload';
import { RichText } from '@/components/ui/Typography';
import { SITE_URL } from '@/lib/config';
import { PUBLICATION_TYPE_LABELS, formatDate } from '@/lib/format';
import { buildMetadata, jsonLd } from '@/lib/seo';
import { getPublication } from '@/services/public';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getPublication((await params).slug);
  if (!p) return {};
  return buildMetadata({
    title: p.seo_title || p.title,
    description: p.seo_description || p.abstract || `${PUBLICATION_TYPE_LABELS[p.type]} published by CARISCA.`,
    path: `/publications/${p.slug}`,
    image: p.ogImage ?? p.coverImage,
  });
}

export default async function PublicationPage({ params }: Props) {
  const p = await getPublication((await params).slug);
  if (!p) notFound();
  const doiUrl = p.doi ? (p.doi.startsWith('http') ? p.doi : `https://doi.org/${p.doi}`) : null;
  const ld = {
    '@context': 'https://schema.org',
    '@type': p.type === 'journal_article' ? 'ScholarlyArticle' : 'Report',
    name: p.title,
    ...(p.abstract ? { abstract: p.abstract } : {}),
    ...(p.publication_year ? { datePublished: String(p.publication_year) } : {}),
    ...(p.authors ? { author: p.authors.split(/;|,(?![^()]*\))/).map((n) => ({ '@type': 'Person', name: n.trim() })).filter((a) => a.name) } : {}),
    publisher: { '@type': 'Organization', name: 'CARISCA' },
    url: `${SITE_URL}/publications/${p.slug}`,
  };
  const facts: Array<[string, React.ReactNode]> = [
    ['Type', PUBLICATION_TYPE_LABELS[p.type]],
    ...(p.publication_year ? ([['Year', p.publication_year]] as Array<[string, React.ReactNode]>) : []),
    ...(p.published_on ? ([['Published', formatDate(p.published_on)]] as Array<[string, React.ReactNode]>) : []),
    ...(p.venue ? ([['Published in', p.venue]] as Array<[string, React.ReactNode]>) : []),
    ...(doiUrl
      ? ([[
          'DOI',
          <a key="doi" href={doiUrl} className="link break-all" target="_blank" rel="noopener noreferrer">
            {p.doi}
          </a>,
        ]] as Array<[string, React.ReactNode]>)
      : []),
  ];

  return (
    <>
      <PageHeader title={p.title} eyebrow={PUBLICATION_TYPE_LABELS[p.type]} crumbs={[{ label: 'Publications', href: '/publications' }, { label: p.title }]}>
        {p.authors && <p className="mt-4 text-lg text-brand-100">{p.authors}</p>}
      </PageHeader>
      <div className="container-site grid gap-12 py-12 md:py-16 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="space-y-6">
          <div className="max-w-64">
            <CmsImage media={p.coverImage} slot="publicationCover" alt={p.coverImage ? `Cover of ${p.title}` : undefined} sizes="256px" rounded />
          </div>
          <div className="space-y-3">
            {p.file && <FileDownload file={p.file} label="Download" />}
            {p.external_url && (
              <ButtonLink href={p.external_url} variant={p.file ? 'secondary' : 'primary'} className="w-full">
                {p.type === 'journal_article' ? 'Read at the publisher' : 'Open document'}
                <ExternalLink aria-hidden className="size-4" />
              </ButtonLink>
            )}
          </div>
          <dl className="divide-y divide-line rounded-(--radius-card) border border-line text-[0.95rem]">
            {facts.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[6.5rem_1fr] gap-2 px-4 py-2.5">
                <dt className="font-semibold text-ink">{k}</dt>
                <dd className="text-body">{v}</dd>
              </div>
            ))}
          </dl>
        </aside>
        <div className="max-w-3xl">
          {p.abstract ? (
            <section aria-labelledby="abstract-heading">
              <h2 id="abstract-heading" className="text-2xl font-bold">
                {p.type === 'journal_article' ? 'Abstract' : 'Summary'}
              </h2>
              <p className="mt-4 text-lg leading-relaxed whitespace-pre-line">{p.abstract}</p>
            </section>
          ) : (
            !p.body && <p className="text-lg text-muted">A summary for this publication has not been added yet. Use the download or publisher link to read the full document.</p>
          )}
          {p.body && <RichText html={p.body} className="mt-8" />}
          {p.citation && (
            <section aria-labelledby="cite-heading" className="mt-10 rounded-(--radius-card) border border-line bg-surface p-5">
              <h2 id="cite-heading" className="font-display text-lg font-bold">
                How to cite
              </h2>
              <p className="mt-2 font-mono text-sm leading-relaxed break-words">{p.citation}</p>
            </section>
          )}
          {p.researchProject && (
            <p className="mt-8">
              Part of the research project{' '}
              <Link href={`/research/projects/${p.researchProject.slug}`} className="link">
                {p.researchProject.title}
              </Link>
              .
            </p>
          )}
        </div>
      </div>
      {p.related && p.related.length > 0 && (
        <section aria-labelledby="related-pubs" className="border-t border-line bg-surface py-14">
          <div className="container-site">
            <h2 id="related-pubs" className="mb-6 text-2xl font-bold">
              Related publications
            </h2>
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {p.related.map((r) => (
                <PublicationCard key={r.id} publication={r} />
              ))}
            </div>
          </div>
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
    </>
  );
}
