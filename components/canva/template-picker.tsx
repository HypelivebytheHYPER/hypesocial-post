"use client";

import { Loader2, LayoutTemplate } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface CanvaTemplate {
  id: string;
  name?: string;
  thumbnail?: { url: string };
}

export function TemplateCard({
  template,
  onClick,
}: {
  template: CanvaTemplate;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full overflow-hidden rounded-lg border border-slate-700 text-left transition-all hover:border-blue-500/50"
    >
      {template.thumbnail?.url ? (
        <img src={template.thumbnail.url} alt={template.name} className="aspect-[4/3] w-full object-cover" />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-slate-800">
          <LayoutTemplate className="h-6 w-6 text-slate-400" />
        </div>
      )}
      <div className="bg-slate-800 p-2">
        <p className="truncate text-xs font-medium text-slate-100">{template.name || "Untitled"}</p>
      </div>
    </button>
  );
}

export function TemplatePicker({
  templates,
  isLoading,
  selectedTemplateId,
  onSelect,
  onClear,
  children,
}: {
  templates: CanvaTemplate[];
  isLoading: boolean;
  selectedTemplateId: string;
  onSelect: (id: string) => void;
  onClear: () => void;
  children?: React.ReactNode;
}) {
  if (!selectedTemplateId) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-300">Pick a brand template</p>
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        ) : (
          <div className="space-y-3">
            {templates.map((t) => (
              <TemplateCard key={t.id} template={t} onClick={() => onSelect(t.id)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" className="border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-slate-100" onClick={onClear}>
          Change
        </Button>
        {children}
      </div>
    </div>
  );
}

export function TemplateFieldMapping({
  datasetFields,
  mappings,
  onChange,
  products,
}: {
  datasetFields: { name: string; type: string }[];
  mappings: Record<string, string>;
  onChange: (name: string, value: string) => void;
  products: { record_id: string; Name: string }[];
}) {
  if (datasetFields.length === 0) {
    return <div className="text-sm text-slate-400">No fields</div>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-100">Template Fields</h3>
      {datasetFields.map((field) => (
        <div key={field.name}>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-medium text-slate-200">{field.name}</span>
            <Badge variant="secondary" className="bg-slate-700 text-[10px] text-slate-200">
              {field.type}
            </Badge>
          </div>
          {field.type === "image" ? (
            <select
              value={mappings[field.name] || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              className="h-8 w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none"
            >
              <option value="">Select product...</option>
              {products.map((p) => (
                <option key={p.record_id} value={p.record_id}>
                  {p.Name}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={mappings[field.name] || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={`Enter ${field.type}`}
              className="h-8 w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none placeholder:text-slate-500"
            />
          )}
        </div>
      ))}
    </div>
  );
}
