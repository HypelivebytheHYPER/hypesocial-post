import { test, expect } from '@playwright/test';

test.describe('Create Post Flow - E2E Happy Path', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');
    await expect(page).toHaveURL('/');
  });

  test('should navigate to new post page', async ({ page }) => {
    await page.goto('/posts/new');
    await expect(page).toHaveURL('/posts/new');
  });

  test('should display new post form', async ({ page }) => {
    // Navigate to new post
    await page.goto('/posts/new');
    await expect(page).toHaveURL('/posts/new');

    // Verify form elements exist - page has "Create Post" heading
    await expect(page.locator('[data-testid="post-caption-input"]')).toBeVisible();
    await expect(page.locator('h1').filter({ hasText: 'Create Post' })).toBeVisible();
  });

  test('should display posts list page', async ({ page }) => {
    await page.goto('/posts');

    // Verify page loaded - use title class for greeting-title
    await expect(page).toHaveURL('/posts');
    await expect(page.locator('h1.greeting-title')).toHaveText('Posts');
  });

  test('should display accounts connect page', async ({ page }) => {
    await page.goto('/accounts/connect');

    // Verify page loaded - use h1 for specific match
    await expect(page).toHaveURL('/accounts/connect');
    await expect(page.locator('h1').filter({ hasText: 'Connect' })).toBeVisible();
  });
});

test.describe('Dashboard - E2E Happy Path', () => {
  test('should display dashboard with greeting', async ({ page }) => {
    await page.goto('/');

    // Wait for dashboard to finish loading
    await expect(page.locator('[data-testid="dashboard-loading"]')).not.toBeVisible({ timeout: 10000 }).catch(() => {});

    // Verify main dashboard elements
    await expect(page.locator('h1')).toContainText('Hello, Alif Reza');
    await expect(page.locator('[data-testid="analytics-section"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="recent-posts"]')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate between pages', async ({ page }) => {
    // Dashboard
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Hello, Alif Reza');

    // Posts
    await page.goto('/posts');
    await expect(page).toHaveURL('/posts');

    // Feed
    await page.goto('/feed');
    await expect(page).toHaveURL('/feed');

    // Accounts
    await page.goto('/accounts/connect');
    await expect(page).toHaveURL('/accounts/connect');
  });
});
