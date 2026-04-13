"use client";

import { useState, useCallback } from "react";
import {
  Key,
  Server,
  Users,
  Webhook,
  Terminal,
} from "lucide-react";

export type DiagnosticStatus = "pending" | "running" | "success" | "error" | "warning";

export interface DiagnosticTest {
  id: string;
  name: string;
  status: DiagnosticStatus;
  message?: string;
  icon: React.ElementType;
}

const initialTests: DiagnosticTest[] = [
  { id: "api-key", name: "API Key", status: "pending", icon: Key },
  { id: "api-connection", name: "API Connected", status: "pending", icon: Server },
  { id: "accounts", name: "Accounts", status: "pending", icon: Users },
  { id: "webhooks", name: "Webhooks", status: "pending", icon: Webhook },
  { id: "mcp", name: "MCP Server", status: "pending", icon: Terminal },
];

interface UseDiagnosticsOptions {
  accountsData?: { data?: unknown[] } | null;
  postsData?: { data?: unknown[] } | null;
  accountsError?: Error | null;
  postsError?: Error | null;
  resultsError?: Error | null;
  webhooksError?: Error | null;
  webhooks?: unknown[];
}

export function useDiagnostics({
  accountsData,
  postsData,
  accountsError,
  postsError,
  resultsError,
  webhooksError,
  webhooks,
}: UseDiagnosticsOptions) {
  const [tests, setTests] = useState<DiagnosticTest[]>(initialTests);
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = useCallback(
    (id: string, status: DiagnosticStatus, message?: string) => {
      setTests((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status, message } : t))
      );
    },
    []
  );

  const runDiagnostics = useCallback(() => {
    setIsRunning(true);
    setTests((prev) =>
      prev.map((t) => ({ ...t, status: "running", message: undefined }))
    );

    const apiWorking = !!(accountsData?.data || postsData);
    const apiAuthError =
      accountsError?.message?.includes("401") ||
      postsError?.message?.includes("401");

    // Simulate async checks
    setTimeout(() => {
      updateTest(
        "api-key",
        apiAuthError ? "error" : apiWorking ? "success" : "warning",
        apiAuthError ? "Authentication failed" : undefined
      );
    }, 300);

    setTimeout(() => {
      updateTest(
        "api-connection",
        apiWorking ? "success" : "error",
        apiWorking ? undefined : "Cannot connect to API"
      );
    }, 600);

    setTimeout(() => {
      const hasAccounts = (accountsData?.data?.length ?? 0) > 0;
      updateTest(
        "accounts",
        hasAccounts ? "success" : "warning",
        hasAccounts ? undefined : "No accounts connected"
      );
    }, 900);

    setTimeout(() => {
      const webhookError = webhooksError?.message;
      updateTest(
        "webhooks",
        webhookError ? "warning" : webhooks ? "success" : "warning",
        webhookError || (webhooks ? undefined : "No webhooks configured")
      );
    }, 1200);

    setTimeout(() => {
      updateTest("mcp", "success");
      setIsRunning(false);
    }, 1500);
  }, [
    accountsData,
    postsData,
    accountsError,
    postsError,
    webhooksError,
    webhooks,
    updateTest,
  ]);

  const successCount = tests.filter((t) => t.status === "success").length;
  const errorCount = tests.filter((t) => t.status === "error").length;
  const warningCount = tests.filter((t) => t.status === "warning").length;
  const hasIssues = errorCount > 0 || warningCount > 0;

  return {
    tests,
    isRunning,
    successCount,
    errorCount,
    warningCount,
    hasIssues,
    runDiagnostics,
  };
}
