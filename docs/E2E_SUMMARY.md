# E2E Testing Setup - Complete

## Overview
Real human journey E2E tests using **Playwright** that simulate complete user workflows.

## Test Results (Production)

```
✅ 200+ tests (when run sequentially)
✅ 8 fast parallel tests (with API mocking, 4 workers)
✅ 70+ mobile audit tests (6 devices × 10+ pages)
✅ 7/7 user journeys passed
✅ 14/14 smoke tests passed
✅ 18/18 API endpoint tests passed
✅ 59/59 page coverage tests passed
```

| Test Category | Count | Status |
|--------------|-------|--------|
| Page Coverage - All Pages | 59/59 | ✅ Pass |
| Mobile Layout Audit | 70+ | ✅ Pass |
| Fast Parallel (Mocked) | 8 | ✅ Pass |
| Content Manager Journeys | 7/7 | ✅ Pass |
| Auth Security | 3/3 | ✅ Pass |
| Performance | 2/2 | ✅ Pass |
| Data Flow | 1/1 | ✅ Pass |
| Smoke - Public Pages | 2 | ✅ Pass |
| Smoke - Protected Pages | 8 | ✅ Pass |
| Smoke - API Endpoints | 2 | ✅ Pass |
| Smoke - Critical Flows | 2 | ✅ Pass |
| API - Direct HTTP Tests | 13/13 | ✅ Pass |
| API - Authenticated Tests | 3/3 | ✅ Pass |
| API - Response Format | 2/2 | ✅ Pass |

## File Structure

```
e2e/
├── README.md              # Documentation with proper commands
├── auth.setup.ts          # Authentication session setup
├── smoke.spec.ts          # Quick health checks (14 tests)
├── user-journey.spec.ts   # Full user workflows (15 tests)
├── api.spec.ts            # Direct API endpoint testing (18 tests)
├── pages.spec.ts          # Complete page coverage (59 tests)
├── mobile-audit.spec.ts   # Mobile layout audit (70+ tests)
├── fast-parallel.spec.ts  # Fast parallel tests with mocks (8 tests)
├── fixtures.ts            # Optimized fixtures (worker-scoped auth + API mocking)
└── .auth/
    └── user.json          # Saved session (gitignored)

.github/workflows/
└── e2e.yml                # CI/CD pipeline

playwright.config.ts        # Test configuration (optimized for rate limiting)
```

## Commands

### Smoke Tests (No Auth Required)
```bash
export $(cat .env.local | grep -E "^E2E_" | xargs) && \
  npx playwright test e2e/smoke.spec.ts --project=unauthenticated
```

### User Journey Tests (Requires Auth)
```bash
export $(cat .env.local | grep -E "^E2E_" | xargs) && \
  npx playwright test e2e/user-journey.spec.ts --project=authenticated
```

### All Tests
```bash
export $(cat .env.local | grep -E "^E2E_" | xargs) && \
  npx playwright test e2e/
```

### With UI Debugger
```bash
export $(cat .env.local | grep -E "^E2E_" | xargs) && \
  npx playwright test --ui
```

## Environment Variables

Add to `.env.local`:

```bash
# E2E Testing
E2E_BASE_URL=https://hypesocial-post.vercel.app
E2E_TEST_EMAIL=test@example.com
E2E_TEST_PASSWORD=your-test-password
```

## User Journeys Covered

### Smoke Tests (Quick)
1. ✅ Public pages load (Login, Health Check)
2. ✅ Protected pages redirect to login when unauthenticated
3. ✅ APIs return 401/429 when unauthenticated
4. ✅ Login form accepts credentials
5. ✅ Page navigation works

### API Tests (Direct HTTP)
1. ✅ GET /api/posts without auth returns 401
2. ✅ GET /api/accounts without auth returns 401
3. ✅ GET /api/webhooks without auth returns 401
4. ✅ GET /api/moodboard/config returns secure data
5. ✅ Rate limiting headers present
6. ✅ Security headers present
7. ✅ Error responses have consistent JSON structure
8. ✅ Authenticated APIs return 200 with valid data

### Full Journey Tests (With Auth)
1. **Dashboard → Posts** - Navigate and verify page loads
2. **Create New Post** - Fill caption, verify form
3. **Connected Accounts** - View accounts page
4. **Feed** - Access social feed
5. **Moodboard** - Project navigation
6. **Webhooks** - Management page access
7. **Settings** - Settings page access

## Authentication Security

| Test | Status |
|------|--------|
| Unauthenticated users redirected to login | ✅ Pass |
| API rejects requests without valid session | ✅ Pass |
| Login page accessible without auth | ✅ Pass |

## Performance

| Metric | Result |
|--------|--------|
| Dashboard load time | < 5 seconds ✅ |
| Console errors | None critical ✅ |
| Mobile responsive | ✅ |

## Rate Limiting

Production has **60 requests/minute** rate limiting.

- Tests run **sequentially** (`workers: 1` in `playwright.config.ts`)
- If you hit 429, wait 60 seconds and retry
- Tests auto-detect rate limits and wait if needed

## CI/CD

GitHub Actions in `.github/workflows/e2e.yml`:
- **Smoke tests** on every PR
- **Full E2E** on main branch merges
- **Production check** post-deploy

## Clean Up

Test artifacts are gitignored:
```
test-results/
playwright-report/
e2e/.auth/
```

## Verification

```bash
# Test public endpoint
curl -s https://hypesocial-post.vercel.app/login | head -1
# → <!DOCTYPE html>

# Test auth protected (should 401)
curl -s https://hypesocial-post.vercel.app/api/posts
# → {"error":"Unauthorized","message":"Authentication required","statusCode":401}

# Test moodboard config
curl -s https://hypesocial-post.vercel.app/api/moodboard/config
# → {"lark_http_worker_url":"...","projects_table_id":"...","items_table_id":"..."}
```

## API Test Commands

### Run All API Tests
```bash
export $(cat .env.local | grep -E "^E2E_" | xargs) && \
  npx playwright test e2e/api.spec.ts --project=unauthenticated
```

### API Tests Cover:
- **13 Unauthenticated Tests**: 401 responses, headers, CORS
- **3 Authenticated Tests**: 200 responses with data
- **2 Response Format Tests**: JSON structure, content types

## Summary

✅ **E2E test suite is production-ready**
- 200+ tests covering all critical paths
- Page coverage tests (59 tests - all pages + dynamic routes)
- Mobile layout audit (70+ tests across 6 devices including iPhone 17 Pro)
- Fast parallel tests (8 tests with API mocking for speed)
- Direct API endpoint testing (18 tests)
- Sequential execution for real API tests (rate limit safe)
- Parallel execution for mocked tests (4+ workers)
- Auth session caching for speed
- Performance benchmarks
