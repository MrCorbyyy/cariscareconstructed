import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { ContactForm } from '@/components/forms/ContactForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { SmartLink } from '@/components/ui/SmartLink';
import { RichText } from '@/components/ui/Typography';
import { buildMetadata } from '@/lib/seo';
import { getSite, resolvePage } from '@/services/public';

export async function generateMetadata() {
  const r = await resolvePage('/contact');
  const p = r?.type === 'page' ? r.page : null;
  return buildMetadata({ title: p?.seo_title || 'Contact Us', description: p?.seo_description || 'Contact the CARISCA team at KNUST.', path: '/contact' });
}

export default async function ContactPage() {
  const [{ settings: s }, r] = await Promise.all([getSite(), resolvePage('/contact')]);
  const page = r?.type === 'page' ? r.page : null;
  const socials = [
    ['Facebook', s.social_facebook],
    ['LinkedIn', s.social_linkedin],
    ['WhatsApp community', s.social_whatsapp],
    ['X (Twitter)', s.social_x],
    ['YouTube', s.social_youtube],
  ].filter(([, url]) => url) as Array<[string, string]>;

  return (
    <>
      <PageHeader title={page?.title ?? 'Contact Us'} intro={page?.summary} crumbs={[{ label: 'Contact' }]} />
      <div className="container-site grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section aria-labelledby="form-heading">
          <RichText html={page?.body} className="mb-8" />
          <h2 id="form-heading" className="mb-6 text-2xl font-bold">
            Send us a message
          </h2>
          <ContactForm />
        </section>
        <aside className="space-y-6">
          <div className="rounded-(--radius-card) bg-brand-900 p-6 text-white">
            <h2 className="text-xl font-bold text-white">Contact details</h2>
            <address className="mt-5 space-y-4 not-italic">
              {s.contact_address && (
                <p className="flex gap-3">
                  <MapPin aria-hidden className="mt-1 size-5 shrink-0 text-sky-accent" />
                  <span className="whitespace-pre-line">{s.contact_address}</span>
                </p>
              )}
              {s.contact_phone && (
                <p className="flex gap-3">
                  <Phone aria-hidden className="mt-1 size-5 shrink-0 text-sky-accent" />
                  <a href={`tel:${s.contact_phone_link ?? s.contact_phone}`} className="underline-offset-2 hover:underline">
                    {s.contact_phone}
                  </a>
                </p>
              )}
              {s.contact_email && (
                <p className="flex gap-3">
                  <Mail aria-hidden className="mt-1 size-5 shrink-0 text-sky-accent" />
                  <a href={`mailto:${s.contact_email}`} className="break-all underline-offset-2 hover:underline">
                    {s.contact_email}
                  </a>
                </p>
              )}
              {s.contact_hours && (
                <p className="flex gap-3">
                  <Clock aria-hidden className="mt-1 size-5 shrink-0 text-sky-accent" />
                  {s.contact_hours}
                </p>
              )}
            </address>
            {s.contact_map_url && (
              <SmartLink href={s.contact_map_url} className="mt-6 inline-block font-display font-semibold text-sky-accent hover:text-white">
                Get directions on Google Maps →
              </SmartLink>
            )}
          </div>
          {socials.length > 0 && (
            <div className="rounded-(--radius-card) border border-line p-6">
              <h2 className="font-display text-lg font-bold">Follow CARISCA</h2>
              <ul className="mt-3 space-y-2">
                {socials.map(([label, url]) => (
                  <li key={label}>
                    <SmartLink href={url} className="link">
                      {label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
