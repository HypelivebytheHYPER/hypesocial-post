import { test, expect } from '@playwright/test';

test.describe('Create Post Flow - E2E Happy Path', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');
    await expect(page).toHaveURL('/');
  });

  test('should navigate to new post page', async ({ page }) => {
    await page.click('[data-testid="new-post-button"]');
    await expect(page).toHaveURL('/posts/new');
  });

  test('should create a scheduled post successfully', async ({ page }) => {
    // Navigate to new post
    await page.goto('/posts/new');
    await expect(page).toHaveURL('/posts/new');

    // Fill in post content
    const captionInput = page.locator('[data-testid="post-caption-input"]');
    await captionInput.fill('E2E Test Post - ' + Date.now());

    // Enable schedule mode (toggle "Schedule for later")
    await page.click('text=Schedule for later');

    // Submit form - using text-based selector since button doesn't have data-testid
    await page.click('button:has-text("Schedule")');

    // Verify redirect to posts list
    await expect(page).toHaveURL('/posts', { timeout: 10000 });
  });

  test('should display posts list', async ({ page }) => {
    await page.goto('/posts');

    // Wait for posts to load
    await page.waitForSelector('[data-testid="posts-list"]', { timeout: 5000 });

    // Verify posts list exists
    const postsList = page.locator('[data-testid="posts-list"]');
    await expect(postsList).toBeVisible();
  });

  test('should display connected accounts', async ({ page }) => {
    await page.goto('/accounts/connect');

    // Wait for accounts to load
    await page.waitForSelector('[data-testid="accounts-list"]', { timeout: 5000 });

    // Verify accounts section exists
    const accountsSection = page.locator('[data-testid="accounts-list"]');
    await expect(accountsSection).toBeVisible();
  });
});

test.describe('Dashboard - E2E Happy Path', () => {
  test('should display dashboard with analytics', async ({ page }) => {
    await page.goto('/');

    // Verify main dashboard elements - greeting is shown
    await expect(page.locator('h1')).toContainText('Hello, Alif Reza');
    await expect(page.locator('[data-testid="analytics-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-posts"]')).toBeVisible();
  });

  test('should navigate between pages', async ({ page }) => {
    // Dashboard
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Hello, Alif Reza');

    // Posts
    await page.click('text=Posts');
    await expect(page).toHaveURL('/posts');

    // Feed
    await page.click('text=Feed');
    await expect(page).toHaveURL('/feed');

    // Back to Dashboard
    await page.click('text=Dashboard');
    await expect(page).toHaveURL('/');
  });
});
