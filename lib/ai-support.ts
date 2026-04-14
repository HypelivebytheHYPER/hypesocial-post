/**
 * AI Support Agent using Vercel AI SDK
 * Provides instant AI responses before human agent takes over
 */

import { openai } from "@ai-sdk/openai";
import { streamText, generateText } from "ai";

// Knowledge base for common questions
const SUPPORT_KNOWLEDGE = `
You are HypeSocial's AI support assistant. Help users with:

1. CREATING POSTS
- Click "New Post" button
- Select social media accounts
- Write your content
- Add media (images/videos)
- Schedule or post immediately

2. CONNECTING ACCOUNTS
- Go to Accounts page
- Click "Connect Account"
- Choose platform (Instagram, Facebook, etc.)
- Authorize the connection

3. SCHEDULING
- In post composer, enable "Schedule"
- Pick date and time
- View scheduled posts in calendar

4. ANALYTICS
- Feed page shows post performance
- Analytics page for detailed stats
- Track likes, comments, shares, views

5. PRICING
- Free plan: 3 accounts, 50 posts/month
- Pro plan: Unlimited accounts, unlimited posts

If you can't help, say: "I'll connect you with a human agent who can assist further."
`;

export interface AIResponse {
  content: string;
  needsHuman: boolean;
}

/**
 * Get AI support response
 */
export async function getAIResponse(userMessage: string): Promise<AIResponse> {
  try {
    // Check if message needs human (complex issues)
    const complexKeywords = [
      "refund", "billing", "cancel subscription", "delete account",
      "bug", "error", "not working", "failed", "issue"
    ];
    
    const needsHuman = complexKeywords.some(kw => 
      userMessage.toLowerCase().includes(kw)
    );

    if (needsHuman) {
      return {
        content: "I'll connect you with a support agent who can help with this. One moment please...",
        needsHuman: true,
      };
    }

    // Generate AI response
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: SUPPORT_KNOWLEDGE,
      prompt: userMessage,
    });

    return {
      content: text,
      needsHuman: false,
    };
  } catch (error) {
    console.error("[AI Support] Error:", error);
    return {
      content: "I'm having trouble right now. Let me connect you with a human agent.",
      needsHuman: true,
    };
  }
}

/**
 * Stream AI response for real-time chat feel
 */
export async function streamAIResponse(userMessage: string) {
  return streamText({
    model: openai("gpt-4o-mini"),
    system: SUPPORT_KNOWLEDGE,
    prompt: userMessage,
  });
}

/**
 * Simple rule-based fallback (no API costs)
 */
export function getFallbackResponse(message: string): AIResponse {
  const lower = message.toLowerCase();

  if (lower.includes("post") || lower.includes("create")) {
    return {
      content: "To create a post:\n1. Click 'New Post'\n2. Select your accounts\n3. Write content & add media\n4. Schedule or post now!",
      needsHuman: false,
    };
  }

  if (lower.includes("account") || lower.includes("connect")) {
    return {
      content: "To connect accounts:\n1. Go to Accounts page\n2. Click 'Connect Account'\n3. Choose your platform\n4. Authorize the connection",
      needsHuman: false,
    };
  }

  if (lower.includes("schedule")) {
    return {
      content: "To schedule posts:\n1. In the composer, toggle 'Schedule'\n2. Pick your date & time\n3. We'll post it automatically!",
      needsHuman: false,
    };
  }

  if (lower.includes("price") || lower.includes("cost") || lower.includes("plan")) {
    return {
      content: "Our plans:\n• Free: 3 accounts, 50 posts/month\n• Pro: Unlimited everything\n\nNeed details? I can connect you with sales.",
      needsHuman: true,
    };
  }

  return {
    content: "I can help with posts, accounts, scheduling, and analytics. What would you like to know?",
    needsHuman: false,
  };
}
