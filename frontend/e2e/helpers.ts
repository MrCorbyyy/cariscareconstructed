import { expect, type Page } from '@playwright/test';

export const API = process.env.E2E_API_URL ?? 'http://localhost:5000/api/v1';

export function adminCredentials() {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run the end-to-end tests.');
  return { email, password };
}

export async function signIn(page: Page) {
  const { email, password } = adminCredentials();
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText('Published articles')).toBeVisible();
}

/** Opens the dashboard using the stored session from auth.setup.ts. */
export async function openAdmin(page: Page) {
  await page.goto('/admin');
  await expect(page.getByText('Published articles')).toBeVisible();
}

export const unique = (prefix: string) => `${prefix} ${Date.now().toString(36)}`;

/** Deletes a record through the admin UI's API session (cookies are shared with the page). */
export async function apiDelete(page: Page, path: string) {
  await page.evaluate(
    async ({ api, path }) => {
      const me = await fetch(`${api}/auth/me`, { credentials: 'include' }).then((r) => r.json());
      await fetch(`${api}${path}`, { method: 'DELETE', credentials: 'include', headers: { 'x-csrf-token': me.data.csrfToken } });
    },
    { api: API, path },
  );
}
