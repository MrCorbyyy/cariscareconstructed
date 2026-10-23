'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  ExternalLink,
  FileText,
  FlaskConical,
  GalleryHorizontal,
  GraduationCap,
  Handshake,
  History,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LineChart,
  LogOut,
  Mail,
  Menu,
  MenuSquare,
  Newspaper,
  Presentation,
  Settings,
  Shuffle,
  Tags,
  UserCircle,
  Users,
  UsersRound,
  X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  perm?: string;
}

const NAV: Array<{ heading: string; items: NavItem[] }> = [
  { heading: '', items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    heading: 'Content',
    items: [
      { href: '/admin/articles', label: 'News & announcements', icon: Newspaper, perm: 'articles.read' },
      { href: '/admin/pages', label: 'Pages', icon: FileText, perm: 'pages.read' },
      { href: '/admin/slides', label: 'Homepage slides', icon: Presentation, perm: 'slides.read' },
      { href: '/admin/events', label: 'Events', icon: CalendarDays, perm: 'events.read' },
      { href: '/admin/newsletters', label: 'Newsletters', icon: Mail, perm: 'newsletters.read' },
      { href: '/admin/galleries', label: 'Galleries', icon: GalleryHorizontal, perm: 'galleries.read' },
      { href: '/admin/categories', label: 'News topics', icon: Tags, perm: 'categories.read' },
    ],
  },
  {
    heading: 'Research',
    items: [
      { href: '/admin/publications', label: 'Publications', icon: BookOpen, perm: 'publications.read' },
      { href: '/admin/research-projects', label: 'Research projects', icon: FlaskConical, perm: 'research.read' },
      { href: '/admin/research-themes', label: 'Research themes', icon: FlaskConical, perm: 'research.read' },
      { href: '/admin/lmi-reports', label: 'LMI reports', icon: LineChart, perm: 'lmi.read' },
    ],
  },
  {
    heading: 'Training',
    items: [
      { href: '/admin/cpd-programmes', label: 'CPD programmes', icon: GraduationCap, perm: 'cpd.read' },
      { href: '/admin/cpd-sessions', label: 'CPD sessions', icon: CalendarDays, perm: 'cpd.read' },
      { href: '/admin/registrations', label: 'Registrations', icon: ClipboardList, perm: 'registrations.read' },
    ],
  },
  {
    heading: 'People',
    items: [
      { href: '/admin/staff', label: 'Staff profiles', icon: UsersRound, perm: 'staff.read' },
      { href: '/admin/staff-groups', label: 'Staff groups', icon: UsersRound, perm: 'staff.read' },
      { href: '/admin/partners', label: 'Partners', icon: Handshake, perm: 'partners.read' },
    ],
  },
  {
    heading: 'Inbox',
    items: [
      { href: '/admin/submissions', label: 'Contact submissions', icon: Inbox, perm: 'submissions.read' },
      { href: '/admin/subscribers', label: 'Newsletter subscribers', icon: Mail, perm: 'subscribers.read' },
    ],
  },
  {
    heading: 'Site',
    items: [
      { href: '/admin/media', label: 'Media library', icon: ImageIcon, perm: 'media.read' },
      { href: '/admin/menus', label: 'Navigation menus', icon: MenuSquare, perm: 'menus.read' },
      { href: '/admin/settings', label: 'Site settings', icon: Settings, perm: 'settings.read' },
      { href: '/admin/redirects', label: 'URL redirects', icon: Shuffle, perm: 'redirects.read' },
      { href: '/admin/users', label: 'Users & roles', icon: Users, perm: 'users.read' },
      { href: '/admin/audit', label: 'Audit log', icon: History, perm: 'audit.read' },
    ],
  },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { session, can, logout } = useAuth();
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (v: boolean) => setOpenOn(v ? pathname : null);

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`));

  const nav = (
    <nav aria-label="Administration" className="flex-1 overflow-y-auto px-3 py-4">
      {NAV.map((group) => {
        const items = group.items.filter((i) => !i.perm || can(i.perm));
        if (!items.length) return null;
        return (
          <div key={group.heading || 'main'} className="mb-4">
            {group.heading && <p className="mb-1 px-3 text-[0.7rem] font-bold tracking-[0.14em] text-brand-300 uppercase">{group.heading}</p>}
            <ul>
              {items.map((i) => (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    aria-current={isActive(i.href) ? 'page' : undefined}
                    className={`flex items-center gap-2.5 rounded px-3 py-2 text-[0.9rem] ${isActive(i.href) ? 'bg-white/12 font-semibold text-white' : 'text-brand-100 hover:bg-white/8 hover:text-white'}`}
                  >
                    <i.icon aria-hidden className="size-4 shrink-0" />
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-surface">
      <a href="#admin-main" className="sr-only z-50 rounded bg-white px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-brand-950 lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
          <Image src="/brand/carisca-wordmark-white.png" alt="CARISCA" width={601} height={101} className="h-6 w-auto" />
          <span className="text-xs font-semibold tracking-wide text-brand-200 uppercase">Admin</span>
        </div>
        {nav}
      </aside>
      {/* Sidebar (mobile) */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Administration menu">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-brand-950">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
              <span className="font-display font-bold text-white">CARISCA Admin</span>
              <button type="button" onClick={() => setOpen(false)} className="text-white" aria-label="Close menu" autoFocus>
                <X aria-hidden className="size-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-white px-4 md:px-6">
          <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-2 font-semibold text-brand-800 lg:hidden" aria-label="Open menu">
            <Menu aria-hidden className="size-5" />
          </button>
          <a href="/" target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline sm:flex">
            View website <ExternalLink aria-hidden className="size-3.5" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <div className="flex items-center gap-3">
            <Link href="/admin/account" className="flex items-center gap-2 text-sm hover:text-brand-700">
              <UserCircle aria-hidden className="size-5 text-brand-600" />
              <span className="hidden text-right leading-tight sm:block">
                <span className="block font-semibold text-ink">{session.user.name}</span>
                <span className="block text-xs text-muted">{session.user.roles?.map((r) => r.label).join(', ') || session.roles.join(', ')}</span>
              </span>
            </Link>
            <button type="button" onClick={() => void logout()} className="flex items-center gap-1.5 rounded px-3 py-2 text-sm font-semibold text-muted hover:bg-surface hover:text-ink">
              <LogOut aria-hidden className="size-4" /> Sign out
            </button>
          </div>
        </header>
        <main id="admin-main" tabIndex={-1} className="flex-1 px-4 py-6 focus:outline-none md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

/** Page heading with breadcrumbs and actions for admin screens. */
export function AdminPageHeader({ title, crumbs = [], actions, description }: { title: string; crumbs?: Array<{ label: string; href?: string }>; actions?: ReactNode; description?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
            <li>
              <Link href="/admin" className="hover:text-brand-700 hover:underline">
                Dashboard
              </Link>
            </li>
            {crumbs.map((c) => (
              <li key={c.label} className="flex items-center gap-1.5">
                <span aria-hidden>/</span>
                {c.href ? (
                  <Link href={c.href} className="hover:text-brand-700 hover:underline">
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="mt-1 text-2xl font-bold md:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
