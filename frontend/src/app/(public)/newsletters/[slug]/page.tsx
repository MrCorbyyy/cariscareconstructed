import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import { CmsImage } from '@/components/ui/CmsImage';
import { FileDownload } from '@/components/ui/FileDownload';
import { RichText } from '@/components/ui/Typography';
import { formatDate } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';
import { getNewsletter } from '@/services/public';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const n = await getNewsletter((await params).slug);
  if (!n) return {};
  return buildMetadata({ title: n.title, description: n.summary ?? `${n.title} from CARISCA.`, path: `/newsletters/${n.slug}`, image: n.coverImage });
}

export default async function NewsletterIssuePage({ params }: Props) {
  const n = await getNewsletter((await params).slug);
  if (!n) notFound();
  return (
    <>
      <PageHeader
        title={n.title}
        eyebrow={n.issue_number ? `Issue ${n.issue_number}` : 'Newsletter'}
        intro={n.published_on ? formatDate(n.published_on, { day: undefined }) : undefined}
        crumbs={[{ label: 'Newsletter', href: '/newsletters' }, { label: n.title }]}
      />
      <div className="container-site grid gap-12 py-12 md:py-16 md:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="max-w-72 space-y-4">
          <CmsImage media={n.coverImage} slot="newsletterCover" alt={n.coverImage ? `Cover of ${n.title}` : undefined} rounded sizes="288px" />
          {n.file && <FileDownload file={n.file} label="Download this issue" />}
          {n.online_url && (
            <ButtonLink href={n.online_url} variant={n.file ? 'secondary' : 'primary'} className="w-full">
              View online <ExternalLink aria-hidden className="size-4" />
            </ButtonLink>
          )}
        </div>
        <div className="max-w-3xl">
          {n.summary && <p className="mb-6 text-lg">{n.summary}</p>}
          {n.highlights ? (
            <>
              <h2 className="text-2xl font-bold">In this issue</h2>
              <RichText html={n.highlights} className="mt-2" />
            </>
          ) : (
            !n.summary && <p className="text-muted">Download the issue to read it in full.</p>
          )}
        </div>
      </div>
    </>
  );
}
