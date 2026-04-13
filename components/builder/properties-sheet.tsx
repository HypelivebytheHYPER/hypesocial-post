"use client";

import { useBuilderStore } from "./store";
import { blockRegistry, blockConfigs } from "./blocks/registry";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Settings2 } from "lucide-react";
import { RangeInput } from "./range-input";
import { ImagePicker } from "./image-picker";
import { AiDesignPropertyEditor } from "./blocks/ai-design-block";
import type { PropertyField, BuilderBlock } from "./blocks/types";

function RowEditor({
  columns,
  rows,
  onChange,
}: {
  columns: Array<{ key: string; label: string }>;
  rows: Record<string, string>[];
  onChange: (val: Record<string, string>[]) => void;
}) {
  function addRow() {
    const emptyRow: Record<string, string> = {};
    (columns || []).forEach((col) => (emptyRow[col.key] = ""));
    onChange([...rows, emptyRow]);
  }
  function removeRow(idx: number) {
    const next = [...rows];
    next.splice(idx, 1);
    onChange(next);
  }
  function updateRow(idx: number, key: string, val: string) {
    const next = [...rows];
    next[idx] = { ...next[idx], [key]: val };
    onChange(next);
  }
  return (
    <div className="space-y-3">
      {rows.map((row, idx) => (
        <div key={idx} className="rounded-md border border-border bg-background p-2.5 space-y-2">
          <div className="grid gap-2">
            {(columns || []).map((col) => (
              <Input
                key={col.key}
                placeholder={col.label}
                value={row[col.key] || ""}
                onChange={(e) => updateRow(idx, col.key, e.target.value)}
                className="h-8 text-sm"
              />
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive hover:text-destructive"
            onClick={() => removeRow(idx)}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Remove
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full text-xs" onClick={addRow}>
        <Plus className="mr-1 h-3 w-3" />
        Add Row
      </Button>
    </div>
  );
}

function ArrayEditor({
  value,
  onChange,
  fieldKey,
}: {
  value: unknown[];
  onChange: (val: unknown[]) => void;
  fieldKey: string;
}) {
  const items = Array.isArray(value) ? value : [];

  function addItem() {
    if (fieldKey === "features") {
      onChange([...items, { icon: "Sparkles", title: "New Feature", description: "Description here" }]);
    } else if (fieldKey === "tiers") {
      onChange([
        ...items,
        {
          name: "New Tier",
          price: "$0",
          period: "/mo",
          description: "Description",
          features: ["Feature 1"],
          highlighted: false,
          cta: "Get started",
        },
      ]);
    } else if (fieldKey === "testimonials") {
      onChange([
        ...items,
        {
          quote: "Great product!",
          author: "Name",
          role: "Role",
          avatar: "NN",
          rating: 5,
        },
      ]);
    } else if (fieldKey === "items") {
      onChange([...items, { question: "Question?", answer: "Answer." }]);
    } else if (fieldKey === "links") {
      onChange([...items, { label: "Link", href: "#" }]);
    } else if (fieldKey === "columns") {
      onChange([...items, { key: "column", label: "Column" }]);
    } else if (fieldKey === "products") {
      onChange([...items, { name: "Product Name", image: "", price: "0", originalPrice: "", badge: "", badgeColor: "#facc15" }]);
    } else {
      onChange([...items, ""]);
    }
  }

  function removeItem(idx: number) {
    const next = [...items];
    next.splice(idx, 1);
    onChange(next);
  }

  function updateItem(idx: number, val: unknown) {
    const next = [...items];
    next[idx] = val;
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="rounded-md border border-border bg-background p-2.5 space-y-2">
          {fieldKey === "features" && (
            <>
              <Input
                placeholder="Title"
                value={(item as Record<string, string>).title || ""}
                onChange={(e) => updateItem(idx, { ...(item as object), title: e.target.value })}
                className="h-8 text-sm"
              />
              <Textarea
                placeholder="Description"
                value={(item as Record<string, string>).description || ""}
                onChange={(e) => updateItem(idx, { ...(item as object), description: e.target.value })}
                className="min-h-[60px] text-sm"
              />
            </>
          )}
          {fieldKey === "tiers" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Name"
                  value={(item as Record<string, string>).name || ""}
                  onChange={(e) => updateItem(idx, { ...(item as object), name: e.target.value })}
                  className="h-8 text-sm"
                />
                <Input
                  placeholder="Price"
                  value={(item as Record<string, string>).price || ""}
                  onChange={(e) => updateItem(idx, { ...(item as object), price: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <Input
                placeholder="CTA"
                value={(item as Record<string, string>).cta || ""}
                onChange={(e) => updateItem(idx, { ...(item as object), cta: e.target.value })}
                className="h-8 text-sm"
              />
            </>
          )}
          {fieldKey === "testimonials" && (
            <>
              <Textarea
                placeholder="Quote"
                value={(item as Record<string, string>).quote || ""}
                onChange={(e) => updateItem(idx, { ...(item as object), quote: e.target.value })}
                className="min-h-[60px] text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Author"
                  value={(item as Record<string, string>).author || ""}
                  onChange={(e) => updateItem(idx, { ...(item as object), author: e.target.value })}
                  className="h-8 text-sm"
                />
                <Input
                  placeholder="Role"
                  value={(item as Record<string, string>).role || ""}
                  onChange={(e) => updateItem(idx, { ...(item as object), role: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
            </>
          )}
          {fieldKey === "items" && (
            <>
              <Input
                placeholder="Question"
                value={(item as Record<string, string>).question || ""}
                onChange={(e) => updateItem(idx, { ...(item as object), question: e.target.value })}
                className="h-8 text-sm"
              />
              <Textarea
                placeholder="Answer"
                value={(item as Record<string, string>).answer || ""}
                onChange={(e) => updateItem(idx, { ...(item as object), answer: e.target.value })}
                className="min-h-[60px] text-sm"
              />
            </>
          )}
          {fieldKey === "links" && (
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Label"
                value={(item as Record<string, string>).label || ""}
                onChange={(e) => updateItem(idx, { ...(item as object), label: e.target.value })}
                className="h-8 text-sm"
              />
              <Input
                placeholder="URL"
                value={(item as Record<string, string>).href || ""}
                onChange={(e) => updateItem(idx, { ...(item as object), href: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          )}
          {fieldKey === "columns" && (
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Key"
                value={(item as Record<string, string>).key || ""}
                onChange={(e) => updateItem(idx, { ...(item as object), key: e.target.value })}
                className="h-8 text-sm"
              />
              <Input
                placeholder="Label"
                value={(item as Record<string, string>).label || ""}
                onChange={(e) => updateItem(idx, { ...(item as object), label: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          )}
          {fieldKey === "products" && (
            <div className="space-y-2">
              <Input
                placeholder="Product Name"
                value={(item as Record<string, string>).name || ""}
                onChange={(e) => updateItem(idx, { ...(item as object), name: e.target.value })}
                className="h-8 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Price"
                  value={(item as Record<string, string>).price || ""}
                  onChange={(e) => updateItem(idx, { ...(item as object), price: e.target.value })}
                  className="h-8 text-sm"
                />
                <Input
                  placeholder="Original Price"
                  value={(item as Record<string, string>).originalPrice || ""}
                  onChange={(e) => updateItem(idx, { ...(item as object), originalPrice: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Badge"
                  value={(item as Record<string, string>).badge || ""}
                  onChange={(e) => updateItem(idx, { ...(item as object), badge: e.target.value })}
                  className="h-8 text-sm"
                />
                <Input
                  placeholder="Badge Color"
                  value={(item as Record<string, string>).badgeColor || ""}
                  onChange={(e) => updateItem(idx, { ...(item as object), badgeColor: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive hover:text-destructive"
            onClick={() => removeItem(idx)}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Remove
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full text-xs" onClick={addItem}>
        <Plus className="mr-1 h-3 w-3" />
        Add Item
      </Button>
    </div>
  );
}

function FieldEditor({
  field,
  value,
  onChange,
  blockProps,
}: {
  field: PropertyField;
  value: unknown;
  onChange: (val: unknown) => void;
  blockProps?: Record<string, unknown>;
}) {
  if (field.type === "boolean") {
    return (
      <div className="flex items-center justify-between rounded-md border border-border bg-background p-3">
        <Label className="text-sm">{field.label}</Label>
        <Switch checked={!!value} onCheckedChange={(checked) => onChange(checked)} />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs">{field.label}</Label>
        <Select value={String(value)} onValueChange={(v) => onChange(v)}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (field.type === "image") {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs">{field.label}</Label>
        <ImagePicker value={String(value ?? "")} onChange={onChange} />
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs">{field.label}</Label>
        <Textarea
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[80px] text-sm"
        />
      </div>
    );
  }

  if (field.type === "number") {
    const numValue = typeof value === "number" ? value : Number(value ?? 0);
    const hasRange = field.min !== undefined && field.max !== undefined;
    return (
      <div className="space-y-2">
        <Label className="text-xs">{field.label}</Label>
        <div className="flex items-center gap-3">
          {hasRange && (
            <div className="flex-1">
              <RangeInput
                value={numValue}
                onChange={(v) => onChange(v)}
                min={field.min}
                max={field.max}
                step={field.step ?? 1}
              />
            </div>
          )}
          <Input
            type="number"
            value={String(value ?? "")}
            onChange={(e) => {
              const val = e.target.value === "" ? (field.min ?? 0) : Number(e.target.value);
              onChange(val);
            }}
            className="h-8 w-20 text-sm"
          />
        </div>
      </div>
    );
  }

  if (field.type === "array") {
    if (field.key === "rows") {
      const columns = (blockProps?.columns as Array<{ key: string; label: string }>) || [];
      const rows = Array.isArray(value) ? (value as Record<string, string>[]) : [];
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <RowEditor columns={columns} rows={rows} onChange={onChange as (val: Record<string, string>[]) => void} />
        </div>
      );
    }
    return (
      <div className="space-y-1.5">
        <Label className="text-xs">{field.label}</Label>
        <ArrayEditor value={value as unknown[]} onChange={onChange} fieldKey={field.key} />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{field.label}</Label>
      <Input
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 text-sm"
      />
    </div>
  );
}

export function PropertiesPanel() {
  const { selectedBlockId, blocks, updateBlock, selectBlock } = useBuilderStore();
  const block = blocks.find((b: BuilderBlock) => b.id === selectedBlockId);

  if (!block) return null;

  const config = blockConfigs[block.type];
  const registryEntry = blockRegistry[block.type];

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">{registryEntry.name}</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => selectBlock(null)}
        >
          Done
        </Button>
      </div>
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          {block.type === "ai-design" && (
            <AiDesignPropertyEditor
              value={block.props as import("./blocks/ai-design-block").AiDesignBlockProps}
              onChange={(val) => updateBlock(block.id, val)}
            />
          )}
          {config.fields
            .filter((field) => block.type !== "ai-design" || field.key !== "prompt")
            .map((field: PropertyField) => (
              <FieldEditor
                key={field.key}
                field={field}
                value={block.props[field.key]}
                onChange={(val: unknown) => updateBlock(block.id, { [field.key]: val })}
                blockProps={block.props}
              />
            ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
