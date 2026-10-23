import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, ExternalLink, MapPin, Ticket } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import { CmsImage } from '@/components/ui/CmsImage';
import { FileDownload } from '@/components/ui/FileDownload';
import { Badge, RichText } from '@/components/ui/Typography';
import { SITE_URL } from '@/lib/config';
import { DELIVERY_LABELS, EVENT_TYPE_LABELS, formatDateRange } from '@/lib/format';
import { buildMetadata, jsonLd } from '@/lib/seo';
import { getEvent } from '@/services/public';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = await getEvent((await params).slug);
  if (!e) return {};
  return buildMetadata({ title: e.seo_title || e.title, description: e.seo_description || e.summary, path: `/events/${e.slug}`, image: e.ogImage ?? e.image });
}

export default async function EventPage({ params }: Props) {
  const e = await getEvent((await params).slug);
  if (!e) notFound();
  const ended = new Date(e.ends_at ?? e.starts_at) < new Date();
  const online = e.location_type === 'online';
  // Event structured data only includes facts stored for the event.
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.title,
    startDate: e.starts_at,
    ...(e.ends_at ? { endDate: e.ends_at } : {}),
    eventAttendanceMode: `https://schema.org/${online ? 'OnlineEventAttendanceMode' : e.location_type === 'hybrid' ? 'MixedEventAttendanceMode' : 'OfflineEventAttendanceMode'}`,
    eventStatus: 'https://schema.org/EventScheduled',
    ...(e.venue ? { location: online ? { '@type': 'VirtualLocation', url: e.website_url ?? `${SITE_URL}/events/${e.slug}` } : { '@type': 'Place', name: e.venue, address: e.venue } } : {}),
    ...(e.image ? { image: [e.image.url] } : {}),
    ...(e.summary ? { description: e.summary } : {}),
    organizer: { '@type': 'Organization', name: 'CARISCA', url: SITE_URL },
  };

  return (
    <>
      <PageHeader title={e.title} eyebrow={EVENT_TYPE_LABELS[e.event_type]} crumbs={[{ label: 'Events', href: ended ? '/events?when=past' : '/events' }, { label: e.title }]}>
        {ended && (
          <p className="mt-4">
            <Badge tone="neutral">Past event</Badge>
          </p>
        )}
      </PageHeader>
      <div className="container-site grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="max-w-3xl">
          {e.image && <CmsImage media={e.image} slot="eventBanner" rounded className="mb-8" priority sizes="(min-width:1024px) 48rem, 100vw" />}
          {e.summary && !e.body && <p className="text-lg leading-relaxed">{e.summary}</p>}
          <RichText html={e.body} />
          {e.attachments && e.attachments.some((a) => a.media) && (
            <section className="mt-10">
              <h2 className="text-2xl font-bold">Materials</h2>
              <ul className="mt-4 grid gap-3">
                {e.attachments.map((a) => (a.media ? <li key={a.id}><FileDownload file={a.media} label={a.label ?? undefined} /></li> : null))}
              </ul>
            </section>
          )}
          {e.gallery && (
            <p className="mt-10">
              <Link href={`/gallery/${e.gallery.slug}`} className="link">
                View photos from this event
              </Link>
            </p>
          )}
        </div>
        <aside className="space-y-5">
          <dl className="space-y-4 rounded-(--radius-card) border border-line bg-surface p-5">
            <div className="flex gap-3">
              <CalendarDays aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-600" />
              <div>
                <dt className="text-sm font-semibold text-muted">Date</dt>
                <dd className="font-medium text-ink">
                  <time dateTime={e.starts_at}>{formatDateRange(e.starts_at, e.ends_at, e.all_day)}</time>
                </dd>
              </div>
            </div>
            <div className="flex gap-3">
              <MapPin aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-600" />
              <div>
                <dt className="text-sm font-semibold text-muted">Where</dt>
                <dd className="font-medium text-ink">
                  {e.venue ?? 'To be announced'}
                  <span className="block text-sm font-normal text-muted">{DELIVERY_LABELS[e.location_type]}</span>
                </dd>
              </div>
            </div>
            {e.cost_text && (
              <div className="flex gap-3">
                <Ticket aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-600" />
                <div>
                  <dt className="text-sm font-semibold text-muted">Cost</dt>
                  <dd className="font-medium text-ink">{e.cost_text}</dd>
                </div>
              </div>
            )}
          </dl>
          {!ended && e.registration_url && (
            <ButtonLink href={e.registration_url} className="w-full" size="lg">
              Register
            </ButtonLink>
          )}
          {e.website_url && (
            <ButtonLink href={e.website_url} variant="secondary" className="w-full">
              Event website <ExternalLink aria-hidden className="size-4" />
            </ButtonLink>
          )}
        </aside>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
    </>
  );
}
