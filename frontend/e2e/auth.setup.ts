import { test as setup } from '@playwright/test';
import { signIn } from './helpers';

export const STORAGE = 'e2e/.auth/admin.json';

/** Signs in once and stores the session, so tests don't trip the login rate limiter. */
setup('sign in as administrator', async ({ page }) => {
  await signIn(page);
  await page.context().storageState({ path: STORAGE });
});
