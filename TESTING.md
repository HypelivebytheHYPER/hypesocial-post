# Testing Guide - HypeSocial Post

> **Last Updated:** 2026-03-01

## 📋 Test Structure

```
tests/
├── unit/                    # Vitest unit tests
│   └── lib/
│       └── hooks/
│           └── usePostForMe.test.ts
├── integration/             # API integration tests
│   ├── setup.ts
│   └── api/
│       └── posts.test.ts
└── e2e/                     # Playwright E2E tests
    └── posts/
        └── create-post.spec.ts
```

---

## 🚀 Quick Start

### Run All Tests
```bash
# Unit tests
pnpm test

# Unit tests with UI
pnpm test:ui

# Integration tests (requires dev server)
pnpm test:integration

# E2E tests (requires build)
pnpm test:e2e

# E2E with UI
pnpm test:e2e:ui
```

---

## 🧪 Test Categories

### 1. Unit Tests (Vitest)

**What to test:**
- Hooks (`usePostForMe`)
- Utility functions
- Type validators
- Formatters

**Run:**
```bash
pnpm test
```

**Example:**
```typescript
// tests/unit/lib/hooks/usePostForMe.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { usePosts } from '@/lib/hooks/usePostForMe';

test('should fetch posts', async () => {
  const { result } = renderHook(() => usePosts());
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toBeDefined();
});
```

---

### 2. Integration Tests (API)

**What to test:**
- API routes (`/api/posts`, `/api/accounts`)
- Database operations
- External API calls (mocked)

**Prerequisites:**
```bash
# Start dev server
pnpm dev
```

**Run:**
```bash
pnpm test:integration
```

**Environment Variables:**
```bash
TEST_API_URL=http://localhost:3000/api pnpm test:integration
```

---

### 3. E2E Tests (Playwright)

**What to test:**
- User flows (create post, connect account)
- Navigation
- UI interactions
- Cross-browser compatibility

**Prerequisites:**
```bash
# Install Playwright browsers
pnpm exec playwright install

# Build the app
pnpm build
```

**Run:**
```bash
pnpm test:e2e
```

**Happy Path Test Example:**
```typescript
// tests/e2e/posts/create-post.spec.ts
test('should create a draft post', async ({ page }) => {
  await page.goto('/posts/new');
  await page.fill('[data-testid="post-caption"]', 'Test post');
  await page.click('[data-testid="save-draft"]');
  await expect(page.locator('text=Draft saved')).toBeVisible();
});
```

---

## ✅ Happy Flow Test Checklist

### API Happy Flow
- [ ] Create draft post → 200 OK
- [ ] List posts → Returns array
- [ ] Get single post → Returns post
- [ ] Update post → 200 OK
- [ ] Delete post → 200 OK
- [ ] List accounts → Returns connected accounts
- [ ] Generate preview → Returns preview data

### UI Happy Flow (E2E)
- [ ] Navigate to dashboard
- [ ] Create new post (draft)
- [ ] Schedule post
- [ ] Connect social account
- [ ] View analytics
- [ ] View feed

---

## 🎯 Writing Good Tests

### Unit Test Principles
```typescript
// ✅ Good: Test behavior, not implementation
test('returns posts on success', async () => {
  // Mock API response
  fetch.mockResolvedValueOnce({ ok: true, json: () => posts });

  const { result } = renderHook(() => usePosts());

  await waitFor(() => {
    expect(result.current.data).toEqual(posts);
  });
});

// ❌ Bad: Testing implementation details
test('calls fetch with correct URL', () => {
  // Don't test this - test the outcome instead
});
```

### E2E Test Principles
```typescript
// ✅ Good: Test user-visible behavior
test('user can create a post', async ({ page }) => {
  await page.goto('/posts/new');
  await page.fill('textarea[name="caption"]', 'Hello world');
  await page.click('button:has-text("Save Draft")');
  await expect(page.locator('text=Draft saved')).toBeVisible();
});

// ❌ Bad: Testing internal state
test('sets isDraft to true', async () => {
  // Don't test internal state - test what user sees
});
```

---

## 🔧 CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop`
- Pull requests to `main`

**Workflow:**
1. Code Quality (lint, type-check, format)
2. Unit Tests
3. Build
4. E2E Tests
5. Deploy Preview (PRs only)

---

## 🐛 Debugging Tests

### Unit Tests
```bash
# Debug specific test
pnpm test -- --reporter=verbose --testNamePattern="usePosts"

# Watch mode
pnpm test -- --watch

# Coverage
pnpm test:coverage
```

### E2E Tests
```bash
# Run with UI for debugging
pnpm test:e2e:ui

# Run specific test
pnpm test:e2e -- --grep "create post"

# Run in headed mode
pnpm test:e2e -- --headed

# Slow motion for debugging
pnpm test:e2e -- --slow-mo 1000
```

---

## 📊 Coverage Goals

| Category | Target | Current |
|----------|--------|---------|
| Unit Tests | 80% | 0% |
| Integration | 70% | 0% |
| E2E | Critical paths | 0% |

---

## 🔗 Resources

- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [React Query Testing](https://tanstack.com/query/latest/docs/react/guides/testing)
