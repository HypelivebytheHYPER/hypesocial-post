"use client";

import { Loader2, CheckCircle2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useResizeJob, useExportJob } from "@/lib/hooks";

export function ResizeResultRow({
  name,
  jobId,
  onExport,
}: {
  name: string;
  jobId?: string;
  onExport: (designId: string) => void;
}) {
  const { data } = useResizeJob(jobId ?? "", { refetchInterval: jobId ? 3000 : false });
  const job = data as { status?: string; design?: { id?: string } } | undefined;
  const isDone = job?.status === "success";
  const designId = job?.design?.id;

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-900 p-2">
      <div className="flex items-center gap-2">
        {!jobId ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        ) : isDone ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
        )}
        <span className="text-xs font-medium">{name}</span>
      </div>
      {isDone && designId ? (
        <Button size="sm" variant="outline" className="h-6 gap-1 text-xs" onClick={() => onExport(designId)}>
          <Download className="h-3 w-3" /> Export
        </Button>
      ) : (
        <span className="text-[10px] text-muted-foreground">{!jobId ? "Waiting..." : "Resizing..."}</span>
      )}
    </div>
  );
}

export function ExportResultRow({ name, exportId }: { name: string; exportId: string }) {
  const { data } = useExportJob(exportId, { refetchInterval: exportId ? 3000 : false });
  const job = data as { status?: string; urls?: { url: string }[] } | undefined;
  const isDone = job?.status === "success";
  const url = job?.urls?.[0]?.url;

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-900 p-2">
      <div className="flex items-center gap-2">
        {isDone ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />}
        <span className="text-xs font-medium">{name}</span>
      </div>
      {isDone && url ? (
        <a href={url} target="_blank" rel="noreferrer">
          <Button size="sm" variant="outline" className="h-6 gap-1 text-xs">
            <Download className="h-3 w-3" /> Download
          </Button>
        </a>
      ) : (
        <span className="text-[10px] text-muted-foreground">Exporting...</span>
      )}
    </div>
  );
}
