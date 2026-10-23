# CARISCA Website Audit

Audit date: 21 October 2026
Auditor: reconstruction project (automated inspection plus manual review of the extracted content)

## 0. Method

| Source | How it was inspected |
|---|---|
| `https://carisca.knust.edu.gh/` live HTML | Downloaded homepage HTML. Parsed the main menu (`#menu-1-9c1af53`), footer, colours and fonts from the Elementor CSS. |
| WordPress REST API `wp-json/wp/v2/*` | Publicly accessible. Exported **114 pages, 132 posts, 21 categories, 289 tags and 770 media items**, with full rendered HTML. |
| The Events Calendar API `wp-json/tribe/events/v1/events` | Publicly accessible. Exported **95 events** (Sep 2020 – Jul 2026). |
| Selected live pages | `/events/`, `/contact-us/`, `/news-events/`, rendered to text to compare the live output with the stored content. |
| Link checks | HTTP status checked for every navigation, footer and important external link (see §7). |
| `https://www.knust.edu.gh/` | Homepage HTML and CSS downloaded. Structure, menus, colours and fonts extracted. |
| `websys.knust.edu.gh/webdocs/` | `siteLayout.html` and `contentStructure.html` read. The image size table was captured. |

No WordPress administrator access, database dump or server files were available. Everything below comes from publicly served content. Facts that are uncertain are marked **⚠ REVIEW**.


## 1. Pages and links inspected

### 1.1 Primary navigation (live, as rendered)

```
Home                         → /
About Us                     → /about-us/about-us/
  Center Director's Message  → /about-us/centre-driectors-message/   (sic: "driectors")
  Meet the Team              → /meet-the-team/
  What We Do?                → /what-we-do/
Research                     → /component-1-research/
  Publications & Resources   → /research/our-resources/
  Logistics Managers Index   → /lmi/
  ASN-RA                     → /asn-ra/
Stakeholder Engagement       → /component-2-stakeholder-engagement/
CARISCA CPDs                 → /curricula-training/
  Upcoming CPDs              → /training/cpd/
News & Events                → /news-events/   (empty page)
  News & Press Releases      → /news-events/news-press-releases/
  CARISCA Newsletter         → /carisca-newsletters/
  CARISCA Upcoming Events    → /events/   (The Events Calendar archive)
2026 Summit                  → https://summit2026.carisca.org/index.php   (external, HTTP 200)
ISCEA                        → /international-certified-supply-chain-education-alliance-iscea/
```

### 1.2 Footer (live)

- CARISCA wordmark logo
- **Contact us:** 024-469-2953 · info@carisca.knust.edu.gh. The email is rendered as `href="#"`, so it is not clickable; this is a defect.
- **Follow us:** Facebook `facebook.com/carisca.supply.chain` · WhatsApp community `chat.whatsapp.com/CqKi3Kcdvf4EvU9nGPzGbw` · LinkedIn `gh.linkedin.com/company/carisca`
- **Location:** KNUST School of Business, Postgraduate Block E, Second Floor
- © 2024, CARISCA, KNUST. All Rights Reserved. The year is stale.
- The header also carries the KNUST logo (white, 253×50) next to the CARISCA lockup.

### 1.3 All published WordPress pages (114)

Grouped by purpose. The paths are the existing URLs.

| Group | Pages |
|---|---|
| **About** | `/about-us/` (empty parent), `/about-us/about-us/`, `/about-us/centre-driectors-message/`, `/about-us/mission-and-vision/` (slogan only: "Transforming Supply Chains to Bring Change in Africa"), `/about-us/management/`, `/meet-the-team/` |
| **What we do** | `/what-we-do/`, `/what-we-do/industry-engagement/`, `/what-we-do/professional-training-and-education/`, `/what-we-do/research-capacity-development/` |
| **Components** | `/component-1-research/`, `/component-2-stakeholder-engagement/`, `/curricula-training/` |
| **Research** | `/research/`, `/research/our-resources/`, `/research/journal-articles/`, `/research/book-publications/`, `/research/conferences-and-talks/`, `/research-faculty/`, `/research-capacity-workshop/`, `/research-page/` (theme demo) |
| **Research initiatives** | `/lmi/`, `/ghanas-first-logistics-managers-index-reveals-growth-in-logistics-activities/`, `/asn-ra/`, `/innovations/` (CARISCA Innovations Lab), `/distinguished-lecture-series/`, `/carisca-dissertation-awards/`, `/scholarship/` |
| **Industry / stakeholders** | `/industry/`, `/industry/local-ghanaian-partners/`, `/industry/african-regional-partners/`, `/industry/international-partners/`, `/industry/consultancy-services/`, `/industry/supply-chain-action-laboratory-engagement-scale/` (titled "Supply Chain Action Network (SCAN)") |
| **Training** | `/training/`, `/training/academic-programs/`, `/training/cpd/`, `/training/cpd/masterclass-experience/`, `/training/executive-training/`, `/training/short-course-certification/`, `/cariscaprogrammes/` (Call for Facilitators), `/new-supply-chain-graduate-programmes/`, three degree programme pages (BSc LSCM, MSc/MPhil LSCM, MSc PSCM), `/designing-and-delivering-circular-supply-chains-for-success-in-african-markets/`, `/sustaining-cost-effective-resilient-supply-chains/`, `/international-business-why-care-about-africa/`, `/registration-continuing-and-professional-executive-training-workshop/` |
| **ISCEA** | `/international-certified-supply-chain-education-alliance-iscea/` |
| **Summits & forums** | `/supply-chain-research-summit/`, `/2022-carisca-summit-call-for-papers/`, `/carisca-2022-supply-chain-research-summit/`, `/2022summitvirtuallobby/` (empty), `/2023-supply-chain-research-summit/`, `/2024-callforpapers/`, `/2024-phd-dissertation-award-competition-2/`, `/2024-pre-conference-paper-development-workshop/`, `/2024businessforum/`, `/2025-supply-chain-research-summit/`, `/2026-supply-chain-research-summit/` |
| **News & events** | `/news-events/` (empty), `/news-events/news-press-releases/` (archive, paginated `/2/`…), `/news-events/events/` (empty, superseded by `/events/`), `/news-events/news-press-releases/gallery/`, `/carisca-newsletters/` |
| **People (legacy individual profile pages)** | 30 pages, e.g. `/about-us/our-team/professor-nathaniel-boso/`, `/dr-dominic-essuman/`, `/prof-adegoke-oke/`, `/prof-dale-rogers/`, `/dr-roseanne-schuster/`, `/kwame-owusu-kwateng/`, and 10 pages under `/research/research-assistants__trashed/…`, a parent that has been trashed |
| **Contact** | `/contact-us/` (broken, see §7), `/contact/` (empty) |
| **Theme leftovers** | `/our-books/`, `/our-events/`, `/our-team/`, `/other-pages/`, `/research-page/` — demo content from the original theme |

### 1.4 Posts (132)

132 posts dated 21 Aug 2020 – 10 Jul 2026. 110 have a featured image and 98 of those resolve in the media library. Category usage:

| WP category | Posts | Map to |
|---|---:|---|
| New and Press Release (`news-and-press-release`, sic "New") | 104 | News & Press Releases |
| Announcements | 17 | Announcements / Calls |
| Blog | 17 | News (tag: Blog), mostly Distinguished Lecture write-ups and features |
| Profile stories | 10 | Staff & alumni stories |
| Conferences and Talks | 10 | Research highlights / events coverage |
| Project News | 8 | Project updates |
| Industry Report | 3 | Research highlights. The underlying reports are publications. |
| Journals | 2 | Research highlights |
| Business / Startup / Technology / Uncategorized | 2 / 1 / 1 / 3 | Fold into the categories above |
| Blog Grid, Latest News 2/Left/Right, Science, Service, Books, Events, **Online Dating** | 0 | **Drop**. These are theme leftovers or spam. |

### 1.5 Events (95, via The Events Calendar)

Event types found: stakeholder meetings, Supply Chain Action Network (SCAN/SCALE) meetings, Distinguished Lecture Series, CARISCA Training Series, Research Capacity-Building Workshops, Paper Development Workshops, Supply Chain Research Summits (2021–2026), the Supply Chain Business Forum & Exhibition, CPD workshops, and Advisory Board/PCC meetings.

As of the audit date **there are no upcoming events**. The most recent is the 2026 Supply Chain Research Summit, 6–8 Jul 2026, at the Cedi Conference Center, University of Ghana, with external site summit2026.carisca.org. Venues and costs are often empty. Two events have no title (IDs 12393 and 12573) **⚠ REVIEW**.

### 1.6 KNUST reference

- `https://www.knust.edu.gh/` homepage, menus and footer. See §5.
- `https://websys.knust.edu.gh/webdocs/siteLayout.html` defines the regions: header with logos, a main menu that only the webmaster can change, breadcrumbs, and on the homepage a carousel (title, caption, image, button link and text), news (title, body, featured image, category, date), events (title, body, start/end, time, venue), announcements (title, body, optional file), people (name, title, image, lead, rank, category, detail link), galleries and programmes.
- `https://websys.knust.edu.gh/webdocs/contentStructure.html` sets the image sizes for unit sites. The ones that apply to a centre site: slideshow 1280×600–1600×600, article image 1000×500 (2:1), profile 250×300. Images should be ≤500 KB, uploads ≤2 MB, PDF is preferred and PDFs over 10 MB should be compressed.

---

## 2. Purpose of key pages and the content worth keeping

| Page | Purpose | Verified content to keep |
|---|---|---|
| About Us | Institutional overview | CARISCA is "a global center of excellence for training, generating, and translating supply chain management research and innovations into positive development outcomes for Ghana and across Africa." It is supported by **LEARN Logistics by Kühne Foundation**. It leverages a network of governmental, civil-society and industry partners. The page lists three "Seeks to" objectives. |
| Homepage | Positioning | Hero line **"Strong Supply Chains, Strong Communities"**. Key Objective paragraph: "CARISCA's key objective is to support higher education institutions in building the capacity necessary to provide best-in-class degree programs and training, facilitate research translation and utilization and engage stakeholders in best practices and policy changes that strengthen supply chains." Three focus areas. |
| Director's Message | Leadership voice | Full message from **Prof. Nathaniel Boso, PhD**, Centre Director. It describes CARISCA as established at KNUST in partnership with **Arizona State University (ASU)**. It claims "the only center of excellence in West Africa to hold the twin global professional accreditation for CIPS and CILT" **⚠ REVIEW**: this is an accreditation claim made in an older message, so keep it only after confirmation. |
| Mission & Vision | Slogan only | "Transforming Supply Chains to Bring Change in Africa". No formal mission or vision statement exists **⚠ REVIEW: supply one**. |
| What We Do | Three components | Component 1 Research, Component 2 Stakeholder Engagement, Component 3 Curricula & Training, each with a stated goal. |
| Component pages | Detail | Goal statements and descriptions, including AI/ML, blockchain, IoT and low-infrastructure solutions, PPA certification and CPD requirements. |
| Meet the Team | People | 11 Secretariat staff, 15 Senior Technical Advisors & Component Leads, and 7 Research Faculty (33 people), with names, roles and photos. See §6.3 for image issues. |
| Publications & Resources | Library | **10 practitioner/industry reports, 6 policy briefs, 13 journal articles** with PDF or DOI links. |
| LMI | Index | Explanation. The first report was released June 2022. "First of its kind in Africa". **11 quarterly report PDFs** (Q1 2022 – Q2 2025) and a link to the survey for Q1 2026. |
| ASN-RA | Research accelerator | **Africa Supply Network Research Accelerator**: the expansion is stated on the page. Inspired by ASU's CASN-RA. 21 researchers from 7 countries, a members table (21 rows: name, university, country), 5 projects, an event on 8 Oct 2025 (Zoom), and contact Prof. Adegoke Oke (`adegoke.Oke@asu.edu`). The page says "seven African countries" and lists Ghana, Nigeria, Kenya, Egypt, Ethiopia, South Africa and Uganda, but the member table includes **Tanzania** **⚠ REVIEW**. |
| Upcoming CPDs (`/training/cpd/`) | CPD offer | "Designing and Delivering Circular Supply Chains For Success in African Markets", 9 July 2026, in-person (Accra) and online (Zoom). Fee GH¢1500 in-person / GH¢1000 virtual. Facilitator Dr Simon Peter Nadeem. Registration at `https://cpd.carisca.org/`. **This date has passed**, so the CPD is archived as past. |
| ISCEA | Certification partnership | Four programmes: CSCA $1,100, CPLM $1,400, CSSCP $1,600, CHSCA $1,100, each with a brochure PDF. "Up to 75% discount" for Ghanaian professionals who register through CARISCA. Includes the "how it works" steps and a "Register your interest" form. |
| Newsletter | Archive | **Issues 1–13** (May 2021 – Jan 2026). Each has a cover, a PDF or Mailchimp link and an "In this issue" list for most issues. Labels conflict for issues 4 and 5: the link text says "2021", but the files are dated 2022 **⚠ REVIEW**. |
| News archive | Stories | 132 posts (see §1.4). |
| Events | Calendar | 95 events (see §1.5). |

---

## 3. Navigation and page relationships (current)

- The "Research" menu item links to Component 1 instead of `/research/`. The older `/research/` and `/training/` trees from 2020 are orphaned from the menu but still live.
- "CARISCA CPDs" links to Component 3 (Curricula & Training), and its child "Upcoming CPDs" links to `/training/cpd/`.
- "News & Events" is an empty page.
- People pages are flat top-level URLs (`/dr-dominic-essuman/`), not nested under the team page. Two duplicate profiles exist for Dominic Essuman (`/dominic-essuman/`, `/dr-dominic-essuman/`).
- Posts live at top-level slugs (`/{post-slug}/`). Events live at `/event/{slug}/`. Categories live at `/category/{slug}/`.

---

## 4. Brand identity (measured)

| Token | Value | Source |
|---|---|---|
| Primary blue | `#0F3B8F` | Most frequent brand colour in the Elementor CSS (27 uses) and the homepage (18) |
| Deep navy | `#0A2961` | Homepage section backgrounds |
| Ink navy | `#16163F` | Headings in the Elementor CSS. Close to the logo-lockup navy. |
| Accent sky | `#34CBF7` / `#0ABAF0` | Accent lines, buttons and hovers |
| Muted text | `#677289` | Body and meta text |
| Gold accent | `#D3B574` | Occasional highlight |
| Typeface | **Barlow** (Google Fonts) | Elementor global typography |
| Logo | `carisca-lockup.jpg` (2560×190, navy wordmark + full name) and `carisca-wordmark.png` (624×624, black on transparent, can be recoloured) | `wp-content/uploads` |
| KNUST mark | `knust-logo-white.png` (253×50, white on transparent) | Header |

**KNUST reference palette:** maroon `#8D0000`, green `#048E3F`, plus gold in the crest. Headings use Cinzel (serif); body text uses Open Sans.
**Decision:** CARISCA blue stays primary. KNUST maroon and gold are used only as a thin "institutional strip": the top utility bar accent and the affiliation line in the footer. This signals the relationship without taking over the identity.

---

## 5. KNUST visual patterns worth adapting

1. **Utility top bar** above the main header, carrying quick links, social icons and search. → CARISCA gets a thin navy bar: "A centre of KNUST", phone, email, Newsletter, 2026 Summit and Search.
2. **Mega-menu dropdowns** with a short description column and grouped links. → Used for About, Research and Training. The other menus stay simple dropdowns.
3. **Carousel** with title, caption and 1–2 buttons; the image is 1600×600. → An admin-managed hero with 1920×800 (2.4:1) slides and pause/next controls.
4. **"News & Events"**: one large *Top Story* plus a list of 4–5 dated items, with an **Announcements** column beside it. → The same split on the CARISCA homepage, with a "Calls & Announcements" sidebar.
5. **Research & Innovation spotlight** pairing a research summary with a researcher profile. → A "Research spotlight" of a featured publication with its abstract.
6. **Subscribe band** before the footer. → Newsletter subscription band.
7. **Multi-column footer** with grouped links and an institutional line. → A 4-column footer.
8. KNUST shows full dates ("Published: 20 Oct 2026") and category labels on every news card. → Adopted.

Patterns **not** carried over: the Cinzel display serif, which is too ceremonial for a research centre; the embedded Twitter feed; and the dense "Students/Staff" mega-menus.

---

## 6. Content inventory and gaps

### 6.1 Retain (migrated)

- All 132 posts, which become Articles. Titles, dates, bodies, categories and featured images are preserved.
- The 95 events, which become Events, with dates, venues, cost text, images and external links.
- 29 publications (10 reports, 6 policy briefs, 13 journal articles) and 11 LMI reports.
- Newsletter issues 1–13.
- 33 team members across 3 groups, with roles and portraits.
- ASN-RA members and projects, and the ISCEA programmes.
- The core pages (About, Director's message, Components, What we do, LMI, ASN-RA, ISCEA, Stakeholder Engagement, Curricula & Training, Industry pages, Distinguished Lecture Series, Innovations Lab, Dissertation Awards, Scholarships, Academic Programmes).

### 6.2 Drop, or keep only as a redirect

Theme demo pages (`/our-books/`, `/our-events/`, `/our-team/`, `/other-pages/`, `/research-page/`, `/contact/`, `/2022summitvirtuallobby/`), the "Online Dating" category, the homepage's leftover demo blocks ("Research Advisory", "John Smith" testimonials, the "Pharma Research" service list, `localhost/wordpress/unixco` links), and the trashed research-assistant tree.

### 6.3 Missing, broken, inaccessible or uncertain

| # | Issue | Severity |
|---|---|---|
| 1 | `/contact-us/` renders a raw `[kc_row …]` shortcode containing **template placeholder data** (phone "+57 2651 2658 3659", "example@gmail.com", lorem ipsum). There is no working contact form. | High |
| 2 | The footer email link is `href="#"`. | Medium |
| 3 | `/news-events/`, `/news-events/events/`, `/about-us/` and `/contact/` are empty pages. | Medium |
| 4 | Meet the Team image mismatches: **Dr. John Manso-Frimpong** uses `Muntaka-1.png`, and **Prof. Joseph Van Orden** uses `Muntaka-2.png`. These are probably wrong portraits **⚠ REVIEW**. Martha Adzraku uses `CSO-Maame-Dentu.jpg` **⚠ REVIEW**. | High |
| 5 | Spelling: "Emmaunuel" (×2) and "Dr.Owusu Acheampong" on Meet the Team; "driectors" in the URL; "New and Press Release" category; "CARSICA" in the CPD facilitator bio. | Low |
| 6 | No formal mission or vision statement exists. | Medium |
| 7 | The CIPS/CILT "twin accreditation" claim in the Director's message needs confirmation. | Medium |
| 8 | ASN-RA's "seven countries" does not match its member table (8 countries). | Low |
| 9 | LMI headline values in news posts conflict: Q1 2022 is given as both **64.7** and **64**; Q1 2025 is given as **63.5**, but the Q2 2025 text says "down from **63**". | Medium |
| 10 | `research.wpcarey.asu.edu/carisca/…` links (newsletter issue 10) return HTTP **523**. | Low |
| 11 | `carisca.org` returns HTTP **500**. The subdomains `summit2026.carisca.org` and `cpd.carisca.org` are fine. | Info |
| 12 | Two events have no title (IDs 12393, 12573), and many events have no venue. | Low |
| 13 | 12 posts reference a featured image that no longer exists in the media library. | Low |
| 14 | No partner logos are published as a set. The partner names appear only in prose on the `/industry/*` pages. | Medium |
| 15 | The homepage "Upcoming Events" widget is empty, because there are no upcoming events. | Info |
| 16 | No staff biographies exist on Meet the Team. The legacy profile pages (2020–2021) hold bios, but their roles may be outdated **⚠ REVIEW**. | Medium |

All pages listed in this document were reachable. **No page was inaccessible** at audit time, apart from the external links noted in rows 10 and 11.

---

## 7. Link check (key destinations)

| URL | Status |
|---|---|
| `/events/`, `/news-events/news-press-releases/2/`, `/category/news-and-press-release/`, `/training/cpd/` | 200 |
| `https://summit2026.carisca.org/index.php` | 200 (open in a new tab; external) |
| `https://cpd.carisca.org/` (CPD registration) | 200 (external) |
| `https://www.surveymonkey.com/r/Q12026LMI` (LMI survey) | 200 (external) |
| Facebook, LinkedIn, WhatsApp community | 200 |
| `https://isceaonline.com/` | 200, redirects to `www.` |
| `https://mailchi.mp/carisca/introducing-the-carisca-report-e-newsletter` | 200, redirects to issue-11 |
| `https://research.wpcarey.asu.edu/carisca/` | **523** |
| `https://carisca.org/` | **500** |

**External destinations kept external:** the 2026 Summit (summit2026.carisca.org), the CPD registration portal (cpd.carisca.org), the LMI survey (SurveyMonkey), the 2025 Summit (summit2025.carisca.org), the Business Forum (cariscabusinessforum.com), ISCEA online (isceaonline.com) and Zoom registrations. They open in a new tab with an "external" indicator.

---

## 8. Proposed navigation

```
Utility bar: A centre of KNUST · 024-469-2953 · info@carisca.knust.edu.gh · Newsletter · Search

Home
About                       (mega)
  About CARISCA             /about
  Centre Director's Message /about/directors-message
  Meet the Team             /about/team
  What We Do                /about/what-we-do
  Partners                  /about/partners
Research                    (mega)
  Research Overview         /research
  Research Projects         /research/projects
  Publications & Resources  /publications
  Logistics Managers Index  /lmi
  ASN-RA                    /asn-ra
  Distinguished Lectures    /research/distinguished-lecture-series
Stakeholder Engagement      /stakeholder-engagement
Training                    (mega)
  Curricula & Training      /training
  CPD Programmes            /training/cpd
  Upcoming CPDs             /training/cpd#upcoming
  ISCEA Certifications      /training/iscea
  Academic Programmes       /training/academic-programmes
News & Events
  News & Press Releases     /news
  Announcements & Calls     /news?type=announcement
  Events                    /events
  Newsletter                /newsletters
  Gallery                   /gallery
2026 Summit ↗               https://summit2026.carisca.org/
Contact                     /contact
```

All items are stored in the `menu_items` table and editable in the admin panel. The tree above is the seed.

---

## 9. Reusable page templates

| Template | Used by |
|---|---|
| `StandardPage` (page header, breadcrumbs, rich body, optional sidebar of sibling links) | About, Components, What we do, Stakeholder Engagement, Training, ISCEA, ASN-RA, LMI intro, all CMS pages |
| `ArchiveList` (filters, search, paginated cards) | News, Publications, Events, Newsletters, CPD, Research projects |
| `ArticleDetail` | News, press releases, announcements |
| `PublicationDetail` | Publications |
| `EventDetail` | Events (upcoming and past) |
| `ProfileGrid` and `ProfileDetail` | Team |
| `CpdProgrammeDetail` (with sessions and a registration form) | CPD |
| `LmiDashboard` (chart from stored values, report list) | LMI |
| `GalleryGrid` | Gallery |
| `ContactPage` (details, map link, form) | Contact |
| `SearchResults` | Search |

---

## 10. Image and document inventory

### 10.1 Existing assets (from the media library: 770 items, ~460 MB)

| Type | Count |
|---|---:|
| JPEG | 396 |
| PNG | 238 |
| SVG | 28 |
| GIF | 5 |
| PDF | 92 |
| MP4 | 7 |
| DOCX / TXT / ZIP | 1 / 2 / 1 |

Key existing images:

| Asset | Size | Use |
|---|---|---|
| `2025/07/0X3A0297-scaled.jpg` | 2560×1707 | Homepage hero (live) |
| `2026/01/banner-scaled.jpg` | 2560×877 | Homepage hero slide 2 (live) |
| `2023/07/MG_9974-scaled.jpg` | 2560×1707 | Stakeholder Engagement header |
| `2020/08/happy-farm-girl.jpg` | — | About page |
| `2023/05/Copy-of-Ghana-LMI-Email-Header-1024-×-1024px.png` | 1024×1024 | LMI |
| `2026/02/CARISCA-Newsletter-Issue-13.png` | 1545×1999 | Newsletter cover |
| Staff portraits | Mixed: square PNGs (2025), 268×300 JPGs, etc. | Team |
| Post featured images | Mostly 3:2. Others are 1:1, 5:4, 16:9 and 1.9:1. | News |

Because the existing featured images come in mixed aspect ratios, every card uses **`object-fit: cover` in a fixed-ratio frame**. Posters and flyers, such as square event graphics, use **`contain`** on a neutral background so their text is not cropped.

### 10.2 Image slots and placeholders

| Slot | Dimensions | Ratio | Fit | Placeholder file |
|---|---:|---:|---|---|
| Homepage hero | 1920×800 | 2.4:1 | cover | `carisca-home-hero-placeholder.svg` |
| Page header banner | 1920×480 | 4:1 | cover | `page-banner-placeholder.svg` |
| Focus area card | 800×600 | 4:3 | cover | `research-feature-placeholder.svg`, `stakeholder-engagement-placeholder.svg`, `training-programme-placeholder.svg` |
| News thumbnail | 800×500 | 1.6:1 | cover | `news-thumbnail-placeholder.svg` |
| Article featured image | 1200×675 | 16:9 | cover | `news-feature-placeholder.svg` |
| Staff portrait | 600×750 | 4:5 | cover (top) | `staff-portrait-placeholder.svg` |
| Publication cover | 600×850 | ≈0.71:1 | cover | `publication-cover-placeholder.svg` |
| Newsletter cover | 600×776 | ≈0.77:1 | contain | `newsletter-cover-placeholder.svg` |
| Event banner | 1200×630 | ≈1.9:1 | contain on navy | `event-banner-placeholder.svg` |
| Partner logo | 600×300 (SVG preferred) | keep original | contain | `partner-logo-placeholder.svg` |
| Gallery image | 1200×800 | 3:2 | cover | `gallery-image-placeholder.svg` |
| Open Graph default | 1200×630 | 1.91:1 | — | `og-default.png` (generated from the logo) |

Each placeholder shows its label, intended dimensions and ratio on a neutral, hatched background, so it can't be mistaken for a photograph. Placeholders render through the `<CmsImage>` component whenever a record's image is empty. Assigning an image in the admin panel replaces the placeholder with no code change.

### 10.3 Documents

- 92 PDFs in total. Those linked from Publications, LMI, Newsletters and ISCEA (≈50) are migrated as media assets.
- No document is missing, and every listed report PDF resolved during the spot check.
