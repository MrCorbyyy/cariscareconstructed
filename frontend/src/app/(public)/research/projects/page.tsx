import { FlaskConical } from 'lucide-react';
import { ProjectCard } from '@/components/cards/Cards';
import { PageHeader } from '@/components/layout/PageHeader';
import { ResultCount, firstParam, pageParam } from '@/components/ui/FilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/Typography';
import { buildMetadata } from '@/lib/seo';
import { getResearchProjects, getResearchThemes } from '@/services/public';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata = buildMetadata({
  title: 'Research Projects',
  description: 'Research projects led and supported by CARISCA, including the Africa Supply Network Research Accelerator.',
  path: '/research/projects',
});

export default async function ProjectsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = pageParam(sp.page);
  const theme = firstParam(sp.theme);
  const status = firstParam(sp.status);
  const [list, themes] = await Promise.all([getResearchProjects({ page, pageSize: 12, theme, status }), getResearchThemes()]);
  return (
    <>
      <PageHeader title="Research Projects" eyebrow="Research" crumbs={[{ label: 'Research', href: '/research' }, { label: 'Projects' }]} />
      <div className="container-site py-12 md:py-16">
        <form action="/research/projects" className="mb-8 flex flex-wrap items-end gap-3 rounded-(--radius-card) border border-line bg-surface p-4">
          <div>
            <label htmlFor="theme" className="mb-1 block text-sm font-semibold text-ink">
              Theme
            </label>
            <select id="theme" name="theme" defaultValue={theme ?? ''} className="h-11 rounded-(--radius-card) border border-line bg-white px-3">
              <option value="">All themes</option>
              {themes.map((t) => (
                <option key={t.id} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-semibold text-ink">
              Status
            </label>
            <select id="status" name="status" defaultValue={status ?? ''} className="h-11 rounded-(--radius-card) border border-line bg-white px-3">
              <option value="">Any status</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="planned">Planned</option>
            </select>
          </div>
          <button type="submit" className="h-11 rounded-(--radius-card) bg-brand-700 px-5 font-display font-semibold text-white hover:bg-brand-800">
            Apply
          </button>
        </form>
        <ResultCount {...list.meta} noun="projects" />
        {list.data.length ? (
          <div className="grid gap-5 md:grid-cols-2">
            {list.data.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        ) : (
          <EmptyState title="No projects match these filters." icon={<FlaskConical className="size-6" />} />
        )}
        <Pagination meta={list.meta} basePath="/research/projects" params={{ theme, status }} />
      </div>
    </>
  );
}
