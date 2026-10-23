import Image from 'next/image';
import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';
import type { SiteData } from '@/types/api';
import { NewsletterForm } from '../forms/NewsletterForm';
import { SmartLink } from '../ui/SmartLink';

const SOCIALS: Array<{ key: string; label: string }> = [
  { key: 'social_facebook', label: 'Facebook' },
  { key: 'social_linkedin', label: 'LinkedIn' },
  { key: 'social_whatsapp', label: 'WhatsApp community' },
  { key: 'social_x', label: 'X (Twitter)' },
  { key: 'social_youtube', label: 'YouTube' },
];

export function SiteFooter({ site }: { site: SiteData }) {
  const s = site.settings;
  const columns = site.menus.footer ?? [];
  const socials = SOCIALS.filter((x) => s[x.key]);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto">
      {/* Newsletter band */}
      <section aria-labelledby="newsletter-heading" className="bg-brand-700 text-white">
        <div className="container-site grid gap-8 py-12 md:grid-cols-[1fr_1.1fr] md:items-center">
          <div>
            <p className="font-display text-sm font-semibold tracking-[0.14em] text-sky-accent uppercase">Stay informed</p>
            <h2 id="newsletter-heading" className="mt-2 text-[1.75rem] font-bold text-white">
              Subscribe to the CARISCA Newsletter
            </h2>
            <p className="mt-2 max-w-lg text-brand-100">
              Research, LMI releases, CPD programmes, events and news from CARISCA, delivered to your inbox.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </section>

      <div className="bg-brand-950 text-brand-100">
        <div className="container-site grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)_1.4fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Image src="/brand/carisca-wordmark-white.png" alt={s.site_name ?? 'CARISCA'} width={601} height={101} className="h-9 w-auto" />
            <p className="mt-3 font-display text-sm font-semibold text-white">{s.site_full_name}</p>
            <p className="mt-4 text-[0.95rem] leading-relaxed">{s.site_description}</p>
            {s.support_text && <p className="mt-4 text-sm text-brand-200">{s.support_text}</p>}
            {socials.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="CARISCA on social media">
                {socials.map((x) => (
                  <li key={x.key}>
                    <a
                      href={s[x.key]!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center rounded border border-white/20 px-3 text-sm font-semibold text-white hover:border-sky-accent hover:text-sky-accent"
                    >
                      {x.label}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {columns.map((col) => (
            <nav key={col.id} aria-label={col.label}>
              <h2 className="font-display text-base font-bold tracking-wide text-white">{col.label}</h2>
              <ul className="mt-4 space-y-2.5 text-[0.95rem]">
                {col.children.map((item) => (
                  <li key={item.id}>
                    <SmartLink href={item.href} newTab={item.open_in_new_tab} className="hover:text-white hover:underline">
                      {item.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h2 className="font-display text-base font-bold tracking-wide text-white">Contact</h2>
            <address className="mt-4 space-y-3 text-[0.95rem] not-italic">
              {s.contact_address && (
                <p className="flex gap-2.5">
                  <MapPin aria-hidden className="mt-1 size-4 shrink-0 text-sky-accent" />
                  <span className="whitespace-pre-line">{s.contact_address}</span>
                </p>
              )}
              {s.contact_phone && (
                <p className="flex gap-2.5">
                  <Phone aria-hidden className="mt-1 size-4 shrink-0 text-sky-accent" />
                  <a href={`tel:${s.contact_phone_link ?? s.contact_phone}`} className="hover:text-white">
                    {s.contact_phone}
                  </a>
                </p>
              )}
              {s.contact_email && (
                <p className="flex gap-2.5">
                  <Mail aria-hidden className="mt-1 size-4 shrink-0 text-sky-accent" />
                  <a href={`mailto:${s.contact_email}`} className="break-all hover:text-white">
                    {s.contact_email}
                  </a>
                </p>
              )}
            </address>
            <Link href="/contact" className="mt-5 inline-block font-display font-semibold text-sky-accent hover:text-white">
              Send us a message →
            </Link>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="container-site flex flex-col gap-3 py-5 text-sm text-brand-200 md:flex-row md:items-center md:justify-between">
            <p>
              © {year} {s.copyright_holder ?? 'CARISCA, KNUST'}. All rights reserved.
            </p>
            <p className="flex items-center gap-2">
              <span className="inline-block h-3 w-1 bg-knust-maroon" aria-hidden />
              <span className="inline-block h-3 w-1 bg-gold" aria-hidden />
              <span className="inline-block h-3 w-1 bg-knust-green" aria-hidden />
              <span>
                A centre of excellence at{' '}
                <a href="https://www.knust.edu.gh/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
                  KNUST
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
