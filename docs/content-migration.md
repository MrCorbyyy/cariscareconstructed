# Content migration plan and status

Source: the public WordPress site at `https://carisca.knust.edu.gh/` (audited 21 Oct 2026, see `website-audit.md`).
No WordPress database, administrator account or server files were available. Everything was migrated from **publicly served content only**, through the public WordPress REST API (`/wp-json/wp/v2/*`) and The Events Calendar API (`/wp-json/tribe/events/v1/events`).

## 1. Approach

Migration happens in two repeatable steps. Both are idempotent: they never overwrite a record that already exists, so dashboard edits survive a re-run.

| Step | Command | What it does |
|---|---|---|
| 1. Seed | `npm run db:seed` | Roles, permissions, settings, menus, topics and staff groups. Also loads **curated, verified content** transcribed from the legacy site (`backend/src/seeders/data/curated.ts` and `pages.ts`): core pages, team, partners, research themes, ASN-RA projects, publications, LMI reports, newsletters, CPD programmes, homepage slides, and the section-level redirect map. |
| 2. Import | `npm run import:wordpress -- --with-media` | Fetches the 132 posts, 95 events and selected legacy pages. Downloads their images and documents into the media library (only from the CARISCA host). Attaches portraits, PDFs and covers to the curated records, imports staff biographies and newsletter highlights, rewrites internal links to new URLs, and creates a 301 redirect for every old post, event and page URL. |

Options: `--source <dir>` imports from a saved export (`pages.json`, `posts.json`, `categories.json`, `media.json`, `events.json`) instead of the live site. Large legacy files exceed the normal upload limits, so run the import with raised limits:

```bash
UPLOAD_MAX_DOCUMENT_MB=100 UPLOAD_MAX_IMAGE_MB=20 npm run import:wordpress -- --with-media
```

Downloads are cached in `STORAGE_DIR/import-cache/` (safe to delete afterwards).

## 2. What was migrated (local run, 21 Oct 2026)

| Content | Count | Notes |
|---|---:|---|
| News articles | 132 | Original titles, slugs, publication dates and bodies, sanitised. Types: 80 news, 17 calls, 8 announcements, 10 profile stories, 7 research highlights, 6 project updates, 4 newsletter announcements. |
| Events | 95 | Sep 2020 – Jul 2026, with dates (UTC), venues, costs, external sites and images. None are upcoming as of the audit date. |
| Pages | 35 | 11 curated core pages and 24 imported legacy pages (29 published, 6 draft) |
| Team members | 33 | 3 groups; 30 portraits; 17 biographies from legacy profile pages |
| Partners | 4 | KNUST, LEARN Logistics by Kühne Foundation, ASU, ISCEA (logos pending) |
| Publications | 30 | 10 practitioner/industry reports and 1 research report, 6 policy briefs, 13 journal articles; 17 PDFs stored locally |
| LMI reports | 12 | Q1 2022 – Q2 2025; 11 PDFs; headline values for 9 quarters, each with its source URL |
| Newsletters | 13 | Issues 1–13 with covers and PDFs (issue 11 links to Mailchimp); "In this issue" lists for 10 issues |
| CPD programmes | 2 | With their 2026 sessions (both now past) |
| Research projects | 5 | ASN-RA team projects |
| Media files | 255 | Images and documents downloaded from the legacy site |
| Redirects | 303 | Old post, event, page and section URLs → new URLs |

## 3. URL mapping (old → new)

| Legacy pattern | New URL |
|---|---|
| `/<post-slug>/` | `/news/<post-slug>` (slug unchanged) |
| `/event/<event-slug>/` | `/events/<event-slug>` |
| `/about-us/about-us/`, `/about-us/` | `/about` |
| `/about-us/centre-driectors-message/` | `/about/directors-message` |
| `/meet-the-team/`, `/our-team/`, `/research-faculty/`, `/about-us/management/` | `/about/team` |
| Individual profile pages (e.g. `/dr-dominic-essuman/`) | `/about/team/<name-slug>` |
| `/what-we-do/` | `/about/what-we-do` |
| `/component-1-research/` | `/research` |
| `/research/our-resources/`, `/our-books/` | `/publications` |
| `/research/journal-articles/` | `/publications?type=journal_article` |
| `/component-2-stakeholder-engagement/`, `/industry/` | `/stakeholder-engagement` |
| `/industry/*-partners/` | `/about/partners` |
| `/curricula-training/` | `/training` |
| `/training/cpd/` | `/training/cpd` (same) |
| `/international-certified-supply-chain-education-alliance-iscea/` | `/training/iscea` |
| `/lmi/`, `/asn-ra/`, `/contact/` | Same paths |
| `/contact-us/` | `/contact` |
| `/news-events/`, `/news-events/news-press-releases/`, `/category/news-and-press-release/` | `/news` |
| `/category/announcements/` | `/news?type=announcement,call` |
| `/news-events/events/`, `/our-events/`, `/events/` | `/events` |
| `/carisca-newsletters/` | `/newsletters` |
| `/distinguished-lecture-series/`, `/innovations/`, `/carisca-dissertation-awards/` | `/research/…` equivalents |
| `/scholarship/`, `/new-supply-chain-graduate-programmes/`, degree pages | `/training/…` equivalents |
| Summit pages (`/2026-supply-chain-research-summit/` …) | `/supply-chain-research-summit/<year>` |

All mappings are stored in the `redirects` table and are editable in **Admin › URL redirects**. Each redirect counts its hits, so you can see which old links are still in use.

**Old file URLs** (`/wp-content/uploads/…`) are not redirected by the new site. Imported content links to the new copies. If the old domain keeps serving `wp-content/uploads` during the transition, external links to PDFs keep working. Otherwise, add redirects for the most-requested files.

## 4. Items flagged for review

Every record whose content is uncertain carries an internal **review note**, shown as "Needs review" in the dashboard. Filter any list by it to work through them. The main groups:

| Area | Records | What to confirm |
|---|---:|---|
| Imported legacy pages | 24 | Formatting after the Elementor-to-clean-HTML conversion, images and links. Six are kept as drafts (Management, Research Faculty, Consultancy Services, Call for Facilitators, legacy Gallery, Mission & Vision). |
| Mission & Vision | 1 | The legacy page has only a slogan; supply approved mission and vision statements. |
| Director's message | 1 | The CIPS/CILT "twin accreditation" claim |
| Team | 24 | Roles missing on Meet the Team for 11 advisors; spellings ("Emmaunuel", "Dr.Owusu"); **wrong portraits** on the legacy site for Dr John Manso-Frimpong and Prof. Joseph Van Orden ("Muntaka-1/2.png") and Martha Adzraku ("CSO-Maame-Dentu.jpg"), which were not imported; biographies from 2020–21 may be outdated. |
| Partners | 4 | Upload approved logos; add the LEARN Logistics website URL |
| Publications | 30 | Authors, years and DOIs. Report years were inferred from file upload dates. Journal article metadata should be completed from the publisher pages. |
| LMI | 7 | Conflicting values (Q1 2022: 64.7 vs 64; Q2 2025 text "down from 63" vs Q1 2025 63.5); missing headline values for Q3 2022, Q1 2024 and Q3 2024; missing Q3 2023 PDF |
| Newsletters | 5 | Issue dates inferred from upload dates (issues 1–5); the 2021/2022 labelling conflict for issues 4–5 |
| Research | 9 | Theme names and summaries were drafted from CARISCA's stated focus areas; ASN-RA projects need problem, contribution and relevance text |
| Homepage slide 2 | 1 | Wording drafted for the reconstruction; left as a **draft** until approved |
| ASN-RA page | 1 | "Seven countries" vs the eight countries in the member table |
| Events | 1 | One legacy event had no title (saved as draft) |
| Articles | 12 | The featured image referenced by the legacy post no longer exists |

Clear the review note once an item has been checked.

## 5. Not migrated (and why)

- **Theme demo content**: leftover "Research Advisory" blocks, the John Smith and William Joe testimonials, the "Pharma Research" service list, and the `localhost/wordpress/unixco` links. These are placeholder content from the original theme, not CARISCA's.
- **The `/contact-us/` page body**: a broken shortcode containing template data ("+57 2651…", "example@gmail.com"). It is replaced by verified contact settings and a working form.
- **Partner logo grids** on `/industry/*`: the images are unnamed (`1-1.png` … `16-1.png`), so the organisations can't be identified reliably. Supply a named list of partners and approved logos.
- **Two oversized stock photos** (over 20 MB) and `happy-farm-girl.jpg`, which returns 404 on the legacy site.
- **WordPress users, comments and tags (289)**: not required by the new information architecture. Topic categories were assigned by keyword rules during import and should be spot-checked.
- **Videos** (7 MP4s): not referenced by migrated content. Host on YouTube or Vimeo and embed if needed.

## 6. What the current website administrator should supply

1. Approved photography for the homepage hero, focus-area cards and page banners (sizes are in `website-audit.md` §10.2).
2. Approved partner logos (SVG preferred) and the confirmed partner list.
3. Correct portraits for the three people listed in §4, and current biographies.
4. Mission and vision statements; confirmation of the accreditation claim.
5. Missing LMI values and the Q3 2023 report PDF.
6. If available, a full WordPress export (Tools › Export) or a database dump. That would allow comparing against unpublished or private content, which the public API cannot reveal.

## 7. Cut-over checklist

1. Deploy the new API and frontend to staging subdomains, run migrations, seed, import with media, and create the first administrator.
2. Work through the review list (§4); publish or keep drafts as appropriate.
3. Freeze edits on WordPress. Re-run `import:wordpress` to pick up any posts published since the first import; existing records are kept.
4. Point `carisca.knust.edu.gh` to the new frontend and `api.carisca.knust.edu.gh` to the API, then check `/sitemap.xml` and a sample of old URLs (they should return 301 to the new pages).
5. Submit the new sitemap in Google Search Console. Monitor **Admin › URL redirects** hit counts and the server's 404 logs for missed URLs during the first weeks.
