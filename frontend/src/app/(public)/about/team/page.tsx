import Link from 'next/link';
import { StaffCard } from '@/components/cards/Cards';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/Typography';
import { buildMetadata } from '@/lib/seo';
import { getStaff } from '@/services/public';

export const metadata = buildMetadata({
  title: 'Meet the Team',
  description: 'The CARISCA Secretariat, Senior Technical Advisors and Component Leads, and Research Faculty.',
  path: '/about/team',
});

export default async function TeamPage() {
  const groups = (await getStaff()).filter((g) => g.members.length);
  return (
    <>
      <PageHeader
        title="Meet the Team"
        eyebrow="About CARISCA"
        intro="The CARISCA team brings together dedicated researchers, educators, and professionals committed to advancing supply chain excellence across Africa."
        crumbs={[{ label: 'About', href: '/about' }, { label: 'Meet the Team' }]}
      />
      <div className="container-site py-12 md:py-16">
        {groups.length > 1 && (
          <nav aria-label="Team groups" className="mb-10 flex flex-wrap gap-2">
            {groups.map((g) => (
              <Link key={g.id} href={`#${g.slug}`} className="rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-brand-800 hover:border-brand-300 hover:bg-brand-50">
                {g.name}
              </Link>
            ))}
          </nav>
        )}
        {groups.length === 0 && <EmptyState title="Team profiles are being updated." />}
        {groups.map((g) => (
          <section key={g.id} id={g.slug} aria-labelledby={`${g.slug}-heading`} className="mb-16 scroll-mt-28 last:mb-0">
            <h2 id={`${g.slug}-heading`} className="text-[1.75rem] font-bold">
              {g.name}
            </h2>
            {g.description && <p className="mt-2 max-w-3xl text-lg text-muted">{g.description}</p>}
            <ul className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {g.members.map((m) => (
                <li key={m.id} className="flex">
                  <StaffCard person={m} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
