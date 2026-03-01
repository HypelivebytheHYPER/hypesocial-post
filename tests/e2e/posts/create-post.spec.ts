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

    // Verify form elements exist
    await expect(page.locator('[data-testid="post-caption-input"]')).toBeVisible();
    await expect(page.locator('text=Schedule for later')).toBeVisible();
  });

  test('should display posts list page', async ({ page }) => {
    await page.goto('/posts');

    // Verify page loaded
    await expect(page).toHaveURL('/posts');
    await expect(page.locator('text=Posts')).toBeVisible();
  });

  test('should display accounts connect page', async ({ page }) => {
    await page.goto('/accounts/connect');

    // Verify page loaded
    await expect(page).toHaveURL('/accounts/connect');
    await expect(page.locator('text=Connect')).toBeVisible();
  });
});

test.describe('Dashboard - E2E Happy Path', () => {
  test('should display dashboard with greeting', async ({ page }) => {
    await page.goto('/');

    // Verify main dashboard elements
    await expect(page.locator('h1')).toContainText('Hello, Alif Reza');
    await expect(page.locator('[data-testid="analytics-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-posts"]')).toBeVisible();
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
