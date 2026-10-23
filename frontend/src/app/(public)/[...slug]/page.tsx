import type { Metadata } from 'next';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { CmsPageView } from '@/components/layout/CmsPageView';
import { buildMetadata } from '@/lib/seo';
import { resolvePage } from '@/services/public';

type Props = { params: Promise<{ slug: string[] }> };

const toPath = (slug: string[]) => `/${slug.map((s) => decodeURIComponent(s)).join('/')}`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const path = toPath((await params).slug);
  const r = await resolvePage(path);
  if (r?.type !== 'page') return {};
  const p = r.page;
  return buildMetadata({ title: p.seo_title || p.title, description: p.seo_description || p.summary, path, image: p.ogImage ?? p.heroImage });
}

/**
 * Catch-all for CMS pages (About, Stakeholder Engagement, ASN-RA, …). Unknown paths are checked
 * against the redirect table so legacy WordPress URLs land on their new location.
 */
export default async function CmsPage({ params }: Props) {
  const path = toPath((await params).slug);
  const r = await resolvePage(path);
  if (!r) notFound();
  if (r.type === 'redirect') {
    if (r.status === 302) redirect(r.to);
    permanentRedirect(r.to);
  }
  return <CmsPageView page={r.page} siblings={r.siblings} />;
}
