"use client";

import { useEffect } from "react";

interface ChatwootWidgetProps {
  websiteToken: string;
  baseUrl?: string;
}

/**
 * Chatwoot Live Chat Widget
 * 
 * Usage:
 * 1. Get your website token from Chatwoot: Settings → Inboxes → Website → Configuration
 * 2. Add to environment: NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=your_token
 * 3. Add component to your layout
 */
export function ChatwootWidget({ 
  websiteToken, 
  baseUrl = "https://app.chatwoot.com" 
}: ChatwootWidgetProps) {
  useEffect(() => {
    if (!websiteToken) return;

    // Chatwoot Widget Script
    const script = document.createElement("script");
    script.innerHTML = `
      (function(d,t) {
        var BASE_URL="${baseUrl}";
        var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
        g.src=BASE_URL+"/packs/js/sdk.js";
        g.defer=true;
        g.async=true;
        s.parentNode.insertBefore(g,s);
        g.onload=function(){
          window.chatwootSDK.run({
            websiteToken: "${websiteToken}",
            baseUrl: BASE_URL
          })
        }
      })(document,"script");
    `;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [websiteToken, baseUrl]);

  return null;
}

/**
 * Set user info for Chatwoot
 */
export function setChatwootUser(user: {
  email?: string;
  name?: string;
  avatar_url?: string;
  phone_number?: string;
  identifier?: string;
}) {
  if (typeof window !== "undefined" && window.chatwootSDK) {
    window.chatwootSDK.setUser(user.identifier || user.email || "anonymous", {
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      phone_number: user.phone_number,
    });
  }
}

// Type declarations
declare global {
  interface Window {
    chatwootSDK?: {
      run: (config: { websiteToken: string; baseUrl: string }) => void;
      setUser: (identifier: string, attrs: Record<string, string | undefined>) => void;
      toggle: () => void;
    };
  }
}
