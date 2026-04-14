"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Webhook, Settings, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export default function ChatwootConfigPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [channelName, setChannelName] = useState("HypeSocial Support");
  
  const webhookUrl = "https://hypesocial-post.vercel.app/api/chatwoot/webhook";

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Chatwoot API Channel Configuration
        </h1>
        <p className="text-muted-foreground mt-1">
          Connect your Chatwoot instance to enable live chat with your support team
        </p>
      </div>

      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          Follow the steps below to set up the API Channel in your Chatwoot dashboard.
        </AlertDescription>
      </Alert>

      {/* Step 1: Webhook URL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              1
            </span>
            Configure Webhook URL
          </CardTitle>
          <CardDescription>
            Copy this webhook URL and paste it in your Chatwoot API Channel settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={webhookUrl}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopy(webhookUrl, "webhook")}
            >
              {copied === "webhook" ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">In Chatwoot:</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Go to Settings → Inboxes → Add Inbox</li>
              <li>Select &quot;API Channel&quot;</li>
              <li>Enter Channel Name (e.g., &quot;HypeSocial Support&quot;)</li>
              <li>Paste the Webhook URL above</li>
              <li>Click &quot;Create API Channel&quot;</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              2
            </span>
            Environment Variables
          </CardTitle>
          <CardDescription>
            Add these environment variables to your Vercel project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[
              { key: "CHATWOOT_URL", value: "https://app.chatwoot.com", desc: "Your Chatwoot instance URL" },
              { key: "CHATWOOT_API_TOKEN", value: "your_api_token_here", desc: "API Access Token from Chatwoot Profile Settings" },
              { key: "CHATWOOT_ACCOUNT_ID", value: "123", desc: "Your Chatwoot Account ID (from URL)" },
              { key: "CHATWOOT_INBOX_ID", value: "456", desc: "The Inbox ID after creating API Channel" },
            ].map((env) => (
              <div key={env.key} className="space-y-1">
                <Label className="text-xs text-muted-foreground">{env.desc}</Label>
                <div className="flex gap-2">
                  <code className="flex-1 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded text-sm font-mono">
                    {env.key}={env.value}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(`${env.key}=${env.value}`, env.key)}
                  >
                    {copied === env.key ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Important:</strong> After adding environment variables, redeploy your application.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              3
            </span>
            Test Connection
          </CardTitle>
          <CardDescription>
            Verify your webhook endpoint is working
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.open("/api/chatwoot/webhook", "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Test Webhook Endpoint
          </Button>

          <Button 
            variant="default" 
            className="w-full"
            onClick={() => window.open("/chat", "_blank")}
          >
            Open Chat Interface
          </Button>
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <a
            href="https://www.chatwoot.com/docs/product/channels/api/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Chatwoot API Channel Documentation
          </a>
          <a
            href="https://www.chatwoot.com/developers/api/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Chatwoot API Reference
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
