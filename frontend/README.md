# CARISCA website (frontend)

Next.js 16 (App Router) application serving the public website and the `/admin` content-management dashboard. All data comes from the separately deployed CARISCA API.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server on http://localhost:3000 |
| `npm run build` | Production build with `output: 'standalone'`; `postbuild` copies `public/` and `.next/static/` into `.next/standalone/` |
| `npm start` | `next start` (alternative to the standalone server) |
| `npm run start:standalone` | Run `.next/standalone/server.js` (what cPanel runs) |
| `npm run typecheck` / `npm run lint` | Static checks |
| `npm test` | Vitest + Testing Library component tests |
| `npm run test:e2e` | Playwright workflows. Needs both servers running plus `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD`. First run `npx playwright install chromium`. |
| `npm run placeholders` | Regenerate labelled placeholder images from `src/lib/image-slots.json` |

## Environment

Copy `.env.example` to `.env.local` (development) or set the variables in cPanel (production).

| Variable | Where used | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Browser + server | **Embedded at build time.** Rebuild after changing it. Also sets the allowed image host. |
| `NEXT_PUBLIC_SITE_URL` | Server | Canonical URLs, sitemap, Open Graph |
| `API_INTERNAL_BASE_URL` | Server only | Optional private address of the API |
| `REVALIDATE_SECRET` | Server only | Must equal the API's `REVALIDATE_SECRET` |
| `CONTENT_REVALIDATE_SECONDS` | Server only | Fallback cache lifetime (default 300) |
| `NEXT_IMAGE_UNOPTIMIZED` | Build | `true` if the host cannot run `sharp` |

## How data flows

- **Public pages** are Server Components. `src/services/public.ts` fetches from the API through `src/lib/api.ts` with cache tags. Pages render on request, data comes from the cache, and the API purges tags via `POST /api/revalidate` when content changes.
- **The admin dashboard** (`src/app/admin`) is client-side: `src/services/admin.ts` calls the API with the session cookie and CSRF token. Generic list and edit screens are driven by `src/features/admin/resources.ts`.
- **Public forms** (contact, newsletter, CPD registration) post from the browser via `src/services/client.ts`.

## Design system

- Tokens (colours, fonts, radii) live in `src/styles/globals.css` (`@theme`). The brand colours come from the existing CARISCA site. KNUST maroon and green appear only in the affiliation strip.
- Typography: Barlow (headings), Noto Sans (body), self-hosted via `next/font`.
- Layout components: `SiteHeader`, `MainNav` (accessible disclosure menus, mobile drawer), `SiteFooter`, `PageHeader` with breadcrumbs (and JSON-LD), and `CmsPageView`.
- `CmsImage` renders uploaded images in fixed-ratio frames, or labelled placeholders (`public/images/placeholders/*.svg`) at the slot's intended size. Slot sizes are defined in `src/lib/image-slots.json`.

## Routes

Public: `/`, `/about…` (CMS), `/about/team[/slug]`, `/about/partners`, `/research`, `/research/projects[/slug]`, `/publications[/slug]`, `/lmi`, `/asn-ra` (CMS), `/stakeholder-engagement` (CMS), `/training` (CMS), `/training/cpd[/slug]`, `/training/iscea`, `/news[/slug]`, `/events[/slug]`, `/newsletters[/slug]`, `/gallery[/slug]`, `/contact`, `/search`, `/sitemap.xml`, `/robots.txt`. Any other path is resolved by `[...slug]` as a CMS page or a legacy redirect.

Admin: `/login`, `/admin` (dashboard), `/admin/<resource>[/id|new]`, `/admin/media`, `/admin/menus`, `/admin/settings`, `/admin/users`, `/admin/submissions`, `/admin/subscribers`, `/admin/registrations`, `/admin/audit`, `/admin/account`.

Operational: `/api/revalidate` (cache purge webhook), `/api-health`.
