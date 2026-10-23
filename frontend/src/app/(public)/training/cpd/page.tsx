import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import { CmsImage } from '@/components/ui/CmsImage';
import { Badge, EmptyState, SectionHeading } from '@/components/ui/Typography';
import { DELIVERY_LABELS, formatDateRange } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';
import { getCpdProgrammes, getSite } from '@/services/public';
import type { CpdProgramme } from '@/types/api';

export const metadata = buildMetadata({
  title: 'CARISCA CPDs',
  description: 'Continuing professional development and executive education in supply chain management from CARISCA.',
  path: '/training/cpd',
});

function ProgrammeRow({ p, upcoming }: { p: CpdProgramme; upcoming: boolean }) {
  const next = [...p.sessions].filter((s) => new Date(s.starts_at) >= new Date()).sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
  const last = [...p.sessions].sort((a, b) => b.starts_at.localeCompare(a.starts_at))[0];
  const session = upcoming ? next : last;
  return (
    <article className="group relative grid overflow-hidden rounded-(--radius-card) border border-line bg-white shadow-(--shadow-card) md:grid-cols-[18rem_1fr]">
      <CmsImage media={p.image} slot="training" sizes="(min-width:768px) 18rem, 100vw" />
      <div className="p-6">
        <div className="flex flex-wrap gap-2">
          {session && <Badge tone={upcoming && session.registration_status === 'open' ? 'success' : 'neutral'}>{upcoming ? (session.registration_status === 'open' ? 'Registration open' : session.registration_status) : 'Past session'}</Badge>}
          {session && <Badge tone="neutral">{DELIVERY_LABELS[session.delivery_mode]}</Badge>}
        </div>
        <h3 className="mt-3 text-xl font-bold">
          <Link href={`/training/cpd/${p.slug}`} className="after:absolute after:inset-0 group-hover:text-brand-700">
            {p.title}
          </Link>
        </h3>
        {session && <p className="meta mt-1">{formatDateRange(session.starts_at, session.ends_at)}</p>}
        {p.summary && <p className="mt-3 line-clamp-3 text-muted">{p.summary}</p>}
        {p.fee_text && <p className="mt-3 text-sm font-medium text-ink">Fee: {p.fee_text}</p>}
      </div>
    </article>
  );
}

export default async function CpdPage() {
  const [programmes, { settings }] = await Promise.all([getCpdProgrammes(), getSite()]);
  const now = new Date();
  const upcoming = programmes.filter((p) => p.sessions.some((s) => new Date(s.starts_at) >= now && s.registration_status !== 'cancelled'));
  const past = programmes.filter((p) => !upcoming.includes(p));

  return (
    <>
      <PageHeader
        title="CARISCA CPDs"
        eyebrow="Training"
        intro="Continuing professional development and executive education for supply chain, procurement and logistics professionals."
        crumbs={[{ label: 'Training', href: '/training' }, { label: 'CPDs' }]}
      />
      <div className="container-site py-12 md:py-16">
        <section aria-labelledby="upcoming-heading" id="upcoming">
          <SectionHeading id="upcoming-heading" title="Upcoming CPDs" />
          {upcoming.length ? (
            <div className="grid gap-6">
              {upcoming.map((p) => (
                <ProgrammeRow key={p.id} p={p} upcoming />
              ))}
            </div>
          ) : (
            <EmptyState title="No CPD sessions are scheduled at the moment." icon={<GraduationCap className="size-6" />}>
              <p>New sessions are announced in our news and newsletter.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {settings.cpd_portal_url && (
                  <ButtonLink href={settings.cpd_portal_url} size="sm">
                    CARISCA CPD portal
                  </ButtonLink>
                )}
                <ButtonLink href="/training/iscea" size="sm" variant="secondary">
                  ISCEA certifications
                </ButtonLink>
              </div>
            </EmptyState>
          )}
        </section>
        {past.length > 0 && (
          <section aria-labelledby="past-heading" className="mt-16">
            <SectionHeading id="past-heading" title="Past programmes" />
            <div className="grid gap-6">
              {past.map((p) => (
                <ProgrammeRow key={p.id} p={p} upcoming={false} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
