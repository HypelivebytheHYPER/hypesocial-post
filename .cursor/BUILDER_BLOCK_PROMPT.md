# HypeSocial Builder Block Generation Prompt

Use this prompt with the Shadcn Studio MCP server to generate new builder blocks that fit the existing architecture.

## Architecture Constraints

Every block must:
1. Be a React component in `components/builder/blocks/[kebab-name]-block.tsx`
2. Export a `props` interface and a component that receives `{ props: InterfaceName }`
3. Use Tailwind CSS + shadcn/ui components only
4. Theme-aware via CSS vars: `--primary`, `--radius`, `bg-background`, `text-foreground`, etc.
5. Have a matching `codeTemplate` function in `components/builder/blocks/registry.ts`

## Prompt Template

```
Create a builder block component called "[BlockName]Block" for a Next.js + shadcn/ui landing page builder.

Requirements:
- File: components/builder/blocks/[kebab-name]-block.tsx
- Props interface: [BlockName]BlockProps with these fields: [list fields]
- Component signature: export function [BlockName]Block({ props }: { props: [BlockName]BlockProps })
- Use Tailwind classes. Theme colors via bg-primary, text-primary-foreground, bg-background, text-foreground, text-muted-foreground, border-border.
- Use shadcn/ui components: @/components/ui/button, @/components/ui/badge, @/components/ui/card where appropriate.
- Include sensible defaults for all props.
- Responsive design (mobile-first).
- Clean, minimal, modern aesthetic matching shadcn/ui.

Also provide a codeTemplate function (string generation) that outputs the equivalent static JSX as a single string, using template literals for dynamic props.

Example block to match style: the promo-catalog block uses rounded-2xl cards, soft gradients, and festive badges.
```

## Post-Generation Checklist

After MCP generates the component:

1. Add block type to `components/builder/blocks/types.ts` BlockType union
2. Import component and props in `components/builder/blocks/registry.ts`
3. Add registry entry to `blockRegistry` with:
   - type, name, description, iconName (Lucide icon), defaultProps, component, codeTemplate
4. Add config to `blockConfigs` with editable PropertyField[]
5. Add shuffle variants to `blockVariants`
6. Handle array editing in `components/builder/properties-sheet.tsx` if needed
7. Run `npx tsc --noEmit` to verify
