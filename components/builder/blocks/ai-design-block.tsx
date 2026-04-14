"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AiDesignBlockProps {
  prompt?: string;
  src?: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  overlay?: boolean;
  alignment?: "left" | "center";
}

export function AiDesignBlock({ props }: { props: AiDesignBlockProps }) {
  const {
    src = "",
    headline = "Your Design Here",
    subheadline = "AI-generated backgrounds for stunning visuals.",
    ctaText = "Get Started",
    overlay = true,
    alignment = "center",
  } = props;

  return (
    <section className="relative w-full overflow-hidden bg-background">
      <div className="relative mx-auto flex min-h-[360px] max-w-5xl flex-col justify-center px-6 py-16 lg:py-24">
        {src ? (
          <>
            { }
            <img
              src={src}
              alt={headline}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {overlay && <div className="absolute inset-0 bg-black/50" />}
          </>
        ) : (
          <div className="absolute inset-0 bg-muted" />
        )}

        <div
          className={cn(
            "relative z-10 flex flex-col",
            alignment === "center" ? "items-center text-center" : "items-start text-left"
          )}
        >
          <h1 className="mb-4 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {headline}
          </h1>
          <p className="mb-8 max-w-xl text-lg text-white/90">{subheadline}</p>
          <Button size="lg" className="gap-2">
            {ctaText}
          </Button>
        </div>
      </div>
    </section>
  );
}

export function AiDesignPropertyEditor({
  value,
  onChange,
}: {
  value: AiDesignBlockProps;
  onChange: (val: Partial<AiDesignBlockProps>) => void;
}) {
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  async function handleGenerate() {
    if (!value.prompt?.trim()) return;
    setGenerateLoading(true);
    setGenerateError(null);
    setTaskId(null);
    try {
      const res = await fetch("/api/freepik/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: value.prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }
      const tid = data.data?.task_id;
      if (!tid) {
        throw new Error("No task ID received");
      }
      setTaskId(tid);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Generation failed");
      setGenerateLoading(false);
    }
  }

  const pollTask = useCallback(
    async (tid: string) => {
      try {
        const res = await fetch(`/api/freepik/generate-status?taskId=${tid}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Status check failed");
        }
        const status = data.data?.status;
        if (status === "COMPLETED") {
          const url = data.data?.generated_image?.url || data.data?.image?.url;
          if (url) {
            onChange({ src: url });
          } else {
            setGenerateError("No image URL in completed task");
          }
          setGenerateLoading(false);
          setTaskId(null);
        } else if (status === "FAILED" || status === "CANCELLED") {
          setGenerateError(`Task ${status.toLowerCase()}`);
          setGenerateLoading(false);
          setTaskId(null);
        }
      } catch (err) {
        setGenerateError(err instanceof Error ? err.message : "Status check failed");
        setGenerateLoading(false);
        setTaskId(null);
      }
    },
    [onChange]
  );

  useEffect(() => {
    if (!taskId) return;
    const interval = setInterval(() => {
      pollTask(taskId);
    }, 3000);
    return () => clearInterval(interval);
  }, [taskId, pollTask]);

  return (
    <div className="space-y-3 rounded-md border border-border bg-background p-3">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Generation Prompt</label>
        <Input
          placeholder="Describe the background image..."
          value={value.prompt || ""}
          onChange={(e) => onChange({ prompt: e.target.value })}
          className="h-8 text-xs"
        />
        <Button
          size="sm"
          className="w-full text-xs"
          onClick={handleGenerate}
          disabled={generateLoading || !value.prompt?.trim()}
        >
          {generateLoading ? (
            <>
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              Generating Background...
            </>
          ) : (
            <>
              <Wand2 className="mr-1 h-3.5 w-3.5" />
              Generate Background
            </>
          )}
        </Button>
      </div>

      {generateError && <p className="text-[10px] text-destructive">{generateError}</p>}

      {value.src && (
        <div className="relative overflow-hidden rounded-md border border-border">
          { }
          <img src={value.src} alt="Generated background" className="h-24 w-full object-cover" />
        </div>
      )}
    </div>
  );
}
