import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { CmsImage } from '@/components/ui/CmsImage';
import { buildMetadata } from '@/lib/seo';
import { getGallery } from '@/services/public';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = await getGallery((await params).slug);
  if (!g) return {};
  return buildMetadata({ title: g.title, description: g.description, path: `/gallery/${g.slug}`, image: g.coverImage });
}

export default async function GalleryPage({ params }: Props) {
  const g = await getGallery((await params).slug);
  if (!g) notFound();
  const items = (g.items ?? []).filter((i) => i.media);
  return (
    <>
      <PageHeader title={g.title} intro={g.description} crumbs={[{ label: 'Gallery', href: '/gallery' }, { label: g.title }]} />
      <div className="container-site py-12 md:py-16">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <figure>
                <a href={item.media!.url} target="_blank" rel="noopener noreferrer" className="block focus-visible:ring-3 focus-visible:ring-sky-accent">
                  <CmsImage media={item.media} slot="gallery" rounded sizes="(min-width:1024px) 33vw, 50vw" />
                  <span className="sr-only">Open full-size image in a new tab</span>
                </a>
                {(item.caption || item.media!.caption) && <figcaption className="meta mt-2">{item.caption || item.media!.caption}</figcaption>}
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
