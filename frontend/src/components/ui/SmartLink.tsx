import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { isExternal } from '@/lib/format';

type Props = Omit<ComponentProps<'a'>, 'href'> & {
  href: string;
  children: ReactNode;
  /** Force a new tab (otherwise only external links open in a new tab). */
  newTab?: boolean;
  /** Show the external-link icon for links that leave the site. */
  showExternalIcon?: boolean;
};

/** Internal links use client navigation; external links open in a new tab with an accessible hint. */
export function SmartLink({ href, children, newTab, showExternalIcon = false, ...rest }: Props) {
  const external = isExternal(href) || href.startsWith('mailto:') || href.startsWith('tel:');
  if (!external) {
    return (
      <Link href={href} {...rest} {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {children}
      </Link>
    );
  }
  const opensNewTab = newTab ?? isExternal(href);
  return (
    <a href={href} {...rest} {...(opensNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
      {showExternalIcon && isExternal(href) && <ExternalLink aria-hidden className="ml-1 inline size-[0.85em] align-[-0.05em]" />}
      {opensNewTab && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}
