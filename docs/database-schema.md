# Database schema

MySQL 8 (InnoDB, `utf8mb4_unicode_ci`). It is created only through migrations (`backend/src/migrations`, applied with Umzug and recorded in `schema_migrations`). `sequelize.sync()` is never used. Timestamps are stored in UTC (`DB_TIMEZONE=+00:00`); Ghana is UTC+0 all year.

## Conventions

- Integer primary keys: `INT UNSIGNED AUTO_INCREMENT`; `audit_logs` uses `BIGINT`.
- Every content table has `created_at` and `updated_at`. Tables marked **soft-delete** also have `deleted_at` (Sequelize "paranoid" mode): deleted rows are hidden from every query but can be restored.
- **Publishable** tables have `status ENUM('draft','review','published','archived')` and `published_at DATETIME`. Public content means `status='published' AND published_at <= NOW()`.
- **Authorship** columns are `created_by` and `updated_by` (FK → `users`, `ON DELETE SET NULL`) plus `review_note TEXT`, an internal note that flags content needing verification. It is never exposed publicly.
- **SEO** columns are `seo_title`, `seo_description` and `og_image_id`.
- **Media references** are nullable FKs to `media_assets` with `ON DELETE SET NULL`. The media service also refuses to delete a file that is still referenced.
- Long-form HTML uses `MEDIUMTEXT`; it is sanitised before storage.
- Unique slugs are generated server-side (`title` → `slug`, then `-2`, `-3`, …, counting soft-deleted rows too).

## Identity and access

| Table | Key columns | Notes |
|---|---|---|
| `roles` | `name` UNIQUE, `label`, `is_system` | super_admin, admin, editor, author, reviewer |
| `permissions` | `key` UNIQUE (`module.action`), `group` | Synced from `config/permissions.ts` on every seed |
| `role_permissions` | PK (`role_id`, `permission_id`) | Cascade on delete |
| `users` | `email` UNIQUE, `password_hash` (bcrypt), `status`, `failed_login_count`, `locked_until`, `last_login_at` | soft-delete; the default scope never selects `password_hash` |
| `user_roles` | PK (`user_id`, `role_id`) | Cascade |
| `sessions` | `id` CHAR(64) = SHA-256 of the cookie token, `user_id`, `csrf_token`, `expires_at`, `last_seen_at` | Indexed on `user_id` and `expires_at`; expired rows are purged hourly |
| `password_reset_tokens` | `token_hash` UNIQUE, `expires_at`, `used_at` | Single use, 60-minute life |

## Media

| Table | Key columns | Notes |
|---|---|---|
| `media_assets` | `kind` (image/document/video/other), `visibility` (public/private), `filename` UNIQUE, `original_name`, `mime_type`, `size_bytes`, `width`, `height`, `alt_text`, `caption`, `storage_path`, `checksum` (SHA-256), `source_url` (legacy URL for imported files), `uploaded_by` | soft-delete; indexed on (`kind`, `created_at`) and `checksum`. Binary files live on disk, not in MySQL. |

## Pages and navigation

| Table | Key columns | Notes |
|---|---|---|
| `pages` | `path` UNIQUE (e.g. `about/directors-message`), `parent_id` → pages, `template`, `summary`, `body`, `hero_image_id`, `sort_order`, `show_in_sitemap`, `legacy_url` | publishable, SEO, authorship, soft-delete. FULLTEXT(`title`, `summary`, `body`). Parent cycles are rejected by the API. |
| `menus` | `key` UNIQUE (main, footer, utility) | |
| `menu_items` | `menu_id` → menus CASCADE, `parent_id` → menu_items CASCADE, `label`, `url`, `page_id` → pages SET NULL, `description`, `open_in_new_tab`, `is_enabled`, `sort_order` | Index (`menu_id`, `parent_id`, `sort_order`). Saved as a whole tree (at most 3 levels), so cycles are impossible. |
| `homepage_slides` | `title`, `caption`, `image_id`, `image_alt`, button labels and URLs, `sort_order`, `starts_at`, `ends_at` | publishable, soft-delete. Display window is filtered in the API. |
| `redirects` | `from_path` UNIQUE, `to_path`, `status_code` (301/302/308), `is_enabled`, `hits` | Legacy WordPress URL map |

## News

| Table | Key columns | Notes |
|---|---|---|
| `categories` | `slug` UNIQUE, `name`, `sort_order` | Topics such as Research, LMI, Training & CPD |
| `articles` | `type` ENUM(news, press_release, announcement, call, research_highlight, project_update, story, newsletter_announcement), `slug` UNIQUE, `excerpt`, `body`, `featured_image_id`, `attachment_id`, `author_name`, `deadline_at`, `is_featured`, `legacy_url` | publishable, SEO, soft-delete. Indexes (`status`, `published_at`) and (`type`, `status`, `published_at`). FULLTEXT(`title`, `excerpt`, `body`). |
| `article_categories` | PK (`article_id`, `category_id`) | Cascade both ways. Category filters use a subquery so pagination stays correct. |

## Research and publications

| Table | Key columns | Notes |
|---|---|---|
| `research_themes` | `slug` UNIQUE, `summary`, `description`, `icon`, `image_id`, `sort_order` | publishable |
| `research_projects` | `theme_id` → themes SET NULL, `slug` UNIQUE, `summary`, `problem`, `contribution`, `relevance`, `body`, `project_status`, `programme`, `start_year`, `end_year`, `lead_researchers`, `team`, `image_id`, `is_featured` | publishable, SEO. FULLTEXT(`title`, `summary`, `body`). |
| `publications` | `type` ENUM(research_report, industry_report, policy_brief, journal_article, working_paper, research_summary, book, conference_paper, other), `slug` UNIQUE, `authors`, `abstract`, `body`, `publication_year`, `published_on`, `venue`, `doi`, `external_url`, `citation`, `cover_image_id`, `file_id`, `research_project_id` → projects SET NULL, `is_featured` | publishable, SEO. Index (`status`, `type`, `publication_year`). FULLTEXT(`title`, `authors`, `abstract`). |
| `lmi_reports` | `slug` UNIQUE, `year`, `quarter`, `period_label`, `lmi_value` DECIMAL(5,1), `future_lmi_value`, `value_source_url`, `summary`, `body`, `file_id`, `cover_image_id` | publishable. UNIQUE (`year`, `quarter`). Values are entered only from published reports or releases; `value_source_url` records where each came from. |
| `lmi_indicator_values` | `report_id` → reports CASCADE, `indicator` (e.g. `inventory_levels`), `label`, `value` DECIMAL(5,1) | UNIQUE (`report_id`, `indicator`) |

## People and partners

| Table | Key columns | Notes |
|---|---|---|
| `staff_groups` | `slug` UNIQUE, `name`, `description`, `sort_order` | Secretariat; Senior Technical Advisors & Component Leads; Research Faculty |
| `staff_profiles` | `group_id` → groups SET NULL, `slug` UNIQUE, `name`, `position`, `department`, `bio`, `qualifications`, `email`, profile links, `photo_id`, `sort_order`, `legacy_url` | publishable, soft-delete. A public profile page exists only when `bio` is set. |
| `partners` | `slug` UNIQUE, `partner_type` ENUM(host, funder, academic, industry, public_sector, professional_body, other), `description`, `website_url`, `logo_id`, `is_featured`, `sort_order` | publishable |

## Training and events

| Table | Key columns | Notes |
|---|---|---|
| `cpd_programmes` | `slug` UNIQUE, `summary`, `description`, `target_audience`, `learning_objectives`, `facilitators`, `duration`, `delivery_format`, `fee_text`, `registration_url`, `image_id` | publishable, SEO. FULLTEXT(`title`, `summary`, `description`). |
| `cpd_sessions` | `programme_id` → programmes CASCADE, `starts_at`, `ends_at`, `venue`, `delivery_mode`, `fee_text`, `capacity`, `registration_status` ENUM(open, closed, full, cancelled), `registration_url`, `allow_online_registration` | soft-delete. Index (`programme_id`, `starts_at`). |
| `cpd_registrations` | `session_id` → sessions CASCADE, `full_name`, `email`, `phone`, `organisation`, `job_title`, `attendance_mode`, `notes`, `consent_at`, `status` ENUM(pending, confirmed, waitlisted, cancelled), `ip_hash` | UNIQUE (`session_id`, `email`). Capacity is enforced inside a transaction with a row lock on the session. Private data. |
| `events` | `slug` UNIQUE, `event_type` ENUM(workshop, conference, summit, lecture, training, meeting, webinar, forum, call_for_papers, other), `summary`, `body`, `starts_at`, `ends_at`, `all_day`, `venue`, `location_type`, `cost_text`, `registration_url`, `website_url`, `image_id`, `gallery_id` → galleries SET NULL, `is_featured`, `legacy_url` | publishable, SEO. Index (`status`, `starts_at`). FULLTEXT(`title`, `summary`, `body`). |
| `event_attachments` | `event_id` CASCADE, `media_id` CASCADE, `label`, `sort_order` | Downloadable materials |
| `newsletters` | `issue_number` UNIQUE, `slug` UNIQUE, `published_on`, `summary`, `highlights` (HTML), `cover_image_id`, `file_id`, `online_url` | publishable |
| `galleries` / `gallery_items` | gallery: `slug` UNIQUE, `cover_image_id`; item: `gallery_id` CASCADE, `media_id` CASCADE, `caption`, `sort_order` | publishable |

## Inbound data and configuration

| Table | Key columns | Notes |
|---|---|---|
| `contact_submissions` | `topic`, `name`, `email`, `phone`, `organisation`, `subject`, `message`, `details` (JSON text, e.g. the ISCEA programme chosen), `status` ENUM(new, read, replied, archived, spam), `ip_hash`, `user_agent`, `handled_by` | Never exposed by the public API. Index (`status`, `created_at`). |
| `newsletter_subscribers` | `email` UNIQUE, `status` ENUM(pending, subscribed, unsubscribed), `consent_text`, `consented_at`, `confirm_token_hash`, `confirmed_at`, `unsubscribe_token` UNIQUE, `source`, `ip_hash` | Consent wording is stored with each sign-up |
| `site_settings` | `key` UNIQUE, `value`, `group`, `label`, `type`, `is_public` | Contact details, social links, homepage text, SEO defaults. Seeding never overwrites edited values. |
| `audit_logs` | `user_id` SET NULL, `user_email` (snapshot), `action`, `entity_type`, `entity_id`, `summary`, `changes` (JSON text diff; long fields abbreviated; secrets excluded), `ip_hash`, `user_agent`, `created_at` | Indexes (`entity_type`, `entity_id`), (`user_id`, `created_at`), `created_at` |
| `schema_migrations` | `name` | Managed by Umzug |

## Deletion behaviour

- Content deletions are soft (restorable via `POST /api/v1/admin/<resource>/:id/restore`). Child rows (sessions, menu items, gallery items, indicators, registrations) cascade when their parent row is removed physically.
- A media file is hard-deleted from disk and database only when no record and no rich-text body references it.
- Deleting a user does not delete their content; authorship FKs become `NULL`.
- At least one active Super Administrator must always remain; the API enforces this.

## Backups

Back up the database and `STORAGE_DIR` together (see `docs/cpanel-deployment.md` §12). Media rows point to files by `storage_path`, so restoring one without the other leaves broken links.
