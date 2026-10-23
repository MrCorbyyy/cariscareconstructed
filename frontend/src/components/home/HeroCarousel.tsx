'use client';

import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import type { Slide } from '@/types/api';
import { ButtonLink } from '../ui/Button';
import { CmsImage } from '../ui/CmsImage';

const INTERVAL_MS = 8000;
const REDUCED = '(prefers-reduced-motion: reduce)';
const subscribeReducedMotion = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};

/**
 * Homepage carousel (WAI-ARIA carousel pattern). Auto-rotation is slow, pauses on hover/focus,
 * can be paused by the visitor, and is disabled entirely when reduced motion is preferred.
 */
export function HeroCarousel({ slides, fallbackTitle, fallbackCaption }: { slides: Slide[]; fallbackTitle: string; fallbackCaption?: string | null }) {
  const items: Slide[] = slides.length
    ? slides
    : [{ id: 0, title: fallbackTitle, caption: fallbackCaption ?? null, image: null, image_alt: null, button_label: 'About CARISCA', button_url: '/about', secondary_label: null, secondary_url: null }];
  const [index, setIndex] = useState(0);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, () => window.matchMedia(REDUCED).matches, () => false);
  // Visitors who prefer reduced motion get no auto-rotation unless they press play.
  const [userPlaying, setPlaying] = useState<boolean | null>(null);
  const playing = (userPlaying ?? !reducedMotion) && items.length > 1;
  const [hovered, setHovered] = useState(false);

  const go = useCallback((i: number) => setIndex((i + items.length) % items.length), [items.length]);

  useEffect(() => {
    if (!playing || hovered || items.length < 2) return;
    const t = setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => clearTimeout(t);
  }, [playing, hovered, index, go, items.length]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Highlights"
      className="relative isolate overflow-hidden bg-brand-950"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
    >
      <div aria-live={playing ? 'off' : 'polite'}>
        {items.map((slide, i) => (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${items.length}`}
            hidden={i !== index}
            className="relative min-h-[30rem] md:min-h-0 md:aspect-[2.4/1] md:max-h-[40rem] md:w-full"
          >
            <div className="absolute inset-0 -z-10">
              <CmsImage media={slide.image} slot="hero" alt={slide.image_alt} fill priority={i === 0} sizes="100vw" />
              <div className="absolute inset-0 bg-linear-to-r from-brand-950/90 via-brand-950/65 to-brand-950/10" />
            </div>
            <div className="container-site flex h-full min-h-[30rem] items-center py-16 md:min-h-0">
              <div className="max-w-2xl">
                <div className="mb-5 h-1 w-16 bg-sky-accent" aria-hidden />
                {i === 0 ? (
                  <h1 className="text-[2.25rem] leading-[1.08] font-bold text-white md:text-[3.25rem]">{slide.title}</h1>
                ) : (
                  <h2 className="text-[2.25rem] leading-[1.08] font-bold text-white md:text-[3.25rem]">{slide.title}</h2>
                )}
                {slide.caption && <p className="mt-5 max-w-xl text-lg text-brand-100 md:text-xl">{slide.caption}</p>}
                <div className="mt-8 flex flex-wrap gap-3">
                  {slide.button_label && slide.button_url && (
                    <ButtonLink href={slide.button_url} variant="light" size="lg">
                      {slide.button_label}
                    </ButtonLink>
                  )}
                  {slide.secondary_label && slide.secondary_url && (
                    <ButtonLink href={slide.secondary_url} variant="outline-light" size="lg">
                      {slide.secondary_label}
                    </ButtonLink>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <div className="absolute right-4 bottom-4 flex items-center gap-2 md:right-8 md:bottom-6">
          <button type="button" onClick={() => setPlaying(!playing)} className="flex size-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30" aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}>
            {playing ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
          </button>
          <button type="button" onClick={() => go(index - 1)} className="flex size-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30" aria-label="Previous slide">
            <ChevronLeft aria-hidden className="size-5" />
          </button>
          <div className="flex gap-1.5 px-1">
            {items.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
                className={`h-2.5 rounded-full transition-all ${i === index ? 'w-7 bg-sky-accent' : 'w-2.5 bg-white/60 hover:bg-white'}`}
              />
            ))}
          </div>
          <button type="button" onClick={() => go(index + 1)} className="flex size-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30" aria-label="Next slide">
            <ChevronRight aria-hidden className="size-5" />
          </button>
        </div>
      )}
    </section>
  );
}
