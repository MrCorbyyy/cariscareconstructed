import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleCard } from '@/components/cards/Cards';
import { PageHeader } from '@/components/layout/PageHeader';
import { CmsImage } from '@/components/ui/CmsImage';
import { FileDownload } from '@/components/ui/FileDownload';
import { Badge, RichText } from '@/components/ui/Typography';
import { SITE_URL } from '@/lib/config';
import { ARTICLE_TYPE_LABELS, formatDate } from '@/lib/format';
import { buildMetadata, jsonLd } from '@/lib/seo';
import { getArticle } from '@/services/public';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await getArticle((await params).slug);
  if (!a) return {};
  return buildMetadata({
    title: a.seo_title || a.title,
    description: a.seo_description || a.excerpt,
    path: `/news/${a.slug}`,
    image: a.ogImage ?? a.featuredImage,
    type: 'article',
    publishedTime: a.published_at,
  });
}

export default async function ArticlePage({ params }: Props) {
  const a = await getArticle((await params).slug);
  if (!a) notFound();
  const ld = {
    '@context': 'https://schema.org',
    '@type': a.type === 'press_release' ? 'NewsArticle' : 'Article',
    headline: a.title.slice(0, 110),
    datePublished: a.published_at,
    dateModified: a.updated_at,
    ...(a.featuredImage ? { image: [a.featuredImage.url] } : {}),
    author: a.author_name ? { '@type': 'Person', name: a.author_name } : { '@type': 'Organization', name: 'CARISCA' },
    publisher: { '@type': 'Organization', name: 'CARISCA', logo: { '@type': 'ImageObject', url: `${SITE_URL}/brand/carisca-lockup.jpg` } },
    mainEntityOfPage: `${SITE_URL}/news/${a.slug}`,
  };

  return (
    <>
      <PageHeader title={a.title} eyebrow={ARTICLE_TYPE_LABELS[a.type]} crumbs={[{ label: 'News', href: '/news' }, { label: a.title }]}>
        <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-brand-100">
          <time dateTime={a.published_at}>{formatDate(a.published_at)}</time>
          {a.author_name && <span>By {a.author_name}</span>}
        </p>
      </PageHeader>

      <article className="container-site grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="max-w-3xl">
          {a.featuredImage && (
            <figure className="mb-8">
              <CmsImage media={a.featuredImage} slot="articleFeature" sizes="(min-width:1024px) 48rem, 100vw" priority rounded />
              {a.featuredImage.caption && <figcaption className="meta mt-2">{a.featuredImage.caption}</figcaption>}
            </figure>
          )}
          {a.deadline_at && (
            <p className="mb-6 rounded-(--radius-card) border-l-4 border-danger bg-[#fdf0ee] px-4 py-3 font-semibold text-danger">
              Application deadline: {formatDate(a.deadline_at)}
            </p>
          )}
          <RichText html={a.body} />
          {a.attachment && (
            <div className="mt-8">
              <FileDownload file={a.attachment} />
            </div>
          )}
        </div>
        <aside className="space-y-6">
          {a.categories && a.categories.length > 0 && (
            <div>
              <h2 className="font-display text-sm font-bold tracking-[0.12em] text-muted uppercase">Topics</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {a.categories.map((c) => (
                  <li key={c.id}>
                    <Link href={`/news?category=${c.slug}`} aria-label={`More stories about ${c.name}`}>
                      <Badge>{c.name}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link href="/news" className="link inline-block">
            ← All news
          </Link>
        </aside>
      </article>

      {a.related.length > 0 && (
        <section aria-labelledby="related-heading" className="border-t border-line bg-surface py-14">
          <div className="container-site">
            <h2 id="related-heading" className="mb-6 text-2xl font-bold">
              Related stories
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {a.related.map((r) => (
                <ArticleCard key={r.id} article={r} />
              ))}
            </div>
          </div>
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
    </>
  );
}
