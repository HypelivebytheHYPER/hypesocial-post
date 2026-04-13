# TanStack Query Best Practices

## The Golden Rule

> **Use `select` for data transformation. Never use `useMemo`.**

## ❌ Anti-Pattern: useMemo

```typescript
// BAD: usePostFilters hook using useMemo
function usePostFilters(posts: SocialPost[]) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // ❌ Runs on every render
  // ❌ Not cached by TanStack
  // ❌ Loses structural sharing
  const filteredPosts = useMemo(() => {
    return posts.filter(p => 
      p.caption?.includes(searchQuery)
    );
  }, [posts, searchQuery]);
  
  return { filteredPosts };
}

// Component
function PostsPage() {
  const { data } = usePosts(); // Fetches all posts
  const { filteredPosts } = usePostFilters(data?.data ?? []);
  // Every filter change re-runs useMemo
}
```

**Problems:**
1. Filtering runs on every render
2. Not cached - recalculates even if data hasn't changed
3. No structural sharing benefits
4. More re-renders than necessary

## ✅ Proper Pattern: select

```typescript
// GOOD: Single query with select transform
function usePostsWithFilters(searchQuery: string) {
  return useQuery({
    queryKey: ["posts", "with-filters"],
    queryFn: fetchPosts,
    // ✅ Cached by TanStack
    // ✅ Only re-runs when searchQuery changes
    // ✅ Benefits from structural sharing
    select: useCallback((data) => {
      return data.filter(p => 
        p.caption?.includes(searchQuery)
      );
    }, [searchQuery]),
  });
}

// Component
function PostsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data } = usePostsWithFilters(searchQuery);
  // Filtered data is cached and only recalculates when needed
}
```

**Benefits:**
1. Result is cached by query key
2. Only re-runs when select dependencies change
3. Structural sharing preserves referential equality
4. Fewer re-renders

## More Examples

### 1. List + Stats (Single Query)

```typescript
// ❌ Bad: Two useMemo hooks
function usePostsData() {
  const { data } = usePosts();
  
  const posts = useMemo(() => data?.data ?? [], [data]);
  
  const stats = useMemo(() => ({
    total: posts.length,
    published: posts.filter(p => p.status === "processed").length,
  }), [posts]);
  
  return { posts, stats };
}

// ✅ Good: Single select
function usePostsWithStats() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
    select: (data) => ({
      posts: data.data,
      stats: {
        total: data.data.length,
        published: data.data.filter(p => p.status === "processed").length,
      },
    }),
  });
}
```

### 2. Grouping by Status

```typescript
// ❌ Bad: useMemo for grouping
const postsByStatus = useMemo(() => {
  return {
    draft: posts.filter(p => p.status === "draft"),
    scheduled: posts.filter(p => p.status === "scheduled"),
    published: posts.filter(p => p.status === "processed"),
  };
}, [posts]);

// ✅ Good: select for grouping
const { data } = useQuery({
  queryKey: ["posts"],
  queryFn: fetchPosts,
  select: (data) => ({
    byStatus: {
      draft: data.data.filter(p => p.status === "draft"),
      scheduled: data.data.filter(p => p.status === "scheduled"),
      published: data.data.filter(p => p.status === "processed"),
    },
    all: data.data,
  }),
});
```

### 3. Parallel Queries with select

```typescript
// ❌ Bad: Fetch then useMemo to combine
const accountsQuery = useSocialAccounts();
const feedsQuery = useAllAccountFeeds(accountsQuery.data?.data.map(a => a.id));

const analytics = useMemo(() => {
  return combineData(accountsQuery.data, feedsQuery.data);
}, [accountsQuery.data, feedsQuery.data]);

// ✅ Good: useQueries with individual select
const feedQueries = useQueries({
  queries: accounts.map(account => ({
    queryKey: ["feeds", account.id],
    queryFn: () => fetchFeed(account.id),
    // Each query transforms its own data
    select: (data) => ({
      account,
      metrics: calculateMetrics(data),
    }),
  })),
});

// Combine is just array operations (no useMemo needed)
const analytics = {
  totals: feedQueries.reduce((acc, q) => acc + q.data?.metrics.likes ?? 0, 0),
};
```

## Key Differences

| Feature | useMemo | select |
|---------|---------|--------|
| **Caching** | No (recalculates on render) | Yes (cached by query) |
| **Structural Sharing** | No | Yes |
| **Referential Equality** | Manual | Automatic |
| **DevTools Visibility** | No | Yes |
| **Time-Travel** | No | Yes |

## Migration Guide

### Step 1: Identify useMemo for data transformation

```bash
grep -rn "useMemo.*filter\|useMemo.*map\|useMemo.*reduce" --include="*.ts" --include="*.tsx" app/
```

### Step 2: Move transformation to select

```typescript
// Before
const { data } = useQuery({ queryKey: ["posts"], queryFn: fetchPosts });
const filtered = useMemo(() => data?.filter(...), [data, filter]);

// After
const { data } = useQuery({
  queryKey: ["posts"],
  queryFn: fetchPosts,
  select: (data) => data?.filter(...),
});
```

### Step 3: Add select dependencies with useCallback

```typescript
// Dynamic filters need useCallback
const [filter, setFilter] = useState("");

const { data } = useQuery({
  queryKey: ["posts"], // Base data key
  queryFn: fetchPosts,
  select: useCallback((data) => {
    return data?.filter(p => p.status === filter);
  }, [filter]), // select dependencies
});
```

## When to Use useMemo

Use `useMemo` only for **expensive computations**, not data transformation:

```typescript
// ✅ Good: Expensive calculation
const chartData = useMemo(() => {
  return heavyCalculation(rawData);
}, [rawData]);

// ❌ Bad: Data transformation (use select instead)
const filtered = useMemo(() => data.filter(...), [data]);
```

## Summary

| Use `select` for | Use `useMemo` for |
|------------------|-------------------|
| Filtering | Expensive calculations |
| Sorting | Chart data preparation |
| Grouping | Complex aggregations |
| Mapping/transforming | Derived state |

---

**Remember: If you're transforming data from a query, use `select`.**
