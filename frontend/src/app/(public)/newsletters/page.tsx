import { Mail } from 'lucide-react';
import { NewsletterCard } from '@/components/cards/Cards';
import { NewsletterForm } from '@/components/forms/NewsletterForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { pageParam } from '@/components/ui/FilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/Typography';
import { buildMetadata } from '@/lib/seo';
import { getNewsletters } from '@/services/public';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata = buildMetadata({ title: 'CARISCA Newsletter', description: 'Archive of the CARISCA newsletter.', path: '/newsletters' });

export default async function NewslettersPage({ searchParams }: Props) {
  const page = pageParam((await searchParams).page);
  const list = await getNewsletters({ page, pageSize: 12 });
  return (
    <>
      <PageHeader title="CARISCA Newsletter" eyebrow="News & events" intro="Every issue of the CARISCA newsletter, with highlights and downloads." crumbs={[{ label: 'News', href: '/news' }, { label: 'Newsletter' }]} />
      <div className="container-site grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          {list.data.length ? (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
              {list.data.map((n) => (
                <NewsletterCard key={n.id} issue={n} />
              ))}
            </div>
          ) : (
            <EmptyState title="No newsletter issues have been published yet." icon={<Mail className="size-6" />} />
          )}
          <Pagination meta={list.meta} basePath="/newsletters" />
        </div>
        <aside>
          <div className="rounded-(--radius-card) border border-line bg-surface p-6 lg:sticky lg:top-6">
            <h2 className="text-xl font-bold">Get the next issue</h2>
            <p className="mt-2 mb-5 text-muted">Subscribe to receive the CARISCA newsletter by email.</p>
            <NewsletterForm variant="light" source="newsletter-page" />
          </div>
        </aside>
      </div>
    </>
  );
}
