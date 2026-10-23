# CARISCA website

Reconstruction of the website of the **Centre for Applied Research and Innovation in Supply Chain – Africa (CARISCA)** at KNUST: a public website, an administrative CMS, and a REST API. It is built as **two independent applications**:

| Folder | What | Stack |
|---|---|---|
| [`backend/`](backend/README.md) | REST API (`/api/v1`), authentication, media storage, migrations | Node.js 22, Express 5, TypeScript, Sequelize 6, MySQL 8 |
| [`frontend/`](frontend/README.md) | Public website and the `/admin` dashboard | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| [`docs/`](docs/) | Audit, architecture, schema, API, migration, deployment | |

Each app has its own `package.json`, environment file, build and start command, and can be deployed and restarted on its own.

## Documentation

- [Website audit](docs/website-audit.md): what exists on the current site, gaps, proposed navigation, image sizes
- [Architecture](docs/architecture.md): how the pieces fit, caching, security model
- [Database schema](docs/database-schema.md)
- [API reference](docs/api-documentation.md)
- [Content migration](docs/content-migration.md): what was imported, URL map, items needing review
- [cPanel deployment](docs/cpanel-deployment.md)

## Run locally

Requirements: **Node.js 20.9+** (22 LTS recommended) and **MySQL 8** (or MariaDB 10.6+).

### 1. Database

```sql
CREATE DATABASE carisca_website CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE carisca_test    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; -- for backend tests
CREATE USER 'carisca_dev'@'localhost' IDENTIFIED BY 'choose-a-password';
GRANT ALL ON carisca_website.* TO 'carisca_dev'@'localhost';
GRANT ALL ON carisca_test.*    TO 'carisca_dev'@'localhost';
```

### 2. API (terminal 1)

```bash
cd backend
cp .env.example .env          # set DB_*, SESSION_SECRET, REVALIDATE_SECRET
npm install
npm run db:migrate            # create tables
npm run db:seed               # roles, settings, menus + verified initial content
npm run admin:create          # first Super Administrator (interactive)
npm run import:wordpress -- --with-media   # optional: import legacy posts/events/media (see docs/content-migration.md)
npm run dev                   # http://localhost:5000/api/v1/health
```

### 3. Website (terminal 2)

```bash
cd frontend
cp .env.example .env.local    # NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1, NEXT_PUBLIC_SITE_URL=http://localhost:3000, same REVALIDATE_SECRET
npm install
npm run dev                   # http://localhost:3000   ·   admin: http://localhost:3000/admin
```

## Tests and checks

```bash
cd backend  && npm run typecheck && npm run lint && npm test         # API tests against carisca_test
cd frontend && npm run typecheck && npm run lint && npm test         # component/unit tests
cd frontend && E2E_ADMIN_EMAIL=… E2E_ADMIN_PASSWORD=… npm run test:e2e   # browser workflows (both servers running)
```

Run end-to-end tests against a development or staging database, never production; they create and delete content.

## Production builds

```bash
cd backend  && npm ci && npm run build      # → dist/server.js
cd frontend && npm ci && npm run build      # → .next/standalone/server.js (+ copied public/ and static/)
```

See [docs/cpanel-deployment.md](docs/cpanel-deployment.md) for deploying both apps to cPanel.

## Content principles

The site reproduces CARISCA's **verified** content. Nothing is invented. Where the legacy site was unclear or inconsistent, records carry an internal *review note* ("Needs review" in the dashboard), and missing images show labelled placeholders with their intended dimensions until approved photographs are uploaded.
