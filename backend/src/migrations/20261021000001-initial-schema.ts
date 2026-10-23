import { DataTypes, QueryInterface, type ModelAttributes } from 'sequelize';
import type { MigrationFn } from 'umzug';

type Ctx = { context: QueryInterface };

const id = { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false };
const timestamps = {
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
};
const softDelete = { deleted_at: { type: DataTypes.DATE, allowNull: true } };

const fk = (table: string, onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT', allowNull = true) => ({
  type: DataTypes.INTEGER.UNSIGNED,
  allowNull,
  references: { model: table, key: 'id' },
  onUpdate: 'CASCADE',
  onDelete,
});

const status = {
  status: {
    type: DataTypes.ENUM('draft', 'review', 'published', 'archived'),
    allowNull: false,
    defaultValue: 'draft',
  },
  published_at: { type: DataTypes.DATE, allowNull: true },
};

const seo = {
  seo_title: { type: DataTypes.STRING(255), allowNull: true },
  seo_description: { type: DataTypes.STRING(500), allowNull: true },
  og_image_id: fk('media_assets', 'SET NULL'),
};

const authorship = {
  review_note: { type: DataTypes.TEXT, allowNull: true },
  created_by: fk('users', 'SET NULL'),
  updated_by: fk('users', 'SET NULL'),
};

const tableOptions = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' };

async function create(qi: QueryInterface, name: string, attrs: ModelAttributes) {
  await qi.createTable(name, attrs, tableOptions);
}

export const up: MigrationFn<QueryInterface> = async ({ context: qi }: Ctx) => {
  // ---------------------------------------------------------------- identity
  await create(qi, 'roles', {
    id,
    name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    label: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.STRING(500), allowNull: true },
    is_system: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    ...timestamps,
  });

  await create(qi, 'permissions', {
    id,
    key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    label: { type: DataTypes.STRING(150), allowNull: false },
    group: { type: DataTypes.STRING(60), allowNull: false },
    ...timestamps,
  });

  await create(qi, 'role_permissions', {
    role_id: { ...fk('roles', 'CASCADE', false), primaryKey: true },
    permission_id: { ...fk('permissions', 'CASCADE', false), primaryKey: true },
  });

  await create(qi, 'users', {
    id,
    name: { type: DataTypes.STRING(150), allowNull: false },
    email: { type: DataTypes.STRING(191), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(100), allowNull: false },
    status: { type: DataTypes.ENUM('active', 'disabled'), allowNull: false, defaultValue: 'active' },
    failed_login_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    locked_until: { type: DataTypes.DATE, allowNull: true },
    last_login_at: { type: DataTypes.DATE, allowNull: true },
    password_changed_at: { type: DataTypes.DATE, allowNull: true },
    ...timestamps,
    ...softDelete,
  });

  await create(qi, 'user_roles', {
    user_id: { ...fk('users', 'CASCADE', false), primaryKey: true },
    role_id: { ...fk('roles', 'CASCADE', false), primaryKey: true },
  });

  await create(qi, 'sessions', {
    id: { type: DataTypes.CHAR(64), primaryKey: true, allowNull: false },
    user_id: fk('users', 'CASCADE', false),
    csrf_token: { type: DataTypes.CHAR(64), allowNull: false },
    ip: { type: DataTypes.STRING(64), allowNull: true },
    user_agent: { type: DataTypes.STRING(255), allowNull: true },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    last_seen_at: { type: DataTypes.DATE, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await qi.addIndex('sessions', ['user_id']);
  await qi.addIndex('sessions', ['expires_at']);

  await create(qi, 'password_reset_tokens', {
    id,
    user_id: fk('users', 'CASCADE', false),
    token_hash: { type: DataTypes.CHAR(64), allowNull: false, unique: true },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    used_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  // ---------------------------------------------------------------- media
  await create(qi, 'media_assets', {
    id,
    kind: { type: DataTypes.ENUM('image', 'document', 'video', 'other'), allowNull: false },
    visibility: { type: DataTypes.ENUM('public', 'private'), allowNull: false, defaultValue: 'public' },
    filename: { type: DataTypes.STRING(191), allowNull: false, unique: true },
    original_name: { type: DataTypes.STRING(255), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: true },
    mime_type: { type: DataTypes.STRING(120), allowNull: false },
    size_bytes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    width: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    height: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    alt_text: { type: DataTypes.STRING(500), allowNull: true },
    caption: { type: DataTypes.STRING(1000), allowNull: true },
    storage_path: { type: DataTypes.STRING(500), allowNull: false },
    checksum: { type: DataTypes.CHAR(64), allowNull: true },
    source_url: { type: DataTypes.STRING(1000), allowNull: true },
    uploaded_by: fk('users', 'SET NULL'),
    ...timestamps,
    ...softDelete,
  });
  await qi.addIndex('media_assets', ['kind', 'created_at']);
  await qi.addIndex('media_assets', ['checksum']);

  // ---------------------------------------------------------------- pages & navigation
  await create(qi, 'pages', {
    id,
    title: { type: DataTypes.STRING(255), allowNull: false },
    path: { type: DataTypes.STRING(191), allowNull: false, unique: true },
    parent_id: fk('pages', 'SET NULL'),
    template: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'standard' },
    summary: { type: DataTypes.TEXT, allowNull: true },
    body: { type: DataTypes.TEXT('medium'), allowNull: true },
    hero_image_id: fk('media_assets', 'SET NULL'),
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    show_in_sitemap: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    legacy_url: { type: DataTypes.STRING(500), allowNull: true },
    ...status,
    ...seo,
    ...authorship,
    ...timestamps,
    ...softDelete,
  });
  await qi.addIndex('pages', ['status', 'published_at']);
  await qi.addIndex('pages', ['title', 'summary', 'body'], { type: 'FULLTEXT', name: 'pages_fulltext' });

  await create(qi, 'menus', {
    id,
    key: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    ...timestamps,
  });

  await create(qi, 'menu_items', {
    id,
    menu_id: fk('menus', 'CASCADE', false),
    parent_id: fk('menu_items', 'CASCADE'),
    label: { type: DataTypes.STRING(120), allowNull: false },
    url: { type: DataTypes.STRING(500), allowNull: true },
    page_id: fk('pages', 'SET NULL'),
    description: { type: DataTypes.STRING(255), allowNull: true },
    open_in_new_tab: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    ...timestamps,
  });
  await qi.addIndex('menu_items', ['menu_id', 'parent_id', 'sort_order']);

  await create(qi, 'homepage_slides', {
    id,
    title: { type: DataTypes.STRING(255), allowNull: false },
    caption: { type: DataTypes.TEXT, allowNull: true },
    image_id: fk('media_assets', 'SET NULL'),
    image_alt: { type: DataTypes.STRING(500), allowNull: true },
    button_label: { type: DataTypes.STRING(80), allowNull: true },
    button_url: { type: DataTypes.STRING(500), allowNull: true },
    secondary_label: { type: DataTypes.STRING(80), allowNull: true },
    secondary_url: { type: DataTypes.STRING(500), allowNull: true },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    starts_at: { type: DataTypes.DATE, allowNull: true },
    ends_at: { type: DataTypes.DATE, allowNull: true },
    ...status,
    ...authorship,
    ...timestamps,
    ...softDelete,
  });

  // ---------------------------------------------------------------- news
  await create(qi, 'categories', {
    id,
    name: { type: DataTypes.STRING(120), allowNull: false },
    slug: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    description: { type: DataTypes.STRING(500), allowNull: true },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    ...timestamps,
  });

  await create(qi, 'articles', {
    id,
    type: {
      type: DataTypes.ENUM(
        'news',
        'press_release',
        'announcement',
        'call',
        'research_highlight',
        'project_update',
        'story',
        'newsletter_announcement',
      ),
      allowNull: false,
      defaultValue: 'news',
    },
    title: { type: DataTypes.STRING(300), allowNull: false },
    slug: { type: DataTypes.STRING(191), allowNull: false, unique: true },
    excerpt: { type: DataTypes.TEXT, allowNull: true },
    body: { type: DataTypes.TEXT('medium'), allowNull: true },
    featured_image_id: fk('media_assets', 'SET NULL'),
    attachment_id: fk('media_assets', 'SET NULL'),
    author_name: { type: DataTypes.STRING(150), allowNull: true },
    deadline_at: { type: DataTypes.DATE, allowNull: true },
    is_featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    legacy_url: { type: DataTypes.STRING(500), allowNull: true },
    ...status,
    ...seo,
    ...authorship,
    ...timestamps,
    ...softDelete,
  });
  await qi.addIndex('articles', ['status', 'published_at']);
  await qi.addIndex('articles', ['type', 'status', 'published_at']);
  await qi.addIndex('articles', ['title', 'excerpt', 'body'], { type: 'FULLTEXT', name: 'articles_fulltext' });

  await create(qi, 'article_categories', {
    article_id: { ...fk('articles', 'CASCADE', false), primaryKey: true },
    category_id: { ...fk('categories', 'CASCADE', false), primaryKey: true },
  });

  // ---------------------------------------------------------------- research
  await create(qi, 'research_themes', {
    id,
    name: { type: DataTypes.STRING(150), allowNull: false },
    slug: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    description: { type: DataTypes.TEXT('medium'), allowNull: true },
    icon: { type: DataTypes.STRING(50), allowNull: true },
    image_id: fk('media_assets', 'SET NULL'),
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    ...status,
    ...authorship,
    ...timestamps,
    ...softDelete,
  });

  await create(qi, 'research_projects', {
    id,
    theme_id: fk('research_themes', 'SET NULL'),
    title: { type: DataTypes.STRING(300), allowNull: false },
    slug: { type: DataTypes.STRING(191), allowNull: false, unique: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    problem: { type: DataTypes.TEXT, allowNull: true },
    contribution: { type: DataTypes.TEXT, allowNull: true },
    relevance: { type: DataTypes.TEXT, allowNull: true },
    body: { type: DataTypes.TEXT('medium'), allowNull: true },
    project_status: {
      type: DataTypes.ENUM('planned', 'ongoing', 'completed'),
      allowNull: false,
      defaultValue: 'ongoing',
    },
    programme: { type: DataTypes.STRING(150), allowNull: true },
    start_year: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
    end_year: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
    lead_researchers: { type: DataTypes.STRING(500), allowNull: true },
    team: { type: DataTypes.TEXT, allowNull: true },
    image_id: fk('media_assets', 'SET NULL'),
    is_featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    ...status,
    ...seo,
    ...authorship,
    ...timestamps,
    ...softDelete,
  });
  await qi.addIndex('research_projects', ['status', 'published_at']);
  await qi.addIndex('research_projects', ['title', 'summary', 'body'], {
    type: 'FULLTEXT',
    name: 'research_projects_fulltext',
  });

  await create(qi, 'publications', {
    id,
    type: {
      type: DataTypes.ENUM(
        'research_report',
        'industry_report',
        'policy_brief',
        'journal_article',
        'working_paper',
        'research_summary',
        'book',
        'conference_paper',
        'other',
      ),
      allowNull: false,
    },
    title: { type: DataTypes.STRING(500), allowNull: false },
    slug: { type: DataTypes.STRING(191), allowNull: false, unique: true },
    authors: { type: DataTypes.STRING(1000), allowNull: true },
    abstract: { type: DataTypes.TEXT, allowNull: true },
    body: { type: DataTypes.TEXT('medium'), allowNull: true },
    publication_year: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
    published_on: { type: DataTypes.DATEONLY, allowNull: true },
    venue: { type: DataTypes.STRING(300), allowNull: true },
    doi: { type: DataTypes.STRING(255), allowNull: true },
    external_url: { type: DataTypes.STRING(1000), allowNull: true },
    citation: { type: DataTypes.TEXT, allowNull: true },
    cover_image_id: fk('media_assets', 'SET NULL'),
    file_id: fk('media_assets', 'SET NULL'),
    research_project_id: fk('research_projects', 'SET NULL'),
    is_featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    ...status,
    ...seo,
    ...authorship,
    ...timestamps,
    ...softDelete,
  });
  await qi.addIndex('publications', ['status', 'type', 'publication_year']);
  await qi.addIndex('publications', ['title', 'authors', 'abstract'], {
    type: 'FULLTEXT',
    name: 'publications_fulltext',
  });

  await create(qi, 'lmi_reports', {
    id,
    title: { type: DataTypes.STRING(255), allowNull: false },
    slug: { type: DataTypes.STRING(191), allowNull: false, unique: true },
    year: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
    quarter: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
    period_label: { type: DataTypes.STRING(100), allowNull: false },
    lmi_value: { type: DataTypes.DECIMAL(5, 1), allowNull: true },
    future_lmi_value: { type: DataTypes.DECIMAL(5, 1), allowNull: true },
    value_source_url: { type: DataTypes.STRING(1000), allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    body: { type: DataTypes.TEXT('medium'), allowNull: true },
    file_id: fk('media_assets', 'SET NULL'),
    cover_image_id: fk('media_assets', 'SET NULL'),
    ...status,
    ...authorship,
    ...timestamps,
    ...softDelete,
  });
  await qi.addIndex('lmi_reports', ['year', 'quarter'], { unique: true, name: 'lmi_reports_period_unique' });

  await create(qi, 'lmi_indicator_values', {
    id,
    report_id: fk('lmi_reports', 'CASCADE', false),
    indicator: { type: DataTypes.STRING(80), allowNull: false },
    label: { type: DataTypes.STRING(150), allowNull: false },
    value: { type: DataTypes.DECIMAL(5, 1), allowNull: false },
    ...timestamps,
  });
  await qi.addIndex('lmi_indicator_values', ['report_id', 'indicator'], {
    unique: true,
    name: 'lmi_indicator_unique',
  });

  // ---------------------------------------------------------------- people & partners
  await create(qi, 'staff_groups', {
    id,
    name: { type: DataTypes.STRING(150), allowNull: false },
    slug: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    ...timestamps,
  });

  await create(qi, 'staff_profiles', {
    id,
    group_id: fk('staff_groups', 'SET NULL'),
    name: { type: DataTypes.STRING(150), allowNull: false },
    slug: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    position: { type: DataTypes.STRING(200), allowNull: true },
    department: { type: DataTypes.STRING(200), allowNull: true },
    bio: { type: DataTypes.TEXT('medium'), allowNull: true },
    qualifications: { type: DataTypes.TEXT, allowNull: true },
    email: { type: DataTypes.STRING(191), allowNull: true },
    linkedin_url: { type: DataTypes.STRING(500), allowNull: true },
    scholar_url: { type: DataTypes.STRING(500), allowNull: true },
    orcid_url: { type: DataTypes.STRING(500), allowNull: true },
    website_url: { type: DataTypes.STRING(500), allowNull: true },
    photo_id: fk('media_assets', 'SET NULL'),
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    legacy_url: { type: DataTypes.STRING(500), allowNull: true },
    ...status,
    ...authorship,
    ...timestamps,
    ...softDelete,
  });
  await qi.addIndex('staff_profiles', ['group_id', 'sort_order']);

  await create(qi, 'partners', {
    id,
    name: { type: DataTypes.STRING(200), allowNull: false },
    slug: { type: DataTypes.STRING(191), allowNull: false, unique: true },
    partner_type: {
      type: DataTypes.ENUM('host', 'funder', 'academic', 'industry', 'public_sector', 'professional_body', 'other'),
      allowNull: false,
      defaultValue: 'other',
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    website_url: { type: DataTypes.STRING(500), allowNull: true },
    logo_id: fk('media_assets', 'SET NULL'),
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    is_featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    ...status,
    ...authorship,
    ...timestamps,
    ...softDelete,
  });

  // ---------------------------------------------------------------- training
  await create(qi, 'cpd_programmes', {
    id,
    title: { type: DataTypes.STRING(300), allowNull: false },
    slug: { type: DataTypes.STRING(191), allowNull: false, unique: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    description: { type: DataTypes.TEXT('medium'), allowNull: true },
    target_audience: { type: DataTypes.TEXT, allowNull: true },
    learning_objectives: { type: DataTypes.TEXT, allowNull: true },
    facilitators: { type: DataTypes.TEXT, allowNull: true },
    duration: { type: DataTypes.STRING(100), allowNull: true },
    delivery_format: { type: DataTypes.STRING(150), allowNull: true },
    fee_text: { type: DataTypes.STRING(255), allowNull: true },
    registration_url: { type: DataTypes.STRING(500), allowNull: true },
    image_id: fk('media_assets', 'SET NULL'),
    is_featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    ...status,
    ...seo,
    ...authorship,
    ...timestamps,
    ...softDelete,
  });
  await qi.addIndex('cpd_programmes', ['title', 'summary', 'description'], {
    type: 'FULLTEXT',
    name: 'cpd_programmes_fulltext',
  });

  await create(qi, 'cpd_sessions', {
    id,
    programme_id: fk('cpd_programmes', 'CASCADE', false),
    label: { type: DataTypes.STRING(200), allowNull: true },
    starts_at: { type: DataTypes.DATE, allowNull: false },
    ends_at: { type: DataTypes.DATE, allowNull: true },
    venue: { type: DataTypes.STRING(255), allowNull: true },
    delivery_mode: {
      type: DataTypes.ENUM('in_person', 'online', 'hybrid'),
      allowNull: false,
      defaultValue: 'in_person',
    },
    fee_text: { type: DataTypes.STRING(255), allowNull: true },
    capacity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    registration_status: {
      type: DataTypes.ENUM('open', 'closed', 'full', 'cancelled'),
      allowNull: false,
      defaultValue: 'closed',
    },
    registration_url: { type: DataTypes.STRING(500), allowNull: true },
    allow_online_registration: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    ...timestamps,
    ...softDelete,
  });
  await qi.addIndex('cpd_sessions', ['programme_id', 'starts_at']);

  await create(qi, 'cpd_registrations', {
    id,
    session_id: fk('cpd_sessions', 'CASCADE', false),
    full_name: { type: DataTypes.STRING(150), allowNull: false },
    email: { type: DataTypes.STRING(191), allowNull: false },
    phone: { type: DataTypes.STRING(40), allowNull: true },
    organisation: { type: DataTypes.STRING(200), allowNull: true },
    job_title: { type: DataTypes.STRING(150), allowNull: true },
    attendance_mode: { type: DataTypes.ENUM('in_person', 'online'), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    consent_at: { type: DataTypes.DATE, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'waitlisted', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    ip_hash: { type: DataTypes.CHAR(64), allowNull: true },
    ...timestamps,
  });
  await qi.addIndex('cpd_registrations', ['session_id', 'email'], {
    unique: true,
    name: 'cpd_registrations_session_email_unique',
  });

  // ---------------------------------------------------------------- events, newsletters, galleries
  await create(qi, 'galleries', {
    id,
    title: { type: DataTypes.STRING(255), allowNull: false },
    slug: { type: DataTypes.STRING(191), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    cover_image_id: fk('media_assets', 'SET NULL'),
    ...status,
    ...authorship,
    ...timestamps,
    ...softDelete,
  });

  await create(qi, 'gallery_items', {
    id,
    gallery_id: fk('galleries', 'CASCADE', false),
    media_id: fk('media_assets', 'CASCADE', false),
    caption: { type: DataTypes.STRING(1000), allowNull: true },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    ...timestamps,
  });
  await qi.addIndex('gallery_items', ['gallery_id', 'sort_order']);

  await create(qi, 'events', {
    id,
    title: { type: DataTypes.STRING(300), allowNull: false },
    slug: { type: DataTypes.STRING(191), allowNull: false, unique: true },
    event_type: {
      type: DataTypes.ENUM(
        'workshop',
        'conference',
        'summit',
        'lecture',
        'training',
        'meeting',
        'webinar',
        'forum',
        'call_for_papers',
        'other',
      ),
      allowNull: false,
      defaultValue: 'other',
    },
    summary: { type: DataTypes.TEXT, allowNull: true },
    body: { type: DataTypes.TEXT('medium'), allowNull: true },
    starts_at: { type: DataTypes.DATE, allowNull: false },
    ends_at: { type: DataTypes.DATE, allowNull: true },
    all_day: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    venue: { type: DataTypes.STRING(255), allowNull: true },
    location_type: {
      type: DataTypes.ENUM('in_person', 'online', 'hybrid'),
      allowNull: false,
      defaultValue: 'in_person',
    },
    cost_text: { type: DataTypes.STRING(255), allowNull: true },
    registration_url: { type: DataTypes.STRING(500), allowNull: true },
    website_url: { type: DataTypes.STRING(500), allowNull: true },
    image_id: fk('media_assets', 'SET NULL'),
    gallery_id: fk('galleries', 'SET NULL'),
    is_featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    legacy_url: { type: DataTypes.STRING(500), allowNull: true },
    ...status,
    ...seo,
    ...authorship,
    ...timestamps,
    ...softDelete,
  });
  await qi.addIndex('events', ['status', 'starts_at']);
  await qi.addIndex('events', ['title', 'summary', 'body'], { type: 'FULLTEXT', name: 'events_fulltext' });

  await create(qi, 'event_attachments', {
    id,
    event_id: fk('events', 'CASCADE', false),
    media_id: fk('media_assets', 'CASCADE', false),
    label: { type: DataTypes.STRING(255), allowNull: true },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    ...timestamps,
  });

  await create(qi, 'newsletters', {
    id,
    issue_number: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, unique: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    slug: { type: DataTypes.STRING(191), allowNull: false, unique: true },
    published_on: { type: DataTypes.DATEONLY, allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    highlights: { type: DataTypes.TEXT('medium'), allowNull: true },
    cover_image_id: fk('media_assets', 'SET NULL'),
    file_id: fk('media_assets', 'SET NULL'),
    online_url: { type: DataTypes.STRING(1000), allowNull: true },
    ...status,
    ...authorship,
    ...timestamps,
    ...softDelete,
  });

  // ---------------------------------------------------------------- inbound data
  await create(qi, 'contact_submissions', {
    id,
    topic: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'general' },
    name: { type: DataTypes.STRING(150), allowNull: false },
    email: { type: DataTypes.STRING(191), allowNull: false },
    phone: { type: DataTypes.STRING(40), allowNull: true },
    organisation: { type: DataTypes.STRING(200), allowNull: true },
    subject: { type: DataTypes.STRING(255), allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: false },
    details: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM('new', 'read', 'replied', 'archived', 'spam'),
      allowNull: false,
      defaultValue: 'new',
    },
    ip_hash: { type: DataTypes.CHAR(64), allowNull: true },
    user_agent: { type: DataTypes.STRING(255), allowNull: true },
    handled_by: fk('users', 'SET NULL'),
    ...timestamps,
  });
  await qi.addIndex('contact_submissions', ['status', 'created_at']);

  await create(qi, 'newsletter_subscribers', {
    id,
    email: { type: DataTypes.STRING(191), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(150), allowNull: true },
    status: {
      type: DataTypes.ENUM('pending', 'subscribed', 'unsubscribed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    consent_text: { type: DataTypes.STRING(500), allowNull: false },
    consented_at: { type: DataTypes.DATE, allowNull: false },
    confirm_token_hash: { type: DataTypes.CHAR(64), allowNull: true },
    confirmed_at: { type: DataTypes.DATE, allowNull: true },
    unsubscribe_token: { type: DataTypes.CHAR(64), allowNull: false, unique: true },
    unsubscribed_at: { type: DataTypes.DATE, allowNull: true },
    source: { type: DataTypes.STRING(60), allowNull: true },
    ip_hash: { type: DataTypes.CHAR(64), allowNull: true },
    ...timestamps,
  });
  await qi.addIndex('newsletter_subscribers', ['status']);

  // ---------------------------------------------------------------- configuration & audit
  await create(qi, 'site_settings', {
    id,
    key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    value: { type: DataTypes.TEXT, allowNull: true },
    group: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'general' },
    label: { type: DataTypes.STRING(150), allowNull: false },
    type: {
      type: DataTypes.ENUM('text', 'textarea', 'url', 'email', 'boolean', 'media'),
      allowNull: false,
      defaultValue: 'text',
    },
    is_public: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    updated_by: fk('users', 'SET NULL'),
    ...timestamps,
  });

  await create(qi, 'redirects', {
    id,
    from_path: { type: DataTypes.STRING(191), allowNull: false, unique: true },
    to_path: { type: DataTypes.STRING(1000), allowNull: false },
    status_code: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 301 },
    is_enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    hits: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    note: { type: DataTypes.STRING(255), allowNull: true },
    ...timestamps,
  });

  await create(qi, 'audit_logs', {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
    user_id: fk('users', 'SET NULL'),
    user_email: { type: DataTypes.STRING(191), allowNull: true },
    action: { type: DataTypes.STRING(60), allowNull: false },
    entity_type: { type: DataTypes.STRING(60), allowNull: true },
    entity_id: { type: DataTypes.STRING(64), allowNull: true },
    summary: { type: DataTypes.STRING(500), allowNull: true },
    changes: { type: DataTypes.TEXT, allowNull: true },
    ip_hash: { type: DataTypes.CHAR(64), allowNull: true },
    user_agent: { type: DataTypes.STRING(255), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await qi.addIndex('audit_logs', ['entity_type', 'entity_id']);
  await qi.addIndex('audit_logs', ['user_id', 'created_at']);
  await qi.addIndex('audit_logs', ['created_at']);
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }: Ctx) => {
  const tables = [
    'audit_logs',
    'redirects',
    'site_settings',
    'newsletter_subscribers',
    'contact_submissions',
    'newsletters',
    'event_attachments',
    'events',
    'gallery_items',
    'galleries',
    'cpd_registrations',
    'cpd_sessions',
    'cpd_programmes',
    'partners',
    'staff_profiles',
    'staff_groups',
    'lmi_indicator_values',
    'lmi_reports',
    'publications',
    'research_projects',
    'research_themes',
    'article_categories',
    'articles',
    'categories',
    'homepage_slides',
    'menu_items',
    'menus',
    'pages',
    'media_assets',
    'password_reset_tokens',
    'sessions',
    'user_roles',
    'users',
    'role_permissions',
    'permissions',
    'roles',
  ];
  for (const t of tables) await qi.dropTable(t);
};
