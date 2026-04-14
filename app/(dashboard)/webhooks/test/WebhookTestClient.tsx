"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import {
  useWebhooks,
  useCreateWebhook,
  useDeleteWebhook,
} from "@/lib/hooks";

interface WebhookTestClientProps {
  webhookUrl: string;
}

// Event types for testing
const TEST_EVENT_TYPES = [
  "social.post.created",
  "social.post.updated",
] as const;

export function WebhookTestClient({ webhookUrl }: WebhookTestClientProps) {
  const [testResults, setTestResults] = useState<
    { step: string; status: "pending" | "success" | "error"; message?: string }[]
  >([]);
  const [isRunning, setIsRunning] = useState(false);

  const { data: webhooksData, refetch: refetchWebhooks } = useWebhooks();
  const createWebhook = useCreateWebhook();
  const deleteWebhook = useDeleteWebhook();

  const addResult = (step: string, status: "pending" | "success" | "error", message?: string) => {
    setTestResults((prev) => [...prev, { step, status, message }]);
  };

  const runTests = async () => {
    setTestResults([]);
    setIsRunning(true);
    let createdWebhookId: string | null;

    try {
      // Test 1: List webhooks
      addResult("1. List webhooks", "pending");
      await refetchWebhooks();
      const webhookCount = webhooksData?.length ?? 0;
      addResult("1. List webhooks", "success", `Found ${webhookCount} webhooks`);

      // Test 2: Create webhook
      addResult("2. Create webhook", "pending");
      const newWebhook = await createWebhook.mutateAsync({
        url: webhookUrl,
        event_types: [...TEST_EVENT_TYPES],
      });
      createdWebhookId = newWebhook.id;
      addResult(
        "2. Create webhook",
        "success",
        `Created: ${newWebhook.id} with ${newWebhook.event_types?.length} events`
      );

      // Test 3: Refetch to verify creation
      addResult("3. Verify creation", "pending");
      const { data: updatedData } = await refetchWebhooks();
      const found = updatedData?.some((w) => w.id === newWebhook.id);
      if (found) {
        addResult("3. Verify creation", "success", "Webhook found in list");
      } else {
        addResult("3. Verify creation", "error", "Webhook not found in list");
      }

      // Cleanup
      if (createdWebhookId) {
        addResult("4. Cleanup (delete)", "pending");
        await deleteWebhook.mutateAsync(createdWebhookId);
        addResult("4. Cleanup (delete)", "success", "Test webhook deleted");
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addResult("Test failed", "error", message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Webhook Test</h1>
          <p className="text-slate-500 mt-1">
            Test webhook CRUD operations
          </p>
          <p className="text-xs text-slate-400 mt-1 font-mono truncate max-w-md">
            URL: {webhookUrl}
          </p>
        </div>
        <Button
          onClick={runTests}
          disabled={isRunning}
          className="gap-2"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Run Tests
            </>
          )}
        </Button>
      </div>

      {/* Current webhooks */}
      <Card className="p-4">
        <h2 className="font-semibold mb-3">Current Webhooks</h2>
        {webhooksData?.length === 0 ? (
          <p className="text-slate-400 text-sm">No webhooks registered</p>
        ) : (
          <div className="space-y-2">
            {webhooksData?.map((webhook) => (
              <div
                key={webhook.id}
                className="flex items-center justify-between p-2 bg-slate-50 rounded"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{webhook.url}</p>
                  <p className="text-xs text-slate-400">{webhook.id}</p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {webhook.event_types?.length} events
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Test results */}
      {testResults.length > 0 && (
        <Card className="p-4">
          <h2 className="font-semibold mb-3">Test Results</h2>
          <div className="space-y-2">
            {testResults.map((result, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-2 rounded bg-slate-50"
              >
                {result.status === "pending" && (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin shrink-0 mt-0.5" />
                )}
                {result.status === "success" && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                )}
                {result.status === "error" && (
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-medium">{result.step}</p>
                  {result.message && (
                    <p className="text-xs text-slate-500 mt-0.5">{result.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
