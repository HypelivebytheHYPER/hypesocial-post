# HypeSocial Optimization Plan

## Phase 1: Component Refactoring (High Priority)

### 1.1 analytics/page.tsx (879 lines) → Target: <400 lines

**Current Structure:**
```
- Data aggregation logic (7 useMemo blocks)
- Loading state
- Empty state
- Main render with 7 sections
- Sub-components (OverviewCard, MiniStat)
```

**Refactoring Plan:**
```
app/(dashboard)/analytics/
├── page.tsx              # Main container only
├── components/
│   ├── OverviewCards.tsx       # 4 metric cards
│   ├── AccountBreakdown.tsx    # Per-account section
│   ├── TopPosts.tsx            # Top performing posts
│   ├── PlatformComparison.tsx  # Platform breakdown
│   ├── TikTokInsights.tsx      # TikTok Business charts
│   └── MetricInfo.tsx          # Info section
├── hooks/
│   └── useAnalyticsData.ts     # All data aggregation
└── types.ts
```

**Extract Custom Hook:**
```typescript
// hooks/useAnalyticsData.ts
export function useAnalyticsData(connectedIds: string[]) {
  const { data: feedsByAccount, allItems, ... } = useAllAccountFeeds(connectedIds);
  
  const totals = useMemo(() => {...}, [allItems]);
  const perAccount = useMemo(() => {...}, [...]);
  const topPosts = useMemo(() => {...}, [allItems]);
  const platformBreakdown = useMemo(() => {...}, [allItems]);
  const tiktokInsights = useMemo(() => {...}, [allItems]);
  
  return { totals, perAccount, topPosts, platformBreakdown, tiktokInsights };
}
```

---

### 1.2 posts/page.tsx (872 lines) → Target: <400 lines

**Refactoring Plan:**
```
app/(dashboard)/posts/
├── page.tsx
├── components/
│   ├── PostBoard.tsx       # Kanban board view
│   ├── PostList.tsx        # List view
│   ├── PostCard.tsx        # Individual post card
│   ├── StatusColumn.tsx    # Board column
│   ├── Filters.tsx         # Search & filter UI
│   └── EmptyState.tsx
├── hooks/
│   └── usePostFilters.ts   # Filter logic
```

---

### 1.3 Dashboard page.tsx (842 lines) → Target: <400 lines

**Refactoring Plan:**
```
app/(dashboard)/
├── page.tsx
└── components/
    ├── StatsOverview.tsx
    ├── RecentPosts.tsx
    ├── QuickActions.tsx
    └── ActivityFeed.tsx
```

---

### 1.4 accounts/connect/page.tsx (623 lines) → Target: <400 lines

**Refactoring Plan:**
```
app/(dashboard)/accounts/connect/
├── page.tsx
├── components/
│   ├── PlatformGrid.tsx
│   ├── ConnectionCard.tsx
│   ├── OAuthCallback.tsx
│   └── ConnectionWizard.tsx
```

---

## Phase 2: Test Infrastructure (High Priority)

### 2.1 Setup Test Configuration

```bash
# Install testing dependencies
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event msw

# Create config files
vitest.config.ts
vitest.setup.ts
```

### 2.2 Test File Structure

```
__tests__/
├── unit/
│   ├── hooks/
│   │   ├── useSocialAccounts.test.ts
│   │   └── usePosts.test.ts
│   ├── lib/
│   │   ├── metrics.test.ts
│   │   └── validations.test.ts
│   └── components/
│       └── ui/
├── integration/
│   └── api/
│       ├── accounts.test.ts
│       └── posts.test.ts
└── e2e/
    └── flows/
        └── post-creation.spec.ts
```

### 2.3 Priority Test Cases

**Unit Tests (Start here):**
- [ ] `useSocialAccounts` hook
- [ ] `usePosts` hook with filtering
- [ ] `extractMetrics` utility
- [ ] `formatNumber` utility
- [ ] Zod validation schemas

**Integration Tests:**
- [ ] API routes with mocked Post For Me
- [ ] Webhook handling
- [ ] Form submissions

**E2E Tests:**
- [ ] Create post flow
- [ ] Connect account flow
- [ ] View analytics flow

---

## Phase 3: Code Quality (Medium Priority)

### 3.1 Fix useEffect Dependencies

**Find issues:**
```bash
grep -rn "useEffect(()" --include="*.tsx" . | grep -v node_modules | grep -v ".next"
```

**Common patterns to fix:**
```typescript
// ❌ Missing deps
useEffect(() => {
  fetchData();
}, []);

// ✅ Correct
useEffect(() => {
  fetchData();
}, [fetchData]);
```

### 3.2 Console Cleanup

**Structured logging (KEEP - 24 instances):**
- `formatRequestLog` JSON logging

**Error logging (KEEP - 26 instances):**
- `console.error` in catch blocks

**Standard logs (REVIEW - 30 instances):**
```bash
# Find and review
grep -rn "console.log" --include="*.ts" --include="*.tsx" . | grep -v "formatRequestLog" | grep -v node_modules | grep -v ".next"
```

**Replace with:**
```typescript
// Development only
if (process.env.NODE_ENV === "development") {
  console.log("Debug:", data);
}

// Or remove entirely
```

---

## Phase 4: Performance (Medium Priority)

### 4.1 Add React.memo

**Candidate components:**
- `PostCard` - Re-renders on list updates
- `AccountCard` - Static data, expensive render
- `MetricCard` - Pure display component

```typescript
export const PostCard = memo(function PostCard({ post, ... }) {
  // Component
});
```

### 4.2 Virtualize Long Lists

**For feeds with 100+ items:**
```bash
npm install @tanstack/react-virtual
```

```typescript
// Use virtualizer for large lists
const rowVirtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 100,
});
```

---

## Phase 5: Type Safety (Low Priority)

### 5.1 Strict ESLint Rules

**Update eslint.config.mjs:**
```javascript
rules: {
  // ... existing rules
  "@typescript-eslint/no-explicit-any": "error",  // Change from "off"
  "@typescript-eslint/explicit-function-return-type": "warn",
}
```

---

## Implementation Schedule

| Week | Focus | Deliverables |
|------|-------|--------------|
| Week 1 | Component Refactoring | analytics/, posts/, dashboard/ |
| Week 2 | Test Infrastructure | vitest setup + 10 unit tests |
| Week 3 | Test Coverage | API integration tests |
| Week 4 | Polish | Console cleanup, useEffect fixes |

---

## Success Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Largest component | 879 lines | <400 lines |
| Test coverage | 0% | 60%+ |
| Components >500 lines | 9 | 0 |
| Console warnings | 18 | 0 |
| ESLint errors | 0 | 0 |

---

## Quick Wins (Do Today)

1. **Extract Sub-components from analytics/page.tsx**
   - Move `OverviewCard` and `MiniStat` to separate files
   - Save: ~80 lines

2. **Create useAnalyticsData hook**
   - Extract 7 useMemo blocks
   - Save: ~200 lines

3. **Set up vitest.config.ts**
   - Add basic configuration
   - Create one sample test

---

*Start with Phase 1, Week 1. Each component refactor should be a separate commit.*
