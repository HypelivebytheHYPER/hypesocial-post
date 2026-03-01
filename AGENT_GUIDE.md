# Agent Guide - HypeSocial Post

> **Purpose:** Help AI agents work effectively with this codebase
> **Version:** 2026-03-01

---

## 🎯 AGENT MANDATES

### DO ✅
- **Read CLAUDE.md first** before making changes
- **Check types/post-for-me.ts** for API type definitions
- **Follow the SSOT** (Single Source of Truth in `docs/SINGLE_SOURCE_OF_TRUTH.md`)
- **Run type-check** after modifications: `pnpm type-check`
- **Use existing hooks** in `lib/hooks/usePostForMe.ts`
- **Import from @/** path aliases, never relative `../../`

### DON'T ❌
- Don't guess API types - check OpenAPI JSON at `/Users/mdch/Downloads/api-post-for-me.json`
- Don't create duplicate types - use existing ones from `types/post-for-me.ts`
- Don't use `object` or `unknown` - define proper interfaces
- Don't modify `docs/SINGLE_SOURCE_OF_TRUTH.md` manually (auto-generated)
- Don't break the build - always run `pnpm type-check`

---

## 📁 CRITICAL FILE REFERENCE

| File | Purpose | When to Read |
|------|---------|--------------|
| `CLAUDE.md` | Project guide | **Before ANY work** |
| `types/post-for-me.ts` | API types | When working with data models |
| `lib/hooks/usePostForMe.ts` | API hooks | When adding API calls |
| `lib/social-platforms.ts` | Platform config | When working with platforms |
| `docs/SINGLE_SOURCE_OF_TRUTH.md` | Type reference | To verify type sources |
| `/Users/mdch/Downloads/api-post-for-me.json` | **OpenAPI SSOT** | To verify API types |

---

## 🔧 COMMON TASKS

### Adding a New API Hook
```typescript
// lib/hooks/usePostForMe.ts
export function useNewFeature() {
  return useQuery({
    queryKey: pfmKeys.all,
    queryFn: () => apiClient("/api/new-feature"),
  });
}
```

### Adding a New Type
1. Check OpenAPI JSON first:
   ```bash
   grep -A 10 '"NewTypeDto"' /Users/mdch/Downloads/api-post-for-me.json
   ```
2. Add to `types/post-for-me.ts`
3. Export it
4. Run `pnpm type-check`

### Creating a New Page
```typescript
// app/(dashboard)/new-page/page.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Page - HypeSocial",
};

export default function NewPage() {
  return (
    <div>
      <h1>New Page</h1>
    </div>
  );
}
```

---

## 🧪 TESTING REQUIREMENTS

### Before Committing Changes:
```bash
# 1. Type check
pnpm type-check

# 2. Lint
pnpm lint

# 3. Build
pnpm build
```

### If Adding New Features:
- Write unit tests in `tests/unit/`
- Write integration tests in `tests/integration/`
- Add E2E tests for user flows in `tests/e2e/`

---

## 🐛 TROUBLESHOOTING

### Type Errors
```bash
# Regenerate SSOT
pnpm update:ssot

# Then type check
pnpm type-check
```

### API Mismatch
Check the OpenAPI spec:
```bash
grep -B 2 -A 10 '"fieldName"' /Users/mdch/Downloads/api-post-for-me.json
```

### Build Failures
```bash
# Clean build
rm -rf .next && pnpm build
```

---

## 📝 DOCUMENTATION

### What to Document:
- New API hooks
- New components
- Configuration changes
- Environment variables

### Where to Document:
- `CLAUDE.md` - Project-wide changes
- `TESTING.md` - Test procedures
- Inline comments - Complex logic

---

## 🎨 CODE PATTERNS

### API Route Pattern
```typescript
// app/api/resource/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { ResourceType } from "@/types/post-for-me";

export async function GET() {
  try {
    const data = await fetchFromAPI();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch" },
      { status: 500 }
    );
  }
}
```

### Component Pattern
```typescript
"use client";

import { usePosts } from "@/lib/hooks/usePostForMe";
import type { SocialPost } from "@/types/post-for-me";

interface Props {
  post: SocialPost;
}

export function PostCard({ post }: Props) {
  // Implementation
}
```

---

## 🔄 WORKFLOW

### 1. Start Task
- Read `CLAUDE.md`
- Understand the current state
- Identify relevant files

### 2. Implement
- Make changes
- Follow existing patterns
- Run `pnpm type-check`

### 3. Verify
- Test manually if needed
- Run build: `pnpm build`
- Check for errors

### 4. Document
- Update relevant docs
- Add comments for complex logic

---

## 🆘 ESCALATION

If stuck or confused:
1. Check `CLAUDE.md` again
2. Check `docs/SINGLE_SOURCE_OF_TRUTH.md`
3. Verify against OpenAPI JSON
4. Ask user for clarification

---

## ✅ PRE-COMMIT CHECKLIST

- [ ] Read CLAUDE.md
- [ ] TypeScript check passes
- [ ] Build succeeds
- [ ] No duplicate types created
- [ ] Uses @/ path aliases
- [ ] Follows existing patterns
- [ ] Updated documentation if needed

---

**Remember:** This project has 138 types and 68 OpenAPI DTOs. When in doubt, check the types file or OpenAPI spec - don't guess!
