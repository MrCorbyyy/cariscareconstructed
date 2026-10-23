import Link from 'next/link';
import { Images } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CmsImage } from '@/components/ui/CmsImage';
import { pageParam } from '@/components/ui/FilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/Typography';
import { formatDate } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';
import { getGalleries } from '@/services/public';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata = buildMetadata({ title: 'Gallery', description: 'Photo galleries from CARISCA events and activities.', path: '/gallery' });

export default async function GalleryIndex({ searchParams }: Props) {
  const page = pageParam((await searchParams).page);
  const list = await getGalleries({ page, pageSize: 12 });
  return (
    <>
      <PageHeader title="Gallery" eyebrow="News & events" crumbs={[{ label: 'Gallery' }]} />
      <div className="container-site py-12 md:py-16">
        {list.data.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.data.map((g) => (
              <article key={g.id} className="group relative overflow-hidden rounded-(--radius-card) border border-line bg-white shadow-(--shadow-card)">
                <CmsImage media={g.coverImage} slot="gallery" sizes="(min-width:1024px) 33vw, 50vw" />
                <div className="p-5">
                  <h2 className="text-lg font-bold">
                    <Link href={`/gallery/${g.slug}`} className="after:absolute after:inset-0 group-hover:text-brand-700">
                      {g.title}
                    </Link>
                  </h2>
                  {g.published_at && <p className="meta mt-1">{formatDate(g.published_at)}</p>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No galleries have been published yet." icon={<Images className="size-6" />}>
            Photo galleries from events will appear here.
          </EmptyState>
        )}
        <Pagination meta={list.meta} basePath="/gallery" />
      </div>
    </>
  );
}
