# HypeSocial Optimization - TOON Guided Plan

## TOON Cache Status

```
~/.kimi/cache/hypesocial-optimization.toon
~/.kimi/cache/hypesocial-large-components.toon
```

## Phase 1 Progress (TOON Format)

```
[4,]{phase,file,lines_before,lines_after,status,components_extracted}:
1,app/(dashboard)/analytics/page.tsx,879,259,completed,6
1,app/(dashboard)/posts/page.tsx,872,872,pending,0
1,app/(dashboard)/page.tsx,842,842,pending,0
1,app/(dashboard)/accounts/connect/page.tsx,623,623,pending,0
```

## Large Component Analysis (TOON)

```
[6,]{file_path,lines,component_count,hooks_used,has_loading,has_error,has_empty,extractable_hooks}:
app/(dashboard)/posts/page.tsx,872,8,4,yes,yes,no,usePostFilters|useLayout
app/(dashboard)/page.tsx,842,6,3,yes,no,yes,useDashboardStats
app/(dashboard)/accounts/connect/page.tsx,623,5,2,yes,yes,yes,usePlatformGrid
app/(dashboard)/webhooks/WebhooksClient.tsx,520,4,2,yes,no,no,useWebhookForm
app/(dashboard)/posts/@compose/page.tsx,501,6,3,yes,no,no,useComposeForm
components/ui/file-upload.tsx,525,3,2,yes,yes,no,N/A
```

## Next Target: posts/page.tsx

### Analysis from TOON
- **Lines**: 872 (target: <400)
- **Components**: 8 sub-components to extract
- **Hooks**: 4 (usePosts, useDeletePost, useRetryPost, usePrefetchPost)
- **States**: loading, error (no empty state)
- **Extractable**: usePostFilters, useLayout

### Extraction Plan

```
app/(dashboard)/posts/
├── page.tsx                    # 300 lines (was 872)
├── components/
│   ├── PostBoard.tsx          # Kanban board view
│   ├── PostList.tsx           # List view
│   ├── PostCard.tsx           # Individual card
│   ├── StatusColumn.tsx       # Board column
│   ├── FilterBar.tsx          # Search & filters
│   ├── ViewToggle.tsx         # Board/List switch
│   └── EmptyState.tsx         # No posts state
└── hooks/
    └── usePostFilters.ts      # Filter logic
```

### Component Breakdown

| Component | Lines | Purpose |
|-----------|-------|---------|
| PostBoard | ~180 | Kanban drag-drop board |
| PostList | ~120 | List view with virtual scroll |
| PostCard | ~100 | Card with actions |
| StatusColumn | ~80 | Column header + drop zone |
| FilterBar | ~60 | Search, filter, sort |
| ViewToggle | ~30 | Board/List toggle |
| EmptyState | ~40 | No posts UI |

### Hook Extraction

```typescript
// hooks/usePostFilters.ts
export function usePostFilters(posts: SocialPost[]) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  
  const filtered = useMemo(() => {
    return posts.filter(p => {
      const matchesSearch = !search || p.caption?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "all" || p.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [posts, search, status]);
  
  const byStatus = useMemo(() => {
    return groupBy(filtered, 'status');
  }, [filtered]);
  
  return { search, setSearch, status, setStatus, viewMode, setViewMode, filtered, byStatus };
}
```

## Time Estimate

| Task | Time |
|------|------|
| Create component files | 30 min |
| Extract usePostFilters | 20 min |
| Refactor page.tsx | 40 min |
| Type check & verify | 10 min |
| **Total** | **1h 40m** |

## Success Criteria

- [ ] posts/page.tsx < 400 lines
- [ ] All TypeScript checks pass
- [ ] No functionality lost
- [ ] Update TOON cache

---

*Generated from TOON cache analysis*
