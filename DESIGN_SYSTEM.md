# HypeSocial Design System v2.0

## Quick Start

```tsx
// Use tokens instead of arbitrary values
<div className="bg-bg-base text-text-primary p-space-4">
  <h1 className="text-text-2xl font-semibold">Title</h1>
  <p className="text-text-secondary">Description</p>
</div>
```

## Token Hierarchy

```
Primitive Tokens (Colors, Numbers)
    ↓
Semantic Tokens (Roles: bg, text, border)
    ↓
Component Tokens (btn-bg, card-shadow)
    ↓
Components (Button, Card)
```

## Color Tokens

### Backgrounds
| Token | Usage |
|-------|-------|
| `--bg-base` | Page background |
| `--bg-elevated` | Cards, panels |
| `--bg-brand` | Primary buttons |
| `--bg-brand-subtle` | Brand accents |

### Text
| Token | Usage |
|-------|-------|
| `--text-primary` | Headings, body |
| `--text-secondary` | Descriptions |
| `--text-tertiary` | Hints, metadata |
| `--text-brand` | Links, accents |

### Status
| Token | Usage |
|-------|-------|
| `--text-success` | Success messages |
| `--text-error` | Error messages |
| `--bg-success` | Success backgrounds |
| `--bg-error` | Error backgrounds |

## Spacing Tokens

Base unit: **4px** (0.25rem)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Icon gaps |
| `--space-2` | 8px | Tight spacing |
| `--space-3` | 12px | Default gaps |
| `--space-4` | 16px | Section padding |
| `--space-6` | 24px | Card padding |
| `--space-8` | 32px | Section gaps |

## Typography

| Token | Size | Usage |
|-------|------|-------|
| `--text-sm` | 14px | Captions, labels |
| `--text-base` | 16px | Body text |
| `--text-lg` | 18px | Lead paragraphs |
| `--text-xl` | 20px | Subheadings |
| `--text-2xl` | 24px | H3 headings |
| `--text-3xl` | 30px | H2 headings |

## Shadows (Elevation)

| Token | Usage |
|-------|-------|
| `--shadow-1` | Subtle borders |
| `--shadow-2` | Buttons, inputs |
| `--shadow-3` | Cards, dropdowns |
| `--shadow-4` | Modals, popovers |

## Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Small buttons |
| `--radius-md` | 8px | Inputs |
| `--radius-lg` | 12px | Cards |
| `--radius-xl` | 16px | Large cards |
| `--radius-full` | 9999px | Pills, avatars |

## Components

### Empty States

```tsx
import { EmptyState, EmptyPostsState } from "@/components/ui/empty-state";

// Generic
<EmptyState
  icon={FileText}
  title="No posts"
  description="Create your first post"
  action={{ label: "Create", onClick: handleCreate }}
/>

// Pre-built
<EmptyPostsState onCreate={handleCreate} />
<EmptyAccountsState onConnect={handleConnect} />
```

### Skeletons

```tsx
import { ListSkeleton, PostCardSkeleton } from "@/components/ui/skeleton";

// Loading list
{isLoading ? <ListSkeleton count={3} /> : <PostsList />}

// Loading card
{isLoading ? <PostCardSkeleton /> : <PostCard />}
```

## Migration Guide

### From Old to New

```tsx
// Before (arbitrary values)
<div className="p-4 text-slate-600 bg-white">

// After (tokens)
<div className="p-space-4 text-text-secondary bg-bg-base">

// Before (hardcoded colors)
<button className="bg-purple-600 hover:bg-purple-700">

// After (component tokens)
<button className="btn btn-primary">
```

## Figma MCP Integration

When using Figma MCP to generate components:

1. **Extract Tokens First**
   ```
   Generate design tokens from this Figma frame
   ```

2. **Create Components**
   ```
   Create a Button component using these tokens
   ```

3. **Apply to Layout**
   ```
   Build a dashboard layout with these components
   ```

## Best Practices

1. **Never use arbitrary values** - Always use tokens
2. **Semantic naming** - Use `bg-base` not `bg-white`
3. **Dark mode first** - Tokens adapt automatically
4. **Spacing consistency** - Use 4px base scale
5. **Component variants** - Define in CSS, not JS
