# AI Agent Icon Design Guide - 2026

Preventing icon overwhelm in AI agent interfaces while maintaining usability.

---

## The Problem

AI agents often suffer from **icon fatigue**:
- Too many action icons = cognitive overload
- Unclear icon meanings = user confusion
- Decorative icons = visual noise

## The 3-Icon Rule

**Maximum 3 visible icons per element** at any given time.

```
✅ GOOD: Card with 2 icons
┌─────────────────────────┐
│ John Doe           ✏️ ⋮ │
│ john@email.com          │
└─────────────────────────┘

❌ BAD: Card with 6 icons
┌─────────────────────────┐
│ 👤 John Doe  ✏️ 🗑️ ⭐ 🔗 ⋮ │
│ ✉️ john@email.com       │
└─────────────────────────┘
```

---

## Icon Hierarchy System

### Level 1: Always Visible (1-2 icons)
Only the most critical actions:
- **Edit** (if editable)
- **More options** (overflow menu)

### Level 2: Context Reveal (on hover/tap)
Secondary actions appear on interaction:
- Swipe to reveal
- Hover dropdown
- Expand to show

### Level 3: Hidden in Menus
All other actions in "More" menu:
- Delete
- Duplicate
- Share
- Export

---

## Implementation Patterns

### Pattern 1: Swipe to Reveal (Mobile)

```tsx
// Show only edit icon initially
// Swipe left reveals: Edit | Delete
<Card>
  <Visible>Avatar + Name + ✏️</Visible>
  <SwipeLeftReveal>
    <EditAction />
    <DeleteAction />
  </SwipeLeftReveal>
</Card>
```

### Pattern 2: Expandable Actions (Desktop)

```tsx
// Compact: Only pencil visible
// Expanded: Shows all actions
<Card>
  {!expanded && <PencilIcon />}
  {expanded && (
    <>
      <PencilIcon />
      <DuplicateIcon />
      <ShareIcon />
      <DeleteIcon />
    </>
  )}
</Card>
```

### Pattern 3: Contextual Dropdown

```tsx
// Single "More" icon reveals menu
<Card>
  <PrimaryAction />
  <DropdownMenu>
    <Edit />
    <Duplicate />
    <Share />
    <Separator />
    <Delete variant="destructive" />
  </DropdownMenu>
</Card>
```

---

## Icon Selection Guide

| Action | Icon | Alternative | When to use |
|--------|------|-------------|-------------|
| Edit | ✏️ Pencil | 📝 | Primary editing action |
| Delete | 🗑️ Trash | ✕ | Destructive, use red color |
| Save | ✓ Check | 💾 | Confirm action |
| Cancel | ✕ X | ← | Dismiss/close |
| More | ⋮ Vertical dots | ⋯ | Overflow menu |
| Expand | ▼ ChevronDown | + | Reveal more content |
| Collapse | ▲ ChevronUp | − | Hide content |

**Avoid these decorative icons:**
- 👤 User (use avatar instead)
- ✉️ Email (use label)
- 📅 Calendar (use formatted date)
- 📍 Location (use text)

---

## Color & Contrast

### Icon Colors (Semantic)

```css
/* Primary actions */
--icon-primary: #3B82F6;      /* Blue - Edit, Save */

/* Secondary actions */
--icon-secondary: #6B7280;    /* Gray - More, Expand */

/* Destructive */
--icon-destructive: #EF4444;  /* Red - Delete */

/* Success */
--icon-success: #10B981;      /* Green - Complete */
```

### Size Guidelines

| Context | Size | Touch Target |
|---------|------|--------------|
| Inline with text | 16px | 32×32px min |
| Card header | 18px | 40×40px min |
| Floating action | 24px | 48×48px min |

---

## AI Agent Specific Guidelines

### 1. Status Indicators (Not Icons)

Use **badges** instead of icons for status:

```
❌ Processing... ⏳
✅ [Processing...]  ← Badge with text

❌ Done ✓
✅ [Completed]      ← Green badge
```

### 2. Agent Actions (Text + Icon)

AI agent actions should use **text + icon**, not icon alone:

```
❌ 🤖
✅ Run Agent 🤖

❌ 📊
✅ Generate Report 📊
```

### 3. Loading States (No Spinner Icons)

Avoid spinners, use **progressive text**:

```
❌ Loading... ⏳
✅ Analyzing codebase...
✅ Found 12 files...
✅ Processing complete
```

---

## Implementation Checklist

- [ ] Max 2 icons visible per card/item
- [ ] All icons have `aria-label`
- [ ] Destructive actions (delete) use red color
- [ ] Primary actions use blue color
- [ ] Secondary actions use gray color
- [ ] Touch targets are 40×40px minimum
- [ ] Swipe actions revealed on mobile
- [ ] Hover actions on desktop
- [ ] No decorative icons without function

---

## Examples

### Before (Icon Overwhelm)
```
┌────────────────────────────┐
│ 👤 John Doe ⭐ ✉️ 📱       │
│ Manager 📍 NYC 🕐 2h       │
│ ✏️ 🗑️ 🔗 📤 ⭐ 📋          │
└────────────────────────────┘
Icons: 12 (!)
```

### After (Clean)
```
┌────────────────────────────┐
│ J  John Doe           ⋮    │
│ Manager • NYC • 2h ago     │
└────────────────────────────┘

Swipe left → [Edit] [Delete]

Icons: 1 (visible) + 2 (revealed)
```

---

## Component: IconButton (Constrained)

```tsx
interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  variant?: 'primary' | 'secondary' | 'destructive';
  onClick: () => void;
}

// Usage - Limited to 3 per row
<Row>
  <IconButton icon={Pencil} label="Edit" variant="primary" />
  <IconButton icon={MoreVertical} label="More" variant="secondary" />
</Row>
```

---

**Remember: Icons are for recognition, not decoration.**
When in doubt, use text.
