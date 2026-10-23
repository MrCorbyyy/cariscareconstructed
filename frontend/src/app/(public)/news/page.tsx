import { Newspaper } from 'lucide-react';
import { ArticleCard } from '@/components/cards/Cards';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar, ResultCount, firstParam, pageParam } from '@/components/ui/FilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/Typography';
import { ARTICLE_TYPE_LABELS } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';
import { getArticles, getCategories } from '@/services/public';
import type { ArticleType } from '@/types/api';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'news,press_release', label: 'News & press releases' },
  { value: 'announcement,call', label: 'Announcements & calls' },
  ...(['research_highlight', 'project_update', 'story', 'newsletter_announcement'] as ArticleType[]).map((t) => ({
    value: t,
    label: ARTICLE_TYPE_LABELS[t],
  })),
];

export async function generateMetadata({ searchParams }: Props) {
  const sp = await searchParams;
  const isAnnouncements = firstParam(sp.type) === 'announcement,call';
  return buildMetadata({
    title: isAnnouncements ? 'Announcements & Calls' : 'News & Press Releases',
    description: 'News, press releases, announcements and calls for applications from CARISCA.',
    path: '/news',
  });
}

export default async function NewsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = pageParam(sp.page);
  const type = firstParam(sp.type);
  const category = firstParam(sp.category);
  const q = firstParam(sp.q)?.slice(0, 200);
  const year = Number(firstParam(sp.year)) || undefined;
  const [list, categories] = await Promise.all([getArticles({ page, pageSize: 12, type, category, q, year }), getCategories()]);
  const now = new Date().getUTCFullYear();
  const years = Array.from({ length: now - 2019 }, (_, i) => String(now - i));
  const heading = type === 'announcement,call' ? 'Announcements & Calls' : 'News & Press Releases';

  return (
    <>
      <PageHeader
        title={heading}
        eyebrow="News & events"
        intro="Stories, press releases, announcements and calls for applications from CARISCA."
        crumbs={[{ label: heading }]}
      />
      <div className="container-site py-12 md:py-16">
        <FilterBar
          action="/news"
          q={q}
          searchLabel="Search news"
          selects={[
            { name: 'type', label: 'Type', value: type, options: TYPE_OPTIONS, allLabel: 'All types' },
            { name: 'category', label: 'Topic', value: category, options: categories.map((c) => ({ value: c.slug, label: c.name })), allLabel: 'All topics' },
            { name: 'year', label: 'Year', value: year ? String(year) : undefined, options: years.map((y) => ({ value: y, label: y })), allLabel: 'Any year' },
          ]}
        />
        <ResultCount {...list.meta} noun="stories" />
        {list.data.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.data.map((a) => (
              <ArticleCard key={a.id} article={a} headingLevel="h2" />
            ))}
          </div>
        ) : (
          <EmptyState title="No stories match your filters." icon={<Newspaper className="size-6" />}>
            Try different keywords or clear the filters.
          </EmptyState>
        )}
        <Pagination meta={list.meta} basePath="/news" params={{ type, category, q, year: year ? String(year) : undefined }} />
      </div>
    </>
  );
}
