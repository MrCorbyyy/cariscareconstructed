import path from 'node:path';
import { expect, test } from '@playwright/test';
import { API, apiDelete, openAdmin, unique } from './helpers';

const PDF = path.join(__dirname, 'fixtures', 'sample-report.pdf');
const PNG = path.join(__dirname, 'fixtures', 'sample-portrait.png');

test.describe.configure({ mode: 'serial' });

test.describe('without a session', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('visitors cannot use the dashboard or admin API', async ({ page, request }) => {
  await page.goto('/admin/articles');
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Farticles/);
  for (const p of ['/admin/articles', '/admin/submissions', '/admin/users']) {
    expect((await request.get(`${API}${p}`)).status(), p).toBe(401);
  }
  });
});

test('article: draft stays private, publishing makes it public with metadata', async ({ page, request }) => {
  const title = unique('E2E Workflow Article');
  await openAdmin(page);
  await page.goto('/admin/articles/new');
  await page.getByLabel('Headline').fill(title);
  await page.getByLabel('Summary').fill('An end-to-end test article about supply chain resilience.');
  await page.getByRole('textbox', { name: 'Body' }).fill('This article was created by the automated end-to-end test.');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(page.getByText('Saved.')).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/articles\/\d+$/);
  const id = page.url().split('/').pop()!;
  const slug = await page.getByLabel('URL slug').inputValue();

  // Draft: not reachable publicly.
  expect((await request.get(`${API}/articles/${slug}`)).status()).toBe(404);
  expect((await page.request.get(`/news/${slug}`)).status()).toBe(404);

  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Published.')).toBeVisible();

  // Published: detail page with title, canonical URL and Open Graph metadata.
  await page.goto(`/news/${slug}`);
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`/news/${slug}$`));
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title);
  await expect(page.locator('script[type="application/ld+json"]').first()).toBeAttached();

  // Appears in the archive and in search (cache purged by the API's revalidation call).
  await page.goto(`/news?q=${encodeURIComponent(title)}`);
  await expect(page.getByRole('link', { name: title })).toBeVisible();

  await apiDelete(page, `/admin/articles/${id}`);
  expect((await page.request.get(`/news/${slug}`)).status()).toBe(404);
});

test('publication: uploaded PDF is downloadable from the public page', async ({ page }) => {
  const title = unique('E2E Policy Brief');
  await openAdmin(page);
  await page.goto('/admin/publications/new');
  await page.locator('#field-title').fill(title);
  await page.getByLabel('Type').selectOption('policy_brief');
  await page.getByLabel('Abstract / summary').fill('Test abstract for the end-to-end upload workflow.');
  await page.locator('#field-file_id').getByRole('button', { name: 'Choose' }).click();
  await page.locator('#mp-file').setInputFiles(PDF);
  await page.getByRole('button', { name: 'Upload & use' }).click();
  await expect(page.locator('#field-file_id')).toContainText('sample-report.pdf');
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Published.')).toBeVisible();
  await expect(page).toHaveURL(/\/\d+$/);
  await expect(page.getByLabel('URL slug')).not.toHaveValue('');
  const id = page.url().split('/').pop()!;
  const slug = await page.getByLabel('URL slug').inputValue();

  await page.goto(`/publications/${slug}`);
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  const download = page.getByRole('link', { name: /Download/ }).first();
  await expect(download).toHaveAttribute('href', /\/uploads\/\d{4}\/\d{2}\/sample-report-[a-f0-9]{8}\.pdf$/);
  const pdf = await page.request.get((await download.getAttribute('href'))!);
  expect(pdf.headers()['content-type']).toContain('application/pdf');

  await apiDelete(page, `/admin/publications/${id}`);
});

test('staff profile: placeholder is replaced by an uploaded portrait', async ({ page }) => {
  const name = unique('E2E Test Person');
  await openAdmin(page);
  await page.goto('/admin/staff/new');
  await page.getByLabel('Name (with title)').fill(name);
  await page.getByLabel('Role').fill('Test role');
  await page.getByRole('textbox', { name: 'Biography' }).fill('Biography written by the automated test.');
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Published.')).toBeVisible();
  await expect(page).toHaveURL(/\/\d+$/);
  await expect(page.getByLabel('URL slug')).not.toHaveValue('');
  const id = page.url().split('/').pop()!;
  const slug = await page.getByLabel('URL slug').inputValue();

  await page.goto(`/about/team/${slug}`);
  await expect(page.getByAltText('Image placeholder: Staff portrait (600 × 750 px)')).toBeVisible();

  await page.goto(`/admin/staff/${id}`);
  await page.locator('#field-photo_id').getByRole('button', { name: 'Choose' }).click();
  await page.locator('#mp-file').setInputFiles(PNG);
  await page.locator('#mp-alt').fill(`Portrait of ${name}`);
  await page.getByRole('button', { name: 'Upload & use' }).click();
  await page.getByRole('button', { name: 'Update' }).click();
  await expect(page.getByText('Published.')).toBeVisible();

  await page.goto(`/about/team/${slug}`);
  await expect(page.getByAltText(`Portrait of ${name}`)).toBeVisible();
  await expect(page.getByAltText(/Image placeholder: Staff portrait/)).toHaveCount(0);

  await apiDelete(page, `/admin/staff/${id}`);
});

test('navigation: a menu change in the dashboard appears on the website', async ({ page }) => {
  const label = unique('E2E Link');
  await openAdmin(page);
  await page.goto('/admin/menus');
  const utility = page.locator('section', { has: page.getByRole('heading', { name: 'Top utility bar' }) });
  await utility.getByRole('button', { name: 'Add item' }).click();
  const labels = utility.getByLabel('Label');
  await labels.last().fill(label);
  await utility.getByLabel(/^Link/).last().fill('/contact');
  await utility.getByRole('button', { name: 'Save menu' }).click();
  await expect(page.getByText('Top utility bar saved.')).toBeVisible();

  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Quick links' }).getByRole('link', { name: label })).toBeVisible();

  // Restore the menu.
  await page.goto('/admin/menus');
  await utility.getByRole('button', { name: `Remove ${label}` }).click();
  await utility.getByRole('button', { name: 'Save menu' }).click();
  await expect(page.getByText('Top utility bar saved.')).toBeVisible();
});

test('contact form submissions reach the dashboard inbox', async ({ page }) => {
  const subject = unique('E2E enquiry');
  await page.goto('/contact');
  const form = page.locator('section[aria-labelledby="form-heading"]');
  await form.getByLabel('Your name').fill('E2E Tester');
  await form.getByLabel('Email').fill('e2e@example.com');
  await form.getByLabel('Subject').fill(subject);
  await form.getByLabel('Message').fill('This message was sent by the automated end-to-end test.');
  await form.getByRole('checkbox', { name: /store these details/ }).check();
  await page.waitForTimeout(3000); // anti-bot timer: real people take a few seconds
  await form.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText(/Your message has been received/)).toBeVisible();

  await openAdmin(page);
  await page.goto('/admin/submissions');
  await page.getByLabel('Search').fill(subject);
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByRole('cell', { name: subject })).toBeVisible();
  const ids: number[] = await page.evaluate(async ({ api, subject }) => {
    const r = await fetch(`${api}/admin/submissions?q=${encodeURIComponent(subject)}`, { credentials: 'include' }).then((x) => x.json());
    return r.data.map((d: { id: number }) => d.id);
  }, { api: API, subject });
  for (const sid of ids) await apiDelete(page, `/admin/submissions/${sid}`);
});
