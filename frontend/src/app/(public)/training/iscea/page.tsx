import { notFound } from 'next/navigation';
import { ContactForm } from '@/components/forms/ContactForm';
import { CmsPageView } from '@/components/layout/CmsPageView';
import { buildMetadata } from '@/lib/seo';
import { resolvePage } from '@/services/public';

export async function generateMetadata() {
  const r = await resolvePage('/training/iscea');
  const p = r?.type === 'page' ? r.page : null;
  return buildMetadata({ title: p?.seo_title || p?.title || 'ISCEA Certifications', description: p?.seo_description || p?.summary, path: '/training/iscea', image: p?.heroImage });
}

/** ISCEA certification page: CMS content plus the "register your interest" form. */
export default async function IsceaPage() {
  const r = await resolvePage('/training/iscea');
  if (r?.type !== 'page') notFound();
  return (
    <CmsPageView page={r.page} siblings={r.siblings}>
      <section aria-labelledby="interest-heading" id="register-interest" className="mt-12 rounded-(--radius-card) border border-line bg-surface p-6 md:p-8">
        <h2 id="interest-heading" className="text-2xl font-bold">
          Register your interest
        </h2>
        <p className="mt-2 mb-6 text-muted">Complete the form to receive more information and access the CARISCA certification discount.</p>
        <ContactForm
          topic="iscea_certification"
          submitLabel="Register interest"
          interest={{
            label: 'Programme of interest',
            options: [
              'Certified Supply Chain Analyst (CSCA)',
              'Certified Professional in Logistics Management (CPLM)',
              'Certified Sustainable Supply Chain Professional (CSSCP)',
              'Certified Healthcare Supply Chain Analyst (CHSCA)',
              'Not sure yet',
            ],
          }}
        />
      </section>
    </CmsPageView>
  );
}
