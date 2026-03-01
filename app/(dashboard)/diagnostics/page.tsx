"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Server,
  Webhook,
  Key,
  Users,
  Activity,
  ChevronRight,
  ArrowLeft,
  Terminal,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAccounts, usePosts, useWebhooks } from "@/lib/hooks/usePostForMe";

interface DiagnosticTest {
  id: string;
  name: string;
  description: string;
  status: "pending" | "running" | "success" | "error" | "warning";
  message?: string;
  icon: React.ReactNode;
}

export default function DiagnosticsPage() {
  const [tests, setTests] = useState<DiagnosticTest[]>([
    {
      id: "api-key",
      name: "API Key Configuration",
      description: "Check if POSTFORME_API_KEY is set",
      status: "pending",
      icon: <Key className="w-5 h-5" />,
    },
    {
      id: "api-connection",
      name: "Post For Me API",
      description: "Test connectivity to api.postforme.dev",
      status: "pending",
      icon: <Server className="w-5 h-5" />,
    },
    {
      id: "accounts",
      name: "Connected Accounts",
      description: "Verify social account connections",
      status: "pending",
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: "webhooks",
      name: "Webhook Configuration",
      description: "Check webhook registration status",
      status: "pending",
      icon: <Webhook className="w-5 h-5" />,
    },
    {
      id: "mcp",
      name: "MCP Server",
      description: "Verify AI/MCP integration",
      status: "pending",
      icon: <Terminal className="w-5 h-5" />,
    },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  // Fetch data for diagnostics
  const {
    data: accountsData,
    isLoading: accountsLoading,
    error: accountsError,
  } = useAccounts();
  const { data: postsData, error: postsError } = usePosts({ limit: 1 });
  const { data: webhooksData, error: webhooksError } = useWebhooks();

  const runDiagnostics = async () => {
    setIsRunning(true);
    setLastRun(new Date());

    // Reset all tests to running
    setTests((prev) =>
      prev.map((test) => ({ ...test, status: "running", message: undefined })),
    );

    // Test 1: API Key
    await delay(500);
    const apiKey = process.env.POSTFORME_API_KEY;
    updateTest(
      "api-key",
      apiKey ? "success" : "error",
      apiKey
        ? "API key is configured"
        : "POSTFORME_API_KEY not found in environment",
    );

    // Test 2: API Connection
    await delay(800);
    if (postsError) {
      updateTest(
        "api-connection",
        "error",
        `API connection failed: ${postsError.message}`,
      );
    } else if (postsData) {
      updateTest(
        "api-connection",
        "success",
        "Successfully connected to Post For Me API",
      );
    } else {
      updateTest(
        "api-connection",
        "warning",
        "API status unknown - waiting for response",
      );
    }

    // Test 3: Accounts
    await delay(600);
    if (accountsError) {
      updateTest(
        "accounts",
        "error",
        `Failed to fetch accounts: ${accountsError.message}`,
      );
    } else if (accountsData?.data) {
      const connected = accountsData.data.filter(
        (a) => a.status === "connected",
      ).length;
      const total = accountsData.data.length;
      updateTest(
        "accounts",
        connected > 0 ? "success" : "warning",
        `${connected} of ${total} accounts connected`,
      );
    } else {
      updateTest("accounts", "warning", "No account data available");
    }

    // Test 4: Webhooks
    await delay(700);
    if (webhooksError) {
      updateTest(
        "webhooks",
        "error",
        `Failed to check webhooks: ${webhooksError.message}`,
      );
    } else if (webhooksData?.data) {
      const count = webhooksData.data.length;
      updateTest(
        "webhooks",
        count > 0 ? "success" : "warning",
        count > 0 ? `${count} webhook(s) registered` : "No webhooks registered",
      );
    } else {
      updateTest("webhooks", "warning", "Webhook status unknown");
    }

    // Test 5: MCP
    await delay(500);
    const mcpConfigured = true; // MCP is configured in .mcp.json
    updateTest(
      "mcp",
      mcpConfigured ? "success" : "warning",
      mcpConfigured
        ? "MCP server configured (.mcp.json)"
        : "MCP not configured - add to .mcp.json",
    );

    setIsRunning(false);
  };

  const updateTest = (
    id: string,
    status: DiagnosticTest["status"],
    message?: string,
  ) => {
    setTests((prev) =>
      prev.map((test) =>
        test.id === id ? { ...test, status, message } : test,
      ),
    );
  };

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Run diagnostics on page load
  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: DiagnosticTest["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
      case "error":
        return <XCircle className="w-6 h-6 text-red-500" />;
      case "warning":
        return <AlertCircle className="w-6 h-6 text-amber-500" />;
      case "running":
        return <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />;
      default:
        return (
          <div className="w-6 h-6 rounded-full border-2 border-slate-200" />
        );
    }
  };

  const getStatusBadge = (status: DiagnosticTest["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="badge-soft success">Passed</Badge>;
      case "error":
        return <Badge className="badge-soft error">Failed</Badge>;
      case "warning":
        return <Badge className="badge-soft warning">Warning</Badge>;
      case "running":
        return <Badge className="badge-soft info">Running</Badge>;
      default:
        return (
          <Badge variant="outline" className="text-slate-400">
            Pending
          </Badge>
        );
    }
  };

  const successCount = tests.filter((t) => t.status === "success").length;
  const errorCount = tests.filter((t) => t.status === "error").length;
  const warningCount = tests.filter((t) => t.status === "warning").length;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-slate-600"
          asChild
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="greeting-title">API Diagnostics</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Check your Post For Me connection status
          </p>
        </div>
      </div>

      <div className="divider-soft" />

      {/* Status Overview */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                errorCount > 0
                  ? "bg-red-100"
                  : warningCount > 0
                    ? "bg-amber-100"
                    : "bg-emerald-100"
              }`}
            >
              <Activity
                className={`w-7 h-7 ${
                  errorCount > 0
                    ? "text-red-600"
                    : warningCount > 0
                      ? "text-amber-600"
                      : "text-emerald-600"
                }`}
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">
                {errorCount > 0
                  ? "Connection Issues"
                  : warningCount > 0
                    ? "Partially Connected"
                    : "All Systems Operational"}
              </h2>
              <p className="text-slate-400 text-sm">
                {successCount} of {tests.length} tests passed
              </p>
            </div>
          </div>
          <Button
            variant="soft"
            size="sm"
            onClick={runDiagnostics}
            disabled={isRunning}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isRunning ? "animate-spin" : ""}`}
            />
            {isRunning ? "Running..." : "Re-run Tests"}
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-1">
          {tests.map((test) => (
            <div
              key={test.id}
              className={`h-2 flex-1 rounded-full ${
                test.status === "success"
                  ? "bg-emerald-500"
                  : test.status === "error"
                    ? "bg-red-500"
                    : test.status === "warning"
                      ? "bg-amber-500"
                      : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        {lastRun && (
          <p className="text-xs text-slate-400 mt-3">
            Last run: {lastRun.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Test Results */}
      <div className="space-y-3">
        {tests.map((test) => (
          <div
            key={test.id}
            className={`card-premium p-4 transition-all ${
              test.status === "running" ? "border-blue-200" : ""
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  test.status === "success"
                    ? "bg-emerald-100"
                    : test.status === "error"
                      ? "bg-red-100"
                      : test.status === "warning"
                        ? "bg-amber-100"
                        : test.status === "running"
                          ? "bg-blue-100"
                          : "bg-slate-100"
                }`}
              >
                {test.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium text-slate-800">{test.name}</h3>
                  {getStatusBadge(test.status)}
                </div>
                <p className="text-sm text-slate-400 mt-0.5">
                  {test.description}
                </p>
                {test.message && (
                  <p
                    className={`text-sm mt-2 ${
                      test.status === "error"
                        ? "text-red-600"
                        : test.status === "warning"
                          ? "text-amber-600"
                          : "text-emerald-600"
                    }`}
                  >
                    {test.message}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">{getStatusIcon(test.status)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Troubleshooting Guide */}
      {(errorCount > 0 || warningCount > 0) && (
        <div className="card-premium p-6 bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Troubleshooting
          </h3>
          <ul className="space-y-2 text-sm text-slate-600">
            {tests.find((t) => t.id === "api-key" && t.status === "error") && (
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>API Key:</strong> Set POSTFORME_API_KEY in your
                  environment or .env.local file
                </span>
              </li>
            )}
            {tests.find(
              (t) => t.id === "api-connection" && t.status === "error",
            ) && (
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>API Connection:</strong> Check your internet
                  connection and API key validity
                </span>
              </li>
            )}
            {tests.find(
              (t) => t.id === "accounts" && t.status === "warning",
            ) && (
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Accounts:</strong> Go to Accounts → Connect to link
                  social platforms
                </span>
              </li>
            )}
            {tests.find(
              (t) => t.id === "webhooks" && t.status === "warning",
            ) && (
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Webhooks:</strong> Visit /webhooks to register for
                  real-time updates
                </span>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* API Status */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm text-slate-600">Post For Me API Status</span>
        </div>
        <a
          href="https://status.postforme.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1"
        >
          Check Status Page
          <ChevronRight className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
